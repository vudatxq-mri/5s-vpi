"""
Nạp dữ liệu ban đầu vào Supabase (chạy 1 lần trên máy, KHÔNG chạy trên Vercel):
  - 526 nhân sự (lấy từ original/app.js) + phân quyền duyệt ảnh theo REVIEW_POLICY trong app.js
  - Mật khẩu mặc định 123456 (bắt đổi ở lần đăng nhập đầu) cho tài khoản chưa có mật khẩu
  - Danh mục khoa / phòng / khu vực và cấu hình lịch
Chạy lại nhiều lần an toàn: bản ghi đã có trên Supabase sẽ KHÔNG bị ghi đè (trừ khi thêm --overwrite).

Cách chạy:  python tools/seed_supabase.py  [--overwrite]
"""
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
sys.path.insert(0, os.path.join(ROOT, 'api'))
from envload import load_env  # noqa: E402

load_env(ROOT)
import _core as core  # noqa: E402


def read_seed_lines(path):
    return open(path, encoding='utf-8').read().split('\n')


def json_line(lines, prefix):
    line = next(l for l in lines if l.startswith('  ' + prefix + ': ['))
    return json.loads(line.strip()[len(prefix) + 2:].rstrip(','))


def schedules_meta(lines):
    start = next(i for i, l in enumerate(lines) if l.startswith('  schedules: {'))
    end = next(i for i in range(start, len(lines)) if lines[i].startswith('  department_evaluations:'))
    text = '{' + '\n'.join(lines[start + 1:end]).rstrip().rstrip(',')
    obj = json.loads(text)
    obj.pop('rooms_schedule', None)
    return obj


def review_policy(app_js_text):
    m = re.search(r"REVIEW_POLICY = \{(.*?)\n\};", app_js_text, re.S)
    block = m.group(1)
    version = re.search(r"version:\s*'([^']+)'", block).group(1)
    admins = re.findall(r"'(BV-[0-9A-Z]+)'", re.search(r"ADMIN_CODES:\s*\[(.*?)\]", block, re.S).group(1))
    reviewers = re.findall(r"'(BV-[0-9A-Z]+)'", re.search(r"REVIEWER_CODES:\s*\[(.*?)\]", block, re.S).group(1))
    return version, set(admins), set(reviewers)


def normalize_staff(s, idx, admins, reviewers):
    code = core.norm_code(s.get('code') or s.get('staff_code'))
    name = s.get('name') or s.get('full_name') or 'Cán bộ 5S'
    title = s.get('title') or s.get('role_title') or s.get('position') or 'Cán bộ 5S'
    rooms = s.get('assigned_rooms') if isinstance(s.get('assigned_rooms'), list) else []
    if not rooms and isinstance(s.get('assigned_room'), str) and s['assigned_room'].strip():
        rooms = [x.strip() for x in re.split(r'[;,\n\r•]+', s['assigned_room']) if x.strip()]
    if not rooms:
        rooms = ['Buồng bệnh được phân công']
    d = dict(s)
    d.pop('password', None)
    d.update({
        'id': s.get('id') or idx + 1, 'code': code, 'staff_code': code, 'name': name, 'full_name': name,
        'username': s.get('username') or code, 'department_id': s.get('department_id') or 8,
        'title': title, 'role_title': s.get('role_title') or title, 'position': s.get('position') or title,
        'assigned_rooms': rooms, 'assigned_room': ', '.join(rooms), 'allow_external': True,
    })
    if code in admins:
        d.update(role='admin', role_level='admin', is_admin=True, can_review=True)
    elif code in reviewers:
        d.update(role='supervisor', role_level='supervisor', is_admin=False, can_review=True)
    else:
        d.update(role='staff', role_level='staff', is_admin=False, is_supervisor=False, can_review=False)
    return code, d


def upsert(rows, overwrite):
    prefer = 'resolution=%s,return=minimal' % ('merge-duplicates' if overwrite else 'ignore-duplicates')
    for i in range(0, len(rows), 200):
        core.rest('POST', 'records', {'on_conflict': 'collection,key'}, rows[i:i + 200], prefer=prefer)


def main():
    overwrite = '--overwrite' in sys.argv
    missing = core.config_ok()
    if missing:
        print('THIẾU cấu hình trong .env.local: ' + ', '.join(missing))
        sys.exit(1)
    src = os.path.join(ROOT, 'original', 'app.js')
    lines = read_seed_lines(src)
    version, admins, reviewers = review_policy(open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read())
    print('Chính sách duyệt ảnh:', version, '| admin:', len(admins), '| người duyệt:', len(reviewers))

    staff = json_line(lines, 'staff')
    staff_rows, codes = [], []
    for i, s in enumerate(staff):
        code, d = normalize_staff(s, i, admins, reviewers)
        codes.append(code)
        staff_rows.append({'collection': 'staff', 'key': code, 'data': d, 'deleted': False, 'updated_by': 'seed'})
    depts = json_line(lines, 'departments')
    rooms = json_line(lines, 'rooms')
    other_rows = [{'collection': 'departments', 'key': str(d['id']), 'data': d, 'deleted': False, 'updated_by': 'seed'} for d in depts]
    other_rows += [{'collection': 'rooms', 'key': str(r['id']), 'data': r, 'deleted': False, 'updated_by': 'seed'} for r in rooms]
    other_rows.append({'collection': 'singleton', 'key': 'schedules_meta', 'data': schedules_meta(lines),
                       'deleted': False, 'updated_by': 'seed'})

    upsert(staff_rows, overwrite)
    upsert(other_rows, overwrite)
    print('Đã nạp: %d nhân sự, %d khoa/phòng, %d khu vực' % (len(staff_rows), len(depts), len(rooms)))

    have = set()
    offset = 0
    while True:
        rows = core.rest('GET', 'staff_auth', {'select': 'code', 'limit': '1000', 'offset': str(offset)}) or []
        have.update(r['code'] for r in rows)
        if len(rows) < 1000:
            break
        offset += 1000
    todo = [c for c in codes if c not in have]
    print('Tạo mật khẩu mặc định cho %d tài khoản (mất khoảng 1 phút)...' % len(todo), flush=True)
    batch = []
    for c in todo:
        batch.append({'code': c, 'password_hash': core.hash_password(core.DEFAULT_PASSWORD),
                      'must_change': True, 'pw_version': 1, 'failed_count': 0})
        if len(batch) == 100:
            core.rest('POST', 'staff_auth', {'on_conflict': 'code'}, batch, prefer='resolution=ignore-duplicates,return=minimal')
            batch = []
    if batch:
        core.rest('POST', 'staff_auth', {'on_conflict': 'code'}, batch, prefer='resolution=ignore-duplicates,return=minimal')
    print('HOÀN TẤT. Phiên bản dữ liệu hiện tại:', core.current_version())


if __name__ == '__main__':
    main()
