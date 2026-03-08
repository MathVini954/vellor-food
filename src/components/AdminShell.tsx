import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { AdminSection } from "../types/dashboard";

type AdminShellProps = {
  activeSection: AdminSection;
  restaurantName: string;
  userName: string;
  pageTitle: string;
  pageSubtitle: string;
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  children: ReactNode;
  aside?: ReactNode;
  action?: ReactNode;
};

export function AdminShell({
  activeSection,
  restaurantName,
  userName,
  pageTitle,
  pageSubtitle,
  onLogout,
  onNavigate,
  children,
  aside,
  action,
}: AdminShellProps) {
  return (
    <main className="h-screen overflow-hidden bg-[#f4f5f7] p-2 text-slate-900 sm:p-3">
      <div className="grid h-full grid-cols-1 gap-0 overflow-hidden rounded-[28px] border border-slate-300/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)] lg:grid-cols-[248px_minmax(0,1fr)]">
        <div className="h-full overflow-hidden">
          <Sidebar
            activeItem={activeSection}
            restaurantName={restaurantName}
            userName={userName}
            onNavigate={onNavigate}
          />
        </div>

        <div className="min-w-0 overflow-hidden bg-[#fafafb]">
          <Topbar
            restaurantName={restaurantName}
            userName={userName}
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
            onLogout={onLogout}
          />

          <div className="grid h-[calc(100%-88px)] min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 overflow-y-auto border-t border-slate-200 bg-[#fafafb] p-5 lg:border-r lg:p-6">
              {action ? <div className="mb-5 flex justify-end">{action}</div> : null}
              {children}
            </section>
            <aside className="overflow-y-auto border-t border-slate-200 bg-white/80 p-5 lg:block lg:p-6">
              {aside ?? <DefaultAside restaurantName={restaurantName} activeSection={activeSection} />}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function DefaultAside({
  restaurantName,
  activeSection,
}: {
  restaurantName: string;
  activeSection: AdminSection;
}) {
  const sections: Record<AdminSection, { title: string; text: string }[]> = {
    Dashboard: [
      {
        title: "Visão central",
        text: "Acompanhe os indicadores gerais e abra rapidamente o módulo operacional que precisa da sua atenção.",
      },
      {
        title: "Ritmo do dia",
        text: "O layout foi reorganizado para deixar métricas, filas e atalhos críticos sempre visíveis.",
      },
    ],
    Pedidos: [
      {
        title: "Fila operacional",
        text: "Aceite, mova e conclua pedidos sem trocar de contexto. O painel lateral mantém o pedido ativo em foco.",
      },
      {
        title: "Sincronização",
        text: "Os pedidos do mobile entram direto aqui e seguem para a operação em tempo real.",
      },
    ],
    Cardapio: [
      {
        title: "Catálogo vivo",
        text: "Produtos, categorias e personalizações ficam organizados para alimentar o mobile sem retrabalho.",
      },
      {
        title: "Publicação",
        text: "Alterações salvas no gerencial passam a refletir o cardápio público do restaurante.",
      },
    ],
    Ofertas: [
      {
        title: "Campanhas ativas",
        text: "Estruture prato do dia, descontos por categoria e promoções específicas com vínculo real aos itens.",
      },
      {
        title: "Destaque no mobile",
        text: "As ofertas publicadas aqui abastecem o carrossel promocional do app do cliente.",
      },
    ],
    Clientes: [
      {
        title: "Base unificada",
        text: "Todo cliente que compra pelo mobile entra automaticamente aqui para histórico e relacionamento.",
      },
      {
        title: "Identificação",
        text: "Nome, telefone e localização passam a reaproveitar dados já salvos a cada novo pedido.",
      },
    ],
    Configuracoes: [
      {
        title: "Loja e operação",
        text: "Centralize identidade, pagamento, bairros atendidos e parâmetros que regulam o checkout do mobile.",
      },
      {
        title: "Experiência conectada",
        text: "O que for salvo aqui orienta taxa de entrega, WhatsApp, visual e comportamento do app público.",
      },
    ],
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Restaurante</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-900">{restaurantName}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Painel central alinhado com o app público e com os dados reais do restaurante.
        </p>
      </section>

      {sections[activeSection].map((item) => (
        <section
          key={item.title}
          className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
        </section>
      ))}
    </div>
  );
}
