import { useState, useEffect } from "react";
import { supabase, type Order } from "@/lib/supabase";
import { BellRing, MapPin, Package, CheckCircle, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Busca iniciais pendentes
    const fetchPendingOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data) setOrders(data as Order[]);
    };

    if (isOnline) {
      fetchPendingOrders();

      const channel = supabase
        .channel("public:orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            const newOrder = payload.new as Order;
            if (newOrder.status === "pending") {
              setOrders((prev) => [newOrder, ...prev]);
              playNotificationSound();
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders" },
          (payload) => {
            const updatedOrder = payload.new as Order;
            if (updatedOrder.status !== "pending") {
              setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOnline]);

  const playNotificationSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
    audio.play().catch((e) => console.log("Erro ao tocar áudio", e));
  };

  const acceptOrder = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "accepted" })
      .eq("id", id);
      
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("Corrida aceita!");
    } else {
      alert("Erro ao aceitar corrida (Pode já ter sido pega)");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="font-black text-xl text-white">Painel do Entregador</h1>
          <p className="text-xs text-slate-400">Motoboy em Viçosa</p>
        </div>
        <Button 
          onClick={() => setIsOnline(!isOnline)}
          className={`font-black rounded-full px-6 transition-all ${isOnline ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
        >
          {isOnline ? "FICAR OFFLINE" : "FICAR ONLINE"}
        </Button>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {!isOnline ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-32 opacity-50">
            <BellRing className="w-16 h-16 mb-4 text-slate-600" />
            <p className="text-lg font-bold text-slate-400">Você está offline</p>
            <p className="text-sm text-slate-500 mb-6">Fique online para receber pedidos em tempo real</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center mt-24">
                <div className="w-20 h-20 rounded-full border-4 border-t-green-500 border-slate-700 animate-spin mb-6"></div>
                <p className="font-black text-xl text-slate-300">Aguardando pedidos...</p>
               </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#FFDD00]" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 items-center">
                      <span className="bg-[#FFDD00]/20 text-[#FFDD00] text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">
                        Novo Pedido
                      </span>
                      <span className="text-slate-400 text-xs font-medium">Instantes atrás</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-2xl text-green-400">R$ {order.price?.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Estimado</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 relative">
                     <div className="flex gap-3 items-start">
                        <MapPin className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Retirada</p>
                          <p className="text-sm font-medium text-slate-200">{order.origin}</p>
                        </div>
                     </div>
                     <div className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Entrega</p>
                          <p className="text-sm font-black text-white">{order.destination}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
                      <Package className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] uppercase text-slate-500 font-bold">Volume</p>
                        <p className="text-xs font-black text-slate-200 capitalize">{order.volume_type === 'bau' ? "Baú" : order.volume_type}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
                      {order.payment_method === 'cash' ? <Banknote className="w-5 h-5 text-green-400" /> : <CreditCard className="w-5 h-5 text-blue-400" />}
                      <div>
                        <p className="text-[10px] uppercase text-slate-500 font-bold">Pagamento</p>
                        <p className="text-xs font-black text-slate-200">{order.payment_method === 'cash' ? 'Dinheiro' : order.payment_method === 'pix_stripe' ? 'PIX Rápido' : 'Cartão'}</p>
                      </div>
                    </div>
                  </div>

                  {order.observation && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-6">
                      <p className="text-[10px] uppercase text-orange-400 font-bold mb-1">Atenção / Observação</p>
                      <p className="text-xs text-orange-200 font-medium">{order.observation}</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => acceptOrder(order.id)}
                    className="w-full bg-[#FFDD00] hover:bg-[#ffed4a] text-[#212121] font-black text-lg h-14 rounded-xl shadow-[0_5px_15px_rgba(255,221,0,0.15)]"
                  >
                    ACEITAR CORRIDA
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
