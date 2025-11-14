import { Link, NavLink } from "react-router-dom";
import carropelLogo from "@/assets/carropel-logo.png";
import {
  Users,
  LayoutDashboard,
  ShoppingCart,
  Factory,
  UploadCloud,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; 


const NavItem = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary font-medium" 
        )
      }
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

const Sidebar = () => {
  return (
    <aside className="hidden w-64 min-h-screen flex-col border-r bg-card md:flex">
      
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={carropelLogo} 
            alt="CARROPEL" 
            className="h-8 w-auto" 
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start gap-1 px-4 py-4 text-sm">
          <NavItem to="/users" icon={Users}>
            Gerenciamento Usuário
          </NavItem>
          <NavItem to="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/orders" icon={ShoppingCart}>
            Pedidos (Vendas)
          </NavItem>
          <NavItem to="/prodution" icon={Factory}>
            Ordens de Produção
          </NavItem>
          <NavItem to="/upload" icon={UploadCloud}>
            Upload
          </NavItem>
        </nav>
      </div>

      {/* 3. Rodapé da Sidebar (Logout) */}
      <div className="mt-auto p-4 border-t">
        {/* Este Link deve apontar para sua rota de Logout */}
        <Link to="/login"> 
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;