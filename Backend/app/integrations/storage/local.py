import os
import uuid
import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from app.integrations.storage.interface import StorageInterface
from app.core.config import settings

class LocalStorage(StorageInterface):
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_LOCAL_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.meta_dir = self.base_dir / ".metadata"
        self.meta_dir.mkdir(parents=True, exist_ok=True)

    def upload(self, file_content: bytes, original_filename: str, content_type: str) -> Dict[str, Any]:
        # Generate safe UUID storage key
        ext = Path(original_filename).suffix
        unique_id = str(uuid.uuid4())
        storage_key = f"{unique_id}{ext}"
        
        file_path = self.base_dir / storage_key
        with open(file_path, "wb") as f:
            f.write(file_content)

        metadata = {
            "storage_key": storage_key,
            "original_filename": original_filename,
            "file_size": len(file_content),
            "content_type": content_type or "application/octet-stream"
        }

        # Save metadata
        meta_path = self.meta_dir / f"{storage_key}.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f)

        return metadata

    def download(self, storage_key: str) -> Tuple[bytes, str, str]:
        # Validate safe key
        safe_name = Path(storage_key).name
        file_path = self.base_dir / safe_name
        meta_path = self.meta_dir / f"{safe_name}.json"

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {storage_key}")

        with open(file_path, "rb") as f:
            content = f.read()

        original_filename = safe_name
        content_type = "application/octet-stream"

        if meta_path.exists():
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    original_filename = meta.get("original_filename", safe_name)
                    content_type = meta.get("content_type", content_type)
            except Exception:
                pass

        return content, original_filename, content_type

    def delete(self, storage_key: str) -> bool:
        safe_name = Path(storage_key).name
        file_path = self.base_dir / safe_name
        meta_path = self.meta_dir / f"{safe_name}.json"

        deleted = False
        if file_path.exists():
            os.remove(file_path)
            deleted = True
        if meta_path.exists():
            os.remove(meta_path)
        return deleted

    def generate_url(self, storage_key: str) -> str:
        return f"{settings.API_V1_STR}/knowledge/files/{storage_key}"

    def exists(self, storage_key: str) -> bool:
        safe_name = Path(storage_key).name
        return (self.base_dir / safe_name).exists()
