import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/login/LoginPage";

import Register from "./pages/register/RegisterPage";

import HomePage from "./pages/home/HomePage"

import Upload from "./pages/upload/Upload";

import ProductionOrder from "../src/pages/productionOrders/ProductionOrderPage";
import ProductionOrderCreatePage from "./pages/productionOrders/ProductionOrderCreatePage";
import ProductionOrderEditPage from "./pages/productionOrders/ProductionOrderEditPage";

import Orders from "./pages/Orders";

import NotFound from "./pages/not-found/NotFound";

import ProductsPage from "../src/pages/products/ProductsPage";
import ProductCreatePage from '../src/pages/products/ProductCreatePage';
import ProductEditPage from "./pages/products/ProductEditPage";

import SalesOrderCreatePage from "./pages/SalesOrders/SalesOrderCreatePage";
import SalesOrdersPage from "./pages/SalesOrders/SalesOrderPage";
import SalesOrderEditPage from "./pages/SalesOrders/SalesOrderEditPage";

import UsersPage from "./pages/users/UsersPage";
import UserCreatePage from "./pages/users/UserCreatePage";
import UserEditPage from "./pages/users/UserEditPage";

import ResultPage from "./pages/results/Result";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<DashboardLayout />}>
            <Route 
              path="/" 
              element={<Navigate to="/home" replace />} 
            />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/create" element={<UserCreatePage />} />
            <Route path="/users/edit/:id" element={<UserEditPage />} />

            <Route path="/home" element={<HomePage />} />

            <Route path="/orders" element={<Orders />} />
            
            <Route path="/production-order" element={<ProductionOrder />} />
            <Route path="/production-order/create" element={<ProductionOrderCreatePage />} />
            <Route path="/production-order/edit/:id" element={<ProductionOrderEditPage />} />

            <Route path="/upload" element={<Upload />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/create" element={<ProductCreatePage />} />
            <Route path="/products/edit/:id" element={<ProductEditPage />} />

            <Route path="/upload/result" element={<ResultPage />} />

            <Route path="/sales-order/create" element={<SalesOrderCreatePage />} />
            <Route path="/sales-order" element={<SalesOrdersPage />} />
            <Route path="/sales-order/edit/:id" element={<SalesOrderEditPage />} />

          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;