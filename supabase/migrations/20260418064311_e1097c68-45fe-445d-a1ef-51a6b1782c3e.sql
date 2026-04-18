CREATE TABLE public.notification_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_received INTEGER NOT NULL DEFAULT 0,
  total_imported INTEGER NOT NULL DEFAULT 0,
  last_received_at TIMESTAMP WITH TIME ZONE,
  app_filter TEXT NOT NULL DEFAULT 'ADCB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook" ON public.notification_webhooks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhook" ON public.notification_webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhook" ON public.notification_webhooks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhook" ON public.notification_webhooks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notification_webhooks_token ON public.notification_webhooks(token);

CREATE TRIGGER update_notification_webhooks_updated_at
  BEFORE UPDATE ON public.notification_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();