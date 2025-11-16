from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.viewer, nullable=False) 

class UnitOfMeasure(Base):
    __tablename__ = "units_of_measure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)  # e.g., Kilogram
    abbreviation = Column(String(10), nullable=False, unique=True)  # e.g., kg

    materials = relationship("Material", back_populates="unit_of_measure")

class WorkCenter(Base):
    __tablename__ = "work_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=True)

    # Relationship with machines (1:N)
    machines = relationship(
        "Machine",
        back_populates="work_center",
        cascade="all, delete-orphan"
    )

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(String(255), nullable=True)

    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)

    # Relationship with work center (N:1)
    work_center = relationship("WorkCenter", back_populates="machines")

class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)

class ProductionOrderStatus(enum.Enum):
    planned = "planned"
    in_production = "in_production"
    finished = "finished"
    cancelled = "cancelled"

class SalesOrderStatus(enum.Enum):
    planned = "planned"
    in_production = "in_production"
    finished = "finished"
    cancelled = "cancelled"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    unit_cost = Column(Float, nullable=True)
    unit_price = Column(Float, nullable=True)
    net_weight = Column(Float, nullable=True)
    gross_weight = Column(Float, nullable=True)

    parent_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    parent_product = relationship(
        "Product",
        remote_side=[id],
        back_populates="subproducts"
    )
    subproducts = relationship(
        "Product",
        back_populates="parent_product",
        cascade="all, delete-orphan"
    )

    production_orders = relationship("ProductionOrder", back_populates="product")
    materials = relationship(
        "ProductMaterial",
        back_populates="product",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    production_routes = relationship(
        "ProductionRoute",
        back_populates="product",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    code = Column(String(100), unique=True, nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("units_of_measure.id"), nullable=False)
    unit_cost = Column(Float, nullable=True)

    unit_of_measure = relationship("UnitOfMeasure", back_populates="materials")
    product_materials = relationship(
        "ProductMaterial",
        back_populates="material",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    order_materials = relationship(
        "MaterialOrder",
        back_populates="material",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("production_routes.id"), nullable=True)
    planned_quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(Enum(ProductionOrderStatus), default=ProductionOrderStatus.planned)
    notes = Column(Text, nullable=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True)

    product = relationship("Product", back_populates="production_orders")
    sales_order = relationship("SalesOrder", back_populates="production_orders")
    route = relationship("ProductionRoute")

    used_materials = relationship(
        "MaterialOrder",
        back_populates="production_order",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    operations = relationship(
        "ProductionOrderOperation",
        back_populates="production_order",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<ProductionOrder(code={self.code}, product={self.product_id}, status={self.status})>"

# --- PRODUCTION ORDER OPERATION ---
class ProductionOrderOperation(Base):
    __tablename__ = "production_order_operations"

    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    production_order = relationship("ProductionOrder", back_populates="operations")

    # --- PLANNED (from route) ---
    planned_operation_id = Column(Integer, ForeignKey("operations.id"), nullable=False)
    planned_work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=True)
    planned_machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)

    # --- ACTUAL (during execution) ---
    actual_operation_id = Column(Integer, ForeignKey("operations.id"), nullable=True)
    actual_work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=True)
    actual_machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)

    # --- TIMES AND QUANTITIES ---
    planned_start = Column(DateTime, nullable=True)
    planned_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    planned_quantity = Column(Float, nullable=True)
    produced_quantity = Column(Float, nullable=True)

    def __repr__(self):
        return (
            f"<ProductionOrderOperation(order={self.production_order_id}, "
            f"planned_op={self.planned_operation_id}, actual_op={self.actual_operation_id})>"
        )

# --- PRODUCT ↔ MATERIAL (M:N) ---
class ProductMaterial(Base):
    __tablename__ = "product_materials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=False)

    product = relationship("Product", back_populates="materials")
    material = relationship("Material", back_populates="product_materials")

# --- PRODUCTION ORDER ↔ MATERIAL (M:N) ---
class MaterialOrder(Base):
    __tablename__ = "material_orders"

    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    quantity_used = Column(Float, nullable=False)

    production_order = relationship("ProductionOrder", back_populates="used_materials")
    material = relationship("Material", back_populates="order_materials")

# --- PRODUCTION ROUTE ---
class ProductionRoute(Base):
    __tablename__ = "production_routes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    code = Column(String(100), unique=False, nullable=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="production_routes")
    operations = relationship(
        "RouteOperation",
        back_populates="route",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<ProductionRoute(id={self.id}, product_id={self.product_id}, active={self.active})>"

# --- ROUTE OPERATION ---
class RouteOperation(Base):
    __tablename__ = "route_operations"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("production_routes.id", ondelete="CASCADE"), nullable=False)

    operation_id = Column(Integer, ForeignKey("operations.id"), nullable=False)
    work_center_id = Column(Integer, ForeignKey("work_centers.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)

    sequence = Column(Integer, nullable=False)
    standard_time_min = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    route = relationship("ProductionRoute", back_populates="operations")
    operation = relationship("Operation")
    work_center = relationship("WorkCenter")
    machine = relationship("Machine")

    def __repr__(self):
        return (
            f"<RouteOperation(route={self.route_id}, seq={self.sequence}, "
            f"op={self.operation_id}, center={self.work_center_id})>"
        )

# --- SALES ORDER ---
class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), unique=True, nullable=False)
    client = Column(String(200), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    status = Column(Enum(SalesOrderStatus), default=SalesOrderStatus.planned)

    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    production_orders = relationship("ProductionOrder", back_populates="sales_order")

    def __repr__(self):
        return f"<SalesOrder(order_number={self.order_number}, client={self.client})>"

# --- SALES ORDER ITEM ---
class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product")
