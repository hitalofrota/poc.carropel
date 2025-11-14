import { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Trash2,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Clock
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

import ProductionOrderFormDialog, { ProductionOrder } from "./ProductionOrderFormDialog";

const PRODUCTION_ORDERS_STORAGE_KEY = "carropel_production_orders";

const ProductionStatusBadge = ({ status }: { status: ProductionOrder['status'] }) => {
  switch (status) {
    case 'Planejada':
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Em Andamento':
      return <Badge variant="default"><Truck className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Concluída':
      return <Badge variant="outline" className="text-emerald-600 border-emerald-600"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Cancelada':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const [year, month, day] = dateString.split('-');
    if (day && month && year) {
        return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    return "Data Inválida";
  }
};

const ProductionOrdersPage = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem(PRODUCTION_ORDERS_STORAGE_KEY);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        const initialData: ProductionOrder[] = [
           { 
             id: "OP-001", 
             produto: "Mesa de Escritório X", 
             quantidade: 10, 
             dataInicio: "2025-11-20", 
             dataTermino: "2025-11-30", 
             materiais: "40x Chapa MDF, 400x Parafuso, 1L Tinta Branca",
             roteiro: "1. Cortar, 2. Montar, 3. Pintar",
             responsavel: "Ana Silva", 
             dataEmissao: new Date().toISOString(), 
             status: "Planejada" 
           },
        ];
        updateOrdersAndStorage(initialData);
      }
    } catch (error) {
      toast.error("Erro ao carregar Ordens de Produção.");
    }
  }, []);

  const updateOrdersAndStorage = (newOrders: ProductionOrder[]) => {
    const sorted = newOrders.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
    setOrders(sorted);
    localStorage.setItem(PRODUCTION_ORDERS_STORAGE_KEY, JSON.stringify(sorted));
  };

  const handleFormSubmit = (data: ProductionOrder) => {
    const isEditing = orders.some(o => o.id === data.id);

    if (isEditing) {
      const updatedOrders = orders.map(o => (o.id === data.id ? data : o));
      updateOrdersAndStorage(updatedOrders);
      toast.success(`OP ${data.id} atualizada com sucesso!`);
    } else {
      const updatedOrders = [...orders, data];
      updateOrdersAndStorage(updatedOrders);
      toast.success(`OP ${data.id} criada com sucesso!`);
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta Ordem de Produção?")) {
      const updatedOrders = orders.filter(order => order.id !== id);
      updateOrdersAndStorage(updatedOrders);
      toast.error(`OP ${id} foi excluída.`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: ProductionOrder) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Ordens de Produção (OP)
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie as ordens de produção da fábrica.
          </p>
        </div>
        <Button variant="upload" onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Ordem de Produção
        </Button>
      </div>

      {/* 2. Controles (Busca) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por ID, Produto ou Responsável..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 w-full md:w-1/3"
        />
      </div>

      {/* 3. Tabela de Dados */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Término</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.produto}</TableCell>
                  <TableCell>
                    <ProductionStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{order.quantidade}</TableCell>
                  <TableCell>{formatDate(order.dataInicio)}</TableCell>
                  <TableCell>{formatDate(order.dataTermino)}</TableCell>
                  <TableCell>{order.responsavel}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEditModal(order)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ver / Editar OP
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir OP
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {searchTerm 
                    ? `Nenhuma OP encontrada para "${searchTerm}".`
                    : "Nenhuma Ordem de Produção registrada."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
       {/* 4. Renderização do Modal */}
      <ProductionOrderFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingOrder}
      />
    </div>
  );
};

export default ProductionOrdersPage;