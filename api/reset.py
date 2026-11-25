"""
V29: POST /api/reset  {confirm: "XOA DU LIEU 5S"}  -> {at, by, counts, photos_deleted, photos_partial, version}
Admin xóa toàn bộ dữ liệu 5S (phiếu, ảnh bàn giao, lịch khu vực, đánh giá khoa, ảnh trong kho) để triển khai mới.
Giữ nguyên nhân sự, tài khoản, khoa phòng, khu vực, cấu hình. Gọi lại được nếu ảnh chưa xóa hết (photos_partial).
"""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        def go():
            user = core.authenticate(self.headers)
            body = core.read_json(self)
            return 200, core.reset_5s_data(user, body.get('confirm'))
        core.run(self, go)

    def log_message(self, *args):
        pass
