import qrcode
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
import base64

def generar_pagina_trazabilidad(qr_data, trazabilidad_dict):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    # Generar QR
    qr_img = qrcode.make(qr_data)
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    from reportlab.lib.utils import ImageReader
    qr_img_reader = ImageReader(qr_buffer)

    # Dibuja el QR a la izquierda
    qr_x, qr_y = 50, 500
    c.drawImage(qr_img_reader, qr_x, qr_y, width=120, height=120)

    # Escribe el título arriba
    c.setFont("Helvetica", 12)
    c.drawString(50, 650, "Trazabilidad de la firma electrónica:")

    # Escribe los datos a la derecha del QR
    text_x = qr_x + 140
    text_y = qr_y + 100
    for key, value in trazabilidad_dict.items():
        c.drawString(text_x, text_y, f"{key}: {value}")
        text_y -= 20

    c.save()
    buffer.seek(0)
    return buffer

def agregar_pagina_al_final(pdf_path, pagina_buffer, output_path):
    """
    Agrega la página (BytesIO) al final del PDF original.
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    # Copia todas las páginas originales
    for page in reader.pages:
        writer.add_page(page)

    # Agrega la página de trazabilidad
    trazabilidad_pdf = PdfReader(pagina_buffer)
    writer.add_page(trazabilidad_pdf.pages[0])

    # Guarda el nuevo PDF
    with open(output_path, "wb") as f_out:
        writer.write(f_out)

def insertar_firma_en_pdf(pdf_path, firma_base64, posicion, output_path):
    """
    Inserta la imagen de la firma en la página y posición indicadas del PDF.
    - pdf_path: ruta del PDF original
    - firma_base64: imagen base64 de la firma
    - posicion: dict con 'page', 'x', 'y'
    - output_path: ruta donde guardar el PDF firmado
    """
    # 1. Decodifica la imagen base64
    format, imgstr = firma_base64.split(';base64,')
    img_bytes = base64.b64decode(imgstr)
    firma_img = ImageReader(BytesIO(img_bytes))

    # 2. Lee el PDF original
    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    # 3. Para cada página, copia o inserta la firma si corresponde
    for i, page in enumerate(reader.pages):
        packet = BytesIO()
        # Usa el tamaño real de la página
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))

        # Si es la página seleccionada, dibuja la firma
        if (i + 1) == int(posicion.get('page', 1)):
            x = float(posicion.get('x', 0))
            y = float(posicion.get('y', 0))
            # Ajusta el tamaño de la firma visual aquí si lo deseas
            can.drawImage(firma_img, x, y, width=120, height=60, mask='auto')

        can.save()
        packet.seek(0)
        overlay_pdf = PdfReader(packet)
        page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)

    # 4. Guarda el PDF firmado
    with open(output_path, "wb") as f_out:
        writer.write(f_out)