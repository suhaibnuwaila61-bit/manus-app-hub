
CREATE TABLE public.gmail_sync_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  access_token text NOT NULL DEFAULT '',
  refresh_token text NOT NULL DEFAULT '',
  token_expires_at timestamp with time zone,
  email_filters text[] NOT NULL DEFAULT '{}',
  last_sync_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  sync_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.gmail_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gmail_sync_config"
  ON public.gmail_sync_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail_sync_config"
  ON public.gmail_sync_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail_sync_config"
  ON public.gmail_sync_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail_sync_config"
  ON public.gmail_sync_config FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gmail_sync_config_updated_at
  BEFORE UPDATE ON public.gmail_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
