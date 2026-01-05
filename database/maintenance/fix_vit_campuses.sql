-- 1. Insert new College entry for VIT in Andhra Pradesh
INSERT INTO public.colleges (college_name, state)
VALUES ('Vellore Institute of Technology (VIT)', 'Andhra Pradesh');

-- 2. Move 'Amaravati (AP)' campus to the new AP college
-- We use a CTE or subquery to ensure we get the correct IDs

DO $$
DECLARE
    new_college_id UUID;
    old_college_id UUID;
BEGIN
    -- Get the ID of the newly created AP college
    SELECT id INTO new_college_id 
    FROM public.colleges 
    WHERE college_name = 'Vellore Institute of Technology (VIT)' 
    AND state = 'Andhra Pradesh' 
    LIMIT 1;

    -- Get the ID of the existing TN college (assuming it exists as 'Vellore Institute of Technology (VIT)')
    -- We filter by Tamil Nadu to be safe, or just take the one that ISN'T the new one if state matches
    SELECT id INTO old_college_id
    FROM public.colleges
    WHERE college_name = 'Vellore Institute of Technology (VIT)' 
    AND state = 'Tamil Nadu'
    LIMIT 1;

    -- Update the campus
    -- Assuming the campus name is 'Amaravati (AP)' or similar. We'll use ILIKE for safety.
    UPDATE public.campuses
    SET college_id = new_college_id
    WHERE campus_name ILIKE '%Amaravati%'
    AND college_id = old_college_id;
    
    -- Optional: If there are other campuses like 'Bhopal' that should be moved to MP, similar logic applies.
    -- But for now, focusing on the user request.

END $$;
