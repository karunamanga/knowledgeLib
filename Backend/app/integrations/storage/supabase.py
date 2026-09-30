import io
import uuid
import json
import httpx
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from app.integrations.storage.interface import StorageInterface
from app.integrations.storage.local import LocalStorage
from app.core.config import settings

class SupabaseStorage(StorageInterface):
    """
    Storage adapter for Supabase Storage.
    Falls back to LocalStorage if Supabase credentials are not configured or request fails.
    """
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY or ""
        self.bucket = settings.SUPABASE_STORAGE_BUCKET or "portal-files"
        self._fallback_local = LocalStorage()

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.api_key)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "apikey": self.api_key,
        }

    def upload(self, file_content: bytes, original_filename: str, content_type: str, custom_key: Optional[str] = None) -> Dict[str, Any]:
        if custom_key:
            storage_key = custom_key.strip("/")
        else:
            ext = Path(original_filename).suffix
            unique_id = str(uuid.uuid4())
            storage_key = f"{unique_id}{ext}"

        if not self.is_configured:
            return self._fallback_local.upload(file_content, original_filename, content_type, custom_key=storage_key)

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_key}"
        headers = self._get_headers()
        headers["Content-Type"] = content_type or "application/octet-stream"

        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, content=file_content, headers=headers)
                if res.status_code in [200, 201]:
                    # Also write locally for instant cache/offline access
                    try:
                        self._fallback_local.upload(file_content, original_filename, content_type, custom_key=storage_key)
                    except Exception:
                        pass
                    return {
                        "storage_key": storage_key,
                        "original_filename": original_filename,
                        "file_size": len(file_content),
                        "content_type": content_type or "application/octet-stream"
                    }
        except Exception as e:
            print("Supabase upload exception:", e)

        # Fallback to local storage with identical storage_key
        return self._fallback_local.upload(file_content, original_filename, content_type, custom_key=storage_key)

    def download(self, storage_key: str) -> Tuple[bytes, str, str]:
        # Check local cache first for speed
        if self._fallback_local.exists(storage_key):
            try:
                return self._fallback_local.download(storage_key)
            except Exception:
                pass

        if not self.is_configured:
            return self._fallback_local.download(storage_key)

        # 1. Try public URL
        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_key}"
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.get(public_url)
                if res.status_code == 200:
                    content_type = res.headers.get("content-type", "application/octet-stream")
                    return res.content, Path(storage_key).name, content_type
        except Exception:
            pass

        # 2. Try authenticated URL
        auth_url = f"{self.supabase_url}/storage/v1/object/authenticated/{self.bucket}/{storage_key}"
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.get(auth_url, headers=self._get_headers())
                if res.status_code == 200:
                    content_type = res.headers.get("content-type", "application/octet-stream")
                    return res.content, Path(storage_key).name, content_type
        except Exception:
            pass

        return self._fallback_local.download(storage_key)

    def delete(self, storage_key: str) -> bool:
        try:
            self._fallback_local.delete(storage_key)
        except Exception:
            pass

        if not self.is_configured:
            return True

        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.request("DELETE", url, json={"prefixes": [storage_key]}, headers=headers)
                if res.status_code in [200, 204]:
                    return True
        except Exception:
            pass

        return True

    def generate_url(self, storage_key: str) -> str:
        return f"{settings.API_V1_STR}/knowledge/files/{storage_key}"

    def exists(self, storage_key: str) -> bool:
        if self._fallback_local.exists(storage_key):
            return True
        if not self.is_configured:
            return False
        try:
            url = f"{self.supabase_url}/storage/v1/object/info/public/{self.bucket}/{storage_key}"
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=self._get_headers())
                return res.status_code == 200
        except Exception:
            return False
