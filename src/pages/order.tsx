import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Archive, 
  Wallet, 
  CreditCard, 
  QrCode, 
  ChevronRight,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const orderSchema = z.object({
  originAddress: z.string().min(1, "Origem obrigatória"),
  destinationAddress: z.string().min(1, "Destino obrigatório"),
  volumeType: z.enum(["sacola", "mochila", "bau"]),
  observation: z.string().optional(),
  paymentMethod: z.enum(["cash", "pix_stripe", "card_stripe"]),
  changeFor: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrderPage() {
  const [step, setStep] = useState<"address" | "volume" | "confirm">("address");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      originAddress: "",
      destinationAddress: "",
      volumeType: "sacola",
      paymentMethod: "cash",
      observation: "",
      changeFor: "",
    },
  });

  const origin = form.watch("originAddress");
  const destination = form.watch("destinationAddress");
  const volumeType = form.watch("volumeType");
  const paymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    if (origin.length > 3 && destination.length > 3) {
      // Fake calculation: For Viçosa, usually short distances. Base 6BRL + random distance rate
      const distance = Math.random() * 5 + 1; // 1 to 6km
      let price = 6.00 + (distance * 1.5);
      
      if (volumeType === "mochila") price *= 1.2;
      if (volumeType === "bau") price *= 1.5;

      setEstimatedPrice(Math.max(6, Math.floor(price * 10) / 10)); // round to 1 decimal
    } else {
      setEstimatedPrice(null);
    }
  }, [origin, destination, volumeType]);

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Salvar no Supabase para tocar no painel Uber-like do Romão
      const { error } = await supabase.from('orders').insert([{
        origin: data.originAddress,
        destination: data.destinationAddress,
        volume_type: data.volumeType,
        payment_method: data.paymentMethod,
        price: estimatedPrice,
        status: 'pending',
        observation: data.observation,
        change_for: data.changeFor
      }]).select().single();

      if (error) {
        console.error("Erro Supabase:", error);
        // Mesmo com erro de DB, vamos prosseguir para não travar o cliente
      }
      if (data.paymentMethod === "cash") {
        // Redireciona para o WhatsApp confirmando o pedido com pagamento em dinheiro
        const motoboyPhone = "5531983517700"; // Substituir pelo número
        let message = `Olá! Preciso de uma entrega.\n\n`;
        message += `📍 *Retirada:* ${data.originAddress}\n`;
        message += `🏁 *Entrega:* ${data.destinationAddress}\n`;
        message += `📦 *Volume:* ${data.volumeType === "bau" ? "Baú" : data.volumeType === "mochila" ? "Mochila" : "Sacola/Mãos"}\n`;
        message += `💵 *Pagamento:* Na Entrega (Dinheiro - S/ Cartão)\n`;
        message += `💰 *Valor Estimado:* R$ ${estimatedPrice?.toFixed(2)}\n`;
        if (data.changeFor) message += `Troco para: R$ ${data.changeFor}\n`;
        if (data.observation) message += `📝 *Obs:* ${data.observation}\n`;

        window.location.href = `https://wa.me/${motoboyPhone}?text=${encodeURIComponent(message)}`;
      } else {
        // Pagamento via Stripe (PIX ou Cartão)
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: data.originAddress,
            destination: data.destinationAddress,
            volume: data.volumeType,
            price: estimatedPrice,
            method: data.paymentMethod
          })
        });
        const session = await res.json();
        if (session.url) {
          window.location.href = session.url;
        } else {
          alert("Erro ao iniciar pagamento");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao processar seu pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center">
  const { user, isAdmin } = useAuth();
  
  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-[#0B5D3B] text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFDD00] rounded-full flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-[#212121]" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-none uppercase tracking-tighter">Motoboy em Viçosa</h1>
              <p className="text-[10px] text-[#FFDD00] font-bold uppercase tracking-widest">
                {isAdmin ? "Portal Administrativo" : "Portal do Cliente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 w-10 h-10"
                onClick={() => window.location.href = isAdmin ? '/admin' : '/painel'}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-black">
                  {user.email?.[0].toUpperCase()}
                </div>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 w-10 h-10"
                onClick={() => window.location.href = '/login'}
              >
                <Package className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </div>
      </header>



      {/* Main Content */}
      <main className="w-full max-w-md flex-1 p-4 flex flex-col gap-4 relative">
        <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 flex-1">
          {step === "address" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#212121] uppercase tracking-tighter">Onde Busco?</h2>
                <p className="text-slate-500 font-medium text-sm">Preencha os dados da corrida</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <div className="absolute left-3 top-9 w-3 h-3 bg-blue-500 rounded-full z-10" />
                  <div className="absolute left-4 top-12 bottom-[-10px] w-[2px] bg-slate-200 z-0" />
                  <Label className="font-bold text-[#212121]">Endereço de Retirada</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Rua, número, bairro..." 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 font-medium rounded-xl flex-1"
                      {...form.register("originAddress")}
                    />
                    <Button variant="ghost" className="h-12 w-12 bg-slate-100 rounded-xl" type="button">
                      <Search className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>

                </div>

                <div className="space-y-2 relative">
                  <div className="absolute left-3 top-9 w-3 h-3 bg-[#FFDD00] rounded-full z-10" />
                  <Label className="font-bold text-[#212121]">Endereço de Entrega</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Para onde vou levar?" 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 font-black rounded-xl flex-1"
                      {...form.register("destinationAddress")}
                    />
                    <Button variant="ghost" className="h-12 w-12 bg-slate-100 rounded-xl" type="button">
                      <Search className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>

                </div>
              </div>

              <Button 
                onClick={() => {
                  if (origin.length > 3 && destination.length > 3) setStep("volume");
                  else alert("Preencha os endereços corretamente!");
                }}
                className="w-full h-14 bg-[#212121] text-white hover:bg-black font-black text-lg rounded-2xl"
              >
                AVANÇAR
              </Button>
            </div>
          )}

          {step === "volume" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setStep("address")} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                  ← Voltar
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#212121] uppercase tracking-tighter">Qual o volume?</h2>
                <p className="text-slate-500 font-medium text-sm">Isso ajuda a calcular o valor correto</p>
              </div>

              <div className="grid gap-3">
                {[
                  { id: "sacola", name: "Sacola ou Documento", icon: Package, desc: "Pequeno porte" },
                  { id: "mochila", name: "Mochila de Entrega", icon: Archive, desc: "Médio porte (Lanches, Roupas)" },
                  { id: "bau", name: "Baú Grande", icon: Archive, desc: "Grande porte ou Frágeis" }
                ].map(opt => (
                  <Card 
                    key={opt.id} 
                    className={`cursor-pointer transition-all border-2 rounded-2xl ${volumeType === opt.id ? "border-[#0B5D3B] bg-[#0B5D3B]/5" : "border-slate-100 hover:border-slate-300"}`}
                    onClick={() => form.setValue("volumeType", opt.id as any)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${volumeType === opt.id ? "bg-[#0B5D3B] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-black ${volumeType === opt.id ? "text-[#0B5D3B]" : "text-[#212121]"}`}>{opt.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{opt.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={() => setStep("confirm")}
                className="w-full h-14 bg-[#212121] text-white hover:bg-black font-black text-lg rounded-2xl"
              >
                IR PARA O PAGAMENTO
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6 animate-in slide-in-from-right pb-24">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setStep("volume")} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                  ← Voltar
                </button>
              </div>
              
              <div className="bg-[#FFDD00]/20 border-2 border-[#FFDD00] rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#212121] uppercase">Valor da Entrega</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0B5D3B]" />
                    <span className="text-[10px] font-bold text-[#0B5D3B]">Viçosa, MG</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#212121]">
                  R$ {estimatedPrice?.toFixed(2) || "..."}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-black text-[#212121] text-lg">Como você quer pagar?</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("paymentMethod", "pix_stripe")}
                    className={`h-14 justify-start gap-3 border-2 rounded-xl transition-all ${paymentMethod === "pix_stripe" ? "border-[#0B5D3B] bg-[#0B5D3B]/5 ring-1 ring-[#0B5D3B]" : "border-slate-200"}`}
                  >
                    <QrCode className={`w-5 h-5 ${paymentMethod === "pix_stripe" ? "text-[#0B5D3B]" : "text-slate-500"}`} />
                    <span className={`font-black ${paymentMethod === "pix_stripe" ? "text-[#0B5D3B]" : "text-[#212121]"}`}>PIX (Pagar Online)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("paymentMethod", "card_stripe")}
                    className={`h-14 justify-start gap-3 border-2 rounded-xl transition-all ${paymentMethod === "card_stripe" ? "border-[#0B5D3B] bg-[#0B5D3B]/5 ring-1 ring-[#0B5D3B]" : "border-slate-200"}`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === "card_stripe" ? "text-[#0B5D3B]" : "text-slate-500"}`} />
                    <span className={`font-black ${paymentMethod === "card_stripe" ? "text-[#0B5D3B]" : "text-[#212121]"}`}>Cartão Crédito/Débito (Online)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("paymentMethod", "cash")}
                    className={`h-14 justify-start gap-3 border-2 rounded-xl transition-all ${paymentMethod === "cash" ? "border-[#0B5D3B] bg-[#0B5D3B]/5 ring-1 ring-[#0B5D3B]" : "border-slate-200"}`}
                  >
                    <Wallet className={`w-5 h-5 ${paymentMethod === "cash" ? "text-[#0B5D3B]" : "text-slate-500"}`} />
                    <span className={`font-black ${paymentMethod === "cash" ? "text-[#0B5D3B]" : "text-[#212121]"}`}>Na Entrega (Dinheiro - S/ Cartão)</span>
                  </Button>
                </div>

                {paymentMethod === "cash" && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                    <Label className="text-xs font-bold text-slate-500">Troco para quanto? (Opcional)</Label>
                    <Input 
                      placeholder="Ex: 50,00"
                      className="mt-1 h-12 bg-slate-50 border-slate-200"
                      {...form.register("changeFor")}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Observações para o motoboy</Label>
                <Input 
                  placeholder="Ex: Ao lado da padaria, campainha estragada..."
                  className="h-12 bg-slate-50 border-slate-200"
                  {...form.register("observation")}
                />
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Floating CTA */}
      {step === "confirm" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20">
          <div className="max-w-md mx-auto">
            <Button 
              disabled={isSubmitting || !estimatedPrice}
              onClick={form.handleSubmit(onSubmit)}
              className="w-full h-16 bg-[#0B5D3B] hover:bg-[#07462c] text-white font-black text-xl rounded-full shadow-[0_10px_20px_rgba(11,93,59,0.3)] flex items-center justify-between px-8"
            >
              <span>{isSubmitting ? "Processando..." : (paymentMethod === "cash" ? "PEDIR VIA WHATSAPP" : "IR PARA PAGAMENTO")}</span>
              <ChevronRight className="w-6 h-6" />
            </Button>
            {paymentMethod !== "cash" && (
              <p className="text-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center justify-center gap-1">
                Pagamento Seguro <span className="text-[#635BFF] font-black">Stripe</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
