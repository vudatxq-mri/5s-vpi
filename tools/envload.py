"""Đọc file .env.local (KEY=VALUE) vào os.environ, không in giá trị ra màn hình."""
import os


def load_env(root):
    path = os.path.join(root, '.env.local')
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if v and not os.environ.get(k):
                os.environ[k] = v
