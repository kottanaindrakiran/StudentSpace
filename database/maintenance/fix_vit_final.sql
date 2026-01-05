-- Comprehensive fix for VIT Campuses

DO $$
DECLARE
    vit_tn_id UUID;
    vit_ap_id UUID;
BEGIN
    -- 1. Get College IDs
    SELECT id INTO vit_tn_id FROM public.colleges WHERE college_name = 'Vellore Institute of Technology (VIT)' AND state = 'Tamil Nadu';
    SELECT id INTO vit_ap_id FROM public.colleges WHERE college_name = 'Vellore Institute of Technology (VIT)' AND state = 'Andhra Pradesh';

    -- Create VIT AP if it doesn't exist (safety check)
    IF vit_ap_id IS NULL THEN
        INSERT INTO public.colleges (college_name, state) VALUES ('Vellore Institute of Technology (VIT)', 'Andhra Pradesh') RETURNING id INTO vit_ap_id;
    END IF;

    -- 2. Move 'Amaravati (AP)' to VIT AP
    UPDATE public.campuses
    SET college_id = vit_ap_id
    WHERE college_id = vit_tn_id
    AND (campus_name ILIKE '%Amaravati%' OR campus_name ILIKE '%AP%');

    -- 3. Ensure 'Vellore' and 'Chennai' are in VIT TN
    -- We'll use INSERT ON CONFLICT DO NOTHING logic conceptually by checking existence
    
    -- Check/Insert Vellore
    IF NOT EXISTS (SELECT 1 FROM public.campuses WHERE college_id = vit_tn_id AND campus_name = 'Vellore') THEN
        INSERT INTO public.campuses (campus_name, college_id) VALUES ('Vellore', vit_tn_id);
    END IF;

    -- Check/Insert Chennai
    IF NOT EXISTS (SELECT 1 FROM public.campuses WHERE college_id = vit_tn_id AND campus_name = 'Chennai') THEN
        INSERT INTO public.campuses (campus_name, college_id) VALUES ('Chennai', vit_tn_id);
    END IF;

    -- 4. CLEANUP: Delete any 'Amaravati' that might still be lingering in TN if update failed (e.g. duplicates)
    DELETE FROM public.campuses 
    WHERE college_id = vit_tn_id 
    AND (campus_name ILIKE '%Amaravati%' OR campus_name ILIKE '%AP%');

END $$;
