import FileUpload from "@/components/FileUpload";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>CARROPEL - Upload de Arquivos</title>
        <meta 
          name="description" 
          content="Sistema de upload de arquivos TXT - CARROPEL. Envie seus arquivos de forma simples e segura." 
        />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-1 flex items-center justify-center py-12">
          <FileUpload />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Index;
