import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  MenuItem,
  Variation,
  SmartVariation,
  AddOn,
  MealMode,
  DrinkUpgrade,
  LineItemServiceType
} from '../types';
import { getFilteredDrinkUpgrades } from '../data/smartMenu';
import { Check, ChevronRight, ChevronLeft, ShoppingCart, Pencil, Minus, Plus } from 'lucide-react';

export type SmartOrderFlowStepId =
  | 'meal-type'
  | 'variation'
  | 'drink-upgrade'
  | 'add-ons'
  | 'service-type'
  | 'review';

export interface SmartOrderFlowState {
  mealMode?: MealMode;
  selectedVariation?: Variation | SmartVariation;
  selectedDrinkUpgrade?: DrinkUpgrade | 'none';
  selectedAddOns: AddOn[];
  serviceType?: LineItemServiceType;
}

interface SmartOrderFlowProps {
  product: MenuItem;
  onConfirm: (
    quantity: number,
    variation: Variation | SmartVariation | undefined,
    addOns: AddOn[],
    flavor: string | undefined,
    meta: {
      mealMode?: MealMode;
      selectedDrinkUpgrade?: DrinkUpgrade;
      serviceType?: LineItemServiceType;
    }
  ) => void;
  onClose: () => void;
}

interface StepDef {
  id: SmartOrderFlowStepId;
  label: string;
  required: boolean;
}

const serviceLabelMap: Record<LineItemServiceType, string> = {
  'DINE-IN': 'Having Here',
  'TAKE-AWAY': 'Take Away'
};

const mealModeLabelMap: Record<MealMode, string> = {
  'ala-carte': 'Ala Carte',
  'mission-set': 'Mission Sets'
};

function buildSteps(product: MenuItem, mealMode: MealMode | undefined, _variationTier: 'basic' | 'classic' | 'loaded' | undefined): StepDef[] {
  const steps: StepDef[] = [];
  if (product.mealOrderTypes && product.mealOrderTypes.length > 1) {
    steps.push({ id: 'meal-type', label: 'Meal Type', required: true });
  }
  if (product.variations && product.variations.length > 0) {
    steps.push({ id: 'variation', label: 'Variation', required: true });
  }
  const showDrinkStep =
    product.orderingMode === 'mission-meal' &&
    mealMode === 'mission-set';
  if (showDrinkStep) {
    steps.push({ id: 'drink-upgrade', label: 'Drink Upgrade', required: true });
  }
  if (product.addOns && product.addOns.length > 0) {
    steps.push({ id: 'add-ons', label: 'Add-ons', required: false });
  }
  if (product.serviceTypePrompt) {
    steps.push({ id: 'service-type', label: 'Service', required: true });
  }
  steps.push({ id: 'review', label: 'Review', required: true });
  return steps;
}

const SmartOrderFlow: React.FC<SmartOrderFlowProps> = ({ product, onConfirm, onClose }) => {
  const [state, setState] = useState<SmartOrderFlowState>({
    mealMode: undefined,
    selectedVariation: undefined,
    selectedDrinkUpgrade: undefined,
    selectedAddOns: [],
    serviceType: undefined
  });
  const [quantity, setQuantity] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const variationTier: 'basic' | 'classic' | 'loaded' | undefined =
    (state.selectedVariation as SmartVariation | undefined)?.tier;

  const steps = useMemo(
    () => buildSteps(product, state.mealMode, variationTier),
    [product, state.mealMode, variationTier]
  );

  // Re-anchor current step when steps list changes (e.g. mealMode/var changes toggle drink step)
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStepIndex]);

  // NFR-03: If Drink Upgrade step activates with 0 tier options, auto-select "No Upgrade"
  // so a required step never renders without a valid selection path.
  useEffect(() => {
    const stepId = steps[currentStepIndex]?.id;
    if (stepId === 'drink-upgrade') {
      const opts = getFilteredDrinkUpgrades(product, variationTier);
      if (opts.length === 0 && state.selectedDrinkUpgrade === undefined) {
        setState(prev => ({ ...prev, selectedDrinkUpgrade: 'none' }));
      }
    }
  }, [currentStepIndex, steps, product, variationTier, state.selectedDrinkUpgrade]);

  const currentStep = steps[currentStepIndex];
  const currentStepId: SmartOrderFlowStepId | undefined = currentStep?.id;

  // Keep the active step visible in the progress bar and start each step at the top
  const currentStepButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentStepButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    contentRef.current?.scrollTo({ top: 0 });
  }, [currentStepIndex]);

  const setPartial = <K extends keyof SmartOrderFlowState>(patch: Pick<SmartOrderFlowState, K> & {
    clearDownstream?: SmartOrderFlowStepId[];
  }) => {
    const { clearDownstream, ...rest } = patch;
    setState(prev => {
      const next: SmartOrderFlowState = { ...prev, ...rest };
      (clearDownstream || []).forEach(key => {
        switch (key) {
          case 'meal-type': next.mealMode = undefined; break;
          case 'variation': next.selectedVariation = undefined; break;
          case 'drink-upgrade': next.selectedDrinkUpgrade = undefined; break;
          case 'add-ons': next.selectedAddOns = []; break;
          case 'service-type': next.serviceType = undefined; break;
          case 'review': break;
        }
      });
      return next;
    });
  };

  const stepIndexOf = (id: SmartOrderFlowStepId) => steps.findIndex(s => s.id === id);

  const downstreamFrom = (fromId: SmartOrderFlowStepId): SmartOrderFlowStepId[] => {
    const idx = stepIndexOf(fromId);
    if (idx < 0) return [];
    return steps.slice(idx + 1).map(s => s.id);
  };

  const isStepComplete = (stepId: SmartOrderFlowStepId): boolean => {
    switch (stepId) {
      case 'meal-type': return !!state.mealMode;
      case 'variation': return !!state.selectedVariation;
      case 'drink-upgrade': return state.selectedDrinkUpgrade !== undefined;
      case 'add-ons': return true;
      case 'service-type': return !!state.serviceType;
      case 'review': return true;
    }
  };

  const canProceed = (): boolean => {
    if (!currentStep) return false;
    if (currentStep.required) return isStepComplete(currentStep.id);
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(
      quantity,
      state.selectedVariation,
      state.selectedAddOns,
      undefined,
      {
        mealMode: state.mealMode,
        selectedDrinkUpgrade: state.selectedDrinkUpgrade === 'none' ? undefined : state.selectedDrinkUpgrade,
        serviceType: state.serviceType
      }
    );
  };

  const jumpToStep = (stepId: SmartOrderFlowStepId) => {
    const idx = stepIndexOf(stepId);
    if (idx >= 0) setCurrentStepIndex(idx);
  };

  const basePrice =
    (state.selectedVariation?.price) ??
    (product.effectivePrice || product.basePrice || 0);
  const drinkUpgrade = state.selectedDrinkUpgrade && state.selectedDrinkUpgrade !== 'none'
    ? state.selectedDrinkUpgrade
    : undefined;
  const drinkPrice = drinkUpgrade?.price ?? 0;
  const addOnsTotal = state.selectedAddOns.reduce((s, a) => s + a.price, 0);
  const unitTotal = basePrice + drinkPrice + addOnsTotal;
  const grandTotal = unitTotal * quantity;

  // =========== Render step content ============
  const renderStepProgress = () => (
    <div className="px-4 sm:px-6 py-3 border-b border-teamax-gold/20 bg-black/40 shrink-0">
      <div className="flex items-center justify-between sm:justify-start overflow-x-auto scrollbar-hide gap-0.5 sm:gap-1">
        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <React.Fragment key={s.id}>
              <button
                ref={isCurrent ? currentStepButtonRef : undefined}
                onClick={() => {
                  if (isDone) jumpToStep(s.id);
                }}
                disabled={!isDone && !isCurrent}
                title={s.label}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 px-1 sm:px-2 py-1 transition-colors ${isDone ? 'cursor-pointer' : isCurrent ? 'cursor-default' : 'cursor-not-allowed opacity-50'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${isCurrent ? 'bg-teamax-gold text-black border-teamax-gold shadow-gold scale-110' : isDone ? 'bg-teamax-gold/20 text-teamax-gold border-teamax-gold/60' : 'bg-transparent text-teamax-secondary border-teamax-gold/20'}`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap ${isCurrent ? '' : 'hidden sm:inline'} ${isCurrent ? 'text-teamax-gold' : isDone ? 'text-teamax-gold/80' : 'text-teamax-secondary'}`}>
                  {s.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-teamax-gold/30 shrink-0 hidden min-[380px]:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const optionCard = (isSelected: boolean) =>
    `group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${isSelected ? 'border-teamax-gold bg-black shadow-gold transform scale-[1.02]' : 'border-teamax-gold/20 bg-black/40 hover:border-teamax-gold/50'}`;

  const optionRadio = (isSelected: boolean) =>
    `w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`;

  const optionCheck = (isSelected: boolean) =>
    `w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-teamax-gold bg-teamax-gold' : 'border-teamax-gold/40'}`;

  const renderMealTypeStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Choose your order type</h4>
        <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">Required</span>
      </div>
      <div className="space-y-4">
        {(['ala-carte', 'mission-set'] as MealMode[]).map(mode => {
          const isSelected = state.mealMode === mode;
          return (
            <label
              key={mode}
              className={optionCard(isSelected)}
              onClick={() => setPartial({
                mealMode: mode,
                clearDownstream: downstreamFrom('meal-type')
              })}
            >
              <div className="flex items-center space-x-5">
                <div className={optionRadio(isSelected)}>
                  {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className={`text-base font-bold tracking-wider uppercase transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                    {mealModeLabelMap[mode]}
                  </span>
                  <span className="text-[10px] text-teamax-secondary mt-1 tracking-wider">
                    {mode === 'ala-carte' ? 'Main meal standalone — no drink pairing' : 'Main meal with drink upgrade options'}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderVariationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Select Preferred Variation</h4>
        <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">{product.variations!.length} Options</span>
      </div>
      <div className="space-y-4">
        {product.variations!.map(v => {
          const isSelected = state.selectedVariation?.id === v.id;
          return (
            <label
              key={v.id}
              className={optionCard(isSelected)}
              onClick={() => setPartial({
                selectedVariation: v,
                clearDownstream: downstreamFrom('variation')
              })}
            >
              <div className="flex items-center space-x-5">
                <div className={optionRadio(isSelected)}>
                  {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                <span className={`text-base font-bold tracking-wider uppercase transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                  {v.name}
                </span>
              </div>
              <span className={`text-base font-bold transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>
                ₱{(v.price || 0).toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderDrinkUpgradeStep = () => {
    const options = getFilteredDrinkUpgrades(product, variationTier);
    const hasOptions = options.length > 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">
            {hasOptions ? 'Choose your drink upgrade' : 'Drink Upgrade'}
          </h4>
          <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">
            {hasOptions ? `${options.length} Options` : 'No Upgrades'}
          </span>
        </div>
        {hasOptions ? (
          <div className="space-y-4">
            <label
              className={optionCard(state.selectedDrinkUpgrade === 'none')}
              onClick={() => setPartial({
                selectedDrinkUpgrade: 'none',
                clearDownstream: downstreamFrom('drink-upgrade')
              })}
            >
              <div className="flex items-center space-x-5">
                <div className={optionRadio(state.selectedDrinkUpgrade === 'none')}>
                  {state.selectedDrinkUpgrade === 'none' && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                <span className={`text-base font-bold tracking-wider uppercase transition-colors ${state.selectedDrinkUpgrade === 'none' ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                  No Upgrade
                </span>
              </div>
              <span className={`text-base font-bold transition-colors ${state.selectedDrinkUpgrade === 'none' ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>
                ₱0.00
              </span>
            </label>
            {options.map(dup => {
              const isSelected = state.selectedDrinkUpgrade && state.selectedDrinkUpgrade !== 'none' && state.selectedDrinkUpgrade.id === dup.id;
              return (
                <label
                  key={dup.id}
                  className={optionCard(isSelected)}
                  onClick={() => setPartial({
                    selectedDrinkUpgrade: dup,
                    clearDownstream: downstreamFrom('drink-upgrade')
                  })}
                >
                  <div className="flex items-center space-x-5">
                    <div className={optionRadio(isSelected)}>
                      {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                    <span className={`text-base font-bold tracking-wider uppercase transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                      {dup.name}
                    </span>
                  </div>
                  <span className={`text-base font-bold transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>
                    +₱{(dup.price || 0).toFixed(2)}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="mission-card p-6 text-center">
            <p className="text-sm text-teamax-secondary font-bold uppercase tracking-widest mb-2">
              No drink upgrades available for this set level
            </p>
            <p className="text-xs text-teamax-secondary/80">
              "No Upgrade" is selected automatically
            </p>
            {state.selectedDrinkUpgrade !== 'none' && (
              <button
                className="mission-btn mt-5 py-3 px-6 text-xs"
                onClick={() => setPartial({
                  selectedDrinkUpgrade: 'none',
                  clearDownstream: downstreamFrom('drink-upgrade')
                })}
              >
                Confirm No Upgrade
              </button>
            )}
            {state.selectedDrinkUpgrade === 'none' && (
              <div className="mt-4 inline-flex items-center gap-2 text-teamax-gold text-xs font-bold uppercase tracking-widest">
                <Check className="h-4 w-4" /> Selected
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAddOnsStep = () => {
    const toggleAddOn = (a: AddOn) => {
      setState(prev => {
        const found = prev.selectedAddOns.find(x => x.id === a.id);
        return {
          ...prev,
          selectedAddOns: found
            ? prev.selectedAddOns.filter(x => x.id !== a.id)
            : [...prev.selectedAddOns, a]
        };
      });
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Extra Add-ons</h4>
          <span className="text-[10px] text-teamax-gold font-bold px-3 py-1 bg-teamax-gold/10 rounded-full">
            Optional · {state.selectedAddOns.length} selected
          </span>
        </div>
        <div className="space-y-3">
          {product.addOns!.map(addOn => {
            const isSelected = !!state.selectedAddOns.find(a => a.id === addOn.id);
            return (
              <label
                key={addOn.id}
                className={optionCard(isSelected)}
                onClick={() => toggleAddOn(addOn)}
              >
                <div className="flex items-center space-x-4">
                  <div className={optionCheck(isSelected)}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-sm rotate-45" />}
                  </div>
                  <span className={`text-sm font-bold tracking-wider uppercase ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                    {addOn.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary'}`}>
                  +₱{(addOn.price || 0).toFixed(2)}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderServiceTypeStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">How would you like your order?</h4>
        <span className="text-[10px] text-teamax-accent font-bold px-3 py-1 bg-teamax-accent/10 rounded-full">Required</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['DINE-IN', 'TAKE-AWAY'] as LineItemServiceType[]).map(val => {
          const isSelected = state.serviceType === val;
          const display = serviceLabelMap[val];
          return (
            <label
              key={val}
              className={optionCard(isSelected) + ' flex-col items-stretch p-6'}
              onClick={() => setPartial({
                serviceType: val,
                clearDownstream: downstreamFrom('service-type')
              })}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={optionRadio(isSelected)}>
                  {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                <span className="text-3xl">{val === 'DINE-IN' ? '🍽️' : '🥡'}</span>
              </div>
              <span className={`text-lg font-bold tracking-[0.15em] uppercase transition-colors ${isSelected ? 'text-teamax-gold' : 'text-teamax-secondary group-hover:text-teamax-gold'}`}>
                {display}
              </span>
              <span className="text-[10px] text-teamax-secondary/70 mt-1 tracking-wider uppercase">
                {val === 'DINE-IN' ? 'Enjoy at the café' : 'Take your meal away'}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const ReviewRow: React.FC<{ label: string; value?: string; price?: string; stepId?: SmartOrderFlowStepId }> = ({ label, value, price, stepId }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-teamax-gold/10 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-teamax-secondary uppercase tracking-[0.15em] font-bold">{label}</span>
          {stepId && (
            <button
              className="text-[10px] text-teamax-gold font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              onClick={() => jumpToStep(stepId)}
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
        {value && <span className="text-sm font-bold text-teamax-primary">{value}</span>}
      </div>
      {price && <span className="text-sm font-bold text-teamax-gold whitespace-nowrap">{price}</span>}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-teamax-secondary uppercase tracking-[0.2em]">Order Review</h4>
        <span className="text-[10px] text-teamax-gold font-bold px-3 py-1 bg-teamax-gold/10 rounded-full">
          Confirm Details
        </span>
      </div>
      <div className="mission-card p-5 sm:p-6 space-y-1">
        <div className="flex items-start justify-between gap-4 pb-3 mb-2 border-b border-teamax-gold/30">
          <h5 className="text-xl font-display font-bold text-teamax-gold tracking-[0.08em] leading-tight">{product.name}</h5>
        </div>
        {state.mealMode && (
          <ReviewRow label="Meal Mode" value={mealModeLabelMap[state.mealMode]} stepId="meal-type" />
        )}
        {state.selectedVariation && (
          <ReviewRow
            label="Variation"
            value={state.selectedVariation.name}
            price={`₱${(state.selectedVariation.price || 0).toFixed(2)}`}
            stepId="variation"
          />
        )}
        {!state.selectedVariation && (product.basePrice || product.effectivePrice) && (
          <ReviewRow
            label="Item Price"
            price={`₱${((product.effectivePrice || product.basePrice) || 0).toFixed(2)}`}
          />
        )}
        {drinkUpgrade && (
          <ReviewRow
            label="Set Drink"
            value={drinkUpgrade.name}
            price={`+₱${drinkUpgrade.price.toFixed(2)}`}
            stepId="drink-upgrade"
          />
        )}
        {state.selectedAddOns.length > 0 && (
          <div className="py-2 border-b border-teamax-gold/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-teamax-secondary uppercase tracking-[0.15em] font-bold">Add-ons</span>
              <button
                className="text-[10px] text-teamax-gold font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                onClick={() => jumpToStep('add-ons')}
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="space-y-1 pl-1">
              {state.selectedAddOns.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-teamax-primary">• {a.name}</span>
                  <span className="text-sm font-bold text-teamax-gold whitespace-nowrap">+₱{(a.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {state.serviceType && (
          <ReviewRow
            label="Service"
            value={serviceLabelMap[state.serviceType]}
            stepId="service-type"
          />
        )}

        <div className="pt-4 mt-3 space-y-2 border-t border-teamax-gold/30">
          <div className="flex justify-between text-xs text-teamax-secondary uppercase tracking-widest font-bold">
            <span>Subtotal / unit</span>
            <span>₱{unitTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-teamax-secondary uppercase tracking-widest font-bold">
            <span>Quantity</span>
            <div className="rounded-xl flex items-center gap-3 bg-black p-1 border border-teamax-gold/40">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="rounded-lg p-1.5 hover:bg-teamax-gold hover:text-black transition-all active:scale-90 text-teamax-gold"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-base min-w-[20px] text-center text-teamax-primary">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="rounded-lg p-1.5 hover:bg-teamax-gold hover:text-black transition-all active:scale-90 text-teamax-gold"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between pt-2 mt-2 border-t border-teamax-gold/20">
            <span className="text-xs text-teamax-secondary uppercase tracking-widest font-bold self-center">Grand Total</span>
            <span className="text-3xl font-bold text-teamax-gold tracking-tight">₱{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case 'meal-type': return renderMealTypeStep();
      case 'variation': return renderVariationStep();
      case 'drink-upgrade': return renderDrinkUpgradeStep();
      case 'add-ons': return renderAddOnsStep();
      case 'service-type': return renderServiceTypeStep();
      case 'review': return renderReviewStep();
      default: return null;
    }
  };

  const isReviewStep = currentStepId === 'review';
  const canConfirm = isReviewStep && steps.every(s => !s.required || isStepComplete(s.id));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {renderStepProgress()}
      <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-5 sm:p-6">
        {renderCurrentStep()}
      </div>
      <div className="border-t border-teamax-gold/20 px-5 sm:px-6 py-4 bg-black/40 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="mission-btn-outline shrink-0 px-4 sm:px-6 py-3.5 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="uppercase tracking-[0.2em] text-xs">{currentStepIndex === 0 ? 'Cancel' : 'Back'}</span>
          </button>
          {isReviewStep ? (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              aria-disabled={!canConfirm}
              className={`mission-btn flex-1 min-w-0 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-center gap-2 sm:gap-3 group relative overflow-hidden ${!canConfirm ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <ShoppingCart className="h-5 w-5 shrink-0 hidden min-[400px]:block" />
              {/* Label and price stack on narrow screens so neither gets clipped */}
              <span className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight min-w-0">
                <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] sm:text-xs whitespace-nowrap">Add to Order</span>
                <span className="text-sm font-bold whitespace-nowrap tracking-normal"><span className="hidden sm:inline">· </span>₱{grandTotal.toFixed(2)}</span>
              </span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              aria-disabled={!canProceed()}
              className={`mission-btn px-5 sm:px-8 py-3.5 flex items-center gap-2 ${!canProceed() ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <span className="uppercase tracking-[0.2em] text-xs">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartOrderFlow;
