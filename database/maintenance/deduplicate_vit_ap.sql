-- Remove duplicate VIT entries in Andhra Pradesh
DO $$
DECLARE
    keep_id UUID;
BEGIN
    -- 1. Identify the 'primary' ID to keep (e.g., the first one found)
    SELECT id INTO keep_id 
    FROM public.colleges 
    WHERE college_name = 'Vellore Institute of Technology (VIT)' 
    AND state = 'Andhra Pradesh' 
    LIMIT 1;

    -- Proceed only if we found at least one entry
    IF keep_id IS NOT NULL THEN
        
        -- 2. Move any campuses linked to duplicates to the 'primary' ID
        UPDATE public.campuses
        SET college_id = keep_id
        WHERE college_id IN (
            SELECT id FROM public.colleges 
            WHERE college_name = 'Vellore Institute of Technology (VIT)' 
            AND state = 'Andhra Pradesh' 
            AND id != keep_id
        );

        -- 3. Delete the duplicate college entries
        DELETE FROM public.colleges
        WHERE college_name = 'Vellore Institute of Technology (VIT)' 
        AND state = 'Andhra Pradesh' 
        AND id != keep_id;

        -- 4. Ensure Amaravati campus exists for the primary ID
        IF NOT EXISTS (SELECT 1 FROM public.campuses WHERE college_id = keep_id AND campus_name ILIKE '%Amaravati%') THEN
            INSERT INTO public.campuses (campus_name, college_id) VALUES ('Amaravati', keep_id);
        END IF;

    END IF;
END $$;
