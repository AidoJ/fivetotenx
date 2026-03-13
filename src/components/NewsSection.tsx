import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Rss, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

interface Feed {
  url: string;
  title: string;
  items: RSSItem[];
  error: string | null;
}

const FEED_URLS = [
  'https://news.microsoft.com/source/topics/ai/feed/',
  'https://research.google/blog/rss/',
  'https://www.ft.com/artificial-intelligence?format=rss',
  'https://aiweekly.co/issues.rss',
];

const FEED_LABELS = ['Microsoft AI', 'Google Research', 'FT Intelligence', 'AI Weekly'];

const SCREEN_COLORS = [
  'hsl(220 72% 50%)',
  'hsl(140 60% 45%)',
  'hsl(328 68% 52%)',
  'hsl(30 88% 55%)',
];

const NewsSection = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-rss', {
          body: { urls: FEED_URLS },
        });

        if (error) {
          console.error('RSS fetch error:', error);
          return;
        }

        if (data?.success && data.feeds) {
          setFeeds(data.feeds);
        }
      } catch (e) {
        console.error('RSS error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <section className="px-4 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Monitor className="w-8 h-8" style={{ color: 'hsl(260 65% 65%)' }} />
            <h2
              className="text-2xl md:text-4xl font-display font-bold"
              style={{ color: 'hsl(0 0% 95%)' }}
            >
              AI{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--gradient-primary)' }}
              >
                News Hub
              </span>
            </h2>
          </div>
          <p style={{ color: 'hsl(220 20% 65%)' }}>
            Live feeds from the frontlines of AI innovation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {FEED_LABELS.map((label, i) => {
            const feed = feeds[i];
            const color = SCREEN_COLORS[i];

            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'hsl(230 20% 8%)',
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 20px ${color}40, inset 0 1px 0 hsl(0 0% 100% / 0.05)`,
                }}
              >
                {/* TV header bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: `${color}20`, borderBottom: `1px solid ${color}40` }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ background: color }}
                  />
                  <Rss className="w-3.5 h-3.5" style={{ color }} />
                  <span
                    className="text-xs font-display font-bold tracking-wider uppercase"
                    style={{ color }}
                  >
                    {label}
                  </span>
                </div>

                {/* Content area */}
                <div className="p-4 space-y-2 min-h-[200px]">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="space-y-1.5">
                          <div
                            className="h-3 rounded animate-pulse"
                            style={{
                              background: 'hsl(230 15% 18%)',
                              width: `${80 - n * 10}%`,
                            }}
                          />
                          <div
                            className="h-2 rounded animate-pulse"
                            style={{ background: 'hsl(230 15% 15%)', width: '60%' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : feed?.items?.length ? (
                    feed.items.slice(0, 4).map((item, j) => (
                      <a
                        key={j}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg px-3 py-2.5 transition-colors group"
                        style={{ background: 'hsl(230 15% 12%)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = `${color}15`)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'hsl(230 15% 12%)')
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-xs font-medium leading-snug line-clamp-2"
                            style={{ color: 'hsl(0 0% 88%)' }}
                          >
                            {item.title}
                          </p>
                          <ExternalLink
                            className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color }}
                          />
                        </div>
                        {item.pubDate && (
                          <p
                            className="text-[10px] mt-1"
                            style={{ color: 'hsl(220 15% 45%)' }}
                          >
                            {formatDate(item.pubDate)}
                          </p>
                        )}
                      </a>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[160px]">
                      <p className="text-xs" style={{ color: 'hsl(220 15% 40%)' }}>
                        No signal — check back soon
                      </p>
                    </div>
                  )}
                </div>

                {/* TV scan line effect */}
                <div
                  className="h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
