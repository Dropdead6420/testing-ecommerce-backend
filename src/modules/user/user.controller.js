const { extractToken } = require("../../utils/authUtils");
const userService = require("./user.service");

const getUserProfile = async (req, res) => {
    try {
        const jwt = extractToken(req);
        if (!jwt) {
            return res.status(401).send({ error: "Token not found" });
        }

        const user = await userService.getUserProfileByToken(jwt);
        if (!user) {
            return res.status(400).json({ error: "Bad request" });
        }

        return res.status(200).json({ message: "User found", data: user });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message,
            error: "Internal server error"
        });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        if (users.length === 0) {
            return res.status(200).json({ message: "No data available" })
        }

        return res.status(200).json({ message: "All users fetched", data: users });

    } catch (error) {
        return res.status(500).json({ error: "Server Error", message: error.message });
    }
}

const updateUser = async (req, res) => {
    const userId = req.user._id;
    const updateData = req.body;

    try {
        const isUserUpdated = await userService.updateUserById(userId, updateData);

        return res.status(200).json({
            message: "User updated successfully",
            data: isUserUpdated
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: "An error occurred while updating the user",
            error: error.message
        });
    }
}

const updateUserByAdmin = async (req, res) => {
    try {
        const userIdFromToken = req.user?._id?.toString();
        const userIdFromParam = req.params.id;

        // Check if user is updating their own profile OR an authorized admin is doing it
        const isSelf = userIdFromToken === userIdFromParam;
        const isAdmin = req.user?.email && req.user?.role; // basic check

        if (!isSelf && !isAdmin) {
            return res.status(403).json({
                message: "You are not authorized to update this user.",
                error: "Forbidden"
            });
        }

        const updates = req.body;

        const updatedUser = await userService.updateUserById(userIdFromParam, updates);

        return res.status(200).json({
            message: "User updated successfully",
            data: updatedUser
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: "An error occurred while updating the user",
            error: error.message
        });
    }
};

module.exports = { getAllUsers, getUserProfile, updateUser, updateUserByAdmin };