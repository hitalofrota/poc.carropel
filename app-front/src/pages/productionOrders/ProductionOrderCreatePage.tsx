import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
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
import { toast } from "sonner";

import { ProductionOrderCreateData, ApiError } from '../../types/production-order';
import { productionOrderService } from '../../services/productionOrderService';
import LoadingButton from '../../components/LoadingButton';

const ProductionOrderCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<ProductionOrderCreateData>({
        name: '',
        code: '',
        quantity: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: undefined
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await productionOrderService.createProductionOrder(formData);
            
            toast.success('Ordem de produção criada com sucesso!', {
                description: `A ordem ${formData.name} foi cadastrada no sistema.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            // Limpar formulário após sucesso
            setFormData({
                name: '',
                code: '',
                quantity: 0,
                start_date: new Date().toISOString().split('T')[0],
                end_date: undefined
            });

            // Redirecionar após 1 segundo
            setTimeout(() => {
                navigate('/orders');
            }, 1000);

        } catch (err: any) {
            console.error('Erro ao criar ordem de produção:', err);
            
            if (err.response?.data) {
                const errorData: ApiError = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao criar ordem de produção', {
                        description: errorData.detail,
                        icon: <XCircle className="w-4 h-4" />
                    });
                } else if (Array.isArray(errorData.detail)) {
                    const validationErrors = errorData.detail.map(error => error.msg).join(', ');
                    toast.error('Erros de validação', {
                        description: validationErrors,
                        icon: <XCircle className="w-4 h-4" />
                    });
                }
            } else {
                toast.error('Erro de conexão', {
                    description: 'Não foi possível conectar com o servidor. Verifique sua conexão.',
                    icon: <XCircle className="w-4 h-4" />
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/orders');
    };

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
                            Cadastrar Nova Ordem de Produção
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Crie uma nova ordem de produção
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Ordem de Produção
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Informações da Ordem de Produção
                    </CardTitle>
                    <CardDescription>
                        Preencha os dados da ordem de produção. Campos marcados com * são obrigatórios.
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

                        {/* Quantidade e Datas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <PlusCircle className="w-4 h-4 mr-2" />
                                {loading ? 'Cadastrando...' : 'Cadastrar Ordem'}
                            </LoadingButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Preview Card */}
            {(formData.name || formData.code) && (
                <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Prévia da Ordem de Produção
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {formData.name && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nome:</span>
                                <span className="font-medium">{formData.name}</span>
                            </div>
                        )}
                        {formData.code && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Código:</span>
                                <Badge variant="secondary" className="font-mono">
                                    {formData.code}
                                </Badge>
                            </div>
                        )}
                        {formData.quantity > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Quantidade:</span>
                                <span className="font-medium">
                                    {formData.quantity.toLocaleString('pt-BR')} unidades
                                </span>
                            </div>
                        )}
                        {formData.start_date && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Início:</span>
                                <span className="font-medium">
                                    {new Date(formData.start_date).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProductionOrderCreatePage;