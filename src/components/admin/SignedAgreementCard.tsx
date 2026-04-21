import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, Download, PenLine, ShieldCheck, Loader2, X, ExternalLink } from 'lucide-react';

interface Props {
  proposal: any;
  onCountersigned: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v || 0);

const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const SignedAgreementCard: React.FC<Props> = ({ proposal, onCountersigned }) => {
  const { toast } = useToast();
  const [showCountersign, setShowCountersign] = useState(false);
  const [counterName, setCounterName] = useState('Aidan Toomey');
  const [counterTitle, setCounterTitle] = useState('Co-Founder, 5to10X');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

  if (!proposal?.agreement_accepted_at) return null;

  const isCountersigned = !!proposal.countersigned_at;
  const items = (proposal.agreement_accepted_items as any[]) || [];

  const handleCountersign = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast({ title: 'Please draw your signature', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const dataUrl = sigRef.current.getCanvas().toDataURL('image/png');
      const now = new Date().toISOString();

      const { error: updErr } = await supabase
        .from('proposals')
        .update({
          countersigner_name: `${counterName.trim()}${counterTitle.trim() ? ', ' + counterTitle.trim() : ''}`,
          countersigner_signature: dataUrl,
          countersigned_at: now,
        })
        .eq('id', proposal.id);
      if (updErr) throw updErr;

      // Regenerate the PDF (now with both signatures) and re-email both parties
      const { error: fnErr } = await supabase.functions.invoke('generate-signed-agreement', {
        body: { proposalId: proposal.id, token: 'admin-bypass' },
      });
      if (fnErr) throw fnErr;

      toast({ title: 'Countersigned ✅', description: 'Fully-executed agreement has been emailed to the client.' });
      setShowCountersign(false);
      onCountersigned();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Countersign failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border-2 border-green-500/40 bg-green-500/5 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Signed Agreement</h3>
              <p className="text-[11px] text-muted-foreground">
                Initial AI Consultancy Engagement Agreement v{proposal.agreement_version || '1.0'}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={isCountersigned
              ? 'text-[10px] border-green-500/50 text-green-700 bg-green-500/10'
              : 'text-[10px] border-amber-500/50 text-amber-700 bg-amber-500/10'
            }
          >
            {isCountersigned ? 'Fully executed' : 'Awaiting 5to10X countersignature'}
          </Badge>
        </div>

        {/* Client signing details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed by</p>
            <p className="font-bold text-foreground">{proposal.agreement_signer_name || '—'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed at</p>
            <p className="text-foreground">{formatDateTime(proposal.agreement_accepted_at)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total fees (inc GST)</p>
            <p className="font-bold text-primary">{formatCurrency(proposal.agreement_accepted_total)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Items selected</p>
            <p className="text-foreground">{items.length}</p>
          </div>
          {proposal.agreement_signer_ip && (
            <div className="space-y-0.5 sm:col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">IP address</p>
              <p className="text-[11px] font-mono text-muted-foreground">{proposal.agreement_signer_ip}</p>
            </div>
          )}
        </div>

        {/* Drawn signature preview */}
        {proposal.agreement_signer_signature && (
          <div className="bg-white border border-border rounded p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Signature</p>
            <img src={proposal.agreement_signer_signature} alt="Client signature" className="max-h-16" />
          </div>
        )}

        {/* Countersignature status */}
        {isCountersigned && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-700" />
              <p className="text-xs font-bold text-green-700">Countersigned by 5to10X</p>
            </div>
            <div className="text-[11px] text-foreground">{proposal.countersigner_name || '—'}</div>
            <div className="text-[11px] text-muted-foreground">{formatDateTime(proposal.countersigned_at)}</div>
            {proposal.countersigner_signature && (
              <img src={proposal.countersigner_signature} alt="Counter signature" className="max-h-14 bg-white border border-border rounded p-1" />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {proposal.signed_pdf_url && (
            <a
              href={proposal.signed_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Download signed PDF
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {!isCountersigned && (
            <Button
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => setShowCountersign(true)}
            >
              <PenLine className="w-4 h-4" /> Countersign now
            </Button>
          )}
        </div>
      </div>

      {/* Countersign modal */}
      <Dialog open={showCountersign} onOpenChange={(v) => !v && !submitting && setShowCountersign(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Countersign agreement
            </DialogTitle>
            <DialogDescription>
              Adds 5to10X's signature to the executed PDF and emails the fully-signed copy to {proposal.agreement_signer_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your name</label>
                <Input value={counterName} onChange={(e) => setCounterName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</label>
                <Input value={counterTitle} onChange={(e) => setCounterTitle(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Draw your signature</label>
                <Button variant="ghost" size="sm" onClick={() => { sigRef.current?.clear(); setHasDrawn(false); }} className="h-7 text-xs gap-1">
                  <X className="w-3 h-3" /> Clear
                </Button>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg bg-white">
                {(() => {
                  const SC = SignatureCanvas as any;
                  return (
                    <SC
                      ref={sigRef}
                      penColor="#1e3a5f"
                      onEnd={() => setHasDrawn(!sigRef.current?.isEmpty())}
                      canvasProps={{ width: 520, height: 140, className: 'w-full h-36 rounded-lg' }}
                    />
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowCountersign(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCountersign} disabled={submitting || !hasDrawn || !counterName.trim()} className="gap-1.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Countersign & email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignedAgreementCard;
