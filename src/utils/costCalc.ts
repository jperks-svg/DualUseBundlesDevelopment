export interface FieldReduction {
  totalFields: number;
  droppableFields: number;
  securityRequiredFields: number;
  observabilityFields: number;
  guardProtectedFields: number;
  maskableFields: number;
}

export interface CostResult {
  eps: number;
  dailyGB: number;
  monthlyGB: number;
  monthlyCostRaw: number;
  fieldDropPct: number;
  routingReductionPct: number;
  obsRoutingReductionPct: number;
  siemGB: number;
  siemCost: number;
  lakeCost: number;
  optimizedTotal: number;
  savings: number;
  savingsPct: number;
  fieldReduction: FieldReduction;
}

export function calculateFieldReduction(fields: any[]): FieldReduction {
  const totalFields = fields.length;
  const droppableFields = fields.filter(f => f.canDrop === 'Yes').length;
  const securityRequiredFields = fields.filter(f => f.securitySiem === 'Yes').length;
  const observabilityFields = fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes').length;
  const guardProtectedFields = fields.filter(f => f.guardAction && f.guardAction !== 'None').length;
  const maskableFields = fields.filter(f => f.canMask === 'Yes' || f.canMask === 'Sometimes').length;
  return { totalFields, droppableFields, securityRequiredFields, observabilityFields, guardProtectedFields, maskableFields };
}

export function calculateCostSavings(
  eps: number,
  avgEventSizeBytes: number,
  costPerGB: number,
  fieldReduction: FieldReduction,
  lakeCostPerGB = 0.023,
  dailyGBOverride?: number,
): CostResult {
  const dailyGB = dailyGBOverride != null && dailyGBOverride > 0
    ? dailyGBOverride
    : (eps * 86400 * avgEventSizeBytes) / (1024 ** 3);
  const monthlyGB = dailyGB * 30;
  const monthlyCostRaw = monthlyGB * costPerGB;

  const fieldDropPct = fieldReduction.totalFields > 0
    ? Math.round((fieldReduction.droppableFields / fieldReduction.totalFields) * 100)
    : 0;

  const routingReductionPct = fieldReduction.totalFields > 0
    ? Math.round(((fieldReduction.totalFields - fieldReduction.securityRequiredFields) / fieldReduction.totalFields) * 100)
    : 50;

  const obsRoutingReductionPct = fieldReduction.totalFields > 0
    ? Math.round(((fieldReduction.totalFields - fieldReduction.observabilityFields) / fieldReduction.totalFields) * 100)
    : 40;

  const effectiveReduction = Math.min(fieldDropPct + routingReductionPct * 0.6, 85);

  const siemGB = monthlyGB * (1 - effectiveReduction / 100);
  const siemCost = siemGB * costPerGB;
  const lakeCost = monthlyGB * lakeCostPerGB;
  const optimizedTotal = siemCost + lakeCost;
  const savings = monthlyCostRaw - optimizedTotal;
  const savingsPct = monthlyCostRaw > 0 ? (savings / monthlyCostRaw) * 100 : 0;

  return {
    eps, dailyGB, monthlyGB, monthlyCostRaw,
    fieldDropPct, routingReductionPct, obsRoutingReductionPct,
    siemGB, siemCost, lakeCost, optimizedTotal, savings, savingsPct,
    fieldReduction,
  };
}
