const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const m = itemXml.match(r);
      return (m?.[1] || m?.[2] || '').trim();
    };

    items.push({
      title: getTag('title'),
      link: getTag('link'),
      pubDate: getTag('pubDate'),
      description: getTag('description').replace(/<[^>]*>/g, '').slice(0, 200),
    });
  }

  // Also try Atom <entry> format
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const getTag = (tag: string) => {
        const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
        const m = entryXml.match(r);
        return (m?.[1] || m?.[2] || '').trim();
      };
      const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"[^>]*\/?>|<link[^>]*>([^<]*)<\/link>/);
      const link = linkMatch?.[1] || linkMatch?.[2] || '';

      items.push({
        title: getTag('title'),
        link,
        pubDate: getTag('published') || getTag('updated'),
        description: getTag('summary').replace(/<[^>]*>/g, '').slice(0, 200) || getTag('content').replace(/<[^>]*>/g, '').slice(0, 200),
      });
    }
  }

  return items.slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ success: false, error: 'urls array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(
      urls.map(async (url: string) => {
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 RSS Reader' },
          });
          const xml = await res.text();
          const items = parseXML(xml);

          // Get feed title
          const titleMatch = xml.match(/<title[^>]*><!?\[?C?D?A?T?A?\[?([^\]<]*)\]?\]?>?<\/title>/) ||
                            xml.match(/<title[^>]*>([^<]*)<\/title>/);
          const feedTitle = (titleMatch?.[1] || url).trim();

          return { url, title: feedTitle, items, error: null };
        } catch (e) {
          return { url, title: url, items: [], error: (e as Error).message };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, feeds: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
