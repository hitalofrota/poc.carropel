from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/production-routes",
    tags=["Production Routes"],
    dependencies=[Depends(get_current_user)]
)


# --- CREATE PRODUCTION ROUTE ---
@router.post("/", response_model=schemas.ProductionRoutingResponse)
def create_production_route(route: schemas.ProductionRoutingCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == route.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_route = models.ProductionRoute(
        product_id=route.product_id,
        code=route.code,
        description=route.description,
        active=route.active,
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    # Add operations
    for op in route.operations:
        new_op = models.RouteOperation(
            route_id=new_route.id,
            **op.dict()
        )
        db.add(new_op)

    db.commit()
    db.refresh(new_route)
    return new_route


# --- LIST ALL PRODUCTION ROUTES ---
@router.get("/", response_model=list[schemas.ProductionRoutingResponse])
def list_production_routes(db: Session = Depends(get_db)):
    return db.query(models.ProductionRoute).all()


# --- GET PRODUCTION ROUTE BY ID ---
@router.get("/{route_id}", response_model=schemas.ProductionRoutingResponse)
def get_production_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(models.ProductionRoute).filter(models.ProductionRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Production route not found")
    return route


# --- UPDATE PRODUCTION ROUTE ---
@router.put("/{route_id}", response_model=schemas.ProductionRoutingResponse)
def update_production_route(route_id: int, route_update: schemas.ProductionRoutingUpdate, db: Session = Depends(get_db)):
    route = db.query(models.ProductionRoute).filter(models.ProductionRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Production route not found")

    for key, value in route_update.dict(exclude_unset=True, exclude={"operations"}).items():
        setattr(route, key, value)

    # If a new operations list was provided → replace old ones
    if route_update.operations is not None:
        db.query(models.RouteOperation).filter(models.RouteOperation.route_id == route.id).delete()
        for op in route_update.operations:
            new_op = models.RouteOperation(route_id=route.id, **op.dict())
            db.add(new_op)

    db.commit()
    db.refresh(route)
    return route


# --- DELETE PRODUCTION ROUTE ---
@router.delete("/{route_id}")
def delete_production_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(models.ProductionRoute).filter(models.ProductionRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Production route not found")

    db.delete(route)
    db.commit()
    return {"detail": "Production route successfully deleted"}
