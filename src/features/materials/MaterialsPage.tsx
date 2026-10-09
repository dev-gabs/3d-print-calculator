import React, { useState } from 'react';
import { Plus, Disc, Edit2, Trash2, Check, AlertCircle, X } from 'lucide-react';
import { Material, SavedProduct } from '../../types/pricing';
import { formatBRL } from '../../utils/pricingEngine';

interface MaterialsPageProps {
  materials: Material[];
  savedProducts: SavedProduct[];
  onAddMaterial: (mat: Omit<Material, 'id' | 'pricePerKg'>) => void;
  onUpdateMaterial: (mat: Material) => void;
  onDeleteMaterial: (id: string) => void;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({
  materials,
  savedProducts,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('PLA');
  const [spoolPrice, setSpoolPrice] = useState('89.90');
  const [spoolWeightGrams, setSpoolWeightGrams] = useState('1000');
  const [brand, setBrand] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteWarningId, setDeleteWarningId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingMaterial(null);
    setName('');
    setType('PLA');
    setSpoolPrice('89.90');
    setSpoolWeightGrams('1000');
    setBrand('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setName(mat.name);
    setType(mat.type);
    setSpoolPrice(mat.spoolPrice.toString());
    setSpoolWeightGrams(mat.spoolWeightGrams.toString());
    setBrand(mat.brand || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do material');
      return;
    }

    const price = parseFloat(spoolPrice.replace(',', '.'));
    const weight = parseFloat(spoolWeightGrams.replace(',', '.'));

    if (isNaN(price) || price <= 0) {
      setFormError('Informe um valor de carretel válido maior que zero');
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      setFormError('Informe o peso do carretel em gramas');
      return;
    }

    if (editingMaterial) {
      const calculatedPricePerKg = (price / weight) * 1000;
      onUpdateMaterial({
        ...editingMaterial,
        name: name.trim(),
        type,
        spoolPrice: price,
        spoolWeightGrams: weight,
        pricePerKg: calculatedPricePerKg,
        brand: brand.trim() || undefined,
      });
    } else {
      onAddMaterial({
        name: name.trim(),
        type,
        spoolPrice: price,
        spoolWeightGrams: weight,
        brand: brand.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Check if a material is used in any saved product
  const isMaterialInUse = (matId: string) => {
    return savedProducts.some(
      (p) =>
        p.state.primaryMaterialId === matId ||
        p.state.additionalMaterials?.some((extra) => extra.materialId === matId)
    );
  };

  const calculatedPreviewPricePerKg = () => {
    const p = parseFloat(spoolPrice.replace(',', '.')) || 0;
    const w = parseFloat(spoolWeightGrams.replace(',', '.')) || 1000;
    return (p / w) * 1000;
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-tight text-txt">
            Catálogo de Materiais & Filamentos
          </h1>
          <p className="text-[13px] sm:text-[14px] text-txt-muted mt-1">
            Cadastre os preços reais dos seus carretéis para calcular o custo por grama de cada peça.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar material</span>
        </button>
      </div>

      {/* Grid de Materiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((mat) => {
          const inUse = isMaterialInUse(mat.id);
          const isWarning = deleteWarningId === mat.id;

          return (
            <div
              key={mat.id}
              className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between shadow-2xs hover:border-border-subtle transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-canvas border border-border flex items-center justify-center text-brand">
                      <Disc className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[14px] text-txt">
                        {mat.name}
                      </h3>
                      {mat.brand && (
                        <span className="text-[11px] text-txt-muted block">
                          {mat.brand}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-canvas border border-border text-txt">
                    {mat.type}
                  </span>
                </div>

                {/* Dados de Preço */}
                <div className="space-y-1.5 my-4 pt-3 border-t border-border/70 text-[12.5px]">
                  <div className="flex items-center justify-between text-txt-muted">
                    <span>Preço do carretel:</span>
                    <span className="font-mono text-txt font-medium">
                      {formatBRL(mat.spoolPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-txt-muted">
                    <span>Peso do rolo:</span>
                    <span className="font-mono text-txt font-medium">
                      {mat.spoolWeightGrams}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="font-medium text-txt">Custo por kg:</span>
                    <span className="font-mono text-[14px] font-bold text-brand tabular-nums">
                      {formatBRL(mat.pricePerKg)}/kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé / Ações */}
              <div className="pt-3 border-t border-border/70 flex items-center justify-between text-[11px]">
                <div className="text-txt-muted">
                  {inUse ? (
                    <span className="inline-flex items-center gap-1 text-brand">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                      Em uso em peças salvas
                    </span>
                  ) : (
                    <span>Disponível</span>
                  )}
                </div>

                {isWarning ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-red-600 font-medium">
                      Confirmar?
                    </span>
                    <button
                      onClick={() => onDeleteMaterial(mat.id)}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setDeleteWarningId(null)}
                      className="px-2 py-0.5 bg-border text-txt rounded text-[10px]"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(mat)}
                      className="p-1.5 text-txt-muted hover:text-txt hover:bg-canvas rounded transition-colors"
                      title="Editar material"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (materials.length <= 1) {
                          alert('Mantenha pelo menos um material cadastrado.');
                          return;
                        }
                        setDeleteWarningId(mat.id);
                      }}
                      className="p-1.5 text-txt-muted hover:text-red-600 hover:bg-canvas rounded transition-colors"
                      title="Excluir material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-xl border border-border max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-txt-muted hover:text-txt p-1 rounded-md"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-[17px] font-semibold text-txt mb-1">
              {editingMaterial ? 'Editar Material' : 'Cadastrar Novo Material'}
            </h3>
            <p className="text-[12px] text-txt-muted mb-4">
              Informe o preço e peso do rolo para calcular o custo exato por grama.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 rounded bg-red-50 text-red-700 text-[12px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: PLA Silk Ouro, PETG Preto"
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-[13px] text-txt focus:border-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                    Tipo de polímero
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-[13px] text-txt outline-none cursor-pointer"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU Flexível</option>
                    <option value="ASA">ASA</option>
                    <option value="Nylon">Nylon / PA</option>
                    <option value="Resina">Resina 3D</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex.: 3D Fila, Voolt3D"
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-md text-[13px] text-txt outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                    Preço pago no rolo
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[12px] text-txt-muted font-mono">
                      R$
                    </span>
                    <input
                      type="text"
                      value={spoolPrice}
                      onChange={(e) => setSpoolPrice(e.target.value)}
                      placeholder="89.90"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-surface border border-border rounded-md text-[13px] font-mono text-txt outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-txt-muted mb-1 font-medium">
                    Peso do rolo
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={spoolWeightGrams}
                      onChange={(e) => setSpoolWeightGrams(e.target.value)}
                      placeholder="1000"
                      className="w-full px-2.5 py-1.5 pr-7 bg-surface border border-border rounded-md text-[13px] font-mono text-txt outline-none"
                    />
                    <span className="absolute right-2 text-[12px] text-txt-muted font-mono pointer-events-none">
                      g
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview do cálculo */}
              <div className="p-3 bg-canvas border border-border rounded-md flex items-center justify-between text-[12.5px]">
                <span className="text-txt-muted">Custo calculado:</span>
                <span className="font-mono font-bold text-brand">
                  {formatBRL(calculatedPreviewPricePerKg())} / kg
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-border rounded-md text-[12.5px] text-txt-muted hover:bg-canvas"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-md text-[12.5px] font-medium"
                >
                  Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
