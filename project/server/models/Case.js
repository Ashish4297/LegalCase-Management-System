import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  clientNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientName: {
    type: String,
    required: true,
    index: true
  },
  caseType: {
    type: String,
    required: true,
    index: true
  },
  court: {
    type: String,
    required: true
  },
  courtNo: String,
  magistrate: String,
  petitioner: {
    type: String,
    required: true
  },
  respondent: {
    type: String,
    required: true
  },
  nextDate: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'On-Trial', 'Completed', 'Dismissed'],
    default: 'Pending',
    index: true
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documents: [{
    title: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  timeline: [{
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for common queries
caseSchema.index({ createdAt: -1 });
caseSchema.index({ 'documents.uploadedAt': -1 });
caseSchema.index({ 'timeline.date': -1 });

export default mongoose.model('Case', caseSchema);