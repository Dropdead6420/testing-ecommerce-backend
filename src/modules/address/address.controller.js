const addressService = require("./address.service");

const createAddress = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    try {
        // If user wants to make this the default address, unset previous default
        if (req.body.isDefault) {
            await addressService.unsetDefaultAddressForUser(userId);
        }

        const address = await addressService.createAddress(userId, req.body);
        return res.status(201).json({ message: "Address created", data: address });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "Validation error", error: error.message });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        // Fallback for unexpected errors
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }

};

const getAllAddresses = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    try {
        const addresses = await addressService.getAllAddresses(userId);
        if (addresses && addresses.length === 0) {
            return res.status(204).json({ message: "No address available", data: [] });
        }

        return res.status(200).json({ message: "Fetched addresses", data: addresses });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch addresses", error: error.message });
    }
};

const getAddressById = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }

    const addressId = req.params?.id;
    if (!addressId) {
        return res.status(400).json({ error: "Address ID is not present" });
    }

    try {
        const address = await addressService.getAddressById(userId, addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        return res.status(200).json({ message: "Address found", data: address });
    } catch (error) {
        return res.status(500).json({ message: "Failed to get address", error: error.message });
    }
};

const updateAddress = async (req, res) => {
    const addressId = req.params.id;
    if (!addressId) {
        return res.status(400).json({ error: "Address ID is not found" });
    }

    try {
        const updatedAddress = await addressService.updateAddress(addressId, req.body);
        if (!updatedAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        return res.status(200).json({ message: "Address updated", data: updatedAddress });
    } catch (error) {
        return res.status(500).json({ message: error.message, error: "Internal server error" });
    }
};

const deleteAddress = async (req, res) => {
    const addressId = req.params.id;

    if (!addressId) {
        return res.status(400).json({ error: "Address ID is required" });
    }

    try {
        const deletedAddress = await addressService.deleteAddress(req.user._id, addressId);

        return res.status(200).json({ message: "Address deleted successfully", data: deletedAddress });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({
            message: error.statusCode === 404
                ? "Address not found or unauthorized"
                : "Failed to delete address",
            error: error.message,
        });
    }
};

module.exports = {
    createAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress
};