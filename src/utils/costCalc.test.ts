import { describe, it, expect } from 'vitest';
import { calculateCostSavings, calculateFieldReduction, FieldReduction } from './costCalc';

function makeReduction(overrides: Partial<FieldReduction> = {}): FieldReduction {
  return {
    totalFields: 16,
    droppableFields: 4,
    securityRequiredFields: 10,
    observabilityFields: 8,
    guardProtectedFields: 5,
    maskableFields: 6,
    ...overrides,
  };
}

describe('calculateFieldReduction', () => {
  it('counts field categories from raw field array', () => {
    const fields = [
      { field: 'a', securitySiem: 'Yes', observability: 'Yes', canDrop: 'Yes', canMask: 'Yes', guardAction: 'Mask' },
      { field: 'b', securitySiem: 'Yes', observability: 'No', canDrop: 'No', canMask: 'No', guardAction: 'None' },
      { field: 'c', securitySiem: 'No', observability: 'Sometimes', canDrop: 'No', canMask: 'Sometimes', guardAction: 'Tag' },
      { field: 'd', securitySiem: 'No', observability: 'No', canDrop: 'Yes', canMask: 'No', guardAction: 'None' },
    ];
    const r = calculateFieldReduction(fields);
    expect(r.totalFields).toBe(4);
    expect(r.droppableFields).toBe(2);
    expect(r.securityRequiredFields).toBe(2);
    expect(r.observabilityFields).toBe(2);
    expect(r.guardProtectedFields).toBe(2);
    expect(r.maskableFields).toBe(2);
  });
});

describe('calculateCostSavings', () => {
  it('calculates monthly volume from EPS and event size', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction());
    const expectedDaily = (1000 * 86400 * 1000) / (1024 ** 3);
    expect(result.dailyGB).toBeCloseTo(expectedDaily, 2);
    expect(result.monthlyGB).toBeCloseTo(expectedDaily * 30, 2);
  });

  it('calculates raw SIEM cost correctly', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction());
    expect(result.monthlyCostRaw).toBeCloseTo(result.monthlyGB * 3.5, 1);
  });

  it('field drop percentage derived from droppable fields', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction({ totalFields: 20, droppableFields: 6 }));
    expect(result.fieldDropPct).toBe(30);
  });

  it('routing reduction based on non-security fields', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction({ totalFields: 20, securityRequiredFields: 8 }));
    expect(result.routingReductionPct).toBe(60);
  });

  it('calculates lake cost at storage tier', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction());
    expect(result.lakeCost).toBeCloseTo(result.monthlyGB * 0.023, 1);
  });

  it('savings = raw cost - optimized total', () => {
    const result = calculateCostSavings(5000, 800, 4.00, makeReduction());
    expect(result.savings).toBeCloseTo(result.monthlyCostRaw - result.optimizedTotal, 2);
  });

  it('savings percentage is correct', () => {
    const result = calculateCostSavings(5000, 800, 4.00, makeReduction());
    expect(result.savingsPct).toBeCloseTo((result.savings / result.monthlyCostRaw) * 100, 2);
  });

  it('handles 0 EPS without NaN', () => {
    const result = calculateCostSavings(0, 800, 3.50, makeReduction());
    expect(result.monthlyGB).toBe(0);
    expect(result.monthlyCostRaw).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPct).toBe(0);
  });

  it('handles empty fields (no field data available)', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, makeReduction({ totalFields: 0, droppableFields: 0, securityRequiredFields: 0 }));
    expect(result.fieldDropPct).toBe(0);
    expect(result.routingReductionPct).toBe(50);
  });
});
