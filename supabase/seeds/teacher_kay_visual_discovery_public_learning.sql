-- Teacher Kay: media-led, all-grades Public Learning subject.
-- Rerunnable: replaces only teacher-kay-visual-discovery.

DO $seed$
DECLARE
  teacher_id uuid;
  teacher_count integer;
  subject_id text := 'teacher-kay-visual-discovery';
  unit_id text;
  topic_id text;
  lesson_id text;
  version_id text;
  revision_id uuid;
  public_snapshot jsonb;
  fixture jsonb;
  record_data jsonb;
  item record;
  timestamp_text text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  visual_media_bank jsonb := $visual_media_bank$
{"The Water Cycle From Above":{"videos":[{"url":"https://www.youtube.com/watch?v=ncORPosDrjI","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=IO9tT186mZw","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=z5G4NCwWUxY","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"What is evaporation?","type":"multiple_choice","options":["Water turning into vapour","Water freezing only","Rocks melting","Soil vanishing"],"correctIndex":0,"explanation":"Heat turns liquid water into vapour."},{"prompt":"Condensation helps form:","type":"multiple_choice","options":["Clouds from tiny droplets","Only mountains","Only magnets","Only plastic"],"correctIndex":0,"explanation":"Cooling vapour forms droplets."},{"prompt":"Precipitation can be:","type":"multiple_choice","options":["Rain, hail or snow","Only sunlight","Only wind names","Only soil colour"],"correctIndex":0,"explanation":"Water falling from clouds."},{"prompt":"True or false: The water cycle is continuous.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It repeats."},{"prompt":"Collection means water gathers in:","type":"multiple_choice","options":["Rivers, lakes, oceans and ground","Only books","Only apps","Only desks"],"correctIndex":0,"explanation":"Water collects on Earth."},{"prompt":"Which energy source drives much of the cycle?","type":"multiple_choice","options":["The Sun","A classroom bell","A pencil","A ruler"],"correctIndex":0,"explanation":"Solar heating."},{"prompt":"True or false: Plants can release water vapour (transpiration).","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Transpiration adds vapour."},{"prompt":"A good observation question is:","type":"multiple_choice","options":["Where do I see water moving?","What is my favourite font?","How loud is silence?","What colour is Tuesday?"],"correctIndex":0,"explanation":"Link seeing to the cycle."},{"prompt":"Clouds form mainly after:","type":"multiple_choice","options":["Condensation","Printing a document","Solving an equation only","Kicking a ball only"],"correctIndex":0,"explanation":"Condensation builds clouds."},{"prompt":"Why watch videos of the cycle?","type":"multiple_choice","options":["To see processes that are hard to notice all at once","To avoid learning","To skip science","To ignore evidence"],"correctIndex":0,"explanation":"Media makes processes visible."}]},"Clouds Tell a Weather Story":{"videos":[{"url":"https://www.youtube.com/watch?v=QVZExLO0MWA","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=R0K7VKkksyc","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=ncORPosDrjI","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"Clouds are made of:","type":"multiple_choice","options":["Tiny water droplets or ice crystals","Solid metal sheets","Only plastic bags","Only dust with no water"],"correctIndex":0,"explanation":"Condensed water."},{"prompt":"Cloud shape and colour can give clues about:","type":"multiple_choice","options":["Changing weather","Maths scores only","Shoe sizes","App passwords"],"correctIndex":0,"explanation":"Visual weather clues."},{"prompt":"True or false: All clouds look exactly the same.","type":"true_false","options":["True","False"],"correctIndex":1,"explanation":"Clouds vary."},{"prompt":"Careful observation means:","type":"multiple_choice","options":["Noticing height, colour and shape","Guessing with eyes closed","Ignoring the sky","Only reading the title"],"correctIndex":0,"explanation":"Use visible evidence."},{"prompt":"Water vapour cools and becomes:","type":"multiple_choice","options":["Droplets or crystals","Instant rock","Pure electricity","A computer file"],"correctIndex":0,"explanation":"Condensation products."},{"prompt":"True or false: Photos can help compare cloud types.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Images support comparison."},{"prompt":"Weather is different from climate because weather is:","type":"multiple_choice","options":["Shorter-term conditions","Always a 100-year average only","Only the colour of soil","Only ocean salt"],"correctIndex":0,"explanation":"Weather is day-to-day."},{"prompt":"A dark heavy cloud may suggest:","type":"multiple_choice","options":["Possible rain soon","Guaranteed sunshine forever","No water in the sky","Instant summer"],"correctIndex":0,"explanation":"Possible precipitation."},{"prompt":"Why pause a weather video?","type":"multiple_choice","options":["To name details you see","To skip learning","To avoid evidence","To close your eyes"],"correctIndex":0,"explanation":"Pause to observe."},{"prompt":"Best scientist habit here:","type":"multiple_choice","options":["Observe, describe, then explain","Invent facts with no look","Ignore the sky","Copy random answers"],"correctIndex":0,"explanation":"Evidence first."}]},"Landscapes Shaped by Water":{"videos":[{"url":"https://www.youtube.com/watch?v=R-Iak3Wvh9c","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=z5G4NCwWUxY","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=Vtb3I8Vzlfg","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"Moving water can:","type":"multiple_choice","options":["Weather rock and carry sediment","Create Wi-Fi","Write essays","Stop gravity"],"correctIndex":0,"explanation":"Erosion and transport."},{"prompt":"Sediment is:","type":"multiple_choice","options":["Bits of rock and soil carried and dropped","A type of cloud only","A computer virus","A punctuation mark"],"correctIndex":0,"explanation":"Moved particles."},{"prompt":"True or false: River bends can change over time.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Water reshapes land."},{"prompt":"Smooth stones in a river often show:","type":"multiple_choice","options":["Long tumbling and wearing","They were never moved","They are clouds","They are plants"],"correctIndex":0,"explanation":"Abrasion rounds edges."},{"prompt":"Coastlines can change because of:","type":"multiple_choice","options":["Waves and currents","Only spelling tests","Only silent reading","Only folder names"],"correctIndex":0,"explanation":"Coastal processes."},{"prompt":"True or false: Deposition is dropping sediment somewhere else.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Dropping carried material."},{"prompt":"Valleys can be shaped by:","type":"multiple_choice","options":["Flowing water over time","One second of wind only always","A single pencil mark","A ringtone"],"correctIndex":0,"explanation":"Long-term erosion."},{"prompt":"Compare images to find:","type":"multiple_choice","options":["Differences in land shapes","Hidden passwords","Favourite fonts","App icons only"],"correctIndex":0,"explanation":"Visual comparison."},{"prompt":"Weathering means rocks:","type":"multiple_choice","options":["Break down into smaller pieces","Become animals","Turn into apps","Gain Wi-Fi"],"correctIndex":0,"explanation":"Breakdown of rock."},{"prompt":"Why use video for landscapes?","type":"multiple_choice","options":["Motion shows how water changes places","Videos remove evidence","Videos stop observation","Videos hide science"],"correctIndex":0,"explanation":"Process becomes visible."}]},"Plant Parts in Close-up":{"videos":[{"url":"https://www.youtube.com/watch?v=TD60-3rqPXg","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=MuKs9o1s8h8","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"Roots mainly:","type":"multiple_choice","options":["Absorb water and anchor the plant","Take photos","Make thunder","Write code"],"correctIndex":0,"explanation":"Root jobs."},{"prompt":"Leaves help many plants:","type":"multiple_choice","options":["Capture light for food-making","Swim oceans","Orbit planets","Print documents"],"correctIndex":0,"explanation":"Photosynthesis support."},{"prompt":"Stems mainly:","type":"multiple_choice","options":["Support and transport","Only scare insects with sound","Only melt ice","Only store Wi-Fi"],"correctIndex":0,"explanation":"Support + transport."},{"prompt":"True or false: Flowers help many plants reproduce.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Reproductive structures."},{"prompt":"Form supports function means:","type":"multiple_choice","options":["A part’s shape matches its job","Parts have no jobs","Plants dislike water","Leaves avoid light always"],"correctIndex":0,"explanation":"Structure–function."},{"prompt":"Close-up images help you:","type":"multiple_choice","options":["Notice details of plant parts","Ignore science","Skip observation","Delete evidence"],"correctIndex":0,"explanation":"Detail seeing."},{"prompt":"True or false: All plant parts do exactly the same job.","type":"true_false","options":["True","False"],"correctIndex":1,"explanation":"Different parts, different jobs."},{"prompt":"Which part is usually underground?","type":"multiple_choice","options":["Roots","Flowers always","Only petals","Only fruit skins always"],"correctIndex":0,"explanation":"Roots below."},{"prompt":"A good observation note says:","type":"multiple_choice","options":["What you see and what job it may do","Only a random joke","Only a password","Only a score"],"correctIndex":0,"explanation":"Link evidence to function."},{"prompt":"Why watch plant videos?","type":"multiple_choice","options":["To connect visible parts to life processes","To avoid plants","To skip learning","To hide details"],"correctIndex":0,"explanation":"Media + meaning."}]},"Animal Adaptations on Camera":{"videos":[{"url":"https://www.youtube.com/watch?v=mRidGna-V4E","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=Vtb3I8Vzlfg","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=MuKs9o1s8h8","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"An adaptation helps a living thing:","type":"multiple_choice","options":["Survive in its environment","Fail on purpose","Avoid all food","Stop moving forever"],"correctIndex":0,"explanation":"Survival feature/behaviour."},{"prompt":"Body coverings can help with:","type":"multiple_choice","options":["Protection, warmth or camouflage","Writing essays","Coding apps","Spelling only"],"correctIndex":0,"explanation":"Covering functions."},{"prompt":"True or false: You should use visible evidence before deciding what an adaptation does.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Evidence first."},{"prompt":"Feeding structures are adapted for:","type":"multiple_choice","options":["Getting food","Playing football only","Reading novels only","Drawing maps only"],"correctIndex":0,"explanation":"Diet-related structures."},{"prompt":"Camouflage helps many animals:","type":"multiple_choice","options":["Blend into surroundings","Become louder","Grow Wi-Fi","Learn algebra instantly"],"correctIndex":0,"explanation":"Hide/blend."},{"prompt":"True or false: Movement styles can be adaptations.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"e.g. swimming, flying."},{"prompt":"Comparing animals on camera helps you:","type":"multiple_choice","options":["Notice different survival features","Ignore differences","Skip science","Delete clues"],"correctIndex":0,"explanation":"Compare evidence."},{"prompt":"A behaviour adaptation example is:","type":"multiple_choice","options":["Migrating or hunting in groups","Turning into a rock instantly","Becoming a cloud","Becoming a spreadsheet"],"correctIndex":0,"explanation":"Behavioural strategies."},{"prompt":"Habitats provide:","type":"multiple_choice","options":["Food, water, shelter and space","Only ringtones","Only passwords","Only fonts"],"correctIndex":0,"explanation":"Basic needs."},{"prompt":"Best claim about an adaptation:","type":"multiple_choice","options":["One linked to observed features","A wild guess with no look","Copying a joke","Ignoring the video"],"correctIndex":0,"explanation":"Evidence-based claims."}]},"Tiny Habitats, Big Communities":{"videos":[{"url":"https://www.youtube.com/watch?v=Vtb3I8Vzlfg","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=MuKs9o1s8h8","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=CZhE2p46vJk","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"A habitat provides:","type":"multiple_choice","options":["Food, water, shelter and space","Only homework","Only Wi-Fi passwords","Only trophies"],"correctIndex":0,"explanation":"Needs for life."},{"prompt":"Even a small pond can:","type":"multiple_choice","options":["Support many connected organisms","Support zero life always","Create planets","Stop sunlight forever"],"correctIndex":0,"explanation":"Small habitats matter."},{"prompt":"True or false: Organisms in a habitat can depend on each other.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Interdependence."},{"prompt":"A community in nature means:","type":"multiple_choice","options":["Living things sharing an area","Only one rock alone","Only one app","Only one desk"],"correctIndex":0,"explanation":"Shared living space."},{"prompt":"Looking closely helps you:","type":"multiple_choice","options":["Find organisms you might miss","Skip details","Avoid science","Hide evidence"],"correctIndex":0,"explanation":"Close observation."},{"prompt":"True or false: A tree can be part of a habitat.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Trees shelter many lives."},{"prompt":"Food connections in a habitat are shown by:","type":"multiple_choice","options":["Food chains and webs","Only spelling lists","Only page numbers","Only ringtones"],"correctIndex":0,"explanation":"Feeding links."},{"prompt":"If shelter disappears, many organisms may:","type":"multiple_choice","options":["Struggle to survive","Need less food forever automatically","Stop needing water","Become non-living instantly safely"],"correctIndex":0,"explanation":"Shelter matters."},{"prompt":"A garden patch is:","type":"multiple_choice","options":["A possible tiny habitat","Never a habitat","Only a spreadsheet","Only a cloud"],"correctIndex":0,"explanation":"Local habitats."},{"prompt":"Why use video here?","type":"multiple_choice","options":["To see many organisms and interactions quickly","To avoid looking","To erase communities","To skip evidence"],"correctIndex":0,"explanation":"Rich visual evidence."}]},"A Visual Tour of the Solar System":{"videos":[{"url":"https://www.youtube.com/watch?v=libKVRa01L8","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=w36yxLgwUOc","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"The solar system’s centre is the:","type":"multiple_choice","options":["Sun","Moon","Earth only","Mars only"],"correctIndex":0,"explanation":"Sun-centred system."},{"prompt":"Planets orbit the Sun because of:","type":"multiple_choice","options":["Gravity and motion","Homework","Wi-Fi","Punctuation"],"correctIndex":0,"explanation":"Orbital physics basics."},{"prompt":"True or false: Classroom diagrams may change scale so everything fits.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Scale is often adjusted."},{"prompt":"Moons orbit:","type":"multiple_choice","options":["Planets","Only apps","Only clouds","Only desks"],"correctIndex":0,"explanation":"Natural satellites."},{"prompt":"Earth is special for us because:","type":"multiple_choice","options":["It supports life as we know it","It is the hottest star","It has no atmosphere ever","It is not a planet"],"correctIndex":0,"explanation":"Habitable planet."},{"prompt":"True or false: There are eight planets in our solar system.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Eight recognised planets."},{"prompt":"Comparing planet images helps you notice:","type":"multiple_choice","options":["Size, colour and surface clues","Only spellings","Only fonts","Only passwords"],"correctIndex":0,"explanation":"Visual comparison."},{"prompt":"The Sun provides Earth with:","type":"multiple_choice","options":["Light and heat energy","Only homework sheets","Only plastic","Only silence"],"correctIndex":0,"explanation":"Solar energy."},{"prompt":"A smaller body in the solar system could be:","type":"multiple_choice","options":["An asteroid or comet","A classroom chair","A textbook only","A football pitch"],"correctIndex":0,"explanation":"Minor bodies."},{"prompt":"Best learning tip for space videos:","type":"multiple_choice","options":["Pause and compare features carefully","Watch with eyes closed","Ignore labels","Skip all visuals"],"correctIndex":0,"explanation":"Active watching."}]},"Light Up a Simple Circuit":{"videos":[{"url":"https://www.youtube.com/watch?v=x4pdzG-DHnY","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=oB1v-wh7EGU","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=7K4V0NvUxRg","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"A lamp lights when:","type":"multiple_choice","options":["A complete conducting path lets current flow","There is always a permanent gap","Only wood is used as wire","No cell is present"],"correctIndex":0,"explanation":"Closed circuit."},{"prompt":"An open circuit has:","type":"multiple_choice","options":["A gap that stops current","Guaranteed light always","No need for a path","Only magnets as fuel"],"correctIndex":0,"explanation":"Gap = open."},{"prompt":"True or false: Classroom circuits should use safe cells, not wall electricity.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Safety first."},{"prompt":"A conductor example is:","type":"multiple_choice","options":["Metal wire","Dry rubber glove","Plastic coating alone","Wood block alone"],"correctIndex":0,"explanation":"Metals conduct well."},{"prompt":"A cell in a simple circuit acts as:","type":"multiple_choice","options":["An energy source","A cloud","A planet","A paragraph"],"correctIndex":0,"explanation":"Provides energy."},{"prompt":"True or false: Insulators help keep current on a safe path.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Coatings protect."},{"prompt":"If the lamp is off but parts look connected, check for:","type":"multiple_choice","options":["A hidden gap, loose wire or dead cell","The moon phase only","Spelling errors only","Favourite colours only"],"correctIndex":0,"explanation":"Troubleshoot path/source."},{"prompt":"Current needs:","type":"multiple_choice","options":["A closed loop path","An endless open gap","Only silence","Only sunlight labels"],"correctIndex":0,"explanation":"Complete path."},{"prompt":"Watching a circuit demo helps you:","type":"multiple_choice","options":["See cause and effect safely","Touch wall sockets","Skip safety","Guess without looking"],"correctIndex":0,"explanation":"Visual cause–effect."},{"prompt":"Best safety rule:","type":"multiple_choice","options":["Never use mains electricity for this lesson","Use wall outlets for toy bulbs always","Ignore teacher instructions","Taste batteries"],"correctIndex":0,"explanation":"No mains for class demos."}]},"Design With Shapes and Colour":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch adventure clip 1"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch adventure clip 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch adventure clip 3"}],"quiz":[{"prompt":"Designers guide attention using:","type":"multiple_choice","options":["Shape, line, colour, contrast and space","Only random noise","Only hidden text","Only broken links"],"correctIndex":0,"explanation":"Visual elements."},{"prompt":"Contrast helps viewers:","type":"multiple_choice","options":["Notice important parts","Ignore everything","Delete meaning","Hide ideas"],"correctIndex":0,"explanation":"Stand-out differences."},{"prompt":"True or false: A strong visual choice supports the idea you want others to notice.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Form serves meaning."},{"prompt":"Space in a design can:","type":"multiple_choice","options":["Give the eye rest and focus","Only create clutter always","Remove all meaning","Delete colour forever"],"correctIndex":0,"explanation":"Negative space helps."},{"prompt":"Colour can communicate:","type":"multiple_choice","options":["Mood and emphasis","Only CPU speed","Only passwords","Only gravity"],"correctIndex":0,"explanation":"Colour meaning."},{"prompt":"True or false: Every decoration improves a design.","type":"true_false","options":["True","False"],"correctIndex":1,"explanation":"Extra clutter can hurt."},{"prompt":"Studying photos and frames helps you:","type":"multiple_choice","options":["Learn visual choices","Avoid creativity","Skip looking","Hide patterns"],"correctIndex":0,"explanation":"Learn by observing."},{"prompt":"A visual story should have:","type":"multiple_choice","options":["A clear idea the viewer can follow","No idea at all","Only noise","Only tiny unreadable text"],"correctIndex":0,"explanation":"Clarity of idea."},{"prompt":"Line in art can show:","type":"multiple_choice","options":["Direction and structure","Only smell","Only temperature numbers","Only file sizes"],"correctIndex":0,"explanation":"Line guides the eye."},{"prompt":"After watching, a good next step is:","type":"multiple_choice","options":["Create your own visual story with purpose","Copy without thinking","Avoid making anything","Delete all colour always"],"correctIndex":0,"explanation":"Apply the learning."}]}}
$visual_media_bank$::jsonb;
  lesson_media jsonb;
  lesson_quiz jsonb;
  assessment_blocks jsonb;
  quiz_questions jsonb;
  video_item jsonb;
  video_ord integer;
  media_blocks jsonb;
BEGIN
  SELECT count(*) INTO teacher_count
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin');

  IF teacher_count = 0 THEN
    RAISE EXCEPTION 'Teacher Kay was not found.';
  ELSIF teacher_count > 1 THEN
    RAISE EXCEPTION 'More than one Teacher Kay account was found.';
  END IF;

  SELECT id INTO teacher_id
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin')
  LIMIT 1;

  -- Break the publication reference before replacing this one seed subject.
  UPDATE public."Subject"
  SET "currentPublicRevisionId" = NULL
  WHERE id = subject_id AND "createdBy" = teacher_id;

  DELETE FROM public."PublicLearningRevision"
  WHERE "courseId" = subject_id;

  DELETE FROM public."TeacherQuiz"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR "lessonId" LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."AdminLessonRecord"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR id LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."Topic"
  WHERE "unitId" LIKE subject_id || '-strand-%';

  DELETE FROM public."Unit"
  WHERE "subjectId" = subject_id;

  DELETE FROM public."Subject"
  WHERE id = subject_id AND "createdBy" = teacher_id;

  INSERT INTO public."Subject"
    ("id","name","slug","description","icon","colourToken","coverUrl","gradeLevels",
     "order","status","visibility","ownerClassId","createdBy","createdAt","updatedAt")
  VALUES
    (subject_id,
     'Visual Discovery Adventures',
     subject_id,
     'Travel through nature, space and creative technology using short videos, vivid photographs, observation missions and simple supporting text. Designed for learners in every primary grade.',
     'images',
     '#0EA5E9',
     'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85',
     ARRAY[1,2,3,4,5,6],
     160,
     'ACTIVE',
     'platform',
     NULL,
     teacher_id,
     now(),
     now());

  -- Three strands, each with one sub-strand and three media-first lessons.
  FOR item IN
    SELECT * FROM (VALUES
      (1,1,'Earth in Motion','Our Changing Planet','The Water Cycle From Above',
       'Watch water travel between land, sky and sea, then trace the cycle in a photograph.',
       'https://www.youtube.com/watch?v=ncORPosDrjI',
       'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1400&q=85',
       'Water continuously moves through evaporation, condensation, precipitation and collection. Look for clouds, rivers, soil and sunlight in the visual evidence.'),
      (1,2,'Earth in Motion','Our Changing Planet','Clouds Tell a Weather Story',
       'Use cloud shapes and sky photographs to make careful weather observations.',
       'https://www.youtube.com/watch?v=QVZExLO0MWA',
       'https://images.unsplash.com/photo-1566010503302-2564ae0d47b6?auto=format&fit=crop&w=1400&q=85',
       'Clouds form when water vapour cools into tiny droplets or ice crystals. Their height, colour and shape can give clues about changing weather.'),
      (1,3,'Earth in Motion','Our Changing Planet','Landscapes Shaped by Water',
       'See how moving water slowly changes soil, rocks, valleys and coastlines.',
       'https://www.youtube.com/watch?v=R-Iak3Wvh9c',
       'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1400&q=85',
       'Water can weather rock, carry sediment and deposit it elsewhere. Compare smooth stones, river bends and coastal shapes in the images.'),
      (2,4,'Life Up Close','Patterns in Living Things','Plant Parts in Close-up',
       'Explore detailed plant images and connect each visible part to its job.',
       'https://www.youtube.com/watch?v=TD60-3rqPXg',
       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85',
       'Roots absorb water, stems provide support, leaves capture light and flowers help many plants reproduce. A close observation reveals how form supports function.'),
      (2,5,'Life Up Close','Patterns in Living Things','Animal Adaptations on Camera',
       'Observe body coverings, movement and feeding structures that help animals survive.',
       'https://www.youtube.com/watch?v=mRidGna-V4E',
       'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1400&q=85',
       'An adaptation is a feature or behaviour that helps a living thing survive. Use visible evidence before deciding what an adaptation may do.'),
      (2,6,'Life Up Close','Patterns in Living Things','Tiny Habitats, Big Communities',
       'Look closely at a small habitat and discover how many living things share it.',
       'https://www.youtube.com/watch?v=Vtb3I8Vzlfg',
       'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=85',
       'A habitat provides food, water, shelter and space. Even a tree, garden patch or pond can support a connected community of organisms.'),
      (3,7,'Space and Making','See, Imagine, Create','A Visual Tour of the Solar System',
       'Travel from the Sun across the planets and compare their visible features.',
       'https://www.youtube.com/watch?v=libKVRa01L8',
       'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1400&q=85',
       'The solar system contains the Sun, planets, moons and smaller bodies. Scale images carefully: classroom diagrams often change sizes and distances so everything can fit.'),
      (3,8,'Space and Making','See, Imagine, Create','Light Up a Simple Circuit',
       'Follow a visual demonstration to connect a cell, wires and lamp safely.',
       'https://www.youtube.com/watch?v=x4pdzG-DHnY',
       'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
       'A lamp lights when a complete conducting path allows electric current to flow. A gap creates an open circuit and stops the flow. Use only classroom-safe cells, never wall electricity.'),
      (3,9,'Space and Making','See, Imagine, Create','Design With Shapes and Colour',
       'Study photographs and video frames, then create a visual story of your own.',
       'https://www.youtube.com/watch?v=eIho2S0ZahI',
       'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85',
       'Artists and designers guide attention with shape, line, colour, contrast and space. A strong visual choice supports the idea you want another person to notice.')
    ) AS lessons(strand_no,lesson_no,strand_name,substrand_name,lesson_title,lesson_description,video_url,image_url,lesson_text)
  LOOP
    unit_id := subject_id || '-strand-' || item.strand_no;
    topic_id := unit_id || '-substrand-1';
    lesson_id := subject_id || '-lesson-' || lpad(item.lesson_no::text,2,'0');
    version_id := lesson_id || '-v1';

    INSERT INTO public."Unit" ("id","subjectId","name","slug","description","order","createdAt","updatedAt")
    VALUES (unit_id,subject_id,item.strand_name,'strand-' || item.strand_no,
      'A media-led strand for observing, discussing and creating.',item.strand_no,now(),now())
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO public."Topic" ("id","unitId","name","slug","description","order","createdAt","updatedAt")
    VALUES (topic_id,unit_id,item.substrand_name,'visual-exploration',
      'Video, picture and observation adventures supported by concise text.',1,now(),now())
    ON CONFLICT ("id") DO NOTHING;


    lesson_media := visual_media_bank -> item.lesson_title;
    IF lesson_media IS NULL THEN
      RAISE EXCEPTION 'Missing visual media bank for %', item.lesson_title;
    END IF;
    lesson_quiz := lesson_media -> 'quiz';

    SELECT coalesce(jsonb_agg(qblock ORDER BY ord), '[]'::jsonb)
    INTO assessment_blocks
    FROM (
      SELECT
        ordinality AS ord,
        CASE
          WHEN q ->> 'type' = 'true_false' THEN
            jsonb_build_object(
              'id', lesson_id || '-q' || ordinality,
              'type', 'true_false',
              'order', 10 + ordinality,
              'required', true,
              'estimatedSeconds', 40,
              'statement', q ->> 'prompt',
              'prompt', q ->> 'prompt',
              'shuffleOptions', false,
              'correctAnswer', ((q ->> 'correctIndex')::int = 0),
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'developing',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Use what you saw in the videos.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Great explorer!',
              'feedbackIncorrect', 'Rewatch and try again.',
              'feedbackRetry', 'Look for visual evidence.'
            )
          ELSE
            jsonb_build_object(
              'id', lesson_id || '-q' || ordinality,
              'type', 'multiple_choice',
              'order', 10 + ordinality,
              'required', true,
              'estimatedSeconds', 50,
              'prompt', q ->> 'prompt',
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'developing',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Pause the video and compare options.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Yes — that matches the adventure videos.',
              'feedbackIncorrect', 'Not yet. Compare each option with the video.',
              'feedbackRetry', 'Eliminate one wrong option and retry.',
              'shuffleOptions', true,
              'options', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', chr(96 + opt_ord::int),
                    'label', chr(64 + opt_ord::int),
                    'text', opt #>> '{}'
                  ) ORDER BY opt_ord
                )
                FROM jsonb_array_elements(q -> 'options') WITH ORDINALITY AS opts(opt, opt_ord)
              ),
              'correctOptionId', chr(96 + ((q ->> 'correctIndex')::int + 1))
            )
        END AS qblock
      FROM jsonb_array_elements(lesson_quiz) WITH ORDINALITY AS quiz_rows(q, ordinality)
    ) built;

    media_blocks := '[]'::jsonb;
    FOR video_item, video_ord IN
      SELECT value, ordinality::integer
      FROM jsonb_array_elements(lesson_media -> 'videos') WITH ORDINALITY
    LOOP
      media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
        'id', lesson_id || '-video-' || video_ord,
        'type', 'video',
        'order', 1 + video_ord,
        'required', true,
        'estimatedSeconds', CASE WHEN video_ord = 1 THEN 300 ELSE 240 END,
        'source', video_item ->> 'url',
        'provider', 'youtube',
        'title', coalesce(video_item ->> 'title', 'Watch the adventure'),
        'caption', 'Pause when needed. Name three details you can see or hear.'
      ));
    END LOOP;

    media_blocks := media_blocks || jsonb_build_array(
      jsonb_build_object(
        'id',lesson_id || '-image','type','image','order',5,'required',false,'estimatedSeconds',60,
        'source',item.image_url,'altText','A detailed visual supporting ' || item.lesson_title,
        'caption','Optional extra look: what patterns do you notice?',
        'attribution','Unsplash educational photograph','decorative',false
      ),
      jsonb_build_object(
        'id',lesson_id || '-text','type','tip','order',6,'required',true,'estimatedSeconds',50,
        'title','Tiny tip','tone','remember',
        'body',left(item.lesson_text, 180) || CASE WHEN length(item.lesson_text) > 180 THEN '…' ELSE '' END
      )
    );

    fixture := jsonb_build_object(
      'subjects',jsonb_build_array(jsonb_build_object(
        'id',subject_id,'name','Visual Discovery Adventures','slug',subject_id,
        'description','Media-led discovery for every primary grade.','icon','images',
        'colourToken','#0EA5E9','gradeLevels',jsonb_build_array(1,2,3,4,5,6),
        'order',160,'status','active','createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'units',jsonb_build_array(jsonb_build_object(
        'id',unit_id,'subjectId',subject_id,'name',item.strand_name,'slug','strand-' || item.strand_no,
        'description','Observe and explore through media.','order',item.strand_no,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'topics',jsonb_build_array(jsonb_build_object(
        'id',topic_id,'unitId',unit_id,'name',item.substrand_name,'slug','visual-exploration',
        'description','Video-first learning with a tiny tip.','order',1,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'lessons',jsonb_build_array(jsonb_build_object(
        'id',lesson_id,'topicId',topic_id,'title',item.lesson_title,
        'slug',regexp_replace(lower(item.lesson_title),'[^a-z0-9]+','-','g'),
        'shortDescription',item.lesson_description,'order',item.lesson_no,
        'prerequisiteLessonId',CASE WHEN item.lesson_no IN (1,4,7) THEN NULL ELSE subject_id || '-lesson-' || lpad((item.lesson_no - 1)::text,2,'0') END,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'lessonVersions',jsonb_build_array(jsonb_build_object(
        'id',version_id,'lessonId',lesson_id,'versionNumber',1,'status','published',
        'title',item.lesson_title,'description',item.lesson_description,
        'objectiveSummary','Watch videos, notice evidence, then show understanding in a quiz.',
        'difficulty','developing','estimatedMinutes',16,'baseXpReward',80,'passingScore',70,
        'masteryScore',90,'maximumLessonRedos',3,'publishedAt',timestamp_text,
        'learningObjectives',jsonb_build_array(jsonb_build_object(
          'id',lesson_id || '-objective','lessonVersionId',version_id,'code','VIS.' || item.strand_no || '.' || item.lesson_no,
          'description','Learn mainly from videos, then answer a real 10-question quiz.','order',1
        )),
        'blocks',
          jsonb_build_array(
            jsonb_build_object(
              'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,'estimatedSeconds',35,
              'title',item.lesson_title,'shortDescription',item.lesson_description,
              'objectives',jsonb_build_array('Watch closely','Find visual evidence','Ace the quiz'),
              'estimatedMinutes',16,'rewardPreview',jsonb_build_object('xp',80,'starsAvailable',3)
            )
          ) || media_blocks || assessment_blocks ||
          jsonb_build_array(
            jsonb_build_object(
              'id',lesson_id || '-summary','type','summary','order',30,'required',true,'estimatedSeconds',40,
              'heading','Discovery complete',
              'keyPoints',jsonb_build_array(
                'I watched adventure videos carefully.',
                'I used a tiny tip to remember the idea.',
                'I checked my learning with a real quiz.'
              ),
              'nextStepText','Share one discovery, then continue.'
            )
          ),
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      ))
    );

    record_data := jsonb_build_object(
      'id',lesson_id,'subject','science','courseId',subject_id,'unitId',unit_id,'topicId',topic_id,
      'grade',NULL,'gradeLevels',jsonb_build_array(1,2,3,4,5,6),
      'unit',item.strand_name,'chapter',item.strand_name,'topic',item.substrand_name,
      'contentStandard',NULL,'indicator',NULL,'lessonNumber',item.lesson_no,'title',item.lesson_title,
      'description',item.lesson_description,'estimatedMinutes',16,'xp',80,'questionCount',10,
      'format','video','status','published','createdAt',timestamp_text,'updatedAt',timestamp_text,
      'fixture',fixture,'createdBy',teacher_id
    );

    INSERT INTO public."AdminLessonRecord"
      ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
    VALUES
      (lesson_id,'science','published',item.lesson_no,record_data,teacher_id,subject_id,unit_id,topic_id,now(),now());

    SELECT jsonb_agg(jsonb_build_object(
      'id','q-' || q,
      'prompt',CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
          THEN assessment_blocks -> (q - 1) ->> 'statement'
        ELSE assessment_blocks -> (q - 1) ->> 'prompt'
      END,
      'type',coalesce(assessment_blocks -> (q - 1) ->> 'type','multiple_choice'),
      'options',CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false' THEN jsonb_build_array('True','False')
        ELSE jsonb_build_array(
          assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
        )
      END,
      'correctIndex',CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
          THEN CASE WHEN (assessment_blocks -> (q - 1) ->> 'correctAnswer')::boolean THEN 0 ELSE 1 END
        ELSE (
          SELECT ord - 1
          FROM jsonb_array_elements(assessment_blocks -> (q - 1) -> 'options') WITH ORDINALITY AS o(opt, ord)
          WHERE opt ->> 'id' = assessment_blocks -> (q - 1) ->> 'correctOptionId'
          LIMIT 1
        )
      END,
      'explanation',coalesce(assessment_blocks -> (q - 1) ->> 'explanation', 'Use video evidence.')
    ) ORDER BY q)
    INTO quiz_questions
    FROM generate_series(1,10) q;

    INSERT INTO public."TeacherQuiz"
      ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
       "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
    VALUES
      (teacher_id,item.lesson_title || ' - Discovery Quiz',
       '[SKULKID-VISUAL-SEED] Ten-question quiz after ' || item.lesson_title,
       'science',ARRAY[1,2,3,4,5,6],quiz_questions,70,70,3,1,'ready',
       subject_id,unit_id,topic_id,lesson_id,now(),now());
  END LOOP;

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
        l.record || jsonb_build_object('classId',l."classId",'courseId',l."courseId",'unitId',l."unitId",'topicId',l."topicId")
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
     NULL,now(),'Approved media-led demonstration subject for all grades.',now())
  RETURNING id INTO revision_id;

  UPDATE public."Subject"
  SET "currentPublicRevisionId" = revision_id, "updatedAt" = now()
  WHERE id = subject_id;

  RAISE NOTICE 'Created Visual Discovery Adventures for Teacher Kay: all grades, 3 strands, 9 video-rich lessons and 9 real quizzes.';
END
$seed$;

SELECT
  s.name,
  s."gradeLevels",
  u_count.strands,
  l_count.lessons,
  r.status AS publication_status,
  creator.raw_user_meta_data ->> 'display_name' AS assigned_teacher
FROM public."Subject" s
JOIN auth.users creator ON creator.id = s."createdBy"
JOIN LATERAL (SELECT count(*)::integer AS strands FROM public."Unit" u WHERE u."subjectId" = s.id) u_count ON true
JOIN LATERAL (SELECT count(*)::integer AS lessons FROM public."AdminLessonRecord" l WHERE l."courseId" = s.id) l_count ON true
LEFT JOIN public."PublicLearningRevision" r ON r.id = s."currentPublicRevisionId"
WHERE s.id = 'teacher-kay-visual-discovery';
