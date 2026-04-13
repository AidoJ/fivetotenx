import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Paperclip, Plus, Trash2, FileText, Link2, Type, Loader2,
  ExternalLink, Download, X,
} from 'lucide-react';

interface Artifact {
  id: string;
  artifact_type: string;
  title: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface Props {
  assessmentId: string;
}

const typeConfig = {
  text: { icon: Type, label: 'Note', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  link: { icon: Link2, label: 'Link', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  file: { icon: FileText, label: 'File', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
};

const ArtifactsPanel = ({ assessmentId }: Props) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null); // 'text' | 'link' | 'file'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchArtifacts = async () => {
    const { data } = await supabase
      .from('client_artifacts')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });
    setArtifacts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchArtifacts(); }, [assessmentId]);

  const resetForm = () => { setAdding(null); setTitle(''); setContent(''); };

  const addTextArtifact = async () => {
    if (!content.trim()) return;
    const { error } = await supabase.from('client_artifacts').insert({
      assessment_id: assessmentId,
      artifact_type: 'text',
      title: title.trim() || null,
      content: content.trim(),
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    resetForm();
    fetchArtifacts();
    toast({ title: 'Note added ✅' });
  };

  const addLinkArtifact = async () => {
    if (!content.trim()) return;
    const { error } = await supabase.from('client_artifacts').insert({
      assessment_id: assessmentId,
      artifact_type: 'link',
      title: title.trim() || content.trim(),
      content: content.trim(),
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    resetForm();
    fetchArtifacts();
    toast({ title: 'Link added ✅' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${assessmentId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('interview-audio')
      .upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('interview-audio').getPublicUrl(filePath);
    const { error } = await supabase.from('client_artifacts').insert({
      assessment_id: assessmentId,
      artifact_type: 'file',
      title: title.trim() || file.name,
      file_url: urlData.publicUrl,
      file_name: file.name,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    resetForm();
    setUploading(false);
    fetchArtifacts();
    toast({ title: 'File uploaded ✅' });
  };

  const deleteArtifact = async (id: string) => {
    await supabase.from('client_artifacts').delete().eq('id', id);
    setArtifacts(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Artifact removed' });
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Artifacts</h3>
          {artifacts.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4">{artifacts.length}</Badge>
          )}
        </div>
        {!adding && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => setAdding('text')}>
              <Type className="w-3 h-3" /> Note
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => setAdding('link')}>
              <Link2 className="w-3 h-3" /> Link
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => setAdding('file')}>
              <FileText className="w-3 h-3" /> File
            </Button>
          </div>
        )}
      </div>

      {/* Add form */}
      {adding === 'text' && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Note</span>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={resetForm}><X className="w-3 h-3" /></Button>
          </div>
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className="h-7 text-xs" />
          <Textarea placeholder="Write your note..." value={content} onChange={e => setContent(e.target.value)} className="text-xs min-h-[60px]" />
          <Button size="sm" className="h-6 text-[10px] px-3" onClick={addTextArtifact} disabled={!content.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Add Note
          </Button>
        </div>
      )}

      {adding === 'link' && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Link</span>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={resetForm}><X className="w-3 h-3" /></Button>
          </div>
          <Input placeholder="Label (optional)" value={title} onChange={e => setTitle(e.target.value)} className="h-7 text-xs" />
          <Input placeholder="https://..." value={content} onChange={e => setContent(e.target.value)} className="h-7 text-xs" />
          <Button size="sm" className="h-6 text-[10px] px-3" onClick={addLinkArtifact} disabled={!content.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Add Link
          </Button>
        </div>
      )}

      {adding === 'file' && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Upload File</span>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={resetForm}><X className="w-3 h-3" /></Button>
          </div>
          <Input placeholder="Label (optional)" value={title} onChange={e => setTitle(e.target.value)} className="h-7 text-xs" />
          <Input type="file" className="h-8 text-xs" onChange={handleFileUpload} disabled={uploading} />
          {uploading && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
            </div>
          )}
        </div>
      )}

      {/* Artifact list */}
      {loading ? (
        <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : artifacts.length === 0 && !adding ? (
        <p className="text-[10px] text-muted-foreground italic">
          Add notes, links, or files to build the full picture for analysis.
        </p>
      ) : (
        <div className="space-y-2">
          {artifacts.map(a => {
            const cfg = typeConfig[a.artifact_type as keyof typeof typeConfig] || typeConfig.text;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="rounded-lg border border-border bg-card p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className={`text-[8px] h-4 shrink-0 ${cfg.color}`}>
                      <Icon className="w-2.5 h-2.5 mr-0.5" /> {cfg.label}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      {a.title && <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>}
                      {a.artifact_type === 'text' && a.content && (
                        <p className="text-[11px] text-foreground/80 whitespace-pre-wrap mt-0.5">{a.content}</p>
                      )}
                      {a.artifact_type === 'link' && a.content && (
                        <a href={a.content} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                          {a.content} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {a.artifact_type === 'file' && a.file_url && (
                        <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                          <Download className="w-2.5 h-2.5" /> {a.file_name || 'Download'}
                        </a>
                      )}
                      <span className="text-[9px] text-muted-foreground mt-1 block">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteArtifact(a.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArtifactsPanel;
