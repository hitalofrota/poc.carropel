import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Armazenar o token JWT
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user || { name: "Usuário", email: email }));
        }
        
        toast.success("Login realizado com sucesso!");
        
        // Redirecionar para dashboard após 1 segundo
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
        
      } else {
        const errorData = await response.json();
        
        // Tratamento de erros específicos
        if (response.status === 401) {
          toast.error("E-mail ou senha incorretos.");
        } else if (response.status === 404) {
          toast.error("Usuário não encontrado.");
        } else if (errorData.detail) {
          // Se a API retornar detalhes do erro
          if (typeof errorData.detail === 'string') {
            toast.error(errorData.detail);
          } else if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ');
            toast.error(errorMessages);
          }
        } else {
          toast.error("Erro ao fazer login. Tente novamente.");
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

          {/* Link para registro */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <a 
                href="/register" 
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
              </a>
            </p>
          </div>
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