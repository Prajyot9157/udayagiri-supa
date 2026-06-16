import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Viewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Course Study Document';

  const embedUrl = url ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : '';

  return (
    <div className="flex flex-col h-screen w-full bg-[#070B14] text-white">
      {/* Premium Dark toolbar matching header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#111827]/90 backdrop-blur-md border-b border-white/5 relative z-20 shadow-lg">
        <div className="flex items-center gap-3.5 max-w-[80%]">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-lg bg-white/5 text-white/80 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/5 hover:border-white/10 mr-1"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <span className="shrink-0 text-[#FF4D7A] text-lg"><i className="fa-solid fa-file-pdf"></i></span>
          <h3 className="text-white font-extrabold text-sm truncate">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              title="Open document in original tab" 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
          )}
        </div>
      </div>
      
      {/* File Frame viewport */}
      <div className="flex-1 w-full relative bg-[#070B14]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#FF4D7A] bg-[#070B14] z-10 space-y-3">
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-[#FF4D7A] animate-spin"></div>
            <p className="text-xs text-[#B3B3B3] font-mono uppercase tracking-widest">Opening Secure PDF Reader...</p>
          </div>
        )}
        {url ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none z-0 relative bg-white" 
            allowFullScreen 
            onLoad={() => setLoading(false)}
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#B3B3B3] z-10">
            <i className="fa-solid fa-circle-exclamation text-3xl text-[#FF4D7A] mb-3"></i>
            <p className="text-sm font-bold">Invalid or Missing Document Path</p>
          </div>
        )}
      </div>
    </div>
  );
}
