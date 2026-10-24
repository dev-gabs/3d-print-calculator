import React, { useState } from 'react';
import {
  Calculator,
  Package,
  Disc,
  Sliders,
  CheckCircle2,
  Sun,
  Moon,
  Gauge,
  Download,
  Share,
  X,
} from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export type ActiveTab = 'calculator' | 'products' | 'materials' | 'capacity' | 'settings';

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

export const SIDEBAR_WIDTH_EXPANDED = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 62;

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
  const [hovered, setHovered] = useState(false);
  const { mode: installMode, install } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);
  const canInstall = installMode === 'prompt' || installMode === 'ios';

  const handleInstall = () => {
    if (installMode === 'prompt') {
      install();
    } else if (installMode === 'ios') {
      setShowIosHint(true);
      if (onCloseMobile) onCloseMobile();
    }
  };

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
    {
      id: 'capacity' as ActiveTab,
      label: 'Capacidade',
      icon: Gauge,
      badge: null,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  // On desktop: collapsed by default, expand on hover
  // On mobile: always expanded (drawer mode)
  const isExpanded = hovered || isOpenMobile;

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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 bottom-0 left-0 flex flex-col justify-between z-50 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: isOpenMobile ? SIDEBAR_WIDTH_EXPANDED : (hovered ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED),
          backgroundColor: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms ease-in-out',
          overflow: 'hidden',
        }}
      >
        <div className="flex flex-col overflow-hidden">
          {/* Logo */}
          <div
            className="h-14 px-4 flex items-center gap-2 shrink-0"
            style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
          >
            <button
              onClick={() => handleSelect('calculator')}
              className="flex items-center gap-2.5 text-left focus:outline-none overflow-hidden"
            >
              <svg
                className="w-5 h-5 shrink-0"
                style={{ color: '#818CF8' }}
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
              <span
                className="font-semibold text-[14px] tracking-tight font-sans whitespace-nowrap"
                style={{
                  color: '#F1F5F9',
                  opacity: isExpanded ? 1 : 0,
                  transition: 'opacity 150ms ease',
                }}
              >
                3D Price
              </span>
            </button>

            {isExpanded && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-auto animate-fadeIn"
                style={{
                  color: 'var(--color-sidebar-text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--color-sidebar-border)',
                }}
              >
                v2.4
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={!isExpanded ? item.label : undefined}
                  className={`w-full flex items-center ${
                    !isExpanded ? 'justify-center' : 'justify-between'
                  } px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors text-left cursor-pointer border border-transparent`}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--color-sidebar-active-bg)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--color-sidebar-active-text)'
                      : 'var(--color-sidebar-text)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)';
                      e.currentTarget.style.color = '#E2E8F0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-sidebar-text)';
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: isActive
                          ? '#A5B4FC'
                          : 'var(--color-sidebar-text-muted)',
                      }}
                      strokeWidth={1.8}
                    />
                    {isExpanded && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </div>
                  {isExpanded && item.badge !== null && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(99, 102, 241, 0.25)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: isActive
                          ? '#C7D2FE'
                          : 'var(--color-sidebar-text-muted)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div
              className="my-1.5"
              style={{ borderTop: '1px solid var(--color-sidebar-border)' }}
            />

            {/* Settings */}
            <button
              onClick={() => handleSelect('settings')}
              title={!isExpanded ? 'Configurações' : undefined}
              className={`w-full flex items-center ${
                !isExpanded ? 'justify-center' : ''
              } gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left cursor-pointer border border-transparent`}
              style={{
                backgroundColor:
                  activeTab === 'settings'
                    ? 'var(--color-sidebar-active-bg)'
                    : 'transparent',
                color:
                  activeTab === 'settings'
                    ? 'var(--color-sidebar-active-text)'
                    : 'var(--color-sidebar-text)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'settings') {
                  e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)';
                  e.currentTarget.style.color = '#E2E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'settings') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-sidebar-text)';
                }
              }}
            >
              <Sliders
                className="w-4 h-4 shrink-0"
                style={{
                  color:
                    activeTab === 'settings'
                      ? '#A5B4FC'
                      : 'var(--color-sidebar-text-muted)',
                }}
                strokeWidth={1.8}
              />
              {isExpanded && <span>Configurações</span>}
            </button>

            {/* Divider */}
            <div
              className="my-1.5"
              style={{ borderTop: '1px solid var(--color-sidebar-border)' }}
            />

            {/* Install app (PWA) */}
            {canInstall && (
              <button
                onClick={handleInstall}
                title={!isExpanded ? 'Instalar app' : undefined}
                className={`w-full flex items-center ${
                  !isExpanded ? 'justify-center' : ''
                } gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors text-left border border-transparent cursor-pointer`}
                style={{ color: 'var(--color-sidebar-active-text)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download className="w-4 h-4 shrink-0" style={{ color: '#A5B4FC' }} strokeWidth={1.8} />
                {isExpanded && <span className="whitespace-nowrap">Instalar app</span>}
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              title={!isExpanded ? (theme === 'dark' ? 'Tema claro' : 'Tema escuro') : undefined}
              className={`w-full flex items-center ${
                !isExpanded ? 'justify-center' : ''
              } gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors text-left border border-transparent`}
              style={{ color: 'var(--color-sidebar-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)';
                e.currentTarget.style.color = '#E2E8F0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-sidebar-text-muted)';
              }}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 shrink-0" style={{ color: 'var(--color-sidebar-text-muted)' }} strokeWidth={1.8} />
              ) : (
                <Moon className="w-4 h-4 shrink-0" style={{ color: 'var(--color-sidebar-text-muted)' }} strokeWidth={1.8} />
              )}
              {isExpanded && (
                <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
              )}
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div
          className={`p-3 flex items-center ${
            !isExpanded ? 'justify-center' : 'justify-between'
          } text-[11px]`}
          style={{
            borderTop: '1px solid var(--color-sidebar-border)',
            color: 'var(--color-sidebar-text-muted)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: '#10B981' }}
            />
            {isExpanded && <span>Salvo localmente</span>}
          </div>
          {isExpanded && (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10B981', opacity: 0.7 }} />
          )}
        </div>
      </aside>

      {/* iPhone/iPad: o Safari não tem botão de instalar, só o menu Compartilhar */}
      {showIosHint && (
        <div
          role="dialog"
          aria-label="Como instalar no iPhone"
          className="fixed left-4 right-4 bottom-4 z-[60] mx-auto max-w-sm bg-surface border border-border rounded-xl shadow-xl p-4 text-txt animate-fadeIn"
        >
          <button
            onClick={() => setShowIosHint(false)}
            className="absolute right-3 top-3 text-txt-muted hover:text-txt p-1 rounded-md"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
          <h4 className="text-[14px] font-semibold mb-1.5 pr-6">Instalar a 3D Price</h4>
          <p className="text-[12px] text-txt-muted leading-relaxed">
            No Safari, toque em{' '}
            <Share className="inline w-3.5 h-3.5 -mt-0.5 text-brand" aria-label="Compartilhar" />{' '}
            <strong className="text-txt font-medium">Compartilhar</strong> e depois em{' '}
            <strong className="text-txt font-medium">Adicionar à Tela de Início</strong>.
          </p>
        </div>
      )}
    </>
  );
};
