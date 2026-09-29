from app.core.config import settings
from app.integrations.storage.interface import StorageInterface
from app.integrations.storage.local import LocalStorage
from app.integrations.storage.s3 import S3Storage
from app.integrations.storage.supabase import SupabaseStorage

_storage_instance: StorageInterface = None

def get_storage_provider() -> StorageInterface:
    global _storage_instance
    if _storage_instance is None:
        provider = settings.STORAGE_PROVIDER.lower()
        if provider == "supabase":
            _storage_instance = SupabaseStorage()
        elif provider == "s3":
            _storage_instance = S3Storage()
        else:
            _storage_instance = LocalStorage()
    return _storage_instance
