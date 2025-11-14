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

// Reutilizamos a interface (você pode movê-la para um arquivo de 'types'
// para compartilhar entre os arquivos)
interface Order {
  id: string;
  customer: string;
  date: string;
  status: "Pendente" | "Enviado" | "Concluído" | "Cancelado";
  total: number;
}

// Props que o nosso modal receberá
interface OrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: Order) => void;
  initialData: Order | null; // Se for 'null', é modo "Adicionar". Se tiver dados, é "Editar".
}

const OrderFormDialog = ({ isOpen, onClose, onSubmit, initialData }: OrderFormDialogProps) => {
  // Estado interno do formulário
  const [formData, setFormData] = useState<Omit<Order, 'id' | 'date'>>({
    customer: "",
    status: "Pendente",
    total: 0,
  });

  const isEditMode = !!initialData;

  // Sincroniza o estado do formulário com os dados iniciais (para o modo "Editar")
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        customer: initialData.customer,
        status: initialData.status,
        total: initialData.total,
      });
    } else {
      // Reseta o formulário para o modo "Adicionar"
      setFormData({
        customer: "",
        status: "Pendente",
        total: 0,
      });
    }
  }, [initialData, isEditMode, isOpen]); // Roda quando os props mudam ou o modal abre

  // Handler para atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleStatusChange = (value: Order['status']) => {
    setFormData(prev => ({
      ...prev,
      status: value,
    }));
  };

  // Handler para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação simples
    if (!formData.customer || formData.total <= 0) {
      toast.error("Por favor, preencha o nome do cliente e um total válido.");
      return;
    }

    // Monta o objeto final do pedido
    const finalOrderData: Order = {
      // Se for modo de edição, usa o ID existente, senão cria um novo
      id: isEditMode ? initialData!.id : `ORD-${Math.floor(Math.random() * 900) + 100}`,
      // Se for modo de edição, usa a data existente, senão cria uma nova
      date: isEditMode ? initialData!.date : new Date().toISOString(),
      ...formData,
    };

    onSubmit(finalOrderData); // Envia os dados para o componente pai
    onClose(); // Fecha o modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Pedido" : "Adicionar Novo Pedido"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? `Editando o pedido ${initialData?.id}.`
                : "Preencha os detalhes para criar um novo pedido."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Campo Cliente */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Cliente
              </Label>
              <Input
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Nome do Cliente"
              />
            </div>

            {/* Campo Total */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total" className="text-right">
                Total (R$)
              </Label>
              <Input
                id="total"
                name="total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={handleChange}
                className="col-span-3"
                placeholder="150.00"
              />
            </div>
            
            {/* Campo Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="upload">
              {isEditMode ? "Salvar Alterações" : "Adicionar Pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormDialog;