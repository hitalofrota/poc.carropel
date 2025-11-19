import LoginPage from "../components/LoginPage"; 
import { Helmet } from "react-helmet";

const Login = () => {
  return (
    <>
      <Helmet>
        <title>CARROPEL - Login</title>
        <meta 
          name="description" 
          content="Acesse sua conta no sistema CARROPEL."
        />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <LoginPage /> 
        </main>
      </div>
    </>
  );
};

export default Login;