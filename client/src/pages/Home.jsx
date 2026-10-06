import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, deleteTask, getTasks, updateTask } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import AIRecommendations from '../components/AIRecommendations';
import { useAuth } from '../context/useAuth';

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
            <h1>Study tasks</h1>
            <p className="muted">Welcome, {user.name}</p>
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

        <div className="planner-grid">
          <section className="planner-card">
            <h2>{editingTask ? 'Edit task' : 'Create a task'}</h2>
            <TaskForm
              key={`${editingTask?._id || 'new-task'}-${formVersion}`}
              task={editingTask}
              onSubmit={handleTaskSubmit}
              onCancel={() => setEditingTask(null)}
              submitting={savingTask}
            />
          </section>

          <section className="planner-card">
            <div className="section-heading">
              <h2>Your tasks</h2>
              {!loadingTasks && <span>{summary.total} total</span>}
            </div>
            {error && <p className="form-error">{error}</p>}
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
