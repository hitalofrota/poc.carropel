from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/pedidos-venda", tags=["Pedidos de Venda"])


@router.post("/", response_model=schemas.PedidoVendaResponse)
def criar_pedido_venda(pedido_data: schemas.PedidoVendaCreate, db: Session = Depends(get_db)):
    # Evitar duplicação
    if db.query(models.PedidoVenda).filter_by(numero_pedido=pedido_data.numero_pedido).first():
        raise HTTPException(status_code=400, detail="Número de pedido já existe.")

    pedido = models.PedidoVenda(
        numero_pedido=pedido_data.numero_pedido,
        cliente=pedido_data.cliente,
        observacoes=pedido_data.observacoes,
    )
    db.add(pedido)
    db.flush()  # garante ID antes dos itens

    for item in pedido_data.itens:
        novo_item = models.PedidoVendaItem(
            pedido_id=pedido.id,
            produto_id=item.produto_id,
            quantidade=item.quantidade
        )
        db.add(novo_item)

        # Cria automaticamente uma ordem de produção vinculada
        codigo_ordem = f"ORD-{pedido.numero_pedido}-{item.produto_id}"
        ordem = models.OrdemProducao(
            codigo=codigo_ordem,
            produto_id=item.produto_id,
            quantidade_planejada=item.quantidade,
            pedido_id=pedido.id,
        )
        db.add(ordem)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.get("/", response_model=list[schemas.PedidoVendaResponse])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(models.PedidoVenda).all()


@router.get("/{pedido_id}", response_model=schemas.PedidoVendaResponse)
def obter_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(models.PedidoVenda).filter_by(id=pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido
