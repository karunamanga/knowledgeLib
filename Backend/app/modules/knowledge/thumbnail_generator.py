import io
import re
import struct
import zlib
import zipfile
import xml.etree.ElementTree as ET
from typing import Optional, Tuple

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def _create_fallback_png(width: int = 600, height: int = 800) -> bytes:
    """Generate a clean white document page PNG without external dependencies."""
    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            if y < 2 or y > height - 3 or x < 2 or x > width - 3:
                raw_data.extend((226, 232, 240))  # border
            else:
                raw_data.extend((255, 255, 255))  # clean white paper
    
    compressed = zlib.compress(bytes(raw_data))
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    return header + ihdr + idat + iend

def _get_font(size: int, bold: bool = False):
    try:
        font_names = [
            "arialbd.ttf" if bold else "arial.ttf",
            "segoeuib.ttf" if bold else "segoeui.ttf",
            "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
        ]
        for name in font_names:
            try:
                return ImageFont.truetype(name, size)
            except Exception:
                continue
    except Exception:
        pass
    return ImageFont.load_default()

def _wrap_text(text: str, max_chars: int = 50, max_lines: int = 8) -> list:
    words = text.split()
    lines = []
    current_line = []
    current_len = 0
    
    for word in words:
        if current_len + len(word) + 1 <= max_chars:
            current_line.append(word)
            current_len += len(word) + 1
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            current_len = len(word)
            if len(lines) >= max_lines:
                break
                
    if current_line and len(lines) < max_lines:
        lines.append(" ".join(current_line))
    return lines

def generate_pdf_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate the exact first-page visual render from a PDF file."""
    # 1. Primary: Use pypdfium2 to render the exact pixel-perfect first page
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(file_bytes)
        if len(pdf) > 0:
            page = pdf[0]
            pil_img = page.render(scale=2.0).to_pil()
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG", optimize=True)
            return buf.getvalue()
    except Exception as e:
        print("pypdfium2 render notice:", e)

    # 2. Extract actual text from PDF stream
    extracted_text = []
    try:
        matches = re.findall(r'\((.*?)\)\s*Tj', file_bytes.decode('latin1', errors='ignore'))
        extracted_text = [m.strip() for m in matches if len(m.strip()) > 3]
    except Exception:
        pass

    # 3. Clean white A4 page rendering actual extracted content (no fake badges or banners)
    width, height = 700, 950
    img = Image.new("RGB", (width, height), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    margin = 50
    # Outer subtle boundary
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline="#E2E8F0", width=1)

    y_cursor = margin + 20
    doc_title = title or (extracted_text[0] if extracted_text else "Document")
    title_font = _get_font(24, bold=True)
    title_lines = _wrap_text(doc_title, max_chars=36, max_lines=3)
    for tl in title_lines:
        draw.text((margin, y_cursor), tl, fill="#0F172A", font=title_font)
        y_cursor += 34

    y_cursor += 20
    body_font = _get_font(14)
    content_sample = " ".join(extracted_text[:30]) if extracted_text else ""
    if content_sample:
        body_lines = _wrap_text(content_sample, max_chars=54, max_lines=18)
        for bl in body_lines:
            if y_cursor < height - margin - 30:
                draw.text((margin, y_cursor), bl, fill="#334155", font=body_font)
                y_cursor += 24

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_docx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract the actual first-page visual preview from a DOCX file."""
    # 1. Try embedded thumbnail saved by MS Word
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            for thumb_name in ["docProps/thumbnail.jpeg", "docProps/thumbnail.png"]:
                if thumb_name in z.namelist():
                    data = z.read(thumb_name)
                    img = Image.open(io.BytesIO(data))
                    buf = io.BytesIO()
                    img.save(buf, format="PNG")
                    return buf.getvalue()
    except Exception:
        pass

    # 2. Extract text and embedded media from word/document.xml
    doc_text_parts = []
    embedded_image_bytes = None
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            names = z.namelist()
            for n in names:
                if n.startswith("word/media/") and any(n.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg"]):
                    try:
                        embedded_image_bytes = z.read(n)
                        break
                    except Exception:
                        pass
                        
            if "word/document.xml" in names:
                xml_content = z.read("word/document.xml")
                matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_content.decode('utf-8', errors='ignore'))
                doc_text_parts = [m.strip() for m in matches if m.strip()]
    except Exception:
        pass

    # 3. Clean white A4 page rendering actual document content (no fake badges or ribbons)
    width, height = 700, 950
    img = Image.new("RGB", (width, height), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    margin = 55
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline="#E2E8F0", width=1)

    y_cursor = margin + 15
    doc_title = title or (doc_text_parts[0] if doc_text_parts else "Document")
    title_font = _get_font(24, bold=True)
    title_lines = _wrap_text(doc_title, max_chars=36, max_lines=3)
    for t_line in title_lines:
        draw.text((margin, y_cursor), t_line, fill="#0F172A", font=title_font)
        y_cursor += 34

    y_cursor += 15

    # If embedded image exists in DOCX, paste it
    if embedded_image_bytes:
        try:
            emb_img = Image.open(io.BytesIO(embedded_image_bytes)).convert("RGB")
            emb_img.thumbnail((width - (margin * 2), 240))
            img.paste(emb_img, (margin, y_cursor))
            y_cursor += emb_img.height + 25
        except Exception:
            pass

    # Render actual document paragraph excerpt
    body_font = _get_font(14)
    raw_body = " ".join(doc_text_parts[1:35]) if len(doc_text_parts) > 1 else ""
    if raw_body:
        body_lines = _wrap_text(raw_body, max_chars=54, max_lines=16)
        for b_line in body_lines:
            if y_cursor < height - margin - 30:
                draw.text((margin, y_cursor), b_line, fill="#334155", font=body_font)
                y_cursor += 24

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_pptx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract the actual first-slide visual preview from a PPTX file."""
    # 1. Try embedded thumbnail
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            if "docProps/thumbnail.jpeg" in z.namelist():
                data = z.read("docProps/thumbnail.jpeg")
                img = Image.open(io.BytesIO(data))
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                return buf.getvalue()
    except Exception:
        pass

    # 2. Extract slide 1 text
    slide_texts = []
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            names = z.namelist()
            if "ppt/slides/slide1.xml" in names:
                xml_content = z.read("ppt/slides/slide1.xml")
                matches = re.findall(r'<a:t[^>]*>(.*?)</a:t>', xml_content.decode('utf-8', errors='ignore'))
                slide_texts = [m.strip() for m in matches if m.strip()]
    except Exception:
        pass

    # 3. Render 16:9 Presentation Slide Canvas (800 x 450)
    width, height = 800, 450
    img = Image.new("RGB", (width, height), color="#0F172A")
    draw = ImageDraw.Draw(img)

    margin = 55
    y_cursor = 100
    slide_title = (slide_texts[0] if slide_texts else "") or title or "Presentation Deck"
    title_font = _get_font(30, bold=True)
    title_lines = _wrap_text(slide_title, max_chars=34, max_lines=3)
    for tl in title_lines:
        draw.text((margin, y_cursor), tl, fill="#F8FAFC", font=title_font)
        y_cursor += 42

    y_cursor += 20
    subtitle = " ".join(slide_texts[1:8]) if len(slide_texts) > 1 else ""
    if subtitle:
        sub_lines = _wrap_text(subtitle, max_chars=48, max_lines=4)
        sub_font = _get_font(16)
        for sl in sub_lines:
            draw.text((margin, y_cursor), sl, fill="#94A3B8", font=sub_font)
            y_cursor += 26

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_document_thumbnail(file_bytes: bytes, file_name: str, title: str) -> Tuple[bytes, str]:
    """
    Main thumbnail generation dispatcher for PDF, DOC, DOCX, PPT, PPTX.
    Returns (png_bytes, 'image/png').
    """
    if not HAS_PIL:
        return _create_fallback_png(), "image/png"

    ext = (file_name or "").split(".")[-1].lower()
    
    if ext == "pdf":
        thumb_bytes = generate_pdf_thumbnail(file_bytes, title)
    elif ext in ["docx", "doc"]:
        thumb_bytes = generate_docx_thumbnail(file_bytes, title)
    elif ext in ["pptx", "ppt"]:
        thumb_bytes = generate_pptx_thumbnail(file_bytes, title)
    else:
        thumb_bytes = generate_docx_thumbnail(file_bytes, title)
        
    return thumb_bytes, "image/png"
