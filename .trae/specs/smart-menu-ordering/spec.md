# Smart Menu Ordering Flow - Specification

## Problem
The existing menu interface presents a flat product catalog. It does not enforce the Mission 077 multi-step ordering hierarchy (CATEGORY → PRODUCT → VARIATION/SIZE → UPGRADES/ADD-ONS → ORDER REVIEW). Mission Meals require special branching (Ala Carte vs Mission Sets), tiered drink upgrades gated by variation, and a Dine-In / Take-Away capture step. Currently unrelated options appear concurrently; the guest must be shown only the choices that apply to their selected product, mode, and variation in strict sequence.

## Users
- **Guest (Primary)**: Walk-in or remote customer browsing the menu, building a cart, and checking out.
- **Operator (Secondary)**: Staff reviewing order details printed or surfaced in the admin dashboard.

## Goals
1. Present exactly 5 F&B categories in fixed sequence.
2. Enforce a stepwise customization flow where each step is revealed only after the prior step is resolved.
3. For Mission Meals, branch to Ala Carte or Mission Sets; tier drink upgrades by the selected variation (Basic/Classic/Loaded).
4. Capture Having Here / Take Away for Mission Meals and store the backend-normalized values DINE-IN / TAKE-AWAY.
5. Build cart line items that encode meal mode, drink upgrade, add-ons, and service type so the review and checkout screens render a complete audit trail.
6. Keep the experience guest-friendly: clear progress, obvious back navigation, live price roll-up, and a single final "Add to Order" CTA per product.

## Non-Goals
- Payment gateway changes (Checkout screen stays as-is, only cart item payload is enriched).
- Admin panel / Supabase schema changes (menu data is typed in-app for this spec; schema migration is out of scope unless required later).
- Multi-language / localization.
- Guest accounts or saved orders.
- Menu item images (can remain placeholder or existing URLs).

---

## Functional Requirements

### FR-01 Category Presentation
- The 5 main categories appear in exactly this order and no others:
  1. Mission Meals
  2. Social Dining
  3. Coffee Intelligence
  4. Cold Operations – Signature Mocktails
  5. Sweet Endings
- Each category maps to the precise product list in the Appendix.
- Categories without products render empty-state gracefully but must still appear in sequence.

### FR-02 Product Selection
- Selecting a category drills into the product list for that category only.
- Sub-groups within a category (e.g. Refreshers / Tea Series / Coffee Bar Mocktails / Fresh Blends under Cold Operations) are rendered as labeled sections inside the category view but do **not** require a separate navigation step.

### FR-03 Smart Stepwise Flow
- The customization flow follows the hierarchy:
  `CATEGORY → PRODUCT → VARIATION/SIZE → UPGRADES/ADD-ONS → ORDER REVIEW`
- A step is visible **only** when the preceding step has a valid selection.
- The guest may navigate backward (re-open a prior step) and the downstream selections reset if they invalidate.

### FR-04 Mission Meals Order Type Branch
- Mission Meals product selection first presents an order-type toggle: **Ala Carte** or **Mission Sets**.
  - If Ala Carte → VARIATION (Basic/Classic/Loaded) → ADD-ONS → ORDER REVIEW.
  - If Mission Sets → VARIATION (Basic/Classic/Loaded) → DRINK UPGRADE (filtered by variation) → ADD-ONS → ORDER REVIEW.
- Changing the order type resets the downstream selections.

### FR-05 Tiered Drink Upgrades
- Drink upgrade availability is strictly scoped to the chosen Mission Meals variation.
- Programming rule: Basic shows only Basic-designated drink upgrades. Classic shows only Classic-designated. Loaded shows only Loaded-designated.
- Mixing tiers in the UI is a hard failure condition.
- No default drink upgrade is auto-selected; the guest must explicitly pick one or an explicit "No Upgrade" option.

### FR-06 Add-On Filtering
- Add-ons shown are only those linked to the exact product selected.
- Add-ons are multi-select; zero, one, or many add-ons may be chosen.
- Quantity per add-on remains 1 (no qty selector per add-on is required; selecting the same add-on twice increments its quantity in the payload).

### FR-07 Having Here / Take Away (Mission Meals only)
- Before the final ORDER REVIEW card for a Mission Meals item, the prompt **"HOW WOULD YOU LIKE YOUR ORDER?"** shows two choices:
  - **HAVING HERE** → backend value `DINE-IN`
  - **TAKE AWAY** → backend value `TAKE-AWAY`
- A selection is required; no default.
- Display labels stay as "HAVING HERE" and "TAKE AWAY"; POS-facing fields use the normalized values.
- Non-Mission-Meals items skip this step.

### FR-08 Variation Coverage (per category rules)
| Category | Variation behavior |
|---|---|
| Mission Meals (Fish Protocol, Green Status, Beef Directive, Sausage Code) | Basic / Classic / Loaded (required) |
| Social Dining – Mission Crisp | Standard / Trio (required) |
| Social Dining – Dip Crunch Set | Bite Solo / Snack Set / Share Set (required) |
| Social Dining – Sausage Code Bite Set | Bite Solo / Snack Set / Share Set (required) |
| Coffee Intelligence – Espresso Shot | No variation |
| Coffee Intelligence – Black Protocol | Hot (8oz) / Iced (16oz) (required) |
| Coffee Intelligence – Agent Latte | Hot (8oz) / Iced (16oz) (required) |
| Coffee Intelligence – Midnight Brief (Cold Brew) | No variation |
| Cold Operations – all items | No variation |
| Sweet Endings – all items | No variation |

Items with no variation skip the VARIATION/SIZE step entirely and continue to the next applicable step.

### FR-09 Order Review Card
- Before "Add to Order", a review step summarizes:
  - Product name
  - Order type (Ala Carte / Mission Sets — if Mission Meals)
  - Variation / Size
  - Drink upgrade (if Mission Sets)
  - Each selected add-on with its price
  - Service type (Having Here / Take Away — if Mission Meals)
  - Line-item subtotal, add-ons subtotal, and grand total
- A clear "Back" or "Edit" affordance returns to any previous step.

### FR-10 Add to Cart & Continue
- "Add to Order" persists the line item with all selections and returns the guest to the category or menu view.
- A secondary affordance "Continue Ordering" behaves identically but scrolls/focuses the menu list.
- The cart badge increments immediately.

### FR-11 Cart Display Enrichment
- Each cart line item renders:
  - Variation
  - Meal mode (Ala Carte / Mission Sets — if applicable)
  - Drink upgrade (if any)
  - Add-ons list
  - Service type (DINE-IN / TAKE-AWAY — if Mission Meals)
- The cart total matches the sum of enriched line items exactly.

### FR-12 Price Calculation
- Final price = (variation price OR base price) + (drink upgrade price if selected) + (sum of add-on prices).
- Quantity multiplier applies after the above sum.
- Existing discount logic (if base item is on sale) applies to the base/variation price only; upgrades and add-ons are never discounted.
- Prices render with 2 decimals and PHP currency symbol prefix `₱`.

### FR-13 Checkout Compatibility
- The Checkout component must continue to function without changes to its public interface. All new fields are carried inside `CartItem.selectedAddOns` / new fields on CartItem (see tasks for data shape).

---

## Non-Functional Requirements

### NFR-01 Guest Experience
- Navigating a full Mission Meals Mission Sets flow (7 steps inc. review) must complete in < 4 interactions beyond taps on the options themselves (Back counts as interaction).
- Mobile-first UI; bottom-sheet modal for customization (as the existing MenuItemCard uses), with desktop centered panel.

### NFR-02 Determinism
- Same combination of (product + orderType + variation + drinkUpgrade + addOns + serviceType) must hash/dedupe to the same cart line item for quantity stacking in `useCart.addToCart`.

### NFR-03 Bundle Integrity
- No step shall appear that has zero options to choose from (empty choice is a bug, should auto-skip).
- No product shall allow adding to cart while a required step is incomplete.

### NFR-04 Maintainability
- Menu structure (categories, products, variations, add-ons, drink upgrades, tier rules) lives in a single typed data module (`src/data/smartMenu.ts`) so future menu edits are one-liner data changes without component edits.

---

## Constraints
- React 18, TypeScript 5, Vite 5, Tailwind 3, Lucide React — no new runtime dependencies.
- Brand styling class names (`mission-btn`, `mission-card`, `teamax-gold`, etc.) must be preserved; customizations should extend existing design tokens only.
- Data model in `src/types/index.ts` — extend interfaces, do not break existing ones (backwards compatibility with any existing DB records / fallback menu items).
- No Supabase changes required for this spec; the in-app typed data is the source of truth for the new flow. A future task can sync with Supabase if approved.

## Dependencies
- Existing: `useCart` hook, `MenuItemCard` variation modal pattern, `SubNav` category chips, `Menu` sections.
- External: none.

## Assumptions
- Prices for the new menu items (excluding the specific drink upgrade prices already enumerated) will use placeholder values set by product owners or pulled from the existing supabase menu table. Spec requires the structure to support the price fields; exact numeric price values are not acceptance gates (they're business data). However, the Basic-tier drink upgrade prices listed explicitly below MUST be used.
- Mission Meals fish/green/beef/sausage Basic variation → only the 6 listed drink upgrades with their exact PHP prices (`+95`, `+90`, `+145`, `+95`, `+110`, `+115`) are in scope. Classic and Loaded tier drink lists are intentionally left as empty/placeholder arrays for future menu updates; the tier-scoping logic must still work for them.
- DINE-IN / TAKE-AWAY is a per-line-item attribute (not per-order), matching the per-item capture location in the flow.

## Open Questions
1. (Pending) Do Classic/Loaded tier drink upgrades have a product list yet, or stay empty until Phase 2? *Assumption: stay empty arrays; tier filter still operates so no Classic upgrades leak into Basic.*
2. (Pending) Are per-item notes/special instructions required in the review step? *Assumption: out of scope for Phase 1.*
3. (Pending) Should non-Mission-Meals categories also expose Having Here / Take Away? *Spec rule: only Mission Meals per FR-07.*

---

## Appendix — Complete Menu Structure (Source of Truth)

### 1. Mission Meals (order types: Ala Carte, Mission Sets)
| Product | Variations | Add-ons |
|---|---|---|
| Fish Protocol | Basic, Classic, Loaded | Regular Chips, Medium Chips, Large Chips, Extra Tartar Sauce, Extra Spicy Mayo, Plain Rice |
| Green Status | Basic, Classic, Loaded | [same add-ons set as Fish Protocol unless product-specific list provided; use same list initially] |
| Beef Directive | Basic, Classic, Loaded | [same] |
| Sausage Code | Basic, Classic, Loaded | [same] |

Mission Sets Drink Upgrades (per variation tier):
- **Basic tier** → Black Protocol Hot ₱+95, Black Protocol Iced ₱+90, Agent Latte Hot ₱+145, Agent Latte Iced ₱+95, Green Signal ₱+110, Pineapple Chill ₱+115
- **Classic tier** → (placeholder array, enforce filter)
- **Loaded tier** → (placeholder array, enforce filter)

### 2. Social Dining
| Product | Variations |
|---|---|
| Mission Crisp | Standard, Trio |
| Dip Crunch Set | Bite Solo, Snack Set, Share Set |
| Sausage Code Bite Set | Bite Solo, Snack Set, Share Set |

### 3. Coffee Intelligence
| Product | Variations |
|---|---|
| Espresso Shot | (none) |
| Black Protocol | Hot (8oz), Iced (16oz) |
| Agent Latte | Hot (8oz), Iced (16oz) |
| Midnight Brief (Cold Brew) | (none) |

### 4. Cold Operations – Signature Mocktails
(4 sub-sections rendered within the category)
- **Refreshers**: Red Alert, Golden File, Green Signal
- **Tea Series**: Midnight Dossier, Secret Garden
- **Coffee Bar Mocktails**: Blackout, Shadow Protocol
- **Fresh Blends**: Watermelon Rush, Mango Boost, Banana Energy, Pineapple Chill, Berry Reset, Peach Focus

### 5. Sweet Endings
| Product |
|---|
| Honey Brioche Toast |
| Tablea Brownie |

---

## Acceptance Criteria

### AC-01 (rule) Five categories render in fixed order
Evidence: DOM order of category sections/chips matches ["Mission Meals", "Social Dining", "Coffee Intelligence", "Cold Operations – Signature Mocktails", "Sweet Endings"]. Source: page render / SubNav + Menu components.

### AC-02 (rule) Conditional step reveal
Evidence: When opening customization modal, steps after PRODUCT appear one at a time. The VARIATION step is only visible when a product is selected; UPGRADES step only after variation; REVIEW only after all required steps complete. Source: stepping through the flow via UI tests or manual DOM inspection.

### AC-03 (rule) Mission Meals Ala Carte skips drink upgrade
Evidence: Flow for Ala Carte Fish Protocol is PRODUCT → VARIATION → ADD-ONS → DINE-IN/TAKE-AWAY → REVIEW. No drink upgrade card renders. Source: manual click-through.

### AC-04 (rule) Mission Sets tiered drink filter
Evidence: With Basic variation selected, rendered drink upgrade buttons include exactly the 6 Basic-upgrade items and zero Classic/Loaded items. Switching variation to an empty-tier shows "No drink upgrades available for this set level" (or equivalent localized copy). Source: rendered DOM / UI.

### AC-05 (rule) Drink upgrade prices
Evidence: Basic drink upgrades list the exact prices: BP Hot +95, BP Iced +90, AL Hot +145, AL Iced +95, Green Signal +110, Pineapple Chill +115. Source: rendered option labels and total calculation.

### AC-06 (rule) DINE-IN / TAKE-AWAY capture and normalization
Evidence: Mission Meals flow requires a selection and payload CartItem.serviceType is either `DINE-IN` or `TAKE-AWAY` (not "Having Here" / "Take Away"). Source: cart state after adding.

### AC-07 (rule) Non-Mission Meals skip DINE-IN step
Evidence: Opening customization for e.g. Espresso Shot → no "How would you like your order" prompt. Source: manual check.

### AC-08 (rule) Add-to-cart payload completeness
Evidence: After Mission Sets Fish Protocol Basic + Agent Latte Iced upgrade + Medium Chips + Extra Tartar + HAVING HERE + qty 2 → CartItem records mealMode="Mission Sets", selectedVariation.name="Basic", selectedDrinkUpgrade.name="Agent Latte Iced" with +95, selectedAddOns=[Medium Chips, Extra Tartar Sauce], serviceType="DINE-IN", totalPrice = (varPrice + 95 + chips + tartar) * 2. Source: cartItems array + getTotalPrice().

### AC-09 (rule) Back navigation resets downstream
Evidence: On REVIEW step, navigate back and change VARIATION from Basic → Classic. The drink upgrade (if previously set to a Basic-tier drink) is cleared; review totals recalculate. Source: state before/after.

### AC-10 (rule) Price determinism / cart dedupe
Evidence: Adding (same product + same selections) twice without closing modal results in quantity 2 of the same line item id, not two distinct line items. Source: cartItems array length and quantity field.

### AC-11 (rule) Variation-only and no-variation products behave
Evidence: Espresso Shot → no VARIATION card; adds immediately after review (no add-ons either). Agent Latte → Hot/Iced required; form blocks confirm until chosen. Source: manual UI.

### AC-12 (rubric) Flow UX clarity 0–2
- 2: Step titles, progress indicator (e.g. steps 1/5), and Back/Next affordances are unambiguous; first-time users complete a Mission Sets flow in < 1 min without help text.
- 1: Steps exist but labels are confusing OR no progress indicator; user completes with minor hesitation.
- 0: Steps lack labels; user cannot tell what comes next.
Pass threshold: ≥ 2. Evidence: live manual walk-through recording or checklist.

### AC-13 (rubric) Data maintainability 0–2
- 2: Menu edits (e.g. adding a product) only require edits inside `src/data/smartMenu.ts`; zero component code changes.
- 1: 1–2 component edits also required for trivial additions.
- 0: Menu structure hardcoded throughout components.
Pass threshold: ≥ 2. Evidence: code inspection of component imports vs data module.

### AC-14 (rubric) Brand/style fidelity 0–2
- 2: All new UI elements (step headers, option cards, review card, having-here/take-away buttons) use exclusively existing Mission 077 classes: `mission-btn`, `mission-btn-outline`, `mission-card`, `teamax-gold`/`teamax-primary`/`teamax-secondary` color tokens, and the same radii, shadows, and border treatments.
- 1: One or two inline style additions or new tokens without breaking the theme.
- 0: Introduces ad-hoc colors, fonts, or border styles that clash.
Pass threshold: ≥ 2. Evidence: visual inspection of new UI vs existing components.
