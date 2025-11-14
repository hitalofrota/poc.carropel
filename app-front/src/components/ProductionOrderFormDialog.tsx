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
import { Textarea } from "@/components/ui/textarea"; 
import { toast } from "sonner";

export interface ProductionOrder {
  id: string; 
  produto: string;
  quantidade: number;
  dataInicio: string;
  dataTermino: string; 
  materiais: string; 
  roteiro: string;
  responsavel: string;
  dataEmissao: string;
  status: "Planejada" | "Em Andamento" | "Concluída" | "Cancelada";
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductionOrder) => void;
  initialData: ProductionOrder | null;
}

type FormData = Omit<ProductionOrder, 'id' | 'dataEmissao'>;

const ProductionOrderFormDialog = ({ isOpen, onClose, onSubmit, initialData }: DialogProps) => {
  
  const getInitialFormData = (): FormData => ({
    produto: "",
    quantidade: 1,
    dataInicio: new Date().toISOString().split('T')[0], 
    dataTermino: new Date().toISOString().split('T')[0], 
    materiais: "",
    roteiro: "",
    responsavel: "",
    status: "Planejada",
  });
  
  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        produto: initialData.produto,
        quantidade: initialData.quantidade,
        dataInicio: initialData.dataInicio,
        dataTermino: initialData.dataTermino,
        materiais: initialData.materiais,
        roteiro: initialData.roteiro,
        responsavel: initialData.responsavel,
        status: initialData.status,
      });
    } else {
      setFormData(getInitialFormData()); 
    }
  }, [initialData, isEditMode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleStatusChange = (value: ProductionOrder['status']) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.produto || formData.quantidade <= 0 || !formData.responsavel) {
      toast.error("Preencha Produto, Quantidade (> 0) e Responsável.");
      return;
    }

    const finalData: ProductionOrder = {
      id: isEditMode ? initialData!.id : `OP-${Math.floor(Math.random() * 900) + 100}`,
      dataEmissao: isEditMode ? initialData!.dataEmissao : new Date().toISOString(),
      ...formData,
    };

    onSubmit(finalData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Ordem de Produção" : "Nova Ordem de Produção"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? `Editando a OP ${initialData?.id}.`
                : "Preencha os dados da nova Ordem de Produção."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-3 gap-4">
              {/* Produto */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="produto">Produto</Label>
                <Input id="produto" name="produto" value={formData.produto} onChange={handleChange} />
              </div>
              
              {/* Quantidade */}
              <div className="space-y-2 col-span-1">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input id="quantidade" name="quantidade" type="number" value={formData.quantidade} onChange={handleChange} min="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Data Início */}
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input id="dataInicio" name="dataInicio" type="date" value={formData.dataInicio} onChange={handleChange} />
              </div>
              
              {/* Data Término */}
              <div className="space-y-2">
                <Label htmlFor="dataTermino">Data de Término</Label>
                <Input id="dataTermino" name="dataTermino" type="date" value={formData.dataTermino} onChange={handleChange} />
              </div>
            </div>

            {/* Materiais */}
            <div className="space-y-2">
              <Label htmlFor="materiais">Materiais (Nome e Qtd.)</Label>
              <Textarea id="materiais" name="materiais" value={formData.materiais} onChange={handleChange} placeholder="Ex: 10x Parafuso A, 2x Chapa de Madeira B" />
            </div>

            {/* Roteiro */}
            <div className="space-y-2">
              <Label htmlFor="roteiro">Roteiro de Produção (Etapas)</Label>
              <Textarea id="roteiro" name="roteiro" value={formData.roteiro} onChange={handleChange} placeholder="Ex: 1. Cortar madeira, 2. Montar estrutura, 3. Pintar..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Responsável */}
                <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input id="responsavel" name="responsavel" value={formData.responsavel} onChange={handleChange} placeholder="Nome do encarregado" />
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" value={formData.status} onValueChange={handleStatusChange}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Planejada">Planejada</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Concluída">Concluída</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="upload">
              {isEditMode ? "Salvar Alterações" : "Criar Ordem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionOrderFormDialog;