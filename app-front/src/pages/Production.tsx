import ProductionOrdersPage from "../components/ProductionOrdersPage";
import { Helmet } from "react-helmet";

const Production = () => {
  return (
    <>
      <Helmet>
        <title>CARROPEL - Ordens de Produção</title>
        <meta
          name="description"
          content="Gerencie as Ordens de Produção (OP) no sistema CARROPEL."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <ProductionOrdersPage /> 
        </main>
      </div>
    </>
  );
};

export default Production;