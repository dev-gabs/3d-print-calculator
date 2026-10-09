import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { OnboardingModal } from './components/OnboardingModal';
import { ShareModal } from './components/ShareModal';
import { CalculatorPage } from './features/calculator/CalculatorPage';
import { ProductsPage } from './features/products/ProductsPage';
import { MaterialsPage } from './features/materials/MaterialsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import {
  GlobalSettings,
  Material,
  ProductPricingState,
  SavedProduct,
} from './types/pricing';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredMaterials,
  saveStoredMaterials,
  getStoredProducts,
  saveStoredProducts,
  getStoredLastCalcState,
  saveStoredLastCalcState,
  INITIAL_CALC_STATE,
} from './services/storage';
import { calculatePricing } from './utils/pricingEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Core Data loaded from localStorage
  const [settings, setSettings] = useState<GlobalSettings>(() => getStoredSettings());
  const [materials, setMaterials] = useState<Material[]>(() => getStoredMaterials());
  const [products, setProducts] = useState<SavedProduct[]>(() => getStoredProducts());
  const [calcState, setCalcState] = useState<ProductPricingState>(() =>
    getStoredLastCalcState()
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Onboarding Modal state
  const [showOnboarding, setShowOnboarding] = useState(
    () => !settings.hasCompletedOnboarding
  );

  // Derived live calculation
  const calculation = calculatePricing(calcState, materials, settings);

  // Sync calcState changes to localStorage
  useEffect(() => {
    saveStoredLastCalcState(calcState);
  }, [calcState]);

  // Handlers for Calculator
  const handleCalcChange = (
    updater: (prev: ProductPricingState) => ProductPricingState
  ) => {
    setCalcState((prev) => updater(prev));
  };

  const handleReset = () => {
    setCalcState({
      ...INITIAL_CALC_STATE,
      name: 'Suporte de Mesa para Headset',
      weightGrams: 146,
      printHours: 4,
      printMinutes: 18,
      primaryMaterialId: materials[0]?.id || 'mat-pla',
      desiredMarginPct: 40,
      channel: 'shopee',
      channelFeePct: settings.channelFees.shopee ?? 20,
      enablePlatformFee: false,
      pricingMethod: 'target_price',
      targetPrice: 35.00,
    });
  };

  const handleNewPiece = () => {
    setCalcState({
      ...INITIAL_CALC_STATE,
      name: '',
      weightGrams: 0,
      printHours: 0,
      printMinutes: 0,
      primaryMaterialId: materials[0]?.id || 'mat-pla',
      desiredMarginPct: 40,
      channel: 'shopee',
      channelFeePct: settings.channelFees.shopee ?? 20,
      enablePlatformFee: false,
      pricingMethod: 'target_price',
      targetPrice: 0,
    });
    setActiveTab('calculator');
  };

  const handleSaveProduct = (mode: 'create_new' | 'overwrite' = 'create_new') => {
    const now = new Date().toISOString();
    const productName = calcState.name.trim() || 'Peça Sem Título';
    const updatedState = { ...calcState, name: productName };

    // Find existing product with exact same name (case-insensitive)
    const existingIndex = products.findIndex(
      (p) => p.state.name.trim().toLowerCase() === productName.toLowerCase()
    );

    let updatedProducts: SavedProduct[];

    if (mode === 'overwrite' || existingIndex >= 0) {
      // Overwrite the existing item if it exists, preventing duplicate data
      if (existingIndex >= 0) {
        const existing = products[existingIndex];
        const targetId = existing.id;
        const updatedItem: SavedProduct = {
          ...existing,
          state: { ...updatedState, id: targetId },
          calculation,
          updatedAt: now,
        };
        updatedProducts = [...products];
        updatedProducts[existingIndex] = updatedItem;
        setCalcState((prev) => ({ ...prev, id: targetId, name: productName }));
      } else {
        // Fallback: if not found, create new
        const newId = 'prod-' + Date.now();
        const newItem: SavedProduct = {
          id: newId,
          state: { ...updatedState, id: newId },
          calculation,
          createdAt: now,
          updatedAt: now,
        };
        updatedProducts = [newItem, ...products];
        setCalcState((prev) => ({ ...prev, id: newId, name: productName }));
      }
    } else {
      // Create new item (only reached when name is unique)
      const newId = 'prod-' + Date.now();
      const newItem: SavedProduct = {
        id: newId,
        state: { ...updatedState, id: newId },
        calculation,
        createdAt: now,
        updatedAt: now,
      };
      updatedProducts = [newItem, ...products];
      setCalcState((prev) => ({ ...prev, id: newId, name: productName }));
    }

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
  };

  // Handlers for Products Page
  const handleLoadProductIntoCalculator = (product: SavedProduct) => {
    setCalcState({ ...product.state });
    setActiveTab('calculator');
  };

  const handleDuplicateProduct = (product: SavedProduct) => {
    const newId = 'prod-' + Date.now();
    const duplicated: SavedProduct = {
      ...product,
      id: newId,
      state: {
        ...product.state,
        id: newId,
        name: `${product.state.name} (Cópia)`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleShareProduct = (product: SavedProduct) => {
    setCalcState(product.state);
    setIsShareOpen(true);
  };

  // Handlers for Materials Page
  const handleAddMaterial = (newMatData: Omit<Material, 'id' | 'pricePerKg'>) => {
    const id = 'mat-' + Date.now();
    const pricePerKg = (newMatData.spoolPrice / newMatData.spoolWeightGrams) * 1000;
    const newMat: Material = {
      ...newMatData,
      id,
      pricePerKg,
    };
    const updated = [...materials, newMat];
    setMaterials(updated);
    saveStoredMaterials(updated);
  };

  const handleUpdateMaterial = (updatedMat: Material) => {
    const updated = materials.map((m) =>
      m.id === updatedMat.id ? updatedMat : m
    );
    setMaterials(updated);
    saveStoredMaterials(updated);
  };

  const handleDeleteMaterial = (id: string) => {
    const updated = materials.filter((m) => m.id !== id);
    setMaterials(updated);
    saveStoredMaterials(updated);

    // If current calculator was using this material, switch to first available
    if (calcState.primaryMaterialId === id && updated.length > 0) {
      setCalcState((prev) => ({ ...prev, primaryMaterialId: updated[0].id }));
    }
  };

  // Handlers for Settings Page
  const handleUpdateSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleReloadAllData = () => {
    setSettings(getStoredSettings());
    setMaterials(getStoredMaterials());
    setProducts(getStoredProducts());
    setCalcState(getStoredLastCalcState());
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    const updatedSettings = { ...settings, hasCompletedOnboarding: true };
    setSettings(updatedSettings);
    saveStoredSettings(updatedSettings);
  };

  return (
    <div className="min-h-screen text-txt font-sans antialiased">
      {/* Mobile Header */}
      <MobileHeader
        activeTab={activeTab}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onNewPiece={handleNewPiece}
      />

      {/* Sidebar Desktop e Drawer Mobile */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        productsCount={products.length}
        materialsCount={materials.length}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Content Area with exact desktop padding for sidebar */}
      <div className="lg:pl-[220px] min-h-screen transition-all">
        {activeTab === 'calculator' && (
          <CalculatorPage
            state={calcState}
            calculation={calculation}
            materials={materials}
            products={products}
            settings={settings}
            onChange={handleCalcChange}
            onReset={handleReset}
            onSave={handleSaveProduct}
            onNewPiece={handleNewPiece}
            onOpenShare={() => setIsShareOpen(true)}
            onNavigateToMaterials={() => setActiveTab('materials')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage
            products={products}
            materials={materials}
            onLoadIntoCalculator={handleLoadProductIntoCalculator}
            onDuplicate={handleDuplicateProduct}
            onDelete={handleDeleteProduct}
            onNewPiece={handleNewPiece}
            onShareProduct={handleShareProduct}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsPage
            materials={materials}
            savedProducts={products}
            onAddMaterial={handleAddMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onReloadAllData={handleReloadAllData}
          />
        )}
      </div>

      {/* Onboarding Dialog on first launch */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />

      {/* Share / Quotation Dialog */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        state={calcState}
        calculation={calculation}
        materials={materials}
      />
    </div>
  );
}
