"""Genera los íconos de la app (un disco azul sobre fondo oscuro).

Uso, desde la carpeta del proyecto:
    python herramientas/generar_iconos.py

No necesita instalar nada: usa solo lo que trae Python.
"""
import struct
import zlib
from pathlib import Path

FONDO = (0x0B, 0x0F, 0x17)
DISCO = (0x1D, 0x4E, 0xD8)
BORDE = (0x7E, 0xA6, 0xFF)
CARPETA = Path(__file__).resolve().parent.parent / "icons"


def color_en(x, y, redondeado):
    """Color del punto (x, y), con coordenadas de 0 a 1. None = transparente."""
    if redondeado:
        # Cuadrado con esquinas redondeadas (radio 22%)
        r = 0.22
        cx = min(max(x, r), 1 - r)
        cy = min(max(y, r), 1 - r)
        if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
            return None
    d = ((x - 0.5) ** 2 + (y - 0.5) ** 2) ** 0.5
    if d <= 0.30:
        if 0.255 <= d <= 0.30 or 0.16 <= d <= 0.18:
            return BORDE  # aro exterior y aro interior del disco
        return DISCO
    return FONDO


def dibujar(tam, redondeado):
    n = 4  # sub-muestras por lado, para bordes suaves
    filas = []
    for py in range(tam):
        fila = bytearray([0])  # tipo de filtro PNG
        for px in range(tam):
            r = g = b = a = 0
            for sy in range(n):
                for sx in range(n):
                    c = color_en((px + (sx + 0.5) / n) / tam, (py + (sy + 0.5) / n) / tam, redondeado)
                    if c:
                        r += c[0]; g += c[1]; b += c[2]; a += 255
            total = n * n
            if a:
                cubiertas = a // 255
                fila += bytes((r // cubiertas, g // cubiertas, b // cubiertas, a // total))
            else:
                fila += bytes((0, 0, 0, 0))
        filas.append(bytes(fila))
    return b"".join(filas)


def guardar_png(ruta, tam, pixeles):
    def bloque(tipo, datos):
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos) & 0xFFFFFFFF)

    cabecera = struct.pack(">IIBBBBB", tam, tam, 8, 6, 0, 0, 0)  # RGBA de 8 bits
    png = b"\x89PNG\r\n\x1a\n" + bloque(b"IHDR", cabecera) + bloque(b"IDAT", zlib.compress(pixeles, 9)) + bloque(b"IEND", b"")
    ruta.write_bytes(png)
    print("Creado", ruta.relative_to(CARPETA.parent))


if __name__ == "__main__":
    CARPETA.mkdir(exist_ok=True)
    guardar_png(CARPETA / "icon-192.png", 192, dibujar(192, True))
    guardar_png(CARPETA / "icon-512.png", 512, dibujar(512, True))
    # "maskable": el teléfono recorta la forma, así que el fondo debe llenar todo
    guardar_png(CARPETA / "icon-maskable-512.png", 512, dibujar(512, False))
    guardar_png(CARPETA / "apple-touch-icon.png", 180, dibujar(180, False))
