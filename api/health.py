"""GET /api/health -> kiểm tra cấu hình & kết nối CSDL (không lộ bí mật)"""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        def go():
            staff = core.rest('GET', 'records', {'select': 'key', 'collection': 'eq.staff',
                                                 'deleted': 'eq.false', 'limit': '1000'}) or []
            auth = core.rest('GET', 'staff_auth', {'select': 'code', 'limit': '1000'}) or []
            return 200, {'ok': True, 'database': 'connected', 'staff_records': len(staff),
                         'staff_with_password': len(auth), 'version': core.current_version()}
        core.run(self, go)

    def log_message(self, *args):
        pass
