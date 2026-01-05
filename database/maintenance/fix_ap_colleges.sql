-- 1. Remove 'Gitame University' from Andhra Pradesh
DELETE FROM public.colleges
WHERE college_name = 'Gitame University'
AND state = 'Andhra Pradesh';

-- 2. Add 'SRM University AP' in Andhra Pradesh
INSERT INTO public.colleges (college_name, state)
VALUES ('SRM University AP', 'Andhra Pradesh');

-- 3. Add 'Amaravati' campus to SRM University AP
DO $$
DECLARE
    srm_ap_id UUID;
BEGIN
    SELECT id INTO srm_ap_id FROM public.colleges WHERE college_name = 'SRM University AP' AND state = 'Andhra Pradesh' LIMIT 1;

    IF srm_ap_id IS NOT NULL THEN
        INSERT INTO public.campuses (campus_name, college_id)
        VALUES ('Amaravati', srm_ap_id);
    END IF;
END $$;
