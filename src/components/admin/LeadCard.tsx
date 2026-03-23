import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, DollarSign, ChevronDown, Send, FileText, ExternalLink, Copy, Check,
  Clock, AlertCircle, Pencil, Eye, ClipboardList, ClipboardCheck, Plus,
  MessageSquare, Phone, Building2, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

const PIPELINE_STEPS: { key: string; label: string; short: string }[] = [
  { key: 'assessment', label: 'Reality Check™', short: 'CHECK' },
  { key: 'qualified', label: 'Qualified', short: 'QUAL' },
  { key: 'discovery_call', label: 'Straight Talk™', short: 'TALK' },
  { key: 'proposal', label: 'Green Light™', short: 'GREEN' },
  { key: 'signed', label: 'Signed', short: 'SIGNED' },
  { key: 'build_refinement', label: 'Build™', short: 'BUILD' },
  { key: 'completed', label: 'Go Live™', short: 'LIVE' },
];

const stageIdx = (stage: string) => PIPELINE_STEPS.findIndex(s => s.key === stage);

const CALENDLY_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const normalizeInterviewTitle = (title?: string) => {
  if (!title) return 'Straight Talk Call';
  return title
    .replace(/discovery call/gi, 'Straight Talk Call')
    .replace(/discovery/gi, 'Straight Talk');
};
...
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{normalizeInterviewTitle(iv.title)}</span>
                          <Badge variant={iv.call_completed ? 'default' : 'outline'} className="text-[8px] h-4">
                            {iv.call_completed ? '✓ Completed' : 'Upcoming'}
                          </Badge>
                        </div>
                        {iv.scheduled_at && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(iv.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {iv.zoom_link && (
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            <a href={iv.zoom_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              Join Zoom
                            </a>
                          </div>
                        )}
                        {iv.content && (
                          <p className="text-muted-foreground">{iv.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Notes */}
              <Section label="Notes" icon={MessageSquare} badge={notes.length > 0 ? `${notes.length}` : undefined}>
                <div className="space-y-2 py-1">
                  {notes.slice(0, 5).map(n => (
                    <div key={n.id} className="flex items-start gap-2 text-[11px]">
                      <span className="shrink-0">
                        {n.note_type === 'question' ? '❓' : n.note_type === 'action' ? '⚡' : '💬'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">{n.content}</p>
                        <p className="text-[9px] text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <select value={noteType} onChange={e => setNoteType(e.target.value)}
                      className="h-7 text-[10px] rounded-md border border-border bg-secondary px-1.5">
                      <option value="comment">💬</option>
                      <option value="question">❓</option>
                      <option value="action">⚡</option>
                    </select>
                    <Input value={newNote} onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Add note..." className="h-7 text-[10px] flex-1" />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeadCard;
