import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        toast.success("Conta criada com sucesso!", {
          description: "Sua conta foi registrada com sucesso.",
          icon: <CheckCircle className="w-4 h-4" />
        });
        
        // Limpar campos após sucesso
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);

      } else {
        const errorData = await response.json();
        if (errorData.detail && typeof errorData.detail === 'string') {
          toast.error('Erro ao criar conta', {
            description: errorData.detail,
            icon: <XCircle className="w-4 h-4" />
          });
        } else if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ');
          toast.error('Erros de validação', {
            description: errorMessages,
            icon: <XCircle className="w-4 h-4" />
          });
        } else {
          toast.error('Erro ao criar conta', {
            description: "Tente novamente.",
            icon: <XCircle className="w-4 h-4" />
          });
        }
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast.error('Erro de conexão', {
        description: "Verifique se o servidor está rodando.",
        icon: <XCircle className="w-4 h-4" />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm"> 
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                Criar Conta
              </CardTitle>
              <CardDescription className="text-base">
                Preencha seus dados
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /> {/* ✅ Aumentado para w-5 h-5 */}
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-10 text-base" // ✅ Aumentado para h-12 e text-base (igual ao Login)
                    required
                  />
                </div>
              </div>

              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium"> {/* ✅ Aumentado para text-sm */}
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /> {/* ✅ Aumentado para w-5 h-5 */}
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-10 text-base" // ✅ Aumentado para h-12 e text-base
                    required
                  />
                </div>
              </div>
              
              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium"> {/* ✅ Aumentado para text-sm */}
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /> {/* ✅ Aumentado para w-5 h-5 */}
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-10 text-base" // ✅ Aumentado para h-12 e text-base
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Campo Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium"> {/* ✅ Aumentado para text-sm */}
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /> {/* ✅ Aumentado para w-5 h-5 */}
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-10 text-base" // ✅ Aumentado para h-12 e text-base
                    required
                  />
                </div>
              </div>

              {/* Botão de Registro */}
              <LoadingButton 
                loading={loading}
                className="w-full h-12 text-base font-semibold mt-4" // ✅ Aumentado para h-12 e text-base (igual ao Login)
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </LoadingButton>

              {/* Link para login */}
              <div className="text-center pt-4"> {/* ✅ Aumentado para pt-4 */}
                <p className="text-sm text-muted-foreground"> {/* ✅ Aumentado para text-sm (igual ao Login) */}
                  Já tem uma conta?{" "}
                  <Link 
                    to="/login" 
                    className="text-primary hover:underline font-semibold"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;