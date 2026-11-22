"""
GET  /api/sync?since=<version>   -> {version, full, records:[{c,k,d,x}]}
POST /api/sync  {ops:[{c,k,d}]}  -> {applied, rejected, version}
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
            core.authenticate(self.headers)
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            try:
                since = int((qs.get('since') or ['0'])[0])
            except ValueError:
                since = 0
            return 200, core.pull(since)
        core.run(self, go)

    def do_POST(self):
        def go():
            user = core.authenticate(self.headers)
            body = core.read_json(self)
            result = core.apply_ops(user, body.get('ops') or [])
            result['version'] = core.current_version()
            return 200, result
        core.run(self, go)

    def log_message(self, *args):
        pass
