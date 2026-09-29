import io
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Header, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.shared.enums import PermissionCode, ResourceType
from app.shared.pagination import PaginationParams, PaginatedResponse
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.knowledge.schemas import ResourceRead, ResourceCreate, ResourceUpdate
from app.modules.knowledge.service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Library"])

def _format_resource(res, service: KnowledgeService) -> ResourceRead:
    data = ResourceRead.model_validate(res)
    if res.storage_key:
        data.download_url = service.storage.generate_url(res.storage_key)
    return data

@router.get("", response_model=APIResponse[PaginatedResponse[ResourceRead]])
def list_resources(
    search: Optional[str] = Query(None, description="Search term across title, description, category, tags, author"),
    category_id: Optional[int] = Query(None, description="Category filter"),
    resource_type: Optional[ResourceType] = Query(None, description="Type filter"),
    tag: Optional[str] = Query(None, description="Tag slug filter"),
    author_id: Optional[int] = Query(None, description="Author ID filter"),
    sort_by: str = Query("created_at", description="Sort field: created_at, views, downloads, title, updated_at"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    params = PaginationParams(page=page, page_size=page_size)
    items, total = service.list_resources(
        search=search,
        category_id=category_id,
        resource_type=resource_type,
        tag=tag,
        author_id=author_id,
        sort_by=sort_by,
        sort_order=sort_order,
        offset=params.offset,
        limit=params.limit
    )
    formatted = [_format_resource(item, service) for item in items]
    paginated = PaginatedResponse.create(items=formatted, total=total, params=params)
    return APIResponse(data=paginated)

@router.get("/{resource_id}", response_model=APIResponse[ResourceRead])
def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    res = service.get_resource_by_id(resource_id, increment_views=True)
    return APIResponse(data=_format_resource(res, service))

@router.post("", response_model=APIResponse[ResourceRead])
def create_resource(
    payload: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    res = service.create_resource(payload, author=current_user)
    return APIResponse(message="Resource created successfully", data=_format_resource(res, service))

@router.post("/upload", response_model=APIResponse[ResourceRead])
async def upload_resource(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    resource_type: ResourceType = Form(ResourceType.DOCUMENT),
    category_id: Optional[int] = Form(None),
    external_url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string or comma-separated
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag_list = []
    if tags:
        try:
            parsed = json.loads(tags)
            if isinstance(parsed, list):
                tag_list = parsed
        except Exception:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    parsed_cat_id = None
    if category_id:
        try:
            parsed_cat_id = int(category_id)
        except (ValueError, TypeError):
            parsed_cat_id = None

    payload = ResourceCreate(
        title=title,
        description=description,
        resource_type=resource_type,
        category_id=parsed_cat_id,
        external_url=external_url,
        tags=tag_list
    )

    file_bytes = None
    filename = None
    content_type = None
    if file:
        file_bytes = await file.read()
        filename = file.filename
        content_type = file.content_type

    service = KnowledgeService(db)
    res = service.create_resource(
        payload=payload,
        author=current_user,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type
    )
    return APIResponse(message="Resource uploaded successfully", data=_format_resource(res, service))

@router.put("/{resource_id}", response_model=APIResponse[ResourceRead])
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    res = service.update_resource(resource_id, payload, actor=current_user)
    return APIResponse(message="Resource updated successfully", data=_format_resource(res, service))

@router.delete("/{resource_id}", response_model=APIResponse[bool])
def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    service.delete_resource(resource_id, actor=current_user)
    return APIResponse(message="Resource deleted successfully", data=True)

@router.get("/{resource_id}/download")
def download_resource(
    resource_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Optional auth extraction from query or header
    actor_id = None
    auth_token = token
    if not auth_token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            auth_token = parts[1]

    if auth_token:
        try:
            from app.core.security import decode_token
            payload = decode_token(auth_token)
            actor_id = payload.get("sub")
        except Exception:
            pass

    service = KnowledgeService(db)
    content, filename, content_type = service.get_download_file(resource_id)
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/files/{storage_key}")
def stream_file(
    storage_key: str,
    db: Session = Depends(get_db)
):
    service = KnowledgeService(db)
    content, filename, content_type = service.download_by_storage_key(storage_key)
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
