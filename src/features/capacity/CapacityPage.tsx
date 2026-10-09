import React, { useState } from 'react';
import {
  Gauge,
  Clock,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
  Info,
  HelpCircle,
  Sliders,
  Plus,
} from 'lucide-react';
import { SavedProduct, WorkshopCapacitySettings } from '../../types/pricing';
import { formatBRL, formatPercent } from '../../utils/pricingEngine';

interface CapacityPageProps {
  products: SavedProduct[];
  settings: WorkshopCapacitySettings;
  onUpdateSettings: (newSettings: WorkshopCapacitySettings) => void;
  onNavigateToCalculator: () => void;
}

export const CapacityPage: React.FC<CapacityPageProps> = ({
  products,
  settings,
  onUpdateSettings,
  onNavigateToCalculator,
}) => {
  // Selected product from catalog (default to first if available)
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return products.length > 0 ? products[0].id : '';
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSettingChange = <K extends keyof WorkshopCapacitySettings>(
    key: K,
    val: number
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: val,
    });
  };

  // Workshop capacity calculations
  const printerCount = Math.max(1, settings.printerCount || 1);
  const hoursPerDay = Math.max(1, Math.min(24, settings.operationalHoursPerDay || 16));
  const daysPerMonth = Math.max(1, Math.min(31, settings.operationalDaysPerMonth || 26));
  const totalAvailableMonthlyHours = printerCount * hoursPerDay * daysPerMonth;

  // Selected piece calculations
  const piecePrintMinutes = selectedProduct
    ? (selectedProduct.state.printHours || 0) * 60 + (selectedProduct.state.printMinutes || 0)
    : 0;
  const piecePrintHours = piecePrintMinutes / 60;
  const pieceUnitProfit = selectedProduct ? selectedProduct.calculation.profit : 0;
  const pieceUnitPrice = selectedProduct ? selectedProduct.calculation.recommendedPrice : 0;

  // Theoretical maximum units the workshop could physically print of this piece
  const maxMonthlyCapacityUnits = piecePrintHours > 0
    ? Math.floor(totalAvailableMonthlyHours / piecePrintHours)
    : 0;

  // Monthly Target & Break-even calculations
  const targetProfit = Math.max(0, settings.monthlyTargetProfit || 2000);
  const fixedCosts = Math.max(0, settings.monthlyFixedCosts || 0);
  const totalMonthlyNeed = targetProfit + fixedCosts;

  // Units required to cover target + fixed costs
  const unitsNeeded = pieceUnitProfit > 0
    ? Math.ceil(totalMonthlyNeed / pieceUnitProfit)
    : 0;

  // Machine hours consumed by the required units
  const hoursConsumed = unitsNeeded * piecePrintHours;

  // Capacity Occupation Ratio (%)
  const occupationRatio = totalAvailableMonthlyHours > 0
    ? (hoursConsumed / totalAvailableMonthlyHours) * 100
    : 0;

  // Estimated gross revenue
  const estimatedRevenue = unitsNeeded * pieceUnitPrice;

  // Status Tone & Message
  let statusTone: 'feasible' | 'tight' | 'bottleneck' = 'feasible';
  let statusLabel = 'Meta Totalmente Factível';
  let statusDesc = 'Sua oficina tem capacidade confortável com ampla margem de folga para manutenções.';

  if (occupationRatio > 100) {
    statusTone = 'bottleneck';
    const minPrintersNeeded = piecePrintHours > 0
      ? Math.ceil(hoursConsumed / (hoursPerDay * daysPerMonth))
      : 2;
    statusLabel = 'Capacidade Excedida (Gargalo)';
    statusDesc = `Essa meta exige ${occupationRatio.toFixed(0)}% do tempo da sua máquina. Você precisará de pelo menos ${minPrintersNeeded} impressoras para entregar esse volume.`;
  } else if (occupationRatio > 75) {
    statusTone = 'tight';
    statusLabel = 'Carga Alta (Próximo do Limite)';
    statusDesc = 'Quase toda a capacidade da máquina será consumida. Pequenos atrasos ou falhas podem comprometer prazos.';
  }

  return (
    <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
      {/* ── Page Header: Fintech Dashboard Style ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-7 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-[24px] sm:text-[28px] font-bold tracking-tight text-txt">
              Capacidade da Oficina & Ponto de Equilíbrio
            </h1>
          </div>
          <p className="text-[13px] sm:text-[14px] text-txt-muted mt-1 font-normal">
            Simule quantas peças você precisa produzir e descubra o tempo de máquina exigido para bater sua meta mensal.
          </p>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-brand-subtle text-brand flex items-center justify-center mx-auto mb-4">
            <Gauge className="w-7 h-7" />
          </div>
          <h3 className="font-display text-[19px] font-bold text-txt">
            Nenhuma peça cadastrada ainda
          </h3>
          <p className="text-[13px] text-txt-muted mt-2 max-w-sm mx-auto leading-relaxed">
            Calcule e salve pelo menos um produto na Calculadora para simular o ponto de equilíbrio e a capacidade da sua oficina.
          </p>
          <button
            type="button"
            onClick={onNavigateToCalculator}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-[13px] font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira precificação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
          {/* ── COLUNA ESQUERDA: PARÂMETROS DA OFICINA & SELEÇÃO DE PEÇA ── */}
          <main className="lg:col-span-7 flex flex-col gap-6">
            {/* ── 01: Peça de Referência ── */}
            <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
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
                      Peça de referência do catálogo
                    </h2>
                  </div>
                  <p className="text-[12px] text-txt-muted">
                    Selecione qual item você deseja avaliar como modelo de produção.
                  </p>
                </div>
              </div>

              {/* Seletor do produto */}
              <div>
                <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                  Produto para simulação
                </label>
                <div className="relative">
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-surface-raised text-txt px-3.5 py-2.5 pr-9 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-medium outline-none cursor-pointer appearance-none transition-all"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.state.name} ({formatBRL(p.calculation.recommendedPrice)} • Lucro: {formatBRL(p.calculation.profit)})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Mini Resumo da Peça Ativa */}
              {selectedProduct && (
                <div className="mt-4 p-4 rounded-xl bg-canvas border border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wider block">
                      Preço Venda
                    </span>
                    <span className="font-mono text-[15px] font-bold text-txt mt-0.5 block">
                      {formatBRL(pieceUnitPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wider block">
                      Lucro Unitário
                    </span>
                    <span className="font-mono text-[15px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {formatBRL(pieceUnitProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wider block">
                      Tempo Impressão
                    </span>
                    <span className="font-mono text-[14px] font-semibold text-txt mt-0.5 block">
                      {selectedProduct.state.printHours}h {selectedProduct.state.printMinutes}min
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wider block">
                      Peso da Peça
                    </span>
                    <span className="font-mono text-[14px] font-semibold text-txt mt-0.5 block">
                      {selectedProduct.state.weightGrams}g
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* ── 02: Infraestrutura da Oficina ── */}
            <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                      02
                    </span>
                    <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                      Estrutura da oficina e disponibilidade
                    </h2>
                  </div>
                  <p className="text-[12px] text-txt-muted">
                    Defina quantas máquinas trabalham e a rotina média de operação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Quantidade de Impressoras */}
                <div>
                  <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                    Impressoras ativas
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.printerCount}
                      onChange={(e) =>
                        handleSettingChange('printerCount', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none text-right pr-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted pointer-events-none">
                      un
                    </span>
                  </div>
                </div>

                {/* Horas de Operação por Dia */}
                <div>
                  <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                    Horas de máquina/dia
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={settings.operationalHoursPerDay}
                      onChange={(e) =>
                        handleSettingChange('operationalHoursPerDay', Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none text-right pr-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted pointer-events-none">
                      h/d
                    </span>
                  </div>
                </div>

                {/* Dias de Operação por Mês */}
                <div>
                  <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                    Dias de produção/mês
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={settings.operationalDaysPerMonth}
                      onChange={(e) =>
                        handleSettingChange('operationalDaysPerMonth', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="w-full bg-surface-raised text-txt px-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[13px] font-mono outline-none text-right pr-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-txt-muted pointer-events-none">
                      dias
                    </span>
                  </div>
                </div>
              </div>

              {/* Informação calculada de horas totais */}
              <div className="mt-3.5 flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl text-[12px] text-txt-muted">
                <span>Capacidade total disponível no mês:</span>
                <span className="font-mono font-bold text-txt">
                  {totalAvailableMonthlyHours.toLocaleString('pt-BR')} horas
                </span>
              </div>
            </section>

            {/* ── 03: Meta de Faturamento & Custos Fixos ── */}
            <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs hover:border-border-subtle transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-subtle flex items-center justify-center text-brand shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-brand tracking-wider">
                      03
                    </span>
                    <h2 className="text-[16px] font-semibold text-txt tracking-tight">
                      Meta de lucro líquido e custos fixos
                    </h2>
                  </div>
                  <p className="text-[12px] text-txt-muted">
                    Quanto você deseja retirar de lucro livre para si no final do mês.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Meta de Lucro Líquido Desejada */}
                <div>
                  <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                    Meta de lucro líquido mensal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-txt-muted pointer-events-none">
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={settings.monthlyTargetProfit}
                      onChange={(e) =>
                        handleSettingChange('monthlyTargetProfit', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full bg-surface-raised text-txt pl-10 pr-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[14px] font-mono font-bold outline-none text-right transition-all"
                    />
                  </div>
                </div>

                {/* Custos Fixos Gerais (Opcional) */}
                <div>
                  <label className="block text-[12px] font-medium text-txt-muted mb-1.5">
                    Custos fixos da oficina (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-mono text-txt-muted pointer-events-none">
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={settings.monthlyFixedCosts}
                      onChange={(e) =>
                        handleSettingChange('monthlyFixedCosts', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      placeholder="0,00"
                      className="w-full bg-surface-raised text-txt pl-10 pr-3.5 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-2 focus:ring-brand/15 text-[14px] font-mono font-bold outline-none text-right transition-all"
                    />
                  </div>
                  <span className="block text-[11px] text-txt-muted mt-1">
                    Internet, assinaturas de STL, aluguel da bancada, etc.
                  </span>
                </div>
              </div>
            </section>
          </main>

          {/* ── COLUNA DIREITA: RESULTADO HERO & DIAGNÓSTICO (iBanko Inspired) ── */}
          <aside className="lg:col-span-5 lg:sticky lg:top-7">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 flex flex-col shadow-sm relative overflow-hidden">
              {/* Top accent decorative bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{
                  background:
                    statusTone === 'bottleneck'
                      ? 'linear-gradient(to right, #EF4444, #F97316)'
                      : statusTone === 'tight'
                        ? 'linear-gradient(to right, #F59E0B, #EAB308)'
                        : 'linear-gradient(to right, #10B981, #6366F1)',
                }}
              />

              {/* Status Tag */}
              <div className="flex items-center justify-between pb-5 border-b border-border/80">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${
                    statusTone === 'bottleneck'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      : statusTone === 'tight'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      statusTone === 'bottleneck'
                        ? 'bg-red-500'
                        : statusTone === 'tight'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                  <span>{statusLabel}</span>
                </div>

                <span className="text-[11px] font-mono text-txt-muted uppercase tracking-wider">
                  DIAGNÓSTICO
                </span>
              </div>

              {/* Volume Necessário Hero */}
              <div className="py-6 border-b border-border/80">
                <span className="text-[11px] font-mono text-txt-muted uppercase tracking-wider block">
                  VOLUME NECESSÁRIO NO MÊS
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-[44px] sm:text-[48px] font-extrabold text-txt tracking-tight leading-none">
                    {unitsNeeded}
                  </span>
                  <span className="text-[18px] text-txt-muted font-medium">peças / mês</span>
                </div>
                <div className="mt-2 text-[12.5px] text-txt-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-txt-muted" />
                  <span>
                    Ritmo de entrega: <strong>{(unitsNeeded / daysPerMonth).toFixed(1)} peças por dia trabalhado</strong>
                  </span>
                </div>
              </div>

              {/* Barra de Ocupação da Máquina */}
              <div className="py-5 border-b border-border/80">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-2 font-semibold">
                  <span>Ocupação da Oficina</span>
                  <span
                    className={
                      statusTone === 'bottleneck'
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : statusTone === 'tight'
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-emerald-600 dark:text-emerald-400 font-bold'
                    }
                  >
                    {occupationRatio.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-border overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.min(100, occupationRatio)}%`,
                      backgroundColor:
                        statusTone === 'bottleneck'
                          ? '#EF4444'
                          : statusTone === 'tight'
                            ? '#F59E0B'
                            : '#10B981',
                    }}
                    className="h-full transition-all duration-300"
                  />
                </div>

                <div className="flex justify-between items-center mt-2.5 text-[11px] text-txt-muted">
                  <span>Consome {hoursConsumed.toFixed(0)}h de máquina</span>
                  <span>Disponível: {totalAvailableMonthlyHours}h</span>
                </div>
              </div>

              {/* Grid com Métricas Complementares */}
              <div className="py-4 grid grid-cols-2 gap-3 border-b border-border/80">
                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-[10.5px] text-txt-muted font-mono uppercase tracking-wider block">
                    Faturamento Bruto
                  </span>
                  <span className="font-mono text-[16px] font-bold text-txt mt-0.5 block">
                    {formatBRL(estimatedRevenue)}
                  </span>
                  <span className="text-[10px] text-txt-muted mt-0.5 block">
                    Volume × Preço sugerido
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-canvas border border-border">
                  <span className="text-[10.5px] text-txt-muted font-mono uppercase tracking-wider block">
                    Capacidade Teto
                  </span>
                  <span className="font-mono text-[16px] font-bold text-txt mt-0.5 block">
                    {maxMonthlyCapacityUnits} peças
                  </span>
                  <span className="text-[10px] text-txt-muted mt-0.5 block">
                    Limite físico das máquinas
                  </span>
                </div>
              </div>

              {/* Explicação e Insight */}
              <div className="mt-5 p-3.5 rounded-xl bg-surface-raised border border-border text-[12px] text-txt-muted flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {statusDesc}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
