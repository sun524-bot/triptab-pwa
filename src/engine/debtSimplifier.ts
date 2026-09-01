import type {
  CalculationStep,
  CurrencyCode,
  DebtTransfer,
  Expense,
  MemberBalance,
  PiggyDeposit,
  PiggySummary,
  Trip,
} from '../types';

export function calculateMemberBalances(
  trip: Trip,
  expenses: Expense[],
  piggyDeposits: PiggyDeposit[] = []
): MemberBalance[] {
  const memberMap: Record<
    string,
    {
      totalPaid: number; // out-of-pocket paid
      totalShare: number; // total consumed across all expenses
      piggyDeposited: number; // contributed to piggy bank
      piggyShareConsumed: number; // consumed from piggy bank expenses
    }
  > = {};

  trip.members.forEach((m) => {
    memberMap[m.id] = {
      totalPaid: 0,
      totalShare: 0,
      piggyDeposited: 0,
      piggyShareConsumed: 0,
    };
  });

  // 1. Process Piggy Bank deposits
  piggyDeposits.forEach((dep) => {
    if (memberMap[dep.memberId]) {
      memberMap[dep.memberId].piggyDeposited += dep.baseAmount;
    }
  });

  // 2. Process Expenses
  expenses.forEach((exp) => {
    const isPiggy = exp.paidById === 'piggy-bank';

    // Credit payer if an individual member paid out-of-pocket
    if (!isPiggy && memberMap[exp.paidById]) {
      memberMap[exp.paidById].totalPaid += exp.baseAmount;
    }

    // Debit consumers
    Object.entries(exp.splitDetails).forEach(([memberId, shareAmount]) => {
      if (memberMap[memberId]) {
        memberMap[memberId].totalShare += shareAmount;
        if (isPiggy) {
          memberMap[memberId].piggyShareConsumed += shareAmount;
        }
      }
    });
  });

  // Calculate net balances
  return trip.members.map((m) => {
    const stats = memberMap[m.id] || {
      totalPaid: 0,
      totalShare: 0,
      piggyDeposited: 0,
      piggyShareConsumed: 0,
    };

    // Net Balance: (Deposits + Out-of-pocket) - Total Consumed
    // Positive = Creditor (receives money), Negative = Debtor (owes money)
    const net = Math.round(
      (stats.piggyDeposited + stats.totalPaid - stats.totalShare) * 100
    ) / 100;

    return {
      memberId: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
      totalPaid: Math.round(stats.totalPaid * 100) / 100,
      totalShare: Math.round(stats.totalShare * 100) / 100,
      piggyDeposited: Math.round(stats.piggyDeposited * 100) / 100,
      piggyShareConsumed: Math.round(stats.piggyShareConsumed * 100) / 100,
      netBalance: net,
      cashRefund: 0, // Assigned by calculatePiggySummary
    };
  });
}

/**
 * Smart Cash Reimbursement & Piggy Bank Breakdown
 * If cash remains in the Piggy Bank envelope:
 * 1. Cash first reimburses members who paid out-of-pocket or over-deposited (netBalance > 0);
 * 2. Any surplus cash is refunded;
 * 3. Any remaining unpayable balance generates minimal residual peer-to-peer transfers.
 */
export function calculatePiggySummary(
  trip: Trip,
  expenses: Expense[],
  piggyDeposits: PiggyDeposit[] = []
): PiggySummary {
  const totalDeposited = Math.round(
    piggyDeposits.reduce((sum, d) => sum + d.baseAmount, 0) * 100
  ) / 100;

  const piggyExpenses = expenses.filter((e) => e.paidById === 'piggy-bank');
  const totalSpent = Math.round(
    piggyExpenses.reduce((sum, e) => sum + e.baseAmount, 0) * 100
  ) / 100;

  const remainingCash = Math.round(Math.max(0, totalDeposited - totalSpent) * 100) / 100;

  const balances = calculateMemberBalances(trip, expenses, piggyDeposits);

  const cashRefunds: Record<string, number> = {};
  let availableCash = remainingCash;

  // Step 1: Allocate cash refund to members with positive net balance
  // Sort creditors descending by net balance
  const positiveCreditors = balances
    .filter((b) => b.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);

  // Remaining positive debts after cash allocation
  const adjustedNetBalances: Record<string, number> = {};
  balances.forEach((b) => {
    adjustedNetBalances[b.memberId] = b.netBalance;
  });

  for (const creditor of positiveCreditors) {
    if (availableCash <= 0) break;
    const canPay = Math.min(availableCash, creditor.netBalance);
    const roundedPay = Math.round(canPay * 100) / 100;
    cashRefunds[creditor.memberId] = roundedPay;
    creditor.cashRefund = roundedPay;
    availableCash = Math.round((availableCash - roundedPay) * 100) / 100;
    adjustedNetBalances[creditor.memberId] = Math.round((creditor.netBalance - roundedPay) * 100) / 100;
  }

  // Step 2: If there are still negative debtors (e.g. someone under-deposited or Piggy Bank ran out)
  // Run greedy debt simplification on the remaining adjusted balances
  const adjustedBalances: MemberBalance[] = balances.map((b) => ({
    ...b,
    netBalance: adjustedNetBalances[b.memberId] || 0,
  }));

  const residualTransfers = simplifyDebts(
    adjustedBalances,
    trip.baseCurrency,
    trip.currencySymbol
  );

  return {
    totalDeposited,
    totalSpent,
    remainingCash,
    cashRefunds,
    residualTransfers,
  };
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
    if (payerId === 'piggy-bank') return; // Piggy bank is collective, not pairwise

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
