const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

function TaskList({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  busyTaskId,
}) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Create your first study task.</p>;
  }

  const sortedTasks = [...tasks].sort((firstTask, secondTask) => {
    const priorityDifference =
      priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return new Date(firstTask.createdAt) - new Date(secondTask.createdAt);
  });

  return (
    <div className="task-list">
      {sortedTasks.map((task) => {
        const busy = busyTaskId === task._id;

        return (
          <article className={`task-item ${task.completed ? 'is-complete' : ''}`} key={task._id}>
            <div className="task-content">
              <div className="task-heading">
                <h3>{task.title}</h3>
                <span className={`priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              {task.description && <p>{task.description}</p>}
              <span className={`task-status ${task.completed ? 'status-complete' : ''}`}>
                {task.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
            <div className="task-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onToggleComplete(task)}
                disabled={busy}
              >
                {task.completed ? 'Mark pending' : 'Complete'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onEdit(task)}
                disabled={busy}
              >
                Edit
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => onDelete(task)}
                disabled={busy}
              >
                {busy ? 'Working...' : 'Delete'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default TaskList;
