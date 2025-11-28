import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
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

import { UserUpdateData, UserResponse } from '../../types/user';
import { userService } from '../../services';
import LoadingButton from '../../components/LoadingButton';

const UserEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    
    const [formData, setFormData] = useState<UserUpdateData>({
        name: '',
        email: '',
        password: '',
        role: 'viewer'
    });

    // Carrega os dados do usuário
    useEffect(() => {
        const loadUser = async () => {
            if (!id) {
                toast.error('ID do usuário não informado');
                navigate('/users');
                return;
            }

            try {
                setLoadingUser(true);
                const userId = parseInt(id);
                const user = await userService.getUser(userId);
                
                setFormData({
                    name: user.name,
                    email: user.email,
                    role: user.role
                    // Password não é preenchido por segurança
                });
            } catch (error) {
                console.error('Erro ao carregar usuário:', error);
                toast.error('Erro ao carregar dados do usuário');
                navigate('/users');
            } finally {
                setLoadingUser(false);
            }
        };

        loadUser();
    }, [id, navigate]);

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
        
        if (!id) {
            toast.error('ID do usuário não informado');
            return;
        }

        setLoading(true);

        try {
            const userId = parseInt(id);
            const updatedUser = await userService.updateUser(userId, formData);
            
            toast.success('Usuário atualizado com sucesso!', {
                description: `O usuário ${formData.name} foi atualizado.`,
                icon: <CheckCircle className="w-4 h-4" />
            });
            
            // Redireciona mantendo o estado
            navigate('/users', { 
                state: { 
                    updatedUser: updatedUser,
                    action: 'edit'
                }
            });

        } catch (err: any) {
            console.error('Erro ao atualizar usuário:', err);
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                if (typeof errorData.detail === 'string') {
                    toast.error('Erro ao atualizar usuário', {
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

    if (loadingUser) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <User className="h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground">Carregando usuário...</p>
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
                            Editar Usuário
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Atualize as informações do usuário
                    </p>
                </div>
                
                <Badge variant="secondary" className="px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    ID: {id}
                </Badge>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Informações do Usuário
                    </CardTitle>
                    <CardDescription>
                        Atualize os dados do usuário. Deixe a senha em branco para mantê-la inalterada.
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
                                    Nova Senha
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password || ''}
                                    onChange={handleChange}
                                    placeholder="Deixe em branco para manter atual"
                                    minLength={6}
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mínimo 6 caracteres
                                </p>
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

export default UserEditPage;