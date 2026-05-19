import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertCircle, MailX } from 'lucide-react';

const REASONS = [
  'Not relevant to my business right now',
  'I receive too many emails',
  'I never signed up for this',
  'Already using a similar solution',
  'Budget constraints',
  'Other (please tell us below)',
];

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [business, setBusiness] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) { setError('Missing unsubscribe link.'); return; }
    supabase.from('outbound_prospects').select('business_name, unsubscribed').eq('id', id).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setError('We could not find your record. It may already be removed.'); return; }
        setBusiness(data.business_name);
        if (data.unsubscribed) setDone(true);
      });
  }, [id]);

  const submit = async () => {
    if (!id || !reason) return;
    setSubmitting(true);
    const fullReason = reason === 'Other (please tell us below)'
      ? `Other: ${details || '(no detail)'}`
      : details ? `${reason} — ${details}` : reason;
    const { error: e } = await supabase.from('outbound_prospects').update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: fullReason,
      stage: 'dead',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSubmitting(false);
    if (e) { setError(e.message); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MailX className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground">5to10X outbound email list</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">You've been unsubscribed</p>
                <p className="text-sm mt-1">
                  {business ? `${business} has been removed from our outbound list.` : 'Your email has been removed.'} You won't receive any more campaign emails from us.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Changed your mind? Email <a href="mailto:aidan@5to10x.app" className="text-primary underline">aidan@5to10x.app</a>.
            </p>
          </div>
        ) : !error ? (
          <>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Before you go — help us improve</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                We only email businesses we genuinely believe could benefit. Letting us know why you're opting out helps us be more relevant (and less annoying) to others.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Reason for unsubscribing *</Label>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    reason === r ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-foreground">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Anything else? (optional)</Label>
              <Textarea
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Optional feedback…"
              />
            </div>

            <Button
              onClick={submit}
              disabled={!reason || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Unsubscribing…' : 'Confirm Unsubscribe'}
            </Button>
          </>
        ) : null}
      </Card>
    </div>
  );
}
