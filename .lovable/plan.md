

# Real AI Financial Advisor — Implementation Plan

## What We're Building

Replace the current fake/random responses with a real AI-powered financial advisor that:
- **Knows your complete financial picture** — all transactions, investments, budgets, goals, and lendings are sent as context
- **Understands risk** — analyzes your portfolio diversification, debt-to-income ratio, savings buffer
- **Helps with decisions** — gives personalized advice like "should I invest or pay off debt first?"
- **Streams responses** in real-time (tokens appear as they arrive)
- **Renders markdown** for well-formatted advice with bullet points, tables, bold text

## How It Works

```text
User types question
       │
       ▼
Frontend collects ALL financial data
(transactions, investments, budgets, goals, lendings)
       │
       ▼
Sends { messages, financialContext } to Edge Function
       │
       ▼
Edge Function builds a detailed system prompt:
  "You are a financial advisor. Here is the user's data:
   - Income: $X/mo, Expenses: $Y/mo
   - Savings rate: Z%
   - Portfolio: [stocks, bonds...]
   - Debts/lendings: [...]
   - Goals: [...]
   - Budgets: [...]
   Analyze risk, give actionable advice."
       │
       ▼
Calls Lovable AI (Gemini) with streaming
       │
       ▼
Tokens stream back to the UI in real-time
```

## Implementation Steps

### 1. Create Edge Function (`supabase/functions/financial-advisor/index.ts`)
- Accepts `{ messages, financialContext }` from the frontend
- Builds a comprehensive system prompt that instructs the AI to act as a certified financial advisor
- The system prompt includes the user's full financial snapshot (income, expenses, savings rate, portfolio breakdown, goals progress, budget utilization, lending/borrowing status)
- Instructs the AI on risk assessment frameworks (conservative/moderate/aggressive), debt management strategies, and to always caveat that it's not a licensed advisor
- Streams the response via SSE using Lovable AI gateway
- Handles 429/402 errors gracefully

### 2. Update AI Assistant Page (`src/pages/AIAssistant.tsx`)
- Before sending a message, serialize all financial data into a `financialContext` object
- Replace the fake `setTimeout` with real streaming calls to the edge function
- Render AI responses with `react-markdown` for proper formatting
- Show tokens as they arrive (real-time streaming)
- Update suggested questions to be more decision-oriented: "Should I pay off debt or invest?", "What's my risk level?", "Am I on track for my goals?"

### 3. Install `react-markdown` package
- For rendering AI responses with proper formatting (headers, lists, bold, tables)

## The System Prompt Strategy

The AI will receive a structured financial summary like:

```text
FINANCIAL SNAPSHOT:
- Monthly Income: $5,000 | Monthly Expenses: $3,800 | Savings Rate: 24%
- Emergency Fund: $2,000 (covers 0.5 months — target is 3-6 months)
- Portfolio: 3 stocks worth $12,000 (80% tech — low diversification)
- Active Goals: "House Down Payment" — $15,000/$50,000 (30%, deadline Dec 2025)
- Budgets: Food $500/$600 (83% used), Entertainment $200/$300 (67% used)
- Lendings: Owed $2,000 to Ahmed (pending), Borrowed $5,000 from Bank (partial repaid)
- Top Expense Categories: Rent $1,500, Food $500, Transport $300

ADVISOR RULES:
- Assess risk tolerance based on portfolio concentration and savings buffer
- Flag overexposure to single sectors
- Prioritize debt repayment vs. investing based on interest rates
- Give specific, actionable steps (not generic advice)
- Support both English and Arabic responses based on user language
```

This gives the AI everything it needs to provide personalized, data-driven advice on any financial decision.

## Technical Details

- **Model**: `google/gemini-3-flash-preview` (fast, good reasoning, no extra cost)
- **API Key**: `LOVABLE_API_KEY` already configured — no user action needed
- **Streaming**: SSE-based token streaming for responsive UX
- **No data persistence**: Chat is session-only (no conversation storage needed unless requested)

