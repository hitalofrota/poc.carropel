import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  MoreHorizontal, 
  Users,
  Edit,
  Trash2,
  Eye,
  Shield,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { UserResponse } from '../../types/user';
import { userService } from '../../services';

const UsersPage = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    loadUsers();
  }, []);

  // Atualizar após edição
  useEffect(() => {
    if (location.state?.updatedUser && location.state?.action === 'edit') {
      const { updatedUser } = location.state;
      
      setUsers(prev => 
        prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await userService.deleteUser(id);
        setUsers(prev => prev.filter(user => user.id !== id));
        toast.success('Usuário excluído com sucesso');
      } catch (error: any) {
        console.error('Erro ao excluir usuário:', error);
        
        if (error.response?.status === 400) {
          toast.error('Não é possível excluir usuário com dependências');
        } else {
          toast.error('Erro ao excluir usuário');
        }
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { variant: "destructive" as const, label: "Admin" },
      manager: { variant: "default" as const, label: "Gerente" },
      viewer: { variant: "outline" as const, label: "Visualizador" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      
      {/* Header com botões de ação */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        
        {/* Botão para criar novo usuário */}
        <Button asChild variant="upload">
          <Link to="/users/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Usuário
          </Link>
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {users.length} usuários</span>
          <span>Filtrados: {filteredUsers.length}</span>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Users className="h-6 w-6 animate-spin mr-2" />
                    Carregando usuários...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      
                      {/* Dropdown com mais opções */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          
                          <DropdownMenuItem asChild>
                            <Link to={`/users/edit/${user.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Usuário
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-12 w-12 mb-2 opacity-50" />
                    <p className="font-medium">
                      {searchTerm 
                        ? `Nenhum usuário encontrado para "${searchTerm}".`
                        : "Nenhum usuário cadastrado."
                      }
                    </p>
                    {!searchTerm && (
                      <Button asChild variant="link" className="mt-2">
                        <Link to="/users/create">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Criar primeiro usuário
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersPage;