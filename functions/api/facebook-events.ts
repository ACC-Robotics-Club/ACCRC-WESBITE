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
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Cloudflare Pages Function that keeps the Facebook access token server-side.
 * Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in Cloudflare Pages to
 * enable automatic event imports from the official ACCRC Facebook page.
 */
export const onRequestGet = async ({ env }: PagesContext): Promise<Response> => {
  if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return json({ events: [], configured: false });
  }

  const configuredVersion = env.FACEBOOK_GRAPH_API_VERSION || "v24.0";
  const version = /^v\d+\.\d+$/.test(configuredVersion) ? configuredVersion : "v24.0";
  const pageId = encodeURIComponent(env.FACEBOOK_PAGE_ID);
  const url = new URL(`https://graph.facebook.com/${version}/${pageId}/events`);
  url.searchParams.set(
    "fields",
    "id,name,description,start_time,end_time,place,cover,permalink_url"
  );
  url.searchParams.set("access_token", env.FACEBOOK_PAGE_ACCESS_TOKEN);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Facebook events request failed", response.status);
      return json({ events: [], configured: true, error: "facebook_unavailable" }, { status: 502 });
    }

    const payload = (await response.json()) as { data?: GraphEvent[] };
    const now = Date.now();
    const events = (payload.data ?? [])
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

    return json({ events, configured: true });
  } catch (error) {
    console.error("Facebook events request failed", error);
    return json({ events: [], configured: true, error: "facebook_unavailable" }, { status: 502 });
  }
};
