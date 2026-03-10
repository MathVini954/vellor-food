import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { AdminSection, FeatureAccess } from "../types/dashboard";

type AdminShellProps = {
  activeSection: AdminSection;
  restaurantName: string;
  userName: string;
  pageTitle: string;
  pageSubtitle: string;
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  featureAccess?: FeatureAccess;
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
  featureAccess,
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
            featureAccess={featureAccess}
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
        title: "Visao central",
        text: "Acompanhe indicadores gerais e abra rapidamente o modulo operacional que precisa da sua atencao.",
      },
      {
        title: "Ritmo do dia",
        text: "O layout deixa metricas, filas e atalhos criticos sempre visiveis.",
      },
    ],
    PedidosOnline: [
      {
        title: "Fila online",
        text: "Aceite, mova e conclua pedidos de delivery e retirada sem misturar com as comandas do salao.",
      },
      {
        title: "Sincronizacao",
        text: "Os pedidos do app publico entram direto aqui e seguem para a operacao em tempo real.",
      },
    ],
    Mesas: [
      {
        title: "Salao presencial",
        text: "Controle ocupacao, comandas abertas, QR fixo e consolidacao de pedidos presenciais por mesa.",
      },
      {
        title: "Comanda viva",
        text: "A mesa continua acumulando novos pedidos ate o fechamento manual no gerencial.",
      },
    ],
    Cardapio: [
      {
        title: "Catalogo vivo",
        text: "Produtos, categorias e personalizacoes ficam organizados para alimentar o mobile sem retrabalho.",
      },
      {
        title: "Publicacao",
        text: "Alteracoes salvas no gerencial passam a refletir o cardapio publico do restaurante.",
      },
    ],
    Ofertas: [
      {
        title: "Campanhas ativas",
        text: "Estruture prato do dia, descontos por categoria e promocoes especificas com vinculo real aos itens.",
      },
      {
        title: "Destaque no mobile",
        text: "As ofertas publicadas aqui abastecem o carrossel promocional do app do cliente.",
      },
    ],
    Clientes: [
      {
        title: "Base unificada",
        text: "Todo cliente que compra pelo mobile entra automaticamente aqui para historico e relacionamento.",
      },
      {
        title: "Identificacao",
        text: "Nome, telefone e localizacao passam a reaproveitar dados ja salvos a cada novo pedido.",
      },
    ],
    Configuracoes: [
      {
        title: "Loja e operacao",
        text: "Centralize identidade, pagamento, bairros atendidos e parametros que regulam o checkout do mobile.",
      },
      {
        title: "Experiencia conectada",
        text: "O que for salvo aqui orienta taxa de entrega, WhatsApp, visual e comportamento do app publico.",
      },
    ],
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Restaurante</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-900">{restaurantName}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Painel central alinhado com o app publico e com os dados reais do restaurante.
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
