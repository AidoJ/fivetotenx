import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AdminNotification {
  id: string;
  event_type: string;
  title: string;
  message: string | null;
  assessment_id: string | null;
  lead_name: string | null;
  business_name: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  onOpenLead?: (assessmentId: string) => void;
}

const NotificationBell = ({ onOpenLead }: NotificationBellProps) => {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) setItems(data as AdminNotification[]);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-notifications-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const n = payload.new as AdminNotification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          toast(n.title, { description: n.message || undefined });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const n = payload.new as AdminNotification;
          setItems((prev) => prev.map((it) => (it.id === n.id ? n : it)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const unreadCount = items.filter((i) => !i.read).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    await supabase
      .from('admin_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase
      .from('admin_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds);
  };

  const dismiss = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('admin_notifications').delete().eq('id', id);
  };

  const handleClick = (n: AdminNotification) => {
    markRead(n.id);
    if (n.assessment_id && onOpenLead) {
      onOpenLead(n.assessment_id);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative h-7 sm:h-9 px-2">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 max-h-[500px] flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark all
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`group p-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!n.read ? 'font-bold' : 'font-medium'} text-foreground leading-snug`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(n.id);
                          }}
                          className="text-muted-foreground hover:text-primary"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(n.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
