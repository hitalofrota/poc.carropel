import { useEffect, useState } from "react";
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/services/api";
import OrderFormDialog from "./OrderFormDialog";

/* ================== TYPES ================== */

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: string; // order_number
  customer: string;
  notes?: string;
  status: "Pendente" | "Enviado" | "Concluído" | "Cancelado";
  items: OrderItem[];
}

/* ================== COMPONENT ================== */

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  /* ========= LOAD ORDERS ========= */
  const loadOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data);
    } catch (error) {
      toast.error("Erro ao carregar pedidos");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ========= SAVE (CREATE / UPDATE) ========= */
  const handleFormSubmit = async (order: Order) => {
    const payload = {
      order_number: order.id,
      customer: order.customer,
      notes: order.notes,
      items: order.items,
    };

    try {
      if (editingOrder) {
        await api.put(`/orders/${order.id}`, payload);
        toast.success("Pedido atualizado com sucesso");
      } else {
        await api.post("/orders", payload);
        toast.success("Pedido criado com sucesso");
      }

      setIsModalOpen(false);
      setEditingOrder(null);
      loadOrders();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar pedido");
    }
  };

  /* ========= DELETE ========= */
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este pedido?")) return;

    try {
      await api.delete(`/orders/${id}`);
      toast.success("Pedido excluído");
      loadOrders();
    } catch {
      toast.error("Erro ao excluir pedido");
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <Input
        placeholder="Buscar pedido..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell>
                <Badge>{order.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() => {
                        setEditingOrder(order);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <OrderFormDialog
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingOrder}
      />
    </div>
  );
};

export default OrdersPage;
