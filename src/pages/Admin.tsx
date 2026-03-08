import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Building2, Calendar, DollarSign, ChevronDown, ChevronUp, Loader2, Send, FileText, ExternalLink, Copy, Check, Save, Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import logo from '@/assets/logo-5to10x-color.png';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  html_body: string;
  description: string | null;
  trigger_description: string | null;
  updated_at: string;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'deep_dive_sent', label: 'Deep Dive Sent' },
  { key: 'deep_dive_complete', label: 'Deep Dive Done' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'signed', label: 'Signed ✅' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const LeadCard = ({ lead, onMove, onSendDeepDive }: {
  lead: Assessment;
  onMove: (id: string, stage: PipelineStage) => void;
  onSendDeepDive: (lead: Assessment) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const roi = lead.roi_results as any;
  const currentIdx = STAGES.findIndex(s => s.key === lead.pipeline_stage);
  const canSendDeepDive = lead.is_qualified && (lead.pipeline_stage === 'qualified' || lead.pipeline_stage === 'deep_dive_sent');
  const deepDiveUrl = `https://fivetotenx.lovable.app/deep-dive?id=${lead.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepDiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
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
      </div>

      {/* On-site & email actions for qualified leads */}
      {lead.is_qualified && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {canSendDeepDive && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
              onClick={(e) => { e.stopPropagation(); onSendDeepDive(lead); }}>
              <Send className="w-3 h-3" /> Email Invite
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
            onClick={() => window.open(deepDiveUrl, '_blank')}>
            <ExternalLink className="w-3 h-3" /> Open
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
            onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      )}

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 pt-2 border-t border-border">
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
              <button key={s.key} onClick={() => onMove(lead.id, s.key)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-secondary transition-colors">
                {s.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const TemplateEditor = ({ template, onSave }: { template: EmailTemplate; onSave: (t: EmailTemplate) => Promise<void> }) => {
  const [editing, setEditing] = useState({ ...template });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [dirty, setDirty] = useState(false);

  const update = (field: keyof EmailTemplate, value: string) => {
    setEditing(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editing);
    setSaving(false);
    setDirty(false);
  };

  // Preview with sample data
  const previewHtml = editing.html_body
    .replace(/\{\{contactName\}\}/g, 'John Smith')
    .replace(/\{\{businessName\}\}/g, 'Acme Corp')
    .replace(/\{\{deepDiveUrl\}\}/g, 'https://fivetotenx.lovable.app/deep-dive?id=sample');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              {template.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{template.trigger_description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{template.template_key}</Badge>
            {dirty && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px]">From Name</Label>
            <Input className="h-8 text-xs" value={editing.from_name} onChange={e => update('from_name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">From Email</Label>
            <Input className="h-8 text-xs" value={editing.from_email} onChange={e => update('from_email', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Subject Line</Label>
            <Input className="h-8 text-xs" value={editing.subject} onChange={e => update('subject', e.target.value)} />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Variables: <code className="bg-secondary px-1 rounded">{'{{contactName}}'}</code> <code className="bg-secondary px-1 rounded">{'{{businessName}}'}</code> <code className="bg-secondary px-1 rounded">{'{{deepDiveUrl}}'}</code>
        </p>
      </div>

      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              viewMode === 'preview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setViewMode('html')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              viewMode === 'html' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> HTML
          </button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="bg-muted/30 p-4">
          <div className="mx-auto max-w-[640px] bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ minHeight: 500 }}
              title={`Preview: ${template.name}`}
            />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <Textarea
            value={editing.html_body}
            onChange={e => update('html_body', e.target.value)}
            className="font-mono text-xs min-h-[400px] leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};

const ROI_REPORT_INFO = {
  name: 'ROI Report Email',
  trigger: 'Sent when assessment is completed and "Send Report" is clicked',
  from: 'grow@5to10x.app',
  subject: 'Strategic Growth Report – {Business Name}',
  description: 'Full ROI breakdown with business data, coaching, pricing, and Deep Dive CTA. This template is code-managed due to its complexity (dynamic pricing tables, conditional sections). Edit via the send-report edge function.',
};

const Admin = () => {
  const [leads, setLeads] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    const { data, error } = await supabase.from('roi_assessments').select('*').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setLeads(data || []);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true });
    if (error) toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    else setTemplates((data as EmailTemplate[]) || []);
    setTemplatesLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleMove = async (id: string, newStage: PipelineStage) => {
    const updates: any = { pipeline_stage: newStage };
    if (newStage === 'qualified') {
      updates.qualified_at = new Date().toISOString();
      updates.is_qualified = true;
    }
    const { error } = await supabase.from('roi_assessments').update(updates).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: 'Moved', description: `Lead moved to ${newStage.replace(/_/g, ' ')}` });
    }
  };

  const handleSendDeepDive = async (lead: Assessment) => {
    try {
      const { error } = await supabase.functions.invoke('send-deep-dive-invite', {
        body: { contactName: lead.contact_name, contactEmail: lead.contact_email, businessName: lead.business_name, assessmentId: lead.id },
      });
      if (error) throw error;
      await supabase.from('roi_assessments').update({ pipeline_stage: 'deep_dive_sent' as any, invite_sent: true }).eq('id', lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_stage: 'deep_dive_sent' as PipelineStage, invite_sent: true } : l));
      toast({ title: 'Deep Dive Sent ✅', description: `Invite sent to ${lead.contact_email}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send invite.', variant: 'destructive' });
    }
  };

  const handleSaveTemplate = async (updated: EmailTemplate) => {
    const { error } = await supabase.from('email_templates')
      .update({
        subject: updated.subject,
        from_name: updated.from_name,
        from_email: updated.from_email,
        html_body: updated.html_body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id);
    if (error) toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    else {
      setTemplates(prev => prev.map(t => t.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : t));
      toast({ title: 'Template saved ✅' });
    }
  };

  const grouped = STAGES.map(stage => ({ ...stage, leads: leads.filter(l => l.pipeline_stage === stage.key) }));
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
          <Button variant="outline" size="sm" onClick={fetchLeads}>Refresh</Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4">
        <Tabs defaultValue="pipeline" className="space-y-4" onValueChange={(v) => { if (v === 'emails' && templates.length === 0) fetchTemplates(); }}>
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2"><Users className="w-4 h-4" />Pipeline</TabsTrigger>
            <TabsTrigger value="emails" className="gap-2"><FileText className="w-4 h-4" />Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                        <LeadCard key={lead.id} lead={lead} onMove={handleMove} onSendDeepDive={handleSendDeepDive} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="emails">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Email Templates</h2>
                <p className="text-sm text-muted-foreground">Edit subject lines, content, and styling. Changes apply immediately to all future emails.</p>
              </div>

              {/* ROI Report (code-managed) */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-2 opacity-80">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {ROI_REPORT_INFO.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">Code-managed</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ROI_REPORT_INFO.trigger}</p>
                <div className="bg-secondary rounded-lg p-3 text-xs space-y-1">
                  <p><span className="text-muted-foreground font-medium">From:</span> <span className="text-foreground">{ROI_REPORT_INFO.from}</span></p>
                  <p><span className="text-muted-foreground font-medium">Subject:</span> <span className="text-foreground font-medium">{ROI_REPORT_INFO.subject}</span></p>
                </div>
                <p className="text-xs text-muted-foreground">{ROI_REPORT_INFO.description}</p>
              </div>

              {/* Editable templates */}
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                templates.map(t => (
                  <TemplateEditor key={t.id} template={t} onSave={handleSaveTemplate} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
