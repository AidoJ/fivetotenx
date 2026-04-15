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
}

const PRIORITY_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  blocker: { color: 'text-red-500', icon: XCircle, label: 'Critical' },
  important: { color: 'text-amber-500', icon: AlertTriangle, label: 'Important' },
  nice_to_know: { color: 'text-blue-500', icon: Circle, label: 'Helpful' },
};

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
    // Look up token
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

    // Fetch assessment name
    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('business_name')
      .eq('id', td.assessment_id)
      .single();
    if (assessment) setBusinessName((assessment as any).business_name || '');

    // Fetch sent questions
    const { data: qData } = await supabase
      .from('refinement_questions' as any)
      .select('*')
      .eq('assessment_id', td.assessment_id)
      .eq('sent_to_client', true)
      .order('sort_order');

    if (qData) {
      const qs = qData as unknown as Question[];
      setQuestions(qs);
      // Pre-fill existing answers
      const existing: Record<string, string> = {};
      for (const q of qs) {
        if (q.answer) existing[q.id] = q.answer;
      }
      setAnswers(existing);
    }
    setStatus('valid');
  };

  const addLink = (qId: string) => {
    const url = linkInputs[qId]?.trim();
    if (!url) return;
    setAttachments(prev => ({
      ...prev,
      [qId]: {
        links: [...(prev[qId]?.links || []), url],
        files: prev[qId]?.files || [],
      },
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
      [qId]: {
        links: prev[qId]?.links || [],
        files: [...(prev[qId]?.files || []), { name: file.name, url: urlData.publicUrl }],
      },
    }));
    setUploading(null);
    toast({ title: 'File uploaded' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Update each question's answer
      for (const q of questions) {
        const answer = answers[q.id]?.trim();
        if (answer) {
          await supabase.from('refinement_questions' as any)
            .update({ answer, status: 'answered' } as any)
            .eq('id', q.id);
        }

        // Create artifacts for attachments
        const att = attachments[q.id];
        if (att) {
          for (const link of att.links) {
            await supabase.from('client_artifacts').insert({
              assessment_id: assessmentId,
              artifact_type: 'link',
              title: `Re: ${q.question.slice(0, 60)}`,
              content: link,
            } as any);
          }
          for (const file of att.files) {
            await supabase.from('client_artifacts').insert({
              assessment_id: assessmentId,
              artifact_type: 'file',
              title: `Re: ${q.question.slice(0, 60)}`,
              file_url: file.url,
              file_name: file.name,
            } as any);
          }
        }
      }

      // Mark token as used
      await supabase.from('refinement_tokens' as any)
        .update({ used: true } as any)
        .eq('token', token);

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Submit failed', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Group questions by category
  const grouped: Record<string, Question[]> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Already Submitted</h1>
          <p className="text-muted-foreground">Your responses have already been submitted. Thank you!</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Link Expired</h1>
          <p className="text-muted-foreground">This link has expired. Please contact us for a new one.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">This link is not valid. Please check the URL.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Thank You!</h1>
          <p className="text-muted-foreground">
            Your responses have been submitted successfully. Our team will review them and continue refining your project scope.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Scope Refinement</h1>
            {businessName && <p className="text-sm text-muted-foreground">{businessName}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
            <Progress value={progress} className="w-24 h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80 leading-relaxed">
            We need a few more details to make sure we build exactly what you need. Please answer the questions below as thoroughly as you can.
            You can also attach files or links to support your answers.
          </p>
        </div>

        {Object.entries(grouped).map(([category, catQuestions]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">{category}</h2>
            {catQuestions.map((q, idx) => {
              const pri = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.important;
              const PriIcon = pri.icon;
              const att = attachments[q.id];

              return (
                <div key={q.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-muted-foreground mt-0.5">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
                      {q.source_context && (
                        <p className="text-[11px] text-muted-foreground italic mt-1">Context: "{q.source_context}"</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${pri.color}`}>
                      <PriIcon className="w-3 h-3 mr-0.5" /> {pri.label}
                    </Badge>
                  </div>

                  <Textarea
                    placeholder="Type your answer here…"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    className="text-sm bg-secondary/50 border-border resize-none"
                  />

                  {/* Attachments display */}
                  {att && (att.links.length > 0 || att.files.length > 0) && (
                    <div className="space-y-1">
                      {att.links.map((link, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-primary">
                          <Link2 className="w-3 h-3" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{link}</a>
                        </div>
                      ))}
                      {att.files.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/80">
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
                        className="h-7 text-xs flex-1"
                      />
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1" onClick={() => addLink(q.id)} disabled={!linkInputs[q.id]?.trim()}>
                        <Link2 className="w-3 h-3" /> Add
                      </Button>
                    </div>
                    <div className="relative">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1" disabled={uploading === q.id}>
                        {uploading === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        File
                      </Button>
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
        ))}

        {/* Submit */}
        <div className="sticky bottom-0 bg-background border-t border-border py-4 -mx-6 px-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{answeredCount} of {questions.length} questions answered</p>
            <Button onClick={handleSubmit} disabled={submitting || answeredCount === 0} className="gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Responses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefinementPortal;