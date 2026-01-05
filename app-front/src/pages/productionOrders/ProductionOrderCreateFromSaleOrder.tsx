import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { productionOrderService } from "@/services";

const ProductionOrderFromSalesOrderPage: React.FC = () => {
  const [salesOrderId, setSalesOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salesOrderId) {
      toast.error("Informe o ID do Pedido de Venda");
      return;
    }

    try {
      setLoading(true);
      await productionOrderService.createFromSalesOrder(
        Number(salesOrderId)
      );

      toast.success(
        "Ordens de produção criadas com sucesso!"
      );

      navigate("/production-order");
    } catch (error) {
      console.error(error);
      toast.error(
        "Erro ao criar ordens a partir do pedido de venda"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
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
          <Label htmlFor="salesOrderId">
            ID do Pedido de Venda
          </Label>
          <Input
            id="salesOrderId"
            type="number"
            placeholder="Ex: 123"
            value={salesOrderId}
            onChange={(e) =>
              setSalesOrderId(e.target.value)
            }
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
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
