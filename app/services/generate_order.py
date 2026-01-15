from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Spacer,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.graphics.barcode import code128


def service_production_order_pdf(order) -> bytes:
    # ================== HELPERS ==================
    def txt(value):
        return "-" if value is None else str(value)

    def date_fmt(value):
        return value.strftime("%d/%m/%Y") if value else "-"

    # ================== DOCUMENTO ==================
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ================== ESTILOS ==================
    title = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontSize=14,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )

    header_right = ParagraphStyle(
        "HeaderRight",
        parent=styles["Normal"],
        fontSize=8,
        alignment=TA_RIGHT,
    )

    label = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica-Bold",
    )

    value = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontSize=9,
    )

    section = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=6,
    )

    # ================== CABEÇALHO ==================
    logo = Image(
        "app/services/LOGO-CARROPEL.png",
        width=4 * cm,
        height=2 * cm,
        kind="proportional",
    )

    header = Table(
        [[
            logo,
            Paragraph("ORDEM DE PRODUÇÃO<br/>", title),
            Paragraph(datetime.now().strftime("%d/%m/%Y %H:%M"), header_right),
        ]],
        colWidths=[150, 250, 150],
    )

    header.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(header)
    elements.append(Spacer(1, 10))

    # ================== DADOS DO PEDIDO ==================
    product_name = order.product.name if order.product else "-"

    data_table = Table(
        [
            [
                Paragraph("Código do Pedido:", label),
                Paragraph(txt(order.sales_order.id), value),
                Paragraph("Cliente:", label),
                Paragraph(txt(order.sales_order.customer), value),
                Paragraph("Data da Entrega:", label),
                Paragraph(date_fmt(order.sales_order.delivery_date), value),
            ],
            [
                Paragraph("Observações:", label),
                Paragraph(txt(order.sales_order.notes), value),
                Paragraph("", label),
                Paragraph("", value),
                Paragraph("Data do Produto:", label),
                Paragraph(date_fmt(order.sales_order.order_date), value),
            ],
        ],
        colWidths=[80, 170, 70, 80, 70, 80],
    )

    data_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    elements.append(data_table)
    elements.append(Spacer(1, 14))

    # ================== DADOS DA ORDEM ==================
    data_table = Table(
        [
            [
                Paragraph("Ordem:", label),
                Paragraph(txt(order.code), value),
                Paragraph("Quantidade:", label),
                Paragraph(f"{order.planned_quantity:.2f}", value),
                Paragraph("Início:", label),
                Paragraph(date_fmt(order.start_date), value),
            ],
            [
                Paragraph("Produto:", label),
                Paragraph(product_name, value),
                Paragraph("Status:", label),
                Paragraph(txt(order.status.value), value),
                Paragraph("Emissão:", label),
                Paragraph(date_fmt(order.created_at), value),
            ],
        ],
        colWidths=[70, 200, 70, 70, 70, 70],
    )

    data_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    elements.append(data_table)
    elements.append(Spacer(1, 14))

    # ================== BOM ==================
    bom_items = order.product.bom_children if order.product else []

    if bom_items:
        elements.append(Paragraph("Lista de Materiais (BOM)", section))

        bom_data = [[
            "Nome",
            "Código",
            "Qtd Unitária",
            "Qtd Necessária",
        ]]

        for item in bom_items:
            effective_qty = (
                item.quantity * order.planned_quantity
                if order.planned_quantity else None
            )

            bom_data.append([
                txt(item.child.name if item.child else None),
                txt(item.child.code if item.child else None),
                f"{item.quantity:.2f}",
                f"{effective_qty:.2f}" if effective_qty else "-",
            ])

        bom_table = Table(
            bom_data,
            colWidths=[250, 140, 80, 80],
            repeatRows=1,
        )

        bom_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))

        elements.append(bom_table)
        elements.append(Spacer(1, 20))

    # ================== CÓDIGO DE BARRAS ==================
    barcode = code128.Code128(
        order.code,
        barHeight=3 * cm,
        barWidth=1.2,
        humanReadable=True,
    )

    barcode_table = Table([[barcode]], colWidths=[None])
    barcode_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 20),
    ]))

    section_center = ParagraphStyle(
        "SectionCenter",
        parent=section,
        alignment=TA_CENTER,
    )
    elements.append(Paragraph("Código da Ordem", section_center))

    elements.append(barcode_table)

    # ================== RODAPÉ ==================
    elements.append(Spacer(1, 30))
    elements.append(
        Paragraph(
            f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            styles["Italic"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
