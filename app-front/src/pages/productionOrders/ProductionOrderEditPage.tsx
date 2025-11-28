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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { ProductionOrderUpdateData, ProductionOrderResponse } from '../../types/production-order';
import { productionOrderService } from '../../services/productionOrderService';
import LoadingButton from '../../components/LoadingButton';

const ProductionOrderEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
    
    const [formData, setFormData] = useState<ProductionOrderUpdateData>({
        name: '',
        code: '',
        quantity: 0,
        start_date: '',
        end_date: undefined,
        status: 'pending'
    });

    // Carrega os dados da ordem de produção
    useEffect(() => {
        const loadProductionOrder = async () => {
            if (!id) {
                toast.error('ID da ordem de produção não informado');
                navigate('/production-order');
                return;
            }

            try {
                setLoadingOrder(true);
                const orderId = parseInt(id);
                const order = await productionOrderService.getProductionOrder(orderId);
                
                setFormData({
                    name: order.name,
                    code: order.code,
                    quantity: order.quantity,
                    start_date: order.start_date.split('T')[0],
                    end_date: order.end_date?.split('T')[0],
                    status: order.status
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? parseInt(value) || 0 : value
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
            const orderId = parseInt(id);
            const updatedOrder = await productionOrderService.updateProductionOrder(orderId, formData);
            
            toast.success('Ordem de produção atualizada com sucesso!', {
                description: `A ordem ${formData.name} foi atualizada.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            navigate('/production-order', { 
                state: { 
                    updatedOrder: updatedOrder,
                    action: 'edit'
                }
            });

        } catch (err: any) {
            console.error('Erro ao atualizar ordem de produção:', err);
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao atualizar ordem de produção', {
                        description: errorData.detail,
                        icon: <XCircle className="w-4 h-4" />
                    });
                } else if (Array.isArray(errorData.detail)) {
                    const validationErrors = errorData.detail.map((error: any) => error.msg).join(', ');
                    toast.error('Erros de validação', {
                        description: validationErrors,
                        icon: <XCircle className="w-4 h-4" />
                    });
                }
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
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground">Carregando ordem de produção...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleCancel}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold text-foreground">
                            Editar Ordem de Produção
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Atualize as informações da ordem de produção
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    ID: {id}
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Informações da Ordem de Produção
                    </CardTitle>
                    <CardDescription>
                        Atualize os dados da ordem de produção. Campos marcados com * são obrigatórios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome e Código */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome da Ordem *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Produção Teto Bau Lote 001"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Código *
                                </Label>
                                <Input
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: OP-TETO-BAU-001"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Quantidade, Status e Datas */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    Quantidade *
                                </Label>
                                <Input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    placeholder="0"
                                    min="1"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">
                                    Status
                                </Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleSelectChange('status', value)}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                                        <SelectItem value="completed">Concluída</SelectItem>
                                        <SelectItem value="cancelled">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start_date">
                                    Data de Início *
                                </Label>
                                <Input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_date">
                                    Data de Término
                                </Label>
                                <Input
                                    type="date"
                                    id="end_date"
                                    name="end_date"
                                    value={formData.end_date || ''}
                                    onChange={handleChange}
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 justify-end pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                                className="h-11"
                            >
                                Cancelar
                            </Button>
                            
                            <LoadingButton 
                                loading={loading}
                                className="h-11"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </LoadingButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductionOrderEditPage;