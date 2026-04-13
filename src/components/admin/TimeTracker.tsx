import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TimeEntry {
  id: string;
  team_member: string;
  date: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

interface TimeTrackerProps {
  assessmentId: string;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ assessmentId }) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New entry form
  const [member, setMember] = useState('Eoghan');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('date', { ascending: false });
    if (!error && data) setEntries(data as TimeEntry[]);
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [assessmentId]);

  const handleAdd = async () => {
    if (!hours || parseFloat(hours) <= 0) {
      toast({ title: 'Enter valid hours', variant: 'destructive' });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('time_entries').insert({
      assessment_id: assessmentId,
      team_member: member,
      date,
      hours: parseFloat(hours),
      notes: notes || null,
    });
    if (error) {
      toast({ title: 'Failed to log time', description: error.message, variant: 'destructive' });
    } else {
      setHours('');
      setNotes('');
      toast({ title: 'Time logged ✅' });
      loadEntries();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('time_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const totalByMember = entries.reduce((acc, e) => {
    acc[e.team_member] = (acc[e.team_member] || 0) + Number(e.hours);
    return acc;
  }, {} as Record<string, number>);

  const totalAll = Object.values(totalByMember).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Time Tracking
        </h3>
        <div className="flex items-center gap-2">
          {Object.entries(totalByMember).map(([name, hrs]) => (
            <Badge key={name} variant="outline" className="text-[10px]">
              {name}: {hrs.toFixed(1)}h
            </Badge>
          ))}
          {totalAll > 0 && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
              Total: {totalAll.toFixed(1)}h
            </Badge>
          )}
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="grid grid-cols-[140px_120px_80px_1fr_auto] gap-2 items-end">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Team Member</label>
          <Select value={member} onValueChange={setMember}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Eoghan">Eoghan</SelectItem>
              <SelectItem value="Aidan">Aidan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Hours</label>
          <Input type="number" step="0.25" min="0" value={hours} onChange={e => setHours(e.target.value)} className="h-8 text-xs" placeholder="0.0" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Notes</label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-8 text-xs" placeholder="What did you work on?" />
        </div>
        <Button size="sm" className="h-8 gap-1" onClick={handleAdd} disabled={adding}>
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Log
        </Button>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">No time logged yet</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
              <Badge variant="outline" className={`text-[9px] w-16 justify-center ${entry.team_member === 'Aidan' ? 'border-blue-400/50 text-blue-600' : 'border-emerald-400/50 text-emerald-600'}`}>
                {entry.team_member}
              </Badge>
              <span className="text-[11px] text-muted-foreground w-20">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
              <span className="text-xs font-semibold w-12">{Number(entry.hours).toFixed(1)}h</span>
              <span className="text-xs text-muted-foreground flex-1 truncate">{entry.notes || '—'}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(entry.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
