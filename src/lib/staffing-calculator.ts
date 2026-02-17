/**
 * Staffing calculator — estimates required staff by role based on event scale.
 */

interface StaffingInput {
  maxVendors: number;
  areaSqM?: number;
  expectedVisitors?: number;
  durationHours?: number;
}

interface StaffingRecommendation {
  role: string;
  headcount: number;
  rationale: string;
}

export const calculateStaffing = (input: StaffingInput): StaffingRecommendation[] => {
  const vendors = input.maxVendors;
  const visitors = input.expectedVisitors ?? vendors * 100; // rough estimate
  const hours = input.durationHours ?? 6;

  const recommendations: StaffingRecommendation[] = [
    {
      role: "受付",
      headcount: Math.max(2, Math.ceil(vendors / 15)),
      rationale: `出店者${vendors}組に対し受付${Math.max(2, Math.ceil(vendors / 15))}名`,
    },
    {
      role: "誘導・案内",
      headcount: Math.max(2, Math.ceil(visitors / 200)),
      rationale: `想定来場者${visitors}名に対し誘導${Math.max(2, Math.ceil(visitors / 200))}名`,
    },
    {
      role: "設営・撤収",
      headcount: Math.max(4, Math.ceil(vendors / 5)),
      rationale: `出店者${vendors}組のテント設営に${Math.max(4, Math.ceil(vendors / 5))}名`,
    },
    {
      role: "本部・統括",
      headcount: Math.max(2, Math.ceil(vendors / 20)),
      rationale: "イベント全体の管理・緊急対応",
    },
    {
      role: "救護",
      headcount: visitors > 500 ? 2 : 1,
      rationale: `来場者${visitors}名規模の救護対応`,
    },
  ];

  // Add parking if area is large
  if (input.areaSqM && input.areaSqM > 1000) {
    recommendations.push({
      role: "駐車場",
      headcount: Math.ceil(input.areaSqM / 2000),
      rationale: `会場面積${input.areaSqM}m²の駐車場管理`,
    });
  }

  // Adjust for long events (add shift relief)
  if (hours > 8) {
    return recommendations.map((r) => ({
      ...r,
      headcount: Math.ceil(r.headcount * 1.5),
      rationale: `${r.rationale}（${hours}時間の長時間開催のため交代要員含む）`,
    }));
  }

  return recommendations;
};
