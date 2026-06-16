import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/dbHelper';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, Subject, Material, Video, Test, Question, 
  LiveClass, TimelineEvent, Notification, SavedMaterial, 
  PracticeMaterial, MindMap, FormulaSheet, PyqBank 
} from '../types';

export default function StudentApp() {
  const navigate = useNavigate();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'live' | 'tests' | 'notes' | 'pyq' | 'practice' | 'formula' | 'mindmaps' | 'timeline' | 'saved' | 'notifications' | 'profile' | 'search' | 'subject-detail'>('home');
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed' | 'all'>('upcoming');

  // Supabase Live Data State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [practiceMaterials, setPracticeMaterials] = useState<PracticeMaterial[]>([]);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [formulaSheets, setFormulaSheets] = useState<FormulaSheet[]>([]);
  const [pyqBank, setPyqBank] = useState<PyqBank[]>([]);
  const [savedData, setSavedData] = useState<SavedMaterial[]>([]);
  
  // Interactive Overlays & Logic State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [toast, setToast] = useState<{ msg: string; show: boolean; isError?: boolean }>({ msg: '', show: false });
  const [selectedPdf, setSelectedPdf] = useState<any | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [currentActiveTest, setCurrentActiveTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0, percent: 0 });

  // Load state and profiles on mount
  useEffect(() => {
    initializeProfile();
    fetchData();

    // Subscribe to realtime database channels for instant student sync
    const liveClassesChannel = supabase.channel('classes-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, () => {
        fetchLiveClasses();
      })
      .subscribe();

    const materialsChannel = supabase.channel('materials-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    const notificationsChannel = supabase.channel('notification-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveClassesChannel);
      supabase.removeChannel(materialsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, show: true, isError });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Helper to ensure dummy profile exists in DB to prevent blanks
  const initializeProfile = async () => {
    try {
      const email = 'student@example.com';
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!error && data) {
        setCurrentUser(data);
        fetchSavedItems(email);
      } else {
        // Create matching live record
        const { data: newUser } = await supabase.from('users').insert({
          name: 'Prajyot Gond',
          email,
          phone: '+91 91572 82035',
          batch: 'MHT CET Class 12 Science'
        }).select().single();
        if (newUser) {
          setCurrentUser(newUser);
          fetchSavedItems(email);
        }
      }
    } catch (e) {
      console.error("Profile initialization legacy override:", e);
      setCurrentUser({
        id: 'mock-id',
        name: 'Prajyot Gond',
        email: 'student@example.com',
        phone: '+91 91572 82035',
        batch: 'MHT CET Class 12 Science'
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMaterials(),
      fetchVideos(),
      fetchTests(),
      fetchLiveClasses(),
      fetchTimelineEvents(),
      fetchNotifications(),
      fetchPracticeMaterials(),
      fetchMindMaps(),
      fetchFormulaSheets(),
      fetchPyqBank(),
    ]);
    setLoading(false);
  };

  const fetchMaterials = async () => {
    const data = await db.getMaterials();
    setMaterials(data);
  };

  const fetchVideos = async () => {
    const data = await db.getVideos();
    setVideos(data);
  };

  const fetchTests = async () => {
    const data = await db.getTests();
    setTests(data);
  };

  const fetchLiveClasses = async () => {
    const data = await db.getLiveClasses();
    setLiveClasses(data);
  };

  const fetchTimelineEvents = async () => {
    const data = await db.getTimelineEvents();
    setTimelineEvents(data);
  };

  const fetchNotifications = async () => {
    const data = await db.getNotifications();
    setNotifications(data);
  };

  const fetchPracticeMaterials = async () => {
    const data = await db.getPracticeMaterials();
    setPracticeMaterials(data);
  };

  const fetchMindMaps = async () => {
    const data = await db.getMindMaps();
    setMindMaps(data);
  };

  const fetchFormulaSheets = async () => {
    const data = await db.getFormulaSheets();
    setFormulaSheets(data);
  };

  const fetchPyqBank = async () => {
    const data = await db.getPyqBank();
    setPyqBank(data);
  };

  const fetchSavedItems = async (email: string) => {
    const data = await db.getSavedMaterials(email);
    setSavedData(data);
  };

  // Toggle dynamic saving using active Supabase saves table
  const handleToggleSave = async (materialId: string, materialType: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const email = currentUser.email;
    const isSavedAlready = savedData.some(s => s.material_id === materialId);

    try {
      if (isSavedAlready) {
        await db.unsaveMaterial(email, materialId);
        showToast("Removed from saved library.");
      } else {
        await db.saveMaterial(email, materialId, materialType);
        showToast("Added to saved library!");
      }
      fetchSavedItems(email);
    } catch (err: any) {
      showToast("Error updating bookmarks: " + err.message, true);
    }
  };

  // Open Document Viewer Screen
  const handleViewPdf = (item: any) => {
    setSelectedPdf(item);
  };

  // Open Video Viewer Screen
  const handlePlayVideo = (video: Video) => {
    setActiveVideo(video);
  };

  // Initialize interactive test Taking
  const handleStartTest = async (testToTake: Test) => {
    setLoading(true);
    const questions = await db.getQuestions(testToTake.id);
    setTestQuestions(questions);
    setCurrentActiveTest(testToTake);
    setUserAnswers({});
    setTestSubmitted(false);
    setCurrentView('tests'); // Keep in view or test modal
    setLoading(false);
  };

  const handleSelectOption = (qId: string, option: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmitTest = () => {
    if (!currentActiveTest) return;
    let correctCount = 0;
    testQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correct_option) {
        correctCount += 1;
      }
    });

    const percent = Math.round((correctCount / (testQuestions.length || 1)) * 100);
    setTestScore({
      correct: correctCount,
      total: testQuestions.length,
      percent
    });
    setTestSubmitted(true);
  };

  const handleCloseTest = () => {
    setCurrentActiveTest(null);
    setTestQuestions([]);
    setUserAnswers({});
    setTestSubmitted(false);
  };

  // Search filter computes
  const getFilteredItems = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    
    return [
      ...materials.map(m => ({ ...m, typeLabel: 'Note/Material', route: 'notes' })),
      ...videos.map(v => ({ ...v, typeLabel: 'Video Lecture', route: 'live' })),
      ...tests.map(t => ({ ...t, typeLabel: 'Mock Test', route: 'tests' })),
      ...mindMaps.map(m => ({ ...m, typeLabel: 'Mind Map', route: 'mindmaps' })),
      ...formulaSheets.map(f => ({ ...f, typeLabel: 'Formula Sheet', route: 'formula' })),
      ...pyqBank.map(p => ({ ...p, typeLabel: 'Previous Year Paper', route: 'pyq' }))
    ].filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.typeLabel && item.typeLabel.toLowerCase().includes(q))
    );
  };

  // Generate mock live resources for setup demonstration
  const handleSeedTestData = async () => {
    setLoading(true);
    try {
      // Create subjects if none
      await db.createSubject('Physics', 'notes');
      await db.createSubject('Chemistry', 'notes');
      await db.createSubject('Mathematics', 'notes');
      await db.createSubject('Biology', 'notes');

      // Create a few premium live classes
      await db.createLiveClass({
        title: 'Current Electricity Masterclass',
        subject: 'Physics',
        class_date: '2026-06-25',
        class_time: '07:00 PM',
        teacher_name: 'Dr. S. K. Roy',
        meeting_url: 'https://zoom.us',
        meeting_id: '921 5422 8352',
        meeting_passcode: 'MHTCET2026',
        status: 'upcoming'
      });

      await db.createLiveClass({
        title: 'Aldehydes & Ketones Reaction Mechanisms',
        subject: 'Chemistry',
        class_date: '2026-06-26',
        class_time: '06:00 PM',
        teacher_name: 'Prof. Mehta',
        meeting_url: 'https://meet.google.com',
        meeting_id: 'gmeet-abc-xyz',
        meeting_passcode: 'None',
        status: 'live'
      });

      // Insert mock tests
      const { data: testData } = await db.createTest({
        title: 'Full Length Syllabus Mock Test - 1',
        subject: 'Mathematics',
        duration_mins: 180,
        total_marks: 100,
        total_questions: 3
      });

      if (testData && testData.length > 0) {
        // Insert sample questions
        const testId = testData[0].id;
        await db.createQuestion({
          test_id: testId,
          question_text: 'If matrix A is symmetric and B is skew-symmetric, then A + B is always:',
          option_a: 'Symmetric Matix',
          option_b: 'Skew-Symmetric Matrix',
          option_c: 'Neither Symmetric nor Skew-Symmetric',
          option_d: 'Diagonal Matrix',
          correct_option: 'C'
        });
        await db.createQuestion({
          test_id: testId,
          question_text: 'The derivative of sin(x^2) with respect to x is:',
          option_a: '2x cos(x^2)',
          option_b: 'cos(x^2)',
          option_c: '-2x cos(x^2)',
          option_d: '2x sin(x^2)',
          correct_option: 'A'
        });
      }

      await db.createTimelineEvent({
        title: 'Mathematics Live Class: Integration',
        event_date: '2026-06-20',
        event_time: '04:00 PM',
        type: 'class',
        subject: 'Mathematics'
      });

      showToast("Live database initialized successfully with demo materials!");
      fetchData();
    } catch (e: any) {
      showToast("Setup Error: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Helper subjects
  const subjectsList = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'];

  // Global Empty State renderer
  const renderEmptyState = (categoryName: string, iconClass: string, uploadType = 'material') => (
    <div className="glass-card rounded-3xl p-8 text-center max-w-lg mx-auto my-12 fade-in">
      <div className="w-16 h-16 bg-gradient-to-r from-[#7C3AED]/20 to-[#FF4D7A]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl text-[#FF4D7A] shadow-[0_0_15px_rgba(255,77,122,0.15)] glow-pulse">
        <i className={`fa-solid ${iconClass}`}></i>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No {categoryName} Scheduled</h3>
      <p className="text-sm text-[#B3B3B3] mb-6 leading-relaxed">
        Everything on this panel is fetched instantly from your active Supabase database. There are currently no {categoryName.toLowerCase()} registered in the system.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          onClick={() => navigate('/admin')} 
          className="px-5 py-3 rounded-xl text-white font-bold bg-[#7C3AED] hover:bg-[#6c2ee0] transition-all text-xs shadow-md shadow-[#7c3aed]/20"
        >
          <i className="fa-solid fa-cloud-arrow-up mr-2"></i> Go to Instructor Panel
        </button>
        <button 
          onClick={handleSeedTestData}
          className="px-5 py-3 rounded-xl border border-dashed border-[#FF4D7A]/30 text-[#FF4D7A] hover:bg-[#FF4D7A]/10 transition-all font-semibold text-xs"
        >
          <i className="fa-solid fa-gears mr-2"></i> Auto-Seed Sample Data
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container w-full h-screen bg-[#070B14] text-white flex flex-col relative overflow-hidden select-none">
      
      {/* 20px Rounded Floating Visual Wrapper on Desktop/Tablet */}
      <div className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto shadow-2xl relative">
        
        {/* Top Header */}
        <header className="h-16 flex justify-between items-center bg-[#070B14]/80 backdrop-blur-md border-b border-white/5 px-6 z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/5 active:scale-95 flex items-center justify-center text-white/80 border border-white/10 hover:border-[#FF4D7A]/30 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                MHT CET <span className="text-xs bg-gradient-to-r from-[#FF4D7A] to-[#7C3AED] text-white px-2 py-0.5 rounded-md font-extrabold shadow-[0_0_10px_rgba(255,77,122,0.2)]">12 Science</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button 
              onClick={() => setCurrentView('search')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${currentView === 'search' ? 'border-[#FF4D7A] bg-[#FF4D7A]/10 text-[#FF4D7A]' : 'border-white/5 hover:border-white/20 text-white/70'}`}
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </button>

            {/* Notification Dot Trigger */}
            <button 
              onClick={() => setCurrentView('notifications')}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/5 hover:border-white/20 text-white/70 relative cursor-pointer"
            >
              <i className="fa-solid fa-bell text-sm"></i>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4D7A] text-[9px] font-bold text-white flex items-center justify-center glow-pulse animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button 
              onClick={() => setCurrentView('profile')}
              className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#FF4D7A] p-[1.5px] cursor-pointer"
            >
              <div className="w-full h-full rounded-[7px] bg-[#111827] flex items-center justify-center text-xs font-bold text-white uppercase.">
                {currentUser?.name ? currentUser.name.charAt(0) : 'P'}
              </div>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#FF4D7A] bg-[#070B14]/90 z-50">
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#FF4D7A] animate-spin mb-4"></div>
                <p className="text-xs text-[#B3B3B3] font-medium tracking-widest uppercase">Connecting to Supabase...</p>
              </div>
            ) : null}

            {/* VIEW 1: Dashboard / Home */}
            {currentView === 'home' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#111827]/90 to-[#070B14] border border-white/10 p-6 flex flex-col justify-between shadow-2xl">
                  {/* Decorative ambient background glows */}
                  <div className="absolute -right-24 -bottom-24 w-52 h-52 bg-[#FF4D7A]/15 rounded-full filter blur-3xl pointer-events-none"></div>
                  <div className="absolute left-1/3 top-1/2 w-48 h-48 bg-[#7C3AED]/12 rounded-full filter blur-3xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <span className="text-[10px] font-bold tracking-widest text-[#FF4D7A] uppercase bg-[#FF4D7A]/10 px-3 py-1 rounded-full border border-[#FF4D7A]/20">STUDENT DASHBOARD</span>
                    <h2 className="text-2xl font-black mt-3 text-white leading-tight">
                      Hello, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Student'} <span className="text-xl">👋</span>
                    </h2>
                    <p className="text-xs text-[#B3B3B3] mt-1">Access all premium course syllabus and mock metrics instantly.</p>
                  </div>

                  {/* Dynamic counts derived live from database arrays */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/5 relative z-10 text-center sm:text-left">
                    <div>
                      <div className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1"><i className="fa-solid fa-book-open text-[#FF4D7A]"></i> Modules</div>
                      <div className="text-xl font-extrabold text-white">
                        {materials.length + practiceMaterials.length + pyqBank.length + mindMaps.length}
                      </div>
                    </div>
                    <div className="border-l border-white/5 pl-3">
                      <div className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1"><i className="fa-solid fa-file-signature text-[#7C3AED]"></i> Tests</div>
                      <div className="text-xl font-extrabold text-white">{tests.length}</div>
                    </div>
                    <div className="border-l border-white/5 pl-3">
                      <div className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1"><i className="fa-solid fa-tv text-[#FF4D7A]"></i> Live</div>
                      <div className="text-xl font-extrabold text-[#FF4D7A]">
                        {liveClasses.filter(c => c.status === 'live').length || liveClasses.filter(c => c.status === 'upcoming').length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIEW 1.2: Quick Access Grid */}
                <div>
                  <h3 className="text-sm font-bold tracking-widest text-[#FF4D7A] uppercase mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D7A]"></span> Quick Access Catalog
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { id: 'live', icon: 'fa-tv', title: 'Live Classes', color: 'text-[#FF4D7A]' },
                      { id: 'tests', icon: 'fa-file-pen', title: 'Mock Tests', color: 'text-[#7C3AED]' },
                      { id: 'notes', icon: 'fa-book', title: 'Study Notes', color: 'text-[#3B82F6]' },
                      { id: 'pyq', icon: 'fa-bullseye', title: 'PYQ Bank', color: 'text-[#F59E0B]' },
                      { id: 'practice', icon: 'fa-crosshairs', title: 'Practice Sets', color: 'text-[#10B981]' },
                      { id: 'formula', icon: 'fa-file-lines', title: 'Formulas', color: 'text-[#EC4899]' },
                      { id: 'mindmaps', icon: 'fa-network-wired', title: 'Mind Maps', color: 'text-[#8B5CF6]' },
                      { id: 'timeline', icon: 'fa-calendar-days', title: 'Timeline', color: 'text-[#14B8A6]' },
                    ].map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (['live', 'tests', 'notes', 'pyq', 'practice', 'formula', 'mindmaps', 'timeline'].includes(item.id)) {
                            setCurrentView(item.id as any);
                          }
                        }}
                        className="glass-card rounded-[20px] p-3 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/5 hover:border-[#FF4D7A]/30 shadow-md group"
                      >
                        <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ${item.color} text-lg mb-2 shadow-inner group-hover:glow-pulse`}>
                          <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#B3B3B3] whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIEW 1.3: Recently Added Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold tracking-widest text-[#FF4D7A] uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D7A]"></span> Recently Added Modules
                    </h3>
                  </div>

                  {materials.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center border border-white/5">
                      <p className="text-xs text-[#B3B3B3]">No documents posted yet. Click seed below or upload.</p>
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
                      {materials.slice(0, 5).map(item => (
                        <div 
                          key={`recent-${item.id}`}
                          onClick={() => handleViewPdf(item)}
                          className="glass-card rounded-[22px] p-4 flex flex-col justify-between shrink-0 w-60 border border-white/5 hover:border-[#FF4D7A]/40 hover:shadow-lg hover:shadow-[#FF4D7A]/10 transition-all cursor-pointer group"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[9px] font-extrabold text-white px-2 py-0.5 roundedbg-gradient bg-indigo-600/50 rounded-md border border-indigo-500/30">
                                {item.subject}
                              </span>
                              <button 
                                onClick={(e) => handleToggleSave(item.id, 'material', e)}
                                className="text-xs text-white/50 hover:text-[#FF4D7A] transition-colors"
                              >
                                <i className={`fa-bookmark ${savedData.some(s => s.material_id === item.id) ? 'fa-solid text-[#FF4D7A]' : 'fa-regular'}`}></i>
                              </button>
                            </div>
                            <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] transition-colors line-clamp-2 leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-[#B3B3B3]">
                            <span><i className="fa-solid fa-file-pdf text-[#FF4D7A] mr-1"></i> {item.file_size_text || 'PDF'}</span>
                            <span className="font-bold flex items-center gap-1 text-[#FF4D7A] group-hover:underline">
                              View <i className="fa-solid fa-arrow-right text-[8px]"></i>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sync notice indicator */}
                <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-[#FF4D7A]/20 bg-[#FF4D7A]/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0ef] animate-ping"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ef]">Supabase Realtime Sync Enabled</span>
                  </div>
                  <button 
                    onClick={fetchData} 
                    className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    Force Reload
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 2: Live Classes Page */}
            {currentView === 'live' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-white">Live Lectures</h2>
                    <p className="text-xs text-[#B3B3B3]">Directly synced Zoom & Google Meet rooms</p>
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {['upcoming', 'live', 'completed'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer ${activeTab === tab ? 'bg-[#FF4D7A] text-white shadow-lg shadow-[#FF4D7A]/30' : 'text-[#B3B3B3] hover:text-white'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Classes listing */}
                {liveClasses.filter(c => activeTab === 'all' || c.status === activeTab).length === 0 ? (
                  renderEmptyState('Live Classes', 'fa-video')
                ) : (
                  <div className="space-y-4">
                    {liveClasses.filter(c => activeTab === 'all' || c.status === activeTab).map(classObj => (
                      <div 
                        key={`class-${classObj.id}`} 
                        className="glass-card rounded-[22px] p-5 border border-white/5 relative overflow-hidden group hover:border-[#FF4D7A]/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md text-white border ${classObj.subject === 'Physics' ? 'bg-[#3B82F6]/20 border-[#3B82F6]/30' : classObj.subject === 'Chemistry' ? 'bg-[#EC4899]/20 border-[#EC4899]/30' : classObj.subject === 'Mathematics' ? 'bg-[#7C3AED]/20 border-[#7C3AED]/30' : 'bg-[#10B981]/20 border-[#10B981]/30'}`}>
                            {classObj.subject}
                          </span>
                          
                          {classObj.status === 'live' && (
                            <span className="text-[9px] font-black bg-red-600 px-2 py-0.5 rounded-md animate-pulse uppercase tracking-wider">
                              LIVE NOW
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-white mb-2 group-hover:text-[#FF4D7A] transition-colors">
                          {classObj.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[11px] text-[#B3B3B3] mb-4">
                          <div><i className="fa-regular fa-calendar-days text-[#FF4D7A] mr-1.5 w-4 text-center"></i>{classObj.class_date}</div>
                          <div><i className="fa-regular fa-clock text-[#7C3AED] mr-1.5 w-4 text-center"></i>{classObj.class_time}</div>
                          <div className="col-span-2"><i className="fa-solid fa-user-tie text-[#3B82F6] mr-1.5 w-4 text-center"></i>Taught by <span className="text-white font-semibold">{classObj.teacher_name}</span></div>
                        </div>

                        {/* Join meeting details block */}
                        {classObj.meeting_id && (
                          <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-4 font-mono text-[10px] text-[#B3B3B3] flex justify-between items-center">
                            <div>
                              Meeting ID: <span className="text-white font-semibold">{classObj.meeting_id}</span><br/>
                              Passcode: <span className="text-white font-semibold">{classObj.meeting_passcode || 'None'}</span>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`ID: ${classObj.meeting_id} Pass: ${classObj.meeting_passcode}`);
                                showToast("Copied Meeting Details!");
                              }}
                              className="text-[9px] text-[#FF4D7A] hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <a 
                            href={classObj.meeting_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] hover:opacity-90 active:scale-95 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D7A]/20 transition-all cursor-pointer"
                          >
                            <i className="fa-solid fa-right-to-bracket"></i> Launch Zoom Room
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 3: Tests Page */}
            {currentView === 'tests' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                {!currentActiveTest ? (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-white">Mock Exams & Tests</h2>
                      <p className="text-xs text-[#B3B3B3]">Custom test builder powered by database query metrics</p>
                    </div>

                    {tests.length === 0 ? (
                      renderEmptyState('Tests Available', 'fa-file-pen')
                    ) : (
                      <div className="space-y-4">
                        {tests.map(testObj => (
                          <div 
                            key={`test-${testObj.id}`} 
                            className="glass-card rounded-[22px] p-5 border border-white/5 hover:border-[#FF4D7A]/30 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[9px] font-extrabold bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-white px-2.5 py-1 rounded-md">
                                {testObj.subject}
                              </span>
                              <span className="text-xs text-[#B3B3B3] font-bold">
                                {testObj.duration_mins} mins
                              </span>
                            </div>

                            <h3 className="text-sm font-black text-white mb-3 group-hover:text-[#FF4D7A] transition-colors">
                              {testObj.title}
                            </h3>

                            <div className="flex gap-6 text-[11px] text-[#B3B3B3] mb-4">
                              <span><i className="fa-solid fa-circle-question text-[#FF4D7A] mr-1.5"></i>{testObj.total_questions} Questions</span>
                              <span><i className="fa-solid fa-star text-[#F59E0B] mr-1.5"></i>{testObj.total_marks} Marks</span>
                            </div>

                            <button 
                              onClick={() => handleStartTest(testObj)}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white font-bold text-xs hover:opacity-95 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                              <i className="fa-solid fa-circle-play"></i> Start Interactive Mock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Active Interactive Test Taking Interface
                  <div className="space-y-6 fade-in pb-16">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <div>
                        <span className="text-[10px] font-bold text-[#FF4D7A] uppercase">Active Examination</span>
                        <h2 className="text-lg font-black text-white leading-tight">{currentActiveTest.title}</h2>
                      </div>
                      <button 
                        onClick={handleCloseTest}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-[#B3B3B3] hover:text-white hover:bg-white/10"
                      >
                        Exit Exam
                      </button>
                    </div>

                    {testQuestions.length === 0 ? (
                      <div className="glass-card rounded-2xl p-8 text-center border border-white/5">
                        <i className="fa-solid fa-circle-exclamation text-2xl text-[#FF4D7A] mb-3"></i>
                        <h4 className="text-sm font-bold text-white mb-2">No Questions Seeded</h4>
                        <p className="text-xs text-[#B3B3B3] mb-4">Please upload questions in the Admin panel for this test.</p>
                      </div>
                    ) : !testSubmitted ? (
                      <div className="space-y-6">
                        {testQuestions.map((q, qIndex) => (
                          <div key={`q-${q.id}`} className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                            <span className="text-[10px] font-bold text-[#7C3AED] uppercase">Question {qIndex + 1} of {testQuestions.length}</span>
                            <p className="text-sm font-bold text-white">{q.question_text}</p>
                            
                            <div className="grid grid-cols-1 gap-2">
                              {['A', 'B', 'C', 'D'].map(optKey => {
                                const optionText = (q as any)[`option_${optKey.toLowerCase()}`];
                                const isSelected = userAnswers[q.id] === optKey;
                                return (
                                  <button
                                    key={optKey}
                                    onClick={() => handleSelectOption(q.id, optKey)}
                                    className={`text-left text-xs p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-[#FF4D7A] bg-[#FF4D7A]/10 text-white font-bold' : 'border-white/5 bg-white/5 hover:border-white/10 text-[#B3B3B3] hover:text-white'}`}
                                  >
                                    <span className="font-extrabold inline-block w-6 text-[#FF4D7A]">{optKey}.</span> {optionText}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={handleSubmitTest}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white font-extrabold text-sm shadow-xl hover:shadow-[#FF4D7A]/20 transition-all cursor-pointer"
                        >
                          Submit and Calculate Score
                        </button>
                      </div>
                    ) : (
                      // Test Score/Results Screen (Interactive Metrics)
                      <div className="glass-card rounded-3xl p-8 text-center border border-[#FF4D7A]/30 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#FF4D7A] flex items-center justify-center text-3xl font-black mx-auto shadow-lg shadow-[#FF4D7A]/20">
                          {testScore.percent}%
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Examination Completed</h3>
                          <p className="text-xs text-[#B3B3B3]">Your instant evaluation results from real database correct keys:</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-[10px] text-[#B3B3B3] block mb-1">Correct Answers</span>
                            <span className="text-base font-bold text-[#10B981]">{testScore.correct} / {testScore.total}</span>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-[10px] text-[#B3B3B3] block mb-1">Passing Status</span>
                            <span className={`text-base font-bold ${testScore.percent >= 40 ? 'text-[#10B981]' : 'text-[#FF4D7A]'}`}>
                              {testScore.percent >= 40 ? 'PASSED' : 'RETRY'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleCloseTest}
                          className="px-6 py-3 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition-all text-center cursor-pointer"
                        >
                          Return to Exams List
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 4: Notes Page */}
            {currentView === 'notes' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Class Study Notes</h2>
                  <p className="text-xs text-[#B3B3B3]">Official syllabus PDF scripts from instructors</p>
                </div>

                {/* Filter & Search Controls */}
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/50">
                      <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search PDF topics..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full text-xs p-3 pl-10 rounded-xl bg-white/5 border border-white/5 text-white placeholder-white/30 focus:border-[#FF4D7A] outline-none transition-all"
                    />
                  </div>

                  {/* Subject selector filters */}
                  <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2">
                    {subjectsList.map(subj => (
                      <button
                        key={subj}
                        onClick={() => setFilterSubject(subj)}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer whitespace-nowrap ${filterSubject === subj ? 'border-[#FF4D7A] bg-[#FF4D7A]/10 text-white' : 'border-white/5 hover:border-white/10 text-[#B3B3B3]'}`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing */}
                {materials.filter(m => m.category === 'notes' && (filterSubject === 'All' || m.subject === filterSubject) && (m.title.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
                  renderEmptyState('Notes uploaded', 'fa-book')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {materials
                      .filter(m => m.category === 'notes' && (filterSubject === 'All' || m.subject === filterSubject) && (m.title.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(item => (
                        <div 
                          key={`mat-${item.id}`}
                          onClick={() => handleViewPdf(item)}
                          className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-[#FF4D7A]/20 transition-all cursor-pointer group"
                        >
                          <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-[#FF4D7A] text-lg shrink-0 shadow-inner">
                            <i className="fa-solid fa-file-pdf"></i>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7C3AED]">{item.subject}</span>
                            <h4 className="text-xs font-black text-white truncate group-hover:text-[#FF4D7A] transition-colors leading-normal">
                              {item.title}
                            </h4>
                            <p className="text-[9px] text-[#B3B3B3] mt-0.5">{item.file_size_text || '2.4 MB'}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => handleToggleSave(item.id, 'material', e)}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#FF4D7A]/20 text-[#B3B3B3] hover:text-[#FF4D7A] flex items-center justify-center transition-all cursor-pointer"
                            >
                              <i className={`fa-bookmark ${savedData.some(s => s.material_id === item.id) ? 'fa-solid text-[#FF4D7A]' : 'fa-regular'}`}></i>
                            </button>
                            <span className="text-[10px] text-[#FF4D7A] font-bold uppercase hover:underline">View</span>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 5: PYQ Bank Page */}
            {currentView === 'pyq' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Previous Years Papers</h2>
                  <p className="text-xs text-[#B3B3B3]">MHT CET collection with complete exam layouts</p>
                </div>

                {pyqBank.length === 0 ? (
                  renderEmptyState('PYQ Bank Papers', 'fa-bullseye')
                ) : (
                  <div className="space-y-4">
                    {subjectsList.filter(s => s !== 'All').map(subjectName => {
                      const subjectPyqs = pyqBank.filter(p => p.subject === subjectName);
                      if (subjectPyqs.length === 0) return null;
                      return (
                        <div key={subjectName} className="space-y-3">
                          <h3 className="text-xs font-bold text-[#FF4D7A] uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 rounded-full bg-[#FF4D7A]"></span> {subjectName} PYQs
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subjectPyqs.map(paper => (
                              <div 
                                key={`pyq-${paper.id}`}
                                onClick={() => handleViewPdf(paper)}
                                className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer group flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#F59E0B]"><i className="fa-solid fa-graduation-cap"></i></div>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-white group-hover:text-[#FF4D7A] transition-colors">{paper.title}</h4>
                                    <span className="text-[9px] font-bold text-[#B3B3B3] uppercase">Paper Year: {paper.year}</span>
                                  </div>
                                </div>
                                <i className="fa-solid fa-eye text-xs text-[#FF4D7A]"></i>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 6: Practice Page */}
            {currentView === 'practice' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Daily Practice Sheets</h2>
                  <p className="text-xs text-[#B3B3B3]">Strengthen your fundamentals with targeted exercises</p>
                </div>

                {practiceMaterials.length === 0 ? (
                  renderEmptyState('Practice Materials', 'fa-crosshairs')
                ) : (
                  <div className="space-y-4">
                    {practiceMaterials.map(item => (
                      <div 
                        key={`practice-${item.id}`}
                        onClick={() => item.pdf_url && handleViewPdf({ ...item, title: item.chapter_name })}
                        className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981]"><i className="fa-solid fa-feather-pointed"></i></div>
                          <div>
                            <span className="text-[9px] text-[#10B981] font-bold uppercase">{item.subject}</span>
                            <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] transition-colors">{item.chapter_name}</h4>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-md text-white border border-white/5">{item.questions_count} problems</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 7: Formula Sheets Page */}
            {currentView === 'formula' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Formula Quick Sheets</h2>
                  <p className="text-xs text-[#B3B3B3]">Revision-ready constants and mathematical indices</p>
                </div>

                {formulaSheets.length === 0 ? (
                  renderEmptyState('Formula Sheets', 'fa-file-lines')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {formulaSheets.map(sheet => (
                      <div 
                        key={`formula-${sheet.id}`}
                        onClick={() => handleViewPdf(sheet)}
                        className="glass-card rounded-2xl p-4 border border-white/5 hover:border-[#FF4D7A]/30 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#EC4899]/10 rounded-xl flex items-center justify-center text-[#EC4899]"><i className="fa-solid fa-square-root-variable"></i></div>
                          <div>
                            <span className="text-[9px] text-[#EC4899] font-bold uppercase">{sheet.subject}</span>
                            <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] transition-colors">{sheet.title}</h4>
                          </div>
                        </div>
                        <i className="fa-solid fa-angle-right text-xs text-[#FF4D7A]"></i>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 8: Mind Maps Page */}
            {currentView === 'mindmaps' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Visual Mind Maps</h2>
                  <p className="text-xs text-[#B3B3B3]">Quick conceptual flows for high-speed retention</p>
                </div>

                {mindMaps.length === 0 ? (
                  renderEmptyState('Mind Maps', 'fa-network-wired')
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mindMaps.map(map => (
                      <div 
                        key={`mindmap-${map.id}`}
                        onClick={() => handleViewPdf({ ...map, pdf_url: map.image_url })}
                        className="glass-card rounded-[22px] overflow-hidden border border-white/5 hover:border-[#FF4D7A]/30 transition-all cursor-pointer group"
                      >
                        <div className="h-28 bg-[#111827] relative flex items-center justify-center">
                          <img 
                            src={map.image_url} 
                            alt={map.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all"
                            onError={(e) => {
                              // Fallback graphics
                              (e.target as any).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] to-transparent"></div>
                          <i className="fa-solid fa-diagram-project text-3xl text-white/20 absolute"></i>
                        </div>
                        <div className="p-4">
                          <span className="text-[9px] text-[#7C3AED] font-bold uppercase">{map.subject}</span>
                          <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] transition-colors mt-0.5">{map.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 9: Timeline Planning Page */}
            {currentView === 'timeline' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Academic Timeline</h2>
                  <p className="text-xs text-[#B3B3B3]">Schedules, tests, meeting hours & milestones</p>
                </div>

                {timelineEvents.length === 0 ? (
                  renderEmptyState('Academic Timelines', 'fa-calendar-days')
                ) : (
                  <div className="space-y-6">
                    {/* Compact Interactive Calendar layout visual placeholder */}
                    <div className="glass-card rounded-[22px] p-5 border border-white/5 bg-[#111827]/40 space-y-4">
                      <div className="flex justify-between items-center text-xs font-extrabold text-[#B3B3B3] uppercase tracking-wider">
                        <span>June 2026</span>
                        <div className="flex gap-1">
                          <button className="w-6 h-6 rounded bg-white/5 flex items-center justify-center"><i className="fa-solid fa-angle-left text-[9px]"></i></button>
                          <button className="w-6 h-6 rounded bg-white/5 flex items-center justify-center"><i className="fa-solid fa-angle-right text-[9px]"></i></button>
                        </div>
                      </div>
                      
                      {/* Grid design mimicking reference */}
                      <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-[#B3B3B3] font-bold">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => <div key={`${d}-${index}`} className="py-1 text-[#FF4D7A]">{d}</div>)}
                        {Array.from({ length: 30 }).map((_, i) => {
                          const dateNum = i + 1;
                          const isActive = dateNum === 15;
                          const hasEvent = [20, 25, 26].includes(dateNum);
                          return (
                            <div 
                              key={i} 
                              className={`py-2 rounded-lg relative ${isActive ? 'bg-[#FF4D7A] text-white font-extrabold shadow-md shadow-[#FF4D7A]/20' : ''}`}
                            >
                              {dateNum}
                              {hasEvent && !isActive && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7C3AED]"></span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline List of Events */}
                    <div className="space-y-4 relative pl-4 border-l border-white/5">
                      {timelineEvents.map(event => (
                        <div key={`event-${event.id}`} className="relative">
                          {/* Left bullet point */}
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#FF4D7A] border border-[#070B14] glow-pulse"></span>
                          
                          <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="text-[#B3B3B3]">{event.event_date} {event.event_time ? `• ${event.event_time}` : ''}</span>
                              <span className={`uppercase tracking-widest px-2 py-0.5 rounded-md text-white ${event.type === 'test' ? 'bg-[#FF4D7A]/50' : event.type === 'class' ? 'bg-[#7C3AED]/50' : 'bg-[#10B981]/50'}`}>
                                {event.type}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white">{event.title}</h4>
                            {event.subject && <p className="text-[10px] text-[#B3B3B3]">Subject Tag: {event.subject}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 10: Saved Materials Page */}
            {currentView === 'saved' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Saved Library</h2>
                  <p className="text-xs text-[#B3B3B3]">Your bookmarked folders, papers & notes</p>
                </div>

                {savedData.length === 0 ? (
                  <div className="glass-card rounded-3xl p-8 text-center border border-white/5 max-w-sm mx-auto my-12">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl text-white/30 mx-auto mb-4">
                      <i className="fa-solid fa-bookmark"></i>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">No Saved Items</h3>
                    <p className="text-xs text-[#B3B3B3] mb-4">Bookmark important files to access them offline or quickly in this folder.</p>
                    <button 
                      onClick={() => setCurrentView('notes')} 
                      className="px-4 py-2 rounded-xl bg-[#FF4D7A] text-white text-xs font-bold"
                    >
                      Browse Study Notes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materials.filter(m => savedData.some(s => s.material_id === m.id)).map(item => (
                      <div 
                        key={`saved-mat-${item.id}`}
                        onClick={() => handleViewPdf(item)}
                        className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#FF4D7A]"><i className="fa-solid fa-file-pdf"></i></div>
                          <div>
                            <span className="text-[9px] text-[#7C3AED] font-bold uppercase">{item.subject}</span>
                            <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] transition-colors">{item.title}</h4>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleToggleSave(item.id, 'material', e)}
                          className="w-8 h-8 rounded-lg bg-[#FF4D7A]/10 text-[#FF4D7A] flex items-center justify-center hover:bg-[#FF4D7A]/20 transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-bookmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 11: Notifications Page */}
            {currentView === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Notifications</h2>
                  <p className="text-xs text-[#B3B3B3]">Academic updates and material releases</p>
                </div>

                {notifications.length === 0 ? (
                  <div className="glass-card rounded-3xl p-8 text-center border border-white/5 max-w-sm mx-auto my-12">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-lg text-white/30 mx-auto mb-4">
                      <i className="fa-solid fa-bell-slash"></i>
                    </div>
                    <p className="text-xs text-[#B3B3B3]">Everything is clear! No notifications scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(alert => (
                      <div key={`alert-${alert.id}`} className="glass-card rounded-2xl p-4 border border-white/5 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${alert.type === 'class' ? 'bg-[#7C3AED]/20 text-[#7C3AED]' : alert.type === 'test' ? 'bg-[#FF4D7A]/20 text-[#FF4D7A]' : 'bg-[#3B82F6]/20 text-[#3B82F6]'}`}>
                            {alert.type}
                          </span>
                          <span className="text-[8px] text-[#B3B3B3]">{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Today'}</span>
                        </div>
                        <h4 className="text-xs font-black text-white mb-1">{alert.title}</h4>
                        <p className="text-xs text-[#B3B3B3] leading-relaxed">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 12: User Profile Page */}
            {currentView === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Student Profile</h2>
                  <p className="text-xs text-[#B3B3B3]">Manage metrics and active subscription</p>
                </div>

                {/* Profile card with customizable details */}
                <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden align-middle">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D7A]/10 rounded-full filter blur-xl pointer-events-none"></div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-[#7C3AED] to-[#FF4D7A] rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
                      {currentUser?.name ? currentUser.name.charAt(0) : 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{currentUser?.name || 'Prajyot Gond'}</h3>
                      <span className="text-[10px] bg-gradient-to-r from-[#FF4D7A]/20 to-[#7C3AED]/20 text-white border border-[#FF4D7A]/30 px-3 py-1 rounded-md mt-1.5 inline-block font-extrabold uppercase tracking-wide">
                        {currentUser?.batch || 'MHT CET Class 12 Science'}
                      </span>
                    </div>
                  </div>

                  {/* Complete student info */}
                  <div className="mt-6 pt-5 border-t border-white/5 space-y-3.5 text-xs text-[#B3B3B3]">
                    <div className="flex justify-between">
                      <span>Registered Email:</span>
                      <span className="text-white font-semibold">{currentUser?.email || 'student@example.com'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile Number:</span>
                      <span className="text-white font-semibold">{currentUser?.phone || '+91 91572 82035'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Course Duration:</span>
                      <span className="text-white font-semibold">Dec 2025 - Jun 2026</span>
                    </div>
                  </div>
                </div>

                {/* Statistics cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-[22px] p-4 text-center border border-white/5">
                    <span className="text-[10px] text-[#B3B3B3] block uppercase tracking-wider mb-1">Saved Folders</span>
                    <span className="text-2xl font-black text-[#FF4D7A]">{savedData.length}</span>
                  </div>
                  <div className="glass-card rounded-[22px] p-4 text-center border border-white/5">
                    <span className="text-[10px] text-[#B3B3B3] block uppercase tracking-wider mb-1">Acclamations</span>
                    <span className="text-2xl font-black text-[#7C3AED]">{notifications.length} Alerts</span>
                  </div>
                </div>

                {/* Developer Switch button */}
                <div className="p-4 glass-card rounded-2xl border border-dashed border-[#FF4D7A]/30 text-center space-y-3">
                  <p className="text-xs text-[#B3B3B3]">Switch system access instantly to edit curriculum or seed live directories:</p>
                  <button 
                    onClick={() => navigate('/admin')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Launch Instructor Panel <i className="fa-solid fa-arrow-right-to-bracket ml-2"></i>
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 13: Search Page */}
            {currentView === 'search' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto hide-scrollbar pb-24 px-5 pt-4 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-white">Universal Search</h2>
                  <p className="text-xs text-[#B3B3B3]">Queries notes, lectures, and mock test tables live</p>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/50">
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Type subject keywords, e.g. Physics, Test, Formulas..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs p-3.5 pl-10 rounded-xl bg-white/5 border border-[#FF4D7A]/40 text-white placeholder-white/30 focus:border-[#FF4D7A] outline-none"
                    autoFocus
                  />
                </div>

                {/* Result count */}
                <div className="flex justify-between items-center text-xs text-[#B3B3B3]">
                  <span>Search Results:</span>
                  <span className="font-bold text-[#FF4D7A]">{getFilteredItems().length} records found</span>
                </div>

                {getFilteredItems().length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#B3B3B3] glass-card rounded-2xl border border-white/5">
                    {searchQuery ? 'No matched records found. Try typing another keyword.' : 'Begin typing above to query real-time database.'}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {getFilteredItems().map((item: any) => (
                      <div 
                        key={`${item.route || 'doc'}-${item.id}`}
                        onClick={() => {
                          if (item.pdf_url) handleViewPdf(item);
                          else if (item.duration_mins) handleStartTest(item);
                        }}
                        className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-[9px] font-bold text-[#FF4D7A]/80 uppercase tracking-widest">{item.subject} • {item.typeLabel}</span>
                          <h4 className="text-xs font-black text-white group-hover:text-[#FF4D7A] mt-0.5">{item.title || item.chapter_name}</h4>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-[#B3B3B3]"></i>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Floating Toast Alert */}
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#111827] border border-white/10 shadow-2xl text-xs font-extrabold text-white flex items-center gap-2 transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <i className={`fa-solid ${toast.isError ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-[#FF4D7A]'}`}></i>
          <span>{toast.msg}</span>
        </div>

        {/* Bottom Drawer Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#070B14]/90 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-40 pb-1 max-w-5xl mx-auto px-4 shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setCurrentView('home')} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#FF4D7A]' : 'text-[#B3B3B3] hover:text-white'}`}
          >
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">Home</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('live')} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors cursor-pointer ${currentView === 'live' ? 'text-[#FF4D7A]' : 'text-[#B3B3B3] hover:text-white'}`}
          >
            <i className="fa-solid fa-video text-lg"></i>
            <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">Live class</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('tests')} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors cursor-pointer ${currentView === 'tests' ? 'text-[#FF4D7A]' : 'text-[#B3B3B3] hover:text-white'}`}
          >
            <i className="fa-solid fa-file-signature text-lg"></i>
            <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">Tests</span>
          </button>

          <button 
            onClick={() => setCurrentView('notes')} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors cursor-pointer ${currentView === 'notes' ? 'text-[#FF4D7A]' : 'text-[#B3B3B3] hover:text-white'}`}
          >
            <i className="fa-solid fa-book-bookmark text-lg"></i>
            <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">Notes</span>
          </button>

          <button 
            onClick={() => setCurrentView('profile')} 
            className={`flex flex-col items-center gap-1 w-14 transition-colors cursor-pointer ${currentView === 'profile' ? 'text-[#FF4D7A]' : 'text-[#B3B3B3] hover:text-white'}`}
          >
            <i className="fa-solid fa-circle-user text-lg"></i>
            <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">Profile</span>
          </button>
        </nav>

        {/* Sidebar Navigation Menu Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Blur backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 cursor-pointer"
              />
              
              {/* Sidebar Menu Panel content */}
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute inset-y-0 left-0 w-64 bg-[#070B14] border-r border-white/5 z-50 flex flex-col p-6 shadow-2xl text-left"
              >
                <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#FF4D7A] flex items-center justify-center font-bold">E</div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">EduFlow Pro</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-[#B3B3B3] hover:text-white"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto hide-scrollbar text-xs font-extrabold">
                  {[
                    { view: 'home', icon: 'fa-house', label: 'Dashboard/Home' },
                    { view: 'live', icon: 'fa-video', label: 'Live Lectures' },
                    { view: 'tests', icon: 'fa-file-signature', label: 'Examination Center' },
                    { view: 'notes', icon: 'fa-bookmark', label: 'Class Syllabus notes' },
                    { view: 'pyq', icon: 'fa-history', label: 'PYQ Exam Papers' },
                    { view: 'practice', icon: 'fa-crosshairs', label: 'Practice DPPs' },
                    { view: 'formula', icon: 'fa-calculator', label: 'Formula Indices' },
                    { view: 'mindmaps', icon: 'fa-network-wired', label: 'Conceptual Mindmaps' },
                    { view: 'timeline', icon: 'fa-calendar', label: 'Academic Calendar' },
                    { view: 'saved', icon: 'fa-save', label: 'Saved Library' },
                    { view: 'profile', icon: 'fa-circle-user', label: 'Academic Profile' },
                  ].map(sec => (
                    <button
                      key={sec.view}
                      onClick={() => {
                        setCurrentView(sec.view as any);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3.5 transition-all text-xs cursor-pointer ${currentView === sec.view ? 'bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white shadow-md' : 'text-[#B3B3B3] hover:bg-white/5 hover:text-white'}`}
                    >
                      <i className={`fa-solid ${sec.icon} w-4 text-center`}></i>
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </div>

                {/* Switch to Admin quick toggle inside sidebar */}
                <div className="mt-auto pt-6 border-t border-white/5">
                  <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-[#111827] to-[#070B14] space-y-3">
                    <p className="text-[9px] font-bold text-[#FF4D7A] tracking-wider uppercase">INSTRUCTOR CONSOLE</p>
                    <p className="text-[11px] text-[#B3B3B3] leading-relaxed">Admin access to verify uploads, set up tests and review stats.</p>
                    <button 
                      onClick={() => navigate('/admin')}
                      className="w-full py-2 bg-[#FF4D7A] hover:bg-[#e03d67] rounded-lg text-[10px] uppercase font-black tracking-widest text-center shadow transition-all cursor-pointer"
                    >
                      GO TO PANEL
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MODAL / SCREEN OVERLAY: Material Viewer (Full Screen Class) */}
        <AnimatePresence>
          {selectedPdf && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#070B14] z-50 flex flex-col"
            >
              {/* Toolbar Header of document viewer */}
              <div className="h-14 bg-[#111827] border-b border-white/5 px-4 flex justify-between items-center">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <span className="text-xl text-[#FF4D7A]"><i className="fa-solid fa-file-pdf"></i></span>
                  <h3 className="text-xs font-black text-white truncate">{selectedPdf.title || selectedPdf.topic || 'Document Reader'}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={selectedPdf.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-white/5 text-xs text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    title="Open Document in New Tab"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPdf.pdf_url || '');
                      showToast("Document link copied!");
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 text-xs text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    title="Copy Link Share URL"
                  >
                    <i className="fa-solid fa-share-nodes"></i>
                  </button>
                  <button 
                    onClick={() => setSelectedPdf(null)}
                    className="w-8 h-8 rounded-lg bg-[#FF4D7A]/10 text-[#FF4D7A] flex items-center justify-center hover:bg-[#FF4D7A]/20 active:scale-95 transition-all border border-[#FF4D7A]/20 cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>
              </div>

              {/* View container */}
              <div className="flex-1 bg-white/5 relative">
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf.pdf_url)}&embedded=true`}
                  className="w-full h-full border-none z-10 relative bg-white"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
