import urllib.request
import json
import uuid

def test_upload():
    # 1. Login to get token
    login_body = json.dumps({'email': 'krkts1618@gmail.com', 'password': 'Password@123'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        token = json.loads(res.read())['data']['access_token']
        print('Logged in successfully!')

    # 2. Test Multipart Upload
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    
    parts = []
    # Title
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Architectural Blueprint\r\n'.encode('utf-8'))
    # Description
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nSample architecture and design guidelines.\r\n'.encode('utf-8'))
    # Resource type
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="resource_type"\r\n\r\nPDF\r\n'.encode('utf-8'))
    # File content
    file_content = b"%PDF-1.4 Mock PDF Content for testing upload"
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="architecture-blueprint.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode('utf-8') + file_content + b'\r\n')
    # Ending boundary
    parts.append(f'--{boundary}--\r\n'.encode('utf-8'))
    
    body = b''.join(parts)
    
    upload_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/knowledge/upload',
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}'
        }
    )
    
    try:
        with urllib.request.urlopen(upload_req) as up_res:
            resp = json.loads(up_res.read())
            print('UPLOAD SUCCESS:', resp.get('success'))
            print('UPLOADED RESOURCE TITLE:', resp.get('data', {}).get('title'))
            print('STORAGE KEY:', resp.get('data', {}).get('storage_key'))
    except urllib.error.HTTPError as e:
        print('HTTP ERROR on Upload:', e.code, e.read().decode('utf-8'))

if __name__ == '__main__':
    test_upload()
