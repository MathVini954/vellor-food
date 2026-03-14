import type { ReactNode } from "react";
import { useAdminLayoutContext } from "./AdminLayoutContext";
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
  const { notifications, unreadSignals, onOpenNotifications } = useAdminLayoutContext();
  const shellAside = aside ?? <DefaultAside restaurantName={restaurantName} activeSection={activeSection} />;

  return (
    <main className="min-h-screen bg-transparent text-[color:var(--text-strong)] lg:h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[282px] lg:overflow-y-auto lg:border-r lg:border-[color:var(--border-soft)] lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,247,250,0.97))] lg:backdrop-blur-xl">
        <Sidebar
          activeItem={activeSection}
          restaurantName={restaurantName}
          userName={userName}
          featureAccess={featureAccess}
          unreadSignals={unreadSignals}
          onNavigate={onNavigate}
        />
      </div>

      <div className="flex min-h-screen min-w-0 flex-col bg-transparent lg:h-screen lg:pl-[282px]">
        <div className="border-b border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-3 backdrop-blur-xl lg:hidden">
          <Sidebar
            activeItem={activeSection}
            restaurantName={restaurantName}
            userName={userName}
            featureAccess={featureAccess}
            unreadSignals={unreadSignals}
            onNavigate={onNavigate}
            mode="mobile"
          />
        </div>

        <Topbar
          restaurantName={restaurantName}
          userName={userName}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          notifications={notifications}
          unreadSignals={unreadSignals}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onOpenNotifications={onOpenNotifications}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 overflow-y-auto px-4 pb-6 pt-5 sm:px-5 lg:px-6 lg:pb-8 lg:pt-6">
            {action ? <div className="mb-5 flex justify-end">{action}</div> : null}
            {children}
          </section>
          <aside className="overflow-y-auto border-t border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(237,241,245,0.96))] px-4 py-5 sm:px-5 xl:border-l xl:border-t-0 xl:px-5 xl:py-6">
            {shellAside}
          </aside>
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
        title: "Leitura executiva",
        text: "A nova home prioriza receita, tendencia semanal e os clientes que mais movimentam o restaurante.",
      },
      {
        title: "Fila visivel",
        text: "Pedidos recentes, alertas e modulos criticos continuam acessiveis sem esconder a operacao.",
      },
    ],
    PedidosOnline: [
      {
        title: "Fluxo online",
        text: "Delivery e retirada seguem separados das mesas para nao misturar filas e tempos de preparo.",
      },
      {
        title: "Historico filtrado",
        text: "Consulte hoje, ultimos 7 dias, ultimos 30 dias ou um periodo customizado.",
      },
    ],
    Mesas: [
      {
        title: "Salao e QR",
        text: "Mesas ativas, link fixo do cardapio digital e comandas abertas ficam no mesmo painel.",
      },
      {
        title: "Operacao presencial",
        text: "Transferencia, mescla e fechamento de comandas permanecem acessiveis na lateral.",
      },
    ],
    Cardapio: [
      {
        title: "Catalogo central",
        text: "Produtos, imagens e personalizacoes ficam organizados em blocos mais limpos e legiveis.",
      },
      {
        title: "Disponibilidade",
        text: "A ativacao e inativacao de itens continua refletindo o cardapio do cliente.",
      },
    ],
    Ofertas: [
      {
        title: "Campanhas",
        text: "Promocoes agora ficam dentro da mesma linguagem visual, com foco em leitura rapida.",
      },
      {
        title: "Conversao",
        text: "As ofertas continuam conectadas ao catalogo e aos destaques do app publico.",
      },
    ],
    Clientes: [
      {
        title: "Relacionamento",
        text: "O painel lateral organiza telefone, endereco e historico sem poluir a tabela principal.",
      },
      {
        title: "Base viva",
        text: "Cada compra no canal digital alimenta a mesma lista usada pelo gerencial.",
      },
    ],
    Configuracoes: [
      {
        title: "Ajustes da loja",
        text: "Identidade, operacao, pagamentos e aparencia seguem centralizados num layout mais leve.",
      },
      {
        title: "Experiencia unificada",
        text: "Tudo o que voce salva aqui continua refletindo a jornada do cliente no app publico.",
      },
    ],
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <p className="section-label">Workspace</p>
        <h3 className="mt-3 text-xl font-semibold text-[color:var(--text-strong)]">{restaurantName}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
          Painel visualmente mais limpo, com foco em leitura rapida e operacao do restaurante.
        </p>
      </section>

      {sections[activeSection].map((item) => (
        <section key={item.title} className="panel p-5">
          <p className="section-label">{item.title}</p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{item.text}</p>
        </section>
      ))}
    </div>
  );
}
