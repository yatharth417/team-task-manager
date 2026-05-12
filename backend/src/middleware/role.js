const Project = require('../models/Project');

const getMemberUserId = (member) => member?.user?._id?.toString() || member?.user?.toString();

// Check if user is admin of the project
const isAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.projectId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => getMemberUserId(m) === req.user.id);
    if (!member || member.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user is any member of the project
const isMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => getMemberUserId(m) === req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a project member' });

    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { isAdmin, isMember };
