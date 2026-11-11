import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Search, 
  Trash2, 
  Download, 
  Play, 
  Eye, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  AlertCircle, 
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { GenerationJob } from '../types.js';

interface GalleryPageProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function GalleryPage({ openAuthModal, setCurrentTab }: GalleryPageProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<GenerationJob[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GenerationJob | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getProjects(filterType === 'all' ? undefined : filterType);
      setProjects(res.projects);
    } catch (err) {
      console.error('Error fetching gallery projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, filterType]);

  const handleDelete = async (jobId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع من المعرض؟')) return;
    try {
      await api.deleteProject(jobId);
      setProjects(prev => prev.filter(p => p.jobId !== jobId));
      if (selectedItem?.jobId === jobId) setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || 'فشل حذف المشروع');
    }
  };

  const filtered = projects.filter(p => {
    if (!searchQuery.trim()) return true;
    return p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">معرض المشاريع والنتائج المولدة</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            جميع أعمالك السابقة من فيديوهات وصور ومقاطع صوتية محفوظة في مكان واحد مع روابط تنزيل آمنة.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'video', label: 'فيديو' },
            { id: 'image', label: 'صور' },
            { id: 'speech', label: 'صوتيات' },
            { id: 'prompt_expand', label: 'سيناريوهات' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* View Dashboard Button */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 hover:border-cyan-500/80 transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>لوحة الإحصائيات</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث بكلمات من وصف المشروع (البرومبت)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 rtl:pr-10 ltr:pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Projects Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(item => {
            const isVideo = item.type === 'video';
            const isImage = item.type === 'image';
            const isSpeech = item.type === 'speech';

            return (
              <div 
                key={item.jobId}
                className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isImage && item.resultUrl ? (
                    <img src={item.resultUrl} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : isVideo && item.resultUrl ? (
                    <div className="w-full h-full relative">
                      <video src={item.resultUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  ) : isSpeech ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <Mic className="w-8 h-8 text-amber-400" />
                      <span className="text-[11px] text-slate-400">ملف صوتي جاهز</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <FileText className="w-8 h-8 text-emerald-400" />
                      <span className="text-[11px] text-slate-400">سيناريو مكتوب</span>
                    </div>
                  )}

                  {/* Top Type Badge */}
                  <div className="absolute top-2 right-2 rtl:right-2 rtl:left-auto ltr:left-2 ltr:right-auto px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-bold text-slate-300 backdrop-blur-sm">
                    {item.type.toUpperCase()}
                  </div>
                </div>

                {/* Info & Metadata */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={item.prompt}>
                    {item.prompt}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="text-cyan-400 font-mono">{item.actualCost || item.estimatedCost} رصيد</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {item.resultUrl ? (
                      <a
                        href={item.resultUrl}
                        download={`project_${item.jobId}`}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>تحميل</span>
                      </a>
                    ) : null}

                    <button
                      onClick={() => handleDelete(item.jobId)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="حذف المشروع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">لا توجد مشاريع سابقة في هذا التصنيف</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            قم بالدخول إلى استوديو الفيديو، الصور أو الصوتيات لإنتاج أول مشروع لك الآن.
          </p>
          <button
            onClick={() => setCurrentTab('video')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            إنتاج فيديو جديد
          </button>
        </div>
      )}

    </div>
  );
}
