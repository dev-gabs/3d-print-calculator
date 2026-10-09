import {
  GlobalSettings,
  Material,
  ProductPricingState,
  CalculationResult,
} from '../types/pricing';

export function formatBRL(value: number): string {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

export function formatPercent(value: number, decimals: number = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return value.toFixed(decimals) + '%';
}

export function calculateMarginFromSalePrice(
  salePrice: number,
  totalUnitCost: number,
  channelTaxPct: number = 0,
  taxRatePct: number = 0,
  fixedChannelFee: number = 0
): { profit: number; marginPct: number } {
  if (salePrice <= 0) return { profit: 0, marginPct: 0 };
  const channelFee = (salePrice * (channelTaxPct / 100)) + fixedChannelFee;
  const taxFee = salePrice * (taxRatePct / 100);
  const profit = salePrice - totalUnitCost - channelFee - taxFee;
  const marginPct = (profit / salePrice) * 100;
  return { profit, marginPct };
}

export function calculatePricing(
  state: ProductPricingState,
  materials: Material[],
  settings: GlobalSettings
): CalculationResult {
  const primaryMat = materials.find((m) => m.id === state.primaryMaterialId);
  const primaryMatRate = primaryMat ? primaryMat.pricePerKg : 89.9;

  // 1. Material Cost
  const primaryWeight = Math.max(0, state.weightGrams || 0);
  let baseMatCost = (primaryWeight / 1000) * primaryMatRate;

  // Additional materials in advanced mode
  if (state.mode === 'advanced' && state.additionalMaterials?.length) {
    for (const extra of state.additionalMaterials) {
      const extraMat = materials.find((m) => m.id === extra.materialId);
      const extraRate = extraMat ? extraMat.pricePerKg : primaryMatRate;
      const extraWeight = Math.max(0, extra.weightGrams || 0);
      baseMatCost += (extraWeight / 1000) * extraRate;
    }
  }

  // Material waste (supports, brim, purges)
  const wasteMultiplier =
    state.mode === 'advanced' && state.enableWaste
      ? 1 + Math.max(0, state.wastePct || 0) / 100
      : 1;
  const materialCost = baseMatCost * wasteMultiplier;

  // 2. Print Time
  const hours = Math.max(0, state.printHours || 0);
  const minutes = Math.max(0, state.printMinutes || 0);
  const totalPrintHours = hours + minutes / 60;

  // 3. Operational: Energy, Maintenance, Depreciation
  const powerWatts =
    state.mode === 'advanced' && state.overrideMachineSpecs && state.customPowerWatts !== undefined
      ? state.customPowerWatts
      : settings.printerPowerWatts;

  const energyRate =
    state.mode === 'advanced' && state.overrideMachineSpecs && state.customEnergyKwh !== undefined
      ? state.customEnergyKwh
      : settings.energyCostKwh;

  const energyCost = (powerWatts / 1000) * totalPrintHours * energyRate;

  // Maintenance
  const includeMaint =
    state.mode === 'advanced' ? state.includeMaintenance : settings.enableWearCost;
  const maintRate =
    state.mode === 'advanced' && state.maintenanceCostPerHour !== undefined
      ? state.maintenanceCostPerHour
      : settings.wearCostPerHour;
  const maintenanceCost = includeMaint ? totalPrintHours * maintRate : 0;

  // Depreciation
  const includeDeprec =
    state.mode === 'advanced' ? state.includeDepreciation : settings.enableDepreciation;
  const deprecRate =
    state.mode === 'advanced' && state.depreciationCostPerHour !== undefined
      ? state.depreciationCostPerHour
      : settings.depreciationPerHour;
  const depreciationCost = includeDeprec ? totalPrintHours * deprecRate : 0;

  const operationalCost = energyCost + maintenanceCost + depreciationCost;

  // 4. Labor Cost (Advanced)
  let laborCost = 0;
  const batchUnits = Math.max(1, state.batchUnits || 1);

  if (state.mode === 'advanced' && state.enableLabor) {
    const hourlyRate = state.laborHourlyRate ?? settings.laborHourlyRate;
    const prepMinutes = Math.max(0, state.prepMinutes || 0);
    const finishMinutes = Math.max(0, state.finishMinutes || 0);
    const assemblyMinutes = Math.max(0, state.assemblyMinutes || 0);

    // Prep time is divided across batch units; finish & assembly is per unit
    const prepTimePerUnitHours = prepMinutes / 60 / batchUnits;
    const directLaborHoursPerUnit = (finishMinutes + assemblyMinutes) / 60;
    const totalLaborHoursPerUnit = prepTimePerUnitHours + directLaborHoursPerUnit;

    laborCost = totalLaborHoursPerUnit * hourlyRate;
  }

  // 5. Extra Insumos & Custom items (Advanced)
  let extrasCost = 0;
  if (state.mode === 'advanced' && state.extraCosts?.length) {
    extrasCost = state.extraCosts.reduce((acc, item) => acc + Math.max(0, item.costPerUnit || 0), 0);
  }

  // 6. Total Unit Cost
  const totalUnitCost = materialCost + operationalCost + laborCost + extrasCost;
  const totalBatchCost = totalUnitCost * batchUnits;

  // 7. Selling Channel Fees & Margin
  // By default platform fee is disabled unless explicitly set to true
  const isPlatformFeeEnabled = state.enablePlatformFee === true;
  const channelTaxPct = isPlatformFeeEnabled ? Math.max(0, state.channelFeePct || 0) : 0;
  const taxRatePct = state.mode === 'advanced' ? Math.max(0, state.taxRatePct || 0) : 0;
  const fixedChannelFee =
    state.mode === 'advanced' && isPlatformFeeEnabled
      ? Math.max(0, state.fixedChannelFee || 0)
      : 0;

  const channelRate = channelTaxPct / 100;
  const taxRate = taxRatePct / 100;

  let isValid = true;
  let validationMessage: string | undefined;
  let recommendedPrice = 0;
  let profit = 0;
  let realMarginPct = 0;
  let channelFeeAmount = 0;
  let taxAmount = 0;

  let statusTag: CalculationResult['statusTag'] = {
    label: 'Boa margem',
    tone: 'healthy',
    description: 'Boa. Esse preço mantém uma rentabilidade consistente.',
  };

  // CASO 1: Usuário definiu diretamente o Preço de Venda Final (R$)
  if (state.pricingMethod === 'target_price' && state.targetPrice !== undefined && state.targetPrice > 0) {
    recommendedPrice = state.targetPrice;
    channelFeeAmount = (recommendedPrice * channelRate) + fixedChannelFee;
    taxAmount = recommendedPrice * taxRate;
    profit = recommendedPrice - totalUnitCost - channelFeeAmount - taxAmount;
    realMarginPct = recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;

    if (profit < 0) {
      statusTag = {
        label: 'Prejuízo',
        tone: 'loss',
        description: `O preço de venda (${formatBRL(recommendedPrice)}) não cobre o custo total (${formatBRL(totalUnitCost)}) e as taxas.`,
      };
    } else if (realMarginPct < 15) {
      statusTag = {
        label: 'Margem apertada',
        tone: 'tight',
        description: 'Atenção: margem baixa, indicada apenas para alto giro de vendas.',
      };
    } else if (realMarginPct >= 70) {
      statusTag = {
        label: 'Alta rentabilidade',
        tone: 'healthy',
        description: 'Margem excelente de alto valor agregado.',
      };
    } else {
      statusTag = {
        label: 'Boa margem',
        tone: 'healthy',
        description: 'Preço saudável que mantém lucro consistente.',
      };
    }
  } else {
    // CASO 2: Usuário definiu por Margem de Lucro (%)
    // O teto é dinâmico: se taxas forem 0%, permite até 99%. Se houver taxa (ex: 20%), o teto é 99% - 20% = 79%.
    const maxSafeMargin = Math.max(1, 99.5 - channelTaxPct - taxRatePct);
    const marginPct = Math.max(1, Math.min(maxSafeMargin, state.desiredMarginPct || 40));
    const marginRate = marginPct / 100;
    const denominator = 1 - marginRate - channelRate - taxRate;

    if (totalUnitCost === 0 && primaryWeight === 0 && totalPrintHours === 0) {
      isValid = true;
      recommendedPrice = 0;
      profit = 0;
      realMarginPct = marginPct;
    } else if (denominator <= 0.005) {
      isValid = false;
      validationMessage = `A soma da margem desejada (${marginPct}%) com as taxas do canal (${channelTaxPct}%) e impostos (${taxRatePct}%) ultrapassa 99%. Reduza a margem ou desative a taxa de e-commerce.`;
      // Estimativa visual segura de fallback
      recommendedPrice = (totalUnitCost + fixedChannelFee) * 3;
      channelFeeAmount = (recommendedPrice * channelRate) + fixedChannelFee;
      taxAmount = recommendedPrice * taxRate;
      profit = recommendedPrice - totalUnitCost - channelFeeAmount - taxAmount;
      realMarginPct = recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;
      statusTag = {
        label: 'Margem inviável',
        tone: 'loss',
        description: 'Taxas e margem excedem o limite sustentável de 99%.',
      };
    } else {
      recommendedPrice = (totalUnitCost + fixedChannelFee) / denominator;
      channelFeeAmount = (recommendedPrice * channelRate) + fixedChannelFee;
      taxAmount = recommendedPrice * taxRate;
      profit = recommendedPrice * marginRate;
      realMarginPct = recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;

      if (marginPct < 20) {
        statusTag = {
          label: 'Margem apertada',
          tone: 'tight',
          description: 'Atenção: o lucro por peça está menor, indicado para alto volume.',
        };
      } else if (marginPct > 60) {
        statusTag = {
          label: 'Maior margem',
          tone: 'healthy',
          description: 'Margem elevada de alto valor agregado.',
        };
      }
    }
  }

  // Cenários auxiliares
  const minMarginRate = 0.05;
  const minDenominator = 1 - minMarginRate - channelRate - taxRate;
  const minPrice =
    minDenominator > 0.05
      ? (totalUnitCost + fixedChannelFee) / minDenominator
      : (totalUnitCost + fixedChannelFee) * 1.15;

  const maxMarginRate = Math.min(0.85, Math.max(0.2, (realMarginPct / 100) + 0.15));
  const maxDenominator = 1 - maxMarginRate - channelRate - taxRate;
  const maxPrice =
    maxDenominator > 0.05
      ? (totalUnitCost + fixedChannelFee) / maxDenominator
      : recommendedPrice * 1.4;

  // Desconto de lote
  const discountPct =
    state.mode === 'advanced' && state.quantityDiscountPct
      ? Math.max(0, Math.min(50, state.quantityDiscountPct))
      : 0;
  const unitPriceWithBatchDiscount = recommendedPrice * (1 - discountPct / 100);
  const totalBatchRevenue = unitPriceWithBatchDiscount * batchUnits;

  return {
    materialCost,
    energyCost,
    maintenanceCost,
    depreciationCost,
    operationalCost,
    laborCost,
    extrasCost,
    totalUnitCost,
    totalBatchCost,
    recommendedPrice,
    profit,
    realMarginPct,
    channelFeeAmount,
    taxAmount,
    minPrice,
    maxPrice,
    unitPriceWithBatchDiscount,
    totalBatchRevenue,
    isValid,
    validationMessage,
    statusTag,
  };
}
