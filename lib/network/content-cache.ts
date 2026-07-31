import { CONTENT_STORE, idbGet, idbSet } from "@/lib/network/idb";

const IMAGE_CACHE = "skulkid-content-images-v1";

export function lessonCacheKey(lessonId: string) {
  return `lesson:${lessonId}`;
}

export function classQuizCacheKey(classId: string, quizId: string) {
  return `class-quiz:${classId}:${quizId}`;
}

export function classCourseCacheKey(classId: string, courseSlug: string) {
  return `class-course:${classId}:${courseSlug}`;
}

export async function cacheJsonPayload(key: string, payload: unknown) {
  await idbSet(CONTENT_STORE, key, { savedAt: Date.now(), payload });
}

export async function readCachedJsonPayload<T>(key: string): Promise<T | null> {
  const row = await idbGet<{ savedAt: number; payload: T }>(CONTENT_STORE, key);
  return row?.payload ?? null;
}

function collectImageUrls(value: unknown, into: Set<string>) {
  if (!value) return;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
      const lower = value.toLowerCase();
      if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(lower) || lower.includes("/placeholders/")) {
        into.add(value);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, into);
    return;
  }
  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectImageUrls(nested, into);
    }
  }
}

/** Best-effort Cache API warm-up for lesson/quiz images. */
export async function warmContentImages(payload: unknown) {
  if (typeof caches === "undefined") return;
  const urls = new Set<string>();
  collectImageUrls(payload, urls);
  if (!urls.size) return;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    await Promise.allSettled(
      [...urls].map(async (url) => {
        try {
          const absolute = new URL(url, window.location.origin).toString();
          const existing = await cache.match(absolute);
          if (existing) return;
          const response = await fetch(absolute, { cache: "force-cache" });
          if (response.ok) await cache.put(absolute, response.clone());
        } catch {
          // ignore single image failures
        }
      })
    );
  } catch {
    // ignore
  }
}

export async function cacheLessonContent(lessonId: string, lesson: unknown) {
  await cacheJsonPayload(lessonCacheKey(lessonId), lesson);
  void warmContentImages(lesson);
}

export async function readCachedLesson<T>(lessonId: string) {
  return readCachedJsonPayload<T>(lessonCacheKey(lessonId));
}

export async function cacheClassQuizContent(classId: string, quizId: string, payload: unknown) {
  await cacheJsonPayload(classQuizCacheKey(classId, quizId), payload);
  void warmContentImages(payload);
}

export async function readCachedClassQuiz<T>(classId: string, quizId: string) {
  return readCachedJsonPayload<T>(classQuizCacheKey(classId, quizId));
}

export async function cacheClassCourseContent(classId: string, courseSlug: string, payload: unknown) {
  await cacheJsonPayload(classCourseCacheKey(classId, courseSlug), payload);
  void warmContentImages(payload);
}

export async function readCachedClassCourse<T>(classId: string, courseSlug: string) {
  return readCachedJsonPayload<T>(classCourseCacheKey(classId, courseSlug));
}
