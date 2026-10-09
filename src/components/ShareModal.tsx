import React, { useState } from 'react';
import { X, Copy, Check, Share2, FileText } from 'lucide-react';
import { ProductPricingState, CalculationResult, Material } from '../types/pricing';
import { formatBRL, formatPercent } from '../utils/pricingEngine';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ProductPricingState;
  calculation: CalculationResult;
  materials: Material[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  state,
  calculation,
  materials,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const primaryMat = materials.find((m) => m.id === state.primaryMaterialId);
  const materialName = primaryMat ? primaryMat.name : 'Material Padrão';

  const shareText = `📋 ORÇAMENTO DE IMPRESSÃO 3D
Peça: ${state.name || 'Peça Personalizada'}
Material: ${materialName}
Peso: ${state.weightGrams}g
Tempo estimado de fabricação: ${state.printHours}h ${state.printMinutes}min

💰 Preço Recomendado: ${formatBRL(calculation.recommendedPrice)}
${state.mode === 'advanced' && state.batchUnits > 1 ? `Lote: ${state.batchUnits} unidades\nTotal: ${formatBRL(calculation.totalBatchRevenue)}\n` : ''}
Custo estimado: ${formatBRL(calculation.totalUnitCost)}
Margem planejada: ${formatPercent(calculation.realMarginPct)}

Gerado via 3D Price Studio`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-[#E3E6E2] max-w-lg w-full p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#707570] hover:text-[#171A18] p-1 rounded-md transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#EAF3ED] text-[#2F6B4A] flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#171A18] tracking-tight">
              Compartilhar Orçamento
            </h3>
            <p className="text-[12px] text-[#707570]">
              Copie o resumo formatado para enviar no WhatsApp ou proposta
            </p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="my-4 p-4 rounded-lg bg-[#F6F6F3] border border-[#E3E6E2] font-mono text-[12px] text-[#171A18] whitespace-pre-wrap select-all leading-relaxed max-h-64 overflow-y-auto">
          {shareText}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-md border border-[#E3E6E2] hover:bg-[#F6F6F3] text-[13px] text-[#707570] font-medium transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleCopy}
            className="py-2 px-4 rounded-md bg-[#2F6B4A] hover:bg-[#26573C] text-white font-medium text-[13px] transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copiado com sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar para Área de Transferência</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
