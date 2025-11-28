import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
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

import { ProductCreateData, ProductResponse } from '../../types/product';
import { productService } from '../../services/productService';
import LoadingButton from '../../components/LoadingButton';

const ProductEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
    
    const [formData, setFormData] = useState<ProductCreateData>({
        name: '',
        code: '',
        description: '',
        unit_cost: null,
        unit_price: null,
        net_weight: null,
        gross_weight: null
    });

    // Carrega os dados do produto
    useEffect(() => {
        const loadProduct = async () => {
            if (!id) {
                toast.error('ID do produto não informado');
                navigate('/products');
                return;
            }

            try {
                setLoadingProduct(true);
                const productId = parseInt(id);
                const product = await productService.getProduct(productId);
                
                setFormData({
                    name: product.name,
                    code: product.code,
                    description: product.description || '',
                    unit_cost: product.unit_cost,
                    unit_price: product.unit_price,
                    net_weight: product.net_weight,
                    gross_weight: product.gross_weight
                });
            } catch (error) {
                console.error('Erro ao carregar produto:', error);
                toast.error('Erro ao carregar dados do produto');
                navigate('/products');
            } finally {
                setLoadingProduct(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

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
        
        if (!id) {
            toast.error('ID do produto não informado');
            return;
        }

        setLoading(true);

        try {
            const productId = parseInt(id);
            const updatedProduct = await productService.updateProduct(productId, formData);
            
            toast.success('Produto atualizado com sucesso!', {
                description: `O produto ${formData.name} foi atualizado.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            navigate('/products', { 
            state: { 
                    updatedProduct: updatedProduct,
                    action: 'edit'
                }
            });

        } catch (err: any) {
            console.error('Erro ao atualizar produto:', err);
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao atualizar produto', {
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
        navigate('/products');
    };

    if (loadingProduct) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground">Carregando produto...</p>
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
                            Editar Produto
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Atualize as informações do produto
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Package className="w-3 h-3 mr-1" />
                    ID: {id}
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Informações do Produto
                    </CardTitle>
                    <CardDescription>
                        Atualize os dados do produto. Campos marcados com * são obrigatórios.
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

export default ProductEditPage;