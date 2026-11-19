import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Heart,
  Plus,
  Trash2,
  Edit2,
  Search,
  Calendar,
  Baby,
  Milk,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
  Filter,
  RefreshCw,
  X,
  ShieldCheck,
  CalendarDays,
  Award,
} from 'lucide-react';
import {
  CalfRecord,
  CalfRecordInput,
  CalfStage,
  CalfGender,
  CalfFeedType,
  CalfHealthStatus,
  CowBreedingRecord,
  CowBreedingInput,
  CowBreedingStatus,
  CowOffspringSummary,
} from '../types/dairy';
import {
  fetchCalves,
  saveCalf,
  deleteCalf,
  fetchBreedingRecords,
  saveBreedingRecord,
} from '../lib/supabase';
import {
  CALF_STAGES,
  CALF_FEED_TYPES,
  CALF_BREEDS,
  CALF_HEALTH_STATUSES,
  BREEDING_STATUS_META,
  calculateCalfAge,
  analyzeReproductionCycle,
  getCalfFeedingGuide,
} from '../lib/calfData';

type ActiveTab = 'calves' | 'mothers' | 'breeding' | 'feeding';

export const CalfManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calves');
  const [calves, setCalves] = useState<CalfRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<CowBreedingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const cowList = useMemo(() => Array.from(new Set([
    ...calves.map(calf => calf.mother_id),
    ...breedingRecords.map(record => record.cow_id),
  ].filter(Boolean))).sort(), [calves, breedingRecords]);

  // Filters for Calves Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMother, setFilterMother] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Modals
  const [isCalfModalOpen, setIsCalfModalOpen] = useState(false);
  const [editingCalf, setEditingCalf] = useState<CalfRecord | null>(null);
  const [isBreedingModalOpen, setIsBreedingModalOpen] = useState(false);
  const [editingBreeding, setEditingBreeding] = useState<CowBreedingRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State - Calf
  const [formTag, setFormTag] = useState('');
  const [formName, setFormName] = useState('');
  const [formMotherId, setFormMotherId] = useState('');
  const [formGender, setFormGender] = useState<CalfGender>('female');
  const [formBreed, setFormBreed] = useState(CALF_BREEDS[0]);
  const [formDob, setFormDob] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formBirthWeight, setFormBirthWeight] = useState('');
  const [formCurrentWeight, setFormCurrentWeight] = useState('');
  const [formSire, setFormSire] = useState('');
  const [formStage, setFormStage] = useState<CalfStage>('milk_fed');
  const [formHealth, setFormHealth] = useState<CalfHealthStatus>('healthy');
  const [formMilkIntake, setFormMilkIntake] = useState('4.0');
  const [formFeedType, setFormFeedType] = useState<CalfFeedType>('milk_and_starter');
  const [formColostrumFed, setFormColostrumFed] = useState(true);
  const [formDewormingDate, setFormDewormingDate] = useState('');
  const [formVaccines, setFormVaccines] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State - Breeding
  const [bFormCowId, setBFormCowId] = useState('');
  const [bFormLastCalvingDate, setBFormLastCalvingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bFormStatus, setBFormStatus] = useState<CowBreedingStatus>('resting');
  const [bFormLastHeatDate, setBFormLastHeatDate] = useState('');
  const [bFormAiDate, setBFormAiDate] = useState('');
  const [bFormAiSireCode, setBFormAiSireCode] = useState('');
  const [bFormAiTechnician, setBFormAiTechnician] = useState('');
  const [bFormPdDate, setBFormPdDate] = useState('');
  const [bFormIsPregnant, setBFormIsPregnant] = useState(false);
  const [bFormNotes, setBFormNotes] = useState('');

  // Selected feeding guide age for interactive simulator
  const [guideAgeDays, setGuideAgeDays] = useState<number>(20);

  // Load data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [calvesRes, breedRes] = await Promise.all([
        fetchCalves(),
        fetchBreedingRecords(),
      ]);

      setCalves(calvesRes.data);
      setBreedingRecords(breedRes.data);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = calves.length;
    const femaleHeifers = calves.filter(c => c.gender === 'female' && c.stage !== 'sold' && c.stage !== 'deceased').length;
    const maleCalves = calves.filter(c => c.gender === 'male' && c.stage !== 'sold' && c.stage !== 'deceased').length;
    const milkFed = calves.filter(c => c.stage === 'milk_fed').length;
    const totalDailyMilkFed = calves
      .filter(c => c.stage === 'milk_fed')
      .reduce((sum, c) => sum + (c.milk_intake_liters || 0), 0);

    const readyForAI = breedingRecords.filter(b => b.status === 'heat_ready').length;
    const pregnantCount = breedingRecords.filter(b => b.status === 'confirmed_pregnant' || b.is_pregnant).length;

    return {
      total,
      femaleHeifers,
      maleCalves,
      milkFed,
      totalDailyMilkFed,
      readyForAI,
      pregnantCount,
    };
  }, [calves, breedingRecords]);

  // Mother Cows & Offspring Summaries
  const motherSummaries: CowOffspringSummary[] = useMemo(() => {
    return cowList.map(cowId => {
      const motherCalves = calves.filter(c => c.mother_id === cowId);
      const femaleCount = motherCalves.filter(c => c.gender === 'female').length;
      const maleCount = motherCalves.filter(c => c.gender === 'male').length;
      const activeCount = motherCalves.filter(c => c.stage !== 'sold' && c.stage !== 'deceased').length;
      const breedRecord = breedingRecords.find(b => b.cow_id === cowId);

      // Latest calf DOB
      const sorted = [...motherCalves].sort((a, b) => b.dob.localeCompare(a.dob));
      const lastCalving = sorted[0]?.dob || breedRecord?.last_calving_date;

      return {
        cow_id: cowId,
        cow_name: `Cow ${cowId}`,
        total_calves: motherCalves.length,
        female_calves: femaleCount,
        male_calves: maleCount,
        active_calves: activeCount,
        calves: sorted,
        last_calving_date: lastCalving,
        breeding_record: breedRecord,
      };
    });
  }, [cowList, calves, breedingRecords]);

  // Filtered calves list
  const filteredCalves = useMemo(() => {
    return calves.filter(calf => {
      if (filterMother !== 'all' && calf.mother_id !== filterMother) return false;
      if (filterStage !== 'all' && calf.stage !== filterStage) return false;
      if (filterGender !== 'all' && calf.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTag = calf.tag_number.toLowerCase().includes(query);
        const matchesName = calf.name.toLowerCase().includes(query);
        const matchesMother = calf.mother_id.toLowerCase().includes(query);
        const matchesBreed = calf.breed.toLowerCase().includes(query);
        if (!matchesTag && !matchesName && !matchesMother && !matchesBreed) return false;
      }
      return true;
    });
  }, [calves, filterMother, filterStage, filterGender, searchQuery]);

  // Handle open calf modal
  const handleOpenAddCalf = (defaultMother?: string) => {
    setEditingCalf(null);
    setFormTag(`CLF-${(defaultMother || 'NEW')}-${String(calves.length + 1).padStart(2, '0')}`);
    setFormName('');
    setFormMotherId(defaultMother || '');
    setFormGender('female');
    setFormBreed(CALF_BREEDS[0]);
    setFormDob(format(new Date(), 'yyyy-MM-dd'));
    setFormBirthWeight('32');
    setFormCurrentWeight('36');
    setFormSire('');
    setFormStage('milk_fed');
    setFormHealth('healthy');
    setFormMilkIntake('4.0');
    setFormFeedType('milk_and_starter');
    setFormColostrumFed(true);
    setFormDewormingDate('');
    setFormVaccines('Colostrum Day 1');
    setFormNotes('');
    setFormError(null);
    setIsCalfModalOpen(true);
  };

  const handleOpenEditCalf = (calf: CalfRecord) => {
    setEditingCalf(calf);
    setFormTag(calf.tag_number);
    setFormName(calf.name);
    setFormMotherId(calf.mother_id);
    setFormGender(calf.gender);
    setFormBreed(calf.breed);
    setFormDob(calf.dob);
    setFormBirthWeight(calf.birth_weight ? String(calf.birth_weight) : '');
    setFormCurrentWeight(calf.current_weight ? String(calf.current_weight) : '');
    setFormSire(calf.sire_details || '');
    setFormStage(calf.stage);
    setFormHealth(calf.health_status);
    setFormMilkIntake(calf.milk_intake_liters != null ? String(calf.milk_intake_liters) : '0');
    setFormFeedType(calf.feed_type || 'milk_and_starter');
    setFormColostrumFed(calf.colostrum_fed !== false);
    setFormDewormingDate(calf.deworming_date || '');
    setFormVaccines(calf.vaccines_given || '');
    setFormNotes(calf.notes || '');
    setFormError(null);
    setIsCalfModalOpen(true);
  };

  // Handle save calf
  const handleSaveCalf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTag.trim()) {
      setFormError('Please enter the calf tag number.');
      return;
    }
    if (!formMotherId) {
      setFormError('Please select the mother cow.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const input: CalfRecordInput = {
      id: editingCalf?.id,
      tag_number: formTag.trim(),
      name: formName.trim() || formTag.trim(),
      mother_id: formMotherId,
      gender: formGender,
      breed: formBreed,
      dob: formDob,
      birth_weight: formBirthWeight ? parseFloat(formBirthWeight) : undefined,
      current_weight: formCurrentWeight ? parseFloat(formCurrentWeight) : undefined,
      sire_details: formSire.trim() || undefined,
      stage: formStage,
      health_status: formHealth,
      milk_intake_liters: formMilkIntake ? parseFloat(formMilkIntake) : 0,
      feed_type: formFeedType,
      colostrum_fed: formColostrumFed,
      deworming_date: formDewormingDate || undefined,
      vaccines_given: formVaccines.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    const res = await saveCalf(input);
    setIsSaving(false);

    if (res.success) {
      setIsCalfModalOpen(false);
      loadAllData();
    } else {
      setFormError(res.error || 'Could not save the record. Please try again.');
    }
  };

  // Handle delete calf
  const handleDeleteCalf = async (id: string) => {
    await deleteCalf(id);
    setDeleteConfirmId(null);
    loadAllData();
  };

  // Handle open breeding modal
  const handleOpenBreedingModal = (cowId?: string) => {
    const targetCow = cowId || '';
    const existing = breedingRecords.find(b => b.cow_id === targetCow);

    setEditingBreeding(existing || null);
    setBFormCowId(targetCow);
    setBFormLastCalvingDate(existing?.last_calving_date || format(new Date(), 'yyyy-MM-dd'));
    setBFormStatus(existing?.status || 'resting');
    setBFormLastHeatDate(existing?.last_heat_date || '');
    setBFormAiDate(existing?.ai_date || '');
    setBFormAiSireCode(existing?.ai_sire_code || '');
    setBFormAiTechnician(existing?.ai_technician || '');
    setBFormPdDate(existing?.pd_date || '');
    setBFormIsPregnant(existing?.is_pregnant ?? (existing?.status === 'confirmed_pregnant'));
    setBFormNotes(existing?.notes || '');
    setIsBreedingModalOpen(true);
  };

  // Handle save breeding record
  const handleSaveBreeding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const input: CowBreedingInput = {
      id: editingBreeding?.id,
      cow_id: bFormCowId,
      last_calving_date: bFormLastCalvingDate,
      status: bFormStatus,
      last_heat_date: bFormLastHeatDate || undefined,
      ai_date: bFormAiDate || undefined,
      ai_sire_code: bFormAiSireCode.trim() || undefined,
      ai_technician: bFormAiTechnician.trim() || undefined,
      pd_date: bFormPdDate || undefined,
      is_pregnant: bFormIsPregnant || bFormStatus === 'confirmed_pregnant',
      notes: bFormNotes.trim() || undefined,
    };

    const res = await saveBreedingRecord(input);
    setIsSaving(false);

    if (res.success) {
      setIsBreedingModalOpen(false);
      loadAllData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-sky-700">
            <Baby className="h-4 w-4" />
            <span className="text-xs font-semibold">Total Calves</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-950">{stats.total}</div>
          <p className="text-[11px] text-sky-600">Total Calves</p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-purple-700">
            <Award className="h-4 w-4" />
            <span className="text-xs font-semibold">Female Heifers</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-950">{stats.femaleHeifers}</div>
          <p className="text-[11px] text-purple-600">Female Calves</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-amber-700">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold">Bull Calves</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-950">{stats.maleCalves}</div>
          <p className="text-[11px] text-amber-600">Male Calves</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-blue-700">
            <Milk className="h-4 w-4" />
            <span className="text-xs font-semibold">Milk-Fed</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-950">{stats.milkFed}</div>
          <p className="text-[11px] text-blue-600">Milk-Fed Calves</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-emerald-700">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-semibold">Ready for AI</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950">{stats.readyForAI}</div>
          <p className="text-[11px] text-emerald-600">Cows Ready for AI</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 shadow-panel">
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold">Pregnant</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-950">{stats.pregnantCount}</div>
          <p className="text-[11px] text-amber-600">Pregnant Cows</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 pb-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-ink-100 p-1">
          <button
            onClick={() => setActiveTab('calves')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === 'calves' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Baby className="h-4 w-4 text-sky-600" />
            Calves Directory
            <span className="rounded-full bg-ink-200 px-1.5 py-0.5 text-[10px] text-ink-700">{calves.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('mothers')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === 'mothers' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Heart className="h-4 w-4 text-pink-500" />
            Mothers & Offspring
          </button>

          <button
            onClick={() => setActiveTab('breeding')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === 'breeding' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <CalendarDays className="h-4 w-4 text-purple-600" />
            Breeding & Pregnancy Tracker
          </button>

          <button
            onClick={() => setActiveTab('feeding')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === 'feeding' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Milk className="h-4 w-4 text-emerald-600" />
            Feeding & Health Guide
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddCalf()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-900"
          >
            <Plus className="h-4 w-4" />
            + Add Calf
          </button>
          <button
            onClick={() => handleOpenBreedingModal()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            <Calendar className="h-4 w-4" />
            Update Pregnancy / AI
          </button>
        </div>
      </div>

      {/* TAB 1: CALVES DIRECTORY */}
      {activeTab === 'calves' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by calf name, tag (CLF-01), mother (G1), or breed..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-ink-200 py-1.5 pl-9 pr-3 text-sm focus:border-forest-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-ink-400" />
                <span className="text-xs font-medium text-ink-500">Mother:</span>
                <select
                  value={filterMother}
                  onChange={e => setFilterMother(e.target.value)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-700"
                >
                  <option value="all">All Cows</option>
                  {cowList.map(c => (
                    <option key={c} value={c}>Cow {c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-ink-500">Gender:</span>
                <select
                  value={filterGender}
                  onChange={e => setFilterGender(e.target.value)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-700"
                >
                  <option value="all">All</option>
                  <option value="female">♀ Female</option>
                  <option value="male">♂ Male</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-ink-500">Stage:</span>
                <select
                  value={filterStage}
                  onChange={e => setFilterStage(e.target.value)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-700"
                >
                  <option value="all">All Stages</option>
                  {Object.entries(CALF_STAGES).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calves Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-ink-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading data...
            </div>
          ) : filteredCalves.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-300 bg-white py-12 text-center">
              <Baby className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-2 text-sm font-semibold text-ink-700">No calf records found</p>
              <p className="text-xs text-ink-400">Click the button above to add a calf.</p>
              <button
                onClick={() => handleOpenAddCalf()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> + Add Calf
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCalves.map(calf => {
                const stageMeta = CALF_STAGES[calf.stage] || CALF_STAGES.milk_fed;
                const healthMeta = CALF_HEALTH_STATUSES[calf.health_status] || CALF_HEALTH_STATUSES.healthy;
                const age = calculateCalfAge(calf.dob);
                const feedMeta = calf.feed_type ? CALF_FEED_TYPES[calf.feed_type] : null;

                return (
                  <div
                    key={calf.id}
                    className="flex flex-col justify-between rounded-xl border border-ink-200/80 bg-white p-4 shadow-panel transition hover:shadow-md"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                              {calf.tag_number}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                calf.gender === 'female'
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {calf.gender === 'female' ? '♀ Female' : '♂ Male'}
                            </span>
                          </div>
                          <h3 className="mt-1 text-base font-bold text-ink-900">{calf.name}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCalf(calf)}
                            className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(calf.id)}
                            className="rounded p-1 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mother & Stage Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                          <Heart className="h-3 w-3 text-amber-600" />
                          Mother: <strong className="font-bold">{calf.mother_id}</strong>
                        </span>
                        <span
                          style={{
                            backgroundColor: stageMeta.bgColor,
                            color: stageMeta.color,
                            borderColor: stageMeta.borderColor,
                          }}
                          className="rounded border px-2 py-0.5 font-semibold text-[11px]"
                        >
                          {stageMeta.label}
                        </span>
                        <span
                          style={{
                            backgroundColor: healthMeta.bgColor,
                            color: healthMeta.color,
                          }}
                          className="rounded px-2 py-0.5 text-[11px] font-semibold"
                        >
                          {healthMeta.label}
                        </span>
                      </div>

                      {/* Key Vitals Grid */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-lg bg-ink-50/70 p-2.5 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-ink-400">Age</p>
                          <p className="font-semibold text-ink-800">{age.text}</p>
                          <p className="text-[10px] text-ink-400">DOB: {calf.dob}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-ink-400">Weight</p>
                          <p className="font-semibold text-ink-800">
                            {calf.current_weight ? `${calf.current_weight} kg` : '—'}
                          </p>
                          <p className="text-[10px] text-ink-400">
                            Birth: {calf.birth_weight ? `${calf.birth_weight} kg` : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-semibold text-ink-400">Daily Milk</p>
                          <p className="font-semibold text-blue-700">
                            {calf.milk_intake_liters ? `${calf.milk_intake_liters} L / day` : 'Weaned'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-semibold text-ink-400">Breed</p>
                          <p className="font-medium text-ink-700 truncate" title={calf.breed}>{calf.breed}</p>
                        </div>
                      </div>

                      {/* Feeding & Care details */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        {feedMeta && (
                          <div className="flex items-center gap-1.5 text-ink-600">
                            <Milk className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>{feedMeta.label}</span>
                          </div>
                        )}
                        {calf.sire_details && (
                          <div className="flex items-center gap-1.5 text-ink-600 truncate">
                            <Award className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                            <span className="truncate">Sire: {calf.sire_details}</span>
                          </div>
                        )}
                        {calf.deworming_date && (
                          <div className="flex items-center gap-1.5 text-ink-600">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            <span>Dewormed: {calf.deworming_date}</span>
                          </div>
                        )}
                        {calf.notes && (
                          <p className="rounded bg-amber-50/50 p-1.5 text-[11px] text-amber-900 border border-amber-100 italic">
                            “{calf.notes}”
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 border-t border-ink-100 pt-3">
                      <button
                        onClick={() => {
                          setActiveTab('breeding');
                        }}
                        className="inline-flex w-full items-center justify-between text-xs font-semibold text-forest-700 hover:text-forest-900"
                      >
                        <span>View next breeding for mother ({calf.mother_id})</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MOTHER COWS & OFFSPRING SUMMARY */}
      {activeTab === 'mothers' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
            <div className="flex items-center gap-2 text-sky-900">
              <Info className="h-5 w-5 text-sky-600" />
              <h3 className="text-sm font-bold">Cow-Calf Pedigree Directory</h3>
            </div>
            <p className="mt-1 text-xs text-sky-700">
              View each cow’s offspring, their sex, and the cow’s current breeding cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {motherSummaries.map(summary => {
              const breedRecord = summary.breeding_record;
              const reproAnalysis = breedRecord ? analyzeReproductionCycle(breedRecord) : null;

              return (
                <div
                  key={summary.cow_id}
                  className="rounded-xl border border-ink-200/80 bg-white p-5 shadow-panel"
                >
                  {/* Mother Card Header */}
                  <div className="flex items-start justify-between border-b border-ink-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-800 font-bold text-lg border border-forest-200">
                        {summary.cow_id}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-ink-900">{summary.cow_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                          <span>Total calves: <strong className="text-ink-800 font-bold">{summary.total_calves}</strong></span>
                          <span>·</span>
                          <span className="text-pink-600 font-medium">{summary.female_calves} female calves</span>
                          <span>·</span>
                          <span className="text-blue-600 font-medium">{summary.male_calves} male calves</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {reproAnalysis ? (
                        <span
                          style={{
                            backgroundColor: reproAnalysis.statusBadge.bgColor,
                            color: reproAnalysis.statusBadge.color,
                            borderColor: reproAnalysis.statusBadge.borderColor,
                          }}
                          className="rounded border px-2.5 py-1 text-xs font-bold"
                        >
                          {reproAnalysis.statusBadge.label}
                        </span>
                      ) : (
                        <span className="rounded bg-ink-100 px-2.5 py-1 text-xs text-ink-500">
                          No breeding data
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reproduction Snapshot */}
                  {reproAnalysis && (
                    <div className="mt-3 rounded-lg bg-paper p-3 text-xs">
                      <div className="flex items-center justify-between text-ink-700">
                        <span>Last calving: <strong>{breedRecord?.last_calving_date}</strong> ({reproAnalysis.daysSinceCalving} days ago)</span>
                        {reproAnalysis.isPregnant ? (
                          <span className="font-bold text-amber-700">
                            Pregnancy: {reproAnalysis.pregnancyMonth}month ({reproAnalysis.gestationDays} days)
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700">
                            Next expected heat: {reproAnalysis.predictedNextHeatDate}
                          </span>
                        )}
                      </div>
                      {reproAnalysis.urgentAlert && (
                        <div className="mt-2 flex items-center gap-1.5 text-rose-700 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{reproAnalysis.urgentAlert}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Offspring List */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Offspring for this cow ({summary.calves.length})
                    </p>
                    {summary.calves.length === 0 ? (
                      <p className="mt-2 text-xs italic text-ink-400">No calves are recorded for this cow.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {summary.calves.map(calf => {
                          const age = calculateCalfAge(calf.dob);
                          const stageMeta = CALF_STAGES[calf.stage] || CALF_STAGES.milk_fed;

                          return (
                            <div
                              key={calf.id}
                              className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50/50 p-2.5 text-xs transition hover:bg-white"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  calf.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {calf.gender === 'female' ? '♀' : '♂'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-ink-900">{calf.name}</span>
                                    <span className="font-mono text-[10px] text-ink-500">({calf.tag_number})</span>
                                  </div>
                                  <p className="text-[11px] text-ink-500">
                                    {age.text} · Born {calf.dob} {calf.current_weight ? `· ${calf.current_weight}kg` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  style={{
                                    backgroundColor: stageMeta.bgColor,
                                    color: stageMeta.color,
                                    borderColor: stageMeta.borderColor,
                                  }}
                                  className="rounded border px-2 py-0.5 text-[11px] font-semibold"
                                >
                                  {stageMeta.label}
                                </span>
                                <button
                                  onClick={() => handleOpenEditCalf(calf)}
                                  className="rounded p-1 text-ink-400 hover:text-ink-700"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                    <button
                      onClick={() => handleOpenAddCalf(summary.cow_id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      + {summary.cow_id} Add calf for
                    </button>
                    <button
                      onClick={() => handleOpenBreedingModal(summary.cow_id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Update Breeding Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PREGNANCY & BREEDING TIMELINE TRACKER */}
      {activeTab === 'breeding' && (
        <div className="space-y-5">
          {/* Scientific Info Box */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4">
            <div className="flex items-center gap-2 text-purple-900">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-bold">Breeding Cycle & Pregnancy Tracker</h3>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-purple-900 sm:grid-cols-4">
              <div className="rounded-lg bg-white/80 p-2.5 border border-purple-200/60">
                <p className="font-bold text-purple-950">1. Rest Period (0–50 days)</p>
                <p className="text-[11px] text-purple-700">Recovery period after calving. Do not perform AI during this time.</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-purple-200/60">
                <p className="font-bold text-emerald-950">2. Recommended AI Window (60–90 days)</p>
                <p className="text-[11px] text-emerald-700">Most fertile heat window. Aim for one calf per year.</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-purple-200/60">
                <p className="font-bold text-blue-950">3. Heat & Pregnancy Checks (21 and 60 days)</p>
                <p className="text-[11px] text-blue-700">Check for heat 21 days after AI and schedule a pregnancy diagnosis after 60 days.</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 border border-purple-200/60">
                <p className="font-bold text-amber-950">4. Pregnancy (280-day gestation)</p>
                <p className="text-[11px] text-amber-700">Begin the dry period around month seven. Calving is expected around 9 months and 10 days.</p>
              </div>
            </div>
          </div>

          {/* Breeding Records Table / Timeline */}
          <div className="space-y-4">
            {breedingRecords.map(record => {
              const analysis = analyzeReproductionCycle(record);
              const cowCalves = calves.filter(c => c.mother_id === record.cow_id);

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-ink-200/80 bg-white p-5 shadow-panel transition hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 font-bold text-forest-800 border border-forest-200 text-lg">
                        {record.cow_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-ink-900">Cow {record.cow_id}</h4>
                          <span
                            style={{
                              backgroundColor: analysis.statusBadge.bgColor,
                              color: analysis.statusBadge.color,
                              borderColor: analysis.statusBadge.borderColor,
                            }}
                            className="rounded border px-2.5 py-0.5 text-xs font-bold"
                          >
                            {analysis.statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500">
                          Last calving: <strong>{record.last_calving_date}</strong> · {analysis.daysSinceCalving} days ago · Total calves: {cowCalves.length}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBreedingModal(record.cow_id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        AI / Pregnancy Update
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Status Visualizer */}
                  <div className="mt-4">
                    {analysis.isPregnant ? (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-amber-900">
                          <span>
                            Pregnancy progress: <strong>{analysis.pregnancyMonth} month</strong> ({analysis.gestationDays} / 280 days)
                          </span>
                          <span>
                            Days until calving: <strong>{analysis.daysUntilDelivery} days</strong> (expected: {analysis.predictedNextCalvingDate})
                          </span>
                        </div>
                        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-amber-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-600 transition-all duration-500"
                            style={{ width: `${analysis.gestationProgress}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] text-ink-400">
                          <span>AI Date: {record.ai_date || '—'}</span>
                          <span>Dry-off date: {analysis.predictedDryDate}</span>
                          <span>Calving date: {analysis.predictedNextCalvingDate}</span>
                        </div>
                      </div>
                    ) : record.status === 'resting' ? (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-sky-900">
                          <span>
                            Rest / recovery period: <strong>{analysis.daysSinceCalving} / 50 days</strong>
                          </span>
                          <span>
                            Next expected heat: <strong>{analysis.predictedNextHeatDate}</strong>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-sky-100">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                            style={{ width: `${analysis.restingProgress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-sky-700">
                          {analysis.daysSinceCalving} days since calving. The first fertile heat may occur after day 50.
                        </p>
                      </div>
                    ) : record.status === 'inseminated' ? (
                      <div className="rounded-lg bg-purple-50 p-3 text-xs">
                        <div className="flex items-center justify-between text-purple-900">
                          <span>
                            AI date: <strong>{record.ai_date}</strong> ({analysis.daysSinceAI} days ago)
                          </span>
                          <span>Semen straw / bull: <strong>{record.ai_sire_code || '—'}</strong></span>
                          <span>Technician: <strong>{record.ai_technician || '—'}</strong></span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-purple-700">
                          <span>Heat watch (21 days): <strong>{analysis.predictedNextHeatDate}</strong></span>
                          <span>Pregnancy check (60 days): <strong>{record.pd_date || 'In 60 days'}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
                        <p className="font-bold">✓ Ready for AI!</p>
                        <p className="text-[11px] text-emerald-700">
                          {analysis.daysSinceCalving} days since calving. The cow may come into heat soon; consider AI with suitable semen.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Urgent Alert Banner */}
                  {analysis.urgentAlert && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-800 border border-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{analysis.urgentAlert}</span>
                    </div>
                  )}

                  {record.notes && (
                    <p className="mt-3 text-xs text-ink-500 italic">
                      Notes: “{record.notes}”
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CALF FEEDING & CARE GUIDE */}
      {activeTab === 'feeding' && (
        <div className="space-y-6">
          {/* Interactive Age-based feeding simulator */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-panel">
            <div className="flex items-center gap-2 text-emerald-900">
              <Milk className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base font-bold">Calf Feeding Guide</h3>
            </div>
            <p className="mt-1 text-xs text-emerald-800">
              Feeding guidance by age, including milk quantities, calf starter, fodder, and vaccination.
            </p>

            {/* Slider to change calf age */}
            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-emerald-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink-800">
                  Select calf age: <span className="text-emerald-700 font-extrabold text-sm">{guideAgeDays} days</span> ({Math.round(guideAgeDays / 30)} months)
                </label>
                <div className="flex gap-1.5">
                  {[2, 15, 45, 90, 150].map(d => (
                    <button
                      key={d}
                      onClick={() => setGuideAgeDays(d)}
                      className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                        guideAgeDays === d ? 'bg-emerald-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                      }`}
                    >
                      {d <= 3 ? 'Day 1-3' : d <= 30 ? '1 month' : d <= 90 ? '2–3 months' : '4+ months'}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="180"
                value={guideAgeDays}
                onChange={e => setGuideAgeDays(Number(e.target.value))}
                className="mt-3 w-full accent-emerald-600"
              />

              {/* Dynamic Guide Result */}
              {(() => {
                const guide = getCalfFeedingGuide(guideAgeDays);
                return (
                  <div className="mt-4 rounded-xl border border-ink-200/60 bg-paper p-4 space-y-3">
                    <h4 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      {guide.title}
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-white p-3 border border-ink-100">
                        <p className="text-[10px] font-bold uppercase text-ink-400">Daily Milk</p>
                        <p className="text-lg font-bold text-blue-700">
                          {guide.milkPerDay > 0 ? `${guide.milkPerDay} Litres / day` : 'Weaned'}
                        </p>
                        <p className="text-[11px] text-ink-500">{guide.frequency}</p>
                      </div>

                      <div className="rounded-lg bg-white p-3 border border-ink-100">
                        <p className="text-[10px] font-bold uppercase text-ink-400">Solid Feed (Starter / Fodder)</p>
                        <p className="text-xs font-semibold text-ink-800">{guide.solidDiet}</p>
                      </div>

                      <div className="rounded-lg bg-white p-3 border border-ink-100">
                        <p className="text-[10px] font-bold uppercase text-ink-400">Deworming & Vaccination</p>
                        <p className="text-xs font-semibold text-emerald-800">{guide.deworming}</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200/60">
                      <strong>💡 Care tip:</strong> {guide.tips}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Farm Calf Milk Consumption Summary */}
          <div className="rounded-xl border border-ink-200/80 bg-white p-5 shadow-panel">
            <h4 className="text-sm font-bold text-ink-900">Daily Milk Consumption by Calves</h4>
            <p className="text-xs text-ink-500">Daily milk intake for all {stats.milkFed} milk-fed calves:</p>

            <div className="mt-3 flex items-center gap-4 rounded-lg bg-blue-50/60 p-3 border border-blue-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl">
                🥛
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900">Total Daily Calf Milk</p>
                <p className="text-2xl font-bold text-blue-950">{stats.totalDailyMilkFed.toFixed(1)} Litres / day</p>
                <p className="text-[11px] text-blue-700">Morning ~{(stats.totalDailyMilkFed / 2).toFixed(1)}L + Evening ~{(stats.totalDailyMilkFed / 2).toFixed(1)}L</p>
              </div>
            </div>
          </div>

          {/* Vaccination Schedule Table */}
          <div className="rounded-xl border border-ink-200/80 bg-white p-5 shadow-panel">
            <h4 className="text-sm font-bold text-ink-900">Calf Vaccination Schedule</h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-ink-600">
                    <th className="px-3 py-2 font-semibold">Age</th>
                    <th className="px-3 py-2 font-semibold">Vaccine / Medicine</th>
                    <th className="px-3 py-2 font-semibold">Purpose / Disease</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  <tr>
                    <td className="px-3 py-2 font-medium">Day 1 (within 1 hour of birth)</td>
                    <td className="px-3 py-2 font-bold text-amber-800">Colostrum</td>
                    <td className="px-3 py-2 text-ink-600">Supports immunity; apply tincture to the navel</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">Day 7 - 10</td>
                    <td className="px-3 py-2 font-bold text-blue-800">Piperazine / Albendazole syrup</td>
                    <td className="px-3 py-2 text-ink-600">First dose against roundworms</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">1 month (30 days)</td>
                    <td className="px-3 py-2 font-bold text-blue-800">Fenbendazole / second deworming</td>
                    <td className="px-3 py-2 text-ink-600">Control intestinal worms and support weight gain</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">3–4 months</td>
                    <td className="px-3 py-2 font-bold text-emerald-800">FMD vaccine</td>
                    <td className="px-3 py-2 text-ink-600">Protection against FMD (booster after 1 month)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">4–8 months (female calves only)</td>
                    <td className="px-3 py-2 font-bold text-purple-800">Brucellosis (Cotton Strain-19)</td>
                    <td className="px-3 py-2 text-ink-600">One-time vaccine to help prevent infertility and abortion</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">6 months</td>
                    <td className="px-3 py-2 font-bold text-indigo-800">HS + BQ</td>
                    <td className="px-3 py-2 text-ink-600">Annual vaccination before the monsoon</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CALF */}
      {isCalfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">
                  {editingCalf ? 'Edit Calf Record' : 'Add Calf Record'}
                </h3>
                <p className="text-xs text-ink-500">Enter the tag, mother, gender, breed, and feeding details.</p>
              </div>
              <button
                onClick={() => setIsCalfModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalf} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-700">Tag Number *</label>
                  <input
                    type="text"
                    required
                    value={formTag}
                    onChange={e => setFormTag(e.target.value)}
                    placeholder="CLF-01"
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Calf Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Gauri, Nandi..."
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-ink-700">Mother Cow *</label>
                  <input
                    type="text"
                    required
                    value={formMotherId}
                    onChange={e => setFormMotherId(e.target.value)}
                    placeholder="Enter cow name or tag"
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Gender *</label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value as CalfGender)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  >
                    <option value="female">♀ Female</option>
                    <option value="male">♂ Male</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formDob}
                    onChange={e => setFormDob(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-700">Breed</label>
                  <select
                    value={formBreed}
                    onChange={e => setFormBreed(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  >
                    {CALF_BREEDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Current Stage</label>
                  <select
                    value={formStage}
                    onChange={e => setFormStage(e.target.value as CalfStage)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  >
                    {Object.entries(CALF_STAGES).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.label} - {meta.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weights and Milk Feeding */}
              <div className="rounded-xl bg-ink-50 p-3.5 space-y-3">
                <p className="text-xs font-bold text-ink-900">Feeding & Weight</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Birth Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formBirthWeight}
                      onChange={e => setFormBirthWeight(e.target.value)}
                      placeholder="32"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formCurrentWeight}
                      onChange={e => setFormCurrentWeight(e.target.value)}
                      placeholder="45"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Daily Milk (L/day)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formMilkIntake}
                      onChange={e => setFormMilkIntake(e.target.value)}
                      placeholder="4.0"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Feed Type</label>
                    <select
                      value={formFeedType}
                      onChange={e => setFormFeedType(e.target.value as CalfFeedType)}
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {Object.entries(CALF_FEED_TYPES).map(([k, meta]) => (
                        <option key={k} value={k}>{meta.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formColostrumFed}
                        onChange={e => setFormColostrumFed(e.target.checked)}
                        className="h-4 w-4 rounded accent-forest-700"
                      />
                      Colostrum was fed within the first hour after birth
                    </label>
                  </div>
                </div>
              </div>

              {/* Health and Sire */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-700">Health Status</label>
                  <select
                    value={formHealth}
                    onChange={e => setFormHealth(e.target.value as CalfHealthStatus)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                  >
                    {Object.entries(CALF_HEALTH_STATUSES).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Deworming Date</label>
                  <input
                    type="date"
                    value={formDewormingDate}
                    onChange={e => setFormDewormingDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700">Bull / Semen Details</label>
                <input
                  type="text"
                  value={formSire}
                  onChange={e => setFormSire(e.target.value)}
                  placeholder="ABS Sexed Semen Bull #402..."
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700">Vaccines Given</label>
                <input
                  type="text"
                  value={formVaccines}
                  onChange={e => setFormVaccines(e.target.value)}
                  placeholder="Colostrum, Vitamin AD3, FMD..."
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCalfModalOpen(false)}
                  className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-5 py-2 text-xs font-semibold text-white hover:bg-forest-900 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Calf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BREEDING & PREGNANCY UPDATE MODAL */}
      {isBreedingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">
                  Cow Breeding & Pregnancy
                </h3>
                <p className="text-xs text-ink-500">Track heat, AI, and expected calving dates.</p>
              </div>
              <button
                onClick={() => setIsBreedingModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBreeding} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-700">Cow *</label>
                  <input
                    type="text"
                    required
                    value={bFormCowId}
                    onChange={e => {
                      const cid = e.target.value;
                      setBFormCowId(cid);
                      const rec = breedingRecords.find(b => b.cow_id === cid);
                      if (rec) {
                        setBFormLastCalvingDate(rec.last_calving_date);
                        setBFormStatus(rec.status);
                        setBFormLastHeatDate(rec.last_heat_date || '');
                        setBFormAiDate(rec.ai_date || '');
                        setBFormAiSireCode(rec.ai_sire_code || '');
                        setBFormAiTechnician(rec.ai_technician || '');
                        setBFormPdDate(rec.pd_date || '');
                        setBFormIsPregnant(rec.is_pregnant ?? (rec.status === 'confirmed_pregnant'));
                        setBFormNotes(rec.notes || '');
                      }
                    }}
                    placeholder="Enter cow name or tag"
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-700">Last Calving Date *</label>
                  <input
                    type="date"
                    required
                    value={bFormLastCalvingDate}
                    onChange={e => setBFormLastCalvingDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700">Current Breeding Status *</label>
                <select
                  value={bFormStatus}
                  onChange={e => {
                    const st = e.target.value as CowBreedingStatus;
                    setBFormStatus(st);
                    if (st === 'confirmed_pregnant') {
                      setBFormIsPregnant(true);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900"
                >
                  {Object.entries(BREEDING_STATUS_META).map(([k, meta]) => (
                    <option key={k} value={k}>{meta.label} ({meta.label})</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-ink-500">
                  {BREEDING_STATUS_META[bFormStatus]?.description}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50/60 p-3.5 space-y-3 border border-purple-100">
                <p className="text-xs font-bold text-purple-900">AI & Semen Details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Heat Date</label>
                    <input
                      type="date"
                      value={bFormLastHeatDate}
                      onChange={e => setBFormLastHeatDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">AI Date</label>
                    <input
                      type="date"
                      value={bFormAiDate}
                      onChange={e => setBFormAiDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Semen Straw / Sire Code</label>
                    <input
                      type="text"
                      value={bFormAiSireCode}
                      onChange={e => setBFormAiSireCode(e.target.value)}
                      placeholder="e.g. ABS HF Bull #402"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-700">Veterinarian / AI Technician</label>
                    <input
                      type="text"
                      value={bFormAiTechnician}
                      onChange={e => setBFormAiTechnician(e.target.value)}
                      placeholder="e.g. Dr. Verma"
                      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Pregnancy Check */}
              <div className="rounded-xl bg-amber-50/60 p-3.5 space-y-3 border border-amber-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-950">Pregnancy Diagnosis</p>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bFormIsPregnant}
                      onChange={e => {
                        const val = e.target.checked;
                        setBFormIsPregnant(val);
                        if (val) setBFormStatus('confirmed_pregnant');
                      }}
                      className="h-4 w-4 rounded accent-amber-600"
                    />
                    Pregnancy Confirmed
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-700">Pregnancy Diagnosis Date</label>
                  <input
                    type="date"
                    value={bFormPdDate}
                    onChange={e => setBFormPdDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700">Notes / Treatment</label>
                <textarea
                  rows={2}
                  value={bFormNotes}
                  onChange={e => setBFormNotes(e.target.value)}
                  placeholder="Medication, mineral mix, or other details..."
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBreedingModalOpen(false)}
                  className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-5 py-2 text-xs font-semibold text-white hover:bg-forest-900"
                >
                  {isSaving ? 'Saving...' : 'Save Breeding Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-rose-500" />
            <h4 className="mt-3 text-base font-bold text-ink-900">Delete Calf Record?</h4>
            <p className="mt-1 text-xs text-ink-500">
              Are you sure you want to delete this calf record? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCalf(deleteConfirmId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
