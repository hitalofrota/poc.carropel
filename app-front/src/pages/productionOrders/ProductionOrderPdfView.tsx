import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { productionOrderService } from "@/services/productionOrders";

const ProductionOrderPdfView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error("ID da ordem de produção inválido");
      navigate(-1);
      return;
    }

    gerarPdf(Number(id));

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const gerarPdf = async (orderId: number) => {
    try {
      setLoading(true);

      /**
       * 🔑 Aqui o frontend NÃO constrói payload
       * Apenas pede o PDF pelo ID
       */
      const pdfBlob = await productionOrderService.getPdfByOrderId(
        orderId
      );

      const url = URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" })
      );

      setPdfUrl(url);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar o PDF da ordem de produção");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `ordem_producao_${id}.pdf`;
    link.click();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Ordem de Produção #{id}
          </span>
        </div>

        <Button
          onClick={handleDownload}
          disabled={!pdfUrl || loading}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar PDF
        </Button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Gerando PDF da ordem de produção...
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="PDF Ordem de Produção"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Não foi possível carregar o PDF.
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductionOrderPdfView;
