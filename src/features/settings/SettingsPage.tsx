import React, { useState, useRef } from 'react';
import {
  Sliders,
  Check,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Zap,
  Percent,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ChannelId, GlobalSettings } from '../../types/pricing';
import {
  generateBackupJSON,
  parseAndValidateBackup,
  restoreBackup,
  DEFAULT_SETTINGS,
} from '../../services/storage';
import { formatBRL } from '../../utils/pricingEngine';

interface SettingsPageProps {
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: GlobalSettings) => void;
  onReloadAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
}) => {
  const [formData, setFormData] = useState<GlobalSettings>(settings);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChannelFeeChange = (channel: ChannelId, value: number) => {
    setFormData((prev) => ({
      ...prev,
      channelFees: {
        ...prev.channelFees,
        [channel]: value,
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = generateBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3D_Price_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = parseAndValidateBackup(content);
      if (!validation.success || !validation.data) {
        setImportError(validation.error || 'Arquivo de backup inválido.');
        return;
      }

      if (
        window.confirm(
          `Deseja restaurar o backup exportado em ${new Date(
            validation.data.exportedAt
          ).toLocaleString('pt-BR')}? Seus dados atuais serão substituídos pelos do backup.`
        )
      ) {
        restoreBackup(validation.data);
        onReloadAllData();
        setFormData(validation.data.settings);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      }
    };
    reader.onerror = () => {
      setImportError('Erro ao ler arquivo.');
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
    setFormData(DEFAULT_SETTINGS);
    setShowResetConfirm(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-tight text-txt">
            Configurações Globais
          </h1>
          <p className="text-[13px] sm:text-[14px] text-txt-muted mt-1">
            Defina parâmetros padrões de energia, máquina e taxas de canais de venda.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          {saveFeedback ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Salvo com sucesso!</span>
            </>
          ) : (
            <>
              <span>Salvar configurações</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
        {/* Bloco 1: Energia e Máquina */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/70">
            <Zap className="w-4 h-4 text-brand" />
            <h2 className="text-[15px] font-semibold text-txt">
              Energia & Custos Operacionais
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                Potência média da impressora (Watts)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="30"
                  max="1500"
                  value={formData.printerPowerWatts}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      printerPowerWatts: parseFloat(e.target.value) || 200,
                    }))
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-8 rounded-md border border-border font-mono text-[13px] outline-none"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  W
                </span>
              </div>
              <span className="text-[11px] text-txt-muted mt-1 block">
                Ex.: Ender 3 / Bambu A1 consomem cerca de 100W a 200W em regime contínuo.
              </span>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                Tarifa de energia elétrica (R$ / kWh)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[12px] text-txt-muted font-mono">
                  R$
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5.0"
                  value={formData.energyCostKwh}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      energyCostKwh: parseFloat(e.target.value) || 0.95,
                    }))
                  }
                  className="w-full bg-canvas text-txt pl-9 pr-3 py-1.5 rounded-md border border-border font-mono text-[13px] outline-none"
                />
              </div>
              <span className="text-[11px] text-txt-muted mt-1 block">
                Consulte o valor do kWh na sua conta de luz (média Brasil: R$ 0,85 a R$ 1,15).
              </span>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                Desgaste / Manutenção (R$ por hora)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[12px] text-txt-muted font-mono">
                  R$
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.wearCostPerHour}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wearCostPerHour: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-canvas text-txt pl-9 pr-3 py-1.5 rounded-md border border-border font-mono text-[13px] outline-none"
                />
              </div>
              <span className="text-[11px] text-txt-muted mt-1 block">
                Cobre bicos, correias, lubrificação e peças de reposição.
              </span>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                Depreciação da máquina (R$ por hora)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[12px] text-txt-muted font-mono">
                  R$
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={formData.depreciationPerHour}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      depreciationPerHour: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-canvas text-txt pl-9 pr-3 py-1.5 rounded-md border border-border font-mono text-[13px] outline-none"
                />
              </div>
              <span className="text-[11px] text-txt-muted mt-1 block">
                Reserva financeira para comprar uma impressora nova no futuro.
              </span>
            </div>
          </div>
        </section>

        {/* Bloco 2: Mão de obra */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/70">
            <Clock className="w-4 h-4 text-brand" />
            <h2 className="text-[15px] font-semibold text-txt">
              Mão de Obra Padrão
            </h2>
          </div>

          <div>
            <label className="block text-[12px] text-txt-muted mb-1 font-medium">
              Valor padrão da sua hora técnica de trabalho
            </label>
            <div className="relative flex items-center max-w-xs">
              <span className="absolute left-3 text-[12px] text-txt-muted font-mono">
                R$
              </span>
              <input
                type="number"
                step="5"
                min="0"
                value={formData.laborHourlyRate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    laborHourlyRate: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full bg-canvas text-txt pl-9 pr-8 py-1.5 rounded-md border border-border font-mono text-[13px] outline-none"
              />
              <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                /h
              </span>
            </div>
            <span className="text-[11px] text-txt-muted mt-1 block">
              Utilizado no Modo Avançado para calcular preparação, fatiamento, pós-processamento e montagem.
            </span>
          </div>
        </section>

        {/* Bloco 3: Taxas de Canais de Venda */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/70">
            <Percent className="w-4 h-4 text-brand" />
            <h2 className="text-[15px] font-semibold text-txt">
              Taxas Padrões dos Canais de Venda
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] text-txt-muted mb-1">
                Shopee
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.channelFees.shopee}
                  onChange={(e) =>
                    handleChannelFeeChange('shopee', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-7 rounded-md border border-border font-mono text-[13px] outline-none text-right"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1">
                Mercado Livre
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.channelFees.mercadolivre}
                  onChange={(e) =>
                    handleChannelFeeChange('mercadolivre', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-7 rounded-md border border-border font-mono text-[13px] outline-none text-right"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1">
                Venda Direta
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.channelFees.direta}
                  onChange={(e) =>
                    handleChannelFeeChange('direta', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-7 rounded-md border border-border font-mono text-[13px] outline-none text-right"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1">
                Amazon
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.channelFees.amazon}
                  onChange={(e) =>
                    handleChannelFeeChange('amazon', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-7 rounded-md border border-border font-mono text-[13px] outline-none text-right"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-txt-muted mb-1">
                Outro Canal
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.channelFees.outro}
                  onChange={(e) =>
                    handleChannelFeeChange('outro', parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-canvas text-txt px-3 py-1.5 pr-7 rounded-md border border-border font-mono text-[13px] outline-none text-right"
                />
                <span className="absolute right-2.5 text-[12px] text-txt-muted font-mono">
                  %
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-txt-muted mt-3">
            Essas taxas são pré-carregadas ao selecionar cada botão na Calculadora, mas você sempre pode ajustá-las manualmente por produto.
          </p>
        </section>

        {/* Bloco 4: Backup e Restauração JSON */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-border/70">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h2 className="text-[15px] font-semibold text-txt">
              Backup e Restauração de Dados
            </h2>
          </div>
          <p className="text-[12.5px] text-txt-muted mb-4">
            Seus dados são salvos localmente neste navegador. Para nunca perder suas precificações ao limpar cache, faça backups periódicos em arquivo JSON.
          </p>

          {importError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px]">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Backup restaurado com sucesso! Seus produtos e configurações foram atualizados.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-canvas hover:bg-[#ECEEE9] text-txt border border-border text-[12.5px] font-medium transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-txt-muted" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-canvas hover:bg-[#ECEEE9] text-txt border border-border text-[12.5px] font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-txt-muted" />
              <span>Importar Backup (JSON)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </section>

        {/* Bloco 5: Redefinir para Padrões */}
        <section className="p-5 rounded-xl bg-canvas border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[13.5px] font-semibold text-txt">
              Redefinir Configurações
            </h3>
            <p className="text-[12px] text-txt-muted">
              Restaura potência, kWh, taxas e mão de obra para os valores recomendados de fábrica.
            </p>
          </div>

          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-red-600 font-medium">Tem certeza?</span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[12px] font-medium"
              >
                Sim, redefinir
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-surface border border-border rounded text-[12px]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-[12px] text-txt-muted hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrões de fábrica</span>
            </button>
          )}
        </section>
      </form>
    </div>
  );
};
