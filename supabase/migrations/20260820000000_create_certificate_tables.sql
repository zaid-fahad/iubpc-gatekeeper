-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL DEFAULT 'Default Certificate',
    background_image_url TEXT NOT NULL,
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    orientation TEXT NOT NULL DEFAULT 'landscape',
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'issued',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(event_id, attendee_id)
);

-- Index for fast lookup on verification
CREATE INDEX IF NOT EXISTS idx_certificates_cert_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_event_attendee ON public.certificates(event_id, attendee_id);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage templates & certificates
CREATE POLICY "Allow authenticated users full access to certificate_templates"
ON public.certificate_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to certificates"
ON public.certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read access to certificates for public QR code verification
CREATE POLICY "Allow public read access to certificates for verification"
ON public.certificates FOR SELECT TO anon USING (true);

-- Create Supabase Storage Bucket for Certificate Templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificate-templates', 'certificate-templates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Certificate Templates"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated Upload Certificate Templates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated Update Certificate Templates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated Delete Certificate Templates"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certificate-templates');
