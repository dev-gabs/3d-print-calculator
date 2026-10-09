import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Share2,
  Calendar,
  Layers,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { Material, SavedProduct } from '../../types/pricing';
import { formatBRL, formatPercent } from '../../utils/pricingEngine';

interface ProductsPageProps {
  products: SavedProduct[];
  materials: Material[];
  onLoadIntoCalculator: (product: SavedProduct) => void;
  onDuplicate: (product: SavedProduct) => void;
  onDelete: (id: string) => void;
  onNewPiece: () => void;
  onShareProduct: (product: SavedProduct) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  materials,
  onLoadIntoCalculator,
  onDuplicate,
  onDelete,
  onNewPiece,
  onShareProduct,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'profit' | 'name'>('date');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) =>
    p.state.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price') {
      return b.calculation.recommendedPrice - a.calculation.recommendedPrice;
    }
    if (sortBy === 'profit') {
      return b.calculation.profit - a.calculation.profit;
    }
    if (sortBy === 'name') {
      return a.state.name.localeCompare(b.state.name);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Summary Metrics
  const totalProducts = products.length;
  const avgPrice =
    totalProducts > 0
      ? products.reduce((acc, p) => acc + p.calculation.recommendedPrice, 0) / totalProducts
      : 0;
  const totalPotentialProfit = products.reduce((acc, p) => acc + p.calculation.profit, 0);
  const avgMargin =
    totalProducts > 0
      ? products.reduce((acc, p) => acc + p.calculation.realMarginPct, 0) / totalProducts
      : 0;

  const getMaterialName = (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    return mat ? mat.name : 'Material Padrão';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E3E6E2]">
        <div>
          <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-tight text-[#171A18]">
            Catálogo de Peças & Precificações
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#707570] mt-1">
            Consulte seu histórico, edite valores e compare lucratividades.
          </p>
        </div>

        <button
          onClick={onNewPiece}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#2F6B4A] hover:bg-[#26573C] text-white text-[13px] font-medium transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova precificação</span>
        </button>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-[#E3E6E2] p-12 text-center max-w-lg mx-auto my-12 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#EAF3ED] text-[#2F6B4A] flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#171A18] mb-1">
            Nenhuma peça salva ainda
          </h3>
          <p className="text-[13px] text-[#707570] mb-6">
            Quando você precificar e salvar um item na calculadora, ele aparecerá aqui com todos os custos arquivados.
          </p>
          <button
            onClick={onNewPiece}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#2F6B4A] hover:bg-[#26573C] text-white text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Calcular primeira peça</span>
          </button>
        </div>
      ) : (
        <>
          {/* Métricas Resumidas em Faixa Única (Sem empilhamento excessivo de cards) */}
          <div className="mb-6 p-4 rounded-xl bg-white border border-[#E3E6E2] grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E3E6E2] shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#707570] font-mono uppercase tracking-wider">
                Peças Salvas
              </span>
              <span className="font-display text-[22px] font-bold text-[#171A18] mt-1">
                {totalProducts}
              </span>
            </div>
            <div className="flex flex-col pt-3 md:pt-0 md:pl-4">
              <span className="text-[11px] text-[#707570] font-mono uppercase tracking-wider">
                Preço Médio
              </span>
              <span className="font-mono text-[20px] font-semibold text-[#171A18] mt-1 tabular-nums">
                {formatBRL(avgPrice)}
              </span>
            </div>
            <div className="flex flex-col pt-3 md:pt-0 md:pl-4">
              <span className="text-[11px] text-[#707570] font-mono uppercase tracking-wider">
                Lucro Total Acumulado
              </span>
              <span className="font-mono text-[20px] font-semibold text-[#2F6B4A] mt-1 tabular-nums">
                {formatBRL(totalPotentialProfit)}
              </span>
            </div>
            <div className="flex flex-col pt-3 md:pt-0 md:pl-4">
              <span className="text-[11px] text-[#707570] font-mono uppercase tracking-wider">
                Margem Média
              </span>
              <span className="font-mono text-[20px] font-semibold text-[#171A18] mt-1 tabular-nums">
                {formatPercent(avgMargin)}
              </span>
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#707570] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome da peça..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-[#171A18] pl-9 pr-3 py-1.5 rounded-md border border-[#E3E6E2] focus:border-[#2F6B4A] text-[13px] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-[12px]">
              <span className="text-[#707570] flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#E3E6E2] rounded px-2.5 py-1.5 text-[12px] text-[#171A18] outline-none cursor-pointer"
              >
                <option value="date">Data (mais recentes)</option>
                <option value="price">Maior Preço</option>
                <option value="profit">Maior Lucro</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Lista de Produtos em Tabela Limpa e Responsiva */}
          <div className="bg-white rounded-xl border border-[#E3E6E2] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F6F3] border-b border-[#E3E6E2] text-[11px] font-mono uppercase tracking-wider text-[#707570]">
                    <th className="py-3 px-4 font-semibold">Peça / Produto</th>
                    <th className="py-3 px-4 font-semibold">Material & Peso</th>
                    <th className="py-3 px-4 font-semibold">Tempo</th>
                    <th className="py-3 px-4 font-semibold text-right">Custo</th>
                    <th className="py-3 px-4 font-semibold text-right">Preço Sugerido</th>
                    <th className="py-3 px-4 font-semibold text-right">Lucro</th>
                    <th className="py-3 px-4 font-semibold text-center">Margem</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6E2] text-[13px]">
                  {sortedProducts.map((p) => {
                    const isDeleting = deleteConfirmId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-[#F6F6F3]/60 transition-colors group"
                      >
                        {/* Nome */}
                        <td className="py-3 px-4 font-medium text-[#171A18]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[13.5px]">
                              {p.state.name || 'Sem título'}
                            </span>
                            <span className="text-[11px] text-[#707570] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(p.updatedAt)}
                              {p.state.mode === 'advanced' && (
                                <span className="ml-1 px-1 py-0.2 rounded bg-[#EAF3ED] text-[#2F6B4A] text-[9.5px] font-mono">
                                  Avançado
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Material & Peso */}
                        <td className="py-3 px-4 text-[#707570]">
                          <div className="flex flex-col">
                            <span className="text-[#171A18]">
                              {getMaterialName(p.state.primaryMaterialId)}
                            </span>
                            <span className="text-[11px] font-mono">
                              {p.state.weightGrams}g
                            </span>
                          </div>
                        </td>

                        {/* Tempo */}
                        <td className="py-3 px-4 text-[#707570] font-mono text-[12px]">
                          {p.state.printHours}h {p.state.printMinutes}min
                        </td>

                        {/* Custo */}
                        <td className="py-3 px-4 text-right font-mono text-[12.5px] text-[#707570] tabular-nums">
                          {formatBRL(p.calculation.totalUnitCost)}
                        </td>

                        {/* Preço Recomendado */}
                        <td className="py-3 px-4 text-right font-mono text-[13.5px] font-bold text-[#171A18] tabular-nums">
                          {formatBRL(p.calculation.recommendedPrice)}
                        </td>

                        {/* Lucro */}
                        <td className="py-3 px-4 text-right font-mono text-[12.5px] font-semibold text-[#2F6B4A] tabular-nums">
                          {formatBRL(p.calculation.profit)}
                        </td>

                        {/* Margem */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-[11.5px] px-2 py-0.5 rounded-full bg-[#F6F6F3] border border-[#E3E6E2] text-[#171A18]">
                            {formatPercent(p.calculation.realMarginPct)}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          {isDeleting ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[11px] text-red-600 font-medium mr-1">
                                Excluir?
                              </span>
                              <button
                                onClick={() => onDelete(p.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-[#E3E6E2] hover:bg-neutral-300 text-[#171A18] rounded text-[11px]"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {/* Carregar na Calculadora */}
                              <button
                                onClick={() => onLoadIntoCalculator(p)}
                                title="Abrir e recalcular na Calculadora"
                                className="p-1.5 text-[#707570] hover:text-[#2F6B4A] hover:bg-white rounded transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              {/* Duplicar */}
                              <button
                                onClick={() => onDuplicate(p)}
                                title="Duplicar peça"
                                className="p-1.5 text-[#707570] hover:text-[#171A18] hover:bg-white rounded transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {/* Compartilhar */}
                              <button
                                onClick={() => onShareProduct(p)}
                                title="Copiar orçamento"
                                className="p-1.5 text-[#707570] hover:text-[#171A18] hover:bg-white rounded transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {/* Excluir */}
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                title="Excluir peça"
                                className="p-1.5 text-[#707570] hover:text-red-600 hover:bg-white rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
