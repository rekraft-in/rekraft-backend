const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Add new address
router.post('/', protect, async (req, res) => {
    try {
        console.log('✅ POST /api/user/addresses route hit!');
        console.log('✅ User:', req.user?.email);
        console.log('✅ Request body:', req.body);

        const {
            type,
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
            isDefault
        } = req.body;

        // Basic validation
        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                error: 'Please fill all required fields'
            });
        }

        // Find user and add address
        const user = await User.findById(req.user._id);
        
        const newAddress = {
            type: type || 'home',
            fullName,
            phone,
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state,
            pincode,
            landmark: landmark || '',
            isDefault: isDefault || false
        };

        // Set as default if first address or requested
        if (user.addresses.length === 0 || isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
            newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();

        console.log('✅ Address added successfully!');

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    addresses: user.addresses
                }
            },
            message: 'Address added successfully'
        });

    } catch (error) {
        console.error('❌ Add address error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

// Get user addresses
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            data: {
                addresses: user.addresses || []
            }
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching addresses'
        });
    }
});

// Update address
router.put('/:addressId', protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const updateData = req.body;

        const user = await User.findById(req.user._id);
        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // If setting as default, remove default from other addresses
        if (updateData.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // Update address fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                address[key] = updateData[key];
            }
        });

        await user.save();

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    addresses: user.addresses
                }
            },
            message: 'Address updated successfully'
        });

    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating address'
        });
    }
});

// Delete address
router.delete('/:addressId', protect, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        const wasDefault = address.isDefault;
        
        // Remove the address
        user.addresses.pull({ _id: addressId });
        await user.save();

        // If we deleted the default address and there are other addresses, set the first one as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
            await user.save();
        }

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    addresses: user.addresses
                }
            },
            message: 'Address deleted successfully'
        });

    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting address'
        });
    }
});

// Set default address
router.put('/:addressId/default', protect, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // Remove default from all addresses
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set the specified address as default
        address.isDefault = true;
        await user.save();

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    addresses: user.addresses
                }
            },
            message: 'Default address updated successfully'
        });

    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error setting default address'
        });
    }
});

module.exports = router;