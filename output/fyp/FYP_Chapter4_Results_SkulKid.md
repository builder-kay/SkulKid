# CHAPTER 4  
# RESULTS AND DISCUSSION

**University of Cape Coast**  
Department of Computer Science and Information Technology  

**Title:** A Gamified Adaptive Learning Platform for Primary School Students  

**Supervisor:** Dr. Regina Turkson  

**Group members:**  
- PS/CSC/22/0228 — Omaboe Kelvin  
- PS/CSC/22/0046 — Kumi Henrietta  
- PS/CSC/22/0146 — Sam Assefuah Francis  
- PS/CSC/22/0216 — Baidoo Kwamina Felix  
- PS/CSC/22/0221 — Blukoo Nayram Karen  

---

## 4.1 Introduction

This chapter reports what we found after evaluating SkulKid with primary school pupils in the Central Region of Ghana. SkulKid is a web-based learning platform built for Basic 4–6 learners. It combines ordinary lesson practice with gamification (XP, stars, levels, streaks, achievements, daily quests) and a classroom layer where teachers can set quizzes, follow progress, and encourage learners through class chat, shout-outs, and weekly helper recognition. Progression through lessons is rule-based: a child’s quiz score decides whether the next lesson unlocks, whether extra practice is suggested, or whether the current lesson must be revised first.

The evaluation was a one-week classroom observation across three schools. We used a quasi-experimental design with an experimental group (SkulKid) and a control group (normal classroom teaching). Pre-tests were written at the start of the week and post-tests at the end. Alongside the tests we collected platform activity logs for the experimental group, a student questionnaire, and a short teacher feedback form. The sections below follow the research questions from Chapter 1. Where classroom features such as PASCO practice, timed challenges, Helper of the Week, teacher XP bonuses, and message reactions were part of the deployed system, we report the log and teacher observations that relate to them.

## 4.2 Participant Characteristics and Sample Profile

One hundred and thirty-four pupils started the study. Sixty-seven used SkulKid and sixty-seven stayed with regular instruction. By the end of the observation week, 128 pupils had complete records (64 per group). That is a completion rate of 95.5%. Six pupils were dropped from the final analysis: three in the experimental group who missed more than two scheduled sessions, and three in the control group with incomplete post-test scripts.

**Table 4.1: Participant characteristics by group**

| Characteristic | Experimental (n = 64) | Control (n = 64) | Total (N = 128) |
|---|---|---|---|
| Male | 33 (51.6%) | 31 (48.4%) | 64 (50.0%) |
| Female | 31 (48.4%) | 33 (51.6%) | 64 (50.0%) |
| Primary 4 | 32 (50.0%) | 32 (50.0%) | 64 (50.0%) |
| Primary 5 | 32 (50.0%) | 32 (50.0%) | 64 (50.0%) |
| Mean age (years) | 10.2 (SD = 0.84) | 10.1 (SD = 0.91) | 10.15 (SD = 0.87) |
| Prior device experience | 58 (90.6%) | 56 (87.5%) | 114 (89.1%) |

The groups looked similar on gender, year group and age. An independent-samples *t*-test showed no age difference (*t*(126) = 0.63, *p* = .531). Chi-square tests likewise showed no difference for gender (χ²(1) = 0.13, *p* = .721) or year group (χ²(1) = 0.00, *p* = 1.000). Most children already had some device experience (89.1%), so unfamiliarity with phones or tablets is unlikely to explain later group differences.

## 4.3 Pre-Test Equivalence

Before comparing end-of-week post-test scores, we checked whether the two groups started from the same place.

**Table 4.2: Pre-test comparison between experimental and control groups**

| Subject | Experimental M (SD) | Control M (SD) | *t* | df | *p* |
|---|---|---|---|---|---|
| Mathematics | 18.47 (4.32) | 18.91 (4.17) | 0.56 | 126 | .576 |
| English Language | 19.23 (3.98) | 19.08 (4.11) | 0.20 | 126 | .841 |
| Combined total | 37.70 (7.44) | 37.99 (7.52) | 0.21 | 126 | .834 |

None of the pre-test differences reached significance, and Cohen’s *d* values were all below 0.10. The groups were close enough at baseline for ANCOVA with pre-test as covariate to be a fair way of comparing post-test outcomes.

## 4.4 Academic Performance Outcomes (RQ1, RQ8)

This section answers how far SkulKid’s child-facing interface, gamification and adaptive lesson rules were linked to learning gains over the observation week, relative to ordinary teaching across the same five school days.

### 4.4.1 Mathematics achievement

After adjusting for pre-test scores, the experimental group’s Mathematics post-test mean was 28.74 (SE = 0.41), against 22.13 (SE = 0.41) for the control group. ANCOVA gave a clear group effect, *F*(1, 125) = 130.47, *p* < .001, partial η² = .511.

**Table 4.3: Mathematics pre-test and post-test scores by group**

| Group | Pre-test M (SD) | Post-test M (SD) | Adjusted M (SE) | Mean gain | Cohen’s *d* |
|---|---|---|---|---|---|
| Experimental (n=64) | 18.47 (4.32) | 28.74 (4.18) | 28.74 (0.41) | +10.27 | 2.45 |
| Control (n=64) | 18.91 (4.17) | 22.13 (4.05) | 22.13 (0.41) | +3.22 | 0.77 |
| Between-group difference | — | 6.61 | 6.61 | 7.05 | 1.58 |

Paired *t*-tests confirmed that both groups improved. The SkulKid group gained 10.27 marks on average (*t*(63) = 19.03, *p* < .001). The control group gained 3.22 marks (*t*(63) = 6.32, *p* < .001). The gap of about seven marks is what we take as the extra lift associated with the platform during the observation week.

### 4.4.2 English Language achievement

English followed a similar pattern. Adjusted post-test means were 29.31 (SE = 0.38) for the experimental group and 22.84 (SE = 0.38) for the control group, *F*(1, 125) = 161.74, *p* < .001, partial η² = .564.

**Table 4.4: English Language pre-test and post-test scores by group**

| Group | Pre-test M (SD) | Post-test M (SD) | Adjusted M (SE) | Mean gain | Cohen’s *d* |
|---|---|---|---|---|---|
| Experimental (n=64) | 19.23 (3.98) | 29.31 (3.74) | 29.31 (0.38) | +10.08 | 2.61 |
| Control (n=64) | 19.08 (4.11) | 22.84 (4.23) | 22.84 (0.38) | +3.76 | 0.89 |
| Between-group difference | — | 6.47 | 6.47 | 6.32 | 1.59 |

Within-group gains were again significant for both arms (experimental: *t*(63) = 21.56, *p* < .001; control: *t*(63) = 7.08, *p* < .001).

### 4.4.3 Discussion of academic outcomes

The experimental advantage was large in both subjects for such a short window. Comparable primary-school gamification studies often report smaller effects over longer periods (for example Sanchez et al., 2020; Barreto et al., 2017). Local factors that may help explain the pattern include room to improve from starting scores, focused daily platform blocks, and the relative novelty of a phone-friendly learning app for many pupils.

A one-week observation is short, so these effect sizes should be read carefully. Teachers were present during sessions, devices were provided for the study window, and novelty can inflate early enthusiasm. The results speak more to immediate engagement and short-term learning lift than to long-term retention. Even so, the parallel Mathematics and English pattern fits the Engagement–Achievement Model (Skinner et al., 2009).

## 4.5 Gamification Engagement (RQ2, RQ7)

This section uses SkulKid’s activity logs for the 64 experimental pupils across the five school days of the observation week.

### 4.5.1 Session completion and time on task

Five sessions were scheduled during the week (one per school day). Mean completion was 91.4% (SD = 6.8%), equivalent to about 4.57 sessions per pupil. Fifty-two pupils completed at least four of the five sessions. Average time on the platform was 152.6 minutes in total (about 30.5 minutes per attended session). Thirty-eight pupils (59.4%) stayed beyond the scheduled end at least once.

**Table 4.5: Session completion and time-on-task (experimental group, n = 64)**

| Engagement metric | Mean | SD | Min | Max |
|---|---|---|---|---|
| Sessions completed (of 5) | 4.57 | 0.68 | 3 | 5 |
| Session completion rate (%) | 91.4 | 6.8 | 60.0 | 100 |
| Total time on platform (minutes) | 152.6 | 24.1 | 92 | 198 |
| Mean session duration (minutes) | 30.5 | 3.7 | 21.3 | 39.2 |
| Quiz attempts per lesson (mean) | 1.47 | 0.38 | 1.00 | 3.20 |
| Pupils with ≥1 voluntary extension | 38 (59.4%) | — | — | — |

### 4.5.2 XP, levels, stars and daily intensity

In SkulKid, level rises by one for every 500 XP, starting from Level 1. Core XP rules included 10 XP for a first-try correct answer, 5 XP after a retry, 30 XP for finishing a lesson, 20 XP for a perfect lesson, 15 XP for beating a previous score, 25 XP for hitting the daily learning goal, and 50 XP for a seven-day streak bonus.

Mean total XP by Friday was 808 (SD = 161; range 420–1,240). Daily XP rose from 132 on Monday to 188 on Friday (a 42.4% rise). Most active pupils reached Level 2 during the week.

**Table 4.6: Daily XP accumulation during the observation week (experimental group, n = 64)**

| Day | Mean XP earned | SD | Mean cumulative XP | % at Level 2+ |
|---|---|---|---|---|
| Monday | 132 | 28 | 132 | 0.0% |
| Tuesday | 148 | 31 | 280 | 3.1% |
| Wednesday | 162 | 34 | 442 | 28.1% |
| Thursday | 178 | 38 | 620 | 64.1% |
| Friday | 188 | 41 | 808 | 79.7% |

### 4.5.3 Achievements, daily quests and celebrations

By Friday, First Step was nearly universal (62/64; 96.9%). XP Champion had been earned by 51 pupils (79.7%). Lesson Explorer (34; 53.1%), Star Collector (29; 45.3%) and Surprise Seeker (22; 34.4%) were less common in a single week, as expected. Mean daily-quest claim rate across the five days was 84.7% (SD = 11.3%).

### 4.5.4 Streaks and daily goals

Mean maximum streak length across the five school days was 4.1 days (SD = 1.1). Forty-one pupils (64.1%) reached at least four consecutive days, and 18 (28.1%) kept a five-day streak. Longer streaks within the week went with stronger post-test scores after pre-test control (Mathematics *r* = .52; English *r* = .48; both *p* < .001).

### 4.5.5 Leaderboards, class chat and social features (RQ7)

Pupils opened a leaderboard about 3.8 times per session (SD = 1.4). Checks peaked on Wednesday and Thursday. The leaderboard motivation item averaged 3.94 (SD = 0.87); only 6.3% reported feeling bad about their learning from the board. Teachers also used Helper of the Week and capped surprise XP bonuses (10/20/50) during the observation week.

## 4.6 Adaptive Progression and Classroom Practice Tools (RQ3, RQ4)

Adaptation is rule-based: ≥80% unlock/continue; 50–79% unlock with targeted practice; <50% revise and keep next lesson locked. Ended class quizzes move into PASCO for ungraded revision.

### 4.6.1 Quiz pathways across the observation week

The experimental group logged 641 scored attempts (mean 10.0 per pupil, SD = 2.1). Retry share fell from 23.1% on Monday to 9.4% on Friday; Unlock rose from 46.2% to 57.9%.

**Table 4.7: Adaptive pathway distribution by day**

| Day | Attempts | Unlock (≥80%) | Practice (50–79%) | Retry (<50%) |
|---|---|---|---|---|
| Monday | 118 | 46.2% | 30.7% | 23.1% |
| Tuesday | 124 | 49.1% | 31.8% | 19.1% |
| Wednesday | 129 | 51.6% | 32.4% | 16.0% |
| Thursday | 132 | 53.8% | 31.5% | 14.7% |
| Friday | 138 | 57.9% | 32.7% | 9.4% |
| Total | 641 | 52.3% | 31.4% | 16.3% |

### 4.6.2 Teacher monitoring and support bands (RQ3)

All four teachers rated progress tracking Useful or Very Useful (M = 4.50 / 5). Support bands used: needs support (<60%), watch (inactive or <70%), on track.

### 4.6.3 How different learners used the pathways (RQ4)

**Table 4.8: Pathway-use profiles in the experimental group**

| Profile | n (%) | Mean post-test (Math, Eng) | What stood out in the logs |
|---|---|---|---|
| Quick unlockers | 19 (29.7%) | 32.4, 33.1 | High Unlock rate, fewer retries, longer lesson time |
| Steady builders | 28 (43.8%) | 28.1, 28.9 | Many Practice-more cycles; scores rose day by day |
| Supported revisers | 17 (26.6%) | 22.6, 23.4 | Highest Retry share early in the week; largest proportional gain from baseline |

### 4.6.4 Timed challenges and PASCO revision

Timed-challenge labelling applied when a live quiz was due within 48 hours. PASCO revision was used mainly on Thursday and Friday before the post-test.

## 4.7 Student Questionnaire Results (RQ1, RQ2, RQ5, RQ6)

All 64 experimental pupils completed the 24-item questionnaire at the end of the observation week.

**Table 4.9: Questionnaire reliability and subscale scores**

| Subscale | Items | Cronbach’s α | Mean | SD | Range |
|---|---|---|---|---|---|
| Learning Motivation | 6 | .83 | 22.14 | 3.21 | 6–30 |
| Platform Usability | 6 | .89 | 23.47 | 2.84 | 6–30 |
| Gamification Engagement | 6 | .86 | 22.89 | 3.08 | 6–30 |
| Perceived Learning Effectiveness | 6 | .84 | 22.31 | 3.17 | 6–30 |
| Full scale | 24 | .91 | 90.81 | 10.64 | 24–120 |

Motivation item mean = 3.69; usability = 3.91; gamification = 3.82. Collaboration happened through class chat, reactions, Helper of the Week and teacher shout-outs rather than a real-time multiplayer game.

## 4.8 PLS-SEM Structural Model Results

**Table 4.10: Measurement model quality criteria**

| Construct | CR | AVE | Highest HTMT | Loading range |
|---|---|---|---|---|
| Gamification Engagement (GE) | 0.88 | 0.61 | 0.74 | 0.71–0.84 |
| Adaptive Progression Behaviour (APB) | 0.83 | 0.56 | 0.68 | 0.69–0.81 |
| Academic Motivation (AM) | 0.86 | 0.59 | 0.72 | 0.70–0.83 |
| Academic Performance (AP) | 0.91 | 0.67 | 0.74 | 0.78–0.88 |

**Table 4.11: Structural path coefficients**

| Hypothesis | Path | β | *t* | 95% CI | Decision |
|---|---|---|---|---|---|
| H1 | GE → AM | 0.54 | 7.83 | [0.40, 0.68] | Supported |
| H2 | GE → AP | 0.31 | 4.12 | [0.16, 0.46] | Supported |
| H3 | APB → AP | 0.38 | 5.47 | [0.24, 0.52] | Supported |
| H4 | AM → AP | 0.27 | 3.91 | [0.13, 0.41] | Supported |

R² for Academic Performance = .642.

## 4.9 Integrated Discussion

SkulKid users outperformed control pupils after one week. Gains should be read as short-term evidence. Achievements, streaks and daily quests carried everyday motivation; class-local leaderboards and teacher recognition added social push. Rule-based adaptation still produced differentiated Monday–Friday pathways without opaque ML clustering.

## 4.10 Chapter Summary

This chapter presented findings from a one-week classroom observation of SkulKid with 128 Primary 4 and 5 pupils in the Central Region. Groups were equivalent at pre-test. By Friday, SkulKid users showed larger Mathematics and English gains than control pupils. Platform logs showed high session completion across five scheduled days, rising daily XP, strong streak and quest participation, and a Monday-to-Friday shift from Retry toward Unlock pathways. Questionnaire and PLS-SEM findings supported the engagement–performance story (R² = .642). Longer follow-up would be needed before claiming durable learning effects. Implications are taken up in Chapter 5.

*Selected references: Bangor et al. (2008); Barreto et al. (2017); Cepeda et al. (2006); Csikszentmihalyi (1990); Hamari et al. (2016); Sailer et al. (2017); Sanchez et al. (2020); Skinner et al. (2009).*
