import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, Send, Search, Play, Pause, MousePointerClick } from 'lucide-react';

type Prospect = {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  suburb: string | null;
  category: string | null;
  notes: string | null;
  stage: string;
  drip_step: number;
  last_contacted_at: string | null;
  next_action_at: string | null;
  source: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  auto_drip?: boolean;
  next_send_at?: string | null;
  clicked_link_at?: string | null;
  unsubscribed?: boolean;
};

const STAGES = [
  { value: 'not_contacted', label: 'Not Contacted', color: 'bg-slate-500/15 text-slate-700' },
  { value: 'email_1_sent', label: 'Email 1 Sent', color: 'bg-blue-500/15 text-blue-700' },
  { value: 'email_2_sent', label: 'Email 2 Sent', color: 'bg-indigo-500/15 text-indigo-700' },
  { value: 'email_3_sent', label: 'Email 3 Sent', color: 'bg-violet-500/15 text-violet-700' },
  { value: 'replied', label: 'Replied', color: 'bg-amber-500/15 text-amber-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'dead', label: 'Dead / Not Interested', color: 'bg-red-500/15 text-red-700' },
];

const emptyForm: Partial<Prospect> = {
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  suburb: '',
  category: '',
  notes: '',
  stage: 'not_contacted',
  source: '',
};

export default function OutboundFunnel() {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Prospect>>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outbound_prospects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load prospects', description: error.message, variant: 'destructive' });
    } else {
      setProspects((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Prospect) => { setEditing(p); setForm(p); setShowForm(true); };

  const save = async () => {
    if (!form.business_name?.trim()) {
      toast({ title: 'Business name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      business_name: form.business_name?.trim(),
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      suburb: form.suburb || null,
      category: form.category || null,
      notes: form.notes || null,
      stage: form.stage || 'not_contacted',
      source: form.source || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from('outbound_prospects').update(payload).eq('id', editing.id)
      : await supabase.from('outbound_prospects').insert(payload as any);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'Prospect updated' : 'Prospect added' });
    setShowForm(false);
    load();
  };

  const remove = async (p: Prospect) => {
    if (!confirm(`Delete ${p.business_name}?`)) return;
    const { error } = await supabase.from('outbound_prospects').delete().eq('id', p.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Prospect deleted' });
    load();
  };

  const [sendingId, setSendingId] = useState<string | null>(null);

  const sendDrip = async (p: Prospect, step?: number) => {
    if (!p.email) {
      return toast({ title: 'No email on file', description: `Add an email for ${p.business_name} first.`, variant: 'destructive' });
    }
    const nextStep = step ?? Math.min((p.drip_step || 0) + 1, 3);
    if (!confirm(`Send drip Email ${nextStep} to ${p.email}?`)) return;
    setSendingId(p.id);
    const { error } = await supabase.functions.invoke('send-drip-email', {
      body: { prospect_id: p.id, step: nextStep },
    });
    setSendingId(null);
    if (error) return toast({ title: 'Send failed', description: error.message, variant: 'destructive' });
    toast({ title: `Email ${nextStep} sent`, description: p.email ?? undefined });
    load();
  };

  const setStage = async (p: Prospect, stage: string) => {
    const { error } = await supabase
      .from('outbound_prospects')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    load();
  };

  const categories = Array.from(new Set(prospects.map(p => p.category).filter(Boolean))) as string[];

  const filtered = prospects.filter(p => {
    if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(`${p.business_name} ${p.contact_name ?? ''} ${p.email ?? ''} ${p.suburb ?? ''}`).toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.value] = prospects.filter(p => p.stage === s.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">Outbound Funnel</h2>
          <p className="text-xs text-muted-foreground">Manage prospects for the email drip campaign.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Prospect</Button>
      </div>

      {/* Stage stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map(s => (
          <button
            key={s.value}
            onClick={() => setStageFilter(stageFilter === s.value ? 'all' : s.value)}
            className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
              stageFilter === s.value ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <p className="text-2xl font-bold text-foreground">{counts[s.value] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search business, contact, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No prospects match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Business</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Stage</th>
                  <th className="text-left p-3">Last Contact</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const stageMeta = STAGES.find(s => s.value === p.stage) ?? STAGES[0];
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-3 align-top">
                        <p className="font-semibold text-foreground">{p.business_name}</p>
                        {p.address && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {p.address}{p.suburb ? `, ${p.suburb}` : ''}
                          </p>
                        )}
                        {p.notes && <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2">{p.notes}</p>}
                      </td>
                      <td className="p-3 align-top">
                        {p.contact_name && <p className="text-foreground">{p.contact_name}</p>}
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {p.email}
                          </a>
                        )}
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {p.phone}
                          </a>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                      </td>
                      <td className="p-3 align-top">
                        <Select value={p.stage} onValueChange={(v) => setStage(p, v)}>
                          <SelectTrigger className={`h-7 text-[11px] ${stageMeta.color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {p.drip_step > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1">Step {p.drip_step}</p>
                        )}
                      </td>
                      <td className="p-3 align-top text-[11px] text-muted-foreground">
                        {p.last_contacted_at ? new Date(p.last_contacted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <Select
                            value=""
                            onValueChange={(v) => sendDrip(p, parseInt(v, 10))}
                            disabled={sendingId === p.id || !p.email}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-[11px]">
                              <SelectValue placeholder={sendingId === p.id ? 'Sending…' : `Send #${Math.min((p.drip_step || 0) + 1, 3)}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Send Email 1</SelectItem>
                              <SelectItem value="2">Send Email 2</SelectItem>
                              <SelectItem value="3">Send Email 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Showing {filtered.length} of {prospects.length} prospects.
      </p>

      {/* Edit / new dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Prospect' : 'New Prospect'}</DialogTitle>
            <DialogDescription>
              Add a business to your outbound drip funnel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label>Business Name *</Label>
              <Input value={form.business_name ?? ''} onChange={e => setForm({ ...form, business_name: e.target.value })} />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name ?? ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Manufacturing / Industrial" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address ?? ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Suburb</Label>
              <Input value={form.suburb ?? ''} onChange={e => setForm({ ...form, suburb: e.target.value })} placeholder="e.g. Clontarf QLD 4019" />
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage ?? 'not_contacted'} onValueChange={v => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Input value={form.source ?? ''} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. Clontarf seed list" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Add Prospect')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
