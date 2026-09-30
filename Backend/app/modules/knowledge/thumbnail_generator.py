import io
import re
import struct
import zlib
import zipfile
from typing import Optional, Tuple, List

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def _create_fallback_png(width: int = 700, height: int = 950) -> bytes:
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
    font_candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segoeuib.ttf" if bold else "segoeui.ttf",
        "calibrib.ttf" if bold else "calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for candidate in font_candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            continue
    return ImageFont.load_default()

def _wrap_text(text: str, max_chars: int = 45, max_lines: int = 5) -> List[str]:
    words = (text or "").split()
    lines = []
    current_line = []
    current_len = 0
    for w in words:
        if current_len + len(w) + 1 <= max_chars:
            current_line.append(w)
            current_len += len(w) + 1
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [w]
            current_len = len(w)
            if len(lines) >= max_lines:
                break
    if current_line and len(lines) < max_lines:
        lines.append(" ".join(current_line))
    return lines

def generate_pdf_cover(title: str, text_sample: str = "") -> bytes:
    width, height = 750, 1000
    img = Image.new("RGB", (width, height), color="#FFFFFF")
    draw = ImageDraw.Draw(img)
    margin = 55

    # Outer border
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline="#E2E8F0", width=2)
    # Crimson top banner line
    draw.rectangle([(0, 0), (width, 8)], fill="#DC2626")

    # PDF Badge
    badge_x, badge_y = margin, 40
    badge_w, badge_h = 56, 56
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=12, fill="#DC2626")
    badge_font = _get_font(20, bold=True)
    draw.text((badge_x + 9, badge_y + 16), "PDF", fill="#FFFFFF", font=badge_font)

    # Document type tag
    type_font = _get_font(13, bold=True)
    draw.text((badge_x + badge_w + 16, badge_y + 10), "PORTABLE DOCUMENT FORMAT", fill="#DC2626", font=type_font)
    sub_tag_font = _get_font(12)
    draw.text((badge_x + badge_w + 16, badge_y + 32), "Official PDF Document • Page 1 Preview", fill="#64748B", font=sub_tag_font)

    # Header divider
    draw.line([(margin, 120), (width - margin, 120)], fill="#E2E8F0", width=1)

    # Document Title
    y_cursor = 155
    title_font = _get_font(28, bold=True)
    title_lines = _wrap_text(title or "PDF Document", max_chars=36, max_lines=3)
    for line in title_lines:
        draw.text((margin, y_cursor), line, fill="#0F172A", font=title_font)
        y_cursor += 38

    y_cursor += 20
    # Accent decorative bar under title
    draw.rectangle([(margin, y_cursor), (margin + 60, y_cursor + 3)], fill="#DC2626")
    y_cursor += 35

    # Content or preview body
    body_font = _get_font(14)
    content = text_sample or "This document contains verified enterprise knowledge, architectural specifications, guidelines, and operational procedures."
    body_lines = _wrap_text(content, max_chars=56, max_lines=12)
    for bl in body_lines:
        if y_cursor < height - 120:
            draw.text((margin, y_cursor), bl, fill="#334155", font=body_font)
            y_cursor += 24

    # Simulated document skeleton lines
    y_cursor = max(y_cursor + 30, 480)
    while y_cursor < height - 120:
        bar_w = width - (margin * 2)
        draw.rounded_rectangle([(margin, y_cursor), (margin + bar_w, y_cursor + 12)], radius=6, fill="#F1F5F9")
        y_cursor += 24

    # Document footer
    draw.line([(margin, height - 60), (width - margin, height - 60)], fill="#E2E8F0", width=1)
    footer_font = _get_font(12)
    draw.text((margin, height - 44), "Adobe PDF Document • Knowledge Library", fill="#94A3B8", font=footer_font)
    draw.text((width - margin - 50, height - 44), "Page 1", fill="#94A3B8", font=footer_font)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_pdf_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate the exact first-page visual render from a PDF file using pypdfium2."""
    if file_bytes and len(file_bytes) > 0:
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
            print("pypdfium2 render note:", e)

    # Extract text from PDF stream if possible
    extracted_text = []
    if file_bytes and len(file_bytes) > 0:
        try:
            matches = re.findall(r'\((.*?)\)\s*Tj', file_bytes.decode('latin1', errors='ignore'))
            extracted_text = [m.strip() for m in matches if len(m.strip()) > 3]
        except Exception:
            pass

    sample = " ".join(extracted_text[:25]) if extracted_text else ""
    return generate_pdf_cover(title, sample)

def generate_docx_cover(title: str, text_sample: str = "", embedded_image_bytes: Optional[bytes] = None) -> bytes:
    width, height = 750, 1000
    img = Image.new("RGB", (width, height), color="#FFFFFF")
    draw = ImageDraw.Draw(img)
    margin = 55

    # Outer border
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline="#E2E8F0", width=2)
    # Word blue top banner line
    draw.rectangle([(0, 0), (width, 8)], fill="#2563EB")

    # Word Badge
    badge_x, badge_y = margin, 40
    badge_w, badge_h = 56, 56
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=12, fill="#2563EB")
    badge_font = _get_font(26, bold=True)
    draw.text((badge_x + 14, badge_y + 12), "W", fill="#FFFFFF", font=badge_font)

    # Document type tag
    type_font = _get_font(13, bold=True)
    draw.text((badge_x + badge_w + 16, badge_y + 10), "MICROSOFT WORD DOCUMENT", fill="#2563EB", font=type_font)
    sub_tag_font = _get_font(12)
    draw.text((badge_x + badge_w + 16, badge_y + 32), ".DOCX • Document First Page Preview", fill="#64748B", font=sub_tag_font)

    # Header divider
    draw.line([(margin, 120), (width - margin, 120)], fill="#E2E8F0", width=1)

    # Document Title
    y_cursor = 155
    title_font = _get_font(28, bold=True)
    title_lines = _wrap_text(title or "Word Document", max_chars=36, max_lines=3)
    for line in title_lines:
        draw.text((margin, y_cursor), line, fill="#0F172A", font=title_font)
        y_cursor += 38

    y_cursor += 20
    # Accent decorative bar under title
    draw.rectangle([(margin, y_cursor), (margin + 60, y_cursor + 3)], fill="#2563EB")
    y_cursor += 35

    # If embedded image exists in DOCX, paste it
    if embedded_image_bytes:
        try:
            emb_img = Image.open(io.BytesIO(embedded_image_bytes)).convert("RGB")
            emb_img.thumbnail((width - (margin * 2), 220))
            img.paste(emb_img, (margin, y_cursor))
            y_cursor += emb_img.height + 25
        except Exception:
            pass

    # Content or preview body
    body_font = _get_font(14)
    content = text_sample or "This Microsoft Word document contains structured specifications, operational workflows, and knowledge documentation."
    body_lines = _wrap_text(content, max_chars=56, max_lines=12)
    for bl in body_lines:
        if y_cursor < height - 120:
            draw.text((margin, y_cursor), bl, fill="#334155", font=body_font)
            y_cursor += 24

    # Simulated document skeleton lines
    y_cursor = max(y_cursor + 30, 480)
    while y_cursor < height - 120:
        bar_w = width - (margin * 2)
        draw.rounded_rectangle([(margin, y_cursor), (margin + bar_w, y_cursor + 12)], radius=6, fill="#F1F5F9")
        y_cursor += 24

    # Document footer
    draw.line([(margin, height - 60), (width - margin, height - 60)], fill="#E2E8F0", width=1)
    footer_font = _get_font(12)
    draw.text((margin, height - 44), "Microsoft Word • Knowledge Document", fill="#94A3B8", font=footer_font)
    draw.text((width - margin - 50, height - 44), "Page 1", fill="#94A3B8", font=footer_font)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_docx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract the actual first-page visual preview from a DOCX file."""
    if not file_bytes:
        return generate_docx_cover(title)

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

    doc_title = title or (doc_text_parts[0] if doc_text_parts else "Document")
    raw_body = " ".join(doc_text_parts[1:35]) if len(doc_text_parts) > 1 else ""
    return generate_docx_cover(doc_title, raw_body, embedded_image_bytes)

def generate_pptx_cover(title: str, bullets: Optional[List[str]] = None) -> bytes:
    # 16:9 Modern Presentation Slide (960 x 540)
    width, height = 960, 540
    img = Image.new("RGB", (width, height), color="#0B1120")
    draw = ImageDraw.Draw(img)
    margin = 60

    # Presentation outer border
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline="#1E293B", width=2)
    # PowerPoint orange top accent bar
    draw.rectangle([(0, 0), (width, 6)], fill="#EA580C")

    # Header Row
    badge_x, badge_y = margin, 45
    badge_w, badge_h = 48, 48
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=10, fill="#EA580C")
    badge_font = _get_font(24, bold=True)
    draw.text((badge_x + 14, badge_y + 10), "P", fill="#FFFFFF", font=badge_font)

    # Deck Label
    tag_font = _get_font(12, bold=True)
    draw.text((badge_x + badge_w + 14, badge_y + 8), "POWERPOINT PRESENTATION", fill="#FB923C", font=tag_font)
    sub_tag_font = _get_font(11)
    draw.text((badge_x + badge_w + 14, badge_y + 28), "Slide Deck • 16:9 Widescreen", fill="#64748B", font=sub_tag_font)

    # Right side slide badge
    slide_badge_w, slide_badge_h = 90, 28
    slide_badge_x = width - margin - slide_badge_w
    draw.rounded_rectangle([(slide_badge_x, badge_y + 10), (slide_badge_x + slide_badge_w, badge_y + 10 + slide_badge_h)], radius=14, fill="#1E293B")
    draw.text((slide_badge_x + 14, badge_y + 16), "SLIDE 1", fill="#F8FAFC", font=_get_font(11, bold=True))

    # Divider line
    draw.line([(margin, 115), (width - margin, 115)], fill="#1E293B", width=1)

    # Slide Title
    y_cursor = 150
    title_font = _get_font(32, bold=True)
    title_lines = _wrap_text(title or "Presentation Slide Deck", max_chars=38, max_lines=2)
    for line in title_lines:
        draw.text((margin, y_cursor), line, fill="#F8FAFC", font=title_font)
        y_cursor += 44

    y_cursor += 15
    # Accent indicator bar
    draw.rectangle([(margin, y_cursor), (margin + 45, y_cursor + 4)], fill="#EA580C")
    y_cursor += 30

    # Bullets / Content
    if not bullets:
        bullets = [
            "Executive overview and high-level architecture details",
            "Key takeaways, structural diagrams, and implementation roadmap",
            "Designed for cross-functional collaboration and knowledge sharing",
        ]

    bullet_font = _get_font(14)
    for b in bullets[:4]:
        if y_cursor < height - 80:
            # Orange bullet dot
            draw.ellipse([(margin, y_cursor + 5), (margin + 8, y_cursor + 13)], fill="#EA580C")
            draw.text((margin + 20, y_cursor), b[:75], fill="#CBD5E1", font=bullet_font)
            y_cursor += 34

    # Footer
    draw.line([(margin, height - 50), (width - margin, height - 50)], fill="#1E293B", width=1)
    footer_font = _get_font(11)
    draw.text((margin, height - 36), "Microsoft PowerPoint • Knowledge Presentation Deck", fill="#64748B", font=footer_font)
    draw.text((width - margin - 120, height - 36), "Executive Slides", fill="#64748B", font=footer_font)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def generate_pptx_thumbnail(file_bytes: bytes, title: str) -> bytes:
    """Generate or extract the actual first-slide visual preview from a PPTX file."""
    if not file_bytes:
        return generate_pptx_cover(title)

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

    slide_title = (slide_texts[0] if slide_texts else "") or title or "Presentation Deck"
    bullets = slide_texts[1:5] if len(slide_texts) > 1 else None
    return generate_pptx_cover(slide_title, bullets)

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
