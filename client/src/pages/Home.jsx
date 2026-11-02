import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, deleteTask, getTasks, updateTask } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import AIRecommendations from '../components/AIRecommendations';
import { useAuth } from '../context/useAuth';

const DAILY_INSIGHTS = [
  {
    fact: 'Short breaks help your brain consolidate what you have just learned.',
    quote: 'Progress becomes easier to see when you give each small step your full attention.',
  },
  {
    fact: 'Explaining an idea in your own words is a powerful way to check your understanding.',
    quote: 'You do not need a perfect study session, only an intentional one.',
  },
  {
    fact: 'Retrieving information from memory strengthens learning more than rereading alone.',
    quote: 'Start with what you remember, then let your questions guide the next step.',
  },
  {
    fact: 'Breaking a large task into smaller actions can make it feel more manageable.',
    quote: 'A focused twenty minutes can move a difficult subject forward.',
  },
  {
    fact: 'Studying a topic across multiple sessions usually supports stronger long-term recall.',
    quote: 'Consistency is a quiet advantage you can build one session at a time.',
  },
];

function getDailyInsight() {
  const today = new Date();
  const dayNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) /
      (24 * 60 * 60 * 1000),
  );

  return DAILY_INSIGHTS[dayNumber % DAILY_INSIGHTS.length];
}

function Home() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getTasks(token)
      .then((response) => {
        if (active) setTasks(response.tasks);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingTasks(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const summary = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
    };
  }, [tasks]);
  const dailyInsight = getDailyInsight();

  const handleTaskSubmit = async (taskData) => {
    setError('');
    setSavingTask(true);

    try {
      if (editingTask) {
        const response = await updateTask(token, editingTask._id, taskData);
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task._id === response.task._id ? response.task : task,
          ),
        );
        setEditingTask(null);
      } else {
        const response = await createTask(token, taskData);
        setTasks((currentTasks) => [response.task, ...currentTasks]);
        setFormVersion((version) => version + 1);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleComplete = async (task) => {
    setError('');
    setBusyTaskId(task._id);

    try {
      const response = await updateTask(token, task._id, {
        completed: !task.completed,
      });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask._id === response.task._id ? response.task : currentTask,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDelete = async (task) => {
    setError('');
    setBusyTaskId(task._id);

    try {
      await deleteTask(token, task._id);
      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask._id !== task._id),
      );
      if (editingTask?._id === task._id) setEditingTask(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="planner-layout">
      <div className="planner-container">
        <header className="planner-header">
          <div>
            <p className="eyebrow">AI Study Planner</p>
            <h1>Your Study Space</h1>
            <p className="muted">Welcome back, {user.name}. Make today a focused one.</p>
          </div>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section className="summary-grid" aria-label="Task summary">
          <div className="summary-card">
            <span>Total tasks</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="summary-card">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
          <div className="summary-card">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </div>
        </section>

        <section className="inspiration-card" aria-label="Daily inspiration">
          <div className="inspiration-heading">
            <div>
              <p className="eyebrow">Daily inspiration</p>
              <h2>A little momentum for your study session</h2>
            </div>
            <span className="inspiration-mark" aria-hidden="true">
              ✦
            </span>
          </div>
          <div className="inspiration-grid">
            <div>
              <span className="inspiration-label">Learning note</span>
              <p>{dailyInsight.fact}</p>
            </div>
            <div className="inspiration-quote">
              <span className="inspiration-label">Today&apos;s thought</span>
              <p>&ldquo;{dailyInsight.quote}&rdquo;</p>
            </div>
          </div>
        </section>

        <div className="planner-grid">
          <section className="planner-card task-form-card">
            <div className="card-heading">
              <p className="eyebrow">{editingTask ? 'Refine your plan' : 'Plan your next win'}</p>
              <h2>{editingTask ? 'Edit task' : 'Create a task'}</h2>
            </div>
            <TaskForm
              key={`${editingTask?._id || 'new-task'}-${formVersion}`}
              task={editingTask}
              onSubmit={handleTaskSubmit}
              onCancel={() => setEditingTask(null)}
              submitting={savingTask}
            />
          </section>

          <section className="planner-card tasks-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Your plan</p>
                <h2>Study tasks</h2>
              </div>
              {!loadingTasks && <span>{summary.total} total</span>}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {loadingTasks ? (
              <p className="status-message">Loading tasks...</p>
            ) : (
              <TaskList
                tasks={tasks}
                onEdit={setEditingTask}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                busyTaskId={busyTaskId}
              />
            )}
          </section>
        </div>
        <AIRecommendations token={token} />
      </div>
    </main>
  );
}

export default Home;
