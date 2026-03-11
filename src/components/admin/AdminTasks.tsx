import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Check, Circle, Clock, Calendar } from 'lucide-react';

interface AdminTask {
  id: string;
  action: string;
  status: string;
  due_date: string | null;
  owner: string;
  assessment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminTasksProps {
  tasks: AdminTask[];
  setTasks: React.Dispatch<React.SetStateAction<AdminTask[]>>;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const OWNER_OPTIONS = ['Eoghan', 'Aidan'];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  todo: { label: 'To Do', color: 'bg-muted text-muted-foreground', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30', icon: Clock },
  done: { label: 'Done', color: 'bg-green-500/10 text-green-700 border-green-500/30', icon: Check },
};

const AdminTasks = ({ tasks, setTasks }: AdminTasksProps) => {
  const [action, setAction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [owner, setOwner] = useState('Eoghan');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!action.trim()) return;
    setAdding(true);
    const { data, error } = await supabase.from('admin_tasks' as any).insert([{
      action: action.trim(),
      status: 'todo',
      due_date: dueDate || null,
      owner,
    }]).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setTasks(prev => [data as any, ...prev]);
      setAction('');
      setDueDate('');
      toast({ title: 'Task added ✅' });
    }
    setAdding(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('admin_tasks' as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));
    }
  };

  const handleOwnerChange = async (id: string, newOwner: string) => {
    const { error } = await supabase.from('admin_tasks' as any)
      .update({ owner: newOwner, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, owner: newOwner } : t));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('admin_tasks' as any).delete().eq('id', id);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Task deleted' });
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Add Task</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={action}
            onChange={e => setAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="What needs to be done?"
            className="flex-1 h-9 text-sm"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="h-9 text-sm w-auto sm:w-40"
          />
          <select
            value={owner}
            onChange={e => setOwner(e.target.value)}
            className="h-9 text-sm rounded-md border border-input bg-background px-3 text-foreground"
          >
            {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Button onClick={handleAdd} disabled={adding || !action.trim()} className="h-9 gap-1">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', ...STATUS_OPTIONS] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary'
            }`}
          >
            {s === 'all' ? 'All' : statusConfig[s]?.label || s} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No tasks {filter !== 'all' ? `with status "${statusConfig[filter]?.label}"` : ''}</p>
          </div>
        ) : (
          filtered.map(task => {
            const cfg = statusConfig[task.status] || statusConfig.todo;
            const overdue = task.status !== 'done' && isOverdue(task.due_date);
            return (
              <div key={task.id} className={`rounded-lg border bg-card p-3 flex items-center gap-3 ${overdue ? 'border-red-500/50' : 'border-border'}`}>
                {/* Status cycle button */}
                <button
                  onClick={() => {
                    const idx = STATUS_OPTIONS.indexOf(task.status);
                    handleStatusChange(task.id, STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length]);
                  }}
                  className="shrink-0"
                  title="Click to cycle status"
                >
                  {task.status === 'done' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : task.status === 'in_progress' ? (
                    <Clock className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Action text */}
                <p className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.action}
                </p>

                {/* Due date */}
                {task.due_date && (
                  <div className={`flex items-center gap-1 text-[11px] shrink-0 ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}

                {/* Owner toggle */}
                <button
                  onClick={() => handleOwnerChange(task.id, task.owner === 'Eoghan' ? 'Aidan' : 'Eoghan')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    task.owner === 'Eoghan' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary text-foreground border border-border'
                  }`}
                >
                  {task.owner}
                </button>

                {/* Status dropdown */}
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value)}
                  className="h-7 text-[10px] rounded-md border border-border bg-background px-1.5 text-foreground shrink-0"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                  ))}
                </select>

                {/* Delete */}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminTasks;
