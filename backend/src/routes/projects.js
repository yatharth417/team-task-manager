const router = require('express').Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin, isMember } = require('../middleware/role');

// Get all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project (creator becomes admin automatically)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const project = await Project.create({
      name, description,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single project
router.get('/:projectId', auth, isMember, async (req, res) => {
  res.json(req.project);
});

// Update project (admin only)
router.put('/:projectId', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId, { name, description }, { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project (admin only)
router.delete('/:projectId', auth, isAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member (admin only)
router.post('/:projectId/members', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, role = 'member' } = req.body;
    if (!name && !email) return res.status(400).json({ message: 'Name or email required' });

    const normalizedEmail = email ? email.toLowerCase() : '';
    const user = normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null;

    const project = req.project;
    const already = project.members.find(m =>
      (user && m.user && m.user.toString() === user._id.toString()) ||
      (!user && m.name && m.name.toLowerCase() === (name || '').toLowerCase()) ||
      (normalizedEmail && m.email === normalizedEmail)
    );
    if (already) return res.status(400).json({ message: 'Already a member' });

    project.members.push({
      user: user?._id,
      name: user ? undefined : name,
      email: user ? user.email : normalizedEmail || undefined,
      role,
    });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member (admin only)
router.delete('/:projectId/members/:userId', auth, isAdmin, async (req, res) => {
  try {
    const project = req.project;
    project.members = project.members.filter(
      m => m.user?.toString() !== req.params.userId && m._id.toString() !== req.params.userId
    );
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
