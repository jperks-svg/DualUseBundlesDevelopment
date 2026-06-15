export interface CostResult {
  eps: number;
  dailyGB: number;
  monthlyGB: number;
  monthlyCostRaw: number;
  reductionPct: number;
  siemGB: number;
  siemCost: number;
  lakeCost: number;
  optimizedTotal: number;
  savings: number;
  savingsPct: number;
}

export function calculateCostSavings(
  eps: number,
  avgEventSizeBytes: number,
  costPerGB: number,
  reductionPct: number,
  lakeCostPerGB = 0.023,
): CostResult {
  const dailyEvents = eps * 86400;
  const dailyGB = (dailyEvents * avgEventSizeBytes) / (1024 ** 3);
  const monthlyGB = dailyGB * 30;
  const monthlyCostRaw = monthlyGB * costPerGB;

  const siemGB = monthlyGB * (1 - reductionPct / 100);
  const siemCost = siemGB * costPerGB;
  const lakeCost = monthlyGB * lakeCostPerGB;
  const optimizedTotal = siemCost + lakeCost;
  const savings = monthlyCostRaw - optimizedTotal;
  const savingsPct = monthlyCostRaw > 0 ? (savings / monthlyCostRaw) * 100 : 0;

  return {
    eps, dailyGB, monthlyGB, monthlyCostRaw,
    reductionPct, siemGB, siemCost, lakeCost, optimizedTotal, savings, savingsPct,
  };
}
