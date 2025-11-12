

"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


export default function Home() {

  const router = useRouter();


  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
 
  
  <h1>
    ola seja bem viindo o nosso sistema esta em 
 fase de desemvolvimento entao vamos pra o login 

    </h1> 
 

 <div className="mt-4 text-center">
               <Button
                 variant="link"
                 onClick={() => router.push("/login")}
                 className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
               >
                 Já tem uma conta? Voltar para o Login
               </Button>
             </div>

    </div>
  );
}
