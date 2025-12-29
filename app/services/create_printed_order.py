from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from datetime import datetime

def formatar_data(data_iso):
    if not data_iso:
        return "-"
    return datetime.fromisoformat(data_iso).strftime("%d/%m/%Y %H:%M")

def gerar_ordem_producao(pdf_path: str, op: dict):
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle(
        name="Title",
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=20
    )

    header_style = ParagraphStyle(
        name="Header",
        fontSize=11,
        spaceAfter=8,
        spaceBefore=12,
        textColor=colors.darkblue
    )

    # 📌 TÍTULO
    elements.append(Paragraph("ORDEM DE PRODUÇÃO", title_style))
    elements.append(Spacer(1, 12))

    # 📌 DADOS DA ORDEM
    elements.append(Paragraph("Dados da Ordem", header_style))

    order_data = [
        ["Código da OP", op["code"]],
        ["Status", op["status"].upper()],
        ["Quantidade Planejada", f'{op["planned_quantity"]}'],
        ["Quantidade Produzida", f'{op["produced_quantity"]}'],
        ["Data de Criação", formatar_data(op["created_at"])],
    ]

    table = Table(order_data, colWidths=[160, 320])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("BACKGROUND", (0,0), (0,-1), colors.whitesmoke),
        ("FONT", (0,0), (0,-1), "Helvetica-Bold")
    ]))
    elements.append(table)

    # 📌 DADOS DO PRODUTO
    product = op["product"]
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Produto", header_style))

    product_data = [
        ["Código", product["code"]],
        ["Nome", product["name"]],
    ]

    table = Table(product_data, colWidths=[160, 320])
    table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("BACKGROUND", (0,0), (0,-1), colors.whitesmoke),
        ("FONT", (0,0), (0,-1), "Helvetica-Bold")
    ]))
    elements.append(table)

    # 📌 LISTA DE MATERIAIS (BOM)
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Lista de Materiais (BOM)", header_style))

    bom_data = [
        ["Item", "Produto Filho", "Qtd Base", "Qtd Efetiva", "OP Gerada"]
    ]

    for i, bom in enumerate(product["bom_children"], start=1):
        bom_data.append([
            i,
            bom["child_id"],
            bom["quantity"],
            bom["effective_quantity"],
            bom["production_order_code"]
        ])

    bom_table = Table(bom_data, colWidths=[50, 100, 90, 90, 150])
    bom_table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("FONT", (0,0), (-1,0), "Helvetica-Bold"),
        ("ALIGN", (2,1), (-2,-1), "CENTER")
    ]))
    elements.append(bom_table)

    # 📌 OBSERVAÇÕES
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Observações", header_style))
    elements.append(Paragraph(op.get("notes", "-"), styles["Normal"]))

    # 📌 RODAPÉ
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        ParagraphStyle(name="Footer", fontSize=8, alignment=TA_CENTER)
    ))

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    doc.build(elements)
