// app/dashboard/ajuda/page.tsx
"use client";

import { AlertTriangle, ChevronRight, Contact, FileText, Lock, Settings, User, Zap, Mail,  ArrowLeft  } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Removida a linha de importação de 'useState' e a sua declaração abaixo.
// import { useState } from "react";

// Definição dos tópicos (FAQ)
const topics = [
    { 
        icon: Lock, 
        title: "Segurança e Senha", 
        description: "Como redefinir sua senha, critérios de segurança e autenticação de dois fatores.", 
        id: "seguranca" 
    },
    { 
        icon: User, 
        title: "Gestão da Conta", 
        description: "Atualização de e-mail, telefone e informações pessoais no Perfil.", 
        id: "conta" 
    },
    { 
        icon: Settings, 
        title: "Configurações da Aplicação", 
        description: "Alterar tema, notificações e fuso horário.", 
        id: "configuracoes" 
    },
    { 
        icon: FileText, 
        title: "Termos de Uso e Privacidade", 
        description: "Documentação legal e política de proteção de dados.", 
        id: "legal" 
    },
];

export default function HelpPage() {
     const router = useRouter();
    // 🚨 CORREÇÃO: A linha 'const [_, setSearchTerm] = useState("");' foi removida,
    // bem como o import { useState } do 'react', pois não são usados.
    
    return (
        <div className="p-4 md:p-8 space-y-8">


            <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="mb-4 flex items-center gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" /> Voltar
                          </Button>
            


            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Centro de Ajuda e Suporte
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Encontre respostas para as perguntas mais frequentes (FAQ) ou entre em contacto direto com o nosso suporte.
            </p>
            
            <Separator />

            {/* SEÇÃO 1: TÓPICOS DE AJUDA/FAQ */}
            <section className="space-y-4">
                <h3 className="text-2xl font-semibold mb-4">Tópicos Populares</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topics.map(topic => (
                        <Card key={topic.id} className="transition-shadow hover:shadow-lg">
                            <CardHeader className="flex flex-row items-center space-x-4 p-4 pb-0">
                                <topic.icon className="h-6 w-6 text-primary" />
                                <CardTitle className="text-lg">{topic.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <CardDescription className="mb-3">{topic.description}</CardDescription>
                                <Button variant="link" className="p-0 h-auto flex items-center">
                                    Ver mais <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <Separator />
            
            {/* SEÇÃO 2: SUPORTE DIRETO */}
            <section className="space-y-4">
                <h3 className="text-2xl font-semibold mb-4">Suporte Direto e Informações</h3>
                
                <Card className="border-t-4 border-t-red-500 dark:border-t-red-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" /> Reportar um Problema Urgente
                        </CardTitle>
                        <CardDescription>
                            Para falhas críticas, erros de login ou problemas de segurança.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" asChild>
                            <Link href="/support/urgent">
                                <Zap className="h-4 w-4 mr-2" /> Abrir Chamado Urgente
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Contact className="h-5 w-5 text-blue-500" /> Fale Connosco
                        </CardTitle>
                        <CardDescription>
                            Para dúvidas gerais ou pedidos de novas funcionalidades.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">Envie um email para: **suporte@suaempresa.com**</p>
                        <Button variant="outline" asChild>
                            <a href="mailto:suporte@suaempresa.com">
                                <Mail className="h-4 w-4 mr-2" /> Enviar Email
                            </a>
                        </Button>
                    </CardContent>
                </Card>

            </section>
        </div>
    );
}