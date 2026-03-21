import { Route, Switch } from "wouter";
import OrderPage from "./pages/order";

function App() {
  return (
    <Switch>
      <Route path="/" component={OrderPage} />
      <Route path="/sucesso">
        <div className="min-h-screen flex items-center justify-center bg-green-50 text-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h1 className="text-2xl font-black text-green-900 mb-2">Pagamento Confirmado!</h1>
            <p className="text-green-700 font-medium mb-6">Sua solicitação de entrega foi recebida e o Romão já foi avisado.</p>
            <a href="https://wa.me/5531999999999?text=Ol%C3%A1%20Rom%C3%A3o%2C%20acabei%20de%20pagar%20minha%20corrida%20pelo%20site!" className="block w-full bg-[#0B5D3B] text-white font-black py-4 rounded-xl text-lg hover:bg-[#08452b] transition-colors">
              Falar com o Motoboy
            </a>
          </div>
        </div>
      </Route>
      <Route>
        <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">404 - Página não encontrada</div>
      </Route>
    </Switch>
  );
}

export default App;
