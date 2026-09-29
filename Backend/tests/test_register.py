import urllib.request
import json

def test_live_registration():
    data = {
        'email': 'krkts1618@gmail.com',
        'password': 'Password@123',
        'full_name': 'Ravi',
        'designation': 'Software Engineer',
        'department': 'Engineering',
        'employee_id': 'EMP-001'
    }

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/register',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read())
            print('REGISTRATION RESPONSE SUCCESS:', resp.get('success'))
            print('HAS ACCESS TOKEN:', bool(resp.get('data', {}).get('access_token')))
    except urllib.error.HTTPError as e:
        print('HTTP ERROR:', e.code, e.read().decode('utf-8'))
    except Exception as e:
        print('ERROR:', e)

if __name__ == '__main__':
    test_live_registration()
