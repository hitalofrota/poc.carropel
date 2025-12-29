import { useState } from "react";

export interface SalesOrderItemForm {
  product_id: number;
  quantity: number;
  delivery_date?: string | null;
}

export interface SalesOrderFormData {
  customer_id: number;
  items: SalesOrderItemForm[];
}

interface Props {
  onSubmit: (data: SalesOrderFormData) => void;
}

export default function SalesOrderForm({ onSubmit }: Props) {
  const [customerId, setCustomerId] = useState<number>(0);
  const [items, setItems] = useState<SalesOrderItemForm[]>([
    { product_id: 0, quantity: 1 },
  ]);

  const updateItem = (
    index: number,
    field: keyof SalesOrderItemForm,
    value: number
  ) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, quantity: 1 }]);
  };

  const submit = () => {
    onSubmit({
      customer_id: customerId,
      items,
    });
  };

  return (
    <div>
      <div>
        <label>Cliente (ID)</label>
        <input
          type="number"
          value={customerId}
          onChange={(e) => setCustomerId(Number(e.target.value))}
        />
      </div>

      <h3>Itens</h3>

      {items.map((item, index) => (
        <div key={index}>
          <input
            type="number"
            placeholder="Product ID"
            value={item.product_id}
            onChange={(e) =>
              updateItem(index, "product_id", Number(e.target.value))
            }
          />

          <input
            type="number"
            min={1}
            placeholder="Quantidade"
            value={item.quantity}
            onChange={(e) =>
              updateItem(index, "quantity", Number(e.target.value))
            }
          />
        </div>
      ))}

      <button onClick={addItem}>Adicionar item</button>
      <br /><br />
      <button onClick={submit}>Salvar</button>
    </div>
  );
}
