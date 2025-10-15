"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
// Componentes Shadcn/ui
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Check, X, Trash2, Search, Zap, Phone, Mail, User2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Componentes Card para Mobile
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Framer Motion
import { motion } from "framer-motion";

// 💡 SEUS COMPONENTES CUSTOMIZADOS
import ButtonLoader from "@/components/animacao/buttonLoader";

// Assumindo o tipo User
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    telefone: string | null;
    confirmar: boolean;
    photo?: string;
}

// Animação para a entrada da linha/card (Motion)
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
// Animação para os botões (Motion)
const actionVariants = {
    initial: { scale: 1 },
    tap: { scale: 0.9 },
    hover: { scale: 1.05 },
};

export default function UsuariosPage() {
    const { user: loggedUser, fetchLoggedUser } = useAuth(); 
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // 💡 NOVO ESTADO: Controla o loading em cada botão: {id do usuário, nome da ação}
    const [actionLoading, setActionLoading] = useState<{ id: number; action: 'confirm' | 'toggle' | 'remove' } | null>(null);

    // --- Lógica de Busca (Live Search com Debounce) ---

    // `fetchUsuarios` agora é estável (sem dependências) e recebe o termo de busca por argumento.
    const fetchUsuarios = useCallback(async (currentSearch: string) => {
        try {
            setLoading(true);
            
            const res = await api.get("/admin/usuarios/lista", {
                params: currentSearch ? { search: currentSearch } : undefined,
            });
            
            const data = res.data.usuarios ?? res.data; 
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    }, []); // 💡 VAZIO: A função é estável.

    // `useEffect` gerencia o debounce e dispara a busca na montagem e ao digitar.
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsuarios(search); // Dispara a busca com o valor atual do 'search'
        }, 300); // 300ms de espera

        return () => clearTimeout(timer); // Limpa o timer
    }, [search, fetchUsuarios]); // Depende apenas do input de busca e da função estável.


    // --- Funções de Ação (Com Loader nos Botões) ---

    // Função auxiliar para centralizar a lógica de API, feedback e loading.
    const handleAction = async (action: () => Promise<void>, successMsg: string, errorMsg: string, id: number, actionName: 'confirm' | 'toggle' | 'remove') => {
        try {
            setActionLoading({ id, action: actionName }); // 💡 INÍCIO do loading no botão
            
            await action();
            toast.success(successMsg);
            
        } catch (err) {
            console.error(err);
            toast.error(errorMsg);
        } finally {
            setActionLoading(null); // 💡 FIM do loading no botão
            
            // Atualiza a lista e o usuário logado no final, usando o termo de busca atual.
            await fetchUsuarios(search);
            await fetchLoggedUser(); 
        }
    }

    const confirmarConta = (id: number) => handleAction(
        () => api.patch(`/admin/usuarios/${id}/confirmar`),
        "Conta confirmada com sucesso!",
        "Erro ao confirmar conta.",
        id, 
        "confirm" 
    );

    const toggleConta = (id: number) => handleAction(
        () => api.patch(`/admin/usuarios/${id}/toggle`),
        "Estado da conta atualizado!",
        "Erro ao atualizar conta.",
        id, 
        "toggle" 
    );

    const removerUsuario = (id: number) => handleAction(
        () => api.delete(`/admin/usuarios/${id}`),
        "Usuário removido com sucesso!",
        "Erro ao remover usuário. Verifique o seu Back-end.",
        id, 
        "remove" 
    );

    // --- Renderização ---

    return (
        <div className="p-4 md:p-6 lg:p-8"> 
            <h1 className="text-2xl font-bold mb-6">Gestão de Usuários</h1>

            {/* Input de Busca (Live Search) */}
            <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Pesquisar por nome, email, perfil ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
            </div>

            {loading && (
                 <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-sm text-gray-500">Buscando usuários...</p>
                 </div>
            )}

            {!loading && usuarios.length === 0 && (
                 <p className="text-center py-8 text-gray-500">Nenhum usuário encontrado com os critérios de busca.</p>
            )}

            {/* --- Tabela para Telas Grandes (md: e maiores) --- */}
            <div className="hidden md:block border rounded-lg overflow-x-auto shadow-md">
                <Table className="min-w-full"> 
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="w-[200px]">Email</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead className="text-center">Confirmado</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuarios.map((u) => {
                            const isProcessing = actionLoading?.id === u.id;
                            const isRemoving = isProcessing && actionLoading?.action === 'remove';
                            const isToggling = isProcessing && actionLoading?.action === 'toggle';
                            const isConfirming = isProcessing && actionLoading?.action === 'confirm';

                            return (
                                // 💡 MOTION: Animação de entrada para cada linha
                                <motion.tr 
                                    key={u.id}
                                    variants={itemVariants} 
                                    initial="hidden" 
                                    animate="visible"
                                    transition={{ duration: 0.3 }} 
                                >
                                    <TableCell className="font-medium">{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell><span className="font-semibold">{u.role}</span></TableCell>
                                    <TableCell className="text-center">
                                        {u.confirmar ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-red-600 mx-auto" />}
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-1"> 
                                        {/* 1. Ver Detalhes */}
                                        <motion.span variants={actionVariants} whileTap="tap" whileHover="hover">
                                            <Button variant="outline" size="icon" onClick={() => setSelectedUser(u)} disabled={!!actionLoading}><Eye className="h-4 w-4" /></Button>
                                        </motion.span>
                                        
                                        {/* 2. Confirmar Conta */}
                                        {!u.confirmar && (
                                            <motion.span variants={actionVariants} whileTap="tap" whileHover="hover">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => confirmarConta(u.id)}
                                                    disabled={!!actionLoading}
                                                >
                                                    {isConfirming ? <ButtonLoader /> : <Check className="h-4 w-4 text-green-600" />}
                                                </Button>
                                            </motion.span>
                                        )}

                                        {/* 3. Ativar/Desativar Conta (Toggle) */}
                                        {loggedUser?.role === 'administrador' && loggedUser.id !== u.id && (
                                            <motion.span variants={actionVariants} whileTap="tap" whileHover="hover">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => toggleConta(u.id)} 
                                                    title={u.confirmar ? "Desativar Conta" : "Ativar Conta"}
                                                    disabled={!!actionLoading}
                                                >
                                                    {isToggling ? (
                                                        <ButtonLoader />
                                                    ) : (
                                                        <X className={`h-4 w-4 ${u.confirmar ? 'text-red-600' : 'text-yellow-600'}`} />
                                                    )}
                                                </Button>
                                            </motion.span>
                                        )}

                                        {/* 4. Remover Usuário */}
                                        {loggedUser?.id !== u.id && (
                                            <motion.span variants={actionVariants} whileTap="tap" whileHover="hover">
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    onClick={() => removerUsuario(u.id)}
                                                    disabled={!!actionLoading}
                                                >
                                                    {isRemoving ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </motion.span>
                                        )}
                                    </TableCell>
                                </motion.tr>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* --- Cards para Telas Pequenas (md:hidden) --- */}
            <div className="md:hidden space-y-4">
                {usuarios.map((u) => {
                    const isProcessing = actionLoading?.id === u.id;
                    const isRemoving = isProcessing && actionLoading?.action === 'remove';
                    const isToggling = isProcessing && actionLoading?.action === 'toggle';
                    const isConfirming = isProcessing && actionLoading?.action === 'confirm';

                    return (
                        // 💡 MOTION: Animação de entrada para cada Card
                        <motion.div 
                            key={u.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="shadow-md">
                                <CardHeader className="p-4 flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User2 className="h-5 w-5 text-blue-600" />
                                        {u.name}
                                    </CardTitle>
                                    <div className="text-sm font-semibold flex items-center gap-1">
                                        <Zap className="h-4 w-4" /> {u.role}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 p-4 pt-0">
                                    <div className="flex items-center text-sm">
                                        <Mail className="h-4 w-4 mr-2 text-gray-500" /> {u.email}
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Phone className="h-4 w-4 mr-2 text-gray-500" /> {u.telefone ?? "Não informado"}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                                        <span className={`font-medium ${u.confirmar ? 'text-green-600' : 'text-red-600'}`}>
                                            {u.confirmar ? "Aprovado" : "Pendente"}
                                        </span>
                                        {/* Botões de Ação no Mobile */}
                                        <div className="flex gap-1">
                                            {/* 1. Ver Detalhes */}
                                            <motion.span variants={actionVariants} whileTap="tap">
                                                <Button variant="outline" size="icon" onClick={() => setSelectedUser(u)} disabled={!!actionLoading}><Eye className="h-4 w-4" /></Button>
                                            </motion.span>
                                            
                                            {/* 2. Confirmar Conta */}
                                            {!u.confirmar && (
                                                <motion.span variants={actionVariants} whileTap="tap">
                                                    <Button variant="outline" size="icon" onClick={() => confirmarConta(u.id)} disabled={!!actionLoading}>
                                                        {isConfirming ? <ButtonLoader /> : <Check className="h-4 w-4 text-green-600" />}
                                                    </Button>
                                                </motion.span>
                                            )}

                                            {/* 3. Ativar/Desativar Conta (Toggle) */}
                                            {loggedUser?.role === 'administrador' && loggedUser.id !== u.id && (
                                                <motion.span variants={actionVariants} whileTap="tap">
                                                    <Button variant="outline" size="icon" onClick={() => toggleConta(u.id)} disabled={!!actionLoading}>
                                                        {isToggling ? (
                                                            <ButtonLoader />
                                                        ) : (
                                                            <X className={`h-4 w-4 ${u.confirmar ? 'text-red-600' : 'text-yellow-600'}`} />
                                                        )}
                                                    </Button>
                                                </motion.span>
                                            )}

                                            {/* 4. Remover Usuário */}
                                            {loggedUser?.id !== u.id && (
                                                <motion.span variants={actionVariants} whileTap="tap">
                                                    <Button variant="destructive" size="icon" onClick={() => removerUsuario(u.id)} disabled={!!actionLoading}>
                                                        {isRemoving ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>


            {/* Dialog de Detalhes (Mantido) */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Usuário</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-2">
                            <p><strong>Nome:</strong> {selectedUser.name}</p>
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            <p><strong>Telefone:</strong> {selectedUser.telefone ?? "Não informado"}</p>
                            <p><strong>Perfil:</strong> {selectedUser.role}</p>
                            <p><strong>Confirmado:</strong> {selectedUser.confirmar ? "Sim" : "Não"}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}