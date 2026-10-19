interface Env {
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  FACEBOOK_GRAPH_API_VERSION?: string;
}

interface PagesContext {
  env: Env;
}

interface GraphEvent {
  id: string;
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  place?: { name?: string; location?: { city?: string; country?: string } };
  cover?: { source?: string };
  permalink_url?: string;
}

interface GraphPost {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
}

function getLocation(event: GraphEvent): string {
  const placeName = event.place?.name;
  if (placeName) return placeName;

  const location = [event.place?.location?.city, event.place?.location?.country]
    .filter((value): value is string => Boolean(value))
    .join(', ');
  return location || 'See Facebook for details';
}

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=900",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Cloudflare Pages Function that keeps the Facebook access token server-side.
 * Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in Cloudflare Pages to
 * enable automatic imports from the official ACCRC Facebook page.
 *
 * Two feeds are read, because the club announces most of its activities as
 * ordinary posts rather than as structured calendar events:
 *   - `/{id}/events` — dated, place-aware entries for the calendar
 *   - `/{id}/feed`   — recent posts, surfaced on the site as "latest activity"
 * Either one failing still returns whatever the other produced.
 */
export const onRequestGet = async ({ env }: PagesContext): Promise<Response> => {
  if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return json({ events: [], posts: [], configured: false });
  }

  const version = env.FACEBOOK_GRAPH_API_VERSION || "v24.0";
  const base = `https://graph.facebook.com/${version}/${env.FACEBOOK_PAGE_ID}`;
  const token = env.FACEBOOK_PAGE_ACCESS_TOKEN;

  const read = async <T>(path: string, fields: string, limit: number) => {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Facebook ${path} request failed`, response.status);
      return null;
    }
    return ((await response.json()) as { data?: T[] }).data ?? [];
  };

  try {
    const [rawEvents, rawPosts] = await Promise.all([
      read<GraphEvent>(
        "/events",
        "id,name,description,start_time,end_time,place,cover,permalink_url",
        25
      ),
      read<GraphPost>(
        "/feed",
        "id,message,created_time,permalink_url,full_picture",
        12
      ),
    ]);

    const now = Date.now();
    const events = (rawEvents ?? [])
      .filter((event) => {
        if (!event.start_time) return false;
        return new Date(event.start_time).getTime() >= now;
      })
      .map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description ?? "",
        startTime: event.start_time,
        endTime: event.end_time,
        location: getLocation(event),
        imageUrl: event.cover?.source,
        permalinkUrl: event.permalink_url ?? `https://www.facebook.com/events/${event.id}`,
      }));

    // Posts are announcements rather than calendar entries. The first line
    // usually reads as the title, so it becomes the headline and the rest of
    // the message is kept as supporting copy.
    const posts = (rawPosts ?? [])
      .filter((post) => Boolean(post.message || post.permalink_url))
      .map((post) => {
        const message = (post.message ?? "").trim();
        const [firstLine, ...rest] = message.split("\n").filter(Boolean);
        return {
          id: post.id,
          message,
          headline: (firstLine ?? message).slice(0, 90),
          body: rest.join(" ").slice(0, 220),
          createdTime: post.created_time,
          permalinkUrl:
            post.permalink_url ?? `https://www.facebook.com/${env.FACEBOOK_PAGE_ID}/posts/${post.id}`,
          imageUrl: post.full_picture,
        };
      });

    return json({ events, posts, configured: true });
  } catch (error) {
    console.error("Facebook request failed", error);
    return json({ events: [], posts: [], configured: true, error: "facebook_unavailable" }, { status: 502 });
  }
};
