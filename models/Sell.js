const mongoose = require('mongoose');

const sellSchema = new mongoose.Schema({
    // Device Information
    deviceType: {
        type: String,
        default: "laptop"
    },
    brand: {
        type: String,
        required: [true, 'Brand is required']
    },
    model: {
        type: String,
        required: [true, 'Model is required']
    },
    year: {
        type: String,
        required: [true, 'Year is required']
    },
    condition: {
        type: String,
        required: [true, 'Condition is required']
    },

    // Specifications
    processor: {
        type: String,
        required: [true, 'Processor is required']
    },
    ram: {
        type: String,
        required: [true, 'RAM is required']
    },
    storage: {
        type: String,
        required: [true, 'Storage is required']
    },
    storageType: {
        type: String,
        default: "ssd"
    },
    screenSize: {
        type: String,
        required: [true, 'Screen size is required']
    },
    graphics: {
        type: String,
        default: ""
    },
    operatingSystem: {
        type: String,
        default: ""
    },

    // Physical Condition
    scratches: {
        type: String,
        required: [true, 'Scratches information is required']
    },
    dents: {
        type: String,
        required: [true, 'Dents information is required']
    },
    screenCondition: {
        type: String,
        required: [true, 'Screen condition is required']
    },
    keyboardCondition: {
        type: String,
        default: "working"
    },
    batteryHealth: {
        type: String,
        required: [true, 'Battery health is required']
    },
    chargerIncluded: {
        type: Boolean,
        default: true
    },
    originalBox: {
        type: Boolean,
        default: false
    },
    functionalIssues: {
        type: String,
        default: ""
    },

    // Personal Details
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required']
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },

    // Images (we'll store image URLs)
    images: [{
        url: String,
        name: String
    }],

    // Pricing and Status
    estimatedPrice: {
        type: Number,
        required: true
    },
    finalPrice: {
        type: Number
    },
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'accepted', 'rejected', 'pickup_scheduled', 'completed', 'cancelled'],
        default: 'submitted'
    },

    // Reference to user (required - only authenticated users)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },

    // Submission metadata
    submissionId: {
        type: String,
        unique: true
    }

}, {
    timestamps: true
});

// Generate submission ID before saving
sellSchema.pre('save', function(next) {
    if (!this.submissionId) {
        this.submissionId = 'RK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    next();
});

// Index for better query performance
sellSchema.index({ user: 1, createdAt: -1 });
sellSchema.index({ status: 1 });
sellSchema.index({ submissionId: 1 });

module.exports = mongoose.model('Sell', sellSchema);