# Storage Architecture Specification

The Knowledge module strictly decouples business operations from physical file storage via the `StorageInterface`.

```
Knowledge Service
       │
       ▼
StorageInterface (Abstract Base Class)
   ┌───┴───────────────────────────────┐
   ▼                                   ▼
LocalStorage (Development/On-Prem)   S3Storage (AWS / MinIO / S3-compatible)
```

## Security Guarantees
1. **No User Path Control**: Files are stored using cryptographic UUIDs generated on the server (`<uuid>.<extension>`). Users cannot traverse directories or overwrite system files.
2. **Safe Filename Preservation**: Original file names are stored in metadata and re-injected upon download using sanitized HTTP `Content-Disposition` headers.
3. **MIME Type Validation**: Content-Type is validated during upload and preserved during file streaming.
