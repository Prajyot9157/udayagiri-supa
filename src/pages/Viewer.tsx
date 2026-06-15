import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Viewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Document Preview';

  const embedUrl = url ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : '';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm relative z-20">
        <div className="flex items-center gap-3 max-w-[80%]">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 mr-1 transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
          <span className="shrink-0"><i className="fa-solid fa-file-pdf text-indigo-600 text-lg"></i></span>
          <h3 className="text-slate-800 font-bold text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <a href={url} target="_blank" rel="noreferrer" title="Open externally" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full relative bg-slate-100">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-600 z-0">
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
            <p className="text-xs text-slate-500">Loading Document Viewer...</p>
          </div>
        )}
        {url ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none z-10 relative bg-transparent" 
            allowFullScreen 
            onLoad={() => setLoading(false)}
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
            <i className="fa-solid fa-circle-exclamation text-3xl mb-3"></i>
            <p className="text-xs">Invalid Document URL</p>
          </div>
        )}
      </div>
    </div>
  );
}
