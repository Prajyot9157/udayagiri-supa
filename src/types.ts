export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  batch: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  category: string; // e.g., 'notes', 'tests'
  created_at?: string;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  category: string; // 'notes', 'formula', 'mindmaps', etc.
  pdf_url: string;
  file_size_text?: string;
  description?: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  subject: string;
  video_url: string; // YouTube, Cloudinary or direct uploaded video
  duration: string;
  description?: string;
  created_at: string;
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  duration_mins: number;
  total_marks: number;
  total_questions: number;
  created_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string; // 'A', 'B', 'C', 'D'
}

export interface LiveClass {
  id: string;
  title: string;
  subject: string;
  class_date: string;
  class_time: string;
  teacher_name: string;
  meeting_url: string; // Zoom or Google Meet link
  meeting_id?: string;
  meeting_passcode?: string;
  status: 'upcoming' | 'live' | 'completed';
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  type: 'test' | 'class' | 'deadline' | 'assignment';
  subject?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'material' | 'test' | 'class' | 'alert';
  created_at: string;
}

export interface SavedMaterial {
  id: string;
  user_email: string;
  material_id: string;
  material_type: string; // 'material', 'video', 'test'
  created_at: string;
}

export interface PracticeMaterial {
  id: string;
  chapter_name: string;
  subject: string;
  questions_count: number;
  pdf_url?: string;
  created_at: string;
}

export interface MindMap {
  id: string;
  title: string;
  subject: string;
  image_url: string;
  created_at: string;
}

export interface FormulaSheet {
  id: string;
  title: string;
  subject: string;
  pdf_url: string;
  created_at: string;
}

export interface PyqBank {
  id: string;
  title: string;
  subject: string;
  year: number;
  pdf_url: string;
  created_at: string;
}
