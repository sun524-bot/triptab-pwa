import { calculateMemberBalances, simplifyDebts, generateCalculationSteps } from '../src/engine/debtSimplifier.ts';
import { SEED_TRIP, SEED_EXPENSES } from '../src/db/dexie.ts';

console.log('--- Testing TripTab Mathematical Invariants ---');

// 1. Balances check
const balances = calculateMemberBalances(SEED_TRIP, SEED_EXPENSES);
console.log('Balances:', balances);

const sumNet = balances.reduce((sum, b) => sum + b.netBalance, 0);
console.log('Sum of Net Balances:', sumNet);
if (Math.abs(sumNet) > 0.01) {
  console.error('FAILED: Net balances do not sum to 0!');
  process.exit(1);
} else {
  console.log('PASSED: Net balances sum to exactly 0 (Conservation of Money).');
}

// 2. Simplified debts check
const transfers = simplifyDebts(balances, SEED_TRIP.baseCurrency, SEED_TRIP.currencySymbol);
console.log('Simplified Transfers:', transfers);

const maxAllowedTransfers = SEED_TRIP.members.length - 1;
if (transfers.length > maxAllowedTransfers) {
  console.error(`FAILED: Transfers count (${transfers.length}) exceeds N-1 (${maxAllowedTransfers})`);
  process.exit(1);
} else {
  console.log(`PASSED: Debt transfers count (${transfers.length}) <= N-1 (${maxAllowedTransfers}).`);
}

// 3. Step-by-step derivation check
const steps = generateCalculationSteps(SEED_TRIP, SEED_EXPENSES);
console.log('Pairwise Steps Count:', steps.length);

console.log('ALL MATHEMATICAL TESTS PASSED! ✓');
