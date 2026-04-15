import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, AlertTriangle, XCircle, Circle,
  Send, Link2, FileText, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const LOGO_URL = 'https://hfszmulinpwzmroqemke.supabase.co/storage/v1/object/public/email-assets/logo-5to10x-white-strap.png';

// Brand colors from Clarity Path™
const BRAND = {
  blue: '#1789CE',
  purple: '#643AA4',
  pink: '#E0436A',
  gold: '#D88E08',
  green: '#398C08',
  dark: '#0f0a1e',
  darkCard: '#1a1333',
  darkBorder: '#2d2154',
};

interface Question {
  id: string;
  question: string;
  category: string;
  priority: string;
  source_context: string | null;
  status: string;
  answer: string | null;
  assessment_id: string;
}

interface TokenData {
  assessment_id: string;
  expires_at: string;
  used: boolean;
  question_ids: string[];
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  blocker: { bg: 'bg-[#E0436A]/10', text: 'text-[#E0436A]', border: 'border-[#E0436A]/30', icon: XCircle, label: 'Critical' },
  important: { bg: 'bg-[#D88E08]/10', text: 'text-[#D88E08]', border: 'border-[#D88E08]/30', icon: AlertTriangle, label: 'Important' },
  nice_to_know: { bg: 'bg-[#1789CE]/10', text: 'text-[#1789CE]', border: 'border-[#1789CE]/30', icon: Circle, label: 'Helpful' },
};

/* ── Status screens ── */
const StatusScreen = ({ icon: Icon, iconColor, title, subtitle }: { icon: React.ElementType; iconColor: string; title: string; subtitle: string }) => (
  <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BRAND.dark }}>
    <div className="max-w-md text-center space-y-5">
      <img src={LOGO_URL} alt="5to10X" className="h-10 mx-auto opacity-80" />
      <Icon className={`w-14 h-14 mx-auto ${iconColor}`} />
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-white/60 text-sm leading-relaxed">{subtitle}</p>
    </div>
  </div>
);

const RefinementPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'used' | 'error'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, { links: string[]; files: { name: string; url: string }[] }>>({});
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    const { data: tokenData, error: tokenError } = await supabase
      .from('refinement_tokens' as any)
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) { setStatus('error'); return; }
    const td = tokenData as unknown as TokenData;

    if (td.used) { setStatus('used'); return; }
    if (new Date(td.expires_at) < new Date()) { setStatus('expired'); return; }

    setAssessmentId(td.assessment_id);

    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('business_name')
      .eq('id', td.assessment_id)
      .single();
    if (assessment) setBusinessName((assessment as any).business_name || '');

    const tokenQuestionIds = td.question_ids || [];
    if (tokenQuestionIds.length === 0) { setStatus('error'); return; }

    const { data: qData } = await supabase
      .from('refinement_questions' as any)
      .select('*')
      .in('id', tokenQuestionIds)
      .order('sort_order');

    if (qData) {
      const qs = qData as unknown as Question[];
      setQuestions(qs);
      const existing: Record<string, string> = {};
      for (const q of qs) { if (q.answer) existing[q.id] = q.answer; }
      setAnswers(existing);
    }
    setStatus('valid');
  };

  const addLink = (qId: string) => {
    const url = linkInputs[qId]?.trim();
    if (!url) return;
    setAttachments(prev => ({
      ...prev,
      [qId]: { links: [...(prev[qId]?.links || []), url], files: prev[qId]?.files || [] },
    }));
    setLinkInputs(prev => ({ ...prev, [qId]: '' }));
  };

  const handleFileUpload = async (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(qId);
    const filePath = `${assessmentId}/refinement/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('interview-audio').upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from('interview-audio').getPublicUrl(filePath);
    setAttachments(prev => ({
      ...prev,
      [qId]: { links: prev[qId]?.links || [], files: [...(prev[qId]?.files || []), { name: file.name, url: urlData.publicUrl }] },
    }));
    setUploading(null);
    toast({ title: 'File uploaded' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (const q of questions) {
        const answer = answers[q.id]?.trim();
        if (answer) {
          await supabase.from('refinement_questions' as any)
            .update({ answer, status: 'answered' } as any)
            .eq('id', q.id);
        }
        const att = attachments[q.id];
        if (att) {
          for (const link of att.links) {
            await supabase.from('client_artifacts').insert({
              assessment_id: assessmentId, artifact_type: 'link',
              title: `Re: ${q.question.slice(0, 60)}`, content: link,
            } as any);
          }
          for (const file of att.files) {
            await supabase.from('client_artifacts').insert({
              assessment_id: assessmentId, artifact_type: 'file',
              title: `Re: ${q.question.slice(0, 60)}`, file_url: file.url, file_name: file.name,
            } as any);
          }
        }
      }

      await supabase.from('refinement_tokens' as any)
        .update({ used: true } as any)
        .eq('token', token);

      const { data: assessment } = await supabase
        .from('roi_assessments')
        .select('contact_name, contact_email, business_name')
        .eq('id', assessmentId)
        .single();
      if (assessment) {
        await supabase.functions.invoke('notify-admin', {
          body: {
            eventType: 'refinement_submitted',
            leadName: (assessment as any).contact_name,
            leadEmail: (assessment as any).contact_email,
            businessName: (assessment as any).business_name || businessName,
            assessmentId,
            details: { answeredCount, totalQuestions: questions.length },
          },
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Submit failed', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const grouped: Record<string, Question[]> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.dark }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.purple }} />
      </div>
    );
  }

  if (status === 'used') return <StatusScreen icon={CheckCircle2} iconColor="text-[#398C08]" title="Already Submitted" subtitle="Your responses have already been submitted. Thank you!" />;
  if (status === 'expired') return <StatusScreen icon={AlertTriangle} iconColor="text-[#D88E08]" title="Link Expired" subtitle="This link has expired. Please contact us for a new one." />;
  if (status === 'error') return <StatusScreen icon={XCircle} iconColor="text-[#E0436A]" title="Invalid Link" subtitle="This link is not valid. Please check the URL or contact us." />;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BRAND.dark }}>
        <div className="max-w-md text-center space-y-5">
          <img src={LOGO_URL} alt="5to10X" className="h-10 mx-auto opacity-80" />
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: `${BRAND.green}20` }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: BRAND.green }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Thank You!</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Your responses have been submitted successfully. Our team will review them and continue refining your project scope.
          </p>
        </div>
      </div>
    );
  }

  // Category colors cycle through brand palette
  const categoryColors = [BRAND.blue, BRAND.purple, BRAND.pink, BRAND.gold, BRAND.green];

  return (
    <div className="min-h-screen" style={{ background: BRAND.dark }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: BRAND.darkCard, borderBottom: `1px solid ${BRAND.darkBorder}` }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="5to10X" className="h-7" />
            <div className="w-px h-6" style={{ background: BRAND.darkBorder }} />
            <div>
              <h1 className="text-sm font-bold text-white">Scope Refinement</h1>
              {businessName && <p className="text-[11px] text-white/50">{businessName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/50">{answeredCount}/{questions.length}</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: `${BRAND.purple}30` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: BRAND.purple }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Intro card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: BRAND.darkCard, border: `1px solid ${BRAND.darkBorder}` }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.purple}, ${BRAND.pink}, ${BRAND.gold}, ${BRAND.green})` }} />
          <p className="text-sm text-white/70 leading-relaxed pt-2">
            We need a few more details to make sure we build exactly what you need.
            Please answer the questions below as thoroughly as you can — you can also attach files or links to support your answers.
          </p>
        </div>

        {/* Questions grouped by category */}
        {Object.entries(grouped).map(([category, catQuestions], catIdx) => {
          const catColor = categoryColors[catIdx % categoryColors.length];
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3 pb-2" style={{ borderBottom: `1px solid ${BRAND.darkBorder}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/80">{category}</h2>
                <span className="text-[10px] text-white/30">{catQuestions.length} question{catQuestions.length > 1 ? 's' : ''}</span>
              </div>
              {catQuestions.map((q, idx) => {
                const pri = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.important;
                const PriIcon = pri.icon;
                const att = attachments[q.id];
                const hasAnswer = !!answers[q.id]?.trim();

                return (
                  <div
                    key={q.id}
                    className="rounded-xl p-5 space-y-3 transition-all"
                    style={{
                      background: BRAND.darkCard,
                      border: `1px solid ${hasAnswer ? BRAND.green + '40' : BRAND.darkBorder}`,
                      boxShadow: hasAnswer ? `0 0 20px ${BRAND.green}10` : 'none',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="text-[11px] font-bold mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${catColor}20`, color: catColor }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white leading-snug">{q.question}</p>
                        {q.source_context && (
                          <p className="text-[11px] text-white/40 italic mt-1">Context: "{q.source_context}"</p>
                        )}
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 border ${pri.bg} ${pri.text} ${pri.border}`}>
                        {pri.label}
                      </span>
                    </div>

                    <Textarea
                      placeholder="Type your answer here…"
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                      className="text-sm resize-none border-none focus-visible:ring-1"
                      style={{
                        background: `${BRAND.purple}10`,
                        color: 'white',
                        borderColor: BRAND.darkBorder,
                      }}
                    />

                    {/* Attachments */}
                    {att && (att.links.length > 0 || att.files.length > 0) && (
                      <div className="space-y-1">
                        {att.links.map((link, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: BRAND.blue }}>
                            <Link2 className="w-3 h-3" />
                            <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{link}</a>
                          </div>
                        ))}
                        {att.files.map((file, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add link / file */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          placeholder="Paste a link…"
                          value={linkInputs[q.id] || ''}
                          onChange={e => setLinkInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="h-7 text-xs flex-1 border-none text-white"
                          style={{ background: `${BRAND.purple}10` }}
                        />
                        <button
                          onClick={() => addLink(q.id)}
                          disabled={!linkInputs[q.id]?.trim()}
                          className="h-7 px-2 rounded text-[10px] font-medium flex items-center gap-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                          style={{ background: `${BRAND.purple}20` }}
                        >
                          <Link2 className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          className="h-7 px-2 rounded text-[10px] font-medium flex items-center gap-1 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                          style={{ background: `${BRAND.purple}20` }}
                          disabled={uploading === q.id}
                        >
                          {uploading === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          File
                        </button>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => handleFileUpload(q.id, e)}
                          disabled={uploading === q.id}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Submit bar */}
        <div className="sticky bottom-0 py-4 -mx-6 px-6" style={{ background: BRAND.dark }}>
          <div
            className="max-w-3xl mx-auto flex items-center justify-between rounded-xl px-5 py-3"
            style={{ background: BRAND.darkCard, border: `1px solid ${BRAND.darkBorder}` }}
          >
            <p className="text-xs text-white/40">{answeredCount} of {questions.length} questions answered</p>
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: BRAND.purple }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Responses
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6" style={{ borderTop: `1px solid ${BRAND.darkBorder}` }}>
        <p className="text-[10px] text-white/25">
          © {new Date().getFullYear()} 5to10X ·{' '}
          <a href="https://5to10x.app" className="hover:text-white/40 transition-colors">5to10x.app</a>
        </p>
      </div>
    </div>
  );
};

export default RefinementPortal;
