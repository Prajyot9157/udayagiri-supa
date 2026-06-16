import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseConfig, rebuildSupabaseClient, clearSupabaseOverrides } from '../lib/supabase';
import { db } from '../lib/dbHelper';
import { useNavigate } from 'react-router-dom';
import { 
  UserProfile, Subject, Material, Video, Test, Question, 
  LiveClass, TimelineEvent, Notification, SavedMaterial, 
  PracticeMaterial, MindMap, FormulaSheet, PyqBank 
} from '../types';

export default function AdminPanel() {
  const navigate = useNavigate();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'questions' | 'analytics' | 'settings'>('dashboard');
  const [toast, setToast] = useState<{ msg: string; show: boolean; isError?: boolean }>({ msg: '', show: false });

  // Custom Supabase override states
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [customUrlInput, setCustomUrlInput] = useState(supabaseConfig.url);
  const [customKeyInput, setCustomKeyInput] = useState(supabaseConfig.key);
  const [diagResults, setDiagResults] = useState<any>(null);
  const [runningDiag, setRunningDiag] = useState(false);

  const runDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await db.getDiagnostics();
      setDiagResults(res);
    } catch (e: any) {
      showToast("Diagnostics error: " + e.message, true);
    } finally {
      setRunningDiag(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      runDiagnostics();
    }
  }, [activeTab]);

  // Upload Center Form States
  const [uploadCategory, setUploadCategory] = useState<'notes' | 'formula' | 'mindmaps' | 'practice' | 'pyq' | 'tests' | 'live' | 'timeline' | 'notifications'>('notes');
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    description: '',
    pdfUrl: '',
    videoUrl: '',
    classDate: new Date().toISOString().split('T')[0],
    classTime: '06:30 PM',
    teacherName: 'Prof. Gond',
    meetingUrl: '',
    meetingId: '',
    meetingPasscode: '',
    durationMins: 60,
    totalMarks: 100,
    totalQuestions: 10,
    year: 2026,
    questionsCount: 20,
    timelineType: 'class' as 'test' | 'class' | 'deadline' | 'assignment',
    notificationType: 'alert' as 'material' | 'test' | 'class' | 'alert'
  });
  
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Question Form Builder
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correct: 'A'
  });

  // Database Live States for Lists & Counts
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
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [
        mats, vids, tsts, lives, events, alerts, practs, mmaps, formulas, pyqs, studentProfiles
      ] = await Promise.all([
        db.getMaterials(),
        db.getVideos(),
        db.getTests(),
        db.getLiveClasses(),
        db.getTimelineEvents(),
        db.getNotifications(),
        db.getPracticeMaterials(),
        db.getMindMaps(),
        db.getFormulaSheets(),
        db.getPyqBank(),
        db.getUsers()
      ]);
      
      setMaterials(mats);
      setVideos(vids);
      setTests(tsts);
      setLiveClasses(lives);
      setTimelineEvents(events);
      setNotifications(alerts);
      setPracticeMaterials(practs);
      setMindMaps(mmaps);
      setFormulaSheets(formulas);
      setPyqBank(pyqs);
      setUsers(studentProfiles);

      if (tsts.length > 0 && !selectedTestId) {
        setSelectedTestId(tsts[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, show: true, isError });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSeedTestData = async () => {
    setUploading(true);
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
      fetchAdminData();
    } catch (e: any) {
      showToast("Setup Error: " + e.message, true);
    } finally {
      setUploading(false);
    }
  };

  // Upload file and submit standard categories to Supabase
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let finalUrl = formData.pdfUrl || formData.videoUrl;

    try {
      // 1. Storage bucket routing matching category types
      if (['notes', 'formula', 'mindmaps', 'practice', 'pyq'].includes(uploadCategory) && attachedFile) {
        if (attachedFile.size > 25 * 1024 * 1024) throw new Error("File exceeds 25MB standard limit.");
        
        let targetBucket = 'pdfs';
        if (uploadCategory === 'notes') targetBucket = 'notes';
        if (uploadCategory === 'formula') targetBucket = 'formula';
        if (uploadCategory === 'mindmaps') targetBucket = 'mindmaps';
        if (uploadCategory === 'pyq') targetBucket = 'pyq';
        if (uploadCategory === 'practice') targetBucket = 'practice';

        // Direct upload physical file
        finalUrl = await db.uploadFile(targetBucket, attachedFile);
      }

      // 2. Insert records to specific table schemas
      if (uploadCategory === 'notes') {
        if (!finalUrl) throw new Error("Please upload a PDF document file or specify a valid URL.");
        await db.createMaterial({
          title: formData.title,
          subject: formData.subject,
          category: 'notes',
          pdf_url: finalUrl,
          file_size_text: attachedFile ? `${(attachedFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB',
          description: formData.description
        });
      } else if (uploadCategory === 'formula') {
        if (!finalUrl) throw new Error("Please upload a Formula sheet document.");
        await db.createFormulaSheet({
          title: formData.title,
          subject: formData.subject,
          pdf_url: finalUrl
        });
      } else if (uploadCategory === 'mindmaps') {
        if (!finalUrl) throw new Error("Please upload a Mind Map image/PDF document.");
        await db.createMindMap({
          title: formData.title,
          subject: formData.subject,
          image_url: finalUrl
        });
      } else if (uploadCategory === 'practice') {
        await db.createPracticeMaterial({
          chapter_name: formData.title,
          subject: formData.subject,
          questions_count: formData.questionsCount,
          pdf_url: finalUrl
        });
      } else if (uploadCategory === 'pyq') {
        if (!finalUrl) throw new Error("Please upload a PYQ paper document file.");
        await db.createPyqBank({
          title: formData.title,
          subject: formData.subject,
          year: formData.year,
          pdf_url: finalUrl
        });
      } else if (uploadCategory === 'tests') {
        await db.createTest({
          title: formData.title,
          subject: formData.subject,
          duration_mins: formData.durationMins,
          total_marks: formData.totalMarks,
          total_questions: formData.totalQuestions
        });
      } else if (uploadCategory === 'live') {
        await db.createLiveClass({
          title: formData.title,
          subject: formData.subject,
          class_date: formData.classDate,
          class_time: formData.classTime,
          teacher_name: formData.teacherName,
          meeting_url: formData.meetingUrl || 'https://zoom.us',
          meeting_id: formData.meetingId,
          meeting_passcode: formData.meetingPasscode,
          status: 'upcoming'
        });
      } else if (uploadCategory === 'timeline') {
        await db.createTimelineEvent({
          title: formData.title,
          event_date: formData.classDate,
          event_time: formData.classTime,
          type: formData.timelineType,
          subject: formData.subject
        });
      } else if (uploadCategory === 'notifications') {
        await db.createNotification({
          title: formData.title,
          message: formData.description,
          type: formData.notificationType
        });
      }

      showToast(`Successfully created ${uploadCategory} resource entry!`);
      setFormData({
        title: '',
        subject: 'Physics',
        description: '',
        pdfUrl: '',
        videoUrl: '',
        classDate: new Date().toISOString().split('T')[0],
        classTime: '06:30 PM',
        teacherName: 'Prof. Gond',
        meetingUrl: '',
        meetingId: '',
        meetingPasscode: '',
        durationMins: 60,
        totalMarks: 100,
        totalQuestions: 10,
        year: 2026,
        questionsCount: 20,
        timelineType: 'class',
        notificationType: 'alert'
      });
      setAttachedFile(null);
      fetchAdminData();
    } catch (err: any) {
      showToast("Create failed: " + err.message, true);
    } finally {
      setUploading(false);
    }
  };

  // Add question to individual Mock exam test in database
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) {
      showToast("Please select/create a test first.", true);
      return;
    }

    try {
      await db.createQuestion({
        test_id: selectedTestId,
        question_text: questionFormData.text,
        option_a: questionFormData.optA,
        option_b: questionFormData.optB,
        option_c: questionFormData.optC,
        option_d: questionFormData.optD,
        correct_option: questionFormData.correct
      });

      showToast("Question added successfully!");
      setQuestionFormData({
        text: '', optA: '', optB: '', optC: '', optD: '', correct: 'A'
      });
      fetchAdminData();
    } catch (err: any) {
      showToast("Failed to save question: " + err.message, true);
    }
  };

  // Unified physically safe delete resource handles
  const handleDeleteItem = async (id: string, tableType: string, filePath?: string) => {
    if (!confirm('Are you sure you want to delete this resource physically from database?')) return;
    try {
      // 1. Delete associated Cloud Storage file if uploaded to active Supabase bucket
      if (filePath && filePath.includes('supabase.co')) {
        const bucketMatch = filePath.match(/\/storage\/v1\/object\/public\/([^\/]+)\//);
        const fileName = filePath.split('/').pop();
        if (bucketMatch && fileName) {
          const bucketName = bucketMatch[1];
          await supabase.storage.from(bucketName).remove([fileName]);
        }
      }

      // 2. Delete DB table entry
      if (tableType === 'notes') await db.deleteMaterial(id);
      else if (tableType === 'formula') await db.deleteFormulaSheet(id);
      else if (tableType === 'mindmaps') await db.deleteMindMap(id);
      else if (tableType === 'practice') await db.deletePracticeMaterial(id);
      else if (tableType === 'pyq') await db.deletePyqBank(id);
      else if (tableType === 'tests') await db.deleteTest(id);
      else if (tableType === 'live') await db.deleteLiveClass(id);
      else if (tableType === 'timeline') await db.deleteTimelineEvent(id);
      else if (tableType === 'notifications') await db.deleteNotification(id);

      showToast("Resource deleted successfully.");
      fetchAdminData();
    } catch (err: any) {
      showToast("Delete action failed: " + err.message, true);
    }
  };

  // Subject allocation counters for analytics display
  const getSubjectAnalytics = () => {
    const counts = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
    [...materials, ...pyqBank, ...practiceMaterials, ...formulaSheets, ...mindMaps, ...liveClasses].forEach(item => {
      const s = item.subject;
      if (s === 'Physics') counts.Physics += 1;
      else if (s === 'Chemistry') counts.Chemistry += 1;
      else if (s === 'Mathematics') counts.Mathematics += 1;
      else if (s === 'Biology') counts.Biology += 1;
    });
    return counts;
  };

  const subjectCounts = getSubjectAnalytics();
  const maxAnalyticalCount = Math.max(...Object.values(subjectCounts), 1);

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-64 bg-[#070B14] border-r border-white/5 p-6 flex flex-col shrink-0 gap-8">
        <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#7C3AED] to-[#FF4D7A] rounded-xl flex items-center justify-center text-white font-extrabold shadow-md">
            E
          </div>
          Instructor Panel
        </h1>

        <div className="space-y-1.5 flex-1 text-xs font-bold">
          {[
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard Control' },
            { id: 'upload', icon: 'fa-cloud-arrow-up', label: 'Course Upload Center' },
            { id: 'questions', icon: 'fa-list-check', label: 'Mock Exam Builder' },
            { id: 'analytics', icon: 'fa-chart-line', label: 'Platform Analytics' },
            { id: 'settings', icon: 'fa-sliders', label: 'Settings & Schema' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left p-3.5 rounded-xl flex items-center gap-3.5 transition-all outline-none cursor-pointer ${activeTab === tab.id ? 'bg-[#FF4D7A] text-white shadow-lg shadow-[#FF4D7A]/25 glow-pulse' : 'text-[#B3B3B3] hover:bg-white/5 hover:text-white'}`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Back to student console */}
        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-white/5 hover:border-white/15 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-graduation-cap"></i> Student App Console
          </button>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 hide-scrollbar bg-dark-bg">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] font-bold text-[#FF4D7A] uppercase tracking-widest bg-[#FF4D7A]/10 px-2.5 py-1 rounded-full border border-[#FF4D7A]/20">Administrator privileges</span>
            <h2 className="text-xl font-extrabold text-white mt-1 capitalize">{activeTab} Section</h2>
          </div>
          <p className="text-xs text-[#B3B3B3] hidden sm:block">Status: <span className="text-[#10B981] font-bold">● Active Server</span></p>
        </div>

        {/* ADMIN TAB 1: Dashboard overview stats */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 fade-in">
            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Study Notes & PDFs', count: materials.filter(m => m.category === 'notes').length, icon: 'fa-file-pdf', color: 'text-[#FF4D7A]' },
                { title: 'Formula Guides', count: formulaSheets.length, icon: 'fa-square-root-variable', color: 'text-[#EC4899]' },
                { title: 'Mindmaps Uploaded', count: mindMaps.length, icon: 'fa-diagram-project', color: 'text-[#8B5CF6]' },
                { title: 'Active Exams', count: tests.length, icon: 'fa-file-signature', color: 'text-[#7C3AED]' },
                { title: 'Scheduled Lectures', count: liveClasses.length, icon: 'fa-video', color: 'text-[#3B82F6]' },
                { title: 'Practice DPPs', count: practiceMaterials.length, icon: 'fa-crosshairs', color: 'text-[#10B981]' },
                { title: 'Global PYQ Papers', count: pyqBank.length, icon: 'fa-graduation-cap', color: 'text-[#F59E0B]' },
                { title: 'Enrolled Accounts', count: users.length, icon: 'fa-user-group', color: 'text-[#14B8A6]' },
              ].map((card, idx) => (
                <div key={idx} className="glass-card rounded-[22px] p-5 border border-white/5 flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start text-[#B3B3B3]">
                    <span className="text-[10px] uppercase font-black tracking-wide truncate w-[80%] leading-tight">{card.title}</span>
                    <i className={`fa-solid ${card.icon} ${card.color} text-xs shrink-0`}></i>
                  </div>
                  <span className="text-2xl font-black text-white">{card.count}</span>
                </div>
              ))}
            </div>

            {/* Quick Upload Action Navigation Alert */}
            <div className="glass-card rounded-[24px] p-6 border border-[#FF4D7A]/20 bg-gradient-to-br from-[#FF4D7A]/5 to-[#7C3AED]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Need to release new study materials or live classrooms?</h3>
                <p className="text-xs text-[#B3B3B3] mt-1">Select the course upload console to quickly update live student databases.</p>
              </div>
              <button 
                onClick={() => setActiveTab('upload')} 
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Launch Course Upload Center
              </button>
            </div>

            {/* Materials audit database lists */}
            <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111827]/40">
                <h3 className="text-xs font-bold text-[#FF4D7A] uppercase tracking-widest"><i className="fa-solid fa-list-check mr-1.5"></i> Live Material Database Inventory</h3>
                <span className="text-[10px] uppercase bg-white/5 px-2.5 py-1 rounded border border-white/5 font-extrabold text-white">{materials.length + tests.length + liveClasses.length} records</span>
              </div>
              
              <div className="divide-y divide-white/5 text-xs text-[#B3B3B3] overflow-x-auto">
                {[...materials].length === 0 ? (
                  <p className="p-8 text-center text-xs text-[#B3B3B3]">Database Inventory is currently empty. Go to the upload center to release files.</p>
                ) : (
                  materials.map(m => (
                    <div key={`admin-mat-${m.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-4">
                      <div className="flex items-center gap-4.5 w-[75%] min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF4D7A] text-sm border border-white/5 shrink-0 shadow-inner">
                          <i className="fa-solid fa-file-pdf"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate leading-tight">{m.title}</p>
                          <p className="text-[10px] text-[#B3B3B3] mt-0.5">{m.subject} • {m.category} • {m.file_size_text || 'PDF'}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteItem(m.id, 'notes', m.pdf_url)}
                        className="w-10 h-10 rounded-xl bg-[#FF4D7A]/10 border border-[#FF4D7A]/20 hover:bg-[#FF4D7A]/20 text-[#FF4D7A] flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Material physically"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TAB 2: Course upload center */}
        {activeTab === 'upload' && (
          <div className="space-y-8 fade-in max-w-2xl mx-auto">
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
              
              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block">Target Category Module Schema</label>
                <select 
                  className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A] outline-none"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                >
                  <option value="notes">Class notes (PDF Study Material)</option>
                  <option value="formula">Formula Revision Sheet (PDF Document)</option>
                  <option value="mindmaps">Conceptual Mind Map (Graphic Map)</option>
                  <option value="practice">Daily Practice Sheets (DPP Practice Sets)</option>
                  <option value="pyq">Previous Year Question Paper (PYQ Bank)</option>
                  <option value="tests">Mock Entrance Exam (Database test build)</option>
                  <option value="live">Zoom or Google Meet Classroom Registration</option>
                  <option value="timeline">Academic Event (Timeline Calendar schedule)</option>
                  <option value="notifications">Administrative Notification Broadcast</option>
                </select>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleCreateResource} className="space-y-5">
                
                {/* Generic title text */}
                <input 
                  required 
                  type="text" 
                  placeholder={uploadCategory === 'practice' ? 'Chapter Name / Topic title' : 'Study Resource Title / Subject Category'}
                  className="w-full text-xs p-3.5 rounded-xl border glass-input focus:border-[#FF4D7A] outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />

                {/* Subject selection for study materials */}
                {['notes', 'formula', 'mindmaps', 'practice', 'pyq', 'tests', 'live', 'timeline'].includes(uploadCategory) && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Academic Subject Area</label>
                      <select 
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A] outline-none"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      >
                        <option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option>
                      </select>
                    </div>

                    {uploadCategory === 'pyq' && (
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Paper Exam Year</label>
                        <input 
                          required 
                          type="number" 
                          min="2010" 
                          max="2030" 
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.year}
                          onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                        />
                      </div>
                    )}

                    {uploadCategory === 'practice' && (
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Total Question Problems</label>
                        <input 
                          required 
                          type="number" 
                          min="5" 
                          max="100" 
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.questionsCount}
                          onChange={e => setFormData({ ...formData, questionsCount: Number(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Hard limits and config specs for Mock Tests */}
                {uploadCategory === 'tests' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase block mb-1">Minutes Duration</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.durationMins}
                        onChange={e => setFormData({ ...formData, durationMins: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase block mb-1">Total Marks</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.totalMarks}
                        onChange={e => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase block mb-1">Que. Count</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.totalQuestions}
                        onChange={e => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {/* Classrooms meeting links setup */}
                {uploadCategory === 'live' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Lecture Date</label>
                        <input 
                          required 
                          type="date" 
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.classDate}
                          onChange={e => setFormData({ ...formData, classDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Lecture Time Hours</label>
                        <input 
                          required 
                          type="text" 
                          placeholder="06:30 PM"
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.classTime}
                          onChange={e => setFormData({ ...formData, classTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1 font-mono text-center sm:text-left">Instructor / Teacher Name</label>
                        <input 
                          required 
                          type="text" 
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.teacherName}
                          onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Primary Launch Meeting link</label>
                        <input 
                          required 
                          type="url" 
                          placeholder="Zoom link or GMeet URL"
                          className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                          value={formData.meetingUrl}
                          onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <input 
                        type="text" 
                        placeholder="Alternative Meeting ID (921 542...)"
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.meetingId}
                        onChange={e => setFormData({ ...formData, meetingId: e.target.value })}
                      />
                      <input 
                        type="text" 
                        placeholder="Alternative Passcode (2026...)"
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.meetingPasscode}
                        onChange={e => setFormData({ ...formData, meetingPasscode: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Timeline calendar config fields */}
                {uploadCategory === 'timeline' && (
                  <div className="grid grid-cols-3 gap-3 text-left">
                    <div className="col-span-1">
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase mb-1 block">Scheduled Date</label>
                      <input 
                        required 
                        type="date"
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.classDate}
                        onChange={e => setFormData({ ...formData, classDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase mb-1 block">Scheduled Time</label>
                      <input 
                        required 
                        type="text"
                        placeholder="04:00 PM"
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.classTime}
                        onChange={e => setFormData({ ...formData, classTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#B3B3B3] uppercase mb-1 block">Schedule type</label>
                      <select 
                        className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                        value={formData.timelineType}
                        onChange={e => setFormData({ ...formData, timelineType: e.target.value as any })}
                      >
                        <option value="class">Classroom hour</option>
                        <option value="test">Scheduled Test</option>
                        <option value="deadline">HW Deadline</option>
                        <option value="assignment">Assignment Paper</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Notifications setup */}
                {uploadCategory === 'notifications' && (
                  <div>
                    <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block mb-1">Broadcast Notification styling Category</label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white focus:border-[#FF4D7A]"
                      value={formData.notificationType}
                      onChange={e => setFormData({ ...formData, notificationType: e.target.value as any })}
                    >
                      <option value="alert">System Alert / Maintenance</option>
                      <option value="material">Study Resource Release</option>
                      <option value="class">Urgent Class hour change</option>
                      <option value="test">Exam updates alert</option>
                    </select>
                  </div>
                )}

                {/* File Attachment Drag and Drop area for PDF study materials */}
                {['notes', 'formula', 'mindmaps', 'practice', 'pyq'].includes(uploadCategory) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block">Submit Physical PDF / Document attachment</label>
                    
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-[#070B14] hover:border-[#FF4D7A]/40 transition-all text-center">
                      <i className="fa-solid fa-cloud-arrow-up text-3xl text-white/20 mb-3 animate-bounce"></i>
                      <input 
                        required={!formData.pdfUrl}
                        type="file" 
                        accept={uploadCategory === 'mindmaps' ? 'image/*,.pdf' : '.pdf'} 
                        className="text-xs text-[#B3B3B3] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FF4D7A]/10 file:text-[#FF4D7A] hover:file:bg-[#FF4D7A]/20 file:cursor-pointer"
                        onChange={e => setAttachedFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-[10px] text-[#B3B3B3] mt-3">{attachedFile ? `Attached: ${attachedFile.name}` : 'Limits: 25MB (.pdf only, mindmaps accept images)'}</p>
                    </div>
                  </div>
                )}

                {/* Alternative attachment url text */}
                {['notes', 'formula', 'mindmaps', 'practice', 'pyq'].includes(uploadCategory) && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30 text-[10px] font-bold">ALT LINK:</div>
                    <input 
                      type="url" 
                      placeholder="Specify alternative PDF/Document online URL if not uploading file..."
                      className="w-full text-xs p-3 pl-20 rounded-xl bg-[#070B14] border border-white/10 text-white/80 focus:border-[#FF4D7A]"
                      value={formData.pdfUrl}
                      onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })}
                    />
                  </div>
                )}

                {/* Comprehensive description */}
                {['notes', 'notifications'].includes(uploadCategory) && (
                  <textarea 
                    placeholder="Short description tags to preview on the dashboard cards..."
                    className="w-full text-xs p-3.5 rounded-xl border glass-input focus:border-[#FF4D7A] outline-none h-20 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                )}

                <button 
                  disabled={uploading} 
                  type="submit" 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white font-extrabold text-xs uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#FF4D7A]/25"
                >
                  {uploading ? 'Processing Direct Upload...' : `Confirm Upload & Create ${uploadCategory}`}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* ADMIN TAB 3: Interactive Question builder */}
        {activeTab === 'questions' && (
          <div className="space-y-8 fade-in max-w-2xl mx-auto">
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
              
              <div className="space-y-1.5 text-left">
                <h3 className="text-sm font-extrabold text-white">Interactive MCQ Exam Question Builder</h3>
                <p className="text-xs text-[#B3B3B3]">Attach questions & solutions to your database mock test templates instantly</p>
              </div>

              {tests.length === 0 ? (
                <div className="p-8 text-center bg-black/40 border border-white/5 rounded-2xl">
                  <p className="text-xs text-[#B3B3B3]">No Mock Exams created yet. Please create a test inside the Upload Center first.</p>
                </div>
              ) : (
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  
                  {/* Test reference lookup */}
                  <div>
                    <label className="text-[10px] font-bold text-[#B3B3B3] uppercase block mb-1">Target Mock Exam Template</label>
                    <select
                      className="w-full text-xs p-3 rounded-xl bg-[#070B14] border border-white/10 text-white"
                      value={selectedTestId}
                      onChange={e => setSelectedTestId(e.target.value)}
                    >
                      {tests.map(t => <option key={`admin-test-opt-${t.id}`} value={t.id}>{t.title} ({t.subject})</option>)}
                    </select>
                  </div>

                  {/* Question Title */}
                  <div>
                    <textarea 
                      required
                      placeholder="MCQ Entrance Question script (e.g. Which of the following equations represents a standing wave...)"
                      className="w-full text-xs p-3.5 rounded-xl border glass-input focus:border-[#FF4D7A] h-20 resize-none"
                      value={questionFormData.text}
                      onChange={e => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                    />
                  </div>

                  {/* MCQ Options A, B, C, D */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold text-[#B3B3B3] uppercase block">Multiple Choice Options</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <input 
                          required 
                          type="text" 
                          placeholder="Option A content" 
                          className="w-full text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-white"
                          value={questionFormData.optA}
                          onChange={e => setQuestionFormData({ ...questionFormData, optA: e.target.value })}
                        />
                      </div>
                      <div>
                        <input 
                          required 
                          type="text" 
                          placeholder="Option B content" 
                          className="w-full text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-white"
                          value={questionFormData.optB}
                          onChange={e => setQuestionFormData({ ...questionFormData, optB: e.target.value })}
                        />
                      </div>
                      <div>
                        <input 
                          required 
                          type="text" 
                          placeholder="Option C content" 
                          className="w-full text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-white"
                          value={questionFormData.optC}
                          onChange={e => setQuestionFormData({ ...questionFormData, optC: e.target.value })}
                        />
                      </div>
                      <div>
                        <input 
                          required 
                          type="text" 
                          placeholder="Option D content" 
                          className="w-full text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-white"
                          value={questionFormData.optD}
                          onChange={e => setQuestionFormData({ ...questionFormData, optD: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Correct Option select toggle */}
                  <div className="flex justify-between items-center bg-[#070B14] p-3 rounded-xl border border-white/5 select-none pt-4">
                    <span className="text-[10px] font-bold text-[#B3B3B3] uppercase">Correct Option Select Indicator</span>
                    
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQuestionFormData({ ...questionFormData, correct: opt })}
                          className={`w-9 h-9 rounded-lg font-black text-xs transition-all cursor-pointer ${questionFormData.correct === opt ? 'bg-[#FF4D7A] text-white shadow shadow-[#FF4D7A]/30' : 'bg-white/5 text-[#B3B3B3] hover:text-white'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    Confirm Question Seeding
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* ADMIN TAB 4: Subject Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Subject statistics */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-[#FF4D7A] uppercase tracking-widest mb-3">Academic Subject Distribution</h3>
                
                <div className="space-y-4">
                  {Object.entries(subjectCounts).map(([subjectName, count]) => {
                    const percentage = Math.round((count / maxAnalyticalCount) * 100);
                    return (
                      <div key={subjectName} className="space-y-1 text-left">
                        <div className="flex justify-between text-xs">
                          <span className="font-extrabold text-[#B3B3B3]">{subjectName}</span>
                          <span className="font-extrabold text-white">{count} material resources</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#FF4D7A] rounded-full"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active classrooms schedules summary */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-[#FF4D7A] uppercase tracking-widest mb-3">Active Lectures & Tests Schedules Summary</h3>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-[#B3B3B3]">Upcoming Live Lectures scheduled:</span>
                    <span className="text-white font-extrabold">{liveClasses.filter(c => c.status === 'upcoming').length} rooms</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-[#B3B3B3]">Currently Broadcasted Live Streams:</span>
                    <span className="text-[#10B981] font-extrabold">{liveClasses.filter(c => c.status === 'live').length} stream</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-[#B3B3B3]">Archived Lectures in Database:</span>
                    <span className="text-white font-extrabold">{liveClasses.filter(c => c.status === 'completed').length} lectures</span>
                  </div>
                  <div className="flex justify-between text-xs py-2">
                    <span className="text-[#B3B3B3]">Available interactive entrance exams:</span>
                    <span className="text-white font-extrabold">{tests.length} mock tests</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ADMIN TAB 5: Settings & Quick manual schema provisions SQL tool */}
        {activeTab === 'settings' && (
          <div className="space-y-8 fade-in max-w-2xl mx-auto text-left">
            {/* Supabase connection manager */}
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <i className="fa-solid fa-cloud text-[#FF4D7A]"></i>
                  Supabase Backend Configuration & Diagnostics
                </h3>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  Adjust, diagnose, and repair your Supabase credentials in real-time. If the default database is offline, connect your own free Supabase database instantly.
                </p>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block">Connection Source</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D7A] shadow-[0_0_8px_#FF4D7A]"></span>
                    <span className="text-xs font-bold text-white">{supabaseConfig.isOverridden ? 'Custom Browser Override (LocalStorage)' : supabaseConfig.source}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider block">Diagnostics Result</span>
                  <div className="flex items-center gap-2">
                    {runningDiag ? (
                      <span className="text-xs font-bold text-[#FF4D7A] animate-pulse">Running checks...</span>
                    ) : diagResults?.connectOk ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Connected & Operational</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs animate-pulse">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>Configuration Needed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Diagnosis Grid */}
              {diagResults && (
                <div className="p-4 rounded-2xl bg-[#070B14]/60 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white">Database Table Checks ({Object.values(diagResults.tables).filter((t: any) => t.ok).length}/{Object.keys(diagResults.tables).length} setup)</span>
                    <button 
                      onClick={runDiagnostics} 
                      disabled={runningDiag}
                      className="text-[10px] text-[#FF4D7A] hover:underline font-bold cursor-pointer"
                    >
                      {runningDiag ? 'Checking...' : 'Re-verify Now'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                    {Object.entries(diagResults.tables).map(([tableName, status]: [string, any]) => (
                      <div key={tableName} className={`p-2 rounded-lg flex items-center justify-between border ${status.ok ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300' : 'bg-red-500/5 border-red-500/10 text-red-300'}`}>
                        <span className="font-mono truncate">{tableName}</span>
                        <span>{status.ok ? `(${status.count})` : '⚠️'}</span>
                      </div>
                    ))}
                  </div>
                  {diagResults.globalErr && (
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-red-300 font-mono break-all leading-normal">
                      <span className="font-bold">Error detail:</span> {diagResults.globalErr}
                    </div>
                  )}
                </div>
              )}

              {/* Credentials Overrider Form */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-key text-[#FF4D7A]"></i> Custom Keys Plug-and-Play
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#B3B3B3] font-bold uppercase tracking-wider">Supabase URL</label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://xxxxxx.supabase.co" 
                      value={customUrlInput}
                      onChange={e => setCustomUrlInput(e.target.value)}
                      className="w-full text-xs bg-[#070B14] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#FF4D7A]/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#B3B3B3] font-bold uppercase tracking-wider">Supabase Anon Key</label>
                    <textarea 
                      placeholder="e.g. eyJhbGciOi..."
                      value={customKeyInput}
                      onChange={e => setCustomKeyInput(e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-[#070B14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF4D7A]/50 font-mono lg:leading-normal"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button 
                    onClick={() => rebuildSupabaseClient(customUrlInput, customKeyInput)}
                    className="px-4 py-2 bg-[#FF4D7A] hover:bg-[#FF4D7A]/90 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                  >
                    Save & Initialize Client
                  </button>
                  {supabaseConfig.isOverridden && (
                    <button 
                      onClick={clearSupabaseOverrides}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                    >
                      Reset to Default URL / Keys
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 my-4"></div>

              <div>
                <h3 className="text-sm font-black text-white">Supabase Schema Initialization SQL Script</h3>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  Copy and run this exact script in your Supabase SQL Editor console to instantly create all the requested tables, foreign relationships, and set up the Row Level Security (RLS) policies and storage buckets.
                </p>
              </div>

              {/* Quick display of SQL Code for copying */}
              <div className="bg-[#070B14] p-4 rounded-xl border border-white/10 font-mono text-[10px] text-white/80 overflow-y-auto max-h-56 leading-relaxed thin-scrollbar">
                {`-- Run in Supabase SQL editor:
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  batch TEXT NOT NULL DEFAULT 'Class 12 Science',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('notes', 'formula', 'mindmaps', 'dpp', 'pyq', 'practice')),
  pdf_url TEXT NOT NULL,
  file_size_text TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '45 mins',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration_mins INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  total_questions INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))
);

CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_date DATE NOT NULL,
  class_time TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  meeting_id TEXT,
  meeting_passcode TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('test', 'class', 'deadline', 'assignment')),
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'alert' CHECK (type IN ('material', 'test', 'class', 'alert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  material_id UUID NOT NULL,
  material_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS practice_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions_count INTEGER NOT NULL DEFAULT 20,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS formula_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS pyq_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
              </div>

              <div className="flex justify-between items-center bg-[#070B14] p-3 rounded-xl border border-white/5 text-xs text-[#B3B3B3]">
                <span>Need to generate dynamic seeds instantly?</span>
                <button 
                  onClick={handleSeedTestData}
                  className="px-4 py-2 bg-[#FF4D7A]/10 border border-[#FF4D7A]/20 hover:bg-[#FF4D7A]/20 text-[#FF4D7A] rounded-xl font-bold transition-all text-[11px]"
                >
                  Confirm Setup & Seed Live Sample Data
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Global Floating Toast Alert */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#111827] border border-white/10 shadow-2xl text-xs font-bold text-white flex items-center gap-2 transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'}`}>
        <i className={`fa-solid ${toast.isError ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-[#FF4D7A]'}`}></i>
        <span>{toast.msg}</span>
      </div>

    </div>
  );
}
