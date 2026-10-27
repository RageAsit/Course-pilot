const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignment must belong to a student'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    estimatedMinutes: {
      type: Number,
      required: [true, 'Estimated time in minutes is required'],
      min: [1, 'Estimated minutes must be at least 1 minute'],
    },
    remainingMinutes: {
      type: Number,
      min: [0, 'Remaining minutes cannot be negative'],
    },
    importance: {
      type: Number,
      required: [true, 'Importance level (1-5) is required'],
      min: [1, 'Importance must be between 1 and 5'],
      max: [5, 'Importance must be between 1 and 5'],
      default: 3,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed'],
        message: 'Status must be either pending or completed',
      },
      default: 'pending',
      index: true,
    },
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

// Pre-save validation and defaults
assignmentSchema.pre('save', function (next) {
  // If remainingMinutes was not provided, default it to estimatedMinutes
  if (this.remainingMinutes === undefined || this.remainingMinutes === null) {
    this.remainingMinutes = this.estimatedMinutes;
  }

  // Ensure remainingMinutes does not exceed estimatedMinutes
  if (this.remainingMinutes > this.estimatedMinutes) {
    return next(new Error('Remaining minutes cannot exceed estimated minutes'));
  }

  next();
});

// Compound indexes for user-scoped queries
assignmentSchema.index({ user: 1, dueDate: 1 });
assignmentSchema.index({ user: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
