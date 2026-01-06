import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { productionOrderService } from "@/services";
import {
  getOpenSalesOrders,
  SalesOrder
} from "@/services/api/salesOrders";

const ProductionOrderFromSalesOrderPage: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadSalesOrders = async () => {
      try {
        const data = await getOpenSalesOrders();

        setSalesOrders(data);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar pedidos de venda");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadSalesOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSalesOrderId) {
      toast.error("Selecione um Pedido de Venda");
      return;
    }

    try {
      setLoading(true);

      await productionOrderService.createFromSalesOrder(
        Number(selectedSalesOrderId)
      );

      toast.success("Ordens de produção criadas com sucesso!");
      navigate("/production-order");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar ordens de produção");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold">
          Criar Ordens a partir de Pedido de Venda
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border p-6 bg-card"
      >
        <div className="space-y-2">
          <Label>Pedido de Venda</Label>

          <Select
            value={selectedSalesOrderId}
            onValueChange={setSelectedSalesOrderId}
            disabled={loadingOrders}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingOrders
                    ? "Carregando pedidos..."
                    : "Selecione um pedido de venda"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {salesOrders.length === 0 && !loadingOrders && (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhum pedido em aberto
                </div>
              )}

              {salesOrders.map((order) => (
                <SelectItem
                  key={order.id}
                  value={order.id.toString()}
                >
                  Pedido #{order.id} — {order.customer} —{" "}
                  {order.items.length} item(s)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || loadingOrders}
          className="w-full"
        >
          <FilePlus className="h-4 w-4 mr-2" />
          {loading
            ? "Criando ordens..."
            : "Criar Ordens de Produção"}
        </Button>
      </form>
    </div>
  );
};

export default ProductionOrderFromSalesOrderPage;
