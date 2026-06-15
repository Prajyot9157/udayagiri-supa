import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subject: 'Physics', category: 'notes', type: 'pdf', desc: '', url: '', meetingId: '', passcode: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const { data } = await supabase.from('study_materials').select('*').order('created_at', { ascending: false });
    if (data) setMaterials(data);
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      if (url && url.includes('supabase.co')) {
        const path = url.split('/').pop();
        if (path) await supabase.storage.from('pdfs').remove([path]);
      }
      await supabase.from('study_materials').delete().eq('id', id);
      fetchMaterials();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let finalPdfUrl = formData.url;

    try {
      if (formData.type === 'pdf' && pdfFile) {
        if (pdfFile.size > 25 * 1024 * 1024) throw new Error("File exceeds 25MB");
        const filename = `${Date.now()}_${pdfFile.name}`;
        const { data: uploadData, error } = await supabase.storage.from('pdfs').upload(filename, pdfFile);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(uploadData.path);
        finalPdfUrl = publicUrl;
      }

      await supabase.from('study_materials').insert({
        topic: formData.title,
        subject: formData.subject,
        category: formData.category,
        content_type: formData.type,
        description: formData.desc,
        pdf_url: formData.type === 'pdf' ? finalPdfUrl : null,
        youtube_url: formData.type === 'youtube' ? formData.url : null,
        meeting_id: formData.type === 'zoom' ? formData.meetingId : null,
        meeting_passcode: formData.type === 'zoom' ? formData.passcode : null,
        file_size_bytes: pdfFile ? pdfFile.size : 0,
        file_size_text: pdfFile ? `${(pdfFile.size / (1024*1024)).toFixed(2)} MB` : ''
      });

      alert('Uploaded successfully!');
      setFormData({title: '', subject: 'Physics', category: 'notes', type: 'pdf', desc: '', url: '', meetingId: '', passcode: ''});
      setPdfFile(null);
      fetchMaterials();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0 hidden md:flex">
        <h1 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 cursor-pointer">
             <span className="text-white font-bold text-xl">E</span>
          </div>
          EduFlow Pro
        </h1>
        <div className="space-y-1 flex-1">
          <button className="w-full text-left px-4 py-3 rounded-lg bg-indigo-50 text-indigo-600 flex items-center gap-3 font-semibold"><i className="fa-solid fa-cloud-arrow-up w-5"></i> Upload Material</button>
          <button onClick={() => navigate('/')} className="w-full text-left px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-3 font-semibold transition-colors"><i className="fa-solid fa-house w-5"></i> Student App</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 hide-scrollbar">
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">Admin</h1>
          <button onClick={() => navigate('/')} className="text-sm bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-lg">Student App</button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Create Material</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Topic Name" className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <select className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="notes">Notes</option>
                  <option value="mindmaps">Mind Maps</option>
                  <option value="formula">Formula Sheet</option>
                  <option value="dpp">DPP</option>
                  <option value="pyq">PYQ</option>
                  <option value="practice">Practice Sets</option>
                  <option value="tests">Mock Tests</option>
                  <option value="live">Live Classes</option>
                </select>
                <select className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                  <option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option>
                </select>
                <select className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pdf">PDF Document</option><option value="youtube">YouTube Video</option><option value="zoom">Zoom Live Class</option>
                </select>
              </div>
              
              {formData.type === 'pdf' && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:border-indigo-300 transition-colors">
                  <i className="fa-solid fa-file-pdf text-4xl text-slate-300 mb-4"></i>
                  <input required type="file" accept=".pdf" className="text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors file:cursor-pointer" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-slate-400 mt-3">Max limit: 25MB (.pdf only)</p>
                </div>
              )}

              {formData.type === 'youtube' && (
                <input required type="url" placeholder="YouTube URL" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              )}

              {formData.type === 'zoom' && (
                <div className="flex gap-4">
                  <input required type="text" placeholder="Meeting ID" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.meetingId} onChange={e => setFormData({...formData, meetingId: e.target.value})} />
                  <input type="text" placeholder="Passcode" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none" value={formData.passcode} onChange={e => setFormData({...formData, passcode: e.target.value})} />
                </div>
              )}

              <textarea placeholder="Description (Optional)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:border-indigo-500 outline-none resize-none h-24" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}></textarea>
              <button disabled={uploading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200">{uploading ? 'Uploading...' : 'Upload Material'}</button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Manage Materials</h2>
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold">{materials.length} Items</span>
            </div>
            <div className="divide-y divide-slate-100">
              {materials.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 w-[70%]">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                      <i className={`fa-solid ${m.content_type === 'youtube' ? 'fa-play' : m.content_type === 'zoom' ? 'fa-video' : 'fa-file-pdf'}`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.topic}</p>
                      <p className="text-xs text-slate-500">{m.subject} • {m.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pr-2">
                    <button onClick={() => handleDelete(m.id, m.pdf_url)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><i className="fa-solid fa-trash text-sm"></i></button>
                  </div>
                </div>
              ))}
              {materials.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">No materials uploaded yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
