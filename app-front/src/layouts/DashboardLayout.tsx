import Sidebar from "@/components/Sidebar"; // Ajuste o caminho
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* A Sidebar fica fixa na esquerda */}
      <Sidebar />

      {/* O Conteúdo Principal fica à direita */}
      <main className="flex-1 h-screen overflow-y-auto">
        
        {/* O <Outlet /> é o espaço onde o React Router
          vai renderizar a página da rota atual (Orders, Production, etc.)
        */}
        <Outlet />
        
      </main>
    </div>
  );
};

export default DashboardLayout;