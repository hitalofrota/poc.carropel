import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  ProductionOrderUpdateData,
  ProductionOrderResponse
} from '../../types/production-order';
import { productionOrderService } from '../../services/productionOrderService';
import LoadingButton from '../../components/LoadingButton';

const normalizeDate = (value?: string | null) =>
  value ? value.split('T')[0] : '';

const ProductionOrderEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [formData, setFormData] = useState<ProductionOrderUpdateData>({
    planned_quantity: 0,
    produced_quantity: null,
    status: 'planned',
    notes: null
  });

  useEffect(() => {
    const loadProductionOrder = async () => {
      if (!id) {
        toast.error('ID da ordem de produção não informado');
        navigate('/production-order');
        return;
      }

      try {
        setLoadingOrder(true);

        const orderId = Number(id);
        const order: ProductionOrderResponse =
          await productionOrderService.getProductionOrder(orderId);

        setFormData({
          planned_quantity: order.planned_quantity ?? 0,
          produced_quantity: order.produced_quantity ?? null,
          status: order.status ?? 'planned',
          notes: order.notes ?? null
        });

      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados da ordem de produção');
        navigate('/production-order');
      } finally {
        setLoadingOrder(false);
      }
    };

    loadProductionOrder();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : Number(value)
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error('ID da ordem de produção não informado');
      return;
    }

    setLoading(true);

    try {
      const orderId = Number(id);

      await productionOrderService.updateProductionOrder(orderId, {
        planned_quantity: formData.planned_quantity,
        produced_quantity: formData.produced_quantity,
        status: formData.status,
        notes: formData.notes
      });

      toast.success('Ordem de produção atualizada com sucesso!', {
        icon: <CheckCircle className="w-4 h-4" />
      });

      navigate('/production-order');

    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      toast.error('Erro ao atualizar ordem de produção', {
        description: typeof detail === 'string'
          ? detail
          : 'Erro inesperado',
        icon: <XCircle className="w-4 h-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center h-64">
        <Calendar className="h-8 w-8 animate-spin mr-2" />
        <span className="text-muted-foreground">
          Carregando ordem de produção...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/production-order')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-bold">
          Editar Ordem de Produção
        </h1>

        <Badge variant="secondary" className="ml-auto">
          ID: {id}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Ordem</CardTitle>
          <CardDescription>
            Atualize os dados da ordem de produção
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label>Quantidade Planejada *</Label>
                <Input
                  type="number"
                  min={1}
                  name="planned_quantity"
                  value={formData.planned_quantity ?? ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Quantidade Produzida</Label>
                <Input
                  type="number"
                  min={0}
                  name="produced_quantity"
                  value={formData.produced_quantity ?? ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejada</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/production-order')}>
                Cancelar
              </Button>

              <LoadingButton loading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionOrderEditPage;
