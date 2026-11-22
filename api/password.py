"""POST /api/password  {current, new} -> {token}  (đổi mật khẩu của chính mình)"""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402

WEAK = {'123456', '123', '1234', '12345', '12345678', '000000', '111111', '123123', 'password'}


def _change(handler_self):
    user = core.authenticate(handler_self.headers)
    body = core.read_json(handler_self, 10000)
    current = str(body.get('current') or '')
    new = str(body.get('new') or '')
    code = core.norm_code(user['code'])
    row = core.get_auth_row(code)
    ok = core.verify_password(current, row['password_hash']) if row and row.get('password_hash') \
        else current == core.DEFAULT_PASSWORD
    if not ok:
        raise core.ApiError(400, 'Mật khẩu hiện tại không đúng!')
    if len(new) < 6:
        raise core.ApiError(400, 'Mật khẩu mới phải có ít nhất 6 ký tự!')
    if new in WEAK or new == current or new.upper() == code:
        raise core.ApiError(400, 'Mật khẩu mới quá dễ đoán hoặc trùng mật khẩu cũ!')
    ver = core.set_password(code, new, must_change=False, bump=True)
    return 200, {'token': core.make_token(code, ver)}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        core.run(self, lambda: _change(self))

    def log_message(self, *args):
        pass
