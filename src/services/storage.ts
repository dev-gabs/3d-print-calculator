import {
  GlobalSettings,
  Material,
  ProductPricingState,
  SavedProduct,
} from '../types/pricing';
import { calculatePricing } from '../utils/pricingEngine';

const KEYS = {
  SETTINGS: '3dprice_settings_v2',
  MATERIALS: '3dprice_materials_v2',
  PRODUCTS: '3dprice_products_v2',
  LAST_CALC_STATE: '3dprice_last_calc_state_v2',
};

export const DEFAULT_MATERIALS: Material[] = [
  {
    id: 'mat-pla',
    name: 'PLA',
    type: 'PLA',
    spoolPrice: 89.9,
    spoolWeightGrams: 1000,
    pricePerKg: 89.9,
    brand: '3D Fila / Voolt3D',
    isDefault: true,
  },
  {
    id: 'mat-petg',
    name: 'PETG',
    type: 'PETG',
    spoolPrice: 94.5,
    spoolWeightGrams: 1000,
    pricePerKg: 94.5,
    brand: 'Voolt3D / Printalot',
  },
  {
    id: 'mat-abs',
    name: 'ABS',
    type: 'ABS',
    spoolPrice: 119.0,
    spoolWeightGrams: 1000,
    pricePerKg: 119.0,
    brand: 'Sethi / 3D Fila',
  },
  {
    id: 'mat-tpu',
    name: 'TPU Flexível',
    type: 'TPU',
    spoolPrice: 210.0,
    spoolWeightGrams: 1000,
    pricePerKg: 210.0,
    brand: 'Sethi3D / ESUN',
  },
  {
    id: 'mat-resina',
    name: 'Resina Standard',
    type: 'Resina',
    spoolPrice: 140.0,
    spoolWeightGrams: 1000,
    pricePerKg: 140.0,
    brand: 'Elegoo / Creality',
  },
];

export const DEFAULT_SETTINGS: GlobalSettings = {
  printerPowerWatts: 200,
  energyCostKwh: 0.95,
  wearCostPerHour: 0.5,
  depreciationPerHour: 0.45,
  enableWearCost: true,
  enableDepreciation: true,
  laborHourlyRate: 25.0,
  channelFees: {
    shopee: 20,
    mercadolivre: 19,
    direta: 0,
    amazon: 16,
    outro: 15,
  },
  hasCompletedOnboarding: false,
  defaultMode: 'basic',
};

export const INITIAL_CALC_STATE: ProductPricingState = {
  name: 'Suporte de Mesa para Headset',
  primaryMaterialId: 'mat-pla',
  weightGrams: 146,
  printHours: 4,
  printMinutes: 18,
  channel: 'shopee',
  channelFeePct: 20,
  enablePlatformFee: false,
  desiredMarginPct: 40,
  pricingMethod: 'target_price',
  targetPrice: 35.00,
  mode: 'basic',
  enableWaste: false,
  wastePct: 5,
  additionalMaterials: [],
  overrideMachineSpecs: false,
  includeMaintenance: true,
  includeDepreciation: true,
  enableLabor: false,
  prepMinutes: 10,
  finishMinutes: 15,
  assemblyMinutes: 0,
  extraCosts: [
    { id: 'extra-1', name: 'Embalagem e plástico bolha', costPerUnit: 2.5 },
  ],
  fixedChannelFee: 0,
  taxRatePct: 0,
  batchUnits: 1,
  quantityDiscountPct: 0,
};

// --- Storage API ---

export function getStoredSettings(): GlobalSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: GlobalSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredMaterials(): Material[] {
  try {
    const raw = localStorage.getItem(KEYS.MATERIALS);
    if (!raw) {
      localStorage.setItem(KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
      return DEFAULT_MATERIALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MATERIALS;
  } catch {
    return DEFAULT_MATERIALS;
  }
}

export function saveStoredMaterials(materials: Material[]): void {
  try {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
  } catch (err) {
    console.error('Failed to save materials:', err);
  }
}

export function getStoredProducts(): SavedProduct[] {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) {
      // Seed with sample initial product matching the screenshot
      const materials = getStoredMaterials();
      const settings = getStoredSettings();
      const calc = calculatePricing(INITIAL_CALC_STATE, materials, settings);
      const initialProduct: SavedProduct = {
        id: 'prod-headset-stand',
        state: INITIAL_CALC_STATE,
        calculation: calc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const initialList = [initialProduct];
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initialList));
      return initialList;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredProducts(products: SavedProduct[]): void {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

export function getStoredLastCalcState(): ProductPricingState {
  try {
    const raw = localStorage.getItem(KEYS.LAST_CALC_STATE);
    if (!raw) return INITIAL_CALC_STATE;
    return { ...INITIAL_CALC_STATE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_CALC_STATE;
  }
}

export function saveStoredLastCalcState(state: ProductPricingState): void {
  try {
    localStorage.setItem(KEYS.LAST_CALC_STATE, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save last calc state:', err);
  }
}

// Backup & Restore
export interface BackupData {
  app: '3d-price';
  version: '2.4';
  exportedAt: string;
  settings: GlobalSettings;
  materials: Material[];
  products: SavedProduct[];
}

export function generateBackupJSON(): string {
  const data: BackupData = {
    app: '3d-price',
    version: '2.4',
    exportedAt: new Date().toISOString(),
    settings: getStoredSettings(),
    materials: getStoredMaterials(),
    products: getStoredProducts(),
  };
  return JSON.stringify(data, null, 2);
}

export function parseAndValidateBackup(jsonString: string): {
  success: boolean;
  data?: BackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== '3d-price') {
      return { success: false, error: 'Arquivo inválido: assinatura do 3D Price não encontrada.' };
    }
    if (!Array.isArray(parsed.materials) || !Array.isArray(parsed.products) || !parsed.settings) {
      return { success: false, error: 'Estrutura corrompida: faltam seções essenciais de dados.' };
    }
    return { success: true, data: parsed as BackupData };
  } catch (e: any) {
    return { success: false, error: `Falha ao interpretar JSON: ${e?.message || 'Arquivo corrompido'}` };
  }
}

export function restoreBackup(backup: BackupData): void {
  saveStoredSettings(backup.settings);
  saveStoredMaterials(backup.materials);
  saveStoredProducts(backup.products);
}
