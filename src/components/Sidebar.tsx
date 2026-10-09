import React from 'react';
import { Calculator, Package, Disc, Sliders, CheckCircle2, Sun, Moon } from 'lucide-react';

export type ActiveTab = 'calculator' | 'products' | 'materials' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  productsCount: number;
  materialsCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  productsCount,
  materialsCount,
  isOpenMobile = false,
  onCloseMobile,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    {
      id: 'calculator' as ActiveTab,
      label: 'Calculadora',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'products' as ActiveTab,
      label: 'Produtos',
      icon: Package,
      badge: productsCount > 0 ? productsCount : null,
    },
    {
      id: 'materials' as ActiveTab,
      label: 'Materiais',
      icon: Disc,
      badge: materialsCount > 0 ? materialsCount : null,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-[220px] bg-surface border-r border-border flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Minimalista */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-border/70">
            <button
              onClick={() => handleSelect('calculator')}
              className="flex items-center gap-2 text-left focus:outline-none"
            >
              {/* 3D Geometric Isometric Glyph */}
              <svg
                className="w-4 h-4 text-brand"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" x2="12" y1="22.08" y2="12" />
              </svg>
              <span className="font-semibold text-[14px] tracking-tight text-txt font-sans">
                3D Price
              </span>
            </button>
            <span className="font-mono text-[10px] text-txt-muted bg-canvas border border-border px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </div>

          {/* Menu Limpo e Direto */}
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-[13px] transition-colors text-left ${
                    isActive
                      ? 'bg-canvas text-txt border border-border/80'
                      : 'text-txt-muted hover:text-txt hover:bg-canvas border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-brand' : 'text-txt-muted'
                      }`}
                      strokeWidth={1.8}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-brand/10 text-brand'
                          : 'bg-border/70 text-txt-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Divisor Sutil */}
            <div className="my-2 border-t border-border" />

            {/* Configurações */}
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
                activeTab === 'settings'
                  ? 'bg-canvas text-txt border border-border/80'
                  : 'text-txt-muted hover:text-txt hover:bg-canvas border border-transparent'
              }`}
            >
              <Sliders
                className={`w-4 h-4 ${
                  activeTab === 'settings' ? 'text-brand' : 'text-txt-muted'
                }`}
                strokeWidth={1.8}
              />
              <span>Configurações</span>
            </button>

            {/* Divisor Sutil */}
            <div className="my-2 border-t border-border" />

            {/* Alternância de tema */}
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left text-txt-muted hover:text-txt hover:bg-canvas border border-transparent"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-txt-muted" strokeWidth={1.8} />
              ) : (
                <Moon className="w-4 h-4 text-txt-muted" strokeWidth={1.8} />
              )}
              <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
            </button>
          </nav>
        </div>

        {/* Rodapé Discreto */}
        <div className="p-4 border-t border-border/70 flex items-center justify-between text-[11px] text-txt-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span>Salvo localmente</span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-brand/70" />
        </div>
      </aside>
    </>
  );
};
