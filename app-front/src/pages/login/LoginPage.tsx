import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";

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
            Bem-vindo ao nosso sistema
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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

    if (!formData.email || !formData.password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Armazenar o token JWT
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user || { name: "Usuário", email: formData.email }));
        }
        
        toast.success("Login realizado com sucesso!", {
          description: "Redirecionando para o dashboard...",
          icon: <CheckCircle className="w-4 h-4" />
        });
        
        // Redirecionar para dashboard após 1 segundo
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
        
      } else {
        const errorData = await response.json();
        
        // Tratamento de erros específicos
        if (response.status === 401) {
          toast.error('Credenciais inválidas', {
            description: "E-mail ou senha incorretos.",
            icon: <XCircle className="w-4 h-4" />
          });
        } else if (response.status === 404) {
          toast.error('Usuário não encontrado', {
            description: "Verifique seu e-mail e tente novamente.",
            icon: <XCircle className="w-4 h-4" />
          });
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            toast.error('Erro ao fazer login', {
              description: errorData.detail,
              icon: <XCircle className="w-4 h-4" />
            });
          } else if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ');
            toast.error('Erros de validação', {
              description: errorMessages,
              icon: <XCircle className="w-4 h-4" />
            });
          }
        } else {
          toast.error('Erro ao fazer login', {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-3xl shadow-xl border-2 border-transparent flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Seção da Logo (mantida igual) */}
          <CompanyLogo />
          
          {/* Seção do Formulário (padronizada) */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              
              {/* Header Padronizado */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    Acesse sua conta
                  </h1>
                  <CardDescription className="text-base">
                    Entre com seu e-mail e senha
                  </CardDescription>
                </div>
              </div>

              {/* Form Card Padronizado */}
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Campo Email */}
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seunome@exemplo.com"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          className="h-12 pl-10 text-base"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Campo Senha */}
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Sua senha"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          className="h-12 pl-10 text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Botão de Login */}
                    <LoadingButton 
                      loading={loading}
                      className="w-full h-12 text-base font-semibold mt-6"
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </LoadingButton>

                    {/* Link para registro */}
                    <div className="text-center pt-6 border-t">
                      <p className="text-sm text-muted-foreground">
                        Não tem uma conta?{" "}
                        <Link 
                          to="/register" 
                          className="text-primary hover:underline font-semibold"
                        >
                          Cadastre-se
                        </Link>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;