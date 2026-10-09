import { calculatePricing, formatBRL, formatPercent } from './pricingEngine.ts';
import { DEFAULT_MATERIALS, DEFAULT_SETTINGS, INITIAL_CALC_STATE, parseAndValidateBackup, generateBackupJSON } from '../services/storage.ts';
import { ProductPricingState } from '../types/pricing.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('--- Running 3D Price Math & Storage Validation Tests ---');

// Test 1: Filament Cost
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 100, // 100g of PLA (R$ 89.90/kg) -> R$ 8.99
    printHours: 0,
    printMinutes: 0,
    desiredMarginPct: 40,
    channelFeePct: 0,
    mode: 'basic',
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(Math.abs(result.materialCost - 8.99) < 0.01, `Expected material cost 8.99, got ${result.materialCost}`);
  console.log('✓ Test 1 Passed: Custo de filamento preciso.');
}

// Test 2: Energy Cost
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 0,
    printHours: 2,
    printMinutes: 0, // 2 hours
    mode: 'basic',
  };
  // 200W * 2h * 0.95 R$/kWh = 0.4 kWh * 0.95 = 0.38 R$
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(Math.abs(result.energyCost - 0.38) < 0.01, `Expected energy cost 0.38, got ${result.energyCost}`);
  console.log('✓ Test 2 Passed: Custo de energia elétrico preciso.');
}

// Test 3: Operational Costs (Energy + Wear + Depreciation)
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 0,
    printHours: 1,
    printMinutes: 0,
    mode: 'basic',
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  // Energy: 200W/1000 * 1 * 0.95 = 0.19
  // Maintenance: 0.50
  // Depreciation: 0.45
  // Operational: 0.19 + 0.50 + 0.45 = 1.14
  assert(Math.abs(result.operationalCost - 1.14) < 0.01, `Expected operational 1.14, got ${result.operationalCost}`);
  console.log('✓ Test 3 Passed: Custos operacionais combinados corretos.');
}

// Test 4: Labor Calculation in Advanced Mode
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 0,
    printHours: 0,
    printMinutes: 0,
    mode: 'advanced',
    enableLabor: true,
    laborHourlyRate: 30, // R$ 30/h = R$ 0.50/min
    prepMinutes: 10,
    finishMinutes: 20,
    assemblyMinutes: 0,
    batchUnits: 1,
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  // 30 min total * 30 R$/h = 15 R$
  assert(Math.abs(result.laborCost - 15.0) < 0.01, `Expected labor 15.0, got ${result.laborCost}`);
  console.log('✓ Test 4 Passed: Cálculo de mão de obra.');
}

// Test 5: Material Waste in Advanced Mode
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 1000, // 1kg PLA = R$ 89.90
    printHours: 0,
    printMinutes: 0,
    mode: 'advanced',
    enableWaste: true,
    wastePct: 10, // +10% waste -> R$ 98.89
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(Math.abs(result.materialCost - 98.89) < 0.02, `Expected waste material cost 98.89, got ${result.materialCost}`);
  console.log('✓ Test 5 Passed: Perda percentual de material aplicada.');
}

// Test 6: Margin & Price mathematical consistency
{
  // Total cost = R$ 20.00, Margin = 40%, Channel fee = 10%
  // Price = 20 / (1 - 0.40 - 0.10) = 20 / 0.50 = R$ 40.00
  // Profit = 40 * 0.40 = R$ 16.00
  // Channel Fee = 40 * 0.10 = R$ 4.00
  // Sum: 20 + 16 + 4 = 40!
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    mode: 'basic',
    desiredMarginPct: 40,
    enablePlatformFee: true,
    channelFeePct: 10,
  };
  // Let's set a custom scenario with fixed cost
  const customSettings = {
    ...DEFAULT_SETTINGS,
    printerPowerWatts: 0,
    wearCostPerHour: 0,
    depreciationPerHour: 0,
    enableWearCost: false,
    enableDepreciation: false,
  };
  // Material PLA is R$ 89.90/kg. Let's provide weight that gives exact cost
  // Cost = (W / 1000) * 100 = 20 -> W = 200g @ R$ 100/kg
  const materials = [{ ...DEFAULT_MATERIALS[0], pricePerKg: 100 }];
  const testState = { ...state, weightGrams: 200 };
  const result = calculatePricing(testState, materials, customSettings);

  assert(Math.abs(result.totalUnitCost - 20) < 0.01, `Expected cost 20, got ${result.totalUnitCost}`);
  assert(Math.abs(result.recommendedPrice - 40) < 0.01, `Expected price 40, got ${result.recommendedPrice}`);
  assert(Math.abs(result.profit - 16) < 0.01, `Expected profit 16, got ${result.profit}`);
  assert(Math.abs(result.channelFeeAmount - 4) < 0.01, `Expected channel fee 4, got ${result.channelFeeAmount}`);
  console.log('✓ Test 6 Passed: Consistência matemática Preço = Custo + Taxas + Lucro.');
}

// Test 7: Denominator validation (Margin + Fees >= 95%)
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    enablePlatformFee: true,
    desiredMarginPct: 80,
    channelFeePct: 20, // 80% + 20% = 100% (denominator <= 0)
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(!result.isValid, 'Expected invalid calculation for 100% margin+fees');
  assert(result.statusTag.tone === 'loss', 'Expected status tag to indicate unsustainable margin');
  console.log('✓ Test 7 Passed: Detecção de margem e taxas inviáveis.');
}

// Test 12: Disabled platform fee does not interfere with calculation
{
  const stateWithFeeDisabled: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    enablePlatformFee: false,
    channelFeePct: 20,
    desiredMarginPct: 40,
    weightGrams: 100, // 100g PLA -> R$ 8.99
    printHours: 0,
    printMinutes: 0,
  };
  const result = calculatePricing(stateWithFeeDisabled, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(result.channelFeeAmount === 0, 'Channel fee should be 0 when enablePlatformFee is false');
  // Price should be cost / (1 - 0.40) without any 20% channel deduction
  const expectedPrice = result.totalUnitCost / 0.60;
  assert(Math.abs(result.recommendedPrice - expectedPrice) < 0.01, 'Price should not include disabled platform fees');
  console.log('✓ Test 12 Passed: Card de comissão desabilitado não interfere no cálculo.');
}

// Test 8: Batch Production
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    mode: 'advanced',
    batchUnits: 5,
    quantityDiscountPct: 10, // 10% discount
    desiredMarginPct: 40,
    channelFeePct: 0,
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, DEFAULT_SETTINGS);
  assert(result.unitPriceWithBatchDiscount < result.recommendedPrice, 'Expected discounted price for batch');
  assert(Math.abs(result.totalBatchRevenue - result.unitPriceWithBatchDiscount * 5) < 0.01, 'Batch revenue mismatch');
  console.log('✓ Test 8 Passed: Produção em lote e atacado.');
}

// Test 9: Zero Inputs
{
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 0,
    printHours: 0,
    printMinutes: 0,
    mode: 'basic',
  };
  const customSettings = {
    ...DEFAULT_SETTINGS,
    printerPowerWatts: 0,
    enableWearCost: false,
    enableDepreciation: false,
  };
  const result = calculatePricing(state, DEFAULT_MATERIALS, customSettings);
  assert(result.totalUnitCost === 0, 'Cost should be 0');
  assert(result.recommendedPrice === 0, 'Price should be 0');
  console.log('✓ Test 9 Passed: Entradas zeradas tratadas com segurança.');
}

// Test 10: Formatters
{
  assert(formatBRL(43.03) === 'R$ 43,03', `formatBRL error: ${formatBRL(43.03)}`);
  assert(formatPercent(40) === '40%', `formatPercent error: ${formatPercent(40)}`);
  console.log('✓ Test 10 Passed: Formatação monetária brasileira.');
}

// Test 13: Unconstrained target sale price (e.g. Cost R$ 5,00, Sale Price R$ 100,00)
{
  const customMaterials = [{ ...DEFAULT_MATERIALS[0], pricePerKg: 100 }];
  const zeroSettings = {
    ...DEFAULT_SETTINGS,
    printerPowerWatts: 0,
    enableWearCost: false,
    enableDepreciation: false,
  };
  // 50g @ R$ 100/kg -> Cost = R$ 5.00
  const state: ProductPricingState = {
    ...INITIAL_CALC_STATE,
    weightGrams: 50,
    printHours: 0,
    printMinutes: 0,
    pricingMethod: 'target_price',
    targetPrice: 100, // R$ 100.00
    enablePlatformFee: false, // Commission disabled
  };
  const res1 = calculatePricing(state, customMaterials, zeroSettings);
  assert(Math.abs(res1.totalUnitCost - 5) < 0.01, 'Cost should be 5');
  assert(Math.abs(res1.recommendedPrice - 100) < 0.01, 'Price should be exactly 100');
  assert(Math.abs(res1.profit - 95) < 0.01, 'Profit should be 95');
  assert(Math.abs(res1.realMarginPct - 95) < 0.01, 'Margin should be 95%');

  // With Shopee 20% activated:
  const stateWithShopee: ProductPricingState = {
    ...state,
    enablePlatformFee: true,
    channelFeePct: 20,
  };
  const res2 = calculatePricing(stateWithShopee, customMaterials, zeroSettings);
  assert(Math.abs(res2.recommendedPrice - 100) < 0.01, 'Price should still be 100');
  assert(Math.abs(res2.channelFeeAmount - 20) < 0.01, 'Channel fee should be 20');
  assert(Math.abs(res2.profit - 75) < 0.01, 'Profit should be 75');
  assert(Math.abs(res2.realMarginPct - 75) < 0.01, 'Margin should be 75%');
  console.log('✓ Test 13 Passed: Preço de venda livre sem limitação e com adaptação dinâmica de comissão.');
}

// Test 11: Backup Validation
{
  const validJson = JSON.stringify({
    app: '3d-price',
    version: '2.4',
    exportedAt: new Date().toISOString(),
    settings: DEFAULT_SETTINGS,
    materials: DEFAULT_MATERIALS,
    products: [],
  });
  const resValid = parseAndValidateBackup(validJson);
  assert(resValid.success, 'Valid backup rejected');

  const invalidJson = JSON.stringify({ app: 'other-app' });
  const resInvalid = parseAndValidateBackup(invalidJson);
  assert(!resInvalid.success, 'Invalid backup accepted');
  console.log('✓ Test 11 Passed: Validador de backup JSON rigoroso.');
}

console.log('--- ALL 11 TESTS PASSED SUCCESSFULLY! ---');
