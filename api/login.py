"""POST /api/login  {username, password} -> {token, user, must_change}"""
import datetime as _dt
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402


def _login(body):
    username = str(body.get('username') or '').strip()
    password = str(body.get('password') or '')
    if not username or not password:
        raise core.ApiError(400, 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!')
    code = core.find_staff_by_login(username)
    if not code:
        raise core.ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác!')
    row = core.get_auth_row(code)
    now = _dt.datetime.now(_dt.timezone.utc)
    if row and row.get('locked_until'):
        try:
            until = _dt.datetime.fromisoformat(row['locked_until'].replace('Z', '+00:00'))
            if until > now:
                mins = max(1, int((until - now).total_seconds() // 60) + 1)
                raise core.ApiError(429, 'Đăng nhập sai quá nhiều lần. Thử lại sau %d phút.' % mins)
        except ValueError:
            pass
    if row and row.get('password_hash'):
        ok = core.verify_password(password, row['password_hash'])
        must_change = bool(row.get('must_change'))
        pw_version = row.get('pw_version') or 1
    else:
        # Tài khoản chưa có mật khẩu riêng => mật khẩu mặc định, bắt buộc đổi
        ok = password == core.DEFAULT_PASSWORD
        must_change = True
        pw_version = 1
        if ok:
            pw_version = core.set_password(code, core.DEFAULT_PASSWORD, must_change=True, bump=False)
    if not ok:
        fails = (row.get('failed_count') or 0) + 1 if row else 1
        patch = {'failed_count': fails}
        if fails >= core.MAX_LOGIN_FAILS:
            patch = {'failed_count': 0,
                     'locked_until': (now + _dt.timedelta(seconds=core.LOCK_SECONDS)).isoformat()}
        if row:
            core.rest('PATCH', 'staff_auth', {'code': 'eq.' + code}, patch, prefer='return=minimal')
        raise core.ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác!')
    if row and (row.get('failed_count') or row.get('locked_until')):
        core.rest('PATCH', 'staff_auth', {'code': 'eq.' + code},
                  {'failed_count': 0, 'locked_until': None}, prefer='return=minimal')
    user = core.get_record('staff', code) or {}
    user['code'] = code
    return 200, {
        'token': core.make_token(code, pw_version),
        'user': core.public_user(user),
        'must_change': must_change,
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        core.run(self, lambda: _login(core.read_json(self, 10000)))

    def log_message(self, *args):
        pass
