-- Teacher Kay: Grade 6 Public Learning self-improvement curriculum.
--
-- Creates 5 public subjects, each with:
--   3 strands
--   2 sub-strands per strand
--   10 lessons per strand (30 lessons per subject, 150 total)
--   10-question quiz after every lesson (1,500 quiz questions)
--   approved immutable PublicLearningRevision snapshots
--
-- Rerunnable. Only Teacher Kay subjects whose slug begins
-- "teacher-kay-public-" are replaced.

ALTER TABLE public."TeacherQuiz"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "unitId" text REFERENCES public."Unit"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "topicId" text REFERENCES public."Topic"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "lessonId" text;

CREATE INDEX IF NOT EXISTS "TeacherQuiz_lessonId_idx"
ON public."TeacherQuiz" ("lessonId");

DO $seed$
DECLARE
  teacher_id uuid;
  teacher_count integer;
  curriculum jsonb := $curriculum$
  [
    {
      "key":"friendship",
      "name":"The Art of Friendship",
      "description":"Learn how to know yourself, build healthy friendships, handle disagreements and help everyone feel they belong.",
      "icon":"heart-handshake",
      "colour":"#EC4899",
      "cover":"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      "strands":[
        {
          "name":"Becoming a Good Friend",
          "focus":"Friendship begins with self-awareness, kindness, trust and dependable everyday choices. A good friend listens, keeps appropriate promises, respects differences and acts consistently in public and private.",
          "lessons":["What Friendship Really Means","Knowing My Friendship Strengths","Kindness in Small Actions","Trust Is Built Step by Step","Listening With Full Attention","Being Dependable","Respecting Differences","Including Someone New","Celebrating a Friend Without Envy","My Good-Friend Action Plan"]
        },
        {
          "name":"Growing Healthy Friendships",
          "focus":"Healthy friendships allow both people to speak, grow and spend time with others. Learners practise conversation, cooperation, empathy, encouragement and wise responses to peer pressure.",
          "lessons":["Starting Friendly Conversations","Asking Questions That Show Care","Giving Honest Encouragement","Working Together Fairly","Sharing Without Keeping Score","Understanding Another Viewpoint","Handling Peer Pressure","Friendship Online and Offline","Spotting Healthy and Unhealthy Patterns","Growing a Friendship Over Time"]
        },
        {
          "name":"Repair, Boundaries and Belonging",
          "focus":"Disagreement does not have to end a friendship. Calm communication, sincere apologies, forgiveness, boundaries and adult support help learners repair harm while remaining safe and respectful.",
          "lessons":["Why Friends Sometimes Disagree","Cooling Down Before Responding","Using I-Messages","Apologising Sincerely","Making Amends","Forgiveness Without Ignoring Harm","Setting a Respectful Boundary","Responding to Gossip","When to Ask an Adult for Help","Building a Class Where Everyone Belongs"]
        }
      ]
    },
    {
      "key":"growth-confidence",
      "name":"Growth Mindset and Confidence",
      "description":"Build healthy confidence, learn from mistakes, practise courage and turn meaningful goals into resilient daily action.",
      "icon":"sprout",
      "colour":"#8B5CF6",
      "cover":"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      "strands":[
        {
          "name":"Understanding Growth",
          "focus":"Abilities grow through purposeful practice, useful feedback, effective strategies and time. A growth mindset does not pretend everything is easy; it helps learners respond constructively when learning is difficult.",
          "lessons":["My Brain Can Grow","Fixed Thoughts and Growth Thoughts","The Power of Yet","Mistakes Are Information","Effort With a Good Strategy","Asking for Useful Feedback","Comparing Myself With My Past Self","Learning From Role Models","Turning Weaknesses Into Practice Plans","My Personal Growth Map"]
        },
        {
          "name":"Courage and Self-Belief",
          "focus":"Confidence is a realistic belief that one can prepare, attempt and recover. Courage means choosing a worthwhile action even when fear is present. Self-talk, preparation and gradual practice make brave action more manageable.",
          "lessons":["What Healthy Confidence Looks Like","Naming My Strengths Honestly","Changing Unhelpful Self-Talk","Preparing Before I Perform","Taking One Brave Step","Speaking Up Respectfully","Trying Something New","Receiving Praise Well","Responding to Embarrassment","My Courage Challenge"]
        },
        {
          "name":"Goals, Habits and Resilience",
          "focus":"Meaningful goals become achievable when they are specific, broken into steps and supported by routines. Resilience involves adapting after difficulty, seeking support and returning to the next useful action.",
          "lessons":["Choosing a Meaningful Goal","Making a Goal Specific","Breaking Big Goals Into Steps","Building a Helpful Habit","Designing My Environment","Tracking Progress Without Obsession","What to Do After a Setback","Changing a Strategy That Is Not Working","Building a Support Team","My 30-Day Growth Plan"]
        }
      ]
    },
    {
      "key":"emotional-wellbeing",
      "name":"Emotional Intelligence and Wellbeing",
      "description":"Understand emotions, manage stress safely, develop empathy and learn when and how to seek trusted support.",
      "icon":"brain-heart",
      "colour":"#14B8A6",
      "cover":"https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
      "strands":[
        {
          "name":"Knowing My Emotions",
          "focus":"Emotions provide information but do not control every action. Naming an emotion precisely, noticing body signals and identifying triggers create space for a thoughtful response.",
          "lessons":["Why We Have Emotions","Expanding My Emotion Vocabulary","Noticing Feelings in My Body","Separating Feelings From Actions","Finding the Trigger","Understanding Mixed Emotions","How Thoughts Affect Feelings","Reading Emotional Clues Carefully","Keeping a Mood Journal","My Emotional Weather Report"]
        },
        {
          "name":"Managing Stress and Strong Feelings",
          "focus":"Regulation skills help the body and mind return to a workable state. Slow breathing, grounding, movement, rest, problem-solving and support are healthy tools; different situations may require different combinations.",
          "lessons":["What Stress Feels Like","Pause Before You Act","Breathing to Settle the Body","Using the Five Senses to Ground","Moving My Body Safely","Solving the Problem I Can Control","Making Time for Rest and Sleep","Handling Worry Before a Test","Creating a Calm-Down Plan","When Strong Feelings Need Adult Help"]
        },
        {
          "name":"Empathy, Support and Wellbeing",
          "focus":"Empathy combines noticing, imagining and checking another person's experience without assuming. Support includes listening, validating, offering practical help and involving a trusted adult when safety is at risk.",
          "lessons":["Empathy Is More Than Feeling Sorry","Listen Before Giving Advice","Validating Someone's Feelings","Helping Without Taking Over","Respecting Privacy and Safety","Recognising Loneliness","Supporting a Grieving Friend","Responding to Bullying Safely","Finding Trusted Adults","My Personal Wellbeing Toolkit"]
        }
      ]
    },
    {
      "key":"communication-leadership",
      "name":"Communication and Young Leadership",
      "description":"Communicate clearly, work through conflict, lead with service and help teams make fair, responsible decisions.",
      "icon":"messages-square",
      "colour":"#F97316",
      "cover":"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
      "strands":[
        {
          "name":"Clear and Respectful Communication",
          "focus":"Good communication considers message, audience, channel and feedback. Clear words, active listening, suitable tone, body language and thoughtful questions reduce misunderstanding.",
          "lessons":["The Communication Cycle","Choosing Clear Words","Tone Changes Meaning","Reading Body Language Carefully","Listening and Paraphrasing","Asking Clarifying Questions","Giving Helpful Feedback","Disagreeing Without Disrespect","Speaking to a Group","My Communication Improvement Goal"]
        },
        {
          "name":"Teamwork and Conflict Skills",
          "focus":"Effective teams share a purpose, define roles, include different voices and remain accountable. Conflict can be handled by identifying needs, discussing options and agreeing on a fair next step.",
          "lessons":["What Makes a Team Work","Setting a Shared Goal","Choosing Fair Team Roles","Making Space for Every Voice","Making Decisions Together","Handling a Team Member Who Is Stuck","Finding the Need Behind a Conflict","Brainstorming Win-Win Options","Agreeing and Following Up","Running a Successful Team Reflection"]
        },
        {
          "name":"Leadership Through Service",
          "focus":"Leadership is responsible influence, not control or popularity. Young leaders model values, make ethical decisions, organise action, share credit and serve real needs in their school or community.",
          "lessons":["Leadership Is Not Bossing","Leading by Example","Knowing the People You Serve","Making Fair Decisions","Planning a Small Service Project","Delegating With Trust","Motivating Without Pressure","Owning a Leadership Mistake","Celebrating the Team","My Young-Leader Service Plan"]
        }
      ]
    },
    {
      "key":"study-digital-balance",
      "name":"Smart Study and Digital Balance",
      "description":"Learn how memory works, organise schoolwork, study effectively and build a healthy, safe relationship with digital technology.",
      "icon":"book-check",
      "colour":"#0EA5E9",
      "cover":"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      "strands":[
        {
          "name":"Learning How to Learn",
          "focus":"Durable learning comes from retrieving ideas from memory, spacing practice, explaining in one's own words and mixing related problem types. Rereading can feel easy without proving that knowledge can be recalled.",
          "lessons":["How Memory Builds Connections","Attention Before Memory","Retrieval Practice","Spacing Study Over Time","Explaining in My Own Words","Using Examples and Non-Examples","Mixing Different Problem Types","Making Useful Study Questions","Checking What I Truly Know","My Best Learning Recipe"]
        },
        {
          "name":"Organisation and Independent Study",
          "focus":"Independent learners make work visible, estimate time, choose priorities, prepare materials and review progress. A realistic plan includes focused work, breaks, flexibility and help-seeking.",
          "lessons":["Creating One Homework List","Breaking an Assignment Into Steps","Estimating How Long Work Will Take","Choosing Today's Priorities","Preparing a Focused Study Space","Using a Weekly Study Plan","Taking Notes That Help Later","Starting When I Do Not Feel Ready","Asking for Help Early","My Independent Study System"]
        },
        {
          "name":"Digital Wellbeing and Safe Media",
          "focus":"Digital tools can support learning and connection, but persuasive design can capture attention. Healthy use includes purposeful choices, time boundaries, privacy, source evaluation, respectful conduct and offline rest.",
          "lessons":["What Is My Screen Time For","How Apps Compete for Attention","Turning Off Unhelpful Notifications","Creating Device-Free Times","Protecting Personal Information","Strong Password Habits","Checking Whether Information Is Trustworthy","Responding to Harmful Online Behaviour","Balancing Screens, Sleep and Movement","My Family Digital Balance Agreement"]
        }
      ]
    }
  ]
  $curriculum$::jsonb;
  subject_data jsonb;
  strand_data jsonb;
  lesson_title text;
  subject_index integer;
  strand_index integer;
  lesson_index integer;
  topic_index integer;
  global_lesson_position integer;
  subject_id text;
  unit_id text;
  topic_id text;
  lesson_id text;
  version_id text;
  previous_lesson_id text;
  lesson_description text;
  teaching_text text;
  application_text text;
  lesson_xp integer;
  assessment_blocks jsonb;
  quiz_questions jsonb;
  fixture jsonb;
  record_data jsonb;
  public_snapshot jsonb;
  revision_id uuid;
  timestamp_text text;
BEGIN
  SELECT count(*)
  INTO teacher_count
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND lower(coalesce(raw_app_meta_data ->> 'role', raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin');

  IF teacher_count = 0 THEN
    RAISE EXCEPTION 'Teacher Kay was not found.';
  ELSIF teacher_count > 1 THEN
    RAISE EXCEPTION 'More than one Teacher Kay account was found.';
  END IF;

  SELECT id
  INTO teacher_id
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND lower(coalesce(raw_app_meta_data ->> 'role', raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin')
  LIMIT 1;

  DELETE FROM public."TeacherQuiz"
  WHERE "createdBy" = teacher_id
    AND "courseId" IN (
      SELECT "id" FROM public."Subject"
      WHERE "createdBy" = teacher_id AND "slug" LIKE 'teacher-kay-public-%'
    );

  DELETE FROM public."AdminLessonRecord"
  WHERE "createdBy" = teacher_id
    AND "courseId" IN (
      SELECT "id" FROM public."Subject"
      WHERE "createdBy" = teacher_id AND "slug" LIKE 'teacher-kay-public-%'
    );

  DELETE FROM public."Subject"
  WHERE "createdBy" = teacher_id
    AND "slug" LIKE 'teacher-kay-public-%';

  FOR subject_data, subject_index IN
    SELECT value, ordinality::integer
    FROM jsonb_array_elements(curriculum) WITH ORDINALITY
  LOOP
    timestamp_text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    subject_id := 'teacher-kay-public-' || (subject_data ->> 'key');
    previous_lesson_id := NULL;

    INSERT INTO public."Subject"
      ("id","name","slug","description","icon","colourToken","coverUrl","gradeLevels",
       "order","status","visibility","ownerClassId","createdBy","createdAt","updatedAt")
    VALUES
      (subject_id,subject_data ->> 'name',subject_id,subject_data ->> 'description',
       subject_data ->> 'icon',subject_data ->> 'colour',subject_data ->> 'cover',
       ARRAY[6],100 + subject_index,'ACTIVE','platform',NULL,teacher_id,now(),now());

    FOR strand_data, strand_index IN
      SELECT value, ordinality::integer
      FROM jsonb_array_elements(subject_data -> 'strands') WITH ORDINALITY
    LOOP
      unit_id := subject_id || '-strand-' || lpad(strand_index::text,2,'0');

      INSERT INTO public."Unit"
        ("id","subjectId","name","slug","description","order","createdAt","updatedAt")
      VALUES
        (unit_id,subject_id,strand_data ->> 'name',
         'strand-' || strand_index || '-' || regexp_replace(lower(strand_data ->> 'name'),'[^a-z0-9]+','-','g'),
         strand_data ->> 'focus',strand_index,now(),now());

      FOR topic_index IN 1..2 LOOP
        topic_id := unit_id || '-substrand-' || topic_index;
        INSERT INTO public."Topic"
          ("id","unitId","name","slug","description","order","createdAt","updatedAt")
        VALUES
          (topic_id,unit_id,
           CASE topic_index WHEN 1 THEN 'Understand and Practise' ELSE 'Apply and Reflect' END,
           CASE topic_index WHEN 1 THEN 'understand-and-practise' ELSE 'apply-and-reflect' END,
           CASE topic_index
             WHEN 1 THEN 'Build vocabulary, understanding and guided practice for this strand.'
             ELSE 'Apply the learning to realistic choices, relationships and personal reflection.'
           END,
           topic_index,now(),now());
      END LOOP;

      FOR lesson_title, lesson_index IN
        SELECT value #>> '{}', ordinality::integer
        FROM jsonb_array_elements(strand_data -> 'lessons') WITH ORDINALITY
      LOOP
        topic_index := CASE WHEN lesson_index <= 5 THEN 1 ELSE 2 END;
        topic_id := unit_id || '-substrand-' || topic_index;
        global_lesson_position := ((strand_index - 1) * 10) + lesson_index;
        lesson_id := subject_id || '-lesson-' || lpad(global_lesson_position::text,2,'0');
        version_id := lesson_id || '-v1';
        lesson_xp := CASE
          WHEN lesson_index IN (5,10) THEN 120
          WHEN lesson_index >= 6 THEN 100
          ELSE 90
        END;
        lesson_description := 'Explore ' || lower(lesson_title) ||
          ' through explanations, realistic Grade 6 scenarios, guided practice and reflection.';
        teaching_text := (strand_data ->> 'focus') ||
          ' In this lesson, the specific focus is “' || lesson_title || '”. ' ||
          'Start by defining the idea in your own words and distinguishing it from a similar but less helpful behaviour. ' ||
          'Notice the thoughts, feelings, choices and possible consequences in the situation. A useful response should respect your wellbeing, other people’s dignity and any relevant safety rule. ' ||
          'Good self-improvement is not about being perfect. It means noticing what happened, choosing one realistic next step, practising it and learning from the result.';
        application_text := 'Imagine this Grade 6 situation: a learner at school, at home, in a friendship, in a team or online must use “' ||
          lesson_title || '” to make a thoughtful decision. Identify the people affected, what each person may need, the available choices and the likely short- and long-term consequences. ' ||
          'Choose the safest and most respectful option, explain why it is appropriate, and name a trusted adult who could help if the situation becomes unsafe or too difficult to manage alone.';

        -- Retained only as reference for the original generator. PostgreSQL
        -- variadic JSON handling differs across deployed versions.
        IF false THEN
        SELECT jsonb_agg(jsonb_build_object(
          'id',lesson_id || '-q' || q,
          'type','multiple_choice',
          'order',10 + q,
          'required',true,
          'estimatedSeconds',60,
          'prompt',CASE q
            WHEN 1 THEN 'Which statement best explains “' || lesson_title || '”?'
            WHEN 2 THEN 'Which action is the healthiest first step in this lesson’s scenario?'
            WHEN 3 THEN 'Which response shows respect for both yourself and another person?'
            WHEN 4 THEN 'What information should you consider before deciding?'
            WHEN 5 THEN 'Which consequence is most likely after a thoughtful response?'
            WHEN 6 THEN 'Which choice is a common but unhelpful reaction?'
            WHEN 7 THEN 'How could you communicate your decision clearly?'
            WHEN 8 THEN 'When should a trusted adult become involved?'
            WHEN 9 THEN 'Which reflection question would help you improve next time?'
            ELSE 'Which personal action plan is specific and realistic?'
          END,
          'learningObjectiveIds',jsonb_build_array(lesson_id || '-objective'),
          'difficulty',CASE WHEN lesson_index <= 5 THEN 'beginner' ELSE 'developing' END,
          'xpWeight',1,
          'maximumAttempts',3
        ) || jsonb_build_object(
          'hint','Look for the option that is safe, respectful, specific and connected to the lesson idea.',
          'explanation','The best answer applies ' || lesson_title || ' with care for wellbeing, dignity, consequences and support.',
          'feedbackCorrect','Well done. You applied the lesson idea to a realistic decision.',
          'feedbackIncorrect','Review the scenario. Remove choices that are unsafe, disrespectful or unrelated.',
          'feedbackRetry','Try again and compare the likely consequences of each option.',
          'shuffleOptions',true
        ) || jsonb_build_object(
          'options',jsonb_build_array(
            jsonb_build_object('id','a','label','A','text',
              CASE q
                WHEN 1 THEN 'It is a skill that can be understood, practised and improved through thoughtful choices.'
                WHEN 2 THEN 'Pause, understand the situation and choose a safe, respectful next action.'
                WHEN 3 THEN 'State your need calmly while listening to and respecting the other person.'
                WHEN 4 THEN 'Consider needs, facts, safety, choices, consequences and available support.'
                WHEN 5 THEN 'The situation is more likely to become clear, fair and manageable.'
                WHEN 6 THEN 'Notice the unhelpful reaction, pause and replace it with a deliberate response.'
                WHEN 7 THEN 'Use clear words, a calm tone and a specific request or explanation.'
                WHEN 8 THEN 'When someone may be harmed, boundaries are ignored or the problem feels too big to handle safely.'
                WHEN 9 THEN 'What worked, what did not work and what one action will I try next time?'
                ELSE 'I will practise one named action in a specific situation and review it on a set date.'
              END),
            jsonb_build_object('id','b','label','B','text','React immediately without listening, checking facts or considering consequences.'),
            jsonb_build_object('id','c','label','C','Ignore the situation completely and hope it always disappears on its own.'),
            jsonb_build_object('id','d','label','D','Copy what other people do even when it is unsafe or does not fit the situation.')
          ),
          'correctOptionId','a'
        ) ORDER BY q)
        INTO assessment_blocks
        FROM generate_series(1,10) q;
        END IF;

        -- Build typed records and convert them to JSON. This avoids all
        -- alternating key/value argument handling.
        SELECT jsonb_agg(to_jsonb(question_row) ORDER BY q)
        INTO assessment_blocks
        FROM generate_series(1,10) AS series(q)
        CROSS JOIN LATERAL (
          SELECT
            lesson_id || '-q' || q AS id,
            'multiple_choice'::text AS type,
            10 + q AS "order",
            true AS required,
            60 AS "estimatedSeconds",
            CASE q
              WHEN 1 THEN 'Which statement best explains "' || lesson_title || '"?'
              WHEN 2 THEN 'Which action is the healthiest first step in this lesson''s scenario?'
              WHEN 3 THEN 'Which response shows respect for both yourself and another person?'
              WHEN 4 THEN 'What information should you consider before deciding?'
              WHEN 5 THEN 'Which consequence is most likely after a thoughtful response?'
              WHEN 6 THEN 'Which choice is a common but unhelpful reaction?'
              WHEN 7 THEN 'How could you communicate your decision clearly?'
              WHEN 8 THEN 'When should a trusted adult become involved?'
              WHEN 9 THEN 'Which reflection question would help you improve next time?'
              ELSE 'Which personal action plan is specific and realistic?'
            END AS prompt,
            to_jsonb(ARRAY[lesson_id || '-objective']) AS "learningObjectiveIds",
            CASE WHEN lesson_index <= 5 THEN 'beginner' ELSE 'developing' END AS difficulty,
            1::numeric AS "xpWeight",
            3 AS "maximumAttempts",
            'Look for the safe, respectful, specific option connected to the lesson.'::text AS hint,
            'The best answer applies the lesson with care for wellbeing, dignity, consequences and support.'::text AS explanation,
            'Well done. You applied the lesson idea to a realistic decision.'::text AS "feedbackCorrect",
            'Review the scenario and remove unsafe, disrespectful or unrelated choices.'::text AS "feedbackIncorrect",
            'Try again and compare the likely consequences of each option.'::text AS "feedbackRetry",
            true AS "shuffleOptions",
            (
              SELECT jsonb_agg(to_jsonb(option_row) - 'option_order' ORDER BY option_order)
              FROM (
                SELECT
                  option_order,
                  option_id AS id,
                  option_label AS label,
                  option_text AS text
                FROM (
                  VALUES
                    (1,'a','A',CASE q
                      WHEN 1 THEN 'It is a skill that can be understood, practised and improved through thoughtful choices.'
                      WHEN 2 THEN 'Pause, understand the situation and choose a safe, respectful next action.'
                      WHEN 3 THEN 'State your need calmly while listening to and respecting the other person.'
                      WHEN 4 THEN 'Consider needs, facts, safety, choices, consequences and available support.'
                      WHEN 5 THEN 'The situation is more likely to become clear, fair and manageable.'
                      WHEN 6 THEN 'Notice the unhelpful reaction, pause and replace it with a deliberate response.'
                      WHEN 7 THEN 'Use clear words, a calm tone and a specific request or explanation.'
                      WHEN 8 THEN 'Involve an adult when harm is possible, boundaries are ignored or the problem is unsafe.'
                      WHEN 9 THEN 'Ask what worked, what did not work and what one action to try next time.'
                      ELSE 'Practise one named action in a specific situation and review it on a set date.'
                    END),
                    (2,'b','B','React immediately without listening, checking facts or considering consequences.'),
                    (3,'c','C','Ignore the situation completely and hope it always disappears on its own.'),
                    (4,'d','D','Copy what others do even when it is unsafe or does not fit the situation.')
                ) AS option_values(option_order,option_id,option_label,option_text)
              ) AS option_row
            ) AS options,
            'a'::text AS "correctOptionId"
        ) AS question_row;

        fixture := jsonb_build_object(
          'subjects',jsonb_build_array(jsonb_build_object(
            'id',subject_id,'name',subject_data ->> 'name','slug',subject_id,
            'description',subject_data ->> 'description','icon',subject_data ->> 'icon',
            'colourToken',subject_data ->> 'colour','gradeLevels',jsonb_build_array(6),
            'order',100 + subject_index,'status','active','createdAt',timestamp_text,'updatedAt',timestamp_text
          )),
          'units',jsonb_build_array(jsonb_build_object(
            'id',unit_id,'subjectId',subject_id,'name',strand_data ->> 'name',
            'slug','strand-' || strand_index,'description',strand_data ->> 'focus',
            'order',strand_index,'createdAt',timestamp_text,'updatedAt',timestamp_text
          )),
          'topics',jsonb_build_array(jsonb_build_object(
            'id',topic_id,'unitId',unit_id,
            'name',CASE topic_index WHEN 1 THEN 'Understand and Practise' ELSE 'Apply and Reflect' END,
            'slug',CASE topic_index WHEN 1 THEN 'understand-and-practise' ELSE 'apply-and-reflect' END,
            'description','Personal-development activities and reflection.',
            'order',topic_index,'createdAt',timestamp_text,'updatedAt',timestamp_text
          )),
          'lessons',jsonb_build_array(jsonb_build_object(
            'id',lesson_id,'topicId',topic_id,'title',lesson_title,
            'slug',regexp_replace(lower(lesson_title),'[^a-z0-9]+','-','g'),
            'shortDescription',lesson_description,'order',global_lesson_position,
            'prerequisiteLessonId',previous_lesson_id,'createdAt',timestamp_text,'updatedAt',timestamp_text
          )),
          'lessonVersions',jsonb_build_array(jsonb_build_object(
            'id',version_id,'lessonId',lesson_id,'versionNumber',1,'status','published',
            'title',lesson_title,'description',lesson_description,
            'objectiveSummary','Explain, practise and reflect on ' || lower(lesson_title) || '.',
            'difficulty',CASE WHEN lesson_index <= 5 THEN 'beginner' ELSE 'developing' END,
            'estimatedMinutes',25,'baseXpReward',lesson_xp,'passingScore',70,'masteryScore',90,
            'maximumLessonRedos',3,'publishedAt',timestamp_text,
            'learningObjectives',jsonb_build_array(jsonb_build_object(
              'id',lesson_id || '-objective','lessonVersionId',version_id,
              'code','LIFE.G6.' || subject_index || '.' || strand_index || '.' || lesson_index,
              'description','Explain and apply ' || lower(lesson_title) || ' in an age-appropriate situation.',
              'order',1
            )),
            'blocks',
              jsonb_build_array(
                jsonb_build_object(
                  'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,
                  'estimatedSeconds',60,'title',lesson_title,'shortDescription',lesson_description,
                  'objectives',jsonb_build_array(
                    'Explain ' || lower(lesson_title) || ' in your own words.',
                    'Apply the skill to a realistic Grade 6 situation.',
                    'Choose one safe and specific way to practise the skill.'
                  ),
                  'estimatedMinutes',25,
                  'rewardPreview',jsonb_build_object('xp',lesson_xp,'starsAvailable',3)
                ),
                jsonb_build_object(
                  'id',lesson_id || '-warmup','type','reflection','order',2,'required',false,
                  'estimatedSeconds',90,
                  'prompt','Before the lesson, what do you think “' || lesson_title || '” means? Give one example.',
                  'responseType','short_text','optional',true
                ),
                jsonb_build_object(
                  'id',lesson_id || '-teach','type','text','order',3,'required',true,
                  'estimatedSeconds',420,'heading','Understand the skill','body',teaching_text,
                  'emphasisTerms',jsonb_build_array(lesson_title,'choice','consequence','practice')
                ),
                jsonb_build_object(
                  'id',lesson_id || '-scenario','type','text','order',4,'required',true,
                  'estimatedSeconds',300,'heading','Think through a real situation','body',application_text,
                  'emphasisTerms',jsonb_build_array('safety','respect','support','trusted adult')
                ),
                jsonb_build_object(
                  'id',lesson_id || '-example','type','worked_example','order',5,'required',true,
                  'estimatedSeconds',300,'title','A four-step decision model',
                  'problem','How can a Grade 6 learner use ' || lower(lesson_title) || ' in a difficult but realistic situation?',
                  'orderedSteps',jsonb_build_array(
                    'STOP: Pause long enough to notice feelings, facts and immediate safety.',
                    'THINK: Identify needs, choices, consequences and people who can help.',
                    'CHOOSE: Select a respectful, safe and realistic action connected to the lesson.',
                    'REVIEW: Check the result, repair any harm and decide what to practise next.'
                  ),
                  'finalAnswer','Use the STOP–THINK–CHOOSE–REVIEW process and ask a trusted adult for help whenever safety or serious harm is involved.',
                  'explanation','The model slows down impulsive reactions and turns the lesson idea into an action that can be checked and improved.'
                ),
                jsonb_build_object(
                  'id',lesson_id || '-tip','type','tip','order',6,'required',true,
                  'estimatedSeconds',90,'title','Remember','tone','remember',
                  'body','Self-improvement is practice, not perfection. A small action repeated honestly is more useful than a big promise that is never practised.'
                )
              ) || assessment_blocks ||
              jsonb_build_array(
                jsonb_build_object(
                  'id',lesson_id || '-reflection','type','reflection','order',22,'required',false,
                  'estimatedSeconds',120,
                  'prompt','Write one thing you learned, one situation where you could use it, and one specific action you will practise this week.',
                  'responseType','short_text','optional',true
                ),
                jsonb_build_object(
                  'id',lesson_id || '-summary','type','summary','order',23,'required',true,
                  'estimatedSeconds',60,'heading','Your mission summary',
                  'keyPoints',jsonb_build_array(
                    lesson_title || ' is a skill that improves with understanding and practice.',
                    'Thoughtful choices consider facts, feelings, safety, respect and consequences.',
                    'Clear communication and trusted support make difficult situations easier to manage.',
                    'Reflection helps turn one experience into better action next time.'
                  ),
                  'nextStepText','Complete the quiz, review any missed answer and practise your chosen action before the next lesson.'
                )
              ),
            'createdAt',timestamp_text,'updatedAt',timestamp_text
          ))
        );

        record_data := jsonb_build_object(
          'id',lesson_id,'subject','english-language','courseId',subject_id,'unitId',unit_id,'topicId',topic_id,
          'grade',6,'unit',strand_data ->> 'name','chapter',strand_data ->> 'name',
          'topic',CASE topic_index WHEN 1 THEN 'Understand and Practise' ELSE 'Apply and Reflect' END,
          'contentStandard','Grade 6 personal development','indicator','LIFE.G6.' || subject_index || '.' || strand_index || '.' || lesson_index,
          'lessonNumber',global_lesson_position,'title',lesson_title,'description',lesson_description,
          'estimatedMinutes',25,'xp',lesson_xp,'questionCount',10,'format','text',
          'prerequisiteLessonId',previous_lesson_id,
          'gamification',jsonb_build_object(
            'passingScore',70,'masteryScore',90,'maximumAttempts',3,'lessonRetries',3,
            'maximumXp',lesson_xp + 100,
            'badge',CASE lesson_index WHEN 10 THEN 'Strand Champion' ELSE 'Life Skills Explorer' END
          ),
          'status','published','createdAt',timestamp_text,'updatedAt',timestamp_text,
          'fixture',fixture,'createdBy',teacher_id
        );

        INSERT INTO public."AdminLessonRecord"
          ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
        VALUES
          (lesson_id,'english-language','published',global_lesson_position,record_data,
           teacher_id,subject_id,unit_id,topic_id,now(),now());

        SELECT jsonb_agg(jsonb_build_object(
          'id','q-' || q,
          'prompt',assessment_blocks -> (q - 1) ->> 'prompt',
          'type','multiple_choice',
          'options',jsonb_build_array(
            assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
          ),
          'correctIndex',0,
          'explanation','The correct response applies ' || lesson_title || ' safely, respectfully and specifically.'
        ) ORDER BY q)
        INTO quiz_questions
        FROM generate_series(1,10) q;

        INSERT INTO public."TeacherQuiz"
          ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
           "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
        VALUES
          (teacher_id,lesson_title || ' - Life Skills Quiz',
           '[SKULKID-PUBLIC-SEED] Ten-question quiz after ' || lesson_title,
           'general',ARRAY[6],quiz_questions,70,70,3,1,'ready',
           subject_id,unit_id,topic_id,lesson_id,now(),now());

        previous_lesson_id := lesson_id;
      END LOOP;
    END LOOP;

    -- Create the immutable learner-facing snapshot expected by Public Learning.
    SELECT jsonb_build_object(
      'course',jsonb_build_object(
        'id',s.id,'name',s.name,'slug',s.slug,'description',s.description,
        'color',s."colourToken",'coverUrl',s."coverUrl",'gradeLevels',to_jsonb(s."gradeLevels"),'order',s."order"
      ),
      'units',coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id',u.id,'subjectId',u."subjectId",'title',u.name,'slug',u.slug,
          'description',u.description,'order',u."order",
          'topics',coalesce((
            SELECT jsonb_agg(jsonb_build_object(
              'id',t.id,'unitId',t."unitId",'title',t.name,'slug',t.slug,
              'description',t.description,'order',t."order",
              'lessonIds',coalesce((
                SELECT jsonb_agg(l.id ORDER BY l.position)
                FROM public."AdminLessonRecord" l
                WHERE l."topicId" = t.id AND l.status = 'published'
              ),'[]'::jsonb)
            ) ORDER BY t."order")
            FROM public."Topic" t WHERE t."unitId" = u.id
          ),'[]'::jsonb)
        ) ORDER BY u."order")
        FROM public."Unit" u WHERE u."subjectId" = s.id
      ),'[]'::jsonb),
      'lessons',coalesce((
        SELECT jsonb_agg(
          l.record ||
          jsonb_build_object(
            'classId',l."classId",'courseId',l."courseId",'unitId',l."unitId",'topicId',l."topicId"
          )
          ORDER BY l.position
        )
        FROM public."AdminLessonRecord" l
        WHERE l."courseId" = s.id AND l.status = 'published'
      ),'[]'::jsonb)
    )
    INTO public_snapshot
    FROM public."Subject" s
    WHERE s.id = subject_id;

    INSERT INTO public."PublicLearningRevision"
      ("courseId","version","status","snapshot","contentHash","submittedBy","submittedAt",
       "reviewedBy","reviewedAt","reviewNote","publishedAt")
    VALUES
      (subject_id,1,'approved',public_snapshot,md5(public_snapshot::text),teacher_id,now(),
       NULL,now(),'Approved demonstration seed for Grade 6 Public Learning.',now())
    RETURNING id INTO revision_id;

    UPDATE public."Subject"
    SET "currentPublicRevisionId" = revision_id,
        "status" = 'ACTIVE',
        "visibility" = 'platform',
        "updatedAt" = now()
    WHERE id = subject_id;
  END LOOP;

  RAISE NOTICE 'Created 5 public subjects, 15 strands, 30 sub-strands, 150 lessons and 150 lesson quizzes for Teacher Kay.';
END
$seed$;

-- Verification summary.
SELECT
  s.name AS public_subject,
  count(DISTINCT u.id) AS strands,
  count(DISTINCT t.id) AS sub_strands,
  count(DISTINCT l.id) AS lessons,
  count(DISTINCT q.id) AS quizzes,
  r.status AS publication_status,
  r."publishedAt" AS published_at
FROM public."Subject" s
JOIN public."Unit" u ON u."subjectId" = s.id
JOIN public."Topic" t ON t."unitId" = u.id
JOIN public."AdminLessonRecord" l ON l."topicId" = t.id
LEFT JOIN public."TeacherQuiz" q ON q."lessonId" = l.id
LEFT JOIN public."PublicLearningRevision" r ON r.id = s."currentPublicRevisionId"
WHERE s.slug LIKE 'teacher-kay-public-%'
GROUP BY s.id,s.name,r.status,r."publishedAt"
ORDER BY s."order";
