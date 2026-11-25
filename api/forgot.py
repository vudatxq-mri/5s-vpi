"""POST /api/forgot  {code, name, dept, phone} -> {ok}
Gửi yêu cầu cấp lại mật khẩu tới Admin khi CHƯA đăng nhập.
- Không tiết lộ mã nhân viên có tồn tại hay không (luôn trả cùng một thông báo).
- Mỗi mã nhân viên chỉ giữ 1 yêu cầu, gửi lại tối đa 1 lần / 10 phút (chống spam).
"""
import datetime as _dt
import os
import sys
import time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _core as core  # noqa: E402

COOLDOWN = 600
MSG = 'Đã gửi yêu cầu cấp lại mật khẩu tới Admin. Vui lòng chờ phản hồi hoặc gọi Hotline.'


def _forgot(h):
    body = core.read_json(h, 5000)
    code_in = str(body.get('code') or '').strip()[:30]
    name = core.clean_text(str(body.get('name') or '').strip())[:80]
    dept = core.clean_text(str(body.get('dept') or '').strip())[:80]
    phone = core.clean_text(str(body.get('phone') or '').strip())[:20]
    if not code_in or not name:
        raise core.ApiError(400, 'Vui lòng nhập Mã nhân viên và Họ tên!')
    code = core.find_staff_by_login(code_in)
    if not code:
        time.sleep(0.5)
        return 200, {'ok': True, 'message': MSG}
    key = 'FP-' + core.norm_code(code)
    old = core.get_record('admin_messages', key)
    now = int(time.time())
    if old and now - int(old.get('ts') or 0) < COOLDOWN:
        return 200, {'ok': True, 'message': MSG}
    staff = core.get_record('staff', core.norm_code(code)) or {}
    msg = {
        'id': key, 'ts': now,
        'date': (_dt.datetime.utcnow() + _dt.timedelta(hours=7)).strftime('%H:%M:%S %d/%m/%Y'),
        'sender_name': name, 'sender_code': core.norm_code(code),
        'dept_id': staff.get('department_id') or 0, 'dept_name': dept or 'Không rõ',
        'topic': 'Cấp lại mật khẩu', 'priority': 'urgent',
        'title': '[CẤP MẬT KHẨU] %s (%s)' % (name, core.norm_code(code)),
        'content': ('Yêu cầu cấp lại mật khẩu. Họ tên khai báo: %s; tên trong hồ sơ: %s; khoa: %s; SĐT: %s. '
                    'Hãy gọi xác minh rồi bấm nút "Cấp lại mật khẩu" ngay dưới tin nhắn này.')
                   % (name, core.clean_text(str(staff.get('name') or '?')), dept or '?', phone or 'chưa cung cấp'),
        'status': 'received', 'reply': '',
    }
    core.rest('POST', 'records', {'on_conflict': 'collection,key'}, [{
        'collection': 'admin_messages', 'key': key, 'data': msg, 'deleted': False,
        'rec_date': None, 'updated_by': 'FORGOT'}], prefer='resolution=merge-duplicates,return=minimal')
    return 200, {'ok': True, 'message': MSG}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        core.run(self, lambda: _forgot(self))

    def log_message(self, *args):
        pass
