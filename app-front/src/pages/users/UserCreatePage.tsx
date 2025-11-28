import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowLeft,
  User,
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserCreateData } from '../../types/user';
import { userService } from '../../services';
import LoadingButton from '../../components/LoadingButton';

const UserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    
    const [formData, setFormData] = useState<UserCreateData>({
        name: '',
        email: '',
        password: '',
        role: 'viewer'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRoleChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            role: value as 'admin' | 'manager' | 'viewer'
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await userService.createUser(formData);
            
            toast.success('Usuário criado com sucesso!', {
                description: `O usuário ${formData.name} foi cadastrado no sistema.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            // Limpar formulário após sucesso
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'viewer'
            });

            // Redirecionar após 1 segundo
            setTimeout(() => {
                navigate('/users');
            }, 1000);

        } catch (err: any) {
            console.error('Erro ao criar usuário:', err);
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao criar usuário', {
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
        navigate('/users');
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
                            Cadastrar Novo Usuário
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Adicione um novo usuário ao sistema
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Usuário
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" />
                        Informações do Usuário
                    </CardTitle>
                    <CardDescription>
                        Preencha os dados do usuário. Campos marcados com * são obrigatórios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome e Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nome Completo *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Arthur Almeida"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email *
                                </Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: arthur.almeida@example.com"
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Senha e Permissão */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Senha *
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Permissão *
                                </Label>
                                <Select value={formData.role} onValueChange={handleRoleChange}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione a permissão" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Visualizador</SelectItem>
                                        <SelectItem value="manager">Gerente</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                            </LoadingButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserCreatePage;