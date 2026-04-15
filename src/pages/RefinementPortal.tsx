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
import { Progress } from '@/components/ui/progress';

const LOGO_URL = 'https://hfszmulinpwzmroqemke.supabase.co/storage/v1/object/public/email-assets/logo-5to10x.png';

const BRAND = {
  blue: '#1789CE',
  purple: '#643AA4',
  pink: '#E0436A',
  gold: '#D88E08',
  green: '#398C08',
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

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  blocker: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, label: 'Critical' },
  important: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle, label: 'Important' },
  nice_to_know: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Circle, label: 'Helpful' },
};

const StatusScreen = ({ icon: Icon, iconBg, iconColor, title, subtitle }: { icon: React.ElementType; iconBg: string; iconColor: string; title: string; subtitle: string }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <div className="bg-[#0f0a1e] px-6 py-4 flex justify-center">
      <img src={LOGO_URL} alt="5to10X" className="h-8" />
    </div>
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-5">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm leading-relaxed">{subtitle}</p>
      </div>
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
      .from('refinement_tokens' as any).select('*').eq('token', token).single();
    if (tokenError || !tokenData) { setStatus('error'); return; }
    const td = tokenData as unknown as TokenData;
    if (td.used) { setStatus('used'); return; }
    if (new Date(td.expires_at) < new Date()) { setStatus('expired'); return; }
    setAssessmentId(td.assessment_id);

    const { data: assessment } = await supabase
      .from('roi_assessments').select('business_name').eq('id', td.assessment_id).single();
    if (assessment) setBusinessName((assessment as any).business_name || '');

    const tokenQuestionIds = td.question_ids || [];
    if (tokenQuestionIds.length === 0) { setStatus('error'); return; }

    const { data: qData } = await supabase
      .from('refinement_questions' as any).select('*').in('id', tokenQuestionIds).order('sort_order');
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
      ...prev, [qId]: { links: [...(prev[qId]?.links || []), url], files: prev[qId]?.files || [] },
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
      ...prev, [qId]: { links: prev[qId]?.links || [], files: [...(prev[qId]?.files || []), { name: file.name, url: urlData.publicUrl }] },
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
          await supabase.from('refinement_questions' as any).update({ answer, status: 'answered' } as any).eq('id', q.id);
        }
        const att = attachments[q.id];
        if (att) {
          for (const link of att.links) {
            await supabase.from('client_artifacts').insert({ assessment_id: assessmentId, artifact_type: 'link', title: `Re: ${q.question.slice(0, 60)}`, content: link } as any);
          }
          for (const file of att.files) {
            await supabase.from('client_artifacts').insert({ assessment_id: assessmentId, artifact_type: 'file', title: `Re: ${q.question.slice(0, 60)}`, file_url: file.url, file_name: file.name } as any);
          }
        }
      }

      await supabase.from('refinement_tokens' as any).update({ used: true } as any).eq('token', token);

      const { data: assessment } = await supabase
        .from('roi_assessments').select('contact_name, contact_email, business_name').eq('id', assessmentId).single();
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.purple }} />
      </div>
    );
  }

  if (status === 'used') return <StatusScreen icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-600" title="Already Submitted" subtitle="Your responses have already been submitted. Thank you!" />;
  if (status === 'expired') return <StatusScreen icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-600" title="Link Expired" subtitle="This link has expired. Please contact us for a new one." />;
  if (status === 'error') return <StatusScreen icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" title="Invalid Link" subtitle="This link is not valid. Please check the URL or contact us." />;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="bg-[#0f0a1e] px-6 py-4 flex justify-center">
          <img src={LOGO_URL} alt="5to10X" className="h-8" />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-5">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-green-50">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thank You!</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your responses have been submitted successfully. Our team will review them and continue refining your project scope.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categoryColors = [BRAND.blue, BRAND.purple, BRAND.pink, BRAND.gold, BRAND.green];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0a1e] shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="5to10X" className="h-7" />
            <div className="w-px h-6 bg-white/20" />
            <div>
              <h1 className="text-sm font-bold text-white">Scope Refinement</h1>
              {businessName && <p className="text-[11px] text-white/60">{businessName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/50">{answeredCount}/{questions.length}</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden bg-white/10">
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
        <div className="rounded-2xl bg-white p-6 border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.purple}, ${BRAND.pink}, ${BRAND.gold}, ${BRAND.green})` }} />
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            We need a few more details to make sure we build exactly what you need.
            Please answer the questions below as thoroughly as you can — you can also attach files or links to support your answers.
          </p>
        </div>

        {/* Questions grouped by category */}
        {Object.entries(grouped).map(([category, catQuestions], catIdx) => {
          const catColor = categoryColors[catIdx % categoryColors.length];
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: catColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">{category}</h2>
                <span className="text-[10px] text-gray-400">{catQuestions.length} question{catQuestions.length > 1 ? 's' : ''}</span>
              </div>
              {catQuestions.map((q, idx) => {
                const pri = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.important;
                const att = attachments[q.id];
                const hasAnswer = !!answers[q.id]?.trim();

                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-white p-5 space-y-3 border shadow-sm transition-all"
                    style={{
                      borderColor: hasAnswer ? BRAND.green + '60' : '#e5e7eb',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="text-[11px] font-bold mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: catColor + '15', color: catColor }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
                        {q.source_context && (
                          <p className="text-[11px] text-gray-400 italic mt-1">Context: "{q.source_context}"</p>
                        )}
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full shrink-0 font-medium ${pri.bg} ${pri.text}`}>
                        {pri.label}
                      </span>
                    </div>

                    <Textarea
                      placeholder="Type your answer here…"
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                      className="text-sm resize-none bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1"
                      style={{ '--tw-ring-color': catColor } as React.CSSProperties}
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
                          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
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
                          className="h-7 text-xs flex-1 bg-gray-50 border-gray-200 text-gray-900"
                        />
                        <button
                          onClick={() => addLink(q.id)}
                          disabled={!linkInputs[q.id]?.trim()}
                          className="h-7 px-2.5 rounded text-[10px] font-medium flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors border border-gray-200"
                        >
                          <Link2 className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          className="h-7 px-2.5 rounded text-[10px] font-medium flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors border border-gray-200"
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
        <div className="sticky bottom-0 py-4 -mx-6 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between bg-white rounded-xl px-5 py-3 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-400">{answeredCount} of {questions.length} questions answered</p>
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: BRAND.purple }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Responses
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">
          © {new Date().getFullYear()} 5to10X ·{' '}
          <a href="https://5to10x.app" className="hover:text-gray-600 transition-colors" style={{ color: BRAND.purple }}>5to10x.app</a>
        </p>
      </div>
    </div>
  );
};

export default RefinementPortal;
