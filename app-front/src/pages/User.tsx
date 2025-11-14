import UsersPage from "../components/UsersPage";
import { Helmet } from "react-helmet";

const Users = () => {
  return (
    <>
      <Helmet>
        <title>CARROPEL - Gerenciar Usuários</title>
        <meta
          name="description"
          content="Gerencie os usuários (CRUD) no sistema CARROPEL."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <UsersPage />
        </main>
      </div>
    </>
  );
};

export default Users;