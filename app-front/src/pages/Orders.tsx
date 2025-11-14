import OrdersPage from "../components/OrdersPage";
import { Helmet } from "react-helmet";

const Orders = () => {
  return (
    <>
      <Helmet>
        <title>CARROPEL - Gerenciar Pedidos</title>
        <meta
          name="description"
          content="Gerencie os pedidos (CRUD) no sistema CARROPEL."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <OrdersPage /> 
        </main>
      </div>
    </>
  );
};

export default Orders;