-- Remove duplicate 'VIT' college entry
DELETE FROM public.colleges 
WHERE college_name = 'VIT';

-- Verify the remaining entry exists (informational)
-- SELECT * FROM public.colleges WHERE college_name = 'Vellore Institute of Technology (VIT)';
