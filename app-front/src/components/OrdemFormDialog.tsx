import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { Order, OrderItem } from "./OrdersPage";
import { Trash2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Order) => void;
  initialData: Order | null;
}

const OrderFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const [id, setId] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number>();
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setCustomer(initialData.customer);
      setNotes(initialData.notes || "");
      setItems(initialData.items);
    } else {
      setId("");
      setCustomer("");
      setNotes("");
      setItems([]);
    }
  }, [initialData]);

  const addItem = () => {
    if (!productId || quantity <= 0) return;

    setItems((prev) => [...prev, { product_id: productId, quantity }]);
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit({
      id,
      customer,
      notes,
      status: "Pendente",
      items,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Pedido" : "Novo Pedido"}
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Número do Pedido"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={!!initialData}
        />

        <Input
          placeholder="Cliente"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />

        <Input
          placeholder="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* ===== ADD ITEM ===== */}
        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1 flex-1"
            onChange={(e) => setProductId(Number(e.target.value))}
          >
            <option>Selecione um produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24"
          />

          <Button onClick={addItem}>Adicionar</Button>
        </div>

        {/* ===== ITEMS LIST ===== */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center border rounded p-2"
            >
              <span>
                Produto #{item.product_id} — Qtde: {item.quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Salvar Pedido
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormDialog;
