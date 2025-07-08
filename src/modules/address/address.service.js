const Address = require("./address.model");
const userService = require("../user/user.service");

// Unset all other default addresses for the user
const unsetDefaultAddressForUser = async (userId) => {
    try {
        await Address.updateMany({ user: userId }, { isDefault: false });
    } catch (error) {
        throw new Error("Failed to unset default addresses: " + error.message);
    }
};

// Create address
const createAddress = async (userId, addressData) => {
    try {
        const address = new Address({ ...addressData, user: userId });
        const savedAddress = await address.save();
        const user = await userService.findUserById(userId);
        user.addresses.push(savedAddress._id);
        await user.save()
        return savedAddress;
    } catch (err) {
        if (err.statusCode) {
            // If error is already an HTTP error, rethrow it
            throw err;
        }

        // Wrap unknown errors with 500
        throw createHttpError(500, `Failed to create address: ${err.message}`);
    }
};

// Get all address of user
const getAllAddresses = async (userId) => {
    try {
        const userAddress = await Address.find({ user: userId }).sort({ isDefault: -1 });
        return userAddress;
    } catch (error) {
        throw new Error("Failed to get address: " + error.message);
    }
};

// Get single address via address id and user jwt
const getAddressById = async (userId, addressId) => {
    try {
        const address = await Address.findOne({ _id: addressId, user: userId });
        return address;
    } catch (error) {
        throw new Error("Failed to get address: " + error.message)
    }
};

// Address update via admin's
const updateAddress = async (addressId, updateData) => {
    try {
        const updatedAddress = await Address.findOneAndUpdate(addressId, updateData, { new: true, runValidators: true });
        return updatedAddress;
    } catch (error) {
        throw new Error("Failed to update address: " + error.message);
    }
};

// Delete address via user (customer)
const deleteAddress = async (userId, addressId) => {
    try {
        const deleteAddress = await Address.findOneAndDelete({ _id: addressId, user: userId });
        if (!deleteAddress) {
            const error = new Error("Address not found or does not belong to this user");
            error.statusCode = 404;
            throw error;
        }

        const user = await userService.findUserById(userId);
        user.addresses = user.addresses?.filter(addr => addr.toString() !== addressId);
        await user.save();

        return deleteAddress;
    } catch (error) {
        // Preserve custom statusCode if available
        const err = new Error("Failed to delete address: " + error.message);
        if (error.statusCode) {
            err.statusCode = error.statusCode;
        }
        throw err;
    }
};

module.exports = {
    createAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    unsetDefaultAddressForUser,
    deleteAddress
};
