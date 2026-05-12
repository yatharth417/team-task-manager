import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcon = { todo: <Circle size={13} />, 'in-progress': <Clock size={13} />, done: <CheckCircle2 size={13} /> };
const statusClass = { todo: 'badge-todo', 'in-progress': 'badge-progress', done: 'badge-done' };
const priorityClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

function isOverdue(task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState(null);

  useEffect(() => {
    api.get('/tasks/my-tasks').then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const updateTaskStatus = async (taskId, status) => {
    setSavingTaskId(taskId);
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(task => (task._id === taskId ? data : task)));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSavingTaskId(null);
    }
  };

  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(isOverdue).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Here's your task overview</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'To Do', value: todo, color: 'var(--muted)' },
            { label: 'In Progress', value: inProgress, color: '#60a5fa' },
            { label: 'Done', value: done, color: '#4ade80' },
            { label: 'Overdue', value: overdue, color: '#f87171' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>My Tasks</h2>
          <Link to="/projects" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View projects →</Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</p>
            <p>No tasks assigned to you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tasks.map(task => (
              <div key={task._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', borderLeft: isOverdue(task) ? '3px solid #f87171' : '3px solid transparent' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {isOverdue(task) && <AlertCircle size={13} color="#f87171" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link to={`/projects/${task.project?._id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>{task.project?.name}</Link>
                    {task.dueDate && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                  <span className={`badge ${statusClass[task.status]}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {statusIcon[task.status]} {task.status}
                  </span>
                  <select
                    className="input"
                    value={task.status}
                    onChange={e => updateTaskStatus(task._id, e.target.value)}
                    disabled={savingTaskId === task._id}
                    style={{ width: 120, padding: '0.35rem 0.55rem', fontSize: '0.8rem' }}
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
