ALTER TABLE public."ClassMessage"
  ADD COLUMN IF NOT EXISTS "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."TeacherNotification"
  ADD COLUMN IF NOT EXISTS "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES (
  'teacher-message-attachments',
  'teacher-message-attachments',
  false,
  15728640,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav',
    'application/pdf','text/plain','text/csv',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public=false,
  file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN public."ClassMessage"."attachments"
IS 'Teacher-only attachment metadata. Object paths are private and signed server-side.';
COMMENT ON COLUMN public."TeacherNotification"."attachments"
IS 'Teacher-only attachment metadata. Object paths are private and signed server-side.';
