import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function StudentApp() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('home');
  const [currentCategory, setCurrentCategory] = useState('notes');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState({ msg: '', isError: false, visible: false });
  const [previewObj, setPreviewObj] = useState<any | null>(null);
  const [zoomObj, setZoomObj] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mhtCetSavedItems');
    const completed = localStorage.getItem('mhtCetCompletedItems');
    if (saved) setSavedItems(JSON.parse(saved));
    if (completed) setCompletedItems(JSON.parse(completed));

    fetchMaterials();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaterials = async () => {
    const { data } = await supabase.from('study_materials').select('*').order('created_at', { ascending: false });
    if (data) setAllMaterials(data);
  };

  const showToast = (msg: string, isError = false) => {
    setToastMsg({ msg, isError, visible: true });
    setTimeout(() => setToastMsg(prev => ({ ...prev, visible: false })), 3000);
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (savedItems.includes(id)) {
      updated = savedItems.filter(i => i !== id);
      showToast("Removed from saved items");
    } else {
      updated = [...savedItems, id];
      showToast("Added to saved items!");
    }
    setSavedItems(updated);
    localStorage.setItem('mhtCetSavedItems', JSON.stringify(updated));
  };

  const toggleComplete = (id: string, e: React.MouseEvent | null) => {
    if (e) e.stopPropagation();
    let updated;
    if (completedItems.includes(id)) {
      updated = completedItems.filter(i => i !== id);
      showToast("Marked as unread");
    } else {
      updated = [...completedItems, id];
      showToast("Great! Marked as read.");
    }
    setCompletedItems(updated);
    localStorage.setItem('mhtCetCompletedItems', JSON.stringify(updated));
  };

  const handleAction = (item: any) => {
    if (!completedItems.includes(item.id)) {
      toggleComplete(item.id, null);
    }
    if (item.content_type === 'zoom') {
      setZoomObj(item);
    } else if (item.content_type === 'youtube') {
      setPreviewObj(item);
    } else {
      navigate(`/viewer?url=${encodeURIComponent(item.pdf_url || '')}&title=${encodeURIComponent(item.topic)}`);
    }
  };

  const closeModals = () => {
    setPreviewObj(null);
    setZoomObj(null);
  };

  // UI Components inside for simplicity
  const renderHome = () => (
    <div className="h-full overflow-y-auto hide-scrollbar pb-24 app-view fade-in">
      <div className="mx-5 mt-4 p-6 rounded-3xl bg-slate-900 relative overflow-hidden border border-slate-800 shadow-lg max-w-4xl xl:mx-auto">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-1">Hello, Student <span className="text-yellow-400">👋</span></h2>
          <p className="text-xs text-slate-300 mb-5">Access all your study materials here.</p>
          <div className="flex gap-6 text-left">
            <div>
              <div className="text-xs text-indigo-400 mb-1 flex items-center gap-1.5"><i className="fa-solid fa-layer-group text-[10px]"></i> Total Materials</div>
              <div className="font-bold text-2xl text-white">{allMaterials.length}</div>
            </div>
            <div className="w-px h-10 bg-slate-700 my-auto"></div>
            <div>
              <div className="text-xs text-indigo-400 mb-1 flex items-center gap-1.5"><i className="fa-solid fa-clock-rotate-left text-[10px]"></i> New This Week</div>
              <div className="font-bold text-2xl text-white">{allMaterials.filter(m => new Date(m.created_at).getTime() > Date.now() - 7*24*60*60*1000).length}</div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-28 bg-slate-800 flex flex-col items-center justify-center border-l border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => switchTab('notes')}>
          <i className="fa-solid fa-book text-3xl text-indigo-400 mb-2"></i>
          <div className="text-[10px] text-center font-bold text-white mt-1">Materials</div>
        </div>
      </div>

      <div className="px-5 mt-6 max-w-4xl xl:mx-auto">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Quick Access</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 gap-x-2">
          {[{id:'live', icon:'fa-tv', title:'Live Classes'}, {id:'tests', icon:'fa-file-pen', title:'Tests'}, {id:'notes', icon:'fa-book', title:'Notes'}, {id:'pyq', icon:'fa-bullseye', title:'PYQ Bank'}, {id:'practice', icon:'fa-crosshairs', title:'Practice'}, {id:'formula', icon:'fa-file-lines', title:'Formula Sheet'}, {id:'mindmaps', icon:'fa-network-wired', title:'Mind Maps'}].map(cat => (
            <div key={cat.id} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => switchTab(cat.id)}>
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 text-xl group-hover:border-indigo-300 group-hover:shadow-md transition-all"><i className={`fa-solid ${cat.icon}`}></i></div>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{cat.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 max-w-4xl xl:mx-auto">
        <div className="px-5 flex justify-between items-end mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Recently Added</h3>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-4 pb-2">
          {allMaterials.slice(0, 5).map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );

  const renderSubjectList = () => {
    const subjects = ["Physics", "Chemistry", "Mathematics", "Biology"];
    return (
      <div className="h-full overflow-y-auto hide-scrollbar pb-24 fade-in px-5 max-w-5xl mx-auto w-full mt-4">
        <h3 className="text-slate-800 font-bold mb-4 uppercase">{currentCategory} Subjects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map(subj => (
            <div key={subj} onClick={() => { setSelectedSubject(subj); setCurrentTab('subject-detail'); }} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer w-full">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 bg-indigo-50 text-indigo-600">
                <i className="fa-solid fa-atom"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate">{subj}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{allMaterials.filter(m => m.subject === subj && m.category === currentCategory).length} items</p>
              </div>
              <i className="fa-solid fa-chevron-right text-slate-400 text-xs shrink-0"></i>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubjectDetail = () => {
    const list = allMaterials.filter(m => m.subject === selectedSubject && m.category === currentCategory);
    return (
      <div className="h-full overflow-y-auto hide-scrollbar pb-24 slide-in-right flex-col max-w-5xl mx-auto w-full mt-4">
        <div className="px-5 flex items-center gap-4 mb-4">
          <div onClick={() => setCurrentTab('category-subjects')} className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"><i className="fa-solid fa-arrow-left"></i></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedSubject} ({currentCategory})</h2>
            <p className="text-xs text-slate-500 mt-0.5">{list.length} Items</p>
          </div>
        </div>
        <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-3" >
          {list.length === 0 ? <p className="text-slate-500 text-sm">No items found.</p> : list.map(m => <ItemCard key={m.id} item={m} />)}
        </div>
      </div>
    );
  };

  const renderSaved = () => {
    const list = allMaterials.filter(m => savedItems.includes(m.id));
    return (
      <div className="h-full overflow-y-auto hide-scrollbar pb-24 fade-in px-5 py-4 max-w-5xl mx-auto w-full">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Saved Materials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.length === 0 ? <p className="text-slate-500 text-sm">No saved items.</p> : list.map(m => <ItemCard key={m.id} item={m} />)}
        </div>
      </div>
    );
  };

  const ItemCard: React.FC<{item:any}> = ({item}) => {
    const isSaved = savedItems.includes(item.id);
    const isCompleted = completedItems.includes(item.id);
    const icon = item.content_type === 'youtube' ? 'fa-play' : item.content_type === 'zoom' ? 'fa-video' : 'fa-file-pdf';
    return (
      <div className={`bg-white border ${isCompleted ? 'border-emerald-200' : 'border-slate-200'} rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer w-full relative overflow-hidden shrink-0`}>
        {isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.content_type === 'youtube' ? 'bg-indigo-50 text-indigo-600' : item.content_type === 'zoom' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-500' : 'text-slate-800'} truncate leading-tight`}>{item.topic}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">{item.subject}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={(e) => toggleComplete(item.id, e)} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
             <i className={`${isCompleted ? 'fa-solid fa-circle-check text-emerald-500' : 'fa-regular fa-circle-check text-slate-400'}`}></i>
          </button>
          <button onClick={(e) => toggleSave(item.id, e)} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
             <i className={`${isSaved ? 'fa-solid fa-bookmark text-indigo-600' : 'fa-regular fa-bookmark text-slate-400'}`}></i>
          </button>
          <button onClick={() => handleAction(item)} className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
            <i className="fa-solid fa-eye"></i> View
          </button>
        </div>
      </div>
    );
  };

  const switchTab = (tab: string) => {
    if (['notes', 'mindmaps', 'formula', 'dpp', 'pyq', 'practice', 'tests', 'live'].includes(tab)) {
      setCurrentCategory(tab);
      setCurrentTab('category-subjects');
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="app-container w-full h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden">
      <header className="h-16 flex justify-between items-center bg-white border-b border-slate-200 px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 cursor-pointer" onClick={() => setSidebarOpen(true)}>
             <span className="text-white font-bold text-xl">E</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 truncate">EduFlow <span className="font-semibold text-slate-500">Pro</span></h1>
        </div>
        <button onClick={() => navigate('/admin')} className="text-xs bg-indigo-50 px-4 py-2 rounded-lg text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">Instructor Panel</button>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'category-subjects' && renderSubjectList()}
        {currentTab === 'subject-detail' && renderSubjectDetail()}
        {currentTab === 'saved' && renderSaved()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-slate-200 flex items-center justify-around z-20 pb-1 w-full max-w-5xl mx-auto shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <button onClick={() => switchTab('home')} className={`flex flex-col items-center gap-1 w-16 ${currentTab === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 transition-colors'}`}>
          <i className="fa-solid fa-house text-xl"></i><span className="text-[10px] font-semibold mt-0.5">Home</span>
        </button>
        <button onClick={() => switchTab('tests')} className={`flex flex-col items-center gap-1 w-16 ${currentCategory === 'tests' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 transition-colors'}`}>
          <i className="fa-solid fa-file-pen text-xl"></i><span className="text-[10px] font-semibold mt-0.5">Tests</span>
        </button>
        <button onClick={() => switchTab('notes')} className={`flex flex-col items-center gap-1 w-16 ${currentCategory === 'notes' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 transition-colors'}`}>
          <i className="fa-solid fa-book text-xl"></i><span className="text-[10px] font-semibold mt-0.5">Notes</span>
        </button>
        <button onClick={() => switchTab('saved')} className={`flex flex-col items-center gap-1 w-16 ${currentTab === 'saved' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 transition-colors'}`}>
          <i className="fa-solid fa-bookmark text-xl"></i><span className="text-[10px] font-semibold mt-0.5">Saved</span>
        </button>
      </nav>

      {sidebarOpen && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]" onClick={() => setSidebarOpen(false)}></div>}
      <div className={`absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-[100] transition-transform flex flex-col`}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
               <span className="text-white font-bold">E</span>
             </div>
             <h2 className="text-slate-800 font-bold text-lg leading-tight">EduFlow</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <button onClick={() => {setSidebarOpen(false); switchTab('home');}} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-3 transition-colors"><i className="fa-solid fa-house w-5"></i> Dashboard</button>
          <button onClick={() => {setSidebarOpen(false); switchTab('saved');}} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-3 transition-colors"><i className="fa-solid fa-bookmark w-5"></i> Saved</button>
        </div>
        <div className="p-4">
          <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden">
            <p className="text-xs font-medium text-slate-400 mb-1">ADMIN ACCESS</p>
            <p className="text-sm font-semibold">Instructor Panel</p>
            <button onClick={() => navigate('/admin')} className="mt-3 w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold transition-colors">GO TO PANEL</button>
          </div>
        </div>
      </div>

      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-xl text-sm font-bold text-slate-800 flex items-center gap-2 transition-all duration-300 ${toastMsg.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'}`}>
        <i className={`fa-solid ${toastMsg.isError ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-emerald-500'}`}></i>
        <span className="truncate">{toastMsg.msg}</span>
      </div>

      {zoomObj && (
        <div className="absolute inset-0 z-[85] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-1">{zoomObj.topic}</h3>
            <p className="text-xs text-slate-500 mb-6">{zoomObj.subject}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 font-mono text-xs text-slate-700">
              Meeting ID: {zoomObj.meeting_id}<br/>Passcode: {zoomObj.meeting_passcode}
            </div>
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors">Cancel</button>
              <a href={zoomObj.youtube_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">Join Zoom</a>
            </div>
          </div>
        </div>
      )}

      {previewObj && (
        <div className="absolute inset-0 z-[85] bg-slate-50 flex flex-col fade-in">
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 relative z-20 shrink-0">
            <h3 className="text-slate-800 font-bold text-sm truncate">{previewObj.topic}</h3>
            <button onClick={closeModals} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <iframe src={`https://www.youtube.com/embed/${previewObj.youtube_url?.split('v=')[1] || ''}?autoplay=1`} className="w-full flex-1 border-none bg-black" allow="autoplay; encrypted-media" allowFullScreen></iframe>
        </div>
      )}

    </div>
  );
}
