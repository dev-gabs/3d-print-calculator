export type ChannelId = 'shopee' | 'mercadolivre' | 'direta' | 'amazon' | 'outro';

export interface Material {
  id: string;
  name: string;
  type: string; // PLA, PETG, ABS, TPU, Resina, etc.
  spoolPrice: number; // in BRL, e.g. 89.90
  spoolWeightGrams: number; // e.g. 1000
  pricePerKg: number; // calculated: (spoolPrice / spoolWeightGrams) * 1000
  color?: string;
  brand?: string;
  isDefault?: boolean;
}

export interface ExtraCostItem {
  id: string;
  name: string;
  costPerUnit: number;
}

export interface MultiMaterialEntry {
  id: string;
  materialId: string;
  weightGrams: number;
}

export interface GlobalSettings {
  printerPowerWatts: number; // default: 200W
  energyCostKwh: number; // default: 0.95 R$/kWh
  wearCostPerHour: number; // maintenance/depreciation: 0.50 R$/h
  depreciationPerHour: number; // printer wear: 0.45 R$/h
  enableWearCost: boolean;
  enableDepreciation: boolean;
  laborHourlyRate: number; // e.g. 25.00 R$/h
  channelFees: Record<ChannelId, number>; // percentages e.g. { shopee: 20, mercadolivre: 19, direta: 0, amazon: 16, outro: 15 }
  hasCompletedOnboarding: boolean;
  defaultMode: 'basic' | 'advanced';
}

export interface ProductPricingState {
  id?: string;
  name: string;
  primaryMaterialId: string;
  weightGrams: number;
  printHours: number;
  printMinutes: number;
  channel: ChannelId;
  channelFeePct: number;
  enablePlatformFee?: boolean; // toggle to enable platform/marketplace commission (default: false)
  desiredMarginPct: number; // 10% to 80%
  pricingMethod?: 'margin' | 'target_price'; // whether user sets margin % or target sale price R$
  targetPrice?: number; // custom sale price when pricingMethod === 'target_price'

  // Advanced fields (preserved across toggles)
  mode: 'basic' | 'advanced';
  enableWaste: boolean;
  wastePct: number; // default 5%
  additionalMaterials: MultiMaterialEntry[];
  
  // Advanced machine overrides (optional)
  overrideMachineSpecs: boolean;
  customPowerWatts?: number;
  customEnergyKwh?: number;
  includeMaintenance: boolean;
  maintenanceCostPerHour?: number;
  includeDepreciation: boolean;
  depreciationCostPerHour?: number;

  // Advanced Labor
  enableLabor: boolean;
  laborHourlyRate?: number;
  prepMinutes: number; // slicing, plate prep
  finishMinutes: number; // support removal, curing, sanding
  assemblyMinutes: number; // joining, screwing

  // Advanced Extra Items
  extraCosts: ExtraCostItem[];

  // Advanced taxes & fixed fees
  fixedChannelFee: number; // e.g. R$ 3.00 marketplace flat fee
  taxRatePct: number; // e.g. 4% Simples Nacional

  // Batch production
  batchUnits: number; // default 1
  quantityDiscountPct: number; // e.g. 0%
}

export interface CalculationResult {
  // Costs
  materialCost: number;
  energyCost: number;
  maintenanceCost: number;
  depreciationCost: number;
  operationalCost: number; // energy + maintenance + depreciation
  laborCost: number;
  extrasCost: number;
  totalUnitCost: number;
  totalBatchCost: number;

  // Pricing
  recommendedPrice: number;
  profit: number;
  realMarginPct: number;
  channelFeeAmount: number;
  taxAmount: number;

  // Scenarios
  minPrice: number; // Break-even / safety minimal
  maxPrice: number; // Higher margin scenario

  // Batch pricing
  unitPriceWithBatchDiscount: number;
  totalBatchRevenue: number;

  // Status
  isValid: boolean;
  validationMessage?: string;
  statusTag: {
    label: string;
    tone: 'healthy' | 'tight' | 'loss' | 'high';
    description: string;
  };
}

export interface SavedProduct {
  id: string;
  state: ProductPricingState;
  calculation: CalculationResult;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopCapacitySettings {
  printerCount: number; // e.g. 1
  operationalHoursPerDay: number; // e.g. 16
  operationalDaysPerMonth: number; // e.g. 26
  monthlyTargetProfit: number; // e.g. R$ 2000.00
  monthlyFixedCosts: number; // e.g. R$ 300.00 (optional shop fixed overhead)
}
