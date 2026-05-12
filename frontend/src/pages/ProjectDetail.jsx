import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Trash2, UserPlus } from 'lucide-react';

const statusClass = { todo: 'badge-todo', 'in-progress': 'badge-progress', done: 'badge-done' };
const priorityClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

function TaskModal({ projectId, members, onClose, onSave, task }) {
  const [form, setForm] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '',
    assignedTo: task?.assignedTo?._id ? `user:${task.assignedTo._id}` : (task?.assignedToName ? `guest:${task.assignedToName}` : ''),
  }));
  const [saving, setSaving] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.assignedTo?.startsWith('user:')) {
        payload.assignedTo = payload.assignedTo.replace('user:', '');
        payload.assignedToName = '';
      } else if (payload.assignedTo?.startsWith('guest:')) {
        payload.assignedToName = payload.assignedTo.replace('guest:', '').trim();
        payload.assignedTo = null;
      } else {
        payload.assignedTo = null;
        payload.assignedToName = '';
      }

      if (task) {
        await api.put(`/tasks/${task._id}`, payload);
      } else {
        await api.post('/tasks', { ...payload, projectId });
      }
      toast.success(task ? 'Task updated!' : 'Task created!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '1.75rem', animation: 'fadeIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{task ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.3rem' }}><X size={15} /></button>
        </div>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Task title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="Optional details..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate ? form.dueDate.split('T')[0] : ''}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user?._id || m._id} value={m.user?._id ? `user:${m.user._id}` : `guest:${m.name}`}>
                    {m.user?.name || m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const [showMemberInput, setShowMemberInput] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [savingTaskId, setSavingTaskId] = useState(null);

  const currentUserId = user?.id || user?._id;
  const isAdmin = project?.members?.find(m => m.user?._id === currentUserId)?.role === 'admin';

  const load = async () => {
    try {
      const [proj, taskRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks/project/${projectId}`)
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Deleted');
    load();
  };

  const updateTaskStatus = async (taskId, status) => {
    setSavingTaskId(taskId);
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => (t._id === taskId ? data : t)));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSavingTaskId(null);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/projects/${projectId}/members`, { name: memberName, email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setMemberName('');
      setMemberEmail('');
      setMemberRole('member');
      setShowMemberInput(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${projectId}/members/${userId}`);
    toast.success('Removed');
    load();
  };

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }}><Navbar /><p style={{ padding: '2rem', color: 'var(--muted)' }}>Loading...</p></div>;
  if (!project) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }}><Navbar /><p style={{ padding: '2rem', color: 'var(--muted)' }}>Project not found</p></div>;

  const todo = tasks.filter(t => t.status === 'todo');
  const inProg = tasks.filter(t => t.status === 'in-progress');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>{project.name}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{project.description}</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            Roles apply per project. Admins can manage members and tasks.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {['tasks', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: tab === t ? 'var(--accent)' : 'var(--muted)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              {isAdmin && (
                <button className="btn-primary" onClick={() => { setEditTask(null); setTaskModal(true); }}>
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>

            {/* Kanban columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[['todo', 'To Do', todo], ['in-progress', 'In Progress', inProg], ['done', 'Done', done]].map(([status, label, list]) => (
                <div key={status}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className={`badge ${statusClass[status]}`}>{label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{list.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {list.length === 0 && (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: 10 }}>Empty</div>
                    )}
                    {list.map(task => {
                      const canUpdateStatus = isAdmin || (task.assignedTo && task.assignedTo._id === user?.id);

                      return (
                        <div key={task._id} className="card" style={{ padding: '0.9rem', cursor: isAdmin ? 'pointer' : 'default' }}
                          onClick={() => isAdmin && (setEditTask(task), setTaskModal(true))}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}>{task.title}</span>
                            {isAdmin && (
                              <button onClick={e => { e.stopPropagation(); deleteTask(task._id); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 0 0 0.4rem', flexShrink: 0 }}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          {task.description && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{task.description}</p>}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                            <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                            {(task.assignedTo || task.assignedToName) && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                👤 {task.assignedTo?.name || task.assignedToName}
                              </span>
                            )}
                            {task.dueDate && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                            {canUpdateStatus && (
                              <select
                                className="input"
                                value={task.status}
                                onChange={e => updateTaskStatus(task._id, e.target.value)}
                                disabled={savingTaskId === task._id}
                                style={{ width: 120, padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                              >
                                <option value="todo">Todo</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <div style={{ maxWidth: 500 }}>
            {isAdmin && (
              <div style={{ marginBottom: '1.25rem' }}>
                {!showMemberInput ? (
                  <button className="btn-primary" onClick={() => setShowMemberInput(true)}>
                    <UserPlus size={14} /> Add Member
                  </button>
                ) : (
                  <form onSubmit={addMember} style={{ display: 'flex', gap: '0.75rem' }}>
                    <input className="input" type="text" placeholder="Member name" value={memberName}
                      onChange={e => setMemberName(e.target.value)} required style={{ flex: 1 }} />
                    <input className="input" type="email" placeholder="Email (optional)" value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)} style={{ flex: 1 }} />
                    <select className="input" value={memberRole} onChange={e => setMemberRole(e.target.value)} style={{ width: 120 }}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="btn-primary" disabled={addingMember}>{addingMember ? '...' : 'Add'}</button>
                    <button type="button" className="btn-ghost" onClick={() => setShowMemberInput(false)}>Cancel</button>
                  </form>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {project.members?.map(m => (
                <div key={m.user?._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.1rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(m.user?.name || m.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.user?.name || m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{m.user?.email || m.email || 'No email'}</div>
                  </div>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {isAdmin && m.user?._id !== user?.id && (
                    <button onClick={() => removeMember(m.user?._id || m._id)} className="btn-ghost" style={{ padding: '0.3rem' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          projectId={projectId}
          members={project.members || []}
          task={editTask}
          onClose={() => { setTaskModal(false); setEditTask(null); }}
          onSave={() => { setTaskModal(false); setEditTask(null); load(); }}
        />
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
