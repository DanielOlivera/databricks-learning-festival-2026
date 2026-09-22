"""Servidor local del Study Lab. Sin logs, para poder correr oculto con pythonw."""
import os
import socket
import socketserver
import sys
from http.server import SimpleHTTPRequestHandler

PUERTO = 8765
RAIZ = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=RAIZ, **kw)

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
