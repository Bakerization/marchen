/**
 * Schedule optimizer — finds the best event date based on vendor availability.
 * MUST_HAVE vendors are required; NICE_TO_HAVE and BACKUP are scored by count.
 */

interface VendorAvailability {
  vendorName: string;
  priority: "MUST_HAVE" | "NICE_TO_HAVE" | "BACKUP";
  availableDates: Date[];
}

interface ScoredDate {
  date: string; // ISO date string (YYYY-MM-DD)
  score: number;
  mustHaveCount: number;
  mustHaveTotal: number;
  niceToHaveCount: number;
  backupCount: number;
  allMustHaveAvailable: boolean;
}

export const findOptimalDates = (
  vendors: VendorAvailability[],
  candidateRange: { start: Date; end: Date },
): ScoredDate[] => {
  const mustHaveVendors = vendors.filter((v) => v.priority === "MUST_HAVE");
  const niceToHaveVendors = vendors.filter((v) => v.priority === "NICE_TO_HAVE");
  const backupVendors = vendors.filter((v) => v.priority === "BACKUP");
  const mustHaveTotal = mustHaveVendors.length;

  // Generate all candidate dates in range
  const dates: Date[] = [];
  const current = new Date(candidateRange.start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(candidateRange.end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Score each date
  const scored: ScoredDate[] = dates.map((date) => {
    const dateStr = date.toISOString().slice(0, 10);

    const isAvailable = (v: VendorAvailability) =>
      v.availableDates.some((d) => d.toISOString().slice(0, 10) === dateStr);

    const mustHaveCount = mustHaveVendors.filter(isAvailable).length;
    const niceToHaveCount = niceToHaveVendors.filter(isAvailable).length;
    const backupCount = backupVendors.filter(isAvailable).length;
    const allMustHaveAvailable = mustHaveCount === mustHaveTotal;

    // Scoring: MUST_HAVE = 10 points each, NICE_TO_HAVE = 3, BACKUP = 1
    const score =
      mustHaveCount * 10 + niceToHaveCount * 3 + backupCount * 1;

    return {
      date: dateStr,
      score,
      mustHaveCount,
      mustHaveTotal,
      niceToHaveCount,
      backupCount,
      allMustHaveAvailable,
    };
  });

  // Sort: all-must-have first, then by score descending
  return scored.sort((a, b) => {
    if (a.allMustHaveAvailable !== b.allMustHaveAvailable) {
      return a.allMustHaveAvailable ? -1 : 1;
    }
    return b.score - a.score;
  });
};
