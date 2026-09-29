import urllib.request
import json

def test_live_api():
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/auth/login', 
        data=json.dumps({'email': 'krkts1618@gmail.com', 'password': 'Password@123'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read())
        print('LOGIN SUCCESS:', data.get('success'), 'Has token:', bool(data.get('data', {}).get('access_token')))
        token = data['data']['access_token']

    req_me = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/users/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_me) as res_me:
        me_data = json.loads(res_me.read())
        print('ME SUCCESS:', me_data['data']['full_name'], '|', me_data['data']['email'])

    req_kn = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/knowledge',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_kn) as res_kn:
        kn_data = json.loads(res_kn.read())
        print('KNOWLEDGE LIST SUCCESS: Total =', kn_data['data']['total'])

    req_dash = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/dashboard/summary',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_dash) as res_dash:
        dash_data = json.loads(res_dash.read())
        print('DASHBOARD SUMMARY SUCCESS: Greeting =', dash_data['data']['greeting'])

if __name__ == '__main__':
    test_live_api()
