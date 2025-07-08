const roleModel = require("./role.model")

const searchByRoleName = async (roleName) => {
    try {
        const role = await roleModel.find({ name: roleName })
        return role;
    } catch (error) {
        throw new Error("Error searching role: " + error.message);
    }
}

const searchById = async (id) => {
    try {
        const role = await roleModel.findById(id)
        return role;
    } catch (error) {
        throw new Error("Error searching role: " + error.message);
    }
}

const createRole = async (roleData) => {
    try {
        const newRole = await roleModel.create(roleData);
        return newRole;
    } catch (error) {
        throw new Error("Error creating role: " + error.message);
    }
}

const getAllRole = async () => {
    try {
        const roles = await roleModel.find();
        return roles
    } catch (err) {
        throw new Error("Error getting all roles: " + err.message);
    }
}

const updateRoleById = async (id, data) => {
    try {
        const updatedRole = await roleModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return updatedRole;
    } catch (err) {
        throw new Error("Error update role: " + err.message);
    }
}

const deleteRoleById = async (id) => {
    try {
        const deletedRole = await roleModel.findByIdAndDelete(id);
        return deletedRole;
    } catch (err) {
        throw new Error("Error delete role: " + err.message);
    }
}

module.exports = { searchByRoleName, searchById, createRole, getAllRole, updateRoleById, deleteRoleById }