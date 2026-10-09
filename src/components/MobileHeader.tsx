import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileHeaderProps {
  activeTab: ActiveTab;
  onOpenMenu: () => void;
  onNewPiece: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onOpenMenu,
  onNewPiece,
}) => {
  const titles: Record<ActiveTab, string> = {
    calculator: 'Calculadora',
    products: 'Peças Salvas',
    materials: 'Materiais',
    settings: 'Configurações',
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3E6E2] px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="p-1.5 -ml-1 text-[#171A18] hover:bg-[#F6F6F3] rounded-md transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-[#171A18]" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-[#171A18] font-sans">
            3D Price
          </span>
          <span className="text-[12px] text-[#707570]">/ {titles[activeTab]}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewPiece}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-[#2F6B4A] bg-[#2F6B4A]/10 hover:bg-[#2F6B4A]/15 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova</span>
        </button>
      </div>
    </header>
  );
};
