"""POST /api/upload  {dataUrl} -> {url}   (lưu ảnh 5S vào kho Supabase Storage)"""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        def go():
            core.authenticate(self.headers)
            body = core.read_json(self, 4_400_000)
            return 200, {'url': core.save_photo(body.get('dataUrl'))}
        core.run(self, go)

    def log_message(self, *args):
        pass
