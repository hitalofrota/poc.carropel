from sqlalchemy.orm import Session
from app.models import Product, ProductBOM


def create_product_from_node(node: dict, db: Session) -> Product:
    """
    Cria um Product a partir de um nó da hierarquia JSON.
    """

    product = Product(
        name=node.get("name") or "Sem Nome",
        code=node.get("referencia") or node.get("code"),
        description=node.get("material") or "",
        net_weight=float(node["peso"]) if node.get("peso") not in [None, ""] else None,
    )

    db.add(product)
    db.flush()  # garante que product.id existe

    return product


def create_bom_tree(parent_product: Product, children: list, db: Session):
    """
    Cria todos os subprodutos + vínculos BOM recursivamente.
    """

    for child in children:
        # cria o produto do nó filho
        child_product = create_product_from_node(child, db)

        # cria BOM (vínculo)
        bom = ProductBOM(
            parent_id=parent_product.id,
            child_id=child_product.id,
            quantity=float(child["qtd"]) if child.get("qtd") else 1
        )
        db.add(bom)

        # chamada recursiva pros filhos do filho
        if child.get("children"):
            create_bom_tree(child_product, child["children"], db)


def import_full_product_with_bom(hierarchy_json: dict, db: Session):
    """
    RECEBE O JSON DO DEBUG E CRIA O PRODUTO + TODA A ESTRUTURA BOM
    """

    # produto raiz
    root_product = Product(
        name=hierarchy_json["product_name"],
        code=hierarchy_json["product_name"].upper().replace(" ", "_"),
        description=f"Importado do arquivo {hierarchy_json['filename']}"
    )

    db.add(root_product)
    db.flush()

    # processa cada componente de nível 1
    for component in hierarchy_json["components"]:
        child_product = create_product_from_node(component, db)

        bom = ProductBOM(
            parent_id=root_product.id,
            child_id=child_product.id,
            quantity=float(component["qtd"]) if component.get("qtd") else 1
        )
        db.add(bom)

        if component.get("children"):
            create_bom_tree(child_product, component["children"], db)

    # finaliza
    db.commit()
    db.refresh(root_product)

    return root_product
