'use client'

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { testConnection, userDatabase, taskDatabase, commentDatabase } from '@/lib/database';
import { debugSupabase } from '@/lib/debug';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  comments: Comment[];
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface KanbanData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onShowRegister: () => void;
}

interface RegisterScreenProps {
  onRegister: (user: User) => void;
  onShowLogin: () => void;
}

const DEMO_USERS: User[] = [
  { id: 'user-1', name: '田中太郎', email: 'tanaka@example.com' },
  { id: 'user-2', name: '佐藤花子', email: 'sato@example.com' },
  { id: 'user-3', name: '山田次郎', email: 'yamada@example.com' }
];

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, commentText: string) => void;
}

function TaskCard({ task, index, onToggle, onDelete, onAddComment }: TaskCardProps) {
  const [commentInput, setCommentInput] = useState('');

  const handleAddComment = () => {
    if (commentInput.trim()) {
      onAddComment(task.id, commentInput);
      setCommentInput('');
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddComment();
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
            snapshot.isDragging 
              ? 'rotate-2 scale-105 shadow-lg ring-2 ring-blue-300' 
              : ''
          }`}
        >
          {/* タスクヘッダー */}
          <div className="flex items-start gap-3 mb-3">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
            />
            <span
              className={`flex-1 ${
                task.completed 
                  ? 'text-gray-500 line-through' 
                  : 'text-gray-800'
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="タスクを削除"
            >
              ×
            </button>
          </div>

          {/* コメント表示エリア */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-sm font-medium text-gray-600 mb-2">コメント ({task.comments?.length || 0})</div>
            
            {(task.comments?.length || 0) === 0 ? (
              <div className="text-xs text-gray-400 italic mb-3">コメントはありません</div>
            ) : (
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                {task.comments?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="ml-2">{new Date(comment.createdAt).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="text-sm text-gray-800">{comment.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* コメント入力エリア */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="コメントを追加..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function LoginScreen({ onLogin, onShowRegister }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleLogin = () => {
    const user = DEMO_USERS.find(u => u.id === selectedUser);
    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">カンバンボード Todo</h1>
          <p className="text-gray-600">ログインしてタスクを管理しましょう</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザーを選択
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ユーザーを選択してください</option>
              {DEMO_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ログイン
          </button>

          <div className="text-center">
            <button
              onClick={onShowRegister}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              新規登録はこちら
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onRegister, onShowLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleRegister = () => {
    if (name.trim() && email.trim()) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim()
      };
      onRegister(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
          <p className="text-gray-600">アカウントを作成してください</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="田中太郎"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tanaka@example.com"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={!name.trim() || !email.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            登録
          </button>

          <div className="text-center">
            <button
              onClick={onShowLogin}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ログインはこちら
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [nextId, setNextId] = useState(1);
  const [allUsers, setAllUsers] = useState<User[]>([...DEMO_USERS]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    tasks: {},
    columns: {
      'todo': {
        id: 'todo',
        title: '未完了',
        taskIds: []
      },
      'done': {
        id: 'done',
        title: '完了済み',
        taskIds: []
      }
    },
    columnOrder: ['todo', 'done']
  });

  // Supabase接続テスト & データ読み込み
  useEffect(() => {
    const initializeApp = async () => {
      // デバッグ情報を出力
      debugSupabase();
      
      // Supabase接続テスト
      const connected = await testConnection();
      setIsSupabaseConnected(connected);

      if (connected) {
        try {
          // Supabaseからユーザー一覧を読み込み
          const supabaseUsers = await userDatabase.getUsers();
          if (supabaseUsers && supabaseUsers.length > 0) {
            const combinedUsers = [...DEMO_USERS, ...supabaseUsers];
            // 重複を除去（emailで判定）
            const uniqueUsers = combinedUsers.filter((user, index, array) => 
              array.findIndex(u => u.email === user.email) === index
            );
            setAllUsers(uniqueUsers);
            console.log('Supabaseからユーザーを読み込みました:', uniqueUsers.length, '件');
          }
        } catch (error) {
          console.error('Supabaseからのデータ読み込みエラー:', error);
        }
      }

      // ローカルストレージから状態復元
      const savedUser = localStorage.getItem('currentUser');
      const savedKanbanData = localStorage.getItem('kanbanData');
      const savedNextId = localStorage.getItem('nextId');

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      if (!connected) {
        // Supabase接続失敗時のみローカルストレージからユーザー一覧を復元
        const savedUsers = localStorage.getItem('allUsers');
        if (savedUsers) {
          setAllUsers(JSON.parse(savedUsers));
        }
      }
      if (savedKanbanData) {
        setKanbanData(JSON.parse(savedKanbanData));
      }
      if (savedNextId) {
        setNextId(parseInt(savedNextId));
      }
    };

    initializeApp();
  }, []);

  // ローカルストレージに状態を保存
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('kanbanData', JSON.stringify(kanbanData));
  }, [kanbanData]);

  useEffect(() => {
    localStorage.setItem('nextId', nextId.toString());
  }, [nextId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = async (user: User) => {
    try {
      // Supabaseに接続できる場合は、データベースにも保存
      if (isSupabaseConnected) {
        await userDatabase.createUser({
          name: user.name,
          email: user.email
        });
        console.log('ユーザーをSupabaseに保存しました:', user.name);
      }
      
      // ローカル状態も更新（既存の動作を保持）
      setAllUsers(prev => [...prev, user]);
      setCurrentUser(user);
      setShowRegister(false);
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      // エラーが発生してもローカルでの登録は続行
      setAllUsers(prev => [...prev, user]);
      setCurrentUser(user);
      setShowRegister(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // 現在のユーザーのタスクのみ取得
  const getUserTasks = () => {
    if (!currentUser) return { tasks: {} as { [key: string]: Task }, taskIds: { todo: [], done: [] } };
    
    const userTasks = Object.values(kanbanData.tasks).filter(task => task.userId === currentUser.id);
    const tasksById = userTasks.reduce((acc, task) => ({ ...acc, [task.id]: task }), {} as { [key: string]: Task });
    
    const todoTasks = userTasks.filter(task => !task.completed);
    const doneTasks = userTasks.filter(task => task.completed);
    
    return {
      tasks: tasksById,
      taskIds: {
        todo: todoTasks.map(task => task.id),
        done: doneTasks.map(task => task.id)
      }
    };
  };

  const addTask = async () => {
    if (inputValue.trim() !== '' && currentUser) {
      const newTaskId = `task-${nextId}`;
      const newTask: Task = {
        id: newTaskId,
        text: inputValue.trim(),
        completed: false,
        userId: currentUser.id,
        comments: []
      };

      try {
        // Supabaseに保存
        if (isSupabaseConnected) {
          const savedTask = await taskDatabase.createTask({
            text: newTask.text,
            completed: newTask.completed,
            user_id: newTask.userId
          });
          console.log('タスクをSupabaseに保存しました:', savedTask);
          // Supabaseで生成されたIDを使用
          newTask.id = savedTask.id;
        }
      } catch (error) {
        console.error('タスク保存エラー:', error);
      }

      // ローカル状態を更新
      setKanbanData(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [newTask.id]: newTask
        }
      }));
      
      setInputValue('');
      setNextId(nextId + 1);
    }
  };

  const toggleTask = (taskId: string) => {
    const task = kanbanData.tasks[taskId];
    if (!task || task.userId !== currentUser?.id) return;

    setKanbanData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: { ...task, completed: !task.completed }
      }
    }));
  };

  const deleteTask = (taskId: string) => {
    const task = kanbanData.tasks[taskId];
    if (!task || task.userId !== currentUser?.id) return;

    setKanbanData(prev => {
      const newTasks = { ...prev.tasks };
      delete newTasks[taskId];
      return {
        ...prev,
        tasks: newTasks
      };
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    const task = kanbanData.tasks[draggableId];

    if (!destination || !task || task.userId !== currentUser?.id) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const updatedTask = {
      ...task,
      completed: destination.droppableId === 'done'
    };

    setKanbanData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [draggableId]: updatedTask
      }
    }));
  };

  const addComment = async (taskId: string, commentText: string) => {
    if (!currentUser || !commentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text: commentText.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    try {
      // Supabaseに保存
      if (isSupabaseConnected) {
        await commentDatabase.createComment({
          text: newComment.text,
          task_id: taskId,
          author_id: newComment.authorId,
          author_name: newComment.authorName
        });
        console.log('コメントをSupabaseに保存しました:', newComment.text);
      }
    } catch (error) {
      console.error('コメント保存エラー:', error);
    }

    // ローカル状態を更新
    setKanbanData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          comments: [...(prev.tasks[taskId].comments || []), newComment]
        }
      }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // 認証状態チェック
  if (!currentUser) {
    if (showRegister) {
      return (
        <RegisterScreen 
          onRegister={handleRegister}
          onShowLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginScreen 
        onLogin={handleLogin}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  const userTaskData = getUserTasks();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">カンバンボード Todo</h1>
              <p className="text-gray-600 mt-2">ようこそ、{currentUser.name}さん</p>
              <div className="flex items-center mt-1 text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isSupabaseConnected === null 
                    ? 'bg-yellow-400' 
                    : isSupabaseConnected 
                      ? 'bg-green-400' 
                      : 'bg-red-400'
                }`}></div>
                <span className="text-gray-500">
                  {isSupabaseConnected === null 
                    ? 'データベース接続確認中...' 
                    : isSupabaseConnected 
                      ? 'Supabase接続済み' 
                      : 'ローカルモード'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
            >
              ログアウト
            </button>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="新しいタスクを入力してください"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <button
                onClick={addTask}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm font-medium"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kanbanData.columnOrder.map((columnId) => {
              const column = kanbanData.columns[columnId];
              const tasks = userTaskData.taskIds[columnId as keyof typeof userTaskData.taskIds]
                .map(taskId => userTaskData.tasks[taskId])
                .filter(Boolean);

              return (
                <div key={column.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700 flex-1">
                      {column.title}
                    </h2>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      column.id === 'todo' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {tasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver 
                            ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                            : 'bg-gray-50'
                        }`}
                      >
                        {tasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onAddComment={addComment}
                          />
                        ))}
                        {provided.placeholder}
                        {tasks.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">
                              {column.id === 'todo' 
                                ? 'タスクを追加してください' 
                                : '完了したタスクがここに表示されます'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </main>
  );
}
