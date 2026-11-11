"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSettlement = exports.confirmSettlement = exports.recordSettlement = exports.getSettlements = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const balance_service_js_1 = require("../services/balance.service.js");
const index_js_1 = require("../services/providers/index.js");
const getSettlements = async (req, res) => {
    const { groupId } = req.query;
    const settlements = store_js_1.store.getSettlements(groupId);
    return (0, response_js_1.sendSuccess)(res, settlements);
};
exports.getSettlements = getSettlements;
const recordSettlement = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const data = req.body;
    if (!data.payerId || !data.receiverId || !data.amount) {
        return (0, response_js_1.sendError)(res, 'Payer, receiver, and amount are required', 400, 'VALIDATION_ERROR');
    }
    const group = data.groupId ? store_js_1.store.findGroupById(data.groupId) : undefined;
    const newSettlement = {
        id: `set_${Date.now()}`,
        groupId: data.groupId || null,
        groupName: data.groupName || group?.name,
        payerId: data.payerId,
        payerName: data.payerName,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        amount: Number(data.amount),
        currency: data.currency || group?.currency || req.user?.defaultCurrency || 'INR',
        date: data.date || new Date().toISOString(),
        paymentMethod: data.paymentMethod || 'UPI',
        status: data.status || 'CONFIRMED',
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        receiptUri: data.receiptUri,
        createdAt: new Date().toISOString(),
    };
    store_js_1.store.createSettlement(newSettlement);
    (0, balance_service_js_1.recalculateBalances)(currentUserId);
    // Send push notification ONLY to payment receiver (never to the payer themselves)
    const isPayerTheReceiver = newSettlement.receiverId === currentUserId ||
        (req.user?.name && newSettlement.receiverName.toLowerCase().trim() === req.user.name.toLowerCase().trim());
    if (!isPayerTheReceiver) {
        index_js_1.notificationProvider.sendPush({
            userId: newSettlement.receiverId,
            type: 'payment_received',
            title: 'Payment Received!',
            body: `${newSettlement.payerName} paid you ${newSettlement.currency} ${newSettlement.amount.toLocaleString()} via ${newSettlement.paymentMethod}`,
            actionData: { settlementId: newSettlement.id, groupId: newSettlement.groupId || '' },
        });
    }
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'settlement_recorded',
        actorId: currentUserId,
        actorName: req.user?.name || 'Alex Johnson',
        title: 'Payment recorded',
        description: `${newSettlement.payerName} paid ${newSettlement.receiverName} ${newSettlement.currency} ${newSettlement.amount}`,
        timestamp: new Date().toISOString(),
        amount: newSettlement.amount,
        currency: newSettlement.currency,
        groupId: newSettlement.groupId || undefined,
    });
    return (0, response_js_1.sendSuccess)(res, newSettlement, 'Settlement recorded successfully', 201);
};
exports.recordSettlement = recordSettlement;
const confirmSettlement = async (req, res) => {
    const { id } = req.params;
    const updated = store_js_1.store.updateSettlementStatus(id, 'CONFIRMED');
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Settlement ${id} not found`, 404, 'SETTLEMENT_NOT_FOUND');
    }
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    // Log activity
    store_js_1.store.createActivity({
        id: `act_${Date.now()}`,
        type: 'settlement_confirmed',
        actorId: req.user?.id || 'usr_me',
        actorName: req.user?.name || 'Alex Johnson',
        title: 'Payment confirmed',
        description: `${updated.payerName} paid ${updated.receiverName} ${updated.currency} ${updated.amount}`,
        timestamp: new Date().toISOString(),
        amount: updated.amount,
        currency: updated.currency,
        groupId: updated.groupId || undefined,
    });
    return (0, response_js_1.sendSuccess)(res, updated, 'Settlement confirmed successfully');
};
exports.confirmSettlement = confirmSettlement;
const rejectSettlement = async (req, res) => {
    const { id } = req.params;
    const updated = store_js_1.store.updateSettlementStatus(id, 'REJECTED');
    if (!updated) {
        return (0, response_js_1.sendError)(res, `Settlement ${id} not found`, 404, 'SETTLEMENT_NOT_FOUND');
    }
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    return (0, response_js_1.sendSuccess)(res, updated, 'Settlement rejected');
};
exports.rejectSettlement = rejectSettlement;
