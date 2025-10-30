from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.graphics.barcode import code128
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode import createBarcodeDrawing
import json

from extract_data import extract_data
from generate_data import generate_data_json

def generate_report(op, name):
    # ===== Configuração do PDF =====
    doc = SimpleDocTemplate(name, pagesize=A4,
                            leftMargin=40, rightMargin=40, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    elements = []

    # ===== LOGOMARCA =====
    logo_path = "logo.png"  # ajuste para o caminho correto da sua logo
    try:
        logo = Image(logo_path, width=300, height=60)
        logo.hAlign = 'CENTER'
        elements.append(logo)
    except Exception:
        elements.append(Paragraph("Indústria - Logotipo não encontrado", styles["Normal"]))

    elements.append(Spacer(1, 10))

    # ===== Cabeçalho =====
    header_data = [
        [Paragraph(f"<b>Ordem de Produção:</b> {op['ordem_id']}", styles["Normal"]),
        Paragraph(f"<b>Data:</b> {op['data_emissao']}", styles["Normal"])],
        [Paragraph(f"<b>Empresa:</b> {op['empresa']}", styles["Normal"]),
        ""]
    ]

    header_table = Table(header_data, colWidths=[280, 180])
    header_table.setStyle(TableStyle([
        ("BOX", (0,0), (-1,-1), 1, colors.black),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BACKGROUND", (0,0), (-1,0), colors.whitesmoke)
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 12))

    # ===== Informações do item =====
    info_data = [
        [Paragraph(f"<b>Item:</b> {op['item']}", styles["Normal"]),
        Paragraph(f"<b>Quantidade:</b> {op['quantidade']}", styles["Normal"])],
        [Paragraph(f"<b>Necessidade:</b> {op['necessidade']}", styles["Normal"]),
        Paragraph(f"<b>Peso liq:</b> {op['peso_liquido']}", styles["Normal"])],
        [Paragraph(f"<b>Descrição:</b> {op['descricao']}", styles["Normal"]),
        Paragraph(f"<b>Ref. Desenho:</b> {op['ref']}", styles["Normal"])]
    ]

    info_table = Table(info_data, colWidths=[280, 180])
    info_table.setStyle(TableStyle([
        ("BOX", (0,0), (-1,-1), 1, colors.black),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey)
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # # ===== Parâmetros =====
    # elements.append(Paragraph("<b>Parâmetros</b>", styles["Heading4"]))
    # param_table_data = [["Valor", "Parâmetro"]] + [
    #     [p["valor"], p["parametro"]] for p in op["parametros"]
    # ]
    # param_table = Table(param_table_data, colWidths=[150, 310])
    # param_table.setStyle(TableStyle([
    #     ("GRID", (0,0), (-1,-1), 0.5, colors.black),
    #     ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
    #     ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    # ]))
    # elements.append(param_table)
    # elements.append(Spacer(1, 12))

    # ===== Roteiro de Produção =====
    elements.append(Paragraph("<b>Roteiro de Produção</b>", styles["Heading4"]))
    roteiro_data = [["Seq", "Operação"]] + [
        [r["seq"], r["operacao"]] for r in op["roteiro"]
    ]
    roteiro_table = Table(roteiro_data, colWidths=[50, 410])
    roteiro_table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.black),
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ]))
    elements.append(roteiro_table)
    elements.append(Spacer(1, 12))

    # ===== Insumos =====
    elements.append(Paragraph("<b>Insumos</b>", styles["Heading4"]))
    insumos_data = [["Código", "Descrição", "Peso Liquído", "Peso Bruto","Lote"]] + [
        [i["codigo"], i["descricao"], i["peso"]]
        for i in op["insumos"]
    ]
    insumos_table = Table(insumos_data, colWidths=[60, 160, 80, 80, 80, 60, 55])
    insumos_table.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.black),
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("ALIGN", (2,1), (-1,-1), "LEFT")
    ]))
    elements.append(insumos_table)
    elements.append(Spacer(1, 20))

    # ===== Código de Barras =====
    barcode_value = op["ordem_id"]
    barcode_draw = createBarcodeDrawing(
        'Code128',
        value=barcode_value,
        barHeight=40,
        barWidth=1.2,
        humanReadable=True  # mostra o texto abaixo do código
    )
    barcode_draw.hAlign = 'CENTER'
    elements.append(barcode_draw)


    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Emitido automaticamente pelo sistema de produção.", styles["Italic"]))

    # ===== Geração do PDF =====
    doc.build(elements)
    print(f"✅ PDF gerado com sucesso: {name}")

# ===== Extração e Geração dos Dados =====
path_csv = 'projeto-zenite/LISTA_COCHO.csv'
df = extract_data(path_csv)
extraction = generate_data_json(df)
json_string = json.dumps(extraction, indent=4, ensure_ascii=False)
print(json_string)
data = json_string


ops = json.loads(data)

for op in ops:
    name = f"ordem_producao_{op['ordem_id']}.pdf"
    generate_report(op, name)

