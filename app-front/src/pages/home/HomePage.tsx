import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const HomePage = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        <div className="flex-1 flex justify-center lg:justify-end">
            <img 
                src="/src/assets/carropel-image1.png" 
                alt="Logo da Carropel"
                className="border border-gray-300 rounded-md scale-125"
            />
        </div>
        
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Sistema de Gerenciamento
            </h1>
          </div>

          <div className="space-y-1 border-l-2 border-primary/20 lg:pl-6">
            <p className="text-4xl font-medium tracking-tight text-foreground">
              {formatTime(dateTime)}
            </p>
            <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">
              {formatDate(dateTime)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;