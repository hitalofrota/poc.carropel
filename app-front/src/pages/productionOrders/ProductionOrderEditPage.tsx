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
    name: '',
    code: '',
    quantity: 0,
    start_date: '',
    end_date: '',
    status: 'pending'
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
          name: order.name ?? '',
          code: order.code ?? '',
          quantity: order.quantity ?? 0,
          start_date: normalizeDate(order.start_date),
          end_date: normalizeDate(order.end_date),
          status: order.status ?? 'pending',
        });

      } catch (error) {
        console.error('Erro ao carregar ordem de produção:', error);
        toast.error('Erro ao carregar dados da ordem de produção');
        navigate('/production-order');
      } finally {
        setLoadingOrder(false);
      }
    };

    loadProductionOrder();
  }, [id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'quantity'
          ? Number(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
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

      await productionOrderService.updateProductionOrder(
        orderId,
        {
          ...formData,
          end_date: formData.end_date || null, // backend-friendly
        }
      );

      toast.success('Ordem de produção atualizada com sucesso!', {
        description: `A ordem ${formData.name} foi atualizada.`,
        icon: <CheckCircle className="w-4 h-4" />
      });

      navigate('/production-order');

    } catch (err: any) {
      console.error('Erro ao atualizar ordem de produção:', err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === 'string') {
        toast.error('Erro ao atualizar ordem de produção', {
          description: detail,
          icon: <XCircle className="w-4 h-4" />
        });
      } else if (Array.isArray(detail)) {
        const messages = detail.map((e: any) => e.msg).join(', ');
        toast.error('Erros de validação', {
          description: messages,
          icon: <XCircle className="w-4 h-4" />
        });
      } else {
        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar com o servidor.',
          icon: <XCircle className="w-4 h-4" />
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/production-order');
  };

  if (loadingOrder) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <Calendar className="h-8 w-8 animate-spin mr-2" />
          <span className="text-muted-foreground">
            Carregando ordem de produção...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            Editar Ordem de Produção
          </h1>
        </div>

        <Badge variant="secondary">
          <Calendar className="w-3 h-3 mr-1" />
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
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Nome *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Código *</Label>
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  name="quantity"
                  min={1}
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    handleSelectChange('status', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
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
