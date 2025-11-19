import { useState } from "react";
import { Mail, Lock, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Conta criada com sucesso!");
        
        // Limpar campos após sucesso
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        
        // Redirecionar ou fazer login automático se necessário
        // window.location.href = "/login";
      } else {
        const errorData = await response.json();
        if (errorData.detail && typeof errorData.detail === 'string') {
          toast.error(errorData.detail);
        } else if (errorData.detail && Array.isArray(errorData.detail)) {
          // Tratar erros de validação do FastAPI
          const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ');
          toast.error(errorMessages);
        } else {
          toast.error("Erro ao criar conta. Tente novamente.");
        }
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error("Erro de conexão. Verifique se o servidor está rodando.");
    } finally {
      setIsLoading(false);
    }
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
              Registrar nova conta
            </h2>
          </div>

          <div className="w-full space-y-4">
            {/* Campo Nome */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>

            {/* Campo Email */}
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
            
            {/* Campo Senha */}
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

            {/* Campo Confirmar Senha */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;