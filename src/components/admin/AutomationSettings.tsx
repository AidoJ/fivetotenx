import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Target, Send, FileText, Bell, Mail, Save, Loader2, RotateCcw,
  ChevronRight, Shield, Server
} from 'lucide-react';

interface AutomationConfig {
  id: string;
  auto_qualify_enabled: boolean;
  roi_threshold_percent: number;
  auto_send_invite_on_qualify: boolean;
  auto_send_gameplan_on_st_complete: boolean;
  auto_prepare_proposal_on_gp_complete: boolean;
  auto_regenerate_proposal_on_analysis_update: boolean;
  auto_rerun_tech_stack_on_proposal_save: boolean;
  admin_notify_on_booking: boolean;
  admin_notify_on_gp_complete: boolean;
  admin_notify_on_proposal_accepted: boolean;
  admin_notify_emails: string[];
}

const DEFAULT_CONFIG: AutomationConfig = {
  id: '',
  auto_qualify_enabled: true,
  roi_threshold_percent: 150,
  auto_send_invite_on_qualify: true,
  auto_send_gameplan_on_st_complete: true,
  auto_prepare_proposal_on_gp_complete: false,
  auto_regenerate_proposal_on_analysis_update: false,
  auto_rerun_tech_stack_on_proposal_save: false,
  admin_notify_on_booking: true,
  admin_notify_on_gp_complete: true,
  admin_notify_on_proposal_accepted: true,
  admin_notify_emails: ['eoghan@5to10x.app', 'aidan@5to10x.app'],
};

const AutomationSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<AutomationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to load automation settings:', error);
    } else if (data) {
      setConfig(data as unknown as AutomationConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { id, ...updates } = config;
    const { error } = await supabase
      .from('automation_settings')
      .update(updates as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved ✅' });
    }
    setSaving(false);
  };

  const updateField = <K extends keyof AutomationConfig>(key: K, value: AutomationConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && !config.admin_notify_emails.includes(email)) {
      updateField('admin_notify_emails', [...config.admin_notify_emails, email]);
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    updateField('admin_notify_emails', config.admin_notify_emails.filter(e => e !== email));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Pipeline Automation
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure automatic actions at each stage of the Clarity Path™
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>

      {/* Auto-Qualify */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto-Qualify Leads</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically qualify leads when their ROI projection exceeds the threshold
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_qualify_enabled}
            onCheckedChange={(v) => updateField('auto_qualify_enabled', v)}
          />
        </div>

        {config.auto_qualify_enabled && (
          <div className="pl-11 space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">ROI Threshold</Label>
              <Input
                type="number"
                min={50}
                max={1000}
                value={config.roi_threshold_percent}
                onChange={(e) => updateField('roi_threshold_percent', parseInt(e.target.value) || 150)}
                className="h-8 w-24 text-sm text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Badge variant="outline" className="text-[9px]">
                Leads with ROI above {config.roi_threshold_percent}% are auto-qualified
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Send Invite */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto-Send Straight Talk™ Invite</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When a lead is qualified, automatically send the Calendly booking link email
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_send_invite_on_qualify}
            onCheckedChange={(v) => updateField('auto_send_invite_on_qualify', v)}
          />
        </div>

        {config.auto_send_invite_on_qualify && (
          <div className="pl-11">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/50 rounded-md px-3 py-2">
              <ChevronRight className="w-3 h-3" />
              Reality Check™ submitted → Auto-qualify (if above threshold) → Auto-send Straight Talk™ invite
            </div>
          </div>
        )}
      </div>

      {/* Auto-Prepare Proposal on ST Complete */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto-Move to Green Light™</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When Straight Talk™ is marked complete (transcript + extraction done), automatically move the lead to the Green Light™ stage
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_send_gameplan_on_st_complete}
            onCheckedChange={(v) => updateField('auto_send_gameplan_on_st_complete', v)}
          />
        </div>
      </div>

      {/* Auto-Prepare Proposal */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto-Prepare Green Light™ Draft</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When Straight Talk™ is complete and analysis is done, AI generates a draft proposal from all collected data
              </p>
              <Badge variant="outline" className="text-[9px] mt-1 bg-amber-500/10 text-amber-700 border-amber-500/20">
                AI-Powered · Admin review required before sending
              </Badge>
            </div>
          </div>
          <Switch
            checked={config.auto_prepare_proposal_on_gp_complete}
            onCheckedChange={(v) => updateField('auto_prepare_proposal_on_gp_complete', v)}
          />
        </div>
      </div>

      {/* Auto-Regenerate Proposal on Analysis Update */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto-Regenerate Proposal on Analysis Update</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When the Opportunity Analysis or Tech Stack Analysis is re-run for a client that already has a proposal,
                automatically rebuild <code className="text-[10px]">proposal_data</code> from the latest results. The proposal is <strong>not</strong> re-sent — admin must still click "Send to Client".
              </p>
              <Badge variant="outline" className="text-[9px] mt-1 bg-primary/10 text-primary border-primary/20">
                Only affects clients with an existing saved proposal
              </Badge>
            </div>
          </div>
          <Switch
            checked={config.auto_regenerate_proposal_on_analysis_update}
            onCheckedChange={(v) => updateField('auto_regenerate_proposal_on_analysis_update', v)}
          />
        </div>
      </div>

      {/* Auto-Re-run Tech Stack on Proposal Save */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground">Auto Re-run Tech Stack After Proposal Save</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When a proposal is saved, automatically re-run the Tech Stack Analysis so recommendations reflect the
                final scope of included opportunities. The new analysis runs in the background — refresh the Tech Stack tab to view it.
              </p>
              <Badge variant="outline" className="text-[9px] mt-1 bg-primary/10 text-primary border-primary/20">
                A manual "Re-run from latest scope" button is also available in the Tech Stack tab
              </Badge>
            </div>
          </div>
          <Switch
            checked={config.auto_rerun_tech_stack_on_proposal_save}
            onCheckedChange={(v) => updateField('auto_rerun_tech_stack_on_proposal_save', v)}
          />
        </div>
      </div>

      {/* Admin Notifications */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Admin Notifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Email admins when key pipeline events occur
            </p>
          </div>
        </div>

        <div className="pl-11 space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">New booking via Calendly</span>
            </div>
            <Switch
              checked={config.admin_notify_on_booking}
              onCheckedChange={(v) => updateField('admin_notify_on_booking', v)}
            />
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">Straight Talk™ completed</span>
            </div>
            <Switch
              checked={config.admin_notify_on_gp_complete}
              onCheckedChange={(v) => updateField('admin_notify_on_gp_complete', v)}
            />
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">Green Light™ proposal accepted</span>
            </div>
            <Switch
              checked={config.admin_notify_on_proposal_accepted}
              onCheckedChange={(v) => updateField('admin_notify_on_proposal_accepted', v)}
            />
          </div>

          {/* Notification email addresses */}
          <div className="border-t border-border pt-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Notification Recipients</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {config.admin_notify_emails.map(email => (
                <Badge key={email} variant="outline" className="text-[10px] h-6 gap-1 pr-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                placeholder="Add email address…"
                className="h-8 text-sm flex-1"
              />
              <Button size="sm" variant="outline" className="h-8" onClick={addEmail}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Diagram */}
      <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-bold text-foreground">Automation Flow Summary</h3>
        </div>
        <div className="grid gap-2 text-[11px]">
          {[
            { step: '1', label: 'Client submits Reality Check™', auto: 'ROI report emailed automatically', enabled: true },
            { step: '2', label: 'ROI above threshold', auto: `Auto-qualify + send Straight Talk™ invite`, enabled: config.auto_qualify_enabled && config.auto_send_invite_on_qualify },
            { step: '3', label: 'Client books via Calendly', auto: 'Admin notified of booking', enabled: config.admin_notify_on_booking },
            { step: '4', label: 'Admin uploads Zoom recording', auto: 'Auto-transcribe + extract answers + run analysis', enabled: true },
            { step: '5', label: 'Straight Talk™ complete', auto: 'Auto-move to Green Light + draft proposal', enabled: config.auto_send_gameplan_on_st_complete || config.auto_prepare_proposal_on_gp_complete },
            { step: '6', label: 'Client accepts Green Light™', auto: 'Admin notified + move to Signed', enabled: config.admin_notify_on_proposal_accepted },
          ].map(item => (
            <div key={item.step} className={`flex items-start gap-3 px-3 py-2 rounded-md ${item.enabled ? 'bg-primary/5 border border-primary/10' : 'bg-muted/50 border border-border opacity-60'}`}>
              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/30 text-muted-foreground'}`}>
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground">{item.label}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{item.auto}</span>
                  {item.enabled ? (
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-primary/10 text-primary border-primary/20 ml-auto shrink-0">ON</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-auto shrink-0">OFF</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationSettings;
