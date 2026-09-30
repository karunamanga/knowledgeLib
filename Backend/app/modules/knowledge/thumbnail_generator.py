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

def _create_fallback_png(width: int = 400, height: int = 300) -> bytes:
    """Generate a clean, valid PNG without any external dependencies."""
    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            if y < 6 or y > height - 6 or x < 6 or x > width - 6:
                raw_data.extend((99, 102, 241))  # Indigo border
            else:
                raw_data.extend((248, 250, 252)) # Light slate
    
    compressed = zlib.compress(bytes(raw_data))
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    return header + ihdr + idat + iend

def _get_font(size: int, bold: bool = False):
    try:
        # Try system fonts on Windows / Linux
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

def generate_docx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract a first-page visual preview from a DOCX file."""
    # 1. Try embedded thumbnail
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

    # 2. Extract text and embedded images from word/document.xml
    doc_text_parts = []
    embedded_image_bytes = None
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            names = z.namelist()
            # Check for embedded images
            for n in names:
                if n.startswith("word/media/") and any(n.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg"]):
                    try:
                        embedded_image_bytes = z.read(n)
                        break
                    except Exception:
                        pass
                        
            if "word/document.xml" in names:
                xml_content = z.read("word/document.xml")
                # Fast regex text extraction from <w:t> tags
                matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_content.decode('utf-8', errors='ignore'))
                doc_text_parts = [m.strip() for m in matches if m.strip()]
    except Exception:
        pass

    # 3. Render realistic A4 document sheet preview (600 x 800)
    width, height = 600, 800
    img = Image.new("RGB", (width, height), color="#F8FAFC")
    draw = ImageDraw.Draw(img)

    # Document Paper Canvas with border & subtle shadow
    paper_margin = 28
    draw.rectangle(
        [(paper_margin + 4, paper_margin + 4), (width - paper_margin + 4, height - paper_margin + 4)],
        fill="#E2E8F0"
    )
    draw.rectangle(
        [(paper_margin, paper_margin), (width - paper_margin, height - paper_margin)],
        fill="#FFFFFF",
        outline="#CBD5E1",
        width=1
    )

    # Top Brand Ribbon
    draw.rectangle([(paper_margin, paper_margin), (width - paper_margin, paper_margin + 6)], fill="#2563EB")

    # Document Header Badge
    draw.rectangle([(paper_margin + 30, paper_margin + 30), (paper_margin + 120, paper_margin + 54)], fill="#EFF6FF")
    draw.text((paper_margin + 42, paper_margin + 36), "DOCX FILE", fill="#1D4ED8", font=_get_font(12, bold=True))

    # Document Title
    title_font = _get_font(22, bold=True)
    clean_title = title or (doc_text_parts[0] if doc_text_parts else "Document Preview")
    title_lines = _wrap_text(clean_title, max_chars=32, max_lines=3)
    y_cursor = paper_margin + 75
    for t_line in title_lines:
        draw.text((paper_margin + 30, y_cursor), t_line, fill="#0F172A", font=title_font)
        y_cursor += 30

    # Horizontal Divider
    y_cursor += 10
    draw.line([(paper_margin + 30, y_cursor), (width - paper_margin - 30, y_cursor)], fill="#E2E8F0", width=2)
    y_cursor += 25

    # If embedded image exists, paste it into the document body
    if embedded_image_bytes:
        try:
            emb_img = Image.open(io.BytesIO(embedded_image_bytes)).convert("RGB")
            emb_img.thumbnail((width - (paper_margin * 2) - 60, 200))
            img.paste(emb_img, (paper_margin + 30, y_cursor))
            y_cursor += emb_img.height + 25
        except Exception:
            pass

    # Document Paragraph Content Excerpt
    body_font = _get_font(13)
    raw_body = " ".join(doc_text_parts[1:20]) if len(doc_text_parts) > 1 else "This document contains structured organisational knowledge, technical architecture, and implementation details."
    body_lines = _wrap_text(raw_body, max_chars=48, max_lines=10)
    for b_line in body_lines:
        if y_cursor < height - paper_margin - 60:
            draw.text((paper_margin + 30, y_cursor), b_line, fill="#475569", font=body_font)
            y_cursor += 22

    # Bottom Page Footer Indicator
    draw.line([(paper_margin + 30, height - paper_margin - 40), (width - paper_margin - 30, height - paper_margin - 40)], fill="#F1F5F9", width=1)
    draw.text((paper_margin + 30, height - paper_margin - 30), "Knowledge Library • First Page Preview", fill="#94A3B8", font=_get_font(11))
    draw.text((width - paper_margin - 80, height - paper_margin - 30), "Page 1", fill="#94A3B8", font=_get_font(11))

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_pptx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract a first-slide visual preview from a PPTX file."""
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

    # 3. Render 16:9 Widescreen Presentation Slide (800 x 450)
    width, height = 800, 450
    img = Image.new("RGB", (width, height), color="#0F172A")
    draw = ImageDraw.Draw(img)

    # Gradient/Accent Background Bars
    draw.rectangle([(0, 0), (width, 8)], fill="#F59E0B")
    draw.rectangle([(0, height - 40), (width, height)], fill="#1E293B")

    # Slide 1 Indicator Badge
    draw.rectangle([(50, 40), (140, 68)], fill="#F59E0B")
    draw.text((62, 46), "SLIDE 1", fill="#000000", font=_get_font(12, bold=True))

    # Slide Title
    slide_title = (slide_texts[0] if slide_texts else "") or title or "Presentation Deck"
    title_font = _get_font(28, bold=True)
    title_lines = _wrap_text(slide_title, max_chars=36, max_lines=3)
    y_cursor = 110
    for tl in title_lines:
        draw.text((50, y_cursor), tl, fill="#F8FAFC", font=title_font)
        y_cursor += 38

    # Subtitle / Key Points
    y_cursor += 15
    subtitle = " ".join(slide_texts[1:5]) if len(slide_texts) > 1 else "Organisational Learning & Architecture Presentation"
    sub_lines = _wrap_text(subtitle, max_chars=48, max_lines=4)
    sub_font = _get_font(16)
    for sl in sub_lines:
        draw.text((50, y_cursor), sl, fill="#94A3B8", font=sub_font)
        y_cursor += 26

    # Bottom Footer
    draw.text((50, height - 28), "Presentation Deck • Knowledge Library", fill="#64748B", font=_get_font(12))

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_pdf_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate a first-page visual preview from a PDF file."""
    # 1. Try pypdfium2 if installed
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(file_bytes)
        if len(pdf) > 0:
            page = pdf[0]
            pil_img = page.render(scale=1.5).to_pil()
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG", optimize=True)
            return buf.getvalue()
    except Exception:
        pass

    # 2. Extract text if possible from PDF stream
    extracted_text = []
    try:
        # Regex pattern for PDF text blocks
        matches = re.findall(r'\((.*?)\)\s*Tj', file_bytes.decode('latin1', errors='ignore'))
        extracted_text = [m.strip() for m in matches if len(m.strip()) > 3]
    except Exception:
        pass

    # 3. Render clean PDF first-page cover sheet (600 x 800)
    width, height = 600, 800
    img = Image.new("RGB", (width, height), color="#F8FAFC")
    draw = ImageDraw.Draw(img)

    paper_margin = 28
    draw.rectangle([(paper_margin + 4, paper_margin + 4), (width - paper_margin + 4, height - paper_margin + 4)], fill="#E2E8F0")
    draw.rectangle([(paper_margin, paper_margin), (width - paper_margin, height - paper_margin)], fill="#FFFFFF", outline="#CBD5E1", width=1)

    # Red Top Banner for PDF
    draw.rectangle([(paper_margin, paper_margin), (width - paper_margin, paper_margin + 6)], fill="#DC2626")

    # PDF Badge
    draw.rectangle([(paper_margin + 30, paper_margin + 30), (paper_margin + 110, paper_margin + 54)], fill="#FEF2F2")
    draw.text((paper_margin + 42, paper_margin + 36), "PDF DOC", fill="#DC2626", font=_get_font(12, bold=True))

    # Title
    title_font = _get_font(22, bold=True)
    clean_title = title or "PDF Document"
    title_lines = _wrap_text(clean_title, max_chars=32, max_lines=3)
    y_cursor = paper_margin + 75
    for t_line in title_lines:
        draw.text((paper_margin + 30, y_cursor), t_line, fill="#0F172A", font=title_font)
        y_cursor += 30

    y_cursor += 10
    draw.line([(paper_margin + 30, y_cursor), (width - paper_margin - 30, y_cursor)], fill="#E2E8F0", width=2)
    y_cursor += 25

    # Decorative page text layout & excerpt
    body_font = _get_font(13)
    sample_text = " ".join(extracted_text[:15]) if extracted_text else "This official PDF document contains verified organisational knowledge, architectural standards, guidelines, and reference procedures."
    body_lines = _wrap_text(sample_text, max_chars=48, max_lines=12)
    for b_line in body_lines:
        draw.text((paper_margin + 30, y_cursor), b_line, fill="#475569", font=body_font)
        y_cursor += 22

    # Draw simulated paragraph skeleton bars
    for _ in range(4):
        if y_cursor < height - paper_margin - 80:
            draw.rounded_rectangle([(paper_margin + 30, y_cursor), (width - paper_margin - 60, y_cursor + 10)], radius=3, fill="#F1F5F9")
            y_cursor += 18

    # Bottom Page Footer
    draw.line([(paper_margin + 30, height - paper_margin - 40), (width - paper_margin - 30, height - paper_margin - 40)], fill="#F1F5F9", width=1)
    draw.text((paper_margin + 30, height - paper_margin - 30), "Knowledge Library • Page 1 of PDF", fill="#94A3B8", font=_get_font(11))
    draw.text((width - paper_margin - 80, height - paper_margin - 30), "Page 1", fill="#94A3B8", font=_get_font(11))

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
        # Generic document cover
        thumb_bytes = generate_docx_thumbnail(file_bytes, title)
        
    return thumb_bytes, "image/png"
