-- Keep administrator accounts out of all learner-facing data and rankings.
-- Administrators may still preview individual lessons through the admin workspace.

CREATE OR REPLACE FUNCTION public.handle_new_skulkid_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'role', 'student') = 'student' THEN
    INSERT INTO public."Student" (
      "id",
      "displayName",
      "age",
      "dailyGoalXp",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      NEW.id::text,
      COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''), 'Learner'),
      LEAST(18, GREATEST(5, COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 9))),
      60,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "age" = EXCLUDED."age",
      "updatedAt" = CURRENT_TIMESTAMP;
  ELSE
    -- A learner promoted to admin must no longer have a learner identity.
    DELETE FROM public."StudentProfile" WHERE "userId" = NEW.id;
    DELETE FROM public."StudentGameState" WHERE "userId" = NEW.id;
    DELETE FROM public."Student" WHERE "id" = NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

-- Clean up administrator accounts that existed before this trigger was updated.
DELETE FROM public."StudentProfile" profile
USING auth.users account
WHERE profile."userId" = account.id
  AND account.raw_app_meta_data ->> 'role' = 'admin';

DELETE FROM public."StudentGameState" game_state
USING auth.users account
WHERE game_state."userId" = account.id
  AND account.raw_app_meta_data ->> 'role' = 'admin';

DELETE FROM public."Student" student
USING auth.users account
WHERE student."id" = account.id::text
  AND account.raw_app_meta_data ->> 'role' = 'admin';
