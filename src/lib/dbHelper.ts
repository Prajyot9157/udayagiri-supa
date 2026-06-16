import { supabase } from './supabase';
import { 
  UserProfile, Subject, Material, Video, Test, Question, 
  LiveClass, TimelineEvent, Notification, SavedMaterial, 
  PracticeMaterial, MindMap, FormulaSheet, PyqBank 
} from '../types';

// Safe query execution wrapper
async function safeQuery<T>(queryPromise: any, fallback: T[] = []): Promise<T[]> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn('Database query error (table might not exist yet):', error.message);
      return fallback;
    }
    return data || fallback;
  } catch (err) {
    console.error('Safe query error:', err);
    return fallback;
  }
}

export const db = {
  // 1. Users
  async getUsers(): Promise<UserProfile[]> {
    return safeQuery<UserProfile>(
      supabase.from('users').select('*').order('name')
    );
  },
  
  async createUser(user: Omit<UserProfile, 'id'>) {
    return supabase.from('users').insert(user).select().single();
  },

  // 2. Subjects
  async getSubjects(): Promise<Subject[]> {
    return safeQuery<Subject>(
      supabase.from('subjects').select('*').order('name')
    );
  },
  
  async createSubject(name: string, category: string) {
    return supabase.from('subjects').insert({ name, category }).select();
  },

  // 3. Materials (Notes, Notes category, general documents)
  async getMaterials(): Promise<Material[]> {
    return safeQuery<Material>(
      supabase.from('materials').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createMaterial(material: Omit<Material, 'id' | 'created_at'>) {
    return supabase.from('materials').insert(material).select();
  },
  
  async deleteMaterial(id: string) {
    return supabase.from('materials').delete().eq('id', id);
  },

  // 4. Videos
  async getVideos(): Promise<Video[]> {
    return safeQuery<Video>(
      supabase.from('videos').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createVideo(video: Omit<Video, 'id' | 'created_at'>) {
    return supabase.from('videos').insert(video).select();
  },
  
  async deleteVideo(id: string) {
    return supabase.from('videos').delete().eq('id', id);
  },

  // 5. Tests
  async getTests(): Promise<Test[]> {
    return safeQuery<Test>(
      supabase.from('tests').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createTest(test: Omit<Test, 'id' | 'created_at'>) {
    return supabase.from('tests').insert(test).select();
  },
  
  async deleteTest(id: string) {
    return supabase.from('tests').delete().eq('id', id);
  },

  // 6. Questions
  async getQuestions(testId: string): Promise<Question[]> {
    return safeQuery<Question>(
      supabase.from('questions').select('*').eq('test_id', testId)
    );
  },
  
  async createQuestion(question: Omit<Question, 'id'>) {
    return supabase.from('questions').insert(question).select();
  },

  // 7. Live Classes
  async getLiveClasses(): Promise<LiveClass[]> {
    return safeQuery<LiveClass>(
      supabase.from('live_classes').select('*').order('class_date', { ascending: true })
    );
  },
  
  async createLiveClass(liveClass: Omit<LiveClass, 'id' | 'created_at'>) {
    return supabase.from('live_classes').insert(liveClass).select();
  },
  
  async deleteLiveClass(id: string) {
    return supabase.from('live_classes').delete().eq('id', id);
  },

  // 8. Timeline Events
  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return safeQuery<TimelineEvent>(
      supabase.from('timeline_events').select('*').order('event_date', { ascending: true })
    );
  },
  
  async createTimelineEvent(event: Omit<TimelineEvent, 'id' | 'created_at'>) {
    return supabase.from('timeline_events').insert(event).select();
  },
  
  async deleteTimelineEvent(id: string) {
    return supabase.from('timeline_events').delete().eq('id', id);
  },

  // 9. Notifications
  async getNotifications(): Promise<Notification[]> {
    return safeQuery<Notification>(
      supabase.from('notifications').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    return supabase.from('notifications').insert(notification).select();
  },
  
  async deleteNotification(id: string) {
    return supabase.from('notifications').delete().eq('id', id);
  },

  // 10. Saved Materials
  async getSavedMaterials(userEmail: string): Promise<SavedMaterial[]> {
    return safeQuery<SavedMaterial>(
      supabase.from('saved_materials').select('*').eq('user_email', userEmail)
    );
  },
  
  async saveMaterial(userEmail: string, materialId: string, materialType: string) {
    return supabase.from('saved_materials').insert({
      user_email: userEmail,
      material_id: materialId,
      material_type: materialType
    }).select();
  },
  
  async unsaveMaterial(userEmail: string, materialId: string) {
    return supabase.from('saved_materials').delete().eq('user_email', userEmail).eq('material_id', materialId);
  },

  // 11. Practice Materials
  async getPracticeMaterials(): Promise<PracticeMaterial[]> {
    return safeQuery<PracticeMaterial>(
      supabase.from('practice_materials').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createPracticeMaterial(practice: Omit<PracticeMaterial, 'id' | 'created_at'>) {
    return supabase.from('practice_materials').insert(practice).select();
  },
  
  async deletePracticeMaterial(id: string) {
    return supabase.from('practice_materials').delete().eq('id', id);
  },

  // 12. Mind Maps
  async getMindMaps(): Promise<MindMap[]> {
    return safeQuery<MindMap>(
      supabase.from('mind_maps').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createMindMap(mindMap: Omit<MindMap, 'id' | 'created_at'>) {
    return supabase.from('mind_maps').insert(mindMap).select();
  },
  
  async deleteMindMap(id: string) {
    return supabase.from('mind_maps').delete().eq('id', id);
  },

  // 13. Formula Sheets
  async getFormulaSheets(): Promise<FormulaSheet[]> {
    return safeQuery<FormulaSheet>(
      supabase.from('formula_sheets').select('*').order('created_at', { ascending: false })
    );
  },
  
  async createFormulaSheet(sheet: Omit<FormulaSheet, 'id' | 'created_at'>) {
    return supabase.from('formula_sheets').insert(sheet).select();
  },
  
  async deleteFormulaSheet(id: string) {
    return supabase.from('formula_sheets').delete().eq('id', id);
  },

  // 14. PYQ Bank
  async getPyqBank(): Promise<PyqBank[]> {
    return safeQuery<PyqBank>(
      supabase.from('pyq_bank').select('*').order('year', { ascending: false })
    );
  },
  
  async createPyqBank(pyq: Omit<PyqBank, 'id' | 'created_at'>) {
    return supabase.from('pyq_bank').insert(pyq).select();
  },
  
  async deletePyqBank(id: string) {
    return supabase.from('pyq_bank').delete().eq('id', id);
  },

  // 15. Safe Legacy Fallbacks (study_materials)
  // Just in case existing materials reside there
  async getLegacyStudyMaterials(): Promise<any[]> {
    return safeQuery<any>(
      supabase.from('study_materials').select('*').order('created_at', { ascending: false })
    );
  },

  // Storage Upload Helpers
  async uploadFile(bucketName: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload files
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      // In case bucket is not created, retry or throw
      throw new Error(`Storage upload failed: ${uploadError.message}. Make sure the bucket "${bucketName}" is configured inside Supabase Storage console with Public permissions.`);
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
