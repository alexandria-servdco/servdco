-- Enum values for transfer retry pipeline (must run before column/index migration)

ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'action_required';
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'retry_scheduled';
