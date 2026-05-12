const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isMember } = require('../middleware/role');

async function requireProjectAdmin(req, res, projectId) {
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }

  const member = project.members.find(m => (m.user?._id?.toString() || m.user?.toString()) === req.user.id);
  if (!member || member.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return null;
  }

  return project;
}

async function validateAssignee(project, assignedTo, assignedToName) {
  if (assignedTo) {
    const user = await User.findById(assignedTo);
    if (!user) return 'User not found';
    const isMember = project.members.some(m => (m.user?._id?.toString() || m.user?.toString()) === user._id.toString());
    if (!isMember) return 'Assigned user must be a project member';
    return { assignedTo: user._id, assignedToName: '' };
  }

  if (assignedToName) {
    const match = project.members.some(m =>
      m.name && m.name.toLowerCase() === assignedToName.toLowerCase()
    );
    if (!match) return 'Assigned name must be a project member';
    return { assignedTo: null, assignedToName };
  }

  return { assignedTo: null, assignedToName: '' };
}

// Get all tasks for a project
router.get('/project/:projectId', auth, isMember, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo, assignedToName } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and project required' });

    const project = await requireProjectAdmin(req, res, projectId);
    if (!project) return;

    const assigneeCheck = await validateAssignee(project, assignedTo || null, assignedToName || '');
    if (typeof assigneeCheck === 'string') {
      return res.status(400).json({ message: assigneeCheck });
    }

    const task = await Task.create({
      title, description, status, priority, dueDate,
      project: projectId,
      assignedTo: assigneeCheck.assignedTo,
      assignedToName: assigneeCheck.assignedToName,
      createdBy: req.user.id,
    });
    await task.populate('assignedTo', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => (m.user?._id?.toString() || m.user?.toString()) === req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a project member' });

    const isAdminUser = member.role === 'admin';
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;

    if (!isAdminUser) {
      if (!isAssignee) return res.status(403).json({ message: 'Task access required' });

      const onlyStatusUpdate =
        req.body.title === undefined &&
        req.body.description === undefined &&
        req.body.priority === undefined &&
        req.body.dueDate === undefined &&
        req.body.assignedTo === undefined &&
        req.body.assignedToName === undefined;

      if (!onlyStatusUpdate) {
        return res.status(403).json({ message: 'Only status can be updated by the assignee' });
      }
    }

    if (isAdminUser && (req.body.assignedTo !== undefined || req.body.assignedToName !== undefined)) {
      const assigneeCheck = await validateAssignee(
        project,
        req.body.assignedTo || null,
        req.body.assignedToName || ''
      );
      if (typeof assigneeCheck === 'string') {
        return res.status(400).json({ message: assigneeCheck });
      }
      task.assignedTo = assigneeCheck.assignedTo;
      task.assignedToName = assigneeCheck.assignedToName;
    }

    if (isAdminUser) {
      if (req.body.title !== undefined) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.priority !== undefined) task.priority = req.body.priority;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    }

    if (req.body.status !== undefined) task.status = req.body.status;

    await task.save();
    await task.populate('assignedTo', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await requireProjectAdmin(req, res, task.project);
    if (!project) return;

    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard - get all tasks assigned to logged-in user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('project', 'name')
      .populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
