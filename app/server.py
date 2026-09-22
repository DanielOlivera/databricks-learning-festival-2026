"""Servidor local del Study Lab. Sin logs, para poder correr oculto con pythonw.

Sirve la raiz del repositorio: la app vive en /app y el sistema de diseno en /ui.
Solo escucha en 127.0.0.1.
"""
import os
import socket
import socketserver
import sys
from http.server import SimpleHTTPRequestHandler

PUERTO = 8765
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INICIO = "/app/index.html"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=RAIZ, **kw)

    def end_headers(self):
        # Permite que /app/sw.js controle todo el origen, incluido /ui
        if self.path.endswith("sw.js"):
            self.send_header("Service-Worker-Allowed", "/")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *a):
        pass  # pythonw no tiene stderr: escribir ahi rompe la respuesta


class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def puerto_ocupado():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", PUERTO)) == 0


if __name__ == "__main__":
    if puerto_ocupado():
        sys.exit(0)  # ya hay una instancia corriendo
    Servidor(("127.0.0.1", PUERTO), Handler).serve_forever()
