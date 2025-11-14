import { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Package, 
  CheckCircle,
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

import OrderFormDialog from "./OrderFormDialog";

interface Order {
  id: string;
  customer: string;
  date: string;
  status: "Pendente" | "Enviado" | "Concluído" | "Cancelado";
  total: number;
}
const ORDERS_STORAGE_KEY = "carropel_orders";

const OrderStatusBadge = ({ status }: { status: Order['status'] }) => {
  const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Pendente": "default",
    "Enviado": "secondary",
    "Concluído": "outline", 
    "Cancelado": "destructive",
  };
  if (status === "Concluído") {
    return <Badge variant="outline" className="text-emerald-600 border-emerald-600">{status}</Badge>
  }
  return <Badge variant={variantMap[status] || 'default'}>{status}</Badge>;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        const initialData: Order[] = [
           { id: "ORD-001", customer: "Cliente Satisfeito", date: new Date().toISOString(), status: "Pendente", total: 150.00 },
           { id: "ORD-002", customer: "Comprador Fiel", date: new Date().toISOString(), status: "Concluído", total: 275.50 },
        ];
        updateOrdersAndStorage(initialData);
      }
    } catch (error) {
      console.error("Falha ao ler pedidos do localStorage:", error);
      toast.error("Erro ao carregar pedidos salvos.");
    }
  }, []);

  const updateOrdersAndStorage = (newOrders: Order[]) => {
    const sortedOrders = newOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOrders(sortedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sortedOrders));
  };

  const handleFormSubmit = (orderData: Order) => {
    const isEditing = orders.some(o => o.id === orderData.id);

    if (isEditing) {
      const updatedOrders = orders.map(o => (o.id === orderData.id ? orderData : o));
      updateOrdersAndStorage(updatedOrders);
      toast.success(`Pedido ${orderData.id} atualizado com sucesso!`);
    } else {
      const updatedOrders = [...orders, orderData];
      updateOrdersAndStorage(updatedOrders);
      toast.success(`Pedido ${orderData.id} criado com sucesso!`);
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este pedido? Esta ação é irreversível.")) {
      const updatedOrders = orders.filter(order => order.id !== id);
      updateOrdersAndStorage(updatedOrders);
      toast.error(`Pedido ${id} foi excluído.`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order); 
    setIsModalOpen(true);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Gerenciamento de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Pedidos são salvos localmente no seu navegador.
          </p>
        </div>
        <Button variant="upload" onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Pedido
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por ID ou nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 w-full md:w-1/3"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID do Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => handleOpenEditModal(order)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Pedido
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Pedido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm 
                    ? `Nenhum pedido encontrado para "${searchTerm}".`
                    : "Nenhum pedido registrado."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {orders.length === 0 && (
         <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
            <FileText className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold">Sem Pedidos</h3>
            <p>Nenhum pedido foi registrado ainda.</p>
            <p>Clique em "Adicionar Pedido" para começar.</p>
        </div>
       )}

      <OrderFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingOrder}
      />
    </div>
  );
};

export default OrdersPage;