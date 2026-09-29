from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional

class StorageInterface(ABC):
    @abstractmethod
    def upload(self, file_content: bytes, original_filename: str, content_type: str) -> Dict[str, Any]:
        """
        Uploads a file to the storage provider and returns metadata:
        {
            "storage_key": "uuid...",
            "original_filename": "name.pdf",
            "file_size": 1234,
            "content_type": "application/pdf"
        }
        """
        pass

    @abstractmethod
    def download(self, storage_key: str) -> Tuple[bytes, str, str]:
        """
        Downloads a file by storage_key.
        Returns: (file_bytes, original_filename, content_type)
        """
        pass

    @abstractmethod
    def delete(self, storage_key: str) -> bool:
        """
        Deletes a file by storage_key.
        """
        pass

    @abstractmethod
    def generate_url(self, storage_key: str) -> str:
        """
        Returns a download/view URL or relative API stream URL.
        """
        pass

    @abstractmethod
    def exists(self, storage_key: str) -> bool:
        """
        Checks if file exists.
        """
        pass
