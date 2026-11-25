"""
5S VPI - Lõi backend (Vercel Python Function, chỉ dùng thư viện chuẩn).

Biến môi trường bắt buộc:
  SUPABASE_URL         https://<project>.supabase.co
  SUPABASE_SECRET_KEY  sb_secret_...  (hoặc khóa service_role eyJ... kiểu cũ)
  APP_SECRET           chuỗi ngẫu nhiên dài để ký phiên đăng nhập
Tùy chọn:
  RETENTION_DAYS       số ngày dữ liệu phiếu / lịch được tải về app (mặc định 90)
"""
import base64
import datetime as _dt
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

# ---------------------------------------------------------------------------
# Cấu hình
# ---------------------------------------------------------------------------
TOKEN_TTL = 30 * 24 * 3600          # phiên đăng nhập 30 ngày
DEFAULT_PASSWORD = '123456'
PBKDF2_ITER = 120_000
MAX_LOGIN_FAILS = 5
LOCK_SECONDS = 5 * 60
MAX_OPS_PER_PUSH = 300
MAX_PHOTO_BYTES = 3 * 1024 * 1024
PAGE = 1000                          # Supabase trả tối đa 1000 dòng / lần
PHOTO_BUCKET = 'photos'

ADMIN_CODES = {'BV-345'}

ALLOWED_COLLECTIONS = {'departments', 'rooms', 'staff', 'audits', 'department_evaluations',
                       'admin_messages', 'rooms_schedule', 'singleton'}
SAFE_KEY = re.compile(r'^[A-Za-z0-9_.:|\-]{1,120}$')

# Chống chèn mã độc (XSS): app hiển thị bằng innerHTML & onclick="...('giá trị')",
# nên mọi chuỗi người dùng nhập được thay ký tự nguy hiểm bằng ký tự trông tương tự.
_XSS_MAP = str.maketrans({'<': '‹', '>': '›', '"': '”', "'": '’', '`': '’', '\\': '/'})
_ENTITY = re.compile(r'&(?=#|[A-Za-z]{2,8};)')


def clean_text(s):
    return _ENTITY.sub('＆', s.translate(_XSS_MAP))


def sanitize(v, depth=0):
    if depth > 12:
        return None
    if isinstance(v, str):
        if v.startswith('data:image/'):
            return v if re.match(r'^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$', v) else ''
        if v.lower().startswith('javascript:'):
            return ''
        return clean_text(v)
    if isinstance(v, list):
        return [sanitize(x, depth + 1) for x in v]
    if isinstance(v, dict):
        return {clean_text(str(k))[:80]: sanitize(x, depth + 1) for k, x in v.items()}
    return v

# Bản ghi theo ngày (lọc theo RETENTION_DAYS khi tải đầy đủ)
DATED_FIELDS = {
    'audits': 'audit_date',
    'rooms_schedule': 'date',
    'department_evaluations': 'date',
}
REVIEW_FIELDS_AUDIT = (
    'status', 'evaluation_result', 'evaluator_name', 'evaluator_code', 'evaluator_role',
    'evaluation_date', 'evaluation_time', 'evaluation_notes', 'issue_detected', 'remedy_deadline',
)
PROTECTED_STAFF_FIELDS = ('code', 'staff_code', 'role', 'role_level', 'is_admin', 'is_supervisor', 'can_review',
                          'area_scope',     # V29: khu vực được giao (chỉ Admin sửa)
                          'leader_group')   # V29d: Hội đồng quản trị / Ban giám đốc (chỉ Admin sửa)
BOARD_GROUPS = ('hdqt', 'bgd')
REVIEW_STATUSES = ('approved', 'rejected')


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def env(name, default=None):
    v = os.environ.get(name, default)
    return v.strip() if isinstance(v, str) else v


def config_ok():
    missing = [n for n in ('SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'APP_SECRET') if not env(n)]
    return missing


def config_invalid():
    """Phát hiện giá trị dán sai (ký tự che '•', dấu tiếng Việt, dấu nháy...)."""
    bad = []
    for n in ('SUPABASE_URL', 'SUPABASE_SECRET_KEY'):
        v = env(n) or ''
        if not v.isascii() or any(ch in v for ch in ' "\'<>'):
            bad.append(n + ' (có ký tự không hợp lệ - có thể đã sao chép khóa đang bị che "•••")')
    key = env('SUPABASE_SECRET_KEY') or ''
    if key.startswith('sb_publishable_'):
        bad.append('SUPABASE_SECRET_KEY (đang là Publishable key, cần Secret key sb_secret_...)')
    url = env('SUPABASE_URL') or ''
    if url and not url.startswith('https://'):
        bad.append('SUPABASE_URL (phải bắt đầu bằng https://)')
    return bad


# ---------------------------------------------------------------------------
# Supabase REST (PostgREST + Storage)
# ---------------------------------------------------------------------------
def _sb_headers(extra=None):
    key = env('SUPABASE_SECRET_KEY')
    h = {'apikey': key}
    if key and key.startswith('eyJ'):          # khóa service_role kiểu cũ (JWT)
        h['Authorization'] = 'Bearer ' + key
    if extra:
        h.update(extra)
    return h


def _request(method, url, body=None, headers=None, raw=False, timeout=20):
    data = None
    if body is not None:
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
            if raw:
                return payload
            if not payload:
                return None
            return json.loads(payload.decode('utf-8'))
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', 'replace')[:500]
        raise ApiError(502, 'Lỗi CSDL Supabase (%s): %s' % (e.code, detail))
    except urllib.error.URLError as e:
        raise ApiError(502, 'Không kết nối được Supabase: %s' % e.reason)


def rest(method, path, query=None, body=None, prefer=None):
    url = env('SUPABASE_URL').rstrip('/') + '/rest/v1/' + path
    if query:
        url += '?' + urllib.parse.urlencode(query, safe='(),.:*"|-_>', quote_via=urllib.parse.quote)
    headers = _sb_headers({'Content-Type': 'application/json'})
    if prefer:
        headers['Prefer'] = prefer
    return _request(method, url, body, headers)


def pg_in(values):
    """Tạo biểu thức in.(...) an toàn cho PostgREST."""
    out = []
    for v in values:
        s = str(v).replace('\\', '\\\\').replace('"', '\\"')
        out.append('"%s"' % s)
    return 'in.(' + ','.join(out) + ')'


def storage_upload(path, content, content_type):
    url = '%s/storage/v1/object/%s/%s' % (env('SUPABASE_URL').rstrip('/'), PHOTO_BUCKET, path)
    headers = _sb_headers({'Content-Type': content_type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000'})
    _request('POST', url, content, headers)
    return '%s/storage/v1/object/public/%s/%s' % (env('SUPABASE_URL').rstrip('/'), PHOTO_BUCKET, path)


# ---------------------------------------------------------------------------
# Mật khẩu & phiên đăng nhập
# ---------------------------------------------------------------------------
def hash_password(pw):
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', pw.encode('utf-8'), salt, PBKDF2_ITER)
    return 'pbkdf2$%d$%s$%s' % (PBKDF2_ITER, base64.b64encode(salt).decode(), base64.b64encode(dk).decode())


def verify_password(pw, stored):
    try:
        algo, it, salt, dk = stored.split('$')
        if algo != 'pbkdf2':
            return False
        calc = hashlib.pbkdf2_hmac('sha256', pw.encode('utf-8'), base64.b64decode(salt), int(it))
        return hmac.compare_digest(calc, base64.b64decode(dk))
    except Exception:
        return False


def _b64u(b):
    return base64.urlsafe_b64encode(b).decode().rstrip('=')


def _b64u_dec(s):
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))


def make_token(code, pw_version):
    payload = _b64u(json.dumps({'c': code, 'v': pw_version, 'exp': int(time.time()) + TOKEN_TTL}).encode())
    sig = _b64u(hmac.new(env('APP_SECRET').encode(), payload.encode(), hashlib.sha256).digest())
    return payload + '.' + sig


def read_token(token):
    try:
        payload, sig = token.split('.')
        good = _b64u(hmac.new(env('APP_SECRET').encode(), payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(good, sig):
            return None
        data = json.loads(_b64u_dec(payload))
        if data.get('exp', 0) < time.time():
            return None
        return data
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Truy vấn bản ghi
# ---------------------------------------------------------------------------
def get_record(collection, key):
    rows = rest('GET', 'records', {'select': 'key,data,deleted', 'collection': 'eq.' + collection, 'key': 'eq.' + key})
    if rows and not rows[0]['deleted']:
        return rows[0]['data']
    return None


def get_records(collection, keys):
    keys = list(dict.fromkeys(keys))
    out = {}
    for i in range(0, len(keys), 100):
        chunk = keys[i:i + 100]
        rows = rest('GET', 'records', {'select': 'key,data,deleted', 'collection': 'eq.' + collection, 'key': pg_in(chunk)})
        for r in rows or []:
            if not r['deleted']:
                out[r['key']] = r['data']
    return out


def get_auth_row(code):
    rows = rest('GET', 'staff_auth', {'select': '*', 'code': 'eq.' + code})
    return rows[0] if rows else None


def current_version():
    rows = rest('GET', 'records', {'select': 'version', 'order': 'version.desc', 'limit': '1'})
    return rows[0]['version'] if rows else 0


def norm_code(s):
    return str(s or '').strip().upper()


def find_staff_by_login(username):
    u = str(username or '').strip().lower()
    u_clean = u.replace('-', '')
    rows = []
    offset = 0
    while True:
        chunk = rest('GET', 'records', {
            'select': 'key,username:data->>username,deleted', 'collection': 'eq.staff',
            'deleted': 'eq.false', 'order': 'key', 'limit': str(PAGE), 'offset': str(offset)})
        rows.extend(chunk or [])
        if not chunk or len(chunk) < PAGE:
            break
        offset += PAGE
    for r in rows:
        code = (r['key'] or '').lower()
        user = (r.get('username') or '').lower()
        if u in (code, user) or u_clean in (code.replace('-', ''), user.replace('-', '')):
            return r['key']
    return None


# ---------------------------------------------------------------------------
# Người dùng & quyền (đồng bộ với logic V26 trong app.js)
# ---------------------------------------------------------------------------
def is_admin(u):
    return norm_code(u.get('code')) in ADMIN_CODES or u.get('role') == 'admin' or u.get('is_admin') is True


def can_review(u):
    return is_admin(u) or u.get('can_review') is True


def is_leader(u):
    return is_admin(u) or ((u.get('role') == 'supervisor' or u.get('is_supervisor') is True) and u.get('can_review') is True)


def is_manager(u):
    return is_leader(u) or u.get('role') in ('manager',) or u.get('role_level') == 'manager'


def same_dept(a, b):
    return a is not None and b is not None and str(a) == str(b)


def area_in_scope(u, room_id, rooms_cache=None):
    """V29: khu vực có nằm trong phạm vi được giao của người dùng không (giống getAreaScope ở app.js)."""
    if is_leader(u):
        return True
    sc = u.get('area_scope')
    if isinstance(sc, dict) and (sc.get('all') is True or isinstance(sc.get('rooms'), list)):
        if sc.get('all') is True:
            return True
        return str(room_id) in {str(x) for x in (sc.get('rooms') or [])}
    if u.get('can_review') is True:
        return True  # chưa giao riêng => toàn viện như trước V29
    if is_manager(u):
        return same_dept(_room_dept(room_id, rooms_cache if rooms_cache is not None else {}), u.get('department_id'))
    return False


def can_review_room(u, room_id, rooms_cache=None):
    return is_admin(u) or (can_review(u) and area_in_scope(u, room_id, rooms_cache))


def vn_today():
    return (_dt.datetime.utcnow() + _dt.timedelta(hours=7)).date().isoformat()


def is_storage_url(v):
    base = (env('SUPABASE_URL') or '').rstrip('/')
    return isinstance(v, str) and bool(base) and v.startswith(base + '/storage/v1/object/public/' + PHOTO_BUCKET + '/')


def authenticate(headers):
    """Trả về hồ sơ nhân sự của người gọi API, hoặc ném ApiError 401."""
    auth = headers.get('Authorization') or headers.get('authorization') or ''
    if not auth.startswith('Bearer '):
        raise ApiError(401, 'Chưa đăng nhập')
    data = read_token(auth[7:].strip())
    if not data:
        raise ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    code = data['c']
    user = get_record('staff', code)
    if not user:
        raise ApiError(401, 'Tài khoản không còn tồn tại')
    row = get_auth_row(code)
    pw_version = row['pw_version'] if row else 1
    if pw_version != data.get('v'):
        raise ApiError(401, 'Mật khẩu đã thay đổi, vui lòng đăng nhập lại')
    user = dict(user)
    user['code'] = code
    return user


def public_user(u):
    keep = ('code', 'name', 'title', 'role', 'role_level', 'role_title', 'department_id', 'can_review', 'is_admin')
    return {k: u.get(k) for k in keep}


# ---------------------------------------------------------------------------
# Áp dụng thay đổi từ điện thoại (kiểm tra quyền từng bản ghi)
# ---------------------------------------------------------------------------
def _rec_date(collection, data):
    field = DATED_FIELDS.get(collection)
    if not field or not isinstance(data, dict):
        return None
    v = str(data.get(field) or '')[:10]
    return v if re.match(r'^\d{4}-\d{2}-\d{2}$', v) else None


def _room_dept(room_id, rooms_cache):
    if room_id is None:
        return None
    k = str(room_id)
    if k not in rooms_cache:
        rooms_cache[k] = get_record('rooms', k)
    r = rooms_cache[k]
    return r.get('department_id') if r else None


def check_op(u, op, existing, rooms_cache, password_updates):
    """Trả về (ok, data_đã_lọc, lý_do). data=None nghĩa là xóa."""
    c, k, d = op['c'], op['k'], op.get('d')
    is_delete = d is None
    if not is_delete and not isinstance(d, dict) and c != 'singleton':
        return False, None, 'Dữ liệu không hợp lệ'

    if c == 'singleton':
        if k == 'data_reset':
            return False, None, 'Mốc xóa dữ liệu chỉ do máy chủ ghi'
        if k in ('hospital', 'criteria'):
            return (True, d, '') if is_leader(u) else (False, None, 'Chỉ Ban chỉ đạo được sửa cấu hình bệnh viện')
        if k in ('shift_config', 'schedules_meta'):
            return (True, d, '') if is_manager(u) else (False, None, 'Không có quyền sửa cấu hình ca')
        return (True, d, '') if is_leader(u) else (False, None, 'Không có quyền')

    if c == 'departments':
        if is_leader(u):
            return True, d, ''
        if is_manager(u) and not is_delete and same_dept(k, u.get('department_id')):
            return True, d, ''
        return False, None, 'Không có quyền sửa khoa/phòng'

    if c == 'rooms':
        if is_leader(u):
            return True, d, ''
        if is_manager(u):
            old_ok = existing is None or same_dept(existing.get('department_id'), u.get('department_id'))
            new_ok = is_delete or same_dept(d.get('department_id'), u.get('department_id'))
            if old_ok and new_ok:
                return True, d, ''
        return False, None, 'Không có quyền sửa khu vực của khoa khác'

    if c == 'staff':
        target_code = norm_code(k)
        if is_delete:
            if target_code == norm_code(u['code']):
                return False, None, 'Không thể tự xóa tài khoản của mình'
            if is_admin(u):
                return True, None, ''
            if is_manager(u) and existing and same_dept(existing.get('department_id'), u.get('department_id')) \
                    and not can_review(existing):
                return True, None, ''
            return False, None, 'Không có quyền xóa nhân sự'
        d = dict(d)
        new_pw = d.pop('password', None)
        if is_admin(u):
            if not existing or new_pw:
                password_updates[target_code] = new_pw or DEFAULT_PASSWORD
            d['code'] = target_code
            d['staff_code'] = target_code
            return True, d, ''
        if existing is None:
            if not (is_manager(u) and same_dept(d.get('department_id'), u.get('department_id'))):
                return False, None, 'Không có quyền thêm nhân sự'
            d.update({'role': 'staff', 'role_level': 'staff', 'is_admin': False, 'is_supervisor': False,
                      'can_review': False, 'code': target_code, 'staff_code': target_code})
            password_updates[target_code] = new_pw or DEFAULT_PASSWORD
            return True, d, ''
        is_self = target_code == norm_code(u['code'])
        is_mgr_of = is_manager(u) and same_dept(existing.get('department_id'), u.get('department_id'))
        if not (is_self or is_mgr_of):
            return False, None, 'Không có quyền sửa nhân sự này'
        for f in PROTECTED_STAFF_FIELDS:
            if f in existing:
                d[f] = existing[f]
            else:
                d.pop(f, None)
        d['department_id'] = existing.get('department_id')
        if new_pw and is_mgr_of and not is_self and not can_review(existing):
            password_updates[target_code] = new_pw
        return True, d, ''

    if c == 'audits':
        if is_delete:
            if existing is None:
                return True, None, ''
            if can_review(u):
                return True, None, ''
            if norm_code(existing.get('sender_code')) == norm_code(u['code']) and existing.get('status') in (None, '', 'pending'):
                return True, None, ''
            return False, None, 'Không có quyền xóa phiếu này'
        d = dict(d)
        # Người gửi phiếu do máy chủ ghi nhận (không tin dữ liệu từ máy khách)
        if existing is None:
            d['sender_code'] = u['code']
        else:
            d['sender_code'] = existing.get('sender_code') or d.get('sender_code')
        if can_review(u):
            # V29: người duyệt chỉ được ghi kết quả duyệt cho khu vực được giao
            if not can_review_room(u, d.get('room_id'), rooms_cache):
                if existing is None:
                    for f in REVIEW_FIELDS_AUDIT:
                        d[f] = '' if f != 'evaluation_result' else None
                    d['status'] = 'pending'
                else:
                    for f in REVIEW_FIELDS_AUDIT:
                        if f in existing:
                            d[f] = existing[f]
            return True, d, ''
        if existing is None:
            d['status'] = 'pending'
            for f in REVIEW_FIELDS_AUDIT:
                if f != 'status':
                    d[f] = '' if f != 'evaluation_result' else None
            return True, d, ''
        if norm_code(existing.get('sender_code')) == norm_code(u['code']):
            for f in REVIEW_FIELDS_AUDIT:
                if f in existing:
                    d[f] = existing[f]
            return True, d, ''
        return False, None, 'Chỉ người được duyệt mới được chấm phiếu 5S'

    if c == 'rooms_schedule':
        if is_delete:
            return (True, None, '') if is_manager(u) else (False, None, 'Không có quyền xóa lịch')
        d = dict(d)
        d.pop('_auto', None)
        ex_post = (existing or {}).get('post_shift_5s') or None
        in_post = d.get('post_shift_5s') or None
        # Bản ghi trống (không ảnh, không có dấu "xóa có chủ đích") không được ghi đè ảnh đã nộp từ máy khác
        if ex_post and ex_post.get('photo') and not (in_post or {}).get('photo') and not (in_post or {}).get('cleared_by'):
            d['post_shift_5s'] = ex_post
        room_id = d.get('room_id')
        old_post = (existing or {}).get('post_shift_5s') or None
        new_post = d.get('post_shift_5s') or None
        old_st = (old_post or {}).get('status')
        new_st = (new_post or {}).get('status')
        photo_changed = bool(new_post) and (new_post or {}).get('photo') != (old_post or {}).get('photo')
        # V29: ảnh mới phải là ảnh ĐÃ tải lên kho ảnh (không nhận ảnh base64 / link ngoài). Trước đây lỗi tải ảnh
        # vẫn ghi nhận "đã nộp" cho ngày làm việc.
        if photo_changed and new_post.get('photo') and not is_storage_url(new_post.get('photo')):
            return False, None, 'Ảnh chưa tải lên kho ảnh máy chủ, chưa ghi nhận'
        if not can_review_room(u, room_id, rooms_cache):
            # Người không có quyền duyệt khu vực này: không được tự đặt kết quả duyệt, không được ghi đè ảnh đã ĐẠT.
            # (Ảnh bị KHÔNG ĐẠT thì được chụp gửi lại.)
            if new_st in REVIEW_STATUSES and new_st != old_st:
                d['post_shift_5s'] = old_post
            elif old_st == 'approved':
                d['post_shift_5s'] = old_post
            elif photo_changed and str(d.get('date') or '')[:10] != vn_today():
                # V29: chỉ được nộp ảnh cho NGÀY HÔM NAY (chặn nộp bù cho ngày cũ)
                return False, None, 'Chỉ được nộp ảnh 5S cho ngày hôm nay'
        post = d.get('post_shift_5s')
        if isinstance(post, dict) and post.get('photo') and post.get('photo') != (old_post or {}).get('photo'):
            post = dict(post)
            post['server_at'] = (_dt.datetime.utcnow() + _dt.timedelta(hours=7)).strftime('%Y-%m-%d %H:%M')
            post['submitted_by_code'] = u['code']  # người nộp do máy chủ ghi nhận
            d['post_shift_5s'] = post
        elif isinstance(post, dict) and old_post and old_post.get('server_at'):
            post = dict(post)
            post['server_at'] = old_post.get('server_at')
            if old_post.get('submitted_by_code'):
                post['submitted_by_code'] = old_post.get('submitted_by_code')
            d['post_shift_5s'] = post
        return True, d, ''

    if c == 'department_evaluations':
        if is_delete:
            return (True, None, '') if is_leader(u) else (False, None, 'Không có quyền')
        return (True, d, '') if can_review(u) else (False, None, 'Chỉ người được duyệt mới được đánh giá khoa')

    if c == 'admin_messages':
        if is_delete:
            return (True, None, '') if is_admin(u) else (False, None, 'Không có quyền')
        if is_leader(u) or existing is None:
            return True, d, ''
        if norm_code(existing.get('sender_code')) == norm_code(u['code']):
            d = dict(d)
            for f in ('reply', 'status', 'reply_date', 'admin_read'):
                if f in existing:
                    d[f] = existing[f]
                else:
                    d.pop(f, None)
            return True, d, ''
        return False, None, 'Không có quyền'

    return (True, d, '') if is_leader(u) else (False, None, 'Không có quyền')


def apply_ops(u, ops, client_reset=None):
    if not isinstance(ops, list):
        raise ApiError(400, 'ops phải là danh sách')
    if len(ops) > MAX_OPS_PER_PUSH:
        raise ApiError(413, 'Quá nhiều thay đổi trong 1 lần gửi')
    # V29: sau khi Admin xóa toàn bộ dữ liệu 5S, máy nào chưa nhận mốc xóa mới thì không được gửi lại dữ liệu 5S cũ
    stale_reset = False
    if any(isinstance(op, dict) and op.get('c') in RESET_COLLECTIONS for op in ops):
        marker = get_record('singleton', 'data_reset') or {}
        stale_reset = bool(marker.get('at')) and marker.get('at') != client_reset
    clean = []
    for op in ops:
        if not isinstance(op, dict) or not op.get('c') or op.get('k') in (None, ''):
            continue
        c = str(op['c'])[:40]
        k = str(op['k'])[:200]
        if c == 'staff':
            k = norm_code(k)
        if not SAFE_KEY.match(k) or c not in ALLOWED_COLLECTIONS:
            continue
        clean.append({'c': c, 'k': k, 'd': op.get('d')})

    # Lấy bản ghi hiện có theo từng collection
    by_c = {}
    for op in clean:
        by_c.setdefault(op['c'], []).append(op['k'])
    existing = {c: get_records(c, keys) for c, keys in by_c.items()}

    rooms_cache = {}
    password_updates = {}
    rows, rejected = [], []
    now_code = norm_code(u['code'])
    for op in clean:
        if stale_reset and op['c'] in RESET_COLLECTIONS:
            rejected.append({'c': op['c'], 'k': op['k'],
                             'reason': 'Dữ liệu 5S đã được xóa để triển khai mới, ứng dụng đang tải lại dữ liệu'})
            continue
        ex = existing.get(op['c'], {}).get(op['k'])
        ok, data, reason = check_op(u, op, ex, rooms_cache, password_updates)
        if ok and data is not None:
            data = keep_private_fields(op['c'], sanitize(data), ex)
        if not ok:
            rejected.append({'c': op['c'], 'k': op['k'], 'reason': reason})
            continue
        if data is None:
            rows.append({'collection': op['c'], 'key': op['k'], 'data': None, 'deleted': True,
                         'rec_date': None, 'updated_by': now_code})
        else:
            rows.append({'collection': op['c'], 'key': op['k'], 'data': data, 'deleted': False,
                         'rec_date': _rec_date(op['c'], data), 'updated_by': now_code})
        existing.setdefault(op['c'], {})[op['k']] = data

    # Ghi theo lô (gộp trùng khóa: lấy thay đổi cuối)
    dedup = {}
    for r in rows:
        dedup[(r['collection'], r['key'])] = r
    rows = list(dedup.values())
    for i in range(0, len(rows), 200):
        rest('POST', 'records', {'on_conflict': 'collection,key'}, rows[i:i + 200],
             prefer='resolution=merge-duplicates,return=minimal')

    for code, pw in password_updates.items():
        set_password(code, pw, must_change=True, bump=True)

    return {'applied': len(rows), 'rejected': rejected}


# ---------------------------------------------------------------------------
# V29: XÓA TOÀN BỘ DỮ LIỆU 5S ĐỂ TRIỂN KHAI MỚI (chỉ Admin)
# - Đánh dấu xóa mọi phiếu 5S, lịch / ảnh bàn giao khu vực, đánh giá khoa (máy khác tự xóa theo khi đồng bộ)
# - Xóa ảnh trong kho ảnh
# - Ghi mốc xóa (singleton data_reset): máy chưa nhận mốc mới không gửi lại được dữ liệu cũ
# Giữ nguyên: nhân sự, tài khoản / mật khẩu, khoa phòng, khu vực, cấu hình, hộp thư.
# ---------------------------------------------------------------------------
RESET_COLLECTIONS = ('audits', 'rooms_schedule', 'department_evaluations')
RESET_CONFIRM = 'XOA DU LIEU 5S'


def _storage_list(prefix):
    url = '%s/storage/v1/object/list/%s' % (env('SUPABASE_URL').rstrip('/'), PHOTO_BUCKET)
    out, offset = [], 0
    while True:
        items = _request('POST', url, {'prefix': prefix, 'limit': 1000, 'offset': offset,
                                       'sortBy': {'column': 'name', 'order': 'asc'}},
                         _sb_headers({'Content-Type': 'application/json'})) or []
        out.extend(items)
        if len(items) < 1000:
            return out
        offset += 1000


def delete_all_photos(deadline):
    """Xóa toàn bộ ảnh trong kho (thư mục yyyy/mm/dd). Trả về (số ảnh đã xóa, còn sót do hết thời gian)."""
    files, stack = [], ['']
    while stack:
        if time.time() > deadline:
            return len(files), True
        prefix = stack.pop()
        for it in _storage_list(prefix):
            path = (prefix + '/' + it['name']) if prefix else it['name']
            if it.get('id') is None:
                stack.append(path)        # thư mục con
            else:
                files.append(path)
    url = '%s/storage/v1/object/%s' % (env('SUPABASE_URL').rstrip('/'), PHOTO_BUCKET)
    deleted = 0
    for i in range(0, len(files), 500):
        if time.time() > deadline:
            return deleted, True
        _request('DELETE', url, {'prefixes': files[i:i + 500]}, _sb_headers({'Content-Type': 'application/json'}))
        deleted += len(files[i:i + 500])
    return deleted, False


def reset_5s_data(u, confirm):
    # V29d: chỉ tài khoản Admin chính (ADMIN_CODES), không cấp cho tài khoản được gán vai trò admin
    if norm_code(u.get('code')) not in ADMIN_CODES:
        raise ApiError(403, 'Chỉ tài khoản Admin được xóa toàn bộ dữ liệu 5S')
    if confirm != RESET_CONFIRM:
        raise ApiError(400, 'Thiếu xác nhận xóa dữ liệu')
    started = time.time()
    counts = {}
    for c in RESET_COLLECTIONS:
        rows = rest('PATCH', 'records', {'collection': 'eq.' + c, 'deleted': 'eq.false', 'select': 'key'},
                    {'deleted': True, 'data': None, 'updated_by': 'RESET'}, prefer='return=representation')
        counts[c] = len(rows or [])
    now = (_dt.datetime.utcnow() + _dt.timedelta(hours=7)).strftime('%Y-%m-%d %H:%M:%S')
    marker = {'at': now, 'by': u['code'], 'counts': counts}
    try:
        photos, partial = delete_all_photos(started + 11)
    except ApiError as e:
        photos, partial = 0, True
        marker['photo_error'] = e.message[:200]
    marker['photos_deleted'] = photos
    marker['photos_partial'] = partial
    rest('POST', 'records', {'on_conflict': 'collection,key'}, [{
        'collection': 'singleton', 'key': 'data_reset', 'data': marker, 'deleted': False,
        'rec_date': None, 'updated_by': norm_code(u['code'])}], prefer='resolution=merge-duplicates,return=minimal')
    marker['version'] = current_version()
    return marker


# ---------------------------------------------------------------------------
# V29c: CẤP LẠI MẬT KHẨU cho nhân viên bị quên / mất mật khẩu
# - Admin: cấp lại cho mọi tài khoản (trừ chính mình - tự đổi ở "Đổi mật khẩu")
# - Lãnh đạo khoa/phòng: cấp lại cho nhân viên cùng khoa không có quyền duyệt
# Mật khẩu tạm do máy chủ sinh ngẫu nhiên, bắt buộc đổi ở lần đăng nhập kế tiếp,
# mọi phiên đăng nhập cũ của tài khoản đó bị đăng xuất (pw_version tăng).
# ---------------------------------------------------------------------------
_TEMP_PW_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'


def make_temp_password():
    return 'Vpi' + ''.join(secrets.choice('23456789') for _ in range(3)) + \
        ''.join(secrets.choice(_TEMP_PW_CHARS) for _ in range(2))


def admin_reset_password(u, target, msg_id=None):
    code = norm_code(target)
    if not code:
        raise ApiError(400, 'Thiếu mã nhân viên cần cấp lại mật khẩu')
    if code == norm_code(u['code']):
        raise ApiError(400, 'Mật khẩu của chính mình hãy đổi ở mục "Đổi mật khẩu"')
    staff = get_record('staff', code)
    if not staff:
        raise ApiError(404, 'Không tìm thấy nhân viên %s' % code)
    allowed = is_admin(u) or (is_manager(u) and same_dept(staff.get('department_id'), u.get('department_id'))
                              and not can_review(staff))
    if not allowed:
        raise ApiError(403, 'Chỉ Admin (hoặc lãnh đạo khoa với nhân viên trong khoa) được cấp lại mật khẩu')
    temp = make_temp_password()
    set_password(code, temp, must_change=True, bump=True)
    # Đánh dấu yêu cầu "Cấp lại mật khẩu" trong hòm thư là đã xử lý (không ghi mật khẩu vào tin nhắn)
    keys = {'FP-' + code}
    if msg_id:
        keys.add(str(msg_id)[:120])
    now = (_dt.datetime.utcnow() + _dt.timedelta(hours=7)).strftime('%H:%M %d/%m/%Y')
    for k in keys:
        if not SAFE_KEY.match(k):
            continue
        m = get_record('admin_messages', k)
        if not m or m.get('status') == 'replied':
            continue
        m = dict(m)
        m.update({'status': 'replied', 'admin_read': True, 'read_by_user': False, 'reply_date': now,
                  'reply': 'Đã cấp lại mật khẩu tạm lúc %s. Liên hệ người cấp (%s) để nhận mật khẩu, '
                           'đăng nhập và đổi mật khẩu mới.' % (now, clean_text(str(u.get('name') or u['code'])))})
        rest('POST', 'records', {'on_conflict': 'collection,key'}, [{
            'collection': 'admin_messages', 'key': k, 'data': m, 'deleted': False,
            'rec_date': None, 'updated_by': norm_code(u['code'])}], prefer='resolution=merge-duplicates,return=minimal')
    return {'ok': True, 'code': code, 'name': staff.get('name') or '', 'temp_password': temp}


def set_password(code, pw, must_change, bump):
    row = get_auth_row(code)
    ver = (row['pw_version'] + 1) if (row and bump) else (row['pw_version'] if row else 1)
    rest('POST', 'staff_auth', {'on_conflict': 'code'}, [{
        'code': code, 'password_hash': hash_password(pw), 'must_change': must_change,
        'pw_version': ver, 'failed_count': 0, 'locked_until': None,
        'updated_at': _dt.datetime.utcnow().isoformat() + 'Z'}],
        prefer='resolution=merge-duplicates,return=minimal')
    return ver


# ---------------------------------------------------------------------------
# Tải dữ liệu
# ---------------------------------------------------------------------------
def _fmt(rows):
    return [{'c': r['collection'], 'k': r['key'], 'd': r['data'], 'x': bool(r['deleted']), 'v': r.get('version')}
            for r in rows]


PRIVATE_STAFF_FIELDS = ('birth_date', 'phone', 'email', 'address', 'id_number')


def _can_see_message(u, d):
    return is_admin(u) or is_leader(u) or norm_code((d or {}).get('sender_code')) == norm_code(u.get('code'))


def view_for(u, result):
    """Bảo vệ dữ liệu cá nhân (NĐ 13/2023): mỗi người chỉ tải phần mình được xem."""
    me = norm_code(u.get('code'))
    out = []
    for r in result['records']:
        d = r.get('d')
        if r['c'] == 'admin_messages' and d is not None and not _can_see_message(u, d):
            continue
        if r['c'] == 'staff' and isinstance(d, dict) and not is_admin(u) and norm_code(r['k']) != me:
            d = dict(d)
            d.pop('birth_date', None)
            for f in ('email', 'address', 'id_number'):
                d.pop(f, None)
            if not (is_leader(u) or (is_manager(u) and same_dept(u.get('department_id'), d.get('department_id')))):
                d.pop('phone', None)
            r = dict(r, d=d)
        out.append(r)
    result['records'] = out
    return result


def keep_private_fields(collection, data, existing):
    """Máy khách không nhận các trường riêng tư => khi họ sửa hồ sơ, giữ nguyên giá trị cũ trên máy chủ."""
    if collection != 'staff' or not isinstance(data, dict) or not isinstance(existing, dict):
        return data
    for f in PRIVATE_STAFF_FIELDS:
        if f not in data and f in existing:
            data[f] = existing[f]
    return data


def pull(since):
    version = current_version()
    if since and since > 0:
        rows = rest('GET', 'records', {
            'select': 'collection,key,data,deleted,version', 'version': 'gt.%d' % since,
            'order': 'version', 'limit': str(PAGE + 1)})
        if rows is not None and len(rows) <= PAGE:
            return {'version': version, 'full': False, 'records': _fmt(rows)}
    try:
        days = int(env('RETENTION_DAYS', '90') or 90)
    except ValueError:
        days = 90
    cutoff = (_dt.date.today() - _dt.timedelta(days=days)).isoformat()
    out, offset = [], 0
    while True:
        rows = rest('GET', 'records', {
            'select': 'collection,key,data,deleted,version', 'deleted': 'eq.false',
            'or': '(rec_date.is.null,rec_date.gte.%s)' % cutoff,
            'order': 'collection,key', 'limit': str(PAGE), 'offset': str(offset)})
        out.extend(rows or [])
        if not rows or len(rows) < PAGE:
            break
        offset += PAGE
    return {'version': version, 'full': True, 'records': _fmt(out)}


# ---------------------------------------------------------------------------
# V29: Dữ liệu báo cáo theo khoảng ngày (thống kê thực hiện / chưa thực hiện, thi đua cuối năm,
# cá nhân vi phạm). Không giới hạn RETENTION_DAYS; chỉ trả trường cần cho thống kê (không trả ảnh).
# ---------------------------------------------------------------------------
REPORT_MAX_DAYS = 400


def _parse_day(s):
    try:
        return _dt.date.fromisoformat(str(s)[:10])
    except Exception:
        return None


def report_rows(u, date_from, date_to):
    # V29d: báo cáo chỉ dành cho lãnh đạo khoa phòng, người duyệt 5S, Ban giám đốc, Admin
    board = u.get('leader_group') in BOARD_GROUPS
    if not (is_manager(u) or can_review(u) or board):
        raise ApiError(403, 'Báo cáo 5S chỉ dành cho lãnh đạo khoa phòng và người duyệt 5S')
    d1, d2 = _parse_day(date_from), _parse_day(date_to)
    if not d1 or not d2 or d2 < d1:
        raise ApiError(400, 'Khoảng ngày không hợp lệ')
    if (d2 - d1).days > REPORT_MAX_DAYS:
        raise ApiError(400, 'Khoảng ngày tối đa %d ngày' % REPORT_MAX_DAYS)
    rows, offset = [], 0
    while True:
        part = rest('GET', 'records', {
            'select': 'key,data', 'collection': 'eq.rooms_schedule', 'deleted': 'eq.false',
            'and': '(rec_date.gte.%s,rec_date.lte.%s)' % (d1.isoformat(), d2.isoformat()),
            'order': 'key', 'limit': str(PAGE), 'offset': str(offset)})
        rows.extend(part or [])
        if not part or len(part) < PAGE:
            break
        offset += PAGE
    leader = is_leader(u) or board
    rooms_cache = {}
    out = []
    for r in rows:
        d = r.get('data') or {}
        room_id = d.get('room_id')
        if not leader:
            # Người không thuộc Ban chỉ đạo: chỉ xem khu vực của khoa mình hoặc khu vực được giao
            if not (area_in_scope(u, room_id, rooms_cache)
                    or same_dept(_room_dept(room_id, rooms_cache), u.get('department_id'))):
                continue
        p = d.get('post_shift_5s') or {}
        out.append({
            'r': room_id, 'd': str(d.get('date') or '')[:10], 'w': d.get('is_working') is not False,
            's': p.get('status') or '', 'u': is_storage_url(p.get('photo')),
            'b': p.get('submitted_by') or '', 'bc': p.get('submitted_by_code') or '',
            't': p.get('submitted_at') or '', 'sa': p.get('server_at') or '',
            'ev': p.get('evaluated_by') or '', 'is': p.get('issue') or '',
            'st': [{'code': x.get('code') or '', 'name': x.get('name') or '', 'role': x.get('role') or ''}
                   for x in (d.get('staff_assigned') or []) if isinstance(x, dict)],
        })
    return {'from': d1.isoformat(), 'to': d2.isoformat(), 'today': vn_today(), 'rows': out}


# ---------------------------------------------------------------------------
# Ảnh
# ---------------------------------------------------------------------------
def save_photo(data_url):
    m = re.match(r'^data:(image/(?:jpeg|jpg|png|webp));base64,(.+)$', data_url or '', re.S)
    if not m:
        raise ApiError(400, 'Ảnh không hợp lệ')
    ctype = m.group(1).replace('jpg', 'jpeg')
    try:
        content = base64.b64decode(m.group(2), validate=False)
    except Exception:
        raise ApiError(400, 'Ảnh không hợp lệ')
    if len(content) > MAX_PHOTO_BYTES:
        raise ApiError(413, 'Ảnh quá lớn (tối đa 3 MB)')
    sig_ok = (content[:3] == b'\xff\xd8\xff' or content[:8] == b'\x89PNG\r\n\x1a\n'
              or (content[:4] == b'RIFF' and content[8:12] == b'WEBP'))
    if not sig_ok:
        raise ApiError(400, 'Tệp không phải ảnh')
    ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[ctype]
    today = _dt.date.today()
    path = '%04d/%02d/%02d/%s.%s' % (today.year, today.month, today.day, uuid.uuid4().hex, ext)
    return storage_upload(path, content, ctype)


# ---------------------------------------------------------------------------
# Tiện ích HTTP cho các handler
# ---------------------------------------------------------------------------
def read_json(handler, limit=6 * 1024 * 1024):
    n = int(handler.headers.get('Content-Length') or 0)
    if n > limit:
        raise ApiError(413, 'Dữ liệu gửi lên quá lớn')
    raw = handler.rfile.read(n) if n else b''
    if not raw:
        return {}
    try:
        return json.loads(raw.decode('utf-8'))
    except Exception:
        raise ApiError(400, 'JSON không hợp lệ')


def send_json(handler, status, obj):
    body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Cache-Control', 'no-store')
    handler.send_header('Content-Length', str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def run(handler, fn):
    try:
        missing = config_ok()
        if missing:
            raise ApiError(500, 'Máy chủ chưa cấu hình biến môi trường: ' + ', '.join(missing))
        invalid = config_invalid()
        if invalid:
            raise ApiError(500, 'Biến môi trường sai: ' + '; '.join(invalid))
        status, obj = fn()
        send_json(handler, status, obj)
    except ApiError as e:
        send_json(handler, e.status, {'error': e.message})
    except Exception as e:  # pragma: no cover
        send_json(handler, 500, {'error': 'Lỗi máy chủ: %s: %s' % (type(e).__name__, str(e)[:200])})
