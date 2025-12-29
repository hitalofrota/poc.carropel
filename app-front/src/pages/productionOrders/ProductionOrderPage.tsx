import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Package,
  Edit,
  Trash2,
  Eye,
  Calendar,
  PlayCircle,
  CheckCircle,
  XCircle,
  FilePlus,
  FileText,
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

import { ProductionOrderResponse } from "../../types/production-order";
import { productionOrderService } from "../../services";

const ProductionOrderPage = () => {
  const [productionOrders, setProductionOrders] = useState<
    ProductionOrderResponse[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadProductionOrders();
  }, []);

  const loadProductionOrders = async () => {
    try {
      setLoading(true);
      const data =
        await productionOrderService.getProductionOrders();
      setProductionOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar ordens de produção");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProductionOrder = async (id: number) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta ordem de produção?"
      )
    ) {
      return;
    }

    try {
      await productionOrderService.deleteProductionOrder(id);
      setProductionOrders((prev) =>
        prev.filter((order) => order.id !== id)
      );
      toast.success("Ordem de produção excluída com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir ordem de produção");
    }
  };

  const handleCreateFromSalesOrder = async () => {
    const saleOrderId = window.prompt(
      "Informe o ID do Pedido de Venda:"
    );

    if (!saleOrderId) return;

    try {
      setLoading(true);
      await productionOrderService.createFromSalesOrder(
        Number(saleOrderId)
      );
      toast.success(
        "Ordem de produção criada a partir do pedido de venda!"
      );
      await loadProductionOrders();
    } catch (error) {
      console.error(error);
      toast.error(
        "Erro ao criar ordem de produção a partir do pedido de venda"
      );
    } finally {
      setLoading(false);
    }
  };

  // 👉 GERAÇÃO DE PDF
  const handleGeneratePdf = async (
    order: ProductionOrderResponse
  ) => {
    try {
      const response =
        await productionOrderService.generatePdf(order);

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `ordem_producao_${order.code}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF da ordem de produção");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        class: "bg-yellow-100 text-yellow-800",
        icon: Calendar,
        label: "Pendente",
      },
      in_progress: {
        class: "bg-blue-100 text-blue-800",
        icon: PlayCircle,
        label: "Em Andamento",
      },
      completed: {
        class: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Concluída",
      },
      cancelled: {
        class: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Cancelada",
      },
    };

    const config =
      variants[status as keyof typeof variants] ||
      variants.pending;

    const Icon = config.icon;

    return (
      <Badge className={`${config.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const normalizedSearch = searchTerm.toLowerCase();

  const filteredProductionOrders = productionOrders.filter(
    (order) => {
      const name = order.name?.toLowerCase() ?? "";
      const code = order.code?.toLowerCase() ?? "";
      return (
        name.includes(normalizedSearch) ||
        code.includes(normalizedSearch)
      );
    }
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Gerenciamento de Ordens de Produção
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas ordens de produção
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleCreateFromSalesOrder}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Criar via Pedido de Venda
          </Button>

          <Button asChild variant="upload">
            <Link to="/production-order/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Ordem de Produção
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {productionOrders.length}</span>
          <span>Filtradas: {filteredProductionOrders.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Quantidade
              </TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead className="w-[100px]">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Package className="h-6 w-6 animate-spin mr-2" />
                    Carregando ordens de produção...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProductionOrders.length > 0 ? (
              filteredProductionOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {order.code}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(order.quantity ?? 0).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {order.start_date
                      ? new Date(order.start_date).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {order.end_date
                      ? new Date(order.end_date).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>

                        <DropdownMenuItem asChild>
                          <Link to={`/production-order/edit/${order.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link to={`/production-order/view/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleGeneratePdf(order)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Gerar PDF
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            handleDeleteProductionOrder(order.id)
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-2 opacity-50" />
                    <p>
                      {searchTerm
                        ? `Nenhuma ordem encontrada para "${searchTerm}".`
                        : "Nenhuma ordem de produção cadastrada."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductionOrderPage;
