import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  MoreHorizontal,
  Trash2,
  Edit,
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

/* ================= TYPES ================= */

interface SalesOrder {
  id: number;
  order_number: string;
  customer: string;
  status: string;
}

/* ================= COMPONENT ================= */

const SalesOrdersPage = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  /* ========== LOAD ORDERS ========== */
  const loadOrders = async () => {
    try {
      const { data } = await api.get("/sales-orders/");
      setOrders(data);
    } catch {
      toast.error("Erro ao carregar pedidos de venda");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ========== DELETE ========== */
  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este pedido?")) return;

    try {
      await api.delete(`/sales-orders/${id}`);
      toast.success("Pedido excluído com sucesso");
      loadOrders();
    } catch {
      toast.error("Erro ao excluir pedido");
    }
  };

  /* ========== FILTER ========== */
  const filteredOrders = orders.filter(
    (order) =>
      order.order_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customer
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Pedidos de Venda
        </h1>

        <Button
          onClick={() => navigate("/sales-order/create")}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* SEARCH */}
      <Input
        placeholder="Buscar por pedido ou cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data de Entrega</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell>
                {order.delivery_date
                  ? new Date(order.delivery_date).toLocaleDateString("pt-BR")
                  : "-"}
              </TableCell>
              
              <TableCell>
                <Badge>{order.status}</Badge>
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      Ações
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() =>
                        navigate(
                          `/sales-order/edit/${order.id}`
                        )
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        handleDelete(order.id)
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {filteredOrders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Nenhum pedido encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesOrdersPage;
