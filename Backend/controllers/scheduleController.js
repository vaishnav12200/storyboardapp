const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const Scene = require('../models/Scene');
const { validationResult } = require('express-validator');

class ScheduleController {
  // Create new schedule
  async createSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has write permission
      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check for scheduling conflicts
      const conflicts = await Schedule.findConflicts(
        projectId,
        req.body.date,
        req.body.timeSlot.startTime,
        req.body.timeSlot.endTime
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Schedule conflict detected',
          conflicts: conflicts.map(conflict => ({
            id: conflict._id,
            title: conflict.title,
            timeSlot: conflict.timeSlot
          }))
        });
      }

      const scheduleData = {
        ...req.body,
        project: projectId,
        createdBy: req.user.userId
      };

      const schedule = new Schedule(scheduleData);
      await schedule.save();

      await schedule.populate([
        { path: 'project', select: 'title' },
        { path: 'scenes.scene', select: 'sceneNumber title' },
        { path: 'crew.member', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      });
    } catch (error) {
      console.error('Schedule creation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create schedule'
      });
    }
  }

  // Get all schedules for a project
  async getSchedules(req, res) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, status, date, type } = req.query;
      const skip = (page - 1) * limit;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const query = { project: projectId };
      if (status) query.status = status;
      if (type) query.type = type;
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query.date = { $gte: targetDate, $lt: nextDay };
      }

      const schedules = await Schedule.find(query)
        .populate([
          { path: 'scenes.scene', select: 'sceneNumber title' },
          { path: 'crew.member', select: 'firstName lastName email' },
          { path: 'createdBy', select: 'firstName lastName email' }
        ])
        .sort({ date: 1, 'timeSlot.startTime': 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Schedule.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          schedules,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single schedule
  async getSchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      const schedule = await Schedule.findById(scheduleId)
        .populate([
          { path: 'project', select: 'title owner collaborators' },
          { path: 'scenes.scene', select: 'sceneNumber title description location' },
          { path: 'crew.member', select: 'firstName lastName email phone role' },
          { path: 'createdBy', select: 'firstName lastName email' },
          { path: 'lastModifiedBy', select: 'firstName lastName email' }
        ]);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has access to the project
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update schedule
  async updateSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { scheduleId } = req.params;

      const schedule = await Schedule.findById(scheduleId).populate('project');
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has write permission
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check for conflicts if time or date changed
      if (req.body.date || req.body.timeSlot) {
        const newDate = req.body.date || schedule.date;
        const newStartTime = req.body.timeSlot?.startTime || schedule.timeSlot.startTime;
        const newEndTime = req.body.timeSlot?.endTime || schedule.timeSlot.endTime;

        const conflicts = await Schedule.findConflicts(
          schedule.project._id,
          newDate,
          newStartTime,
          newEndTime,
          scheduleId
        );

        if (conflicts.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Schedule conflict detected',
            conflicts: conflicts.map(conflict => ({
              id: conflict._id,
              title: conflict.title,
              timeSlot: conflict.timeSlot
            }))
          });
        }
      }

      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.userId
      };

      Object.assign(schedule, updateData);
      await schedule.save();

      await schedule.populate([
        { path: 'scenes.scene', select: 'sceneNumber title' },
        { path: 'crew.member', select: 'firstName lastName email' },
        { path: 'lastModifiedBy', select: 'firstName lastName email' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete schedule
  async deleteSchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      const schedule = await Schedule.findById(scheduleId).populate('project');
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Schedule.findByIdAndDelete(scheduleId);

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get calendar view of schedules
  async getCalendarView(req, res) {
    try {
      const { projectId } = req.params;
      const { startDate, endDate, view = 'month' } = req.query;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let start, end;
      const now = new Date();

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        // Default ranges based on view
        switch (view) {
          case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay()); // Start of week
            end = new Date(start);
            end.setDate(start.getDate() + 6); // End of week
            break;
          case 'month':
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        }
      }

      const schedules = await Schedule.find({
        project: projectId,
        date: { $gte: start, $lte: end }
      })
        .populate([
          { path: 'scenes.scene', select: 'sceneNumber title' },
          { path: 'crew.member', select: 'firstName lastName' }
        ])
        .sort({ date: 1, 'timeSlot.startTime': 1 });

      // Group schedules by date
      const calendar = {};
      schedules.forEach(schedule => {
        const dateKey = schedule.date.toISOString().split('T')[0];
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push(schedule);
      });

      res.status(200).json({
        success: true,
        data: {
          calendar,
          view,
          dateRange: {
            start,
            end
          },
          totalSchedules: schedules.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update schedule status
  async updateStatus(req, res) {
    try {
      const { scheduleId } = req.params;
      const { status } = req.body;

      const schedule = await Schedule.findById(scheduleId).populate('project');
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has write permission
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      schedule.status = status;
      schedule.lastModifiedBy = req.user.userId;

      // Update scene statuses if schedule is completed
      if (status === 'completed') {
        await Scene.updateMany(
          { _id: { $in: schedule.scenes.map(s => s.scene) } },
          { status: 'completed' }
        );
      }

      await schedule.save();

      res.status(200).json({
        success: true,
        message: 'Schedule status updated successfully',
        data: {
          scheduleId: schedule._id,
          status: schedule.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add crew member to schedule
  async addCrewMember(req, res) {
    try {
      const { scheduleId } = req.params;
      const { userId, role, callTime, wrapTime, notes } = req.body;

      const schedule = await Schedule.findById(scheduleId).populate('project');
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has write permission
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if crew member already exists
      const existingMember = schedule.crew.find(
        member => member.member.toString() === userId
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Crew member already assigned to this schedule'
        });
      }

      schedule.crew.push({
        member: userId,
        role,
        callTime,
        wrapTime,
        notes: notes || '',
        status: 'pending'
      });

      await schedule.save();
      await schedule.populate('crew.member', 'firstName lastName email');

      res.status(201).json({
        success: true,
        message: 'Crew member added successfully',
        data: {
          scheduleId: schedule._id,
          crewCount: schedule.crew.length,
          newMember: schedule.crew[schedule.crew.length - 1]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Remove crew member from schedule
  async removeCrewMember(req, res) {
    try {
      const { scheduleId, userId } = req.params;

      const schedule = await Schedule.findById(scheduleId).populate('project');
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Check if user has write permission
      const hasAccess = schedule.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      schedule.crew = schedule.crew.filter(
        member => member.member.toString() !== userId
      );

      await schedule.save();

      res.status(200).json({
        success: true,
        message: 'Crew member removed successfully',
        data: {
          scheduleId: schedule._id,
          crewCount: schedule.crew.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get schedule conflicts
  async getConflicts(req, res) {
    try {
      const { projectId } = req.params;
      const { date, startTime, endTime } = req.query;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const conflicts = await Schedule.findConflicts(
        projectId,
        new Date(date),
        startTime,
        endTime
      );

      res.status(200).json({
        success: true,
        data: {
          conflicts: conflicts.map(conflict => ({
            id: conflict._id,
            title: conflict.title,
            date: conflict.date,
            timeSlot: conflict.timeSlot,
            status: conflict.status
          })),
          hasConflicts: conflicts.length > 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ScheduleController();