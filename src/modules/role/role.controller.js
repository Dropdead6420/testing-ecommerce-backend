const Role = require("./role.model");
const roleService = require("./role.service")

const addRole = async (req, res) => {
    try {
        const isRoleExist = await roleService.searchByRoleName(req.body?.name);
        if (isRoleExist.length > 0) {
            return res.status(409).json({ error: "Conflict", message: "Role already exists" })
        }

        const createRole = await roleService.createRole(req.body);
        if (createRole) {
            return res.status(201).json({ message: "Role created", data: createRole });
        }

    } catch (err) {
        return res.status(500).json({ error: "Server Error", message: err.message });
    }
}

const getAllRole = async (req, res) => {
    try {
        const getAllRole = await roleService.getAllRole();
        if (!getAllRole || getAllRole.length === 0) {
            return res.status(200).json({
                message: "No roles found.",
                data: []
            });
        }

        return res.status(200).json({ message: "All roles", data: getAllRole })
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const getRoleByRoleName = async (req, res) => {
    try {
        const roleName = req.params?.roleName;

        if (!roleName) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Parameter 'roleName' is required"
            });
        }

        const foundRole = await roleService.searchByRoleName(roleName);

        if (!foundRole || foundRole.length == 0) {
            return res.status(404).json({
                error: "Not Found",
                message: `No role found with name '${roleName}'`
            });
        }

        return res.status(200).json({
            message: "Role found successfully",
            data: foundRole
        });

    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message
        });
    }
};

const getRoleById = async (req, res) => {
    try {
        const id = req.params?.id;

        if (!id) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Parameter 'id' is required"
            });
        }

        const foundRole = await roleService.searchById(id);

        if (!foundRole || foundRole.length == 0) {
            return res.status(404).json({
                error: "Not Found",
                message: `No role found with id '${id}'`
            });
        }

        return res.status(200).json({
            message: "Role found successfully",
            data: foundRole
        });

    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message
        });
    }
};

const updateRoleById = async (req, res) => {
    try {
        const checkRoleExist = await roleService.searchByRoleName(req.body.name);
        if (checkRoleExist.length > 0) {
            return res.status(409).json({ error: "Conflict", message: "Role already exists" })
        }

        const updatedRole = await roleService.updateRoleById(req.params.id, req.body);
        if (!updatedRole)
            return res.status(404).json({ message: "Role not found" });

        return res.status(200).json({ message: "Updated role", data: updatedRole });
    } catch (err) {
        return res.status(500).json({ message: err.message, error: "Server error" });
    }
}

const deleteRoleById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "Role ID is required" });
    }

    try {
        const deleteRole = await roleService.deleteRoleById(id);

        if (!deleteRole) return res.status(400).json({ error: "Role not found" });

        return res.status(200).json({ message: "Role deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message, error: "Server error" });
    }
}

module.exports = { addRole, getAllRole, getRoleByRoleName, getRoleById, updateRoleById, deleteRoleById }