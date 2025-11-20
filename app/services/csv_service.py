import csv
from io import StringIO
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models import Product
import chardet


# ============================================================
#    CONSTRUTOR DA ÁRVORE HIERÁRQUICA (BOM)
# ============================================================
def build_hierarchy(flat_rows):
    nodes = {}
    root = []

    for row in flat_rows:
        # Normaliza nomes das colunas
        code = (
            row.get("Nº ") or
            row.get("Nº") or
            row.get("numero") or
            row.get("Numero") or
            None
        )

        if not code:
            continue

        parts = code.split(".")
        level = len(parts)

        node = {
            "code": code,
            "name": row.get("Nome da Peça", "").strip(),
            "qtd": row.get("QTD.", "").strip(),
            "referencia": row.get("REFERÊNCIA", "").strip(),
            "material": row.get("MATERIAL", "").strip(),
            "compr": row.get("COMPR", "").strip(),
            "peso": row.get("Peso", "").strip(),
            "children": []
        }

        nodes[code] = node

        if level == 1:
            root.append(node)
        else:
            parent_code = ".".join(parts[:-1])
            parent = nodes.get(parent_code)

            if parent:
                parent["children"].append(node)

    return root


# ============================================================
#    PROCESSAMENTO SIMPLES PARA IMPORTAÇÃO DE PRODUTOS
# ============================================================
async def process_csv(file: UploadFile, db: Session):
    """
    Processamento simples — usado apenas se você realmente quiser
    criar objetos direto no banco.
    """

    try:
        raw = await file.read()
        detected = chardet.detect(raw)
        encoding = detected["encoding"] or "utf-8"
        decoded = raw.decode(encoding, errors="replace")
    except Exception:
        raise HTTPException(status_code=400, detail="Erro ao ler arquivo CSV")

    reader = csv.DictReader(
        StringIO(decoded),
        delimiter=';',
        skipinitialspace=True
    )

    processed = 0
    errors = []

    for line_number, row in enumerate(reader, start=2):
        try:
            # Ajuste conforme seu Product atual
            db_prod = Product(
                name=row.get("Nome da Peça", "Sem Nome"),
                code=row.get("REFERÊNCIA", ""),
                description=row.get("MATERIAL", "")
            )

            db.add(db_prod)
            processed += 1

        except Exception as e:
            errors.append({
                "line": line_number,
                "row": row,
                "error": str(e)
            })

    db.commit()

    return {
        "lines_processed": processed,
        "errors": errors
    }


# ============================================================
#    PROCESSAMENTO DEBUG COM HIERARQUIA (PARA BOM)
# ============================================================
async def process_csv_debug(file: UploadFile):
    """
    Usado para testes e debug — retorna:
    - encoding detectado
    - hierarquia completa
    - nome do produto
    - filename
    """

    try:
        raw = await file.read()
        detected = chardet.detect(raw)
        encoding = detected["encoding"] or "utf-8"
        decoded = raw.decode(encoding, errors="replace")

    except Exception:
        raise HTTPException(status_code=400, detail="Erro ao ler o arquivo CSV.")

    reader = csv.DictReader(
        StringIO(decoded),
        delimiter=';',
        skipinitialspace=True
    )

    flat_rows = [row for row in reader]
    hierarchy = build_hierarchy(flat_rows)
    product_name = file.filename.replace(".csv", "")

    return {
        "product_name": product_name,
        "filename": file.filename,
        "detected_encoding": encoding,
        "total_items": len(flat_rows),
        "components": hierarchy
    }
