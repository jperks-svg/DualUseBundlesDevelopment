import { describe, it, expect } from 'vitest';
import { calculateCostSavings } from './costCalc';

describe('calculateCostSavings', () => {
  it('calculates monthly volume from EPS and event size', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 50);
    // 1000 EPS * 86400 sec/day = 86,400,000 events/day
    // 86,400,000 * 1000 bytes / 1024^3 = ~80.47 GB/day
    // ~80.47 * 30 = ~2413.99 GB/month
    const expectedDaily = (1000 * 86400 * 1000) / (1024 ** 3);
    expect(result.dailyGB).toBeCloseTo(expectedDaily, 2);
    expect(result.monthlyGB).toBeCloseTo(expectedDaily * 30, 2);
  });

  it('calculates raw SIEM cost correctly', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 50);
    // ~2414.8 GB * $3.50 = ~$8451.7
    expect(result.monthlyCostRaw).toBeCloseTo(2414.8 * 3.5, -1);
  });

  it('applies reduction percentage to SIEM volume', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 40);
    // 60% of volume goes to SIEM
    expect(result.siemGB).toBeCloseTo(result.monthlyGB * 0.6, 1);
  });

  it('calculates lake cost at storage tier', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 50);
    // Full volume to lake at $0.023/GB
    expect(result.lakeCost).toBeCloseTo(result.monthlyGB * 0.023, 1);
  });

  it('savings = raw cost - optimized total', () => {
    const result = calculateCostSavings(5000, 800, 4.00, 45);
    expect(result.savings).toBeCloseTo(result.monthlyCostRaw - result.optimizedTotal, 2);
  });

  it('savings percentage is correct', () => {
    const result = calculateCostSavings(5000, 800, 4.00, 45);
    expect(result.savingsPct).toBeCloseTo((result.savings / result.monthlyCostRaw) * 100, 2);
  });

  it('handles 0 EPS without NaN', () => {
    const result = calculateCostSavings(0, 800, 3.50, 50);
    expect(result.monthlyGB).toBe(0);
    expect(result.monthlyCostRaw).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPct).toBe(0);
  });

  it('handles 100% reduction (all to lake, nothing to SIEM)', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 100);
    expect(result.siemGB).toBe(0);
    expect(result.siemCost).toBe(0);
    expect(result.optimizedTotal).toBeCloseTo(result.lakeCost, 2);
  });

  it('handles 0% reduction (no savings from routing)', () => {
    const result = calculateCostSavings(1000, 1000, 3.50, 0);
    expect(result.siemGB).toBeCloseTo(result.monthlyGB, 2);
    // Only savings is the lake cost being cheaper isn't true here—
    // since 0% reduction means all goes to SIEM AND lake
    expect(result.optimizedTotal).toBeGreaterThan(result.monthlyCostRaw);
  });
});
