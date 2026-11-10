"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateBalances = void 0;
const store_js_1 = require("../data/store.js");
const recalculateBalances = (currentUserId = 'usr_me') => {
    const expenses = store_js_1.store.getExpenses();
    const settlements = store_js_1.store.getSettlements();
    const groups = store_js_1.store.getGroups();
    const friends = store_js_1.store.getFriends();
    // 1. Recalculate group balances
    for (const group of groups) {
        const groupExpenses = expenses.filter(e => e.groupId === group.id);
        const groupSettlements = settlements.filter(s => s.groupId === group.id && s.status === 'CONFIRMED');
        const totalSpending = groupExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
        // Calculate each member's net balance in the group
        const memberBalances = {};
        for (const member of group.members) {
            memberBalances[member.userId] = 0;
        }
        for (const exp of groupExpenses) {
            for (const p of exp.participants) {
                memberBalances[p.userId] = (memberBalances[p.userId] || 0) + (p.paidAmount - p.shareAmount);
            }
        }
        for (const s of groupSettlements) {
            memberBalances[s.payerId] = (memberBalances[s.payerId] || 0) + s.amount;
            memberBalances[s.receiverId] = (memberBalances[s.receiverId] || 0) - s.amount;
        }
        const updatedMembers = group.members.map(m => ({
            ...m,
            netBalance: Math.round((memberBalances[m.userId] || 0) * 100) / 100,
        }));
        const userBalance = Math.round((memberBalances[currentUserId] || 0) * 100) / 100;
        store_js_1.store.updateGroup(group.id, {
            totalSpending,
            userBalance,
            members: updatedMembers,
            membersCount: updatedMembers.length,
        });
    }
    // 2. Recalculate friend balances
    for (const friend of friends) {
        let balance = 0;
        // Direct and group expenses involving this friend and current user
        for (const exp of expenses) {
            const userPart = exp.participants.find(p => p.userId === currentUserId);
            const friendPart = exp.participants.find(p => p.userId === friend.userId);
            if (userPart && friendPart) {
                // If current user paid for friend
                if (userPart.paidAmount > 0) {
                    balance += friendPart.shareAmount;
                }
                // If friend paid for current user
                if (friendPart.paidAmount > 0) {
                    balance -= userPart.shareAmount;
                }
            }
        }
        // Settlements between current user and friend
        for (const s of settlements) {
            if (s.status === 'CONFIRMED') {
                if (s.payerId === friend.userId && s.receiverId === currentUserId) {
                    balance -= s.amount;
                }
                else if (s.payerId === currentUserId && s.receiverId === friend.userId) {
                    balance += s.amount;
                }
            }
        }
        store_js_1.store.updateFriend(friend.id, {
            netBalance: Math.round(balance * 100) / 100,
        });
    }
};
exports.recalculateBalances = recalculateBalances;
