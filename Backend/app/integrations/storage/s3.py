import os
from typing import Dict, Any, Tuple
from app.integrations.storage.interface import StorageInterface
from app.core.config import settings

class S3Storage(StorageInterface):
    def __init__(self):
        self.bucket_name = settings.AWS_BUCKET_NAME
        self.region = settings.AWS_REGION
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                import boto3
                self._client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
            except Exception as e:
                raise RuntimeError(f"Could not initialize S3 client: {e}")
        return self._client

    def upload(self, file_content: bytes, original_filename: str, content_type: str) -> Dict[str, Any]:
        import uuid
        from pathlib import Path
        ext = Path(original_filename).suffix
        storage_key = f"uploads/{uuid.uuid4()}{ext}"

        self.client.put_object(
            Bucket=self.bucket_name,
            Key=storage_key,
            Body=file_content,
            ContentType=content_type,
            Metadata={"original_filename": original_filename}
        )

        return {
            "storage_key": storage_key,
            "original_filename": original_filename,
            "file_size": len(file_content),
            "content_type": content_type
        }

    def download(self, storage_key: str) -> Tuple[bytes, str, str]:
        obj = self.client.get_object(Bucket=self.bucket_name, Key=storage_key)
        content = obj["Body"].read()
        content_type = obj.get("ContentType", "application/octet-stream")
        metadata = obj.get("Metadata", {})
        original_filename = metadata.get("original_filename", storage_key.split("/")[-1])
        return content, original_filename, content_type

    def delete(self, storage_key: str) -> bool:
        self.client.delete_object(Bucket=self.bucket_name, Key=storage_key)
        return True

    def generate_url(self, storage_key: str) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": storage_key},
            ExpiresIn=3600
        )

    def exists(self, storage_key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=storage_key)
            return True
        except Exception:
            return False
