# Ghana Upper Primary English course

## Authority and scope

This course is aligned to the National Council for Curriculum and Assessment (NaCCA), Ministry of Education, **English Language Curriculum for Primary Schools (Basic 4-6), September 2019**. NaCCA lists this as the standards-based Upper Primary English curriculum on its [official curriculum page](https://nacca.gov.gh/learning-areas-subjects/new-standards-based-curriculum-2019/), with the [official curriculum PDF](https://nacca.gov.gh/wp-content/uploads/2019/04/ENGLISH-UPPER-PRIMARY-B4-B6.pdf).

The platform's target age of approximately 9-12 maps to Key Phase 3, Basic 4-6. The course therefore does not claim to cover KG or Basic 1-3.

## Curriculum findings

The standards are organised by grade, then strand, sub-strand, content standard, indicator and exemplar. The six Upper Primary strands are:

1. Oral Language: listening and speaking
2. Reading
3. Grammar Usage at Word and Phrase Levels
4. Writing
5. Using Writing Conventions / Grammar Usage
6. Extensive Reading

The curriculum expects language to be learned through use rather than memorised definitions. It repeatedly foregrounds listening, speaking, reading and writing; communication and collaboration; critical thinking and problem solving; creativity and innovation; cultural identity; personal development; and inclusive, differentiated classroom practice. Assessment is intended to be formative as well as summative.

## Course architecture

The SkulKid implementation is a spiral course of 18 complete missions: all six strands at Basic 4, again at Basic 5 with increased independence, and again at Basic 6 with analysis and synthesis. Each mission is a published, versioned lesson with:

- two measurable objectives and a curriculum reference prefix;
- direct instruction and a contextual worked example;
- a low-stakes tip and optional reflection;
- two independently scoreable challenges;
- answer-specific retry, hint and explanatory feedback;
- a summary, prerequisite, XP reward, passing score and mastery score.

This design consolidates related curriculum indicators into strand missions suitable for the current short-lesson platform. It is an instructional course, not a reproduction of the NaCCA teacher exemplars. Oral tasks currently use read/speak prompts because Phase 1 has no audio recording or teacher-scored speaking workflow. Extended compositions and book logs likewise need a future portfolio/submission block for authentic teacher assessment.

## Progression map

| Strand | Basic 4 | Basic 5 | Basic 6 |
| --- | --- | --- | --- |
| Oral Language | active listening and relevant questions | sequenced retelling and purposeful presentation | evidence-led discussion and persuasion |
| Reading | decoding, context clues and main idea | fluency, inference and summarising | central ideas, structure, purpose and evidence |
| Grammar | determiners, pronouns and adjective phrases | precise comparison and adverb use | conjunctions, reference and modifier clarity |
| Writing | focused paragraphs and the writing process | narrative and persuasive organisation | research, paraphrase and publication |
| Conventions | capitals, punctuation and complete sentences | tense, agreement and apostrophes | compound/complex sentences and proofreading |
| Extensive Reading | choice, reading records and response | genre/viewpoint comparison | critical interpretation and recommendation |

## Content and safety choices

Examples use familiar Ghanaian names and settings sparingly and naturally. They avoid stereotypes, partisan or religious persuasion, shame-based feedback and competitive leaderboards. Instructions are concise, feedback is supportive, controls inherit the accessible SkulKid lesson player, and success is never communicated by colour alone.

## Implementation references

- Course source: `domains/curriculum/fixtures/english-curriculum.ts`
- Subject catalogue: `data/subjects.ts`
- Student path: `/courses/english-language`
- Lesson player: `/preview/lessons/[lessonId]`
- Database population: run the SQL migrations in `supabase/migrations`

## Known next-stage enhancements

- audio clips and microphone recording for oral-language performance;
- teacher rubrics for presentations and extended writing;
- a reading library, reading log and licensed full texts;
- drag-and-drop sequencing, matching and passage-annotation blocks;
- diagnostic entry points per grade instead of a single linear prerequisite chain;
- expansion of each consolidated mission into term-length micro-lessons where school deployment requires indicator-by-indicator scheduling.
