const Sell = require('../models/Sell');

// @desc    Create new sell submission
// @route   POST /api/sell
// @access  Private (requires authentication)
const createSellSubmission = async (req, res) => {
    try {
        console.log('? Received sell submission request from user:', req.user.email);

        const {
            deviceType, brand, model, year, condition,
            processor, ram, storage, storageType, screenSize, graphics, operatingSystem,
            scratches, dents, screenCondition, keyboardCondition, batteryHealth,
            chargerIncluded, originalBox, functionalIssues,
            name, email, phone, pincode, city, address,
            images, estimatedPrice
        } = req.body;

        // Basic validation
        const requiredFields = ['brand', 'model', 'year', 'condition', 'name', 'email', 'phone', 'pincode', 'city', 'address'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Required fields missing: ${missingFields.join(', ')}`
            });
        }

        // Calculate estimated price if not provided
        let finalEstimatedPrice = estimatedPrice;
        if (!finalEstimatedPrice || finalEstimatedPrice === 0) {
            finalEstimatedPrice = calculatePriceEstimate(req.body);
            console.log('? Calculated estimated price:', finalEstimatedPrice);
        }

        // Auto-fill user information from authenticated user
        const userInfo = {
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone
        };

        console.log('? Auto-filling user info:', userInfo);

        // Create sell submission with user association
        const sellSubmissionData = {
            deviceType: deviceType || "laptop",
            brand, model, year, condition,
            processor, ram, storage, 
            storageType: storageType || "ssd",
            screenSize, 
            graphics: graphics || "",
            operatingSystem: operatingSystem || "",
            scratches, dents, screenCondition, 
            keyboardCondition: keyboardCondition || "working",
            batteryHealth,
            chargerIncluded: chargerIncluded !== undefined ? chargerIncluded : true,
            originalBox: originalBox !== undefined ? originalBox : false,
            functionalIssues: functionalIssues || "",
            // Use authenticated user's information (can be overridden by form data)
            name: name || req.user.name,
            email: email || req.user.email,
            phone: phone || req.user.phone,
            pincode, city, address,
            images: images || [],
            estimatedPrice: finalEstimatedPrice,
            user: req.user._id // Always associate with authenticated user
        };

        const sellSubmission = await Sell.create(sellSubmissionData);

        console.log('✅ Sell submission created for user:', {
            submissionId: sellSubmission.submissionId,
            estimatedPrice: sellSubmission.estimatedPrice,
            user: req.user.email
        });

        res.status(201).json({
            success: true,
            data: {
                submissionId: sellSubmission.submissionId,
                estimatedPrice: sellSubmission.estimatedPrice,
                message: 'Sell request submitted successfully! We will contact you within 24 hours.'
            }
        });

    } catch (error) {
        console.error('❌ Sell submission error:', error);
        
        // MongoDB duplicate error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Duplicate submission detected'
            });
        }
        
        // Validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server error during submission: ' + error.message
        });
    }
};

// @desc    Get user's sell submissions
// @route   GET /api/sell
// @access  Private
const getSellSubmissions = async (req, res) => {
    try {
        // Users can only see their own submissions
        const submissions = await Sell.find({ user: req.user._id }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: submissions,
            count: submissions.length
        });
    } catch (error) {
        console.error('❌ Get submissions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching submissions'
        });
    }
};

// @desc    Get single sell submission
// @route   GET /api/sell/:id
// @access  Private
const getSellSubmission = async (req, res) => {
    try {
        // Users can only see their own submissions
        const submission = await Sell.findOne({ 
            _id: req.params.id, 
            user: req.user._id 
        });
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found or access denied'
            });
        }
        
        res.json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('❌ Get submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching submission'
        });
    }
};

// @desc    Update sell submission status (user can only cancel their own)
// @route   PUT /api/sell/:id
// @access  Private
const updateSellSubmission = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Users can only update their own submissions and only to 'cancelled'
        const submission = await Sell.findOneAndUpdate(
            { 
                _id: req.params.id, 
                user: req.user._id 
            },
            { status: 'cancelled' }, // Users can only cancel
            { new: true, runValidators: true }
        );
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found or access denied'
            });
        }
        
        res.json({
            success: true,
            data: submission,
            message: 'Submission cancelled successfully'
        });
    } catch (error) {
        console.error('❌ Update submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating submission'
        });
    }
};

// Price calculation function (same as frontend)
const calculatePriceEstimate = (data) => {
    if (!data.brand || !data.condition) return 0;

    const brandPrices = {
        "Apple": { base: 35000, min: 5000, max: 200000 },
        "Dell": { base: 18000, min: 3000, max: 120000 },
        "HP": { base: 15000, min: 2500, max: 100000 },
        "Lenovo": { base: 16000, min: 2800, max: 110000 },
        "Asus": { base: 14000, min: 2600, max: 95000 },
        "Acer": { base: 12000, min: 2200, max: 80000 },
        "MSI": { base: 20000, min: 4000, max: 150000 },
        "Samsung": { base: 17000, min: 3000, max: 100000 },
        "Toshiba": { base: 8000, min: 1500, max: 40000 },
        "Sony": { base: 10000, min: 1800, max: 60000 },
        "Compaq": { base: 5000, min: 800, max: 20000 },
        "IBM": { base: 6000, min: 1000, max: 25000 },
        "Other": { base: 8000, min: 1000, max: 50000 }
    };

    const brandData = brandPrices[data.brand] || { base: 8000, min: 1000, max: 40000 };
    let basePrice = brandData.base;

    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(data.year || currentYear);
    const ageDepreciation = Math.min(0.8, age * 0.12);
    basePrice *= (1 - ageDepreciation);

    const conditionMultipliers = {
        "Like New - No signs of use": 1.0,
        "Excellent - Minor cosmetic wear": 0.85,
        "Very Good - Light scratches": 0.75,
        "Good - Visible wear but fully functional": 0.6,
        "Fair - Significant wear, works well": 0.45,
        "Poor - Major issues but working": 0.25,
        "For Parts - Not working": 0.1
    };
    
    basePrice *= conditionMultipliers[data.condition] || 0.5;

    if (data.ram === "4GB") basePrice += 1000;
    if (data.ram === "8GB") basePrice += 2500;
    if (data.ram === "16GB") basePrice += 5000;
    if (data.ram === "32GB") basePrice += 10000;
    if (data.ram === "64GB") basePrice += 15000;

    if (data.storageType === "ssd") basePrice += 2000;
    if (data.storageType === "nvme") basePrice += 3500;
    
    const storageSize = parseInt(data.storage) || 0;
    if (storageSize >= 512) basePrice += 3000;
    if (storageSize >= 1000) basePrice += 5000;

    if (data.chargerIncluded) basePrice += 500;
    if (data.originalBox) basePrice += 300;

    basePrice = Math.max(brandData.min, Math.min(brandData.max, basePrice));

    return Math.round(basePrice / 500) * 500;
};

module.exports = {
    createSellSubmission,
    getSellSubmissions,
    getSellSubmission,
    updateSellSubmission
};