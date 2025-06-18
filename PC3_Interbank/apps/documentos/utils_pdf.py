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

def insertar_firmas_en_pdf(pdf_path, firmas, output_path):
    """
    Inserta todas las firmas visuales en sus posiciones en el PDF.
    firmas: lista de objetos Firma con firma_imagen y posicion.
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        packet = BytesIO()
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        if page_width <= 0 or page_height <= 0:
            raise Exception(f"Tamaño de página inválido: width={page_width}, height={page_height}")

        can = canvas.Canvas(packet, pagesize=(page_width, page_height))

        # Dibuja todas las firmas que correspondan a esta página
        for firma in firmas:
            if firma.posicion and int(firma.posicion.get('page', 1)) == (i + 1) and firma.firma_imagen:
                firma_imagen_path = firma.firma_imagen.path
                x = float(firma.posicion.get('x', 0))
                y = float(firma.posicion.get('y', 0))
                can.drawImage(firma_imagen_path, x, y, width=120, height=60, mask='auto')

        can.showPage()
        can.save()
        packet.seek(0)
        overlay_pdf = PdfReader(packet)
        if not overlay_pdf.pages:
            raise Exception("El overlay PDF generado no tiene páginas. Revisa el tamaño del canvas y el flujo.")
        page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)

    with open(output_path, "wb") as f_out:
        writer.write(f_out)

def generar_pagina_trazabilidad_multiple(trazabilidad_lista):
    from reportlab.lib.pagesizes import letter
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, 750, "Trazabilidad de las firmas electrónicas:")

    y = 700
    for idx, t in enumerate(trazabilidad_lista, 1):
        qr_x = 40
        qr_y = y - 10
        qr_size = 80
        text_x = qr_x + qr_size + 20  # Espacio a la derecha del QR
        text_y = y

        # Dibuja el QR
        if t.get("QR"):
            qr_img = ImageReader(t["QR"])
            c.drawImage(qr_img, qr_x, qr_y - qr_size + 10, width=qr_size, height=qr_size)

        # Dibuja el texto alineado con la parte superior del QR
        c.setFont("Helvetica-Bold", 14)
        c.drawString(text_x, text_y, f"Firma #{idx}:")
        text_y -= 20
        c.setFont("Helvetica", 12)
        for k, v in t.items():
            if k in ["QR", "Firma visual"]:
                continue
            c.drawString(text_x, text_y, f"{k}: {v}")
            text_y -= 16

        # Firma visual debajo del texto, alineada con el texto
        if t.get("Firma visual"):
            firma_img = ImageReader(t["Firma visual"])
            c.drawImage(firma_img, text_x, text_y-10, width=120, height=60, mask='auto')
            text_y -= 70

        # Calcula el espacio usado y ajusta y para la siguiente firma
        y = min(qr_y - qr_size, text_y) - 30
        if y < 120:
            c.showPage()
            y = 750

    c.save()
    buffer.seek(0)
    return buffer