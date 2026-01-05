-- HARD RESET for VIT Data
-- This script deletes ALL VIT entries and re-creates them properly to ensure no bad data remains.

-- 1. Use a Transaction to ensure all or nothing
BEGIN;

-- 2. Delete ALL existing VIT College Entries (and cascade to campuses)
-- We search by name pattern to catch "VIT", "Vellore Institute...", etc.
DELETE FROM public.colleges 
WHERE college_name ILIKE '%VIT%' 
   OR college_name ILIKE '%Vellore Institute%';

-- 3. Re-Insert VIT for TAMIL NADU
INSERT INTO public.colleges (college_name, state)
VALUES ('Vellore Institute of Technology (VIT)', 'Tamil Nadu');

-- 4. Re-Insert VIT for ANDHRA PRADESH
INSERT INTO public.colleges (college_name, state)
VALUES ('Vellore Institute of Technology (VIT)', 'Andhra Pradesh');

-- 5. Add Campuses for TAMIL NADU
DO $$
DECLARE
    vit_tn_id UUID;
BEGIN
    SELECT id INTO vit_tn_id FROM public.colleges 
    WHERE college_name = 'Vellore Institute of Technology (VIT)' AND state = 'Tamil Nadu';

    INSERT INTO public.campuses (campus_name, college_id) VALUES ('Vellore', vit_tn_id);
    INSERT INTO public.campuses (campus_name, college_id) VALUES ('Chennai', vit_tn_id);
END $$;

-- 6. Add Campuses for ANDHRA PRADESH
DO $$
DECLARE
    vit_ap_id UUID;
BEGIN
    SELECT id INTO vit_ap_id FROM public.colleges 
    WHERE college_name = 'Vellore Institute of Technology (VIT)' AND state = 'Andhra Pradesh';

    INSERT INTO public.campuses (campus_name, college_id) VALUES ('Amaravati (AP)', vit_ap_id);
END $$;

COMMIT;
