import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// 1. Definimos a interface para o Usuário
export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Membro" | "Convidado";
  createdAt: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: User) => void;
  initialData: User | null; // Nulo para "Adicionar", com dados para "Editar"
}

const UserFormDialog = ({ isOpen, onClose, onSubmit, initialData }: UserFormDialogProps) => {
  // Estado interno do formulário, omitindo 'id' e 'createdAt'
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt'>>({
    name: "",
    email: "",
    role: "Membro", // Papel padrão
  });

  const isEditMode = !!initialData;

  // Sincroniza o formulário com os dados iniciais (para Edição)
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
      });
    } else {
      // Reseta para o modo "Adicionar"
      setFormData({
        name: "",
        email: "",
        role: "Membro",
      });
    }
  }, [initialData, isEditMode, isOpen]);

  // Handler genérico para inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler específico para o Select (Nível de Acesso)
  const handleRoleChange = (value: User['role']) => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }));
  };

  // Handler para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação simples
    if (!formData.name || !formData.email) {
      toast.error("Por favor, preencha o nome e o e-mail.");
      return;
    }
    // Validação básica de e-mail
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
       toast.error("Por favor, insira um e-mail válido.");
       return;
    }

    // Monta o objeto final do usuário
    const finalUserData: User = {
      id: isEditMode ? initialData!.id : `USR-${Math.floor(Math.random() * 9000) + 1000}`,
      createdAt: isEditMode ? initialData!.createdAt : new Date().toISOString(),
      ...formData,
    };

    onSubmit(finalUserData); // Envia para o componente pai
    onClose(); // Fecha o modal
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
            {/* Campo Nome */}
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

            {/* Campo E-mail */}
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
            
            {/* Campo Nível de Acesso (Role) */}
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

export default UserFormDialog;