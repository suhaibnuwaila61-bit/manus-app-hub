
-- 1. New table: investment_transactions
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL DEFAULT 'buy',
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  fees NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment_transactions"
ON public.investment_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment_transactions"
ON public.investment_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment_transactions"
ON public.investment_transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment_transactions"
ON public.investment_transactions FOR DELETE
USING (auth.uid() = user_id);

-- 2. Alter investments table
ALTER TABLE public.investments
  ADD COLUMN purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN sector TEXT NOT NULL DEFAULT 'other';

-- 3. Alter lendings table
ALTER TABLE public.lendings
  ADD COLUMN start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN interest_rate NUMERIC NOT NULL DEFAULT 0;
