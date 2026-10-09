import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface rounded-xl border border-border max-w-md w-full p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-txt-muted hover:text-txt p-1 rounded-md transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-mono text-[11px] text-txt-muted uppercase tracking-wider font-medium">
            Boas-vindas ao 3D Price
          </span>
        </div>

        <h3 className="text-[19px] font-semibold text-txt tracking-tight mt-1 mb-2">
          Vamos calcular seu primeiro preço?
        </h3>
        <p className="text-[13px] text-txt-muted mb-5 leading-relaxed">
          Sem planilhas complicadas. Em menos de 1 minuto você descobre quanto cobrar para ter lucro real.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border/70">
            <span className="font-mono text-[12px] font-bold text-brand bg-surface border border-border w-5 h-5 rounded flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <h4 className="text-[13px] font-medium text-txt">
                Selecione o filamento
              </h4>
              <p className="text-[12px] text-txt-muted">
                O custo por kg já vem pronto (PLA, PETG, ABS, etc.) ou personalize o seu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border/70">
            <span className="font-mono text-[12px] font-bold text-brand bg-surface border border-border w-5 h-5 rounded flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <h4 className="text-[13px] font-medium text-txt">
                Informe peso e tempo
              </h4>
              <p className="text-[12px] text-txt-muted">
                Valores estimados diretamente no seu fatiador favorito (Cura, Orca, Bambu Studio, Prusa).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border/70">
            <span className="font-mono text-[12px] font-bold text-brand bg-surface border border-border w-5 h-5 rounded flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <h4 className="text-[13px] font-medium text-txt">
                Defina sua margem de lucro
              </h4>
              <p className="text-[12px] text-txt-muted">
                Veja o preço sugerido instantaneamente com taxas de Shopee, Mercado Livre ou venda direta.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-md bg-brand hover:bg-brand-hover text-white font-medium text-[13px] transition-colors flex items-center justify-center gap-2"
        >
          <span>Começar precificação</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
