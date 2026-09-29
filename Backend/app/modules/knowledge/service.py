from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException
from app.modules.knowledge.models import Resource
from app.modules.knowledge.repository import KnowledgeRepository
from app.modules.knowledge.schemas import ResourceCreate, ResourceUpdate
from app.modules.categories.repository import CategoryRepository
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.integrations.storage.factory import get_storage_provider
from app.shared.enums import AuditAction, ResourceType, RoleName, PermissionCode

class KnowledgeService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = KnowledgeRepository(db)
        self.category_repo = CategoryRepository(db)
        self.audit_service = AuditService(db)
        self.storage = get_storage_provider()

    def list_resources(
        self,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        resource_type: Optional[ResourceType] = None,
        tag: Optional[str] = None,
        author_id: Optional[int] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[Resource], int]:
        return self.repository.list_resources(
            search=search,
            category_id=category_id,
            resource_type=resource_type,
            tag=tag,
            author_id=author_id,
            sort_by=sort_by,
            sort_order=sort_order,
            offset=offset,
            limit=limit
        )

    def get_resource_by_id(self, resource_id: int, increment_views: bool = False) -> Resource:
        res = self.repository.get_by_id(resource_id)
        if not res:
            raise EntityNotFoundException(f"Resource with ID {resource_id} not found")
        if increment_views:
            self.repository.increment_views(res)
        return res

    def create_resource(
        self,
        payload: ResourceCreate,
        author: User,
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> Resource:
        tags = []
        for tag_name in payload.tags:
            tag_obj = self.category_repo.get_or_create_tag(tag_name)
            tags.append(tag_obj)

        storage_key = None
        file_size = None
        orig_name = None
        mime = None

        if file_bytes and filename:
            upload_meta = self.storage.upload(file_bytes, filename, content_type or "application/octet-stream")
            storage_key = upload_meta["storage_key"]
            orig_name = upload_meta["original_filename"]
            file_size = upload_meta["file_size"]
            mime = upload_meta["content_type"]

        res = Resource(
            title=payload.title,
            description=payload.description,
            resource_type=payload.resource_type,
            category_id=payload.category_id,
            author_id=author.id,
            storage_key=storage_key,
            original_filename=orig_name,
            external_url=payload.external_url,
            file_size=file_size,
            content_type=mime,
            tags=tags
        )
        created = self.repository.create(res)

        self.audit_service.log_event(
            action=AuditAction.RESOURCE_CREATED,
            user_id=author.id,
            user_email=author.email,
            entity_type="RESOURCE",
            entity_id=str(created.id),
            details=f"Created resource '{created.title}' (Type: {created.resource_type})"
        )
        return created

    def update_resource(
        self,
        resource_id: int,
        payload: ResourceUpdate,
        actor: User
    ) -> Resource:
        res = self.get_resource_by_id(resource_id)
        
        # Check permissions: author or admin or permission 'knowledge:update'
        user_role_names = {r.name for r in actor.roles}
        is_admin = RoleName.ADMIN.value in user_role_names
        if res.author_id != actor.id and not is_admin:
            # Check user perms
            user_perms = {p.code for r in actor.roles for p in r.permissions}
            if PermissionCode.KNOWLEDGE_UPDATE.value not in user_perms:
                raise PermissionDeniedException("You can only edit your own resources")

        if payload.title is not None:
            res.title = payload.title
        if payload.description is not None:
            res.description = payload.description
        if payload.resource_type is not None:
            res.resource_type = payload.resource_type
        if payload.category_id is not None:
            res.category_id = payload.category_id
        if payload.external_url is not None:
            res.external_url = payload.external_url
        if payload.tags is not None:
            tags = [self.category_repo.get_or_create_tag(t) for t in payload.tags]
            res.tags = tags

        updated = self.repository.update(res)

        self.audit_service.log_event(
            action=AuditAction.RESOURCE_UPDATED,
            user_id=actor.id,
            user_email=actor.email,
            entity_type="RESOURCE",
            entity_id=str(updated.id),
            details=f"Updated resource '{updated.title}'"
        )
        return updated

    def delete_resource(self, resource_id: int, actor: User) -> bool:
        res = self.get_resource_by_id(resource_id)
        
        user_role_names = {r.name for r in actor.roles}
        is_admin = RoleName.ADMIN.value in user_role_names
        if res.author_id != actor.id and not is_admin:
            user_perms = {p.code for r in actor.roles for p in r.permissions}
            if PermissionCode.KNOWLEDGE_DELETE.value not in user_perms:
                raise PermissionDeniedException("You can only delete your own resources")

        # Delete physical file if exists
        if res.storage_key:
            try:
                self.storage.delete(res.storage_key)
            except Exception:
                pass

        self.repository.delete(res)

        self.audit_service.log_event(
            action=AuditAction.RESOURCE_DELETED,
            user_id=actor.id,
            user_email=actor.email,
            entity_type="RESOURCE",
            entity_id=str(resource_id),
            details=f"Deleted resource '{res.title}'"
        )
        return True

    def get_download_file(self, resource_id: int) -> Tuple[bytes, str, str]:
        res = self.get_resource_by_id(resource_id)
        if not res.storage_key:
            raise EntityNotFoundException("Resource does not have a physical file attachment")
        
        self.repository.increment_downloads(res)
        return self.storage.download(res.storage_key)

    def download_by_storage_key(self, storage_key: str) -> Tuple[bytes, str, str]:
        return self.storage.download(storage_key)
