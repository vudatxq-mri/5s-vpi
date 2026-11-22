"""
Máy chủ chạy thử trên máy (giống Vercel): phục vụ file tĩnh + /api/* bằng chính code trong thư mục api/.
Chạy:  python tools/dev_server.py  [cổng, mặc định 5173]
"""
import importlib.util
import os
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from envload import load_env  # noqa: E402

load_env(ROOT)
_modules = {}


def api_module(name):
    if name.startswith('_') or not name.replace('_', '').isalnum():
        return None
    path = os.path.join(ROOT, 'api', name + '.py')
    if not os.path.exists(path):
        return None
    if name not in _modules:
        spec = importlib.util.spec_from_file_location('api_' + name, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _modules[name] = mod
    return _modules[name]


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def _api(self, method):
        p = urllib.parse.urlparse(self.path).path
        if not p.startswith('/api/'):
            return False
        mod = api_module(p[5:].strip('/'))
        fn = getattr(getattr(mod, 'handler', None), 'do_' + method, None) if mod else None
        if not fn:
            self.send_error(404)
            return True
        fn(self)
        return True

    def do_GET(self):
        if not self._api('GET'):
            p = urllib.parse.urlparse(self.path).path
            if p.startswith('/.env') or p.startswith('/tools') or p.startswith('/original'):
                self.send_error(404)
                return
            super().do_GET()

    def do_POST(self):
        if not self._api('POST'):
            self.send_error(405)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    print('5S VPI dev server: http://127.0.0.1:%d' % port, flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), DevHandler).serve_forever()
