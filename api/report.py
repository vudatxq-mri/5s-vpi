"""
V29: GET /api/report?from=YYYY-MM-DD&to=YYYY-MM-DD
  -> {from, to, today, rows:[{r,d,w,s,u,b,bc,t,sa,ev,is,st}]}
Dữ liệu thống kê 5S theo khoảng ngày (khu vực thực hiện / chưa thực hiện, thi đua khoa phòng,
cá nhân vi phạm). Máy chủ tự lọc theo quyền xem của người gọi.
"""
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        def go():
            user = core.authenticate(self.headers)
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            date_from = (qs.get('from') or [''])[0]
            date_to = (qs.get('to') or [''])[0]
            return 200, core.report_rows(user, date_from, date_to)
        core.run(self, go)

    def log_message(self, *args):
        pass
