import os
import re
import http.server
import socketserver

PORT = 8080

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_len = fs.st_size

        range_header = self.headers.get('Range')
        if not range_header:
            return super().send_head()

        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not range_match:
            return super().send_head()

        first_byte = int(range_match.group(1))
        last_byte = int(range_match.group(2)) if range_match.group(2) else total_len - 1
        if first_byte >= total_len:
            self.send_error(416, "Requested Range Not Satisfiable")
            f.close()
            return None

        length = last_byte - first_byte + 1

        self.send_response(206)
        self.send_header('Content-type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {first_byte}-{last_byte}/{total_len}')
        self.send_header('Content-Length', str(length))
        self.end_headers()

        f.seek(first_byte)
        return f

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadingHTTPServer(("", PORT), RangeHTTPRequestHandler) as httpd:
        print(f"Serving HTTP on port {PORT} with Range and Multi-threading support...")
        httpd.serve_forever()
