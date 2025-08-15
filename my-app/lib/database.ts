import { createClient } from './supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  task_id: string;
  author_id: string;
  author_name: string;
  created_at?: string;
}

const supabase = createClient();

// Supabase接続テスト用
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase接続エラー:', error);
      return false;
    }
    console.log('Supabase接続成功');
    return true;
  } catch (error) {
    console.error('Supabase接続テスト失敗:', error);
    return false;
  }
};

// ユーザー関連の操作
export const userDatabase = {
  // ユーザー作成
  async createUser(user: Omit<User, 'id'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // すべてのユーザー取得
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // ID指定でユーザー取得
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// タスク関連の操作
export const taskDatabase = {
  // タスク作成
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'comments'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ユーザーのタスク一覧取得
  async getTasksByUserId(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        comments (
          id,
          text,
          author_id,
          author_name,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // タスク更新
  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // タスク削除
  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// コメント関連の操作
export const commentDatabase = {
  // コメント作成
  async createComment(comment: Omit<Comment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // タスクのコメント一覧取得
  async getCommentsByTaskId(taskId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // コメント削除
  async deleteComment(id: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};