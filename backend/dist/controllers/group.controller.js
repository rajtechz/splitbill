"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.addMember = exports.deleteGroup = exports.updateGroup = exports.createGroup = exports.getGroupById = exports.getGroups = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const balance_service_js_1 = require("../services/balance.service.js");
const getGroups = async (req, res) => {
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    const groups = store_js_1.store.getGroups();
    return (0, response_js_1.sendSuccess)(res, groups);
};
exports.getGroups = getGroups;
const getGroupById = async (req, res) => {
    const { id } = req.params;
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    const group = store_js_1.store.findGroupById(id);
    if (!group) {
        return (0, response_js_1.sendError)(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, group);
};
exports.getGroupById = getGroupById;
const createGroup = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { name, description, category, currency, members } = req.body;
    if (!name) {
        return (0, response_js_1.sendError)(res, 'Group name is required', 400, 'VALIDATION_ERROR');
    }
    const initialMembers = members && members.length > 0
        ? members.map((m) => ({
            userId: m.userId,
            name: m.name,
            email: m.email || '',
            avatarUrl: m.avatarUrl,
            role: m.role || 'member',
            joinedAt: m.joinedAt || new Date().toISOString(),
            netBalance: 0,
        }))
        : [
            {
                userId: currentUserId,
                name: req.user?.name || 'Alex Johnson',
                email: req.user?.email || 'alex@example.com',
                avatarUrl: req.user?.avatarUrl,
                role: 'admin',
                joinedAt: new Date().toISOString(),
                netBalance: 0,
            },
        ];
    const newGroup = {
        id: `grp_${Date.now()}`,
        name: name.trim(),
        description: description ? description.trim() : undefined,
        category: category || 'Trip',
        currency: currency || req.user?.defaultCurrency || 'INR',
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
        membersCount: initialMembers.length,
        totalSpending: 0,
        userBalance: 0,
        members: initialMembers,
    };
    store_js_1.store.createGroup(newGroup);
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'group_created',
        actorId: currentUserId,
        actorName: req.user?.name || 'Alex Johnson',
        title: `Created group "${newGroup.name}"`,
        description: `${initialMembers.length} members joined`,
        timestamp: new Date().toISOString(),
        groupId: newGroup.id,
    });
    return (0, response_js_1.sendSuccess)(res, newGroup, 'Group created successfully', 201);
};
exports.createGroup = createGroup;
const updateGroup = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const updated = store_js_1.store.updateGroup(id, updates);
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, updated, 'Group updated successfully');
};
exports.updateGroup = updateGroup;
const deleteGroup = async (req, res) => {
    const { id } = req.params;
    const success = store_js_1.store.deleteGroup(id);
    if (!success) {
        return (0, response_js_1.sendError)(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, { deleted: true }, 'Group deleted successfully');
};
exports.deleteGroup = deleteGroup;
const addMember = async (req, res) => {
    const { id } = req.params;
    const memberData = req.body;
    if (!memberData.userId || !memberData.name) {
        return (0, response_js_1.sendError)(res, 'Member userId and name are required', 400, 'VALIDATION_ERROR');
    }
    const member = {
        userId: memberData.userId,
        name: memberData.name,
        email: memberData.email || '',
        avatarUrl: memberData.avatarUrl,
        role: memberData.role || 'member',
        joinedAt: new Date().toISOString(),
        netBalance: 0,
    };
    const updated = store_js_1.store.addGroupMember(id, member);
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
    }
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'member_added',
        actorId: req.user?.id || 'usr_me',
        actorName: req.user?.name || 'Alex Johnson',
        title: `Added ${member.name} to "${updated.name}"`,
        description: `New member joined`,
        timestamp: new Date().toISOString(),
        groupId: id,
    });
    return (0, response_js_1.sendSuccess)(res, updated, 'Member added successfully');
};
exports.addMember = addMember;
const removeMember = async (req, res) => {
    const { id, userId } = req.params;
    const updated = store_js_1.store.removeGroupMember(id, userId);
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, updated, 'Member removed successfully');
};
exports.removeMember = removeMember;
