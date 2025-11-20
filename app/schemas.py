# app/schemas.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from enum import Enum
from app.models import UserRole

# ========================
# USER
# ========================

class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.viewer

class UpdateUserRole(BaseModel):
    role: UserRole

class UserResponse(UserBase):
    id: int
    role: UserRole

    class Config:
        orm_mode = True


# ========================
# AUTHENTICATION
# ========================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    repeat_new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ========================
# ENUMS
# ========================

class ProductionOrderStatus(str, Enum):
    planned = "planned"
    in_production = "in_production"
    finished = "finished"
    canceled = "canceled"


# ========================
# UNIT OF MEASUREMENT
# ========================

class UnitOfMeasureBase(BaseModel):
    name: str
    abbreviation: str


class UnitOfMeasureCreate(UnitOfMeasureBase):
    pass


class UnitOfMeasureResponse(UnitOfMeasureBase):
    id: int

    class Config:
        orm_mode = True


# ========================
# MATERIALS
# ========================

class MaterialBase(BaseModel):
    name: str
    description: str
    code: str
    unit_of_measure_id: int
    unit_cost: Optional[float] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    unit_of_measure_id: Optional[int] = None
    unit_cost: Optional[float] = None


class MaterialResponse(MaterialBase):
    id: int
    unit_of_measure: Optional[UnitOfMeasureResponse] = None

    class Config:
        orm_mode = True


# ===============================
# WORK CENTER
# ===============================

class WorkCenterBase(BaseModel):
    name: str
    description: Optional[str] = None


class WorkCenterCreate(WorkCenterBase):
    pass


class WorkCenterResponse(WorkCenterBase):
    id: int

    class Config:
        orm_mode = True


# ===============================
# MACHINE
# ===============================

class MachineBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    work_center_id: int


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    work_center_id: Optional[int] = None


class MachineResponse(MachineBase):
    id: int
    work_center: Optional[WorkCenterResponse]

    class Config:
        orm_mode = True


# ===============================
# OPERATIONS
# ===============================

class OperationBase(BaseModel):
    name: str
    description: Optional[str] = None


class OperationCreate(OperationBase):
    pass


class OperationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class OperationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        orm_mode = True


# ========================
# PRODUCTS
# ========================

class ProductBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit_cost: Optional[float] = None
    unit_price: Optional[float] = None
    net_weight: Optional[float] = None
    gross_weight: Optional[float] = None

class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    unit_cost: Optional[float] = None
    unit_price: Optional[float] = None
    net_weight: Optional[float] = None
    gross_weight: Optional[float] = None

class BOMCreate(BaseModel):

    child_id: Optional[int] = None
    child_code: Optional[str] = None
    quantity: float = Field(..., gt=0)
    level_code: Optional[str] = None
    order: Optional[int] = None

class ProductBOMBase(BaseModel):
    quantity: float = Field(..., gt=0)
    level_code: Optional[str] = None
    order: Optional[int] = None


class ProductBOMCreate(ProductBOMBase):
    # usado para entrada no POST
    child_id: Optional[int] = None
    child_code: Optional[str] = None


class ProductBOMResponse(ProductBOMBase):
    id: int
    parent_id: int
    child_id: int

    class Config:
        orm_mode = True

class ProductResponse(ProductBase):
    id: int

    bom_children: List[ProductBOMResponse] = []
    bom_parent: List[ProductBOMResponse] = []

    class Config:
        orm_mode = True

class ProductTreeNode(BaseModel):
    id: int
    code: str
    name: str
    unit_cost: Optional[float]
    unit_price: Optional[float]

    children: List["ProductTreeNode"] = []

    # dados do BOM entre pai/filho
    quantity: Optional[float] = None
    level_code: Optional[str] = None
    order: Optional[int] = None
    bom_id: Optional[int] = None

    class Config:
        orm_mode = True


ProductTreeNode.update_forward_refs()

# ========================
# RELATIONSHIP ORDER-MATERIAL
# ========================

class OrderMaterialBase(BaseModel):
    used_quantity: float


class OrderMaterialCreate(OrderMaterialBase):
    material_id: int


class OrderMaterialResponse(OrderMaterialBase):
    id: int
    material_id: int

    class Config:
        orm_mode = True


# ========================
# PRODUCTION ORDER
# ========================

class ProductionOrderBase(BaseModel):
    code: str
    product_id: int
    planned_quantity: float
    status: Optional[ProductionOrderStatus] = ProductionOrderStatus.planned
    notes: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    used_materials: Optional[List[OrderMaterialCreate]] = []


class ProductionOrderUpdate(BaseModel):
    planned_quantity: Optional[float] = None
    status: Optional[ProductionOrderStatus] = None
    notes: Optional[str] = None


class ProductionOrderResponse(ProductionOrderBase):
    id: int
    created_at: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    product: Optional[ProductResponse] = None
    used_materials: Optional[List[OrderMaterialResponse]] = None

    class Config:
        orm_mode = True


# ========================
# RELATIONSHIP PRODUCT-MATERIAL
# ========================

class MaterialSummary(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        orm_mode = True


class ProductMaterialBase(BaseModel):
    material_id: int
    quantity: float


class ProductMaterialCreate(ProductMaterialBase):
    material_id: int


class ProductMaterialResponse(BaseModel):
    id: int
    product_id: int
    material_id: int
    quantity: float
    material: MaterialSummary

    class Config:
        orm_mode = True


# ========================
# SALES ORDER
# ========================

class SalesOrderItemBase(BaseModel):
    product_id: int
    quantity: float


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemResponse(SalesOrderItemBase):
    id: int

    class Config:
        orm_mode = True


class SalesOrderBase(BaseModel):
    order_number: str
    customer: str
    notes: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate]


class SalesOrderResponse(SalesOrderBase):
    id: int
    order_date: datetime
    items: List[SalesOrderItemResponse] = []

    class Config:
        orm_mode = True


# ========================
# ROUTING OPERATION
# ========================

class RoutingOperationBase(BaseModel):
    operation_id: int
    work_center_id: int
    machine_id: Optional[int] = None
    sequence: int
    standard_time_min: Optional[int] = None
    notes: Optional[str] = None


class RoutingOperationCreate(RoutingOperationBase):
    pass


class RoutingOperationResponse(RoutingOperationBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ========================
# PRODUCTION ROUTING
# ========================

class ProductionRoutingBase(BaseModel):
    product_id: int
    code: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = True


class ProductionRoutingCreate(ProductionRoutingBase):
    operations: List[RoutingOperationCreate] = []


class ProductionRoutingUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    operations: Optional[List[RoutingOperationCreate]] = None


class ProductionRoutingResponse(ProductionRoutingBase):
    id: int
    created_at: datetime
    operations: List[RoutingOperationResponse] = []

    class Config:
        orm_mode = True

# ========================
# CSV SCHEMA
# ========================  

class ProductCSV(BaseModel):
    nome: str = Field(..., min_length=2)
    quantidade: int
    preco: float
