import RegisterForm from "@/components/RegisterPage"; 
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Register = () => { 
  return (
    <>
      <Helmet>
        <title>CARROPEL - Registro</title> 
        <meta 
          name="description" 
          content="Acesse sua conta no sistema CARROPEL." 
        />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center py-12">
          <RegisterForm /> 
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Register;