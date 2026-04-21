import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ChevronRight, ChevronLeft, ShieldCheck, FileText, PenLine, CheckCircle2, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SelectedItem {
  title: string;
  cost: number;
  weeks?: number;
  estimated_annual_impact?: number;
}

interface SigningModalProps {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  assessmentId: string;
  token: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  selectedItems: SelectedItem[];
  totals: {
    subtotalExGst: number;
    gst: number;
    totalIncGst: number;
    totalWeeks: number;
  };
  onAccepted: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-yellow-200 dark:bg-yellow-900/40 px-1.5 py-0.5 rounded font-semibold text-foreground">
    {children}
  </span>
);

const SigningModal = ({
  open,
  onClose,
  proposalId,
  assessmentId,
  token,
  clientName,
  clientEmail,
  businessName,
  selectedItems,
  totals,
  onAccepted,
}: SigningModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [agreementContent, setAgreementContent] = useState<string>('');
  const [agreementVersion, setAgreementVersion] = useState<string>('1.0');
  const [loadingAgreement, setLoadingAgreement] = useState(true);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedName, setTypedName] = useState(clientName || '');
  const [signerTitle, setSignerTitle] = useState('');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      setStep(0);
      setScrolledToEnd(false);
      setAcknowledged(false);
      setTypedName(clientName || '');
      setSignerTitle('');
      setHasDrawnSignature(false);
    }
  }, [open, clientName]);

  // Load the current legal document
  useEffect(() => {
    if (!open) return;
    const loadAgreement = async () => {
      setLoadingAgreement(true);
      const { data } = await supabase
        .from('legal_documents')
        .select('content, version')
        .eq('key', 'initial-engagement')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setAgreementContent(data.content);
        setAgreementVersion(data.version);
      } else {
        setAgreementContent('Agreement document not found. Please contact grow@5to10x.app.');
      }
      setLoadingAgreement(false);
    };
    loadAgreement();
  }, [open]);

  const todayStr = useMemo(
    () => new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );

  // Inject placeholders with highlighted client/total values
  const filledAgreement = useMemo(() => {
    const total = formatCurrency(totals.totalIncGst);
    const subtotal = formatCurrency(totals.subtotalExGst);
    const gst = formatCurrency(totals.gst);
    const replaceAll = (s: string, find: string, repl: string) => s.split(find).join(repl);
    let out = agreementContent;
    out = replaceAll(out, '{{CLIENT_NAME}}', clientName);
    out = replaceAll(out, '{{BUSINESS_NAME}}', businessName);
    out = replaceAll(out, '{{CLIENT_EMAIL}}', clientEmail);
    out = replaceAll(out, '{{TOTAL_INC_GST}}', total);
    out = replaceAll(out, '{{SUBTOTAL_EX_GST}}', subtotal);
    out = replaceAll(out, '{{GST}}', gst);
    out = replaceAll(out, '{{TOTAL_WEEKS}}', String(totals.totalWeeks));
    out = replaceAll(out, '{{DATE}}', todayStr);
    return out;
  }, [agreementContent, clientName, businessName, clientEmail, totals, todayStr]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToEnd(true);
    }
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setHasDrawnSignature(false);
  };

  const canSubmit =
    typedName.trim().length >= 2 &&
    hasDrawnSignature &&
    acknowledged &&
    selectedItems.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !sigCanvasRef.current) return;
    setSubmitting(true);

    try {
      const drawnSignatureDataUrl = sigCanvasRef.current.getCanvas().toDataURL('image/png');
      const acceptedAt = new Date().toISOString();

      // 1. Save signature/agreement on the proposal record (token-gated public update)
      const { error: updErr } = await supabase
        .from('proposals')
        .update({
          accepted: true,
          accepted_at: acceptedAt,
          agreement_accepted_at: acceptedAt,
          agreement_version: agreementVersion,
          agreement_signer_name: typedName.trim(),
          agreement_signer_signature: drawnSignatureDataUrl,
          agreement_accepted_total: totals.totalIncGst,
          agreement_accepted_items: selectedItems as any,
          client_selection: {
            selected_items: selectedItems,
            totals,
            accepted_at: acceptedAt,
            signer_name: typedName.trim(),
            signer_title: signerTitle.trim() || null,
          } as any,
        })
        .eq('id', proposalId);

      if (updErr) throw updErr;

      // 2. Move pipeline to "signed"
      await supabase
        .from('roi_assessments')
        .update({ pipeline_stage: 'signed' as any })
        .eq('id', assessmentId);

      // 3. Generate signed PDF + send confirmation emails (admin will countersign later)
      supabase.functions
        .invoke('generate-signed-agreement', {
          body: { proposalId, token },
        })
        .catch((err) => console.error('PDF generation failed:', err));

      // 4. Notify admin that the agreement has been signed
      supabase.functions
        .invoke('notify-admin', {
          body: {
            eventType: 'agreement_signed',
            leadName: clientName,
            leadEmail: clientEmail,
            businessName,
            assessmentId,
            details: {
              signerName: typedName.trim(),
              signerTitle: signerTitle.trim() || null,
              totalIncGst: totals.totalIncGst,
              itemsCount: selectedItems.length,
              agreementVersion,
            },
          },
        })
        .catch((err) => console.error('Admin notify failed:', err));

      toast({
        title: 'Agreement signed ✅',
        description: 'A copy will be emailed to you shortly.',
      });

      onAccepted();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Could not complete signing',
        description: err.message || 'Please try again or contact grow@5to10x.app.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { label: 'Review', icon: FileText },
    { label: 'Sign', icon: PenLine },
    { label: 'Confirm', icon: ShieldCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        {/* Header / progress */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Initial AI Consultancy Engagement Agreement
          </DialogTitle>
          <DialogDescription className="text-white/70 text-xs">
            Version {agreementVersion} · {todayStr}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                      active ? 'bg-white text-[#1e3a5f]' : done ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className="flex-1 h-px bg-white/20" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-hidden flex flex-col">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Review the full agreement below. Highlighted fields have been filled in for you. Scroll to the end to continue.
              </p>
              {loadingAgreement ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto bg-secondary/30 border border-border rounded-lg p-5 text-sm leading-relaxed text-foreground space-y-3"
                  style={{ maxHeight: '50vh' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300/50 rounded-md text-xs">
                    <div><span className="text-muted-foreground">Client:</span> <Highlight>{clientName}</Highlight></div>
                    <div><span className="text-muted-foreground">Business:</span> <Highlight>{businessName}</Highlight></div>
                    <div><span className="text-muted-foreground">Email:</span> <Highlight>{clientEmail}</Highlight></div>
                    <div><span className="text-muted-foreground">Date:</span> <Highlight>{todayStr}</Highlight></div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Total fees (inc GST):</span> <Highlight>{formatCurrency(totals.totalIncGst)}</Highlight></div>
                  </div>
                  <div className="whitespace-pre-wrap">{filledAgreement}</div>
                </div>
              )}
              {!scrolledToEnd && !loadingAgreement && (
                <p className="text-[11px] text-muted-foreground italic mt-2 text-center">
                  ↓ Scroll to the end of the agreement to continue
                </p>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Type your full legal name and draw your signature below to confirm acceptance.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full legal name</label>
                  <Input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="mt-1"
                  />
                  {typedName.trim().length >= 2 && (
                    <p className="mt-2 text-2xl text-primary" style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}>
                      {typedName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title / role (optional)</label>
                  <Input
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Director, Owner"
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Draw your signature</label>
                    <Button variant="ghost" size="sm" onClick={clearSignature} className="h-7 text-xs gap-1">
                      <X className="w-3 h-3" /> Clear
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg bg-white">
                    {/* @ts-ignore react-signature-canvas types missing penColor in some versions */}
                    <SignatureCanvas
                      ref={sigCanvasRef as any}
                      penColor="#1e3a5f"
                      onEnd={() => setHasDrawnSignature(!sigCanvasRef.current?.isEmpty())}
                      canvasProps={{
                        width: 600,
                        height: 160,
                        className: 'w-full h-40 rounded-lg',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Use your mouse or finger to draw your signature in the box above.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">Final summary</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="font-semibold text-foreground">{clientName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Business:</span><span className="font-semibold text-foreground">{businessName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Items selected:</span><span className="font-semibold text-foreground">{selectedItems.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estimated timeline:</span><span className="font-semibold text-foreground">~{totals.totalWeeks} weeks</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (ex GST):</span><span className="font-semibold text-foreground">{formatCurrency(totals.subtotalExGst)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST:</span><span className="font-semibold text-foreground">{formatCurrency(totals.gst)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold text-foreground">Total fees (inc GST):</span>
                    <span className="font-bold text-primary text-base">{formatCurrency(totals.totalIncGst)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300/50 rounded-lg p-4">
                <p className="text-xs font-bold text-foreground mb-2">Your signature</p>
                {sigCanvasRef.current && !sigCanvasRef.current.isEmpty() && (
                  <img
                    src={sigCanvasRef.current.getCanvas().toDataURL('image/png')}
                    alt="Your signature"
                    className="max-h-24 bg-white border border-border rounded p-2"
                  />
                )}
                <p className="mt-2 text-xl text-primary" style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}>
                  {typedName}
                </p>
                {signerTitle && <p className="text-xs text-muted-foreground">{signerTitle}</p>}
              </div>

              <label className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-border cursor-pointer">
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(!!v)}
                  className="mt-0.5"
                />
                <span className="text-xs text-foreground leading-relaxed">
                  I confirm I have read and agree to the <strong>Initial AI Consultancy Engagement Agreement (v{agreementVersion})</strong>. I authorise 5to10X to commence work upon receipt of the deposit. My typed name and drawn signature constitute a legally binding electronic signature.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            disabled={submitting}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < 2 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && (!scrolledToEnd || loadingAgreement)) ||
                (step === 1 && (typedName.trim().length < 2 || !hasDrawnSignature))
              }
              className="gap-1"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Sign &amp; Accept Proposal
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SigningModal;
