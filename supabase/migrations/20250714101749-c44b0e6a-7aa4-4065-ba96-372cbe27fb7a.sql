-- Create reports table to store all generated reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  industry TEXT NOT NULL,
  process_data JSONB NOT NULL,
  pdf_report TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_session_id TEXT,
  amount INTEGER DEFAULT 9900, -- $99.00 in cents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for admin review)
CREATE POLICY "Allow public insert" ON public.reports
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.reports
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update" ON public.reports
  FOR UPDATE 
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();