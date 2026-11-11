"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenseById = exports.getExpenses = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const balance_service_js_1 = require("../services/balance.service.js");
const index_js_1 = require("../services/providers/index.js");
const getExpenses = async (req, res) => {
    const { groupId } = req.query;
    const expenses = store_js_1.store.getExpenses(groupId);
    return (0, response_js_1.sendSuccess)(res, expenses);
};
exports.getExpenses = getExpenses;
const getExpenseById = async (req, res) => {
    const { id } = req.params;
    const expense = store_js_1.store.findExpenseById(id);
    if (!expense) {
        return (0, response_js_1.sendError)(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, expense);
};
exports.getExpenseById = getExpenseById;
const createExpense = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const data = req.body;
    if (!data.title || !data.totalAmount) {
        return (0, response_js_1.sendError)(res, 'Expense title and total amount are required', 400, 'VALIDATION_ERROR');
    }
    const group = data.groupId ? store_js_1.store.findGroupById(data.groupId) : undefined;
    const newExpense = {
        id: `exp_${Date.now()}`,
        title: data.title.trim(),
        totalAmount: Number(data.totalAmount),
        currency: data.currency || group?.currency || req.user?.defaultCurrency || 'INR',
        date: data.date || new Date().toISOString(),
        category: data.category || 'Other',
        groupId: data.groupId || null,
        groupName: data.groupName || group?.name,
        notes: data.notes,
        receiptUri: data.receiptUri,
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
        splitMethod: data.splitMethod || 'EQUAL',
        participants: data.participants || [],
        commentsCount: 0,
        comments: [],
    };
    store_js_1.store.createExpense(newExpense);
    // Recalculate group and friend balances
    (0, balance_service_js_1.recalculateBalances)(currentUserId);
    // Send push notification to other participants dynamically (never to the creator)
    const creatorName = (req.user?.name || '').toLowerCase().trim();
    for (const p of newExpense.participants) {
        const isCreator = p.userId === currentUserId ||
            (creatorName && (p.name || '').toLowerCase().trim() === creatorName);
        if (!isCreator && p.shareAmount > 0) {
            index_js_1.notificationProvider.sendPush({
                userId: p.userId,
                type: 'expense_added',
                title: `New Expense: ${newExpense.title}`,
                body: `${req.user?.name || 'A group member'} added "${newExpense.title}". Your share is ${newExpense.currency} ${p.shareAmount.toLocaleString()}`,
                actionData: { expenseId: newExpense.id, groupId: newExpense.groupId || '' },
            });
        }
    }
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'expense_created',
        actorId: currentUserId,
        actorName: req.user?.name || 'Alex Johnson',
        title: `Added "${newExpense.title}"`,
        description: `Total: ${newExpense.currency} ${newExpense.totalAmount.toLocaleString()}`,
        timestamp: new Date().toISOString(),
        amount: newExpense.totalAmount,
        currency: newExpense.currency,
        groupId: newExpense.groupId || undefined,
        expenseId: newExpense.id,
    });
    return (0, response_js_1.sendSuccess)(res, newExpense, 'Expense created successfully', 201);
};
exports.createExpense = createExpense;
const canModifyExpense = (expense, user) => {
    if (!user)
        return false;
    const currentUserId = user.id;
    const currentUserName = (user.name || '').toLowerCase().trim();
    // 1. Creator of the expense
    if (expense.createdBy === currentUserId)
        return true;
    if (currentUserName && (expense.createdBy || '').toLowerCase().trim() === currentUserName)
        return true;
    // 2. Main payer of the expense (the person who paid money up front)
    const isPayer = expense.participants.some(p => {
        if (p.paidAmount > 0) {
            if (p.userId === currentUserId)
                return true;
            if (currentUserName && (p.name || '').toLowerCase().trim() === currentUserName)
                return true;
        }
        return false;
    });
    return isPayer;
};
const updateExpense = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const existing = store_js_1.store.findExpenseById(id);
    if (!existing) {
        return (0, response_js_1.sendError)(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
    }
    // Security check: Only creator or payer can edit
    if (!canModifyExpense(existing, req.user)) {
        return (0, response_js_1.sendError)(res, 'Access Denied: You do not have permission to modify this expense. Only the member who created or paid for this expense can edit it.', 403, 'FORBIDDEN');
    }
    const updated = store_js_1.store.updateExpense(id, updates);
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
    }
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'expense_updated',
        actorId: req.user?.id || 'usr_me',
        actorName: req.user?.name || 'Alex Johnson',
        title: `Updated "${updated.title}"`,
        description: `Total: ${updated.currency} ${updated.totalAmount.toLocaleString()}`,
        timestamp: new Date().toISOString(),
        amount: updated.totalAmount,
        currency: updated.currency,
        groupId: updated.groupId || undefined,
        expenseId: id,
    });
    return (0, response_js_1.sendSuccess)(res, updated, 'Expense updated successfully');
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    const { id } = req.params;
    const target = store_js_1.store.findExpenseById(id);
    if (!target) {
        return (0, response_js_1.sendError)(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
    }
    // Security check: Only creator or payer can delete
    if (!canModifyExpense(target, req.user)) {
        return (0, response_js_1.sendError)(res, 'Access Denied: You do not have permission to delete this expense. Only the member who created or paid for this expense can delete it.', 403, 'FORBIDDEN');
    }
    store_js_1.store.deleteExpense(id);
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'expense_deleted',
        actorId: req.user?.id || 'usr_me',
        actorName: req.user?.name || 'Alex Johnson',
        title: `Deleted "${target.title}"`,
        description: 'Expense was removed',
        timestamp: new Date().toISOString(),
    });
    return (0, response_js_1.sendSuccess)(res, { deleted: true }, 'Expense deleted successfully');
};
exports.deleteExpense = deleteExpense;
const addComment = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
        return (0, response_js_1.sendError)(res, 'Comment text is required', 400, 'VALIDATION_ERROR');
    }
    const comment = {
        id: `c_${Date.now()}`,
        expenseId: id,
        userId: req.user?.id || 'usr_me',
        userName: req.user?.name || 'Alex Johnson',
        userAvatar: req.user?.avatarUrl,
        text: text.trim(),
        createdAt: new Date().toISOString(),
    };
    const updated = store_js_1.store.addCommentToExpense(id, comment);
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, updated, 'Comment added successfully');
};
exports.addComment = addComment;
