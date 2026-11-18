import {
  CalfRecord,
  CalfStage,
  CalfHealthStatus,
  CalfFeedType,
  CowBreedingRecord,
  CowBreedingStatus,
} from '../types/dairy';
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  addDays,
  subDays,
  subMonths,
  format,
  parseISO,
} from 'date-fns';

export interface StageMeta {
  key: CalfStage;
  label: string;
  hindiLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CALF_STAGES: Record<CalfStage, StageMeta> = {
  milk_fed: {
    key: 'milk_fed',
    label: 'Milk-Fed (0-3 Months)',
    hindiLabel: 'Milk-fed',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  weaned: {
    key: 'weaned',
    label: 'Weaned (3-12 Months)',
    hindiLabel: 'Weaned',
    color: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  heifer: {
    key: 'heifer',
    label: 'Growing Heifer (1-2 Yrs)',
    hindiLabel: 'Future dairy cow',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  bull_calf: {
    key: 'bull_calf',
    label: 'Bull Calf',
    hindiLabel: 'Bull calf',
    color: '#b45309',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  sold: {
    key: 'sold',
    label: 'Sold',
    hindiLabel: 'Sold',
    color: '#475569',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  deceased: {
    key: 'deceased',
    label: 'Deceased',
    hindiLabel: 'Deceased',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
  },
};

export const CALF_FEED_TYPES: Record<CalfFeedType, { label: string; hindiLabel: string; desc: string }> = {
  only_milk: {
    label: 'Mother / Fresh Milk Only',
    hindiLabel: 'Fresh milk only',
    desc: '3 to 4.5 Litres per day divided into Morning and Evening feeds',
  },
  milk_and_starter: {
    label: 'Milk + Calf Starter Concentrate',
    hindiLabel: 'Milk + calf starter',
    desc: '3.0 L milk + 200g-500g high-protein starter pellet + clean water',
  },
  concentrate_and_fodder: {
    label: 'Fodder, Bhusa & Concentrates',
    hindiLabel: 'Fodder + concentrates',
    desc: 'Fully weaned. High energy feed + green berseem/maize fodder',
  },
  grazing: {
    label: 'Pasture / Free Grazing & Feed',
    hindiLabel: 'Grazing + mineral mix',
    desc: 'Grazing in paddock with supplemental mineral cake',
  },
};

export const CALF_BREEDS = [
  'Holstein Friesian (HF)',
  'Jersey',
  'HF Crossbreed',
  'Jersey Crossbreed',
  'Sahiwal',
  'Gir',
  'Murrah Buffalo',
  'Desi / Indigenous',
];

export const CALF_HEALTH_STATUSES: Record<CalfHealthStatus, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy & Active', color: '#16a34a', bgColor: '#dcfce7' },
  vaccinated: { label: 'Vaccinated', color: '#0284c7', bgColor: '#e0f2fe' },
  treatment: { label: 'Under Treatment', color: '#d97706', bgColor: '#fef3c7' },
  sick: { label: 'Sick / Vet Attention', color: '#dc2626', bgColor: '#fee2e2' },
};

export const BREEDING_STATUS_META: Record<
  CowBreedingStatus,
  { label: string; hindiLabel: string; color: string; bgColor: string; borderColor: string; description: string }
> = {
  resting: {
    label: 'Calved & Resting (0-50d)',
    hindiLabel: 'Post-calving rest (0-50 days)',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    description: 'Recovery period after calving. Avoid insemination during this time.',
  },
  heat_ready: {
    label: 'Ready for AI Breeding (50-90d)',
    hindiLabel: 'Ideal time for AI',
    color: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    description: 'The cow may be ready for heat. Arrange AI when heat signs appear.',
  },
  inseminated: {
    label: 'Inseminated (AI Done)',
    hindiLabel: 'Inseminated; confirmation pending',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    description: 'Check for heat again after 21 days and schedule a pregnancy diagnosis after 60 days.',
  },
  confirmed_pregnant: {
    label: 'Confirmed Pregnant',
    hindiLabel: 'Pregnant (about 280 days)',
    color: '#b45309',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    description: 'The cow is pregnant. Provide minerals and begin the dry period around month seven.',
  },
  dry_period: {
    label: 'Dry Period',
    hindiLabel: 'Dry period',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    description: 'Milking has stopped about 60 days before calving to support the next calf.',
  },
  problem: {
    label: 'Repeat Breeder / Checkup',
    hindiLabel: 'Repeat breeder / needs review',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    description: 'Pregnancy has not occurred after repeated AI. Arrange a veterinary examination.',
  },
};

export function calculateCalfAge(dobStr: string): { text: string; totalDays: number; months: number } {
  try {
    const dob = parseISO(dobStr);
    const now = new Date();
    const totalDays = differenceInDays(now, dob);
    if (totalDays < 0) return { text: 'Newborn', totalDays: 0, months: 0 };

    const years = differenceInYears(now, dob);
    const months = differenceInMonths(now, dob);

    if (totalDays < 30) {
      return { text: `${totalDays} days`, totalDays, months: 0 };
    }
    if (months < 12) {
      const remainingDays = totalDays % 30;
      return {
        text: remainingDays > 0 ? `${months} months ${remainingDays} days` : `${months} months`,
        totalDays,
        months,
      };
    }

    const remainingMonths = months % 12;
    return {
      text: remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} years`,
      totalDays,
      months,
    };
  } catch {
    return { text: '—', totalDays: 0, months: 0 };
  }
}

export interface ReproductionCycleAnalysis {
  daysSinceCalving: number;
  restingProgress: number; // 0 to 100
  isRestingOver: boolean;
  isReadyForAI: boolean;
  daysSinceAI: number | null;
  repeatHeatCheckDue: boolean;
  pdCheckDue: boolean;
  isPregnant: boolean;
  gestationDays: number | null;
  gestationProgress: number; // 0 to 100
  pregnancyMonth: number | null;
  daysUntilDelivery: number | null;
  daysUntilDry: number | null;
  predictedNextCalvingDate: string;
  predictedDryDate: string;
  predictedNextHeatDate: string;
  urgentAlert: string | null;
  statusBadge: {
    label: string;
    hindiLabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
  };
}

export function analyzeReproductionCycle(breeding: CowBreedingRecord): ReproductionCycleAnalysis {
  const now = new Date();
  const calvingDate = parseISO(breeding.last_calving_date);
  const daysSinceCalving = Math.max(0, differenceInDays(now, calvingDate));

  const restingProgress = Math.min(100, Math.round((daysSinceCalving / 50) * 100));
  const isRestingOver = daysSinceCalving >= 50;

  let daysSinceAI: number | null = null;
  if (breeding.ai_date) {
    daysSinceAI = Math.max(0, differenceInDays(now, parseISO(breeding.ai_date)));
  }

  // Predicted dates
  const predictedNextHeatDate = breeding.next_heat_expected_date
    ? breeding.next_heat_expected_date
    : breeding.ai_date
    ? format(addDays(parseISO(breeding.ai_date), 21), 'yyyy-MM-dd')
    : format(addDays(calvingDate, 55), 'yyyy-MM-dd');

  // Gestation period: 280 days standard
  const baseInseminationDate = breeding.ai_date ? parseISO(breeding.ai_date) : addDays(calvingDate, 70);
  const predictedNextCalvingDate = breeding.expected_calving_date
    ? breeding.expected_calving_date
    : format(addDays(baseInseminationDate, 280), 'yyyy-MM-dd');

  const predictedDryDate = breeding.expected_dry_date
    ? breeding.expected_dry_date
    : format(subDays(parseISO(predictedNextCalvingDate), 60), 'yyyy-MM-dd');

  const isPregnant = breeding.status === 'confirmed_pregnant' || breeding.is_pregnant === true;

  let gestationDays: number | null = null;
  let gestationProgress = 0;
  let pregnancyMonth: number | null = null;
  let daysUntilDelivery: number | null = null;
  let daysUntilDry: number | null = null;

  if (isPregnant) {
    gestationDays = daysSinceAI ?? Math.max(0, daysSinceCalving - 70);
    gestationProgress = Math.min(100, Math.round((gestationDays / 280) * 100));
    pregnancyMonth = Math.min(9, Math.max(1, Math.ceil(gestationDays / 30)));

    const nextCalv = parseISO(predictedNextCalvingDate);
    daysUntilDelivery = differenceInDays(nextCalv, now);

    const dryDate = parseISO(predictedDryDate);
    daysUntilDry = differenceInDays(dryDate, now);
  }

  const isReadyForAI =
    breeding.status === 'heat_ready' ||
    (isRestingOver && daysSinceCalving <= 120 && !breeding.ai_date && !isPregnant);

  const repeatHeatCheckDue =
    breeding.status === 'inseminated' &&
    daysSinceAI !== null &&
    daysSinceAI >= 18 &&
    daysSinceAI <= 24;

  const pdCheckDue =
    breeding.status === 'inseminated' &&
    daysSinceAI !== null &&
    daysSinceAI >= 60 &&
    !isPregnant;

  let urgentAlert: string | null = null;
  if (repeatHeatCheckDue) {
    urgentAlert = 'Heat watch: It has been 18–24 days since AI. The cow may return to heat; monitor closely.';
  } else if (pdCheckDue) {
    urgentAlert = 'Pregnancy diagnosis due: It has been 60 days since AI. Schedule a veterinary check.';
  } else if (isPregnant && daysUntilDry !== null && daysUntilDry <= 10 && daysUntilDry >= 0) {
    urgentAlert = `Dry period reminder: Calving is approaching. Stop milking within ${daysUntilDry} days.`;
  } else if (isPregnant && daysUntilDelivery !== null && daysUntilDelivery <= 7 && daysUntilDelivery >= 0) {
    urgentAlert = `Calving alert: ${daysUntilDelivery} days remaining. Prepare the calving area and supplies.`;
  } else if (isReadyForAI && !breeding.ai_date) {
    urgentAlert = `AI window: ${daysSinceCalving} days have passed since calving. Consider scheduling AI.`;
  }

  const statusMeta = BREEDING_STATUS_META[breeding.status] || BREEDING_STATUS_META.resting;

  return {
    daysSinceCalving,
    restingProgress,
    isRestingOver,
    isReadyForAI,
    daysSinceAI,
    repeatHeatCheckDue,
    pdCheckDue,
    isPregnant,
    gestationDays,
    gestationProgress,
    pregnancyMonth,
    daysUntilDelivery,
    daysUntilDry,
    predictedNextCalvingDate,
    predictedDryDate,
    predictedNextHeatDate,
    urgentAlert,
    statusBadge: {
      label: statusMeta.label,
      hindiLabel: statusMeta.hindiLabel,
      color: statusMeta.color,
      bgColor: statusMeta.bgColor,
      borderColor: statusMeta.borderColor,
    },
  };
}

export function getCalfFeedingGuide(ageInDays: number, currentWeight?: number) {
  if (ageInDays <= 3) {
    return {
      title: 'Newborn (Day 1–3): Colostrum',
      milkPerDay: currentWeight ? Math.round((currentWeight * 0.1) * 10) / 10 : 3.5,
      frequency: '3 times daily (lukewarm colostrum)',
      feedType: 'Mother’s first milk (colostrum)',
      solidDiet: 'No solid feed. Provide clean, lukewarm water.',
      tips: 'Feed colostrum equal to 10% of body weight within the first hour after birth to support immunity.',
      deworming: 'Apply iodine tincture to the umbilical cord.',
    };
  }
  if (ageInDays <= 30) {
    return {
      title: 'First Month (Day 4–30): Whole Milk and Calf Starter',
      milkPerDay: 4.0,
      frequency: '2.0 L morning + 2.0 L evening (fresh milk)',
      feedType: 'Fresh cow’s milk at body temperature',
      solidDiet: 'Offer 50–100 g of 22% protein calf starter and a small amount of soft hay to support rumen development.',
      tips: 'Feed at consistent times using clean equipment. Keep fresh drinking water available at all times.',
      deworming: 'Give the first deworming treatment between days 7 and 10.',
    };
  }
  if (ageInDays <= 90) {
    return {
      title: 'Months 2–3: Gradually Reduce Milk and Increase Starter',
      milkPerDay: 2.5,
      frequency: '1.5 L morning + 1.0 L evening',
      feedType: 'Gradually reduce milk during weaning',
      solidDiet: 'Offer 500 g–1 kg calf starter and 1–2 kg of soft green fodder such as berseem or oats.',
      tips: 'Weaning can begin when the calf consistently eats 1–1.25 kg of starter per day.',
      deworming: 'Deworm monthly and give the first FMD vaccine at around three months.',
    };
  }
  return {
    title: 'Heifer Growth (Over 3 Months): Fodder and Balanced Feed',
    milkPerDay: 0,
    frequency: 'No milk; fodder and concentrate only',
    feedType: 'Balanced heifer growth ration',
    solidDiet: 'Offer 1.5–2 kg of protein-rich concentrate, 5–10 kg of palatable green fodder, and enough hay.',
    tips: 'Target 280–320 kg by 12–14 months so the heifer can be considered for first AI at the appropriate time.',
    deworming: 'Give the Brucellosis Cotton Strain-19 vaccine once to female calves between 4 and 8 months.',
  };
}

export function generateSampleCalves(): CalfRecord[] {
  const now = new Date();

  return [
    {
      id: 'calf-g1-01',
      tag_number: 'CLF-G1-01',
      name: 'Gauri',
      mother_id: 'G1',
      gender: 'female',
      breed: 'Holstein Friesian (HF)',
      dob: format(subDays(now, 25), 'yyyy-MM-dd'),
      birth_weight: 34,
      current_weight: 52,
      sire_details: 'ABS Sexed Semen Bull #402',
      stage: 'milk_fed',
      health_status: 'healthy',
      milk_intake_liters: 4.0,
      feed_type: 'milk_and_starter',
      colostrum_fed: true,
      deworming_date: format(subDays(now, 10), 'yyyy-MM-dd'),
      vaccines_given: 'Colostrum Day-1, Vitamin A-D3 Tonic',
      notes: 'G1 heifer calf. Healthy and active; drinking 4 L of milk and eating 150 g of starter daily.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'calf-g2-01',
      tag_number: 'CLF-G2-01',
      name: 'Nandi',
      mother_id: 'G2',
      gender: 'male',
      breed: 'HF Crossbreed',
      dob: format(subDays(now, 65), 'yyyy-MM-dd'),
      birth_weight: 31,
      current_weight: 74,
      sire_details: 'Saguna Pedigree HF Bull',
      stage: 'milk_fed',
      health_status: 'vaccinated',
      milk_intake_liters: 2.5,
      feed_type: 'milk_and_starter',
      colostrum_fed: true,
      deworming_date: format(subDays(now, 20), 'yyyy-MM-dd'),
      vaccines_given: 'Albendazole Dewormer, FMD 1st Shot',
      notes: 'G2 bull calf. Milk has been reduced; eating calf starter and fresh berseem well.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'calf-g4-01',
      tag_number: 'CLF-G4-01',
      name: 'Lakshmi',
      mother_id: 'G4',
      gender: 'female',
      breed: 'Jersey Crossbreed',
      dob: format(subMonths(now, 7), 'yyyy-MM-dd'),
      birth_weight: 27,
      current_weight: 135,
      sire_details: 'World Wide Sires Jersey Bull',
      stage: 'weaned',
      health_status: 'healthy',
      milk_intake_liters: 0,
      feed_type: 'concentrate_and_fodder',
      colostrum_fed: true,
      deworming_date: format(subDays(now, 30), 'yyyy-MM-dd'),
      vaccines_given: 'FMD, Black Quarter (BQ), Brucellosis C-19',
      notes: 'G4 heifer. Fully weaned and eating 1.5 kg of concentrate with green fodder daily.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'calf-g6-01',
      tag_number: 'CLF-G6-01',
      name: 'Chanda',
      mother_id: 'G6',
      gender: 'female',
      breed: 'Holstein Friesian (HF)',
      dob: format(subMonths(now, 14), 'yyyy-MM-dd'),
      birth_weight: 35,
      current_weight: 245,
      sire_details: 'Alta Genetics HF Semen',
      stage: 'heifer',
      health_status: 'healthy',
      milk_intake_liters: 0,
      feed_type: 'concentrate_and_fodder',
      colostrum_fed: true,
      deworming_date: format(subDays(now, 45), 'yyyy-MM-dd'),
      vaccines_given: 'Full Annual Herd Vaccination',
      notes: 'G6 heifer weighing 245 kg; preparing for AI with sexed semen at the next heat cycle.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'calf-g1-old',
      tag_number: 'CLF-G1-00',
      name: 'Bholu',
      mother_id: 'G1',
      gender: 'male',
      breed: 'HF Crossbreed',
      dob: format(subMonths(now, 18), 'yyyy-MM-dd'),
      birth_weight: 30,
      current_weight: 210,
      sire_details: 'Local AI Center Bull',
      stage: 'sold',
      health_status: 'healthy',
      milk_intake_liters: 0,
      feed_type: 'concentrate_and_fodder',
      colostrum_fed: true,
      notes: 'Previous G1 calf, sold to a local farmer.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export function generateSampleBreedingRecords(): CowBreedingRecord[] {
  const now = new Date();

  return [
    {
      id: 'breed-g1',
      cow_id: 'G1',
      last_calving_date: format(subDays(now, 25), 'yyyy-MM-dd'),
      status: 'resting',
      last_heat_date: '',
      ai_date: '',
      ai_sire_code: '',
      ai_technician: '',
      expected_calving_date: format(addDays(subDays(now, 25), 350), 'yyyy-MM-dd'),
      expected_dry_date: format(addDays(subDays(now, 25), 290), 'yyyy-MM-dd'),
      next_heat_expected_date: format(addDays(subDays(now, 25), 55), 'yyyy-MM-dd'),
      notes: 'Calved 25 days ago. In the post-calving rest period; first heat may occur around day 55.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g2',
      cow_id: 'G2',
      last_calving_date: format(subDays(now, 65), 'yyyy-MM-dd'),
      status: 'heat_ready',
      last_heat_date: format(subDays(now, 2), 'yyyy-MM-dd'),
      ai_date: '',
      ai_sire_code: 'Planned ABS HF 402',
      ai_technician: 'Dr. Verma',
      expected_calving_date: format(addDays(now, 280), 'yyyy-MM-dd'),
      expected_dry_date: format(addDays(now, 220), 'yyyy-MM-dd'),
      next_heat_expected_date: format(addDays(now, 19), 'yyyy-MM-dd'),
      notes: 'Calved 65 days ago and showing heat signs. Good time to arrange AI.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g4',
      cow_id: 'G4',
      last_calving_date: format(subMonths(now, 7), 'yyyy-MM-dd'),
      status: 'confirmed_pregnant',
      last_heat_date: format(subMonths(now, 4), 'yyyy-MM-dd'),
      ai_date: format(subMonths(now, 4), 'yyyy-MM-dd'),
      ai_sire_code: 'ABS Sexed Semen Bull #512',
      ai_technician: 'Dr. Sharma',
      pd_date: format(subMonths(now, 2), 'yyyy-MM-dd'),
      is_pregnant: true,
      expected_calving_date: format(addDays(subMonths(now, 4), 280), 'yyyy-MM-dd'),
      expected_dry_date: format(addDays(subMonths(now, 4), 220), 'yyyy-MM-dd'),
      notes: 'Pregnancy confirmed at four months. Checked by a veterinarian; expected to calve in about five months.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g6',
      cow_id: 'G6',
      last_calving_date: format(subDays(now, 80), 'yyyy-MM-dd'),
      status: 'inseminated',
      last_heat_date: format(subDays(now, 20), 'yyyy-MM-dd'),
      ai_date: format(subDays(now, 20), 'yyyy-MM-dd'),
      ai_sire_code: 'WWS Jersey Semen #109',
      ai_technician: 'Dr. Verma',
      expected_calving_date: format(addDays(subDays(now, 20), 280), 'yyyy-MM-dd'),
      expected_dry_date: format(addDays(subDays(now, 20), 220), 'yyyy-MM-dd'),
      next_heat_expected_date: format(addDays(subDays(now, 20), 21), 'yyyy-MM-dd'),
      notes: 'AI was performed 20 days ago. Monitor for heat over the next 2–3 days; schedule pregnancy diagnosis at day 60 if needed.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g3',
      cow_id: 'G3',
      last_calving_date: format(subDays(now, 110), 'yyyy-MM-dd'),
      status: 'heat_ready',
      last_heat_date: format(subDays(now, 15), 'yyyy-MM-dd'),
      next_heat_expected_date: format(addDays(now, 6), 'yyyy-MM-dd'),
      notes: 'G3 may return to heat in six days. Keep the semen straw ready.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g7',
      cow_id: 'G7',
      last_calving_date: format(subDays(now, 40), 'yyyy-MM-dd'),
      status: 'resting',
      next_heat_expected_date: format(addDays(now, 15), 'yyyy-MM-dd'),
      notes: 'Recently calved. Check readiness for AI in 15 days.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'breed-g8',
      cow_id: 'G8',
      last_calving_date: format(subDays(now, 140), 'yyyy-MM-dd'),
      status: 'dry_period',
      is_pregnant: true,
      expected_calving_date: format(addDays(now, 45), 'yyyy-MM-dd'),
      expected_dry_date: format(subDays(now, 15), 'yyyy-MM-dd'),
      notes: 'Dry period started. Expected to calve in 45 days; dry-cow mineral mix is being provided.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
