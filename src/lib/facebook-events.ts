export interface FacebookEvent {
  id: string;
  name: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  imageUrl?: string;
  permalinkUrl: string;
  source: "facebook";
}

interface FacebookEventsResponse {
  events?: Array<{
    id: string;
    name: string;
    description?: string;
    startTime: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    permalinkUrl: string;
  }>;
  posts?: Array<{
    id: string;
    message: string;
    headline: string;
    body?: string;
    createdTime?: string;
    permalinkUrl: string;
    imageUrl?: string;
  }>;
  configured?: boolean;
}

/** A Facebook post, surfaced on the site the same way an event is. */
export interface FacebookPost {
  id: string;
  headline: string;
  body: string;
  date: Date;
  permalinkUrl: string;
  imageUrl?: string;
}

/**
 * Reads the optional Cloudflare Pages Function. The site remains fully usable
 * when Facebook credentials have not been configured yet.
 */
export async function getFacebookEvents(): Promise<FacebookEvent[]> {
  const { events } = await readFacebookFeed();
  return events;
}

/**
 * Reads both Facebook feeds in one request: dated events and recent posts.
 * The club posts most of its activity as an ordinary post, so the posts are
 * what actually keep the site's activity column up to date.
 */
export async function readFacebookFeed(): Promise<{
  events: FacebookEvent[];
  posts: FacebookPost[];
}> {
  /* The endpoint is a Cloudflare Pages Function; on hosts without it (Vercel)
     it 404s. Remember that for the session so it is requested at most once. */
  const MISSING_KEY = "accrc-fb-feed-missing";
  let knownMissing = false;
  try {
    knownMissing = sessionStorage.getItem(MISSING_KEY) === "1";
  } catch {
    // Storage unavailable (private mode); just make the request.
  }
  if (knownMissing) throw new Error("Facebook events are unavailable");

  const response = await fetch("/api/facebook-events", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      try {
        sessionStorage.setItem(MISSING_KEY, "1");
      } catch {
        // Storage unavailable; the request simply repeats next visit.
      }
    }
    throw new Error("Facebook events are unavailable");
  }

  const payload = (await response.json()) as FacebookEventsResponse;

  const events = (payload.events ?? [])
    .map((event) => ({
      id: `facebook-${event.id}`,
      name: event.name,
      description: event.description ?? "",
      date: new Date(event.startTime),
      endDate: event.endTime ? new Date(event.endTime) : undefined,
      location: event.location ?? "Online / see Facebook for details",
      imageUrl: event.imageUrl,
      permalinkUrl: event.permalinkUrl,
      source: "facebook" as const,
    }))
    .filter((event) => !Number.isNaN(event.date.getTime()));

  const posts = (payload.posts ?? [])
    .map((post) => ({
      id: `facebook-${post.id}`,
      headline: post.headline || post.message.slice(0, 90),
      body: post.body ?? post.message,
      date: new Date(post.createdTime ?? 0),
      permalinkUrl: post.permalinkUrl,
      imageUrl: post.imageUrl,
    }))
    .filter((post) => !Number.isNaN(post.date.getTime()));

  return { events, posts };
}
