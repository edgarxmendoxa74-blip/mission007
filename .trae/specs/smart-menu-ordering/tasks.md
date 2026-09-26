# Smart Menu Ordering — Implementation Tasks

Mapping from ACs in `spec.md` to concrete engineering work. All tasks are dependency-ordered.

---

## Task 1: Extend Type Interfaces (data model layer)

**Status:** pending
**Priority:** high
**Dependencies:** (none)
**Covers ACs:** AC-04, AC-06, AC-08, AC-10

### Description
Extend `src/types/index.ts` interfaces so the new flow payloads type-check without modifying existing downstream code paths.

**Work items:**
1. Add a new `MealMode = 'ala-carte' | 'mission-set'` type.
2. Add a new `ServiceType = 'DINE-IN' | 'TAKE-AWAY'` type for Mission Meals capture. Note: do NOT conflict with or rename the existing `ServiceType = 'pickup' | 'delivery'` (used in Checkout) — rename that one to `CheckoutServiceType` or namespace separately.
3. Add `DrinkUpgrade` interface: `{ id: string; name: string; price: number; tier: 'basic' | 'classic' | 'loaded'; refProductId?: string }`.
4. Add `SmartVariation` that extends `Variation` with optional `tier` field (for tier gating on drink upgrades). Keep existing `Variation` for backward compatibility; the new menu data module uses the extended union.
5. Add to `MenuItem` (or a new `SmartMenuItem extends MenuItem`):
   - `orderingMode?: 'mission-meal' | 'simple'`
   - `mealOrderTypes?: MealMode[]` (which branches are supported)
   - `drinkUpgrades?: DrinkUpgrade[]` (only Mission Sets products)
   - `serviceTypePrompt?: boolean` (triggers HAVING HERE / TAKE-AWAY step)
   - `subCategory?: string` (for Cold Operations subsection labels)
6. Add to `CartItem`:
   - `mealMode?: MealMode`
   - `selectedDrinkUpgrade?: DrinkUpgrade`
   - `serviceType?: ServiceType` (Mission Meals per-item)
7. Update `AddOn` if needed (no change expected; keep existing shape).

### Test Requirements

- **TR-1.1 (rule)** TypeScript compiles with `tsc --noEmit` without errors after interface edits and before any component uses the new fields.
- **TR-1.2 (rule)** Existing `CartItem`, `Order`, `OrderData` types that depend on old `ServiceType` still compile (Checkout path unchanged).
- **TR-1.3 (rule)** New `ServiceType` literal union accepts only `DINE-IN | TAKE-AWAY`, rejects string literals like "Having Here".

**Completion Evidence:** TSC pass output; git diff of `index.ts` showing new interfaces.

---

## Task 2: Author Smart Menu Data Module

**Status:** pending
**Priority:** high
**Dependencies:** Task 1
**Covers ACs:** AC-01, AC-03, AC-04, AC-05, AC-07, AC-13

### Description
Create `src/data/smartMenu.ts` as the single source of truth for categories, products, variations, add-ons, and tiered drink upgrades. No component is allowed to hardcode menu strings.

**Work items:**
1. Export `SMART_CATEGORIES: SmartCategory[]` with 5 entries in exact order, each with `id`, `name`, `icon`.
2. Export `SMART_MENU: SmartMenuItem[]` with all products from spec Appendix, including:
   - Mission Meals 4 products: each has `mealOrderTypes: ['ala-carte','mission-set']`, variations Basic/Classic/Loaded (with `.tier='basic'|'classic'|'loaded'`), full add-ons list (Regular Chips, Medium Chips, Large Chips, Extra Tartar Sauce, Extra Spicy Mayo, Plain Rice).
   - Mission Meals products have `drinkUpgrades` array where Basic 6 drinks carry exact prices: Black Protocol Hot +95, Black Protocol Iced +90, Agent Latte Hot +145, Agent Latte Iced +95, Green Signal +110, Pineapple Chill +115. Classic/Loaded arrays empty but tier field required.
   - Social Dining 3 products: Mission Crisp (Standard/Trio), Dip Crunch Set (Bite Solo/Snack Set/Share Set), Sausage Code Bite Set (Bite Solo/Snack Set/Share Set).
   - Coffee Intelligence 4 products: Espresso Shot (no var), Black Protocol (Hot 8oz / Iced 16oz), Agent Latte (Hot 8oz / Iced 16oz), Midnight Brief (no var).
   - Cold Operations – Signature Mocktails: all 15 beverages with `subCategory` set to one of 'Refreshers' | 'Tea Series' | 'Coffee Bar Mocktails' | 'Fresh Blends'.
   - Sweet Endings: Honey Brioche Toast, Tablea Brownie.
3. Export helpers:
   - `getProductsByCategory(categoryId): SmartMenuItem[]`
   - `getFilteredDrinkUpgrades(product, variationTier): DrinkUpgrade[]` — returns the tier-filtered list or empty.
   - `getVariations(product): Variation[]` — returns variations or `[]` if none.
4. Use placeholder `basePrice` values (e.g. ₱185 for Basic main, ₱265 Classic, ₱345 Loaded) — exact numbers are data edits; structure is the requirement.
5. Image fields can remain `undefined` (existing MenuItemCard handles fallback icon).

### Test Requirements

- **TR-2.1 (rule)** `SMART_CATEGORIES.length === 5` and order matches spec by deep assertion of names array.
- **TR-2.2 (rule)** `getFilteredDrinkUpgrades(fishProtocol, 'basic').length === 6` and prices equal `[95,90,145,95,110,115]` in any order (test by id map).
- **TR-2.3 (rule)** `getFilteredDrinkUpgrades(fishProtocol, 'classic')` returns `[]`.
- **TR-2.4 (rule)** Cold Operations products have non-empty `subCategory` grouping all 4 sections.
- **TR-2.5 (rubric) Data-only change:** Adding a new product does not require component code changes. Evidence: a test data-add diff (e.g. "insert a dummy social dining item") touches only `smartMenu.ts`.
  Pass threshold: 2.

**Completion Evidence:** Unit-like console assertions in a one-off dev script or TSC type-enforced structure checks + manual spot-check of data counts.

---

## Task 3: Replace Category (SubNav) List with Smart Menu Data

**Status:** pending
**Priority:** medium
**Dependencies:** Task 2
**Covers ACs:** AC-01, AC-13

### Description
Update SubNav and Menu components so they pull categories + products from the new `smartMenu.ts` module instead of the old `menuData.ts` / Supabase-hooked `useCategories` / `useMenu` hooks. The goal is that the UI surface respects the exact 5-category order and new product list, while preserving search, scroll-sync, and chip UX.

**Work items:**
1. Create a `useSmartCategories` hook (or a small helper) that reads from `SMART_CATEGORIES` instead of Supabase. Keep `useCategories` for admin dashboard only.
2. In `App.tsx`, swap `useMenu()` + `useCategories` flow for the smart menu data. `selectedCategory` defaults to the first category id or `'all'` per SubNav current behavior.
3. In `SubNav`, render smart categories preserving order; remove loading skeleton (data is static).
4. In `Menu.tsx`, map categories from `SMART_CATEGORIES` and populate each section via `getProductsByCategory`. Keep the search field, scroll-spy, and section `<h3>` styling exactly as-is (brand continuity, AC-14).
5. **Cold Operations sub-sections (Rubric AC-13 but also UX):** Within the Cold Operations section, render a small subheading (`h4`) for each distinct `subCategory` group (Refreshers / Tea Series / Coffee Bar Mocktails / Fresh Blends) then the product grid under each group. Products belonging to a group must appear only under that group heading.

### Test Requirements

- **TR-3.1 (rule)** SubNav chip DOM order (by `data-testid` or text content) matches spec AC-01.
- **TR-3.2 (rule)** Menu section count on page === 5 when search is empty.
- **TR-3.3 (rule)** Cold Operations section contains exactly 4 sub-headings with the exact 4 names; count of product cards under Cold Operations === 15.
- **TR-3.4 (rule)** `useCategories` / `useMenu` hooks are NOT called by MainApp (they remain only in `AdminDashboard` or other admin-scoped views).

**Completion Evidence:** Screenshot of rendered menu sections + DOM selector assertions.

---

## Task 4: Build the Multi-Step Smart Customizer (Replace / Rework MenuItemCard Modal)

**Status:** pending
**Priority:** high
**Dependencies:** Task 1, Task 2, Task 3
**Covers ACs:** AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-11, AC-12, AC-14

### Description
Replace the single-page variation modal inside `MenuItemCard.tsx` with a **step-driven `SmartOrderFlow` component** that:
- Enumerates steps dynamically based on product.
- Shows one step at a time with a progress header (step N/M, labels).
- Provides Back / Next / Add to Order navigation.
- Enforces conditional rendering per the ordering rules table FR-08.

**Component file:** Create `src/components/SmartOrderFlow.tsx`; wire it into `MenuItemCard` by replacing the modal content. Keep the outer portal modal shell (image header + close button) for brand consistency.

**Step resolution rules per product:**

Build an ordered step list from the product config:

1. `Meal Order Type` step — present if `product.mealOrderTypes && product.mealOrderTypes.length > 1` (Mission Meals). Choices: Ala Carte / Mission Sets. Required.
2. `Variation` step — present if `variations.length > 0`. Single-select. Required.
3. `Drink Upgrade` step — present ONLY IF Mission Meals AND `mealMode === 'mission-set'` AND `drinkUpgradesForTier.length > 0`. Render the tier-filtered list (TR-2.2/2.3). If list is empty, render "No drink upgrades available for this set level" disabled-state card + explicit "No Upgrade" option selected by default. Required: either a tier option OR "No Upgrade".
4. `Add-ons` step — present if `addOns.length > 0`. Multi-select (0..N). Optional.
5. `Service Type` step — present if `product.serviceTypePrompt === true` (Mission Meals). Choices: HAVING HERE → DINE-IN, TAKE AWAY → TAKE-AWAY. Required.
6. `Order Review` step — always the final step before confirm. Summarizes all selections (see FR-09).

**UI requirements per step:**
- Persistent step progress bar / step chips at the top showing labels, e.g. `[Meal Type] → [Variation] → [Drink] → [Add-ons] → [Service] → [Review]` with completed steps as checkmarks, current step highlighted, future steps disabled/greyed.
- Back button at left of footer; Next/Add to Order on right.
- Next button is disabled until the step's required selection is made (use form state, not disabled-only CSS — accessibility).
- Back on step 1 closes the modal (confirm optional, lean towards no confirm for speed).
- Changing a value in step N must reset steps N+1..end state (AC-09), but step N itself retains the new value.

**Order Review card (FR-09):**
- Structured list: Product → Meal Mode (if present) → Variation (price) → Drink Upgrade (if any, `+₱X`) → Add-ons (each line `+₱X`) → Service Type (if present) → TOTAL.
- "Edit" links per line jump to the corresponding step (preserves prior selections on that step).

**Add to Order final button:**
Calls `addToCart` with the composed payload. Signature extension (keep backward compat with existing single-argument usage by overloading, or extend the object shape):
```
addToCart(
  product,
  quantity,
  variation,            // existing
  addOns,               // existing
  flavor,               // existing (unused here)
  { mealMode, selectedDrinkUpgrade, serviceType }  // NEW meta object
)
```
Then `useCart` must merge the meta into the new `CartItem` fields (Task 5).

**Brand styling:**
- Use `mission-btn` for primary CTAs; `mission-btn-outline` for back/edit secondary.
- Option cards reuse the existing variation selection visuals (border-2 + `border-teamax-gold` when selected, etc.).
- Review card uses `mission-card` wrapper.

### Test Requirements

- **TR-4.1 (rule)** Espresso Shot: step list is only `[Review]` (no variation, no add-ons, no service).
- **TR-4.2 (rule)** Agent Latte: step list is `[Variation → Review]`. Confirm is blocked unless Hot or Iced is selected.
- **TR-4.3 (rule)** Mission Meals Ala Carte Fish Protocol: steps are `[Meal Order Type → Variation → Add-ons → Service Type → Review]` — Drink step is ABSENT.
- **TR-4.4 (rule)** Mission Meals Mission Sets Fish Protocol: steps are `[Meal Order Type → Variation → Drink Upgrade → Add-ons → Service Type → Review]` — with Basic selected, Drink Upgrade options === 6 Basic drinks.
- **TR-4.5 (rule)** Mission Sets Basic + choose Agent Latte Iced → drinkUpgrade.price in payload === 95; total calculation on review line shows `(varPrice + 95 + addOns) × qty`.
- **TR-4.6 (rule)** Mission Sets + pick Fish Protocol Basic Agent Latte upgrade → back to Variation → change to Classic → drinkUpgrade state is cleared; Drink step shows empty/placeholder list.
- **TR-4.7 (rule)** Service Type step labels: "HAVING HERE" and "TAKE AWAY" are rendered text; emitted value via console/probe is `DINE-IN`/`TAKE-AWAY`.
- **TR-4.8 (rule)** Service Type missing: Add to Order button on Review step is disabled (grayed out, aria-disabled=true, no click handler).
- **TR-4.9 (rubric) UX clarity (AC-12):** Score 0–2. Pass ≥ 2.
- **TR-4.10 (rubric) Brand/style (AC-14):** Score 0–2. Pass ≥ 2.

**Completion Evidence:** Manual walkthrough checklist ticked; 3 screenshot captures (Ala Carte flow, Mission Sets flow, simple product flow) + console logging of the final addToCart arguments.

---

## Task 5: Update useCart Hook to Handle New Payload Fields

**Status:** pending
**Priority:** high
**Dependencies:** Task 1, Task 4 (shares signature)
**Covers ACs:** AC-08, AC-10

### Description
Modify `useCart.addToCart` signature (and dedupe logic in `calculateItemPrice`, the existing-item find) to carry `mealMode`, `selectedDrinkUpgrade`, `serviceType` into each CartItem. Backward compatible: if the new meta object is not provided, CartItem fields are `undefined` (same behavior as today for any legacy non-smart items).

**Work items:**
1. Add new optional parameter `meta?: { mealMode?: MealMode; selectedDrinkUpgrade?: DrinkUpgrade; serviceType?: ServiceType }` to `addToCart` (after flavor, or replace with a single options object — pick the option that least breaks existing call sites in AdminDashboard or elsewhere).
2. `calculateItemPrice` formula update (FR-12):
   - Base: variation or effectivePrice.
   - Discount: if item.onDiscount, apply discount delta to base only.
   - Plus: meta.selectedDrinkUpgrade?.price ?? 0
   - Plus: Σ addOn prices
   - Multiply by quantity (existing).
3. Dedupe match (AC-10): when looking for existingItem to stack quantity, include mealMode + drinkUpgrade.id + serviceType in the deep-equality predicate (alongside variation.id, flavor, addOns). If two line items differ in ANY of these fields, they are separate lines.
4. Preserve old behavior for legacy callers (no meta): fields are undefined and do not match any smart-flow lines (so legacy items get their own line, no cross-stacking).

### Test Requirements

- **TR-5.1 (rule)** Add Fish Protocol Mission Sets Basic + drink X + tartar + DINE-IN twice: single line item qty=2.
- **TR-5.2 (rule)** Add Fish Protocol Mission Sets Basic + drink X + tartar + DINE-IN, then add same product/drink but TAKE-AWAY: two distinct lines.
- **TR-5.3 (rule)** getTotalPrice for (varPrice 185 + drinkUpgrade 95 + addOns sum 80) × qty 2 = 720 exactly (assuming specific prices; test with hard-coded test payload with those exact numbers).
- **TR-5.4 (rule)** Legacy addToCart call (no 6th arg) adds a CartItem with `mealMode: undefined`, renders correctly in existing Cart (backward compat).

**Completion Evidence:** Assertion dumps of cartItems array after the scenarios above.

---

## Task 6: Render New CartItem Fields in Cart + MenuItemCard Review

**Status:** pending
**Priority:** medium
**Dependencies:** Task 5
**Covers ACs:** AC-08, AC-11, FR-11

### Description
Update Cart display (and inline variation confirm summary if any) so the new per-item fields appear as readable lines under each cart line.

**Work items:**
1. In `src/components/Cart.tsx`, for each cart line, render, in this order, only when non-empty:
   - `Meal Mode: Ala Carte / Mission Sets`
   - `Set Drink: <name> +₱X`
   - `Service: Having Here / Take Away` (labels, not backend constants)
   - Existing lines: Variation, Flavor, Add-ons — keep in existing order.
2. Keep existing styling (`text-xs text-teamax-secondary font-bold uppercase tracking-wider` with gold value span).
3. In SmartOrderFlow Review step — ensure review summary and Cart lines match text 1:1 (same labels).

### Test Requirements

- **TR-6.1 (rule)** A cart line with mealMode=mission-set, drinkUpgrade present, serviceType=DINE-IN renders exactly 3 new bullet lines before add-ons.
- **TR-6.2 (rule)** A simple non-mission cart line (e.g. Espresso Shot) renders none of the 3 new lines (no empty "Meal Mode: " labels).
- **TR-6.3 (rule)** Service Type display values match spec: display=Having Here when value=DINE-IN; display=Take Away when value=TAKE-AWAY.

**Completion Evidence:** Screenshot of cart with both mission and non-mission line items.

---

## Task 7: Checkout End-to-End Smoke Test & Type Lint Pass

**Status:** pending
**Priority:** medium
**Dependencies:** Task 6
**Covers ACs:** FR-13 (Checkout interface unchanged), NFR-02

### Description
Run project lint/build and walk through checkout to confirm no regressions.

**Work items:**
1. `npm run lint` — pass (no new warnings introduced; pre-existing allowed).
2. `npm run build` — pass; zero TS errors.
3. Manual E2E walk: Mission Sets Fish Protocol (full 6 steps) → Add to Cart → Cart shows all fields → Proceed to Checkout → fill Checkout form → submit → success callback clears cart, returns to menu view.
4. Regression: Social Dining (variation, no drink/service) flow adds correctly.
5. Regression: Coffee Intelligence (no variation items) flow adds correctly.
6. Regression: Cold Operations grouped sub-sections visible; Sweet Endings items present.

### Test Requirements

- **TR-7.1 (rule)** `npm run lint` exit code === 0
- **TR-7.2 (rule)** `npm run build` exit code === 0
- **TR-7.3 (rule)** E2E walkthrough #3 completes; Checkout onSuccess clears smart-flow cart line items correctly.
- **TR-7.4 (rule)** SubNav chips are clickable and each scrolls/filters to exactly one section each (no duplicates/missing).

**Completion Evidence:** Build output + walkthrough checklist sign-off.

---

## Task 8 (Review-only / after remediation if needed): Review Pass Gate Preparation

**Status:** pending
**Priority:** low
**Dependencies:** Task 7
**Covers:** NFR-04

### Description
No implementation work; a checklist holder for the review pass. Ensures every completed task references its TR evidence in the Completion Evidence block below before Review phase starts.

### Completion Evidence (fill during Implement)
