import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const RegisterForm = () => {
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

      setIsLoading(false);
      // Limpar campos após sucesso (opcional)
      // setEmail("");
      // setPassword("");
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div
        className="
          bg-card rounded-3xl p-12 shadow-xl
          border-2 border-transparent
        "
      >
        <form 
          onSubmit={handleSubmit} 
          className="flex flex-col items-center justify-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Registro nova conta
            </h2>
          </div>
          <div className="w-full space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seunome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10" 
              />
            </div>
                 <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Valide sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10" 
              />
            </div>
          </div>
          
          <Button
            type="submit"
            variant="upload" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Cadastrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;