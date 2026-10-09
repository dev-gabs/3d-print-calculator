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
  Package,
  Store,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  DollarSign,
  Percent,
  Sliders,
  Pencil,
  CopyPlus,
  X,
} from 'lucide-react';
import {
  CalculationResult,
  ChannelId,
  ExtraCostItem,
  GlobalSettings,
  Material,
  MultiMaterialEntry,
  ProductPricingState,
  SavedProduct,
} from '../../types/pricing';
import { formatBRL, formatPercent, calculateMarginFromSalePrice } from '../../utils/pricingEngine';

interface CalculatorPageProps {
  state: ProductPricingState;
  calculation: CalculationResult;
  materials: Material[];
  products: SavedProduct[];
  settings: GlobalSettings;
  onChange: (updater: (prev: ProductPricingState) => ProductPricingState) => void;
  onReset: () => void;
  onSave: (mode?: 'create_new' | 'overwrite') => void;
  onNewPiece: () => void;
  onOpenShare: () => void;
  onNavigateToMaterials: () => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  state,
  calculation,
  materials,
  products,
  settings,
  onChange,
  onReset,
  onSave,
  onNewPiece,
  onOpenShare,
  onNavigateToMaterials,
}) => {
  const [saveSuccess, setSaveSuccess] = useState<string | false>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const channels: Array<{ id: ChannelId; label: string; defaultFee: number }> = [
    { id: 'shopee', label: 'Shopee', defaultFee: settings.channelFees.shopee ?? 20 },
    {
      id: 'mercadolivre',
      label: 'Mercado Livre',
      defaultFee: settings.channelFees.mercadolivre ?? 19,
    },
    { id: 'direta', label: 'Venda direta', defaultFee: settings.channelFees.direta ?? 0 },
    { id: 'outro', label: 'Outro canal', defaultFee: settings.channelFees.outro ?? 16 },
  ];

  const quickMargins = [20, 30, 40, 50, 60, 70];

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

  // Detect if a saved product with the same name already exists in catalog
  // Rule: Only triggers when an identical name exists in products list
  const trimmedName = state.name.trim();
  const existingProduct = products?.find((p) => {
    if (!trimmedName) return false;
    return p.state.name.trim().toLowerCase() === trimmedName.toLowerCase();
  });

  const isDuplicateName = Boolean(existingProduct);
  const isExistingProduct = isDuplicateName;

  const handleSaveClick = () => {
    if (!trimmedName) {
      setNameError('Dê um nome para a sua peça antes de salvar a precificação.');
      // Focus name input if available
      const inputEl = document.getElementById('input-prod-name');
      if (inputEl) {
        inputEl.focus();
      }
      return;
    }

    setNameError(null);

    if (isDuplicateName) {
      setConfirmModalOpen(true);
    } else {
      onSave('create_new');
      setSaveSuccess('Criado com sucesso!');
      setTimeout(() => setSaveSuccess(false), 2200);
    }
  };

  const handleConfirmOverwrite = () => {
    setConfirmModalOpen(false);
    onSave('overwrite');
    setSaveSuccess('Edição salva!');
    setTimeout(() => setSaveSuccess(false), 2200);
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

  // Adaptive max margin based on active channel fees & taxes
  const currentChannelPct = state.enablePlatformFee ? (state.channelFeePct || 0) : 0;
  const currentTaxPct = state.mode === 'advanced' ? (state.taxRatePct || 0) : 0;
  const maxAllowedMargin = Math.floor(Math.max(10, 99.5 - currentChannelPct - currentTaxPct));
  const availablePresets = [20, 30, 40, 50, 60, 70, 80, 90].filter((p) => p <= maxAllowedMargin);

  // Target Sale Price handler: unconstrained, adaptive calculation of profit and margin
  const handleTargetPriceChange = (valStr: string) => {
    const newPrice = parseFloat(valStr) || 0;
    const cost = calculation.totalUnitCost;
    const channelPct = state.enablePlatformFee ? (state.channelFeePct || 0) : 0;
    const taxPct = state.mode === 'advanced' ? (state.taxRatePct || 0) : 0;
    const fixedFee = (state.mode === 'advanced' && state.enablePlatformFee) ? (state.fixedChannelFee || 0) : 0;

    const { marginPct } = calculateMarginFromSalePrice(newPrice, cost, channelPct, taxPct, fixedFee);
    const calculatedMargin = Math.round(marginPct * 10) / 10;

    onChange((prev) => ({
      ...prev,
      targetPrice: newPrice,
      desiredMarginPct: calculatedMargin,
    }));
  };

  // Composition breakdown percentages for visual bar (Used in BOTH Basic & Advanced mode)
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
    <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
      {/* ── Page Header: Fintech Dashboard Style ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-7 border-b border-border/80">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[24px] sm:text-[28px] font-bold tracking-tight text-txt">
              Quanto essa peça realmente custa?
            </h1>

            {/* Mode Switcher Pill */}
            <div className="inline-flex items-center p-1 rounded-full bg-surface border border-border text-[12px] shadow-2xs">
              <button
                type="button"
                onClick={() => handleModeChange('basic')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${state.mode === 'basic'
                    ? 'text-txt bg-canvas shadow-xs font-semibold'
                    : 'text-txt-muted hover:text-txt'
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${state.mode === 'advanced'
                    ? 'text-txt bg-canvas shadow-xs font-semibold'
                    : 'text-txt-muted hover:text-txt'
                  }`}
              >
                {state.mode === 'advanced' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                )}
                Avançado
              </button>
            </div>
          </div>
          <p className="text-[13px] sm:text-[14px] text-txt-muted mt-1 font-normal">
            Precifique sua impressão 3D com precisão de markup e clareza de margem líquida.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-border text-[12px] font-medium text-txt-muted hover:text-txt hover:border-border-subtle transition-all self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Redefinir campos</span>
        </button>
      </header>

      {/* ── Mode Alerts ── */}
      {state.mode === 'advanced' && (
        <div className="mb-6 p-4 rounded-xl bg-accent-blue-bg/60 border border-accent-blue/20 flex items-start gap-3 text-[13px] text-txt animate-fadeIn">
          <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-accent-blue">Modo Avançado ativado: </span>
            <span>
              Custos ocultos agora são calculados individualmente: mão de obra, insumos extras, perdas de suporte e depreciação da máquina.
            </span>
          </div>
        </div>
      )}

      {/* Margin / Calculation Validation Alert */}
      {!calculation.isValid && calculation.validationMessage && (
        <div className="mb-6 p-4 rounded-xl bg-accent-amber-bg border border-accent-amber/30 flex items-start gap-3 text-[13px] text-accent-amber animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-accent-amber">Atenção na configuração de margem</h4>
            <p className="mt-0.5 text-accent-amber/90 leading-relaxed">
              {calculation.validationMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Grid Principal: Formulário Estruturado & Resultado Hero ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
        {/* COLUNA ESQUERDA: Seções Reconhecíveis do Formulário */}
        <main className="lg:col-span-7 flex flex-col gap-6">
          {/* ── 01: Sua peça ── */}
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                    01
                  </span>
                  <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                    Sua peça
                  </h2>
                </div>
                <p className="text-[12px] text-txt-muted">
                  Nome, material principal, peso do fatiador e quantidade.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Nome da peça */}
              <div>
                <label
                  htmlFor="input-prod-name"
                  className="block text-[12px] font-medium text-txt-muted mb-1.5"
                >
                  Nome do modelo ou projeto
                </label>
                <input
                  id="input-prod-name"
                  type="text"
                  value={state.name}
                  onChange={(e) => {
                    setNameError(null);
                    onChange((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Ex.: Suporte de Mesa para Headset"
                  className={`w-full bg-surface-raised text-txt px-3.5 py-2.5 rounded-xl border text-[13px] outline-none transition-all placeholder:text-txt-muted/50 ${
                    nameError
                      ? 'border-[#E11D48] focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20'
                      : isDuplicateName
                        ? 'border-amber-500/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-border focus:border-brand focus:ring-2 focus:ring-brand/15'
                  }`}
                />
                {nameError && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#E11D48]/10 border border-[#E11D48]/30 flex items-center gap-2 text-[12px] text-[#E11D48] dark:text-[#FB7185] animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D48] dark:text-[#FB7185]" />
                    <span className="font-medium">{nameError}</span>
                  </div>
                )}
                {!nameError && isDuplicateName && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-400 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>
                      Já existe uma peça salva como <strong>"{trimmedName}"</strong>. Altere o nome para salvar como um novo produto ou use <strong>"Editar item"</strong> para sobrescrever.
                    </span>
                  </div>
                )}
              </div>

              {/* Material, Peso e Quantidade em grade balanceada */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Material principal */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="select-material"
                      className="block text-[12px] font-medium text-txt-muted"
                    >
                      Material principal
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToMaterials}
                      className="text-[11px] text-brand hover:underline font-medium cursor-pointer"
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
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-9 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] outline-none cursor-pointer appearance-none font-medium transition-all"
                    >
                      {materials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name} ({formatBRL(mat.pricePerKg)}/kg)
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-4 h-4 text-txt-muted absolute right-3 top-3.5 pointer-events-none"
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

                {/* Peso da peça */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="input-weight"
                    className="block text-[12px] font-medium text-txt-muted mb-1.5"
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
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-8 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none transition-all"
                    />
                    <span className="absolute right-3 text-[12px] font-mono text-txt-muted pointer-events-none">
                      g
                    </span>
                  </div>
                </div>

                {/* Quantidade (Lote) */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="input-quantity"
                    className="block text-[12px] font-medium text-txt-muted mb-1.5"
                  >
                    Quantidade
                  </label>
                  <div className="relative flex items-center">
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
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-12 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none transition-all"
                    />
                    <span className="absolute right-3 text-[11px] font-mono text-txt-muted pointer-events-none">
                      un
                    </span>
                  </div>
                </div>
              </div>

              {/* Modo Avançado: Perda de Material e Filamentos Adicionais */}
              {state.mode === 'advanced' && (
                <div className="mt-2 pt-4 border-t border-border/80 flex flex-col gap-3.5">
                  {/* Desperdício */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-canvas border border-border">
                    <div className="flex items-center gap-2.5">
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
                        className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer accent-brand"
                      />
                      <label htmlFor="chk-waste" className="text-[12px] font-medium text-txt cursor-pointer">
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
                          className="w-16 bg-surface text-txt px-2.5 py-1 rounded-lg border border-border text-right font-mono text-[12px] outline-none"
                        />
                        <span className="text-[12px] font-mono text-txt-muted">%</span>
                      </div>
                    )}
                  </div>

                  {/* Filamentos Adicionais (Bicolor / Suporte PVA) */}
                  {state.additionalMaterials.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-txt-muted font-semibold">
                        Filamentos Adicionais (Bicolor / Suporte Solúvel)
                      </span>
                      {state.additionalMaterials.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border"
                        >
                          <select
                            value={entry.materialId}
                            onChange={(e) =>
                              handleUpdateExtraMaterial(entry.id, {
                                materialId: e.target.value,
                              })
                            }
                            className="flex-1 bg-transparent text-[12px] font-medium text-txt outline-none"
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
                              className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-right font-mono text-[12px] outline-none"
                            />
                            <span className="text-[11px] font-mono text-txt-muted">g</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraMaterial(entry.id)}
                            className="p-1.5 text-txt-muted hover:text-red-600 transition-colors cursor-pointer"
                            aria-label="Remover material adicional"
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
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:text-brand-hover transition-colors self-start cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar outro filamento na peça</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── 02: Produção ── */}
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                    02
                  </span>
                  <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                    Produção
                  </h2>
                </div>
                <p className="text-[12px] text-txt-muted">
                  Tempo estimado no fatiador e custos de máquina.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Horas e Minutos */}
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
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-8 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none text-right transition-all"
                    />
                    <span className="absolute right-3 text-[12px] font-mono text-txt-muted pointer-events-none">
                      h
                    </span>
                  </div>
                  <span className="text-txt-muted text-[13px] font-medium">e</span>
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
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-11 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none text-right transition-all"
                    />
                    <span className="absolute right-3 text-[12px] font-mono text-txt-muted pointer-events-none">
                      min
                    </span>
                  </div>
                </div>
                <span className="text-[12px] text-txt-muted sm:ml-2">
                  Tempo total informado no seu fatiador (Bambu, Orca, Cura, Prusa).
                </span>
              </div>

              {/* Modo Avançado: Parâmetros de Máquina */}
              {state.mode === 'advanced' && (
                <div className="mt-2 pt-4 border-t border-border/80 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl">
                      <span className="text-txt-muted">Potência média da impressora:</span>
                      <span className="font-mono text-txt font-semibold">
                        {settings.printerPowerWatts} W
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl">
                      <span className="text-txt-muted">Tarifa de energia elétrica:</span>
                      <span className="font-mono text-txt font-semibold">
                        {formatBRL(settings.energyCostKwh)} / kWh
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2.5 p-3 bg-canvas border border-border rounded-xl text-[12px] text-txt cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={state.includeMaintenance}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            includeMaintenance: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer accent-brand"
                      />
                      <span>Manutenção preventiva ({formatBRL(settings.wearCostPerHour)}/h)</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 bg-canvas border border-border rounded-xl text-[12px] text-txt cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={state.includeDepreciation}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            includeDepreciation: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer accent-brand"
                      />
                      <span>Depreciação de máquina ({formatBRL(settings.depreciationPerHour)}/h)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 03: Preço de Venda ou Margem de Lucro ── */}
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
            {/* Section Header */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                      03
                    </span>
                    <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                      Preço de venda
                    </h2>
                  </div>
                  <p className="text-[12px] text-txt-muted">
                    Defina o preço de venda final do produto (R$) ou configure por margem de lucro (%).
                  </p>
                </div>
              </div>

              {/* Pill em Destaque com Valor da Margem */}
              <div className="px-3.5 py-1 rounded-full bg-brand-subtle text-brand border border-brand/20 font-mono text-[14px] font-bold shrink-0">
                {state.pricingMethod === 'margin'
                  ? `${state.desiredMarginPct}% margem`
                  : `${formatPercent(calculation.realMarginPct, 1)} margem`}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Seletor de Método: Preço Final (R$) como padrão primeiro, Margem (%) opcional em segundo */}
              <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border text-[12px] font-medium self-start shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const currentCalculated = calculation.recommendedPrice > 0 ? Number(calculation.recommendedPrice.toFixed(2)) : 50;
                    onChange((prev) => ({
                      ...prev,
                      pricingMethod: 'target_price',
                      targetPrice: prev.targetPrice || currentCalculated,
                    }));
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${state.pricingMethod !== 'margin'
                      ? 'bg-surface text-txt font-semibold shadow-xs border border-border/80'
                      : 'text-txt-muted hover:text-txt'
                    }`}
                >
                  Definir Preço Final (R$)
                </button>
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, pricingMethod: 'margin' }))}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${state.pricingMethod === 'margin'
                      ? 'bg-surface text-txt font-semibold shadow-xs border border-border/80'
                      : 'text-txt-muted hover:text-txt'
                    }`}
                >
                  Definir por Margem (%)
                </button>
              </div>

              {/* Conteúdo: PADRÃO ATIVO - DEFINIR VALOR DE VENDA (R$) */}
              {state.pricingMethod !== 'margin' ? (
                <div className="p-4 rounded-xl bg-surface-raised border border-border flex flex-col gap-3.5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label htmlFor="input-target-price" className="block text-[13px] font-semibold text-txt">
                        Preço de venda desejado
                      </label>
                      <span className="text-[12px] text-txt-muted">
                        Informe o valor que você quer cobrar pelo produto final.
                      </span>
                    </div>
                    <div className="relative flex items-center w-40">
                      <span className="absolute left-3 text-[13px] font-mono font-medium text-txt-muted pointer-events-none">
                        R$
                      </span>
                      <input
                        id="input-target-price"
                        type="number"
                        min="0"
                        step="0.5"
                        value={state.targetPrice !== undefined ? state.targetPrice : (calculation.recommendedPrice > 0 ? Number(calculation.recommendedPrice.toFixed(2)) : '')}
                        onChange={(e) => handleTargetPriceChange(e.target.value)}
                        placeholder="49,90"
                        className="w-full bg-surface text-txt pl-10 pr-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[15px] font-mono font-bold text-right outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Feedback em tempo real com métricas calculadas em cima do valor de venda */}
                  <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-txt-muted font-medium">Margem de lucro calculada:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-md ${calculation.realMarginPct >= 30
                            ? 'bg-brand-subtle text-brand'
                            : calculation.realMarginPct >= 15
                              ? 'bg-accent-amber-bg text-accent-amber'
                              : ''
                          }`}
                        style={
                          calculation.realMarginPct < 15
                            ? { backgroundColor: 'var(--color-semantic-danger-bg)', color: 'var(--color-semantic-danger)' }
                            : undefined
                        }
                      >
                        {formatPercent(calculation.realMarginPct, 1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-txt-muted font-medium">Lucro líquido:</span>
                      <span className="font-mono font-bold text-brand">
                        {formatBRL(calculation.profit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-txt-muted font-medium">Custo total da peça:</span>
                      <span className="font-mono font-semibold text-txt">
                        {formatBRL(calculation.totalUnitCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Conteúdo: OPCIONAL / ELABORADO - MODO MARGEM (%) */
                <div className="flex flex-col gap-4 animate-fadeIn">
                  {/* Presets rápidos + Campo de Porcentagem Personalizada */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] font-medium text-txt-muted mr-1">Atalhos:</span>
                      {availablePresets.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            onChange((prev) => ({ ...prev, desiredMarginPct: m }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-[12px] font-mono font-medium transition-all cursor-pointer border ${state.desiredMarginPct === m
                              ? 'bg-brand text-white border-brand shadow-xs'
                              : 'bg-surface-raised hover:bg-canvas border-border text-txt'
                            }`}
                        >
                          {m}%
                        </button>
                      ))}
                    </div>

                    {/* Campo de Porcentagem Personalizada Dinâmico */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="custom-margin-input" className="text-[12px] font-medium text-txt-muted">
                        Personalizada:
                      </label>
                      <div className="relative flex items-center w-22">
                        <input
                          id="custom-margin-input"
                          type="number"
                          min="1"
                          max={maxAllowedMargin}
                          step="1"
                          value={state.desiredMarginPct || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                              ...prev,
                              desiredMarginPct: isNaN(val) ? 0 : Math.min(maxAllowedMargin, Math.max(1, val)),
                            }));
                          }}
                          placeholder="40"
                          className="w-full bg-surface-raised text-txt px-2.5 py-1.5 pr-6 rounded-lg border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono font-bold text-right outline-none"
                        />
                        <span className="absolute right-2 text-[11px] font-mono text-txt-muted pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slider de margem suave auto-adaptativo */}
                  <div className="flex flex-col gap-2 pt-1">
                    <input
                      id="range-margin"
                      type="range"
                      min="5"
                      max={maxAllowedMargin}
                      step="1"
                      value={Math.min(maxAllowedMargin, state.desiredMarginPct || 40)}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          desiredMarginPct: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-txt-muted">
                      <span>Mínimo (5%)</span>
                      <span>Média (40%)</span>
                      <span>Teto auto-adaptativo ({maxAllowedMargin}%)</span>
                    </div>
                  </div>

                  <p className="text-[12px] text-txt-muted leading-relaxed">
                    A margem é calculada por markup divisor. O teto máximo ajusta-se automaticamente de acordo com as taxas ativas para garantir sustentabilidade matemática.
                  </p>
                </div>
              )}

              {/* Modo Avançado: Mão de Obra, Insumos Extras e Lote */}
              {state.mode === 'advanced' && (
                <div className="mt-3 pt-5 border-t border-border/80 space-y-5">
                  {/* Mão de Obra */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand" />
                        <h3 className="text-[13px] font-semibold text-txt">
                          Mão de obra e tempo dedicado
                        </h3>
                      </div>
                      <label className="flex items-center gap-2 text-[12px] font-medium text-txt cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.enableLabor}
                          onChange={(e) =>
                            onChange((prev) => ({
                              ...prev,
                              enableLabor: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer accent-brand"
                        />
                        <span>Incluir mão de obra</span>
                      </label>
                    </div>

                    {state.enableLabor && (
                      <div className="p-4 rounded-xl bg-canvas border border-border space-y-3.5">
                        <div className="flex items-center justify-between gap-3 text-[12px]">
                          <span className="font-medium text-txt">Valor da sua hora de trabalho:</span>
                          <div className="flex items-center gap-1.5">
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
                              className="w-20 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-right font-mono text-[12px] outline-none font-semibold text-txt"
                            />
                            <span className="text-txt-muted font-mono">/h</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                          <div>
                            <label className="block text-txt-muted text-[11px] mb-1 font-medium">
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
                                className="w-full bg-surface px-2.5 py-1.5 border border-border rounded-lg text-right font-mono text-[12px]"
                              />
                              <span className="ml-1 text-txt-muted font-mono text-[11px]">min</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-txt-muted text-[11px] mb-1 font-medium">
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
                                className="w-full bg-surface px-2.5 py-1.5 border border-border rounded-lg text-right font-mono text-[12px]"
                              />
                              <span className="ml-1 text-txt-muted font-mono text-[11px]">min</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-txt-muted text-[11px] mb-1 font-medium">
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
                                className="w-full bg-surface px-2.5 py-1.5 border border-border rounded-lg text-right font-mono text-[12px]"
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
                        <h3 className="text-[13px] font-semibold text-txt">
                          Embalagem e insumos adicionais
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddExtraCost}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline cursor-pointer"
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
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-raised border border-border"
                          >
                            <input
                              type="text"
                              value={extra.name}
                              onChange={(e) =>
                                handleUpdateExtraCost(extra.id, { name: e.target.value })
                              }
                              placeholder="Nome (ex: Caixa correios, Parafusos)"
                              className="flex-1 bg-transparent text-[12px] font-medium text-txt outline-none"
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
                                className="w-20 px-2 py-1 bg-surface border border-border rounded-lg text-right font-mono text-[12px] outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraCost(extra.id)}
                              className="p-1.5 text-txt-muted hover:text-red-600 transition-colors cursor-pointer"
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
                  <div className="p-4 rounded-xl bg-canvas border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand" />
                      <h4 className="text-[13px] font-semibold text-txt">
                        Produção em Lote / Atacado
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-[12px]">
                      <div>
                        <label className="block text-txt-muted mb-1 font-medium">
                          Desconto de volume no atacado (%)
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
                          className="w-full bg-surface px-3 py-1.5 border border-border rounded-lg font-mono text-[12px] text-right"
                        />
                      </div>
                    </div>
                    {state.batchUnits > 1 && (
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[12px]">
                        <span className="text-txt-muted font-medium">
                          Faturamento do lote ({state.batchUnits} peças):
                        </span>
                        <span className="font-mono font-bold text-txt">
                          {formatBRL(calculation.totalBatchRevenue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── 04: Comissão de plataforma de e-commerce (Com Toggle Habilitar/Desabilitar) ── */}
          <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
            {/* Section Header with Enable/Disable Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${state.enablePlatformFee ? 'bg-brand-subtle text-brand' : 'bg-canvas text-txt-muted'
                  }`}>
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                      04
                    </span>
                    <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                      Comissão de marketplace
                    </h2>
                  </div>
                  <p className="text-[12px] text-txt-muted">
                    Taxa ou comissão cobrada por marketplaces como Shopee ou Mercado Livre.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono font-medium text-txt-muted hidden sm:inline">
                  {state.enablePlatformFee ? 'Ativada' : 'Desativada'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(state.enablePlatformFee)}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      enablePlatformFee: !prev.enablePlatformFee,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${state.enablePlatformFee ? 'bg-brand' : 'bg-border'
                    }`}
                  title={state.enablePlatformFee ? 'Clique para desativar comissão de canal' : 'Clique para ativar comissão de canal'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${state.enablePlatformFee ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Content: Visible when enabled, Clean placeholder when disabled */}
            {!state.enablePlatformFee ? (
              <div className="p-4 rounded-xl bg-canvas border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-txt-muted">
                <span>
                  Comissão desativada. O cálculo assume venda direta sem taxas de marketplace (0%).
                </span>
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, enablePlatformFee: true }))}
                  className="text-brand font-semibold hover:underline cursor-pointer self-start sm:self-auto text-[12px]"
                >
                  Habilitar taxa de marketplace
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-fadeIn">
                {/* Cards modernos de canais inspirados em Fintech UI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {channels.map((chan) => {
                    const isSelected = state.channel === chan.id;
                    return (
                      <button
                        key={chan.id}
                        type="button"
                        onClick={() => handleChannelSelect(chan.id, chan.defaultFee)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected
                            ? 'bg-brand/10 border-brand text-txt shadow-2xs ring-1 ring-brand/30'
                            : 'bg-surface-raised hover:bg-canvas border-border text-txt hover:border-border-subtle'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[13px] font-semibold tracking-tight">{chan.label}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
                        </div>
                        <span className="text-[11px] font-mono text-txt-muted">
                          {chan.defaultFee}% taxa
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Taxa percentual customizável */}
                <div className="flex items-center gap-3 text-[13px] text-txt-muted mt-1">
                  <span className="font-medium">Comissão do canal selecionado:</span>
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
                      className="w-full bg-surface-raised text-txt px-3 py-1.5 pr-6 rounded-lg border border-border focus:border-brand focus:ring-1 focus:ring-brand/30 text-[13px] font-mono outline-none text-right transition-colors font-semibold"
                    />
                    <span className="absolute right-2 text-[12px] font-mono text-txt-muted pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Modo Avançado: Taxa Fixa e Impostos */}
                {state.mode === 'advanced' && (
                  <div className="mt-2 pt-4 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                        Tarifa fixa por venda (ex: R$ 4,00 marketplace)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-[12px] font-mono text-txt-muted">
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
                          className="w-full bg-surface-raised text-txt pl-9 pr-3.5 py-2 rounded-xl border border-border text-[13px] font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
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
                          className="w-full bg-surface-raised text-txt px-3.5 py-2 pr-7 rounded-xl border border-border text-[13px] font-mono outline-none text-right"
                        />
                        <span className="absolute right-2.5 text-[12px] font-mono text-txt-muted">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Banner discreto para convite ao Modo Avançado (apenas no modo básico) */}
          {state.mode === 'basic' && (
            <div className="pt-1 pb-4">
              <button
                type="button"
                onClick={() => handleModeChange('advanced')}
                className="w-full p-4 rounded-2xl bg-surface border border-border hover:border-brand/40 text-left transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-txt-muted group-hover:text-brand transition-colors">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-txt group-hover:text-brand transition-colors">
                      Precisa de controle sobre depreciação, mão de obra e perdas?
                    </span>
                    <p className="text-[12px] text-txt-muted">
                      Clique para ativar o <strong>Modo Avançado</strong> e personalizar parâmetros industriais.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-txt-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            </div>
          )}
        </main>

        {/* ── COLUNA DIREITA: O RESULTADO COMO ELEMENTO HERO INDISCUTÍVEL (iBanko Inspired) ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-7">
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 flex flex-col shadow-sm relative overflow-hidden">
            {/* Top accent decorative bar */}
            <div className="absolute top-0 left-0 right-0 h-1 opacity-90" style={{ background: 'linear-gradient(to right, #6366F1, #7C3AED, #818CF8)' }} />

            {/* Status bar discreto e profissional */}
            <div className="flex items-center justify-between pb-5 border-b border-border/80">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${calculation.statusTag.tone === 'healthy'
                    ? 'bg-brand-subtle text-brand border border-brand/20'
                    : calculation.statusTag.tone === 'tight'
                      ? 'bg-accent-amber-bg text-accent-amber border border-accent-amber/30'
                      : 'border border-border'
                  }`}
                style={
                  calculation.statusTag.tone === 'loss'
                    ? { backgroundColor: 'var(--color-semantic-danger-bg)', color: 'var(--color-semantic-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }
                    : calculation.statusTag.tone !== 'healthy' && calculation.statusTag.tone !== 'tight'
                      ? { backgroundColor: 'var(--color-semantic-success-bg)', color: 'var(--color-semantic-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }
                      : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      calculation.statusTag.tone === 'healthy'
                        ? 'var(--color-brand)'
                        : calculation.statusTag.tone === 'tight'
                          ? 'var(--color-accent-amber)'
                          : calculation.statusTag.tone === 'loss'
                            ? 'var(--color-semantic-danger)'
                            : 'var(--color-semantic-success)',
                  }}
                />
                <span>{calculation.statusTag.label}</span>
              </div>

              <span className="font-mono text-[11px] text-txt-muted uppercase tracking-wider font-medium">
                {state.mode === 'advanced' ? 'Cálculo Avançado' : 'Cálculo Básico'}
              </span>
            </div>

            {/* ── BLOCO HERO PRINCIPAL: PREÇO RECOMENDADO ── */}
            <div className="py-6 flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-wider text-txt-muted font-semibold">
                {state.batchUnits > 1 ? 'PREÇO UNITÁRIO RECOMENDADO' : 'PREÇO RECOMENDADO'}
              </span>

              {/* VALOR HERO ENORME E EXPRESSIVO */}
              <div className="font-display text-[44px] sm:text-[52px] font-bold text-txt tracking-tight leading-none mt-2 mb-2 tabular-nums">
                {formatBRL(calculation.recommendedPrice)}
              </div>

              {/* Subtítulo informativo */}
              <p className="text-[13px] text-txt-muted flex items-center gap-2">
                <span>Margem líquida de <strong className="text-txt font-semibold">{formatPercent(calculation.realMarginPct)}</strong></span>
                <span>·</span>
                <span>Lucro de <strong className="text-brand font-semibold">{formatBRL(calculation.profit)}</strong></span>
              </p>

              {/* Destaque adicional se produção for em lote */}
              {state.batchUnits > 1 && (
                <div className="mt-4 p-4 bg-canvas border border-border rounded-xl flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-txt-muted font-semibold mb-1">
                    Total do Lote ({state.batchUnits} unidades)
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

            {/* ── INDICADORES: LUCRO ESTIMADO, CUSTO TOTAL E MARGEM ── */}
            {/* Faixa compacta integrada de métricas (Fintech capsule) */}
            <div className="py-3.5 px-4 rounded-xl bg-canvas border border-border/80 grid grid-cols-3 divide-x divide-border mb-6">
              <div className="pr-2 flex flex-col">
                <span className="text-[11px] font-medium text-txt-muted">Custo total</span>
                <span className="font-mono text-[14px] font-bold text-txt mt-0.5 tabular-nums">
                  {formatBRL(calculation.totalUnitCost)}
                </span>
              </div>
              <div className="px-3 flex flex-col">
                <span className="text-[11px] font-medium text-brand">Seu lucro</span>
                <span className="font-mono text-[14px] font-bold text-brand mt-0.5 tabular-nums">
                  {formatBRL(calculation.profit)}
                </span>
              </div>
              <div className="pl-3 flex flex-col">
                <span className="text-[11px] font-medium text-txt-muted">Margem</span>
                <span className="font-mono text-[14px] font-bold text-txt mt-0.5 tabular-nums">
                  {formatPercent(calculation.realMarginPct)}
                </span>
              </div>
            </div>

            {/* ── GRÁFICO: BARRA VISUAL DE COMPOSIÇÃO DE CUSTOS (Visível no Básico E no Avançado) ── */}
            {calculation.recommendedPrice > 0 && (
              <div className="mb-6 pb-6 border-b border-border/80">
                <div className="flex items-center justify-between text-[11px] text-txt-muted mb-2 font-mono uppercase tracking-wider font-semibold">
                  <span>Composição do Preço</span>
                  <span>100%</span>
                </div>
                {/* Horizontal Segmented Bar */}
                <div className="w-full h-2.5 rounded-full bg-border overflow-hidden flex">
                  {matBarPct > 0 && (
                    <div
                      style={{ width: `${matBarPct}%`, backgroundColor: 'var(--color-chart-1)' }}
                      className="h-full"
                      title={`Material: ${formatBRL(calculation.materialCost)}`}
                    />
                  )}
                  {operBarPct > 0 && (
                    <div
                      style={{ width: `${operBarPct}%`, backgroundColor: 'var(--color-chart-2)' }}
                      className="h-full"
                      title={`Máquina: ${formatBRL(calculation.operationalCost)}`}
                    />
                  )}
                  {laborBarPct > 0 && (
                    <div
                      style={{ width: `${laborBarPct}%`, backgroundColor: 'var(--color-chart-3)' }}
                      className="h-full"
                      title={`Mão de obra: ${formatBRL(calculation.laborCost)}`}
                    />
                  )}
                  {extrasBarPct > 0 && (
                    <div
                      style={{ width: `${extrasBarPct}%`, backgroundColor: 'var(--color-chart-4)' }}
                      className="h-full"
                      title={`Insumos: ${formatBRL(calculation.extrasCost)}`}
                    />
                  )}
                  {taxesBarPct > 0 && (
                    <div
                      style={{ width: `${taxesBarPct}%`, backgroundColor: 'var(--color-chart-5)' }}
                      className="h-full"
                      title={`Taxas: ${formatBRL(calculation.channelFeeAmount + calculation.taxAmount)}`}
                    />
                  )}
                  {profitBarPct > 0 && (
                    <div
                      style={{ width: `${profitBarPct}%`, backgroundColor: 'var(--color-chart-profit)' }}
                      className="h-full"
                      title={`Lucro: ${formatBRL(calculation.profit)}`}
                    />
                  )}
                </div>

                {/* Compact Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-2 mt-3.5 text-[11px] text-txt-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-1)' }} />
                    <span className="truncate">Material ({formatBRL(calculation.materialCost)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-2)' }} />
                    <span className="truncate">Máquina ({formatBRL(calculation.operationalCost)})</span>
                  </div>
                  {calculation.laborCost > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-3)' }} />
                      <span className="truncate">Trabalho ({formatBRL(calculation.laborCost)})</span>
                    </div>
                  )}
                  {calculation.extrasCost > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-4)' }} />
                      <span className="truncate">Insumos ({formatBRL(calculation.extrasCost)})</span>
                    </div>
                  )}
                  {(calculation.channelFeeAmount + calculation.taxAmount) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-5)' }} />
                      <span className="truncate">Taxas ({formatBRL(calculation.channelFeeAmount + calculation.taxAmount)})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-chart-profit)' }} />
                    <span className="text-txt font-semibold truncate">Lucro ({formatBRL(calculation.profit)})</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── AÇÕES PRIMÁRIAS E SECUNDÁRIAS ── */}
            <div className="flex flex-col gap-2.5">
              {/* Alerta de validação de nome obrigatório */}
              {nameError && (
                <div className="p-2.5 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/30 flex items-center gap-2 text-[12px] text-[#E11D48] dark:text-[#FB7185] animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D48] dark:text-[#FB7185]" />
                  <span className="font-medium leading-tight">O nome da peça é obrigatório para salvar.</span>
                </div>
              )}

              {/* Botão principal de salvar / editar */}
              <button
                type="button"
                onClick={handleSaveClick}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] text-white ${
                  saveSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : isExistingProduct
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 ring-2 ring-amber-500/20'
                      : 'bg-brand hover:bg-brand-hover shadow-brand/20'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>{typeof saveSuccess === 'string' ? saveSuccess : 'Precificação salva com sucesso!'}</span>
                  </>
                ) : isExistingProduct ? (
                  <>
                    <Pencil className="w-4 h-4 text-white" />
                    <span>Editar item</span>
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

              {/* Ações secundárias */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onNewPiece}
                  className="py-2.5 px-3 rounded-xl bg-surface hover:bg-canvas text-txt text-[12px] font-semibold border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-border-subtle"
                >
                  <Plus className="w-3.5 h-3.5 text-txt-muted" />
                  <span>Nova peça</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenShare}
                  className="py-2.5 px-3 rounded-xl bg-surface hover:bg-canvas text-txt text-[12px] font-semibold border border-border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-border-subtle"
                >
                  <Share2 className="w-3.5 h-3.5 text-txt-muted" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODAL DE CONFIRMAÇÃO: ITEM JÁ EXISTENTE NO CATÁLOGO ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-brand to-emerald-500" />

            {/* Header com ícone e botão fechar */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-txt-muted hover:text-txt p-1.5 rounded-lg hover:bg-surface-raised transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Título & Descrição clara e concisa */}
            <h3 className="font-display text-[18px] font-bold text-txt tracking-tight">
              Item com o mesmo nome já cadastrado
            </h3>
            <p className="text-[13px] text-txt-muted mt-2 leading-relaxed">
              O catálogo já possui um produto chamado{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-semibold">"{trimmedName || 'Peça Sem Título'}"</strong>.
              Para evitar duplicidade de dados, você pode salvar as alterações no próprio item existente ou cancelar para alterar o nome da peça.
            </p>

            {/* Botões de Ação com Cores Fortes e Chamativas */}
            <div className="flex flex-col gap-2.5 mt-6">
              {/* Opção 1: Atualizar o existente (Ambar / Laranja Forte) */}
              <button
                type="button"
                onClick={handleConfirmOverwrite}
                className="w-full p-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] flex items-center justify-between transition-all cursor-pointer shadow-md shadow-amber-600/20 active:scale-[0.99] group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[13px] leading-tight">Salvar edição neste item</div>
                    <div className="text-[11px] text-amber-100 font-normal leading-tight mt-0.5">
                      Atualiza os custos e preços do produto já existente no catálogo
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Opção 2: Cancelar para alterar o nome (Botão secundário de apoio) */}
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-surface hover:bg-surface-raised border border-border text-txt font-semibold text-[13px] transition-colors cursor-pointer text-center"
              >
                Voltar e alterar nome da peça
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
