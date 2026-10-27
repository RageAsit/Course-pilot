const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dateString: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const unscheduledSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    remainingMinutes: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    settings: {
      startDate: {
        type: Date,
        required: true,
      },
      horizonDays: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
      },
      dailyCapacityMinutes: {
        type: Number,
        required: true,
        min: 15,
        max: 720,
      },
      preferredSessionMinutes: {
        type: Number,
        default: 45,
      },
    },
    totalStudyMinutesScheduled: {
      type: Number,
      default: 0,
    },
    totalAssignmentsScheduled: {
      type: Number,
      default: 0,
    },
    sessions: [sessionSchema],
    unscheduled: [unscheduledSchema],
    warnings: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.user = ret.user ? ret.user.toString() : ret.user;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

studyPlanSchema.index({ user: 1, createdAt: -1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;
