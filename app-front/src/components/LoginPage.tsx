import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CompanyLogo = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-muted rounded-l-3xl">
      <div className="text-center space-y-8 max-w-sm">
        <div className="space-y-4">
          <div className="w-32 h-32 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <img 
              src="/src/assets/carropel-logo.png" 
              alt="Logo da Carropel" 
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-muted-foreground text-lg">
            Bem-vindo de volta ao nosso sistema
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      toast.success("Login realizado com sucesso!");
      console.log("Email:", email, "Password:", password);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <form 
          onSubmit={handleSubmit} 
          className="flex flex-col items-center justify-center gap-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Acesse sua conta
            </h2>
            <p className="text-muted-foreground">
              Entre com seu e-mail e senha
            </p>
          </div>

          {/* Campos do Formulário */}
          <div className="w-full space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seunome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-11"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            variant="upload"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {/* 
          <a 
            href="#" 
            className="text-sm text-primary hover:underline"
          >
            Esqueceu sua senha?
          </a>
          */}
        </form>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-3xl shadow-xl border-2 border-transparent flex flex-col lg:flex-row min-h-[600px]">
          <CompanyLogo />
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;