const mongoose = require('mongoose');

const healthcareRecordSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  contactInfo: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown',
  },
  allergies: [String],
  medicalConditions: [String],
  medications: [
    {
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date,
      endDate: Date,
    },
  ],
  visits: [
    {
      date: Date,
      doctor: String,
      department: String,
      diagnosis: String,
      prescription: String,
      notes: String,
    },
  ],
  labReports: [
    {
      testName: String,
      date: Date,
      results: String,
      fileUrl: String,
      interpretedBy: String,
    },
  ],
  insuranceInfo: {
    provider: { type: String, default: '' },
    policyNumber: { type: String, default: '' },
    groupNumber: { type: String, default: '' },
  },
  emergencyContact: {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('HealthcareRecord', healthcareRecordSchema);