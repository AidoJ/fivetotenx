import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Phone, Users, Building2, DollarSign } from 'lucide-react';
import DiscoveryChecklist from './DiscoveryChecklist';

interface Lead {
  id: string;
  contact_name: string;
  business_name: string | null;
  pipeline_stage: string;
  roi_results: any;
  discovery_checklist: any;
}

interface CallGuideProps {
  leads: Lead[];
  onUpdateChecklist: (id: string, checklist: Record<string, boolean>) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const CallGuide = ({ leads, onUpdateChecklist }: CallGuideProps) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [showQuestions, setShowQuestions] = useState(true);

  // Filter leads in discovery-relevant stages
  const eligibleLeads = useMemo(() =>
    leads.filter(l => ['discovery_call', 'proposal', 'build_refinement'].includes(l.pipeline_stage)),
    [leads]
  );

  const selectedLead = eligibleLeads.find(l => l.id === selectedLeadId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Call Guide
          </h2>
          <p className="text-sm text-muted-foreground">Use during Zoom calls to track which discovery questions have been covered.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="show-questions" checked={showQuestions} onCheckedChange={setShowQuestions} />
            <Label htmlFor="show-questions" className="text-xs">Show full questions</Label>
          </div>
        </div>
      </div>

      {/* Lead selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="text-xs text-muted-foreground mb-2 block">Select Lead</Label>
        <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Choose a lead for this call..." />
          </SelectTrigger>
          <SelectContent>
            {eligibleLeads.length === 0 ? (
              <SelectItem value="none" disabled>No leads in Discovery Call stage</SelectItem>
            ) : (
              eligibleLeads.map(lead => (
                <SelectItem key={lead.id} value={lead.id}>
                  <span className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {lead.contact_name}
                    {lead.business_name && <span className="text-muted-foreground">— {lead.business_name}</span>}
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Selected lead info + checklist */}
      {selectedLead && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{selectedLead.contact_name}</span>
            </div>
            {selectedLead.business_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">{selectedLead.business_name}</span>
              </div>
            )}
            {(selectedLead.roi_results as any)?.totalAnnualImpact && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency((selectedLead.roi_results as any).totalAnnualImpact)} annual impact
                </span>
              </div>
            )}
            <Badge variant="outline" className="capitalize text-xs">
              {selectedLead.pipeline_stage.replace(/_/g, ' ')}
            </Badge>
          </div>

          <DiscoveryChecklist
            assessmentId={selectedLead.id}
            checklist={
              selectedLead.discovery_checklist && typeof selectedLead.discovery_checklist === 'object' && !Array.isArray(selectedLead.discovery_checklist)
                ? selectedLead.discovery_checklist as Record<string, boolean>
                : null
            }
            onUpdate={(checklist) => onUpdateChecklist(selectedLead.id, checklist)}
            compact={false}
            showQuestions={showQuestions}
          />
        </>
      )}

      {!selectedLead && eligibleLeads.length > 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a lead to start</p>
          <p className="text-sm">Pick a lead from the dropdown above to see the discovery checklist.</p>
        </div>
      )}
    </div>
  );
};

export default CallGuide;
