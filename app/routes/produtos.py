from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import UniqueViolation

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles
from typing import Optional, Any, Dict, List
from app.services.bom_importer import import_full_product_with_bom

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager", "admin"))])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):

    # Normalização robusta do code
    normalized_code = (
        product.code
        .strip()               # remove espaços
        .replace("\u00A0", "") # remove espaço não quebrável (muito comum em CSV)
        .upper()               # opcional: garante casing consistente
    )

    try:
        new_product = models.Product(
            **product.dict(exclude_unset=True),
            code=normalized_code
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product

    except IntegrityError as e:
        db.rollback()
        # Se for realmente violação de unique
        if isinstance(e.orig, UniqueViolation):
            raise HTTPException(
                status_code=400,
                detail=f"Product code '{normalized_code}' already exists"
            )
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list[schemas.ProductResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@router.get("/roots", response_model=list[schemas.ProductResponse], dependencies=[Depends(allow_roles("manager", "admin", "viewer"))])
def get_root_products(db: Session = Depends(get_db)):
    root_products = (
        db.query(models.Product)
        .filter(
            ~db.query(models.ProductBOM)
            .filter(models.ProductBOM.child_id == models.Product.id)
            .exists()
        )
        .all()
    )
    return root_products

@router.get("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", dependencies=[Depends(allow_roles("manager","admin"))] )
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"detail": "Product successfully deleted"}


# -------------------- Helpers para BOM e árvore --------------------

def _get_product_by_identifier(db: Session, child_id: Optional[int], child_code: Optional[str]) -> models.Product:
    if child_id:
        child = db.query(models.Product).filter(models.Product.id == child_id).first()
        if not child:
            raise HTTPException(status_code=400, detail="Child product (by id) not found")
        return child
    if child_code:
        child = db.query(models.Product).filter(models.Product.code == child_code).first()
        if not child:
            raise HTTPException(status_code=400, detail="Child product (by code) not found")
        return child
    raise HTTPException(status_code=400, detail="Either child_id or child_code must be provided")

def _get_or_create_product(db: Session, item: dict):
    """
    Usa referencia como código principal, se existir.
    item contém:
    {
        "code": "1.2",
        "name": "PERFIL X",
        "referencia": "TMR 1305",
        ...
    }
    """

    product_code = item.get("referencia") or item.get("code")
    product_name = item.get("name")

    product = (
        db.query(models.Product)
        .filter(models.Product.code == product_code)
        .first()
    )

    if product:
        return product

    product = models.Product(
        name=product_name,
        code=product_code,
        description=item.get("material") or None
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def _clear_bom_for_tree(db: Session, root: models.Product):
    """
    Remove *todos* os links de BOM da árvore inteira.
    """
    visited = set()

    def collect_products(product):
        if product.id in visited:
            return
        visited.add(product.id)

        children = (
            db.query(models.ProductBOM)
            .filter(models.ProductBOM.parent_id == product.id)
            .all()
        )

        for c in children:
            child = db.query(models.Product).get(c.child_id)
            if child:
                collect_products(child)

    collect_products(root)

    # delete all old BOM for all products in visited
    db.query(models.ProductBOM).filter(
        models.ProductBOM.parent_id.in_(visited)
    ).delete(synchronize_session=False)

    db.query(models.ProductBOM).filter(
        models.ProductBOM.child_id.in_(visited)
    ).delete(synchronize_session=False)



def _has_cycle(db: Session, parent_id: int, child_id: int) -> bool:
    visited = set()

    def dfs(pid: int) -> bool:
        if pid in visited:
            return False
        visited.add(pid)
        entries = db.query(models.ProductBOM).filter(models.ProductBOM.parent_id == pid).all()
        for e in entries:
            if e.child_id == parent_id:
                return True
            if dfs(e.child_id):
                return True
        return False

    return dfs(child_id)


def _build_tree_node(db: Session, product: models.Product) -> Dict[str, Any]:

    node = {
        "id": product.id,
        "code": getattr(product, "code", None),
        "name": getattr(product, "name", None),
        "unit_cost": getattr(product, "unit_cost", None),
        "unit_price": getattr(product, "unit_price", None),
        "children": []
    }

    children_entries = sorted(product.bom_children, key=lambda x: (x.order or 0))

    for entry in children_entries:
        child_product = entry.child
        child_node = _build_tree_node(db, child_product)
        child_node["_bom"] = {
            "bom_id": entry.id,
            "quantity": entry.quantity,
            "level_code": entry.level_code,
            "order": entry.order
        }
        node["children"].append(child_node)

    return node

def _import_bom_recursive(db: Session, parent_product, children_items):
    for item in children_items:

        child_product = _get_or_create_product(db, item)

        existing_parent = (
            db.query(models.ProductBOM)
            .filter(models.ProductBOM.child_id == child_product.id)
            .first()
        )
        if existing_parent:
            # já tem pai, ignorar para não criar múltiplo
            continue

        db.add(models.ProductBOM(
            parent_id=parent_product.id,
            child_id=child_product.id,
            quantity=float(item.get("qtd") or 1)
        ))

        db.flush()

        if item.get("children"):
            _import_bom_recursive(db, child_product, item["children"])



@router.post("/{parent_id}/components", dependencies=[Depends(allow_roles("manager", "admin"))])
def add_component_to_product(parent_id: int, bom: schemas.BOMCreate, db: Session = Depends(get_db)):

    parent = db.query(models.Product).filter(models.Product.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent product not found")

    child = _get_or_create_product(db, bom.child_name, bom.child_code)

    if parent.id == child.id:
        raise HTTPException(status_code=400, detail="Product cannot be a component of itself")

    if _has_cycle(db, parent_id=parent.id, child_id=child.id):
        raise HTTPException(status_code=400, detail="Adding this component would create a cycle in BOM")

    existing_parent = (
        db.query(models.ProductBOM)
        .filter(models.ProductBOM.child_id == child.id)
        .first()
    )

    if existing_parent and existing_parent.parent_id != parent.id:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Product '{child.name}' (id={child.id}) already belongs to parent id="
                f"{existing_parent.parent_id}. Each BOM item can only have one parent."
            )
        )

    existing = (
        db.query(models.ProductBOM)
        .filter(
            models.ProductBOM.parent_id == parent.id,
            models.ProductBOM.child_id == child.id
        )
        .first()
    )

    if existing:
        existing.quantity = bom.quantity
        existing.level_code = bom.level_code
        existing.order = bom.order
        db.commit()
        db.refresh(existing)
        return {"detail": "BOM entry updated", "bom_id": existing.id}

    new_bom = models.ProductBOM(
        parent_id=parent.id,
        child_id=child.id,
        quantity=bom.quantity,
        level_code=bom.level_code,
        order=bom.order
    )
    db.add(new_bom)
    db.commit()
    db.refresh(new_bom)

    return {"detail": "BOM entry created", "bom_id": new_bom.id}



@router.delete("/components/{bom_id}", dependencies=[Depends(allow_roles("manager", "admin"))])
def remove_bom_entry(bom_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.ProductBOM).filter(models.ProductBOM.id == bom_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="BOM entry not found")
    db.delete(entry)
    db.commit()
    return {"detail": "BOM entry deleted"}

@router.get("/tree", dependencies=[Depends(allow_roles("manager", "admin", "viewer"))])
def get_full_tree(db: Session = Depends(get_db)):
    child_ids = {row.child_id for row in db.query(models.ProductBOM.child_id).distinct().all()}
    roots = db.query(models.Product).filter(~models.Product.id.in_(child_ids)).all()
    trees = []
    for root in roots:
        trees.append(_build_tree_node(db, root))

    return {"total_roots": len(trees), "trees": trees}

@router.post("/import-bom", dependencies=[Depends(allow_roles("manager", "admin"))])
def import_bom(data: dict, db: Session = Depends(get_db)):

    if "product_name" not in data or "components" not in data:
        raise HTTPException(400, "JSON inválido")
    
    root_product = _get_or_create_product(
        db=db,
        item={"name": data["product_name"], "code": data["product_name"]},
    )

    _clear_bom_for_tree(db, root_product)
    db.flush()

    _import_bom_recursive(db, root_product, data["components"])

    db.commit()

    return {
        "detail": "Importação concluída com sucesso",
        "product_id": root_product.id,
        "product_name": root_product.name
    }

@router.post(
    "/{parent_product_id}/subproducts",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(allow_roles("manager","admin"))]
)
def add_subproduct(
    parent_product_id: int,
    item: dict,
    db: Session = Depends(get_db)
):
    parent = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent product not found")

    child = _get_or_create_product(db, item)
    quantity = item.get("quantity", 1)

    if child.id == parent.id:
        raise HTTPException(400, "A product cannot be its own child")

    existing_parent_link = db.query(models.ProductBOM).filter(
        models.ProductBOM.child_id == child.id
    ).first()

    if existing_parent_link:
        if existing_parent_link.parent_id != parent.id:
            raise HTTPException(
                400,
                f"Product '{child.name}' already belongs to another parent "
                f"(ID {existing_parent_link.parent_id})."
            )

        existing_parent_link.quantity = quantity
        db.commit()
        db.refresh(child)
        return child

    bom = models.ProductBOM(
        parent_id=parent.id,
        child_id=child.id,
        quantity=quantity
    )

    db.add(bom)
    db.commit()
    db.refresh(child)

    return child



@router.post(
    "/{parent_product_id}/subproducts/{child_id}",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(allow_roles("manager","admin"))]
)
def link_existing_subproduct(
    parent_product_id: int,
    child_id: int,
    db: Session = Depends(get_db)
):
    parent = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent:
        raise HTTPException(404, "Parent product not found")

    child = db.query(models.Product).filter(models.Product.id == child_id).first()
    if not child:
        raise HTTPException(404, "Child product not found")

    if parent.id == child.id:
        raise HTTPException(400, "A product cannot be its own child")

    existing_parent_link = db.query(models.ProductBOM).filter(
        models.ProductBOM.child_id == child.id
    ).first()

    if existing_parent_link:
        if existing_parent_link.parent_id != parent.id:
            raise HTTPException(
                400,
                f"Product '{child.name}' already belongs to another parent "
                f"(ID {existing_parent_link.parent_id})."
            )
        raise HTTPException(400, "Subproduct already linked to this parent")

    bom = models.ProductBOM(
        parent_id=parent.id,
        child_id=child.id,
        quantity=1
    )

    db.add(bom)
    db.commit()
    db.refresh(child)

    return child

