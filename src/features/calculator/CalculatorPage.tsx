import React, { useState } from 'react';
import {
  RotateCcw,
  Check,
  Plus,
  Share2,
  Trash2,
  ChevronRight,
  Info,
  Clock,
  Layers,
  Wrench,
  PackagePlus,
  AlertTriangle,
} from 'lucide-react';
import {
  CalculationResult,
  ChannelId,
  ExtraCostItem,
  GlobalSettings,
  Material,
  MultiMaterialEntry,
  ProductPricingState,
} from '../../types/pricing';
import { formatBRL, formatPercent } from '../../utils/pricingEngine';

interface CalculatorPageProps {
  state: ProductPricingState;
  calculation: CalculationResult;
  materials: Material[];
  settings: GlobalSettings;
  onChange: (updater: (prev: ProductPricingState) => ProductPricingState) => void;
  onReset: () => void;
  onSave: () => void;
  onNewPiece: () => void;
  onOpenShare: () => void;
  onNavigateToMaterials: () => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  state,
  calculation,
  materials,
  settings,
  onChange,
  onReset,
  onSave,
  onNewPiece,
  onOpenShare,
  onNavigateToMaterials,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const channels: Array<{ id: ChannelId; label: string; defaultFee: number }> = [
    { id: 'shopee', label: 'Shopee', defaultFee: settings.channelFees.shopee ?? 20 },
    {
      id: 'mercadolivre',
      label: 'Mercado Livre',
      defaultFee: settings.channelFees.mercadolivre ?? 19,
    },
    { id: 'direta', label: 'Venda direta', defaultFee: settings.channelFees.direta ?? 0 },
    { id: 'outro', label: 'Outro', defaultFee: settings.channelFees.outro ?? 16 },
  ];

  const handleModeChange = (mode: 'basic' | 'advanced') => {
    onChange((prev) => ({ ...prev, mode }));
  };

  const handleChannelSelect = (channel: ChannelId, defaultPct: number) => {
    onChange((prev) => ({
      ...prev,
      channel,
      channelFeePct: defaultPct,
    }));
  };

  const handleSaveClick = () => {
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Advanced: Multi-material management
  const handleAddExtraMaterial = () => {
    const remainingMat = materials.find((m) => m.id !== state.primaryMaterialId) || materials[0];
    const newEntry: MultiMaterialEntry = {
      id: 'extra-mat-' + Date.now(),
      materialId: remainingMat?.id || 'mat-pla',
      weightGrams: 20,
    };
    onChange((prev) => ({
      ...prev,
      additionalMaterials: [...prev.additionalMaterials, newEntry],
    }));
  };

  const handleUpdateExtraMaterial = (id: string, updates: Partial<MultiMaterialEntry>) => {
    onChange((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleRemoveExtraMaterial = (id: string) => {
    onChange((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.filter((item) => item.id !== id),
    }));
  };

  // Advanced: Extra costs management
  const handleAddExtraCost = () => {
    const newItem: ExtraCostItem = {
      id: 'extra-' + Date.now(),
      name: 'Novo insumo',
      costPerUnit: 1.0,
    };
    onChange((prev) => ({
      ...prev,
      extraCosts: [...prev.extraCosts, newItem],
    }));
  };

  const handleUpdateExtraCost = (id: string, updates: Partial<ExtraCostItem>) => {
    onChange((prev) => ({
      ...prev,
      extraCosts: prev.extraCosts.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleRemoveExtraCost = (id: string) => {
    onChange((prev) => ({
      ...prev,
      extraCosts: prev.extraCosts.filter((item) => item.id !== id),
    }));
  };

  // Composition breakdown percentages for Mode Avançado visual bar
  const price = calculation.recommendedPrice || 1;
  const matBarPct = Math.min(100, (calculation.materialCost / price) * 100);
  const operBarPct = Math.min(100, (calculation.operationalCost / price) * 100);
  const laborBarPct = Math.min(100, (calculation.laborCost / price) * 100);
  const extrasBarPct = Math.min(100, (calculation.extrasCost / price) * 100);
  const taxesBarPct = Math.min(
    100,
    ((calculation.channelFeeAmount + calculation.taxAmount) / price) * 100
  );
  const profitBarPct = Math.max(0, 100 - matBarPct - operBarPct - laborBarPct - extrasBarPct - taxesBarPct);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header Geral */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-tight text-txt">
              Quanto essa peça realmente custa?
            </h1>
            {/* Pill Segmentada Sutil de Modo */}
            <div className="inline-flex items-center p-0.5 rounded-full bg-surface border border-border text-[12px] shadow-2xs">
              <button
                type="button"
                onClick={() => handleModeChange('basic')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] transition-colors ${
                  state.mode === 'basic'
                    ? 'font-medium text-txt bg-canvas shadow-xs'
                    : 'font-normal text-txt-muted hover:text-txt'
                }`}
              >
                {state.mode === 'basic' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                )}
                Básico
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('advanced')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] transition-colors ${
                  state.mode === 'advanced'
                    ? 'font-medium text-txt bg-canvas shadow-xs'
                    : 'font-normal text-txt-muted hover:text-txt'
                }`}
              >
                {state.mode === 'advanced' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                )}
                Avançado
              </button>
            </div>
          </div>
          <p className="text-[13px] sm:text-[14px] text-txt-muted mt-1">
            Precifique sua peça em poucos passos.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-[12px] text-txt-muted hover:text-txt hover:border-border-subtle transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Redefinir</span>
        </button>
      </header>

      {/* Banner de Modo Avançado */}
      {state.mode === 'advanced' && (
        <div className="mb-6 p-3.5 rounded-lg bg-brand-light/60 border border-brand/25 flex items-start gap-2.5 text-[12px] text-txt">
          <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand">Modo Avançado ativado: </span>
            <span>
              Agora você pode considerar custos que normalmente ficam escondidos (mão de obra, insumos extras, perdas de suporte e depreciação da máquina).
            </span>
          </div>
        </div>
      )}

      {/* Validação de Margem / Denominador */}
      {!calculation.isValid && calculation.validationMessage && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3 text-[13px] text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-950">Atenção na configuração de margem</h4>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              {calculation.validationMessage}
            </p>
          </div>
        </div>
      )}

      {/* Grid Principal: Formulário à Esquerda, Resultado à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* COLUNA ESQUERDA — Fluxo Contínuo de Perguntas */}
        <main className="lg:col-span-7 flex flex-col divide-y divide-border">
          {/* 01 — O que você vai vender? */}
          <section className="pb-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] font-semibold text-txt-muted tracking-wider">
                01
              </span>
              <h2 className="text-[15px] font-semibold text-txt tracking-tight">
                O que você vai vender?
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Nome da peça */}
              <div>
                <label
                  htmlFor="input-prod-name"
                  className="block text-[12px] text-txt-muted mb-1 font-medium"
                >
                  Nome da peça
                </label>
                <input
                  id="input-prod-name"
                  type="text"
                  value={state.name}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex.: Suporte de Mesa para Headset"
                  className="w-full bg-surface text-txt px-3.5 py-2 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] outline-none transition-colors"
                />
              </div>

              {/* Material Principal, Peso e Quantidade */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="select-material"
                      className="block text-[12px] text-txt-muted font-medium"
                    >
                      Material principal
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToMaterials}
                      className="text-[11px] text-brand hover:underline"
                    >
                      Gerenciar
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      id="select-material"
                      value={state.primaryMaterialId}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          primaryMaterialId: e.target.value,
                        }))
                      }
                      className="w-full bg-surface text-txt px-3.5 py-2 pr-8 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] outline-none cursor-pointer appearance-none"
                    >
                      {materials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name} ({formatBRL(mat.pricePerKg)}/kg)
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-4 h-4 text-txt-muted absolute right-2.5 top-2.5 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="input-weight"
                    className="block text-[12px] text-txt-muted mb-1 font-medium"
                  >
                    Peso da peça
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="input-weight"
                      type="number"
                      min="0"
                      step="1"
                      value={state.weightGrams === 0 ? '' : state.weightGrams}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          weightGrams: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="146"
                      className="w-full bg-surface text-txt px-3.5 py-2 pr-8 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none transition-colors"
                    />
                    <span className="absolute right-3 text-[12px] text-txt-muted font-mono pointer-events-none">
                      g
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="input-quantity"
                    className="block text-[12px] text-txt-muted mb-1 font-medium"
                  >
                    Quantidade
                  </label>
                  <input
                    id="input-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={state.batchUnits || 1}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        batchUnits: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    placeholder="1"
                    className="w-full bg-surface text-txt px-3.5 py-2 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Modo Avançado: Perda de Material e Multi-material */}
              {state.mode === 'advanced' && (
                <div className="mt-2 pt-3 border-t border-border/70 space-y-3">
                  {/* Perda / Desperdício */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-canvas border border-border">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="chk-waste"
                        checked={state.enableWaste}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            enableWaste: e.target.checked,
                          }))
                        }
                        className="rounded text-brand focus:ring-brand"
                      />
                      <label htmlFor="chk-waste" className="text-[12px] text-txt font-medium cursor-pointer">
                        Considerar perda de material (suportes, purgas e brim)
                      </label>
                    </div>
                    {state.enableWaste && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={state.wastePct}
                          onChange={(e) =>
                            onChange((prev) => ({
                              ...prev,
                              wastePct: parseFloat(e.target.value) || 5,
                            }))
                          }
                          className="w-16 bg-surface text-txt px-2 py-1 rounded border border-border text-right font-mono text-[12px] outline-none"
                        />
                        <span className="text-[12px] text-txt-muted font-mono">%</span>
                      </div>
                    )}
                  </div>

                  {/* Multi-material entries */}
                  {state.additionalMaterials.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-txt-muted">
                        Materiais Adicionais (Bicolor / Suporte PVA)
                      </span>
                      {state.additionalMaterials.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border"
                        >
                          <select
                            value={entry.materialId}
                            onChange={(e) =>
                              handleUpdateExtraMaterial(entry.id, {
                                materialId: e.target.value,
                              })
                            }
                            className="flex-1 bg-transparent text-[12px] text-txt outline-none"
                          >
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({formatBRL(m.pricePerKg)}/kg)
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={entry.weightGrams || ''}
                              onChange={(e) =>
                                handleUpdateExtraMaterial(entry.id, {
                                  weightGrams: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="20"
                              className="w-16 px-2 py-1 border border-border rounded text-right font-mono text-[12px] outline-none"
                            />
                            <span className="text-[11px] font-mono text-txt-muted">g</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraMaterial(entry.id)}
                            className="p-1 text-txt-muted hover:text-red-600 transition-colors"
                            aria-label="Remover material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddExtraMaterial}
                    className="inline-flex items-center gap-1.5 text-[12px] text-brand hover:text-brand-hover font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar outro filamento na peça</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 02 — Quanto tempo leva? */}
          <section className="py-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] font-semibold text-txt-muted tracking-wider">
                02
              </span>
              <h2 className="text-[15px] font-semibold text-txt tracking-tight">
                Quanto tempo leva?
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center w-28">
                  <input
                    id="input-print-hours"
                    type="number"
                    min="0"
                    value={state.printHours === 0 ? '' : state.printHours}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        printHours: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="4"
                    className="w-full bg-surface text-txt px-3.5 py-2 pr-7 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none text-right transition-colors"
                  />
                  <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono pointer-events-none">
                    h
                  </span>
                </div>
                <span className="text-txt-muted text-[13px]">e</span>
                <div className="relative flex items-center w-28">
                  <input
                    id="input-print-mins"
                    type="number"
                    min="0"
                    max="59"
                    value={state.printMinutes === 0 ? '' : state.printMinutes}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        printMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="18"
                    className="w-full bg-surface text-txt px-3.5 py-2 pr-10 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none text-right transition-colors"
                  />
                  <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono pointer-events-none">
                    min
                  </span>
                </div>
              </div>
              <span className="text-[12px] text-txt-muted sm:ml-2">
                Informado no seu fatiador.
              </span>
            </div>

            {/* Modo Avançado: Parâmetros de Máquina */}
            {state.mode === 'advanced' && (
              <div className="mt-4 pt-3 border-t border-border/70 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-md">
                    <span className="text-txt-muted">Potência média:</span>
                    <span className="font-mono text-txt font-medium">
                      {settings.printerPowerWatts} W
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-md">
                    <span className="text-txt-muted">Custo de energia:</span>
                    <span className="font-mono text-txt font-medium">
                      {formatBRL(settings.energyCostKwh)} / kWh
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 p-2.5 bg-canvas border border-border rounded-md text-[12px] text-txt cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={state.includeMaintenance}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          includeMaintenance: e.target.checked,
                        }))
                      }
                      className="rounded text-brand focus:ring-brand"
                    />
                    <span>Manutenção ({formatBRL(settings.wearCostPerHour)}/h)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-canvas border border-border rounded-md text-[12px] text-txt cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={state.includeDepreciation}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          includeDepreciation: e.target.checked,
                        }))
                      }
                      className="rounded text-brand focus:ring-brand"
                    />
                    <span>Depreciação ({formatBRL(settings.depreciationPerHour)}/h)</span>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* 03 — Onde você vai vender? */}
          <section className="py-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] font-semibold text-txt-muted tracking-wider">
                03
              </span>
              <h2 className="text-[15px] font-semibold text-txt tracking-tight">
                Onde você vai vender?
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Segmented buttons limpos para os canais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {channels.map((chan) => {
                  const isSelected = state.channel === chan.id;
                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => handleChannelSelect(chan.id, chan.defaultFee)}
                      className={`py-2 px-3 rounded-md text-[13px] font-medium transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface text-txt border-border hover:border-border-subtle'
                      }`}
                    >
                      {chan.label}
                    </button>
                  );
                })}
              </div>

              {/* Taxa estimada integrada e discreta */}
              <div className="flex items-center gap-3 text-[13px] text-txt-muted">
                <span>Taxa do canal:</span>
                <div className="relative flex items-center w-24">
                  <input
                    id="input-channel-tax"
                    type="number"
                    min="0"
                    max="90"
                    step="0.5"
                    value={state.channelFeePct === 0 ? '' : state.channelFeePct}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        channelFeePct: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="20"
                    className="w-full bg-surface text-txt px-3 py-1.5 pr-6 rounded-md border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none text-right transition-colors"
                  />
                  <span className="absolute right-2 text-[12px] text-txt-muted font-mono pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* Modo Avançado: Taxa Fixa e Impostos */}
              {state.mode === 'advanced' && (
                <div className="mt-2 pt-3 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                      Tarifa fixa por venda (ex: R$ 4,00 marketplace)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[12px] text-txt-muted font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={state.fixedChannelFee || ''}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            fixedChannelFee: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0,00"
                        className="w-full bg-surface text-txt pl-9 pr-3 py-1.5 rounded-md border border-border text-[13px] font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                      Imposto sobre NF-e (ex: Simples Nacional)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={state.taxRatePct || ''}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            taxRatePct: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        className="w-full bg-surface text-txt px-3 py-1.5 pr-6 rounded-md border border-border text-[13px] font-mono outline-none text-right"
                      />
                      <span className="absolute right-2 text-[12px] text-txt-muted font-mono">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 04 — Quanto você quer ganhar? */}
          <section className="pt-7 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-txt-muted tracking-wider">
                  04
                </span>
                <h2 className="text-[15px] font-semibold text-txt tracking-tight">
                  Quanto você quer ganhar?
                </h2>
              </div>
              {/* Margem desejada com número bem visível e elegante */}
              <span className="font-mono text-[16px] font-semibold text-txt">
                {state.desiredMarginPct}%
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                id="range-margin"
                type="range"
                min="10"
                max="80"
                step="1"
                value={state.desiredMarginPct}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    desiredMarginPct: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-txt-muted">
                <span>Menor margem (10%)</span>
                <span>Maior margem (80%)</span>
              </div>
              <p className="text-[12px] text-txt-muted mt-1">
                Margem calculada sobre o preço de venda. É a porcentagem que sobra líquida para você.
              </p>
            </div>

            {/* Modo Avançado: Mão de Obra, Insumos Extras e Lote */}
            {state.mode === 'advanced' && (
              <div className="mt-6 pt-5 border-t border-border space-y-6">
                {/* Mão de Obra */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand" />
                      <h3 className="text-[14px] font-semibold text-txt">
                        Seu tempo também custa (Mão de obra)
                      </h3>
                    </div>
                    <label className="flex items-center gap-1.5 text-[12px] text-txt cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.enableLabor}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            enableLabor: e.target.checked,
                          }))
                        }
                        className="rounded text-brand focus:ring-brand"
                      />
                      <span>Ativar</span>
                    </label>
                  </div>

                  {state.enableLabor && (
                    <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="text-txt-muted">Sua hora de trabalho:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-txt-muted">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={state.laborHourlyRate ?? settings.laborHourlyRate}
                            onChange={(e) =>
                              onChange((prev) => ({
                                ...prev,
                                laborHourlyRate: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 px-2 py-1 bg-surface border border-border rounded text-right font-mono text-[12px] outline-none"
                          />
                          <span className="text-txt-muted">/h</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                        <div>
                          <label className="block text-txt-muted text-[11px] mb-1">
                            Fatiamento / Mesa
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={state.prepMinutes || ''}
                              onChange={(e) =>
                                onChange((prev) => ({
                                  ...prev,
                                  prepMinutes: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              placeholder="10"
                              className="w-full bg-surface px-2 py-1 border border-border rounded text-right font-mono text-[12px]"
                            />
                            <span className="ml-1 text-txt-muted font-mono text-[11px]">min</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-txt-muted text-[11px] mb-1">
                            Pós-processamento
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={state.finishMinutes || ''}
                              onChange={(e) =>
                                onChange((prev) => ({
                                  ...prev,
                                  finishMinutes: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              placeholder="15"
                              className="w-full bg-surface px-2 py-1 border border-border rounded text-right font-mono text-[12px]"
                            />
                            <span className="ml-1 text-txt-muted font-mono text-[11px]">min</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-txt-muted text-[11px] mb-1">
                            Montagem
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={state.assemblyMinutes || ''}
                              onChange={(e) =>
                                onChange((prev) => ({
                                  ...prev,
                                  assemblyMinutes: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              placeholder="0"
                              className="w-full bg-surface px-2 py-1 border border-border rounded text-right font-mono text-[12px]"
                            />
                            <span className="ml-1 text-txt-muted font-mono text-[11px]">min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outros Insumos & Despesas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackagePlus className="w-4 h-4 text-brand" />
                      <h3 className="text-[14px] font-semibold text-txt">
                        Embalagem e outros insumos
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExtraCost}
                      className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar item</span>
                    </button>
                  </div>

                  {state.extraCosts.length > 0 ? (
                    <div className="space-y-2">
                      {state.extraCosts.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border"
                        >
                          <input
                            type="text"
                            value={extra.name}
                            onChange={(e) =>
                              handleUpdateExtraCost(extra.id, { name: e.target.value })
                            }
                            placeholder="Nome (ex: Parafuso M3, Caixa)"
                            className="flex-1 bg-transparent text-[12px] text-txt outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] text-txt-muted">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={extra.costPerUnit || ''}
                              onChange={(e) =>
                                handleUpdateExtraCost(extra.id, {
                                  costPerUnit: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="2.50"
                              className="w-20 px-2 py-1 border border-border rounded text-right font-mono text-[12px] outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraCost(extra.id)}
                            className="p-1 text-txt-muted hover:text-red-600 transition-colors"
                            aria-label="Remover insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-txt-muted italic">
                      Nenhum insumo extra cadastrado. Adicione embalagens, parafusos, ímãs ou cola.
                    </p>
                  )}
                </div>

                {/* Produção em Lote */}
                <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand" />
                    <h4 className="text-[13px] font-semibold text-txt">
                      Produção em Lote / Atacado
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-[12px]">
                    <div>
                      <label className="block text-txt-muted mb-1">
                        Desconto no volume (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={state.quantityDiscountPct || ''}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            quantityDiscountPct: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        className="w-full bg-surface px-3 py-1.5 border border-border rounded font-mono text-[12px] text-right"
                      />
                    </div>
                  </div>
                  {state.batchUnits > 1 && (
                    <div className="pt-2 border-t border-border flex items-center justify-between text-[12px]">
                      <span className="text-txt-muted">
                        Total do lote ({state.batchUnits} peças):
                      </span>
                      <span className="font-mono font-semibold text-txt">
                        {formatBRL(calculation.totalBatchRevenue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Chamada Discreta para o Modo Avançado (visível apenas no modo básico) */}
          {state.mode === 'basic' && (
            <div className="pt-6 pb-2">
              <button
                type="button"
                onClick={() => handleModeChange('advanced')}
                className="inline-flex items-center gap-1.5 text-[12px] text-txt-muted hover:text-brand transition-colors group text-left cursor-pointer"
              >
                <span>
                  Precisa de controle sobre depreciação, mão de obra e perdas? Alternar para o{' '}
                  <strong className="group-hover:underline">Modo Avançado</strong>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </main>

        {/* COLUNA DIREITA — O RESULTADO COMO ELEMENTO HERO (Sticky, Sem empilhamento de cards) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-8">
          <div className="bg-surface rounded-xl border border-border p-6 sm:p-7 flex flex-col shadow-xs">
            {/* Status discreto */}
            <div className="flex items-center justify-between pb-5 border-b border-border">
              <div
                className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                  calculation.statusTag.tone === 'healthy'
                    ? 'text-brand'
                    : calculation.statusTag.tone === 'tight'
                    ? 'text-amber-700'
                    : calculation.statusTag.tone === 'loss'
                    ? 'text-red-700'
                    : 'text-emerald-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    calculation.statusTag.tone === 'healthy'
                      ? 'bg-brand'
                      : calculation.statusTag.tone === 'tight'
                      ? 'bg-amber-600'
                      : calculation.statusTag.tone === 'loss'
                      ? 'bg-red-600'
                      : 'bg-emerald-600'
                  }`}
                />
                <span>{calculation.statusTag.label}</span>
              </div>
              <span className="font-mono text-[11px] text-txt-muted">Resultado</span>
            </div>

            {/* Bloco Hero Principal: Preço Recomendado */}
            <div className="py-6 flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-wider text-txt-muted font-medium">
                {state.batchUnits > 1 ? 'PREÇO UNITÁRIO' : 'PREÇO RECOMENDADO'}
              </span>
              {/* PREÇO HERO ENORME E INCONFUNDÍVEL */}
              <div className="font-display text-[42px] sm:text-[48px] font-bold text-txt tracking-tight leading-none mt-2 mb-2 tabular-nums">
                {formatBRL(calculation.recommendedPrice)}
              </div>
              {/* Sub-linha harmoniosa */}
              <p className="text-[13px] text-txt-muted">
                Margem de {formatPercent(calculation.realMarginPct)} · Lucro de{' '}
                {formatBRL(calculation.profit)}
              </p>

              {state.batchUnits > 1 && (
                <div className="mt-5 p-4 bg-canvas border border-border/80 rounded-lg flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-txt-muted font-medium mb-1">
                    Total do Lote ({state.batchUnits} unid.)
                  </span>
                  <div className="font-display text-[28px] font-bold text-brand tracking-tight tabular-nums">
                    {formatBRL(calculation.totalBatchRevenue)}
                  </div>
                  <div className="text-[12px] text-txt-muted mt-1">
                    Custo total: {formatBRL(calculation.totalBatchCost)} · Lucro total:{' '}
                    {formatBRL(calculation.profit * state.batchUnits)}
                  </div>
                </div>
              )}
            </div>

            {/* Linha horizontal de métricas limpas em única faixa integrada (sem cards individuais) */}
            <div className="py-3.5 px-4 rounded-lg bg-canvas border border-border/80 grid grid-cols-3 divide-x divide-border mb-6">
              <div className="pr-2 flex flex-col">
                <span className="text-[11px] text-txt-muted">Custo estimado</span>
                <span className="font-mono text-[13px] font-semibold text-txt mt-0.5 tabular-nums">
                  {formatBRL(calculation.totalUnitCost)}
                </span>
              </div>
              <div className="px-3 flex flex-col">
                <span className="text-[11px] text-txt-muted">Seu lucro</span>
                <span className="font-mono text-[13px] font-semibold text-brand mt-0.5 tabular-nums">
                  {formatBRL(calculation.profit)}
                </span>
              </div>
              <div className="pl-3 flex flex-col">
                <span className="text-[11px] text-txt-muted">Margem</span>
                <span className="font-mono text-[13px] font-semibold text-txt mt-0.5 tabular-nums">
                  {formatPercent(calculation.realMarginPct)}
                </span>
              </div>
            </div>

            {/* Modo Avançado: Barra Visual de Composição de Custos */}
            {state.mode === 'advanced' && calculation.recommendedPrice > 0 && (
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between text-[11px] text-txt-muted mb-2 font-mono uppercase tracking-wider">
                  <span>Composição do Preço</span>
                  <span>100%</span>
                </div>
                {/* Horizontal Segmented Bar */}
                <div className="w-full h-2.5 rounded-full bg-border overflow-hidden flex">
                  {matBarPct > 0 && (
                    <div
                      style={{ width: `${matBarPct}%` }}
                      className="bg-brand h-full"
                      title={`Material: ${formatBRL(calculation.materialCost)}`}
                    />
                  )}
                  {operBarPct > 0 && (
                    <div
                      style={{ width: `${operBarPct}%` }}
                      className="bg-[#546657] h-full"
                      title={`Operação: ${formatBRL(calculation.operationalCost)}`}
                    />
                  )}
                  {laborBarPct > 0 && (
                    <div
                      style={{ width: `${laborBarPct}%` }}
                      className="bg-[#A48252] h-full"
                      title={`Mão de obra: ${formatBRL(calculation.laborCost)}`}
                    />
                  )}
                  {extrasBarPct > 0 && (
                    <div
                      style={{ width: `${extrasBarPct}%` }}
                      className="bg-[#8A9089] h-full"
                      title={`Insumos: ${formatBRL(calculation.extrasCost)}`}
                    />
                  )}
                  {taxesBarPct > 0 && (
                    <div
                      style={{ width: `${taxesBarPct}%` }}
                      className="bg-[#C2C8C1] h-full"
                      title={`Taxas: ${formatBRL(calculation.channelFeeAmount + calculation.taxAmount)}`}
                    />
                  )}
                  {profitBarPct > 0 && (
                    <div
                      style={{ width: `${profitBarPct}%` }}
                      className="bg-[#10B981] h-full"
                      title={`Lucro: ${formatBRL(calculation.profit)}`}
                    />
                  )}
                </div>
                {/* Compact Legend */}
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 mt-3 text-[11px] text-txt-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    <span>Material ({formatBRL(calculation.materialCost)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#546657]" />
                    <span>Máquina ({formatBRL(calculation.operationalCost)})</span>
                  </div>
                  {calculation.laborCost > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#A48252]" />
                      <span>Trabalho ({formatBRL(calculation.laborCost)})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C2C8C1]" />
                    <span>Taxas ({formatBRL(calculation.channelFeeAmount + calculation.taxAmount)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-txt font-medium">Lucro ({formatBRL(calculation.profit)})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Três cenários de preço apresentados de forma super minimalista */}
            <div className="flex flex-col gap-2 mb-6">
              <span className="font-mono text-[11px] text-txt-muted uppercase tracking-wider">
                Cenários de preço
              </span>
              <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden">
                {/* Mínimo */}
                <div
                  className="p-2.5 flex items-center justify-between text-[12px] bg-surface hover:bg-canvas transition-colors cursor-pointer"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, desiredMarginPct: 15 }))
                  }
                  title="Aplicar margem mínima (15%)"
                >
                  <span className="text-txt-muted">Mínimo (Break-even)</span>
                  <span className="font-mono font-medium text-txt tabular-nums">
                    {formatBRL(calculation.minPrice)}
                  </span>
                </div>
                {/* Recomendado (destacado suavemente) */}
                <div className="p-2.5 flex items-center justify-between text-[12px] bg-brand-light/50">
                  <div className="flex items-center gap-1.5 font-medium text-txt">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <span>Recomendado</span>
                  </div>
                  <span className="font-mono font-semibold text-brand tabular-nums">
                    {formatBRL(calculation.recommendedPrice)}
                  </span>
                </div>
                {/* Maior margem */}
                <div
                  className="p-2.5 flex items-center justify-between text-[12px] bg-surface hover:bg-canvas transition-colors cursor-pointer"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      desiredMarginPct: Math.min(80, prev.desiredMarginPct + 15),
                    }))
                  }
                  title="Aumentar margem em +15%"
                >
                  <span className="text-txt-muted">Maior margem</span>
                  <span className="font-mono font-medium text-txt tabular-nums">
                    {formatBRL(calculation.maxPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              {/* Botão principal 'Salvar precificação' com bg #2F6B4A */}
              <button
                type="button"
                onClick={handleSaveClick}
                className="w-full py-2.5 px-4 rounded-md bg-brand hover:bg-brand-hover text-white font-medium text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Salvo com sucesso!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Salvar precificação</span>
                  </>
                )}
              </button>

              {/* Ações secundárias limpas */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onNewPiece}
                  className="py-2 px-3 rounded-md bg-surface hover:bg-canvas text-txt text-[12px] font-medium border border-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-txt-muted" />
                  <span>Nova peça</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenShare}
                  className="py-2 px-3 rounded-md bg-surface hover:bg-canvas text-txt text-[12px] font-medium border border-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-txt-muted" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
