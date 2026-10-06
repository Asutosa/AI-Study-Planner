import { useState } from 'react';

const emptyTask = {
  title: '',
  description: '',
  priority: 'medium',
};

function TaskForm({ task, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    task
      ? {
          title: task.title,
          description: task.description || '',
          priority: task.priority,
        }
      : emptyTask,
  );

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label htmlFor="task-title">Title</label>
      <input
        id="task-title"
        name="title"
        type="text"
        value={form.title}
        onChange={handleChange}
        placeholder="e.g. Study DBMS"
        maxLength="200"
        required
      />

      <label htmlFor="task-description">Description</label>
      <textarea
        id="task-description"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="What do you want to study?"
        rows="3"
      />

      <label htmlFor="task-priority">Priority</label>
      <select
        id="task-priority"
        name="priority"
        value={form.priority}
        onChange={handleChange}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : task ? 'Save changes' : 'Create task'}
        </button>
        {task && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
