import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  SalesOrder,
  SalesOrderPayload,
} from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SalesOrderPayload) => void;
  initialData?: SalesOrder | null;
}

const SalesOrderFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { product_id: 0, quantity: 1 },
  ]);

  useEffect(() => {
    if (initialData) {
      setOrderNumber(initialData.order_number);
      setCustomer(initialData.customer);
      setNotes(initialData.notes ?? "");
      setItems(initialData.items);
    } else {
      setOrderNumber("");
      setCustomer("");
      setNotes("");
      setItems([{ product_id: 0, quantity: 1 }]);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([
      ...items,
      { product_id: 0, quantity: 1 },
    ]);
  };

  const updateItem = (
    index: number,
    field: "product_id" | "quantity",
    value: number
  ) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const submit = () => {
    onSubmit({
      order_number: orderNumber,
      customer,
      notes,
      items,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Editar Pedido de Venda"
              : "Novo Pedido de Venda"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Número do Pedido (ex: PED-001)"
            value={orderNumber}
            onChange={(e) =>
              setOrderNumber(e.target.value)
            }
          />

          <Input
            placeholder="Cliente"
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value)
            }
          />

          <Input
            placeholder="Observações"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />

          {items.map((item, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <Input
                type="number"
                placeholder="Produto ID"
                value={item.product_id}
                onChange={(e) =>
                  updateItem(
                    index,
                    "product_id",
                    Number(e.target.value)
                  )
                }
              />

              <Input
                type="number"
                min={1}
                placeholder="Qtd"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(
                    index,
                    "quantity",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addItem}
          >
            Adicionar Item
          </Button>

          <Button onClick={submit}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesOrderFormDialog;
