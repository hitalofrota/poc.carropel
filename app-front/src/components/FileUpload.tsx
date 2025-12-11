import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUploadStore } from "@/store/useUploadStore";

const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const setResult = useUploadStore((s) => s.setResult);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Apenas arquivos CSV são permitidos");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB");
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      toast.success("Arquivo carregado com sucesso!");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      toast.success("Arquivo carregado com sucesso!");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    toast.info("Arquivo removido");
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    try {
      toast.info("Processando arquivo...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload/debug", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao processar o arquivo");
      }

      const data = await response.json();

      setResult(data);       // Save result globally
      toast.success("Arquivo processado com sucesso!");

      navigate("/upload/result"); // Go to result page

    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar o arquivo");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          bg-card rounded-3xl p-12 shadow-xl transition-all duration-300
          ${isDragging ? "border-2 border-primary scale-105" : "border-2 border-transparent"}
        `}
      >
        <div className="flex flex-col items-center justify-center gap-6">
          {!file ? (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-10 h-10 text-primary" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Envie seu arquivo
                </h2>
                <p className="text-muted-foreground">
                  ou arraste um arquivo CSV
                </p>
              </div>

              <input
                type="file"
                id="file-input"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                variant="upload"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                Faça upload
              </Button>

              <p className="text-sm text-muted-foreground">
                Apenas arquivos .csv até 10MB
              </p>
            </>
          ) : (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleProcessFile}
                >
                  Processar arquivo
                </Button>

                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  Trocar arquivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
