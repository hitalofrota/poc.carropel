import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api } from "@/services/api";

/* ================= TYPES ================= */

interface Product {
  id: number;
  name: string;
}

interface SalesOrderItemForm {
  product_id: number | null;
  quantity: number;
  delivery_date?: string | null;
}

interface SalesOrderPayload {
  order_number: string;
  customer: string;
  notes?: string | null;
  delivery_date?: string | null;
  items: SalesOrderItemForm[];
}

/* ================= COMPONENT ================= */

const SalesOrderCreatePage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SalesOrderPayload>({
    order_number: "",
    customer: "",
    notes: "",
    delivery_date: null,
    items: [
      {
        product_id: null,
        quantity: 1,
        delivery_date: null,
      },
    ],
  });

  /* ========= LOAD PRODUCTS ========= */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await api.get("/products/");
        setProducts(data);
      } catch {
        toast.error("Erro ao carregar produtos");
      }
    };

    loadProducts();
  }, []);

  /* ========= ITEMS HANDLERS ========= */

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: null, quantity: 1, delivery_date: null },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof SalesOrderItemForm,
    value: any
  ) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setFormData({ ...formData, items: updatedItems });
  };

  /* ========= SUBMIT ========= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validações básicas frontend
    if (formData.items.length === 0) {
      toast.error("Adicione ao menos um item");
      return;
    }

    if (formData.items.some((i) => !i.product_id)) {
      toast.error("Selecione um produto para todos os itens");
      return;
    }

    setLoading(true);

    try {
      const payload: SalesOrderPayload = {
        order_number: formData.order_number,
        customer: formData.customer,
        notes: formData.notes || null,
        delivery_date: formData.delivery_date,
        items: formData.items.map((item) => ({
          product_id: item.product_id as number,
          quantity: Number(item.quantity),
          delivery_date: item.delivery_date || null,
        })),
      };

      await api.post("/sales-orders/", payload);

      toast.success("Pedido de venda criado com sucesso");
      navigate("/sales-order");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail ||
          "Erro ao criar pedido de venda"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Pedido de Venda</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pedido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº Pedido</Label>
                <Input
                  value={formData.order_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_number: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label>Cliente</Label>
                <Input
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Data de entrega do pedido</Label>
              <Input
                type="date"
                value={formData.delivery_date || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_date: e.target.value || null,
                  })
                }
              />
            </div>

            {/* Itens */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Itens</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar item
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 items-end border p-4 rounded-md"
                >
                  <div className="col-span-2">
                    <Label>Produto</Label>
                    <Select
                      value={
                        item.product_id
                          ? String(item.product_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        updateItem(
                          index,
                          "product_id",
                          Number(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={String(product.id)}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
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

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/sales-order")}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Criar Pedido"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesOrderCreatePage;
