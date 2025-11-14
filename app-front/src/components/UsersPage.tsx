import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Search,
  MoreHorizontal,
  Users, // Ícone para usuários
  Trash2,
  Edit,
  ShieldCheck, // Ícone para Admin
  UserCheck,   // Ícone para Membro
  User as UserIcon, // Ícone para Convidado (renomeado para evitar conflito de nome)
} from "lucide-react";

// --- Assinaturas de componentes Shadcn/UI (assumidos como globais) ---
// Estes são importados aqui para clareza, mas no ambiente final
// eles são resolvidos pelo "@/components/ui/..."
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


// --- Interface de Usuário ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Membro" | "Convidado";
  createdAt: string;
}

// --- Componente UserFormDialog (Definido no mesmo arquivo) ---
interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: User) => void;
  initialData: User | null;
}

const UserFormDialog = ({ isOpen, onClose, onSubmit, initialData }: UserFormDialogProps) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt'>>({
    name: "",
    email: "",
    role: "Membro",
  });

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "Membro",
      });
    }
  }, [initialData, isEditMode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: User['role']) => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Por favor, preencha o nome e o e-mail.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
       toast.error("Por favor, insira um e-mail válido.");
       return;
    }

    const finalUserData: User = {
      id: isEditMode ? initialData!.id : `USR-${Math.floor(Math.random() * 9000) + 1000}`,
      createdAt: isEditMode ? initialData!.createdAt : new Date().toISOString(),
      ...formData,
    };

    onSubmit(finalUserData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Editando o perfil de ${initialData?.name}.`
                : "Preencha os detalhes para criar um novo usuário."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Nome Completo"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                placeholder="usuario@email.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Nível
              </Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Membro">Membro</SelectItem>
                  <SelectItem value="Convidado">Convidado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="upload">
              {isEditMode ? "Salvar Alterações" : "Adicionar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// Chave do localStorage para usuários
const USERS_STORAGE_KEY = "carropel_users";

// Componente de Badge para o Nível de Acesso
const UserRoleBadge = ({ role }: { role: User['role'] }) => {
  const variantMap: { [key in User['role']]: "destructive" | "default" | "secondary" | "outline" } = {
    "Admin": "destructive",
    "Membro": "default",
    "Convidado": "secondary",
  };
  
  const iconMap: { [key in User['role']]: React.ReactElement } = {
     "Admin": <ShieldCheck className="mr-1 h-3.5 w-3.5" />,
     "Membro": <UserCheck className="mr-1 h-3.5 w-3.5" />,
     "Convidado": <UserIcon className="mr-1 h-3.5 w-3.5" />,
  };

  return (
    <Badge variant={variantMap[role] || 'default'} className="flex-shrink-0">
      {iconMap[role]}
      {role}
    </Badge>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Carrega os usuários do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Dados iniciais se o localStorage estiver vazio
        const initialData: User[] = [
           { id: "USR-0001", name: "Admin Carropel", email: "admin@carropel.com", role: "Admin", createdAt: new Date().toISOString() },
           { id: "USR-0002", name: "Usuário Membro", email: "membro@carropel.com", role: "Membro", createdAt: new Date().toISOString() },
        ];
        updateUsersAndStorage(initialData);
      }
    } catch (error) {
      console.error("Falha ao ler usuários do localStorage:", error);
      toast.error("Erro ao carregar usuários salvos.");
    }
  }, []);

  // Função centralizada para atualizar estado e localStorage
  const updateUsersAndStorage = (newUsers: User[]) => {
    // Ordena por data de criação (mais novos primeiro)
    const sortedUsers = newUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setUsers(sortedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sortedUsers));
  };

  // Lida com a submissão do formulário (Adicionar ou Editar)
  const handleFormSubmit = (userData: User) => {
    const isEditing = users.some(u => u.id === userData.id);

    if (isEditing) {
      const updatedUsers = users.map(u => (u.id === userData.id ? userData : u));
      updateUsersAndStorage(updatedUsers);
      toast.success(`Usuário ${userData.name} atualizado com sucesso!`);
    } else {
      const updatedUsers = [...users, userData];
      updateUsersAndStorage(updatedUsers);
      toast.success(`Usuário ${userData.name} criado com sucesso!`);
    }
  };

  // Lida com a exclusão de usuário
  const handleDeleteUser = (id: string) => {
    // NOTA: Em uma aplicação real, é altamente recomendável usar
    // um componente <AlertDialog> do shadcn/ui para confirmar
    // esta ação, em vez de `window.confirm`.
    
    const updatedUsers = users.filter(user => user.id !== id);
    updateUsersAndStorage(updatedUsers);
    toast.error(`Usuário ${id} foi excluído.`);
  };

  // Funções para controlar o modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Filtra os usuários com base na busca
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      
      {/* Cabeçalho e Botão de Adicionar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Usuários são salvos localmente no seu navegador.
          </p>
        </div>
        <Button variant="upload" onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por ID, nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 w-full md:w-2/3 lg:w-1/3"
        />
      </div>

      {/* Tabela de Usuários */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ID do Usuário</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <UserRoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                  <TableCell>
                    {/* Menu de Ações por linha */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenEditModal(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Usuário
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Estado de "Nenhum resultado"
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm
                    ? `Nenhum usuário encontrado para "${searchTerm}".`
                    : "Nenhum usuário registrado."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Estado Vazio (quando não há usuários e nem busca) */}
      {users.length === 0 && !searchTerm && (
         <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
           <Users className="w-16 h-16 mb-4" />
           <h3 className="text-lg font-semibold">Sem Usuários</h3>
           <p>Nenhum usuário foi registrado ainda.</p>
           <p>Clique em "Adicionar Usuário" para começar.</p>
       </div>
      )}

      {/* Renderiza o Modal de Formulário */}
      <UserFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
      />
    </div>
  );
};

// Componente App (Exportação Padrão)
// Este é o componente que será renderizado
const App = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <main className="flex-1">
                <UsersPage />
            </main>
        </div>
    )
}

export default App;