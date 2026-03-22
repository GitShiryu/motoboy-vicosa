import { useState, useEffect } from "react";
import { supabase, type Order } from "@/lib/supabase";
import { BellRing, MapPin, Package, CheckCircle, CreditCard, Banknote, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Check for any active order for this driver (using the session/login)
    const fetchActiveOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["accepted", "at_pickup", "in_transit", "at_destination"])
        .single();
      
      if (data) setActiveOrder(data as Order);
    };

    if (isAuthenticated) fetchActiveOrder();
  }, [isAuthenticated]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
      
    if (!error) {
      if (status === "completed") {
        setActiveOrder(null);
        alert("Corrida finalizada com sucesso!");
      } else {
        const { data } = await supabase.from("orders").select("*").eq("id", id).single();
        setActiveOrder(data as Order);
      }
    }
  };

  const acceptOrder = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "accepted" })
      .eq("id", id);
      
    if (!error) {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      setActiveOrder(data as Order);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("Corrida aceita!");
    }
  };

  // ... (login component if not authenticated)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div>
          <h1 className="font-black text-xl text-white tracking-tighter uppercase">Portal Motoboy</h1>
          <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Viçosa • Online</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsOnline(!isOnline)}
            className={`font-black rounded-xl text-xs px-4 h-10 transition-all ${isOnline ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500 hover:bg-green-600 text-white"}`}
          >
            {isOnline ? "OFFLINE" : "GO ONLINE"}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {activeOrder ? (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-slate-900">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-emerald-100 text-emerald-700 font-black text-[10px] px-3 py-1 rounded-full uppercase">Em Andamento</div>
              </div>
              
              <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter">Corrida Atual</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin className="text-blue-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ponto de Retirada</p>
                    <p className="font-bold text-lg leading-tight">{activeOrder.origin}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle className="text-green-500 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Destino Final</p>
                    <p className="font-bold text-lg leading-tight">{activeOrder.destination}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-3xl mb-8">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Pagamento</p>
                  <p className="font-black text-emerald-600">R$ {activeOrder.price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Método</p>
                  <p className="font-black">{activeOrder.payment_method === 'cash' ? 'Dinheiro' : 'Online'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {activeOrder.status === 'accepted' && (
                  <Button 
                    onClick={() => updateStatus(activeOrder.id, 'at_pickup')}
                    className="w-full h-16 bg-[#0B5D3B] hover:bg-[#08452b] text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-900/10"
                  >
                    CHEGUEI NO LOCAL DE RETIRADA
                  </Button>
                )}
                {activeOrder.status === 'at_pickup' && (
                  <Button 
                    onClick={() => updateStatus(activeOrder.id, 'in_transit')}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-900/10"
                  >
                    INICIAR ENTREGA
                  </Button>
                )}
                {activeOrder.status === 'in_transit' && (
                  <Button 
                    onClick={() => updateStatus(activeOrder.id, 'at_destination')}
                    className="w-full h-16 bg-[#FFDD00] hover:bg-[#ffed4a] text-black font-black text-lg rounded-2xl shadow-xl shadow-yellow-900/10"
                  >
                    CHEGUEI NO LOCAL DE ENTREGA
                  </Button>
                )}
                {activeOrder.status === 'at_destination' && (
                  <Button 
                    onClick={() => updateStatus(activeOrder.id, 'completed')}
                    className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-900/20"
                  >
                    FINALIZAR CORRIDA
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ... existing pending orders list ... */
        )}
      </main>
    </div>
  );
}

