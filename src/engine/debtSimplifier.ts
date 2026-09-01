import type { CalculationStep, CurrencyCode, DebtTransfer, Expense, MemberBalance, Trip } from '../types';

export function calculateMemberBalances(trip: Trip, expenses: Expense[]): MemberBalance[] {
  const memberMap: Record<string, { totalPaid: number; totalShare: number }> = {};

  trip.members.forEach((m) => {
    memberMap[m.id] = { totalPaid: 0, totalShare: 0 };
  });

  expenses.forEach((exp) => {
    // 1. Credit the payer
    if (memberMap[exp.paidById]) {
      memberMap[exp.paidById].totalPaid += exp.baseAmount;
    }

    // 2. Debit the consumers based on splitDetails
    Object.entries(exp.splitDetails).forEach(([memberId, shareAmount]) => {
      if (memberMap[memberId]) {
        memberMap[memberId].totalShare += shareAmount;
      }
    });
  });

  return trip.members.map((m) => {
    const stats = memberMap[m.id] || { totalPaid: 0, totalShare: 0 };
    const net = Math.round((stats.totalPaid - stats.totalShare) * 100) / 100;
    return {
      memberId: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
      totalPaid: Math.round(stats.totalPaid * 100) / 100,
      totalShare: Math.round(stats.totalShare * 100) / 100,
      netBalance: net,
    };
  });
}

/**
 * Greedy Minimum Cash Flow algorithm to minimize debt transfers
 */
export function simplifyDebts(
  balances: MemberBalance[],
  currency: CurrencyCode,
  currencySymbol: string
): DebtTransfer[] {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  balances.forEach((b) => {
    const rounded = Math.round(b.netBalance * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ id: b.memberId, amount: -rounded });
    } else if (rounded > 0.01) {
      creditors.push({ id: b.memberId, amount: rounded });
    }
  });

  // Sort descending by magnitude
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: DebtTransfer[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settled = Math.min(debtor.amount, creditor.amount);
    const roundedSettled = Math.round(settled * 100) / 100;

    if (roundedSettled > 0.01) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: roundedSettled,
        currency,
        currencySymbol,
        isSettled: false,
      });
    }

    debtor.amount -= settled;
    creditor.amount -= settled;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return transfers;
}

/**
 * Generates pairwise calculation breakdown ("A paid for B minus B paid for A")
 */
export function generateCalculationSteps(trip: Trip, expenses: Expense[]): CalculationStep[] {
  const pairMatrix: Record<string, number> = {}; // "idA->idB" => amount A paid that B benefited from

  expenses.forEach((exp) => {
    const payerId = exp.paidById;
    Object.entries(exp.splitDetails).forEach(([beneficiaryId, share]) => {
      if (payerId !== beneficiaryId && share > 0) {
        const key = `${payerId}->${beneficiaryId}`;
        pairMatrix[key] = (pairMatrix[key] || 0) + share;
      }
    });
  });

  const memberMap = new Map(trip.members.map((m) => [m.id, m.name]));
  const steps: CalculationStep[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < trip.members.length; i++) {
    for (let j = i + 1; j < trip.members.length; j++) {
      const idA = trip.members[i].id;
      const idB = trip.members[j].id;

      const pairKey = [idA, idB].sort().join(':');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const aPaidForB = Math.round((pairMatrix[`${idA}->${idB}`] || 0) * 100) / 100;
      const bPaidForA = Math.round((pairMatrix[`${idB}->${idA}`] || 0) * 100) / 100;

      if (aPaidForB > 0 || bPaidForA > 0) {
        steps.push({
          memberA: memberMap.get(idA) || idA,
          memberB: memberMap.get(idB) || idB,
          aPaidForB,
          bPaidForA,
          netOwed: Math.round((aPaidForB - bPaidForA) * 100) / 100,
        });
      }
    }
  }

  return steps;
}
