import json, urllib.request

base = 'http://localhost'

def request(path, method='GET', token=None, data=None):
    url = base + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print('ERROR', path, e.code, e.read().decode('utf-8'))
        raise

login = request('/api/auth/login', method='POST', data={'email':'superadmin@ccs.umsa.bo','password':'Admin2026!'})
print('LOGIN', login)
token = login['data']['token']
endpoints = [
    '/api/noticias', '/api/eventos', '/api/convocatorias', '/api/convenios',
    '/api/docentes', '/api/mejores-alumnos', '/api/egresados', '/api/multimedia',
    '/api/galeria/albumes', '/api/whatsapp', '/api/materias', '/api/tramites',
    '/api/institucional/mision', '/api/transparencia', '/api/usuarios',
    '/api/categorias', '/api/streaming'
]
for path in endpoints:
    try:
        res = request(path, method='GET', token=token)
        print(f'GET {path} OK success={res.get("success")}')
    except Exception:
        pass

print('DONE')
