#!/usr/bin/env python3
"""
Optimizador de imágenes WebP para andresreginensi.es
- Convierte todos los JPEG de assets/images/ a WebP (calidad fotográfica adaptativa <= 350 KB full, <= 95 KB thumb).
- Respeta orientación EXIF y perfil ICC de color.
- Conserva únicamente 4 copias JPEG progresivas optimizadas para tarjetas Open Graph (WhatsApp/LinkedIn/X).
- Elimina imágenes huérfanas sin uso.
"""

import os
import io
from PIL import Image, ImageOps

ROOT_IMG_DIR = "assets/images"

ORPHAN_IMAGES = {
    "assets/images/retratos/retrato-playa-mirada.jpg",
    "assets/images/retratos/retrato-playa-mirada-thumb.jpg",
    "assets/images/paisajes/paisaje-atardecer-thumb.jpg",
}

# Estas 4 imágenes se usan en meta og:image / twitter:image (mantener copia JPEG ligera para WhatsApp/LinkedIn)
OG_JPEG_KEEP = {
    "assets/images/portada-1280w.jpg",
    "assets/images/realestate/galileu-piscina.jpg",
    "assets/images/bodas/boda-editorial-calle.jpg",
    "assets/images/retratos/retrato-ejecutivo-profesional.jpg",
}


def encode_webp_adaptive(img, max_kb, start_q=82, min_q=70):
    icc = img.info.get("icc_profile")
    best_bytes = None
    best_q = start_q
    for q in range(start_q, min_q - 1, -2):
        buf = io.BytesIO()
        save_kwargs = {"format": "WEBP", "quality": q, "method": 6}
        if icc:
            save_kwargs["icc_profile"] = icc
        img.save(buf, **save_kwargs)
        data = buf.getvalue()
        best_bytes = data
        best_q = q
        if len(data) <= max_kb * 1024:
            break
    return best_bytes, best_q


def encode_og_jpeg(img, max_w=1280, quality=80):
    copy = img.copy()
    if copy.width > max_w:
        new_h = round(copy.height * (max_w / copy.width))
        copy = copy.resize((max_w, new_h), Image.Resampling.LANCZOS)
    if copy.mode != "RGB":
        copy = copy.convert("RGB")
    buf = io.BytesIO()
    copy.save(buf, format="JPEG", quality=quality, optimize=True, progressive=True)
    return buf.getvalue()


def main():
    before_bytes = 0
    after_bytes = 0
    converted = 0
    removed_orphans = 0
    dimensions_map = {}

    all_jpgs = []
    for root, _, files in os.walk(ROOT_IMG_DIR):
        for fn in sorted(files):
            if fn.startswith("._") or fn == ".DS_Store":
                continue
            if fn.lower().endswith((".jpg", ".jpeg")):
                all_jpgs.append(os.path.join(root, fn))

    for jpg_path in all_jpgs:
        orig_size = os.path.getsize(jpg_path)
        before_bytes += orig_size

        if jpg_path in ORPHAN_IMAGES:
            os.remove(jpg_path)
            removed_orphans += 1
            print(f"REMOVED ORPHAN ({orig_size/1024:6.1f} KB): {jpg_path}")
            continue

        with Image.open(jpg_path) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")

            w, h = im.size
            is_thumb = "-thumb." in jpg_path or "portada-800w" in jpg_path
            is_mid = "portada-1280w" in jpg_path

            max_kb = 90 if is_thumb else (180 if is_mid else 350)
            start_q = 80 if is_thumb else 82

            webp_bytes, used_q = encode_webp_adaptive(im, max_kb=max_kb, start_q=start_q, min_q=70)
            webp_path = os.path.splitext(jpg_path)[0] + ".webp"
            with open(webp_path, "wb") as out:
                out.write(webp_bytes)

            after_bytes += len(webp_bytes)
            converted += 1
            dimensions_map[webp_path] = (w, h)

            if jpg_path in OG_JPEG_KEEP:
                og_bytes = encode_og_jpeg(im, max_w=1280, quality=80)
                with open(jpg_path, "wb") as og_out:
                    og_out.write(og_bytes)
                after_bytes += len(og_bytes)
                keep_note = f" + OG JPEG ({len(og_bytes)/1024:.1f} KB)"
            else:
                os.remove(jpg_path)
                keep_note = ""

            print(
                f"OK {orig_size/1024:6.1f} KB -> {len(webp_bytes)/1024:5.1f} KB (q={used_q}, {w}x{h})  {webp_path}{keep_note}"
            )

    pct = (1 - after_bytes / before_bytes) * 100 if before_bytes else 0
    print("\n=== RESUMEN OPTIMIZACIÓN ===")
    print(f"Imágenes convertidas a WebP : {converted}")
    print(f"Imágenes huérfanas borradas : {removed_orphans}")
    print(f"Peso total ANTES            : {before_bytes/1024/1024:.2f} MB")
    print(f"Peso total DESPUÉS          : {after_bytes/1024/1024:.2f} MB (-{pct:.1f}%)")


if __name__ == "__main__":
    main()
