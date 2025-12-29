import { useState } from "react";
import { createSalesOrder } from "@/services/api/salesOrders";

interface ItemForm {
  product_id: number;
  quantity: number;
}

export default function SalesOrderCreate() {
  const [customerId, setCustomerId] = useState<number>(0);
  const [items, setItems] = useState<ItemForm[]>([
    { product_id: 0, quantity: 1 },
  ]);

  const handleItemChange = (
    index: number,
    field: keyof ItemForm,
    value: number
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, quantity: 1 }]);
  };

  const handleSubmit = async () => {
    try {
      await createSalesOrder({
        customer_id: customerId,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          delivery_date: null,
        })),
      });

      alert("Pedido de venda criado com sucesso!");
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.detail ??
          "Erro ao criar pedido de venda"
      );
    }
  };

  return (
    <div>
      <h2>Criar Pedido de Venda</h2>

      <div>
        <label>ID do Cliente</label>
        <input
          type="number"
          value={customerId}
          onChange={(e) => setCustomerId(Number(e.target.value))}
        />
      </div>

      <h3>Itens</h3>

      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 8 }}>
          <input
            type="number"
            placeholder="Product ID"
            value={item.product_id}
            onChange={(e) =>
              handleItemChange(index, "product_id", Number(e.target.value))
            }
          />

          <input
            type="number"
            placeholder="Quantidade"
            value={item.quantity}
            min={1}
            onChange={(e) =>
              handleItemChange(index, "quantity", Number(e.target.value))
            }
          />
        </div>
      ))}

      <button onClick={addItem}>Adicionar item</button>
      <br /><br />
      <button onClick={handleSubmit}>Salvar Pedido</button>
    </div>
  );
}
