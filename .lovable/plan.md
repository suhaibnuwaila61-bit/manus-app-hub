

# Investment & Lending Enhancement Plan

## Overview
Upgrade the Investments page into a full portfolio management tool with buy/sell transaction history, profit calculators, and cumulative margin tracking. Add dates and deadlines to the Lendings section.

## Database Changes

### 1. New table: `investment_transactions`
Records every buy/sell action per investment:
- `id`, `user_id`, `investment_id` (FK to investments), `action` (buy/sell), `quantity`, `price_per_unit`, `total_amount`, `fees`, `notes`, `transaction_date`, `created_at`
- RLS: user can CRUD own records

### 2. Alter `investments` table
Add columns:
- `purchase_date` (timestamptz, default now())
- `notes` (text, default '')
- `sector` (text, default 'other')

### 3. Alter `lendings` table
Add columns:
- `start_date` (timestamptz, default now()) — when the lending/borrowing started
- `due_date` (timestamptz, nullable) — repayment deadline
- `interest_rate` (numeric, default 0) — optional interest %

## Investments Page Enhancements (`src/pages/Investments.tsx`)

### New Features:
1. **Buy/Sell Transaction Log** — Each investment shows a history of buy/sell actions. Users can record a "Sell" against an existing holding (reduces quantity, records profit/loss).
2. **Investment Calculator** — Built-in calculator panel:
   - ROI calculator: enter buy price, sell price, quantity, fees → shows net profit, ROI %
   - Compound growth calculator: enter principal, rate, years → shows projected value
3. **Cumulative Margins** — New stat cards:
   - Realized gains (from completed sells)
   - Unrealized gains (from current holdings)
   - Total return % across portfolio
4. **Portfolio breakdown by asset type** — visual summary showing allocation percentages
5. **Sell button** on each investment — opens a sell form that records the transaction and adjusts quantity
6. **Purchase date** shown on each investment card
7. **Expandable investment cards** — click to see transaction history for that asset

### New Stats:
- Realized P&L, Unrealized P&L, Total Return %, Best/Worst performer

## Lendings Page Enhancements (`src/pages/Lendings.tsx`)

### New Features:
1. **Start date** field in the add form (date picker)
2. **Due date / deadline** field in the add form (date picker)
3. **Interest rate** optional field
4. **Visual deadline indicators**:
   - Days remaining until due date
   - Color-coded: green (>30 days), yellow (7-30 days), red (<7 days), gray (overdue)
5. **Interest calculation** — if interest rate is set, show accrued interest on outstanding amount
6. **Dates displayed** on each lending card (start date, due date with countdown)

## i18n Updates (`src/lib/i18n.ts`)

Add ~30 new translation keys for both English and Arabic covering: buy, sell, realizedGain, unrealizedGain, totalReturn, roi, compoundGrowth, principal, rate, years, projectedValue, fees, startDate, dueDate, interestRate, daysUntilDue, overdue, sellInvestment, transactionHistory, calculator, etc.

## Files to Create/Modify
- **Migration**: New `investment_transactions` table + alter `investments` and `lendings` tables
- **`src/pages/Investments.tsx`**: Major rewrite with tabs (Portfolio / Calculator / History), sell flow, expanded cards
- **`src/pages/Lendings.tsx`**: Add date pickers, deadline display, interest fields
- **`src/lib/i18n.ts`**: New translation keys in both languages

