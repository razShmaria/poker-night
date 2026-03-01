import type { PlayerBalance, Transfer } from "../types";

export interface SettlementInput {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  totalBuyIns: number;
  finalChips: number;
}

/** Convert chip count to money value */
function chipsToMoney(chips: number, buyInAmount: number, chipRatio: number): number {
  return chips * (buyInAmount / chipRatio);
}

/**
 * Calculate each player's net balance in ₪.
 * Positive = won money, Negative = lost money.
 * Optionally splits hosting cost: winners pay proportionally to winnings.
 */
export function calculatePlayerBalances(
  players: SettlementInput[],
  buyInAmount: number,
  chipRatio: number,
  hostCost: number = 0
): PlayerBalance[] {
  const balances: PlayerBalance[] = players.map((p) => {
    const totalSpent = p.totalBuyIns * buyInAmount;
    const finalChipsWorth = chipsToMoney(p.finalChips, buyInAmount, chipRatio);
    const netBalance = finalChipsWorth - totalSpent;
    return {
      playerId: p.playerId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      totalSpent,
      finalChipsWorth,
      netBalance,
    };
  });

  if (hostCost > 0) {
    const winners = balances.filter((b) => b.netBalance > 0);
    const totalWinnings = winners.reduce((sum, b) => sum + b.netBalance, 0);

    if (totalWinnings > 0) {
      // Winners pay hosting proportionally to their winnings
      balances.forEach((b) => {
        if (b.netBalance > 0) {
          b.netBalance -= (b.netBalance / totalWinnings) * hostCost;
        }
      });
    } else {
      // Edge case: no winners → split equally
      const share = hostCost / balances.length;
      balances.forEach((b) => {
        b.netBalance -= share;
      });
    }
  }

  return balances;
}

/**
 * Greedy min-transactions settlement algorithm.
 * Matches largest creditor with largest debtor iteratively.
 */
export function calculateTransfers(balances: PlayerBalance[]): Transfer[] {
  const SCALE = 100; // work in agorot to avoid floating-point issues

  const creditors = balances
    .filter((b) => b.netBalance > 0.005)
    .map((b) => ({ ...b, amount: Math.round(b.netBalance * SCALE) }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.netBalance < -0.005)
    .map((b) => ({ ...b, amount: Math.round(Math.abs(b.netBalance) * SCALE) }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      transfers.push({
        fromId: debtor.playerId,
        fromName: debtor.name,
        toId: creditor.playerId,
        toName: creditor.name,
        amount: Math.round(amount) / SCALE,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount <= 0) ci++;
    if (debtor.amount <= 0) di++;
  }

  return transfers;
}

/**
 * Validate chip conservation: total distributed chips ≈ total collected chips.
 */
export function validateChips(
  players: Array<{ totalBuyIns: number; finalChips: number | null }>,
  chipRatio: number,
  tolerance = 5
): { valid: boolean; distributed: number; collected: number; diff: number } {
  const distributed = players.reduce((sum, p) => sum + p.totalBuyIns * chipRatio, 0);
  const collected = players.reduce((sum, p) => sum + (p.finalChips ?? 0), 0);
  const diff = Math.abs(distributed - collected);
  return { valid: diff <= tolerance, distributed, collected, diff };
}
