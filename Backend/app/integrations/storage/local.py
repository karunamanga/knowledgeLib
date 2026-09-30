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

    def upload(self, file_content: bytes, original_filename: str, content_type: str, custom_key: Optional[str] = None) -> Dict[str, Any]:
        if custom_key:
            storage_key = custom_key.strip("/")
        else:
            ext = Path(original_filename).suffix
            unique_id = str(uuid.uuid4())
            storage_key = f"{unique_id}{ext}"
        
        file_path = self.base_dir / storage_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)

        metadata = {
            "storage_key": storage_key,
            "original_filename": original_filename,
            "file_size": len(file_content),
            "content_type": content_type or "application/octet-stream"
        }

        # Save metadata
        safe_meta = storage_key.replace("/", "_").replace("\\", "_")
        meta_path = self.meta_dir / f"{safe_meta}.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f)

        return metadata

    def download(self, storage_key: str) -> Tuple[bytes, str, str]:
        file_path = self.base_dir / storage_key
        if not file_path.exists():
            file_path = self.base_dir / Path(storage_key).name

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {storage_key}")

        with open(file_path, "rb") as f:
            content = f.read()

        original_filename = Path(storage_key).name
        content_type = "application/octet-stream"

        safe_meta = storage_key.replace("/", "_").replace("\\", "_")
        meta_path = self.meta_dir / f"{safe_meta}.json"
        if not meta_path.exists():
            meta_path = self.meta_dir / f"{Path(storage_key).name}.json"

        if meta_path.exists():
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    original_filename = meta.get("original_filename", original_filename)
                    content_type = meta.get("content_type", content_type)
            except Exception:
                pass

        return content, original_filename, content_type

    def delete(self, storage_key: str) -> bool:
        file_path = self.base_dir / storage_key
        if not file_path.exists():
            file_path = self.base_dir / Path(storage_key).name

        safe_meta = storage_key.replace("/", "_").replace("\\", "_")
        meta_path = self.meta_dir / f"{safe_meta}.json"
        if not meta_path.exists():
            meta_path = self.meta_dir / f"{Path(storage_key).name}.json"

        deleted = False
        if file_path.exists():
            try:
                os.remove(file_path)
                deleted = True
            except Exception:
                pass
        if meta_path.exists():
            try:
                os.remove(meta_path)
            except Exception:
                pass
        return deleted

    def generate_url(self, storage_key: str) -> str:
        return f"{settings.API_V1_STR}/knowledge/files/{storage_key}"

    def exists(self, storage_key: str) -> bool:
        if (self.base_dir / storage_key).exists():
            return True
        return (self.base_dir / Path(storage_key).name).exists()
