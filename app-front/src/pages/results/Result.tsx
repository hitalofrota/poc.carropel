import { Button } from "@/components/ui/button";
import ComponentTree from "@/components/ComponentTree";
import { useUploadStore } from "@/store/useUploadStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const { result } = useUploadStore();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!result) {
      toast.error("Nenhum dado para importar");
      return;
    }

    try {
      toast.info("Enviando dados...");

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/products/import-bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" ,
                   Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar dados");
      }

      toast.success("Importação concluída!");
      navigate("/upload");

    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar dados");
    }
  };

  const handleCancel = () => {
    toast.info("Importação cancelada");
    navigate("/upload");
  };
  console.log("RESULT:", result);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pré-visualização da Estrutura</h1>

      {result ? (
        <ComponentTree nodes={result.components ?? []} />

      ) : (
        <p className="text-muted-foreground">Nenhum dado encontrado.</p>
      )}

      <div className="flex gap-4 pt-4">
        <Button 
          variant="default" 
          className="flex-1"
          onClick={handleConfirm}
        >
          Confirmar Importação
        </Button>

        <Button 
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default Result;

