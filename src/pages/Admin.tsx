import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Building2, Calendar, DollarSign, ArrowRight, ChevronDown, ChevronUp, ExternalLink, Loader2, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logo from '@/assets/logo-5to10x-color.png';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'assessment', label: 'Assessment', color: 'bg-muted text-muted-foreground' },
  { key: 'qualified', label: 'Qualified', color: 'bg-primary/15 text-primary' },
  { key: 'deep_dive_sent', label: 'Deep Dive Sent', color: 'bg-accent/15 text-accent' },
  { key: 'deep_dive_complete', label: 'Deep Dive Done', color: 'bg-accent/25 text-accent' },
  { key: 'proposal', label: 'Proposal', color: 'bg-primary/25 text-primary' },
  { key: 'signed', label: 'Signed ✅', color: 'bg-green-100 text-green-700' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const EMAIL_TEMPLATES = [
  {
    id: 'roi-report',
    name: 'ROI Report Email',
    trigger: 'Sent when user completes assessment and clicks "Send Report"',
    from: 'grow@5to10x.app',
    subject: 'Strategic Growth Report – {Business Name}',
    description: 'Full ROI breakdown with business data verification, coaching section, pricing/payment options, and Deep Dive CTA for qualified leads.',
    edgeFunction: 'send-report',
  },
  {
    id: 'deep-dive-invite',
    name: 'Deep Dive Invite',
    trigger: 'Manual send from admin panel, or included in report email for qualified leads',
    from: 'grow@5to10x.app',
    subject: '{Name}, your custom app proposal starts here',
    description: 'Invitation email with CTA button to complete the Deep Dive questionnaire. Sent to qualified leads who haven\'t started yet.',
    edgeFunction: 'send-deep-dive-invite',
  },
  {
    id: 'deep-dive-confirmation',
    name: 'Deep Dive Confirmation',
    trigger: 'Automatically sent when lead submits the Deep Dive questionnaire',
    from: 'grow@5to10x.app',
    subject: 'We\'ve received your Deep Dive — next steps',
    description: 'Thank-you email outlining the 3-step process (review → proposal → strategy call). Also notifies admin via separate email.',
    edgeFunction: 'send-deep-dive-confirmation',
  },
  {
    id: 'admin-notification',
    name: 'Admin Qualified Lead Alert',
    trigger: 'Automatically sent to grow@5to10x.app when a lead qualifies',
    from: 'grow@5to10x.app',
    subject: '🔥 New Qualified Lead: {Name} – {Business}',
    description: 'Internal notification with lead details, projected impact, and build cost range. Includes link to admin pipeline.',
    edgeFunction: 'send-report (inline)',
  },
  {
    id: 'follow-up-reminder',
    name: '48h Follow-up Reminder',
    trigger: 'Automated via scheduled cron job — fires for qualified leads who haven\'t completed Deep Dive after 48 hours',
    from: 'grow@5to10x.app',
    subject: '{Name}, your custom app proposal is waiting',
    description: 'Gentle nudge email reminding qualified leads to complete the Deep Dive. Moves lead to "Deep Dive Sent" stage after sending.',
    edgeFunction: 'follow-up-reminder',
  },
];

const LeadCard = ({ lead, onMove, onSendDeepDive }: {
  lead: Assessment;
  onMove: (id: string, stage: PipelineStage) => void;
  onSendDeepDive: (lead: Assessment) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const roi = lead.roi_results as any;
  const form = lead.form_data as any;
  const currentIdx = STAGES.findIndex(s => s.key === lead.pipeline_stage);

  const canSendDeepDive = lead.is_qualified && lead.pipeline_stage === 'qualified';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm text-foreground">{lead.contact_name}</p>
          <p className="text-xs text-muted-foreground">{lead.business_name || 'No business name'}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="w-3 h-3" />
        <a href={`mailto:${lead.contact_email}`} className="hover:text-primary truncate">{lead.contact_email}</a>
      </div>

      {roi?.totalAnnualImpact && (
        <div className="flex items-center gap-2">
          <DollarSign className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-foreground">{formatCurrency(roi.totalAnnualImpact)}</span>
          <span className="text-xs text-muted-foreground">annual impact</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        {formatDate(lead.created_at)}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {lead.is_qualified && (
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">Qualified</Badge>
        )}
        {canSendDeepDive && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 gap-1"
            onClick={(e) => { e.stopPropagation(); onSendDeepDive(lead); }}
          >
            <Send className="w-3 h-3" />
            Send Deep Dive
          </Button>
        )}
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 pt-2 border-t border-border"
        >
          {lead.contact_phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" /> {lead.contact_phone}
            </div>
          )}
          {lead.industry && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" /> {lead.industry}
            </div>
          )}
          {roi?.pricing && (
            <div className="text-xs space-y-1 bg-secondary rounded-md p-2">
              <p><strong>Build cost:</strong> {formatCurrency(roi.pricing.buildCostLow)} – {formatCurrency(roi.pricing.buildCostHigh)}</p>
              <p><strong>Tier:</strong> {roi.pricing.tierLabel}</p>
              <p><strong>ROI:</strong> {Math.round(roi.roiPercentage)}%</p>
              <p><strong>Break-even:</strong> {Math.round(roi.breakEvenMonths)} months</p>
            </div>
          )}
          <div className="flex items-center gap-1 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground mr-1">Move to:</span>
            {STAGES.filter((_, i) => i !== currentIdx).map(s => (
              <button
                key={s.key}
                onClick={() => onMove(lead.id, s.key)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-secondary transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const Admin = () => {
  const [leads, setLeads] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingDeepDive, setSendingDeepDive] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('roi_assessments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading leads', description: error.message, variant: 'destructive' });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleMove = async (id: string, newStage: PipelineStage) => {
    const updates: any = { pipeline_stage: newStage };
    if (newStage === 'qualified') {
      updates.qualified_at = new Date().toISOString();
      updates.is_qualified = true;
    }
    const { error } = await supabase.from('roi_assessments').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: 'Moved', description: `Lead moved to ${newStage.replace(/_/g, ' ')}` });
    }
  };

  const handleSendDeepDive = async (lead: Assessment) => {
    setSendingDeepDive(lead.id);
    try {
      const { error } = await supabase.functions.invoke('send-deep-dive-invite', {
        body: {
          contactName: lead.contact_name,
          contactEmail: lead.contact_email,
          businessName: lead.business_name,
          assessmentId: lead.id,
        },
      });
      if (error) throw error;

      // Update stage to deep_dive_sent
      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'deep_dive_sent' as any, invite_sent: true })
        .eq('id', lead.id);

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_stage: 'deep_dive_sent' as PipelineStage, invite_sent: true } : l));
      toast({ title: 'Deep Dive Sent ✅', description: `Invite sent to ${lead.contact_email}` });
    } catch (err: any) {
      console.error('Send deep dive error:', err);
      toast({ title: 'Error', description: 'Failed to send deep dive invite.', variant: 'destructive' });
    } finally {
      setSendingDeepDive(null);
    }
  };

  const grouped = STAGES.map(stage => ({
    ...stage,
    leads: leads.filter(l => l.pipeline_stage === stage.key),
  }));

  const totalImpact = leads.reduce((sum, l) => sum + ((l.roi_results as any)?.totalAnnualImpact || 0), 0);
  const qualifiedCount = leads.filter(l => l.is_qualified).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="5to10X" className="h-12 w-auto" />
            <div>
              <h1 className="text-base font-display font-bold text-foreground">Pipeline Dashboard</h1>
              <p className="text-xs text-muted-foreground">{leads.length} leads · {qualifiedCount} qualified · {formatCurrency(totalImpact)} total pipeline</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4">
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2">
              <Users className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <FileText className="w-4 h-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No leads yet</p>
                <p className="text-sm">Leads will appear here after assessments are completed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {grouped.map(stage => (
                  <div key={stage.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-display font-bold text-foreground">{stage.label}</h2>
                      <Badge variant="outline" className="text-[10px]">{stage.leads.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {stage.leads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onMove={handleMove}
                          onSendDeepDive={handleSendDeepDive}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="emails">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">Email Templates</h2>
                  <p className="text-sm text-muted-foreground">All automated emails sent through the sales pipeline</p>
                </div>
              </div>

              <div className="grid gap-4">
                {EMAIL_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          {template.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">{template.trigger}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {template.edgeFunction}
                      </Badge>
                    </div>

                    <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-medium w-16 shrink-0">From:</span>
                        <span className="text-foreground text-xs">{template.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-medium w-16 shrink-0">Subject:</span>
                        <span className="text-foreground text-xs font-medium">{template.subject}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
