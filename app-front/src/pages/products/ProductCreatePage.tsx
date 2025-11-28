import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowLeft,
  Package,
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

import { ProductCreateData, ApiError } from '../../types/product';
import { productService } from '../../services/productService';
import LoadingButton from '../../components/LoadingButton';

const ProductCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<ProductCreateData>({
        name: '',
        code: '',
        description: '',
        unit_cost: null,
        unit_price: null,
        net_weight: null,
        gross_weight: null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : 
                    (name === 'unit_cost' || name === 'unit_price' || name === 'net_weight' || name === 'gross_weight') 
                    ? parseFloat(value) 
                    : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await productService.createProduct(formData);
            
            toast.success('Produto criado com sucesso!', {
                description: `O produto ${formData.name} foi cadastrado no sistema.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            // Limpar formulário após sucesso
            setFormData({
                name: '',
                code: '',
                description: '',
                unit_cost: null,
                unit_price: null,
                net_weight: null,
                gross_weight: null
            });

            // Redirecionar após 1 segundo
            setTimeout(() => {
                navigate('/products');
            }, 1000);

        } catch (err: any) {
            console.error('Erro ao criar produto:', err);
            
            if (err.response?.data) {
                const errorData: ApiError = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao criar produto', {
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
        navigate('/products');
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
                            Cadastrar Novo Produto
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Adicione um novo produto ao seu catálogo
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Package className="w-3 h-3 mr-1" />
                    Produto
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Informações do Produto
                    </CardTitle>
                    <CardDescription>
                        Preencha os dados básicos do produto. Campos marcados com * são obrigatórios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome e Código */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome do Produto *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Teto Bau"
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
                                    placeholder="Ex: TETO-BAU-002"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Descrição
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ex: Teto Bau 7m com acabamento premium..."
                                rows={3}
                            />
                        </div>

                        {/* Custos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost">
                                    Custo Unitário (R$)
                                </Label>
                                <Input
                                    type="number"
                                    id="unit_cost"
                                    name="unit_cost"
                                    value={formData.unit_cost || ''}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit_price">
                                    Preço de Venda (R$)
                                </Label>
                                <Input
                                    type="number"
                                    id="unit_price"
                                    name="unit_price"
                                    value={formData.unit_price || ''}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Pesos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="net_weight">
                                    Peso Líquido (kg)
                                </Label>
                                <Input
                                    type="number"
                                    id="net_weight"
                                    name="net_weight"
                                    value={formData.net_weight || ''}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gross_weight">
                                    Peso Bruto (kg)
                                </Label>
                                <Input
                                    type="number"
                                    id="gross_weight"
                                    name="gross_weight"
                                    value={formData.gross_weight || ''}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
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
                                {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
                            </LoadingButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Preview Card (Opcional) */}
            {(formData.name || formData.code) && (
                <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Prévia do Produto
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
                        {formData.unit_price && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Preço:</span>
                                <span className="font-medium text-green-600">
                                    {formData.unit_price.toLocaleString('pt-BR', { 
                                        style: 'currency', 
                                        currency: 'BRL' 
                                    })}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProductCreatePage;