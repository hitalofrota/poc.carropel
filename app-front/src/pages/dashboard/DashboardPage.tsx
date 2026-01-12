import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Factory, 
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- MOCK DA API (Substitua pelos seus Services reais) ---
const mockDashboardService = {
  getStats: async () => ({
    totalSales: 45250.00,
    activeOrders: 12,
    productionActive: 8,
    delayedProductions: 3
  }),
  getSalesChart: async () => [
    { name: 'Sem 1', vendas: 4000 },
    { name: 'Sem 2', vendas: 3000 },
    { name: 'Sem 3', vendas: 9800 },
    { name: 'Sem 4', vendas: 6500 },
  ],
  getProductionStatus: async () => [
    { name: 'Em dia', value: 12, color: '#22c55e' }, // green-500
    { name: 'Atenção', value: 5, color: '#eab308' }, // yellow-500
    { name: 'Atrasado', value: 3, color: '#ef4444' }, // red-500
  ],
  getCriticalOrders: async () => [
    { id: 101, product: 'BAÚ 6,20 x 2,6', client: 'Transp. Silva', deliveryDate: '2023-10-20', status: 'Atrasado' }, // Data passada
    { id: 102, product: 'PAINEL FRONTAL', client: 'Logística Rapida', deliveryDate: '2023-10-25', status: 'Em Produção' },
    { id: 105, product: 'PERFIL COLUNA', client: 'Auto Peças Z', deliveryDate: '2023-10-26', status: 'Pendente' },
  ]
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productionData, setProductionData] = useState<any[]>([]);
  const [criticalOrders, setCriticalOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simula chamadas paralelas à API
      const [statsData, chartData, pieData, listData] = await Promise.all([
        mockDashboardService.getStats(),
        mockDashboardService.getSalesChart(),
        mockDashboardService.getProductionStatus(),
        mockDashboardService.getCriticalOrders()
      ]);

      setStats(statsData);
      setSalesData(chartData);
      setProductionData(pieData);
      setCriticalOrders(listData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Componente auxiliar para os Cards de KPI
  const KpiCard = ({ title, value, icon: Icon, description, trend }: any) => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="content">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-6 w-6 animate-spin" />
          <span>Carregando métricas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral da produção e vendas.</p>
        </div>
      </div>

      {/* Seção 1: KPIs (Indicadores) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Receita Total (Mês)" 
          value={stats?.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={DollarSign}
          description="+20.1% em relação ao mês passado"
        />
        <KpiCard 
          title="Pedidos de Venda" 
          value={stats?.activeOrders}
          icon={ShoppingCart}
          description="Pedidos aguardando processamento"
        />
        <KpiCard 
          title="Em Produção" 
          value={stats?.productionActive}
          icon={Factory}
          description="Ordens de produção ativas"
        />
        <KpiCard 
          title="Produção Atrasada" 
          value={stats?.delayedProductions}
          icon={AlertTriangle}
          description="Requer atenção imediata"
        />
      </div>

      {/* Seção 2: Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gráfico de Vendas (Ocupa 4 colunas) */}
        <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">Vendas Mensais</h3>
            <p className="text-sm text-muted-foreground">Volume de vendas nas últimas 4 semanas</p>
          </div>
          <div className="p-6 pt-0 pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$${value}`} 
                />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="vendas" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Status Produção (Ocupa 3 colunas) */}
        <div className="col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">Status de Produção</h3>
            <p className="text-sm text-muted-foreground">Distribuição das ordens atuais</p>
          </div>
          <div className="p-6 pt-0 flex items-center justify-center">
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
           {/* Legenda simples do gráfico */}
           <div className="flex justify-center gap-4 pb-6 text-sm text-muted-foreground">
              {productionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Seção 3: Tabelas de Ação Rápida */}
      <div className="grid gap-4 md:grid-cols-1">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col space-y-1.5">
                <h3 className="font-semibold leading-none tracking-tight">Ordens Críticas / Recentes</h3>
                <p className="text-sm text-muted-foreground">Acompanhe as datas de entrega mais próximas</p>
            </div>
            <div className="p-6 pt-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Entrega</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {criticalOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {order.product}
                                    </div>
                                </TableCell>
                                <TableCell>{order.client}</TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={order.status === 'Atrasado' ? "destructive" : "secondary"}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;