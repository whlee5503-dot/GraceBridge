import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  classifyMUACChild,
  classifyMUACPregnant,
  calculateZScore,
  type ChildMuacCategory,
  type PregnantMuacCategory,
  type ZScoreIndicator,
  type ZScoreResult,
} from '../lib/nutrition';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type TFunc = ReturnType<typeof useTranslation>['t'];
type Tab = 'muac' | 'zscore';
type MuacTarget = 'child' | 'pregnant';

const STATUS_BG: Record<'red' | 'yellow' | 'green', string> = {
  red: '#dc2626',
  yellow: '#f59e0b',
  green: '#1a6b4a',
};

// ── Result banner ─────────────────────────────────────────────────────────────

function ResultBanner({
  color,
  title,
  subtitle,
  metric,
  metricLabel,
  recommendation,
}: {
  color: 'red' | 'yellow' | 'green';
  title: string;
  subtitle?: string;
  metric: string;
  metricLabel: string;
  recommendation: string;
}) {
  const bg = STATUS_BG[color];
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-6 text-center" style={{ backgroundColor: bg }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
          {metricLabel}
        </p>
        <p className="text-4xl font-black text-white leading-none mb-1">{metric}</p>
        <p className="text-xl font-bold text-white mt-3">{title}</p>
        {subtitle && (
          <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-4 py-4 bg-white dark:bg-[#1a2e28] border-t-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
          Recommendation
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{recommendation}</p>
      </div>
    </div>
  );
}

// ── Toggle button group ───────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
          style={
            value === o.value
              ? { backgroundColor: 'var(--brand)', color: 'var(--bg-page)', borderColor: 'var(--brand)' }
              : { backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Input field helper ────────────────────────────────────────────────────────

function Field({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  error,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#243d36] border border-slate-200 dark:border-[#2a4a40] rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a6b4a] dark:focus:ring-[#4ade80]"
        />
        {unit && (
          <span className="absolute right-3 top-2.5 text-sm text-slate-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── MUAC reference chips ──────────────────────────────────────────────────────

function MuacChips({ target }: { target: MuacTarget }) {
  if (target === 'pregnant') {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">&lt;210 High</span>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">210–229 Mod.</span>
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">≥230 Normal</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">SAM &lt;115</span>
      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t('nutrition.mamRange', 'MAM 115–124')}</span>
      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t('nutrition.normalRange', 'Normal ≥125')}</span>
    </div>
  );
}

// ── How-to-measure accordion ──────────────────────────────────────────────────

function HowToMeasure({ t }: { t: TFunc }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-[#2a4a40] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#1a2e28] text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <span>{t('nutrition.howToMeasure')}</span>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 bg-white dark:bg-[#1a2e28] text-sm text-slate-600 dark:text-slate-300 leading-snug">
          <p>{t('nutrition.howStep1')}</p>
          <p>{t('nutrition.howStep2')}</p>
          <p>{t('nutrition.howStep3')}</p>
        </div>
      )}
    </div>
  );
}

// ── Child MUAC tab ────────────────────────────────────────────────────────────

function useMuacChildResult(
  muac: string,
  hasEdema: boolean,
  t: TFunc,
) {
  const mm = parseFloat(muac);
  if (!muac || isNaN(mm)) return null;

  const res = classifyMUACChild(mm, hasEdema);
  const labelMap: Record<ChildMuacCategory, string> = {
    edema: t('nutrition.edemaLabel'),
    sam: 'SAM',
    mam: 'MAM',
    normal: t('nutrition.normal'),
  };
  const subtitleMap: Record<ChildMuacCategory, string> = {
    edema: t('nutrition.sam'),
    sam: t('nutrition.sam'),
    mam: t('nutrition.mam'),
    normal: '',
  };
  const recMap: Record<ChildMuacCategory, string> = {
    edema: t('nutrition.edemaRec'),
    sam: t('nutrition.samRec'),
    mam: t('nutrition.mamRec'),
    normal: t('nutrition.normalRec'),
  };
  return { res, label: labelMap[res.category], subtitle: subtitleMap[res.category], rec: recMap[res.category] };
}

function useMuacPregnantResult(muac: string, t: TFunc) {
  const mm = parseFloat(muac);
  if (!muac || isNaN(mm)) return null;

  const res = classifyMUACPregnant(mm);
  const labelMap: Record<PregnantMuacCategory, string> = {
    'high-risk': t('nutrition.pregnantHigh'),
    'moderate-risk': t('nutrition.pregnantModerate'),
    normal: t('nutrition.pregnantNormal'),
  };
  const recMap: Record<PregnantMuacCategory, string> = {
    'high-risk': t('nutrition.pregnantHighRec'),
    'moderate-risk': t('nutrition.pregnantModerateRec'),
    normal: t('nutrition.pregnantNormalRec'),
  };
  return { res, label: labelMap[res.category], rec: recMap[res.category] };
}

// ── Z-score classification label helper ──────────────────────────────────────

function zLabel(ind: ZScoreIndicator, cat: ZScoreResult['category'], t: TFunc): string {
  if (cat === 'normal') return t('nutrition.normal');
  const key = cat === 'severe'
    ? `nutrition.z${ind}Severe` as const
    : `nutrition.z${ind}Moderate` as const;
  return t(key);
}

function zRec(cat: ZScoreResult['category'], t: TFunc): string {
  if (cat === 'severe') return t('nutrition.zSevereRec');
  if (cat === 'moderate') return t('nutrition.zModerateRec');
  return t('nutrition.zNormalRec');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NutritionAssess() {
  const { t } = useTranslation();

  // Tab
  const [tab, setTab] = useState<Tab>('muac');

  // MUAC tab
  const [target, setTarget] = useState<MuacTarget>('child');
  const [muac, setMuac] = useState('');
  const [edema, setEdema] = useState(false);
  const [muacAssessed, setMuacAssessed] = useState(false);

  // Z-Score tab
  const [indicator, setIndicator] = useState<ZScoreIndicator>('WHZ');
  const [zSex, setZSex] = useState<'M' | 'F'>('M');
  const [zAge, setZAge] = useState('');
  const [zHeight, setZHeight] = useState('');
  const [zWeight, setZWeight] = useState('');
  const [zResult, setZResult] = useState<ZScoreResult | null>(null);

  // ── MUAC helpers ────────────────────────────────────────────────────────────

  const childResult = target === 'child' ? useMuacChildResult(muac, edema, t) : null;
  const pregnantResult = target === 'pregnant' ? useMuacPregnantResult(muac, t) : null;
  const muacValid = !!muac && !isNaN(parseFloat(muac));

  function handleMuacReset() {
    setMuac(''); setEdema(false); setMuacAssessed(false);
  }

  // ── Z-Score helpers ──────────────────────────────────────────────────────────

  const ageNum = parseFloat(zAge);
  const heightNum = parseFloat(zHeight);
  const weightNum = parseFloat(zWeight);

  const ageValid = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 60;
  const heightValid = !isNaN(heightNum) && heightNum >= 45 && heightNum <= 120;

  const zCanCalc = (() => {
    if (indicator === 'WHZ') return heightValid && !isNaN(weightNum);
    if (indicator === 'HAZ') return ageValid && heightValid;
    return ageValid && !isNaN(weightNum);
  })();

  function handleZCalc() {
    const measurement = indicator === 'HAZ' ? heightNum : weightNum;
    const res = calculateZScore(
      indicator, zSex, ageNum, measurement,
      indicator === 'WHZ' ? heightNum : undefined,
    );
    setZResult(res);
  }

  function handleZReset() {
    setZAge(''); setZHeight(''); setZWeight(''); setZResult(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 pb-8">
      <header className="mb-5 pt-2">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Scale size={20} style={{ color: 'var(--brand)' }} />
          {t('nutrition.title')}
        </h1>
      </header>

      {/* Tab switcher */}
      <div className="flex bg-slate-100 dark:bg-[#1a2e28] rounded-xl p-1 mb-4">
        {(['muac', 'zscore'] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={
              tab === tb
                ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {t(tb === 'muac' ? 'nutrition.muacTab' : 'nutrition.zscoreTab')}
          </button>
        ))}
      </div>

      {/* ── TAB 1: MUAC ──────────────────────────────────────────────────────── */}
      {tab === 'muac' && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="space-y-4">
              {/* Target selector */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  {t('nutrition.sex')}
                </p>
                <ToggleGroup<MuacTarget>
                  value={target}
                  options={[
                    { value: 'child', label: t('nutrition.childTarget') },
                    { value: 'pregnant', label: t('nutrition.pregnantTarget') },
                  ]}
                  onChange={(v) => { setTarget(v); setMuac(''); setMuacAssessed(false); }}
                />
              </div>

              {/* MUAC input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  {t('nutrition.muac')}
                  <span className="ml-1 normal-case font-normal text-slate-400">
                    ({t('nutrition.muacHint')})
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={50} max={400} placeholder="e.g. 120"
                    value={muac}
                    onChange={(e) => { setMuac(e.target.value); setMuacAssessed(false); }}
                    className="w-full bg-slate-50 dark:bg-[#243d36] border border-slate-200 dark:border-[#2a4a40] rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a6b4a] dark:focus:ring-[#4ade80]"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400 pointer-events-none">mm</span>
                </div>
                <MuacChips target={target} />
              </div>

              {/* Edema checkbox — child only */}
              {target === 'child' && (
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    edema ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-[#243d36] border-slate-200 dark:border-[#2a4a40]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={edema}
                    onChange={(e) => { setEdema(e.target.checked); setMuacAssessed(false); }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      edema ? 'bg-red-500 border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {edema && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${edema ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {t('nutrition.edema')}
                  </span>
                </label>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  fullWidth
                  onClick={() => setMuacAssessed(true)}
                  disabled={!muacValid}
                >
                  {t('nutrition.assess')}
                </Button>
                <Button variant="secondary" onClick={handleMuacReset}>
                  {t('nutrition.reset')}
                </Button>
              </div>
            </div>
          </Card>

          {/* MUAC result */}
          {muacAssessed && muacValid && target === 'child' && childResult && (
            <ResultBanner
              color={childResult.res.color}
              title={childResult.label}
              subtitle={childResult.subtitle || undefined}
              metric={`${parseFloat(muac)} mm`}
              metricLabel="MUAC"
              recommendation={childResult.rec}
            />
          )}

          {muacAssessed && muacValid && target === 'pregnant' && pregnantResult && (
            <ResultBanner
              color={pregnantResult.res.color}
              title={pregnantResult.label}
              metric={`${parseFloat(muac)} mm`}
              metricLabel="MUAC"
              recommendation={pregnantResult.rec}
            />
          )}

          {/* How to measure */}
          <HowToMeasure t={t} />
        </div>
      )}

      {/* ── TAB 2: Z-Score ───────────────────────────────────────────────────── */}
      {tab === 'zscore' && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="space-y-4">
              {/* Indicator selector */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  {t('nutrition.indicator')}
                </p>
                <ToggleGroup<ZScoreIndicator>
                  value={indicator}
                  options={[
                    { value: 'WHZ', label: 'WHZ' },
                    { value: 'HAZ', label: 'HAZ' },
                    { value: 'WAZ', label: 'WAZ' },
                  ]}
                  onChange={(v) => { setIndicator(v); setZResult(null); }}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">
                  WHZ = weight-for-height · HAZ = height-for-age · WAZ = weight-for-age
                </p>
              </div>

              {/* Sex */}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  {t('nutrition.sex')}
                </p>
                <ToggleGroup<'M' | 'F'>
                  value={zSex}
                  options={[
                    { value: 'M', label: t('nutrition.male') },
                    { value: 'F', label: t('nutrition.female') },
                  ]}
                  onChange={(v) => { setZSex(v); setZResult(null); }}
                />
              </div>

              {/* Age (not needed for WHZ) */}
              {indicator !== 'WHZ' && (
                <Field
                  label={t('nutrition.ageMonths')}
                  unit="mo"
                  value={zAge}
                  onChange={(v) => { setZAge(v); setZResult(null); }}
                  min={0} max={60} placeholder="e.g. 24"
                  error={zAge && !ageValid ? t('nutrition.ageRange') : undefined}
                />
              )}

              {/* Height (WHZ needs it as reference; HAZ needs it as measurement) */}
              {(indicator === 'WHZ' || indicator === 'HAZ') && (
                <Field
                  label={t('nutrition.heightInput')}
                  unit="cm"
                  value={zHeight}
                  onChange={(v) => { setZHeight(v); setZResult(null); }}
                  min={45} max={120} step={0.1} placeholder="e.g. 75"
                  error={zHeight && !heightValid ? t('nutrition.heightRange') : undefined}
                />
              )}

              {/* Weight (WHZ and WAZ) */}
              {(indicator === 'WHZ' || indicator === 'WAZ') && (
                <Field
                  label={t('nutrition.weight')}
                  unit="kg"
                  value={zWeight}
                  onChange={(v) => { setZWeight(v); setZResult(null); }}
                  min={1} max={60} step={0.1} placeholder="e.g. 8.5"
                />
              )}

              {/* Height for HAZ already captured above; for completeness label */}

              <div className="flex gap-2">
                <Button fullWidth onClick={handleZCalc} disabled={!zCanCalc}>
                  {t('nutrition.assess')}
                </Button>
                <Button variant="secondary" onClick={handleZReset}>
                  {t('nutrition.reset')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Z-Score result */}
          {zResult && (
            <>
              {/* Borderline warning */}
              {zResult.borderline && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">{t('nutrition.borderlineNote')}</p>
                </div>
              )}

              {/* Main result card */}
              <div className="rounded-2xl overflow-hidden shadow-sm">
                {/* Colored top: Z-score big number */}
                <div
                  className="px-5 py-6 text-center"
                  style={{ backgroundColor: STATUS_BG[zResult.color] }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
                    Z-Score ({indicator})
                  </p>
                  <p className="text-5xl font-black text-white leading-none">
                    {zResult.z > 0 ? '+' : ''}{zResult.z.toFixed(1)}
                  </p>
                  <p className="text-xl font-bold text-white mt-4">
                    {zLabel(indicator, zResult.category, t)}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="px-4 py-4 bg-white dark:bg-[#1a2e28]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                    {t('nutrition.recommendation')}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    {zRec(zResult.category, t)}
                  </p>
                </div>
              </div>

              {/* Cutoff reference */}
              <div className="flex gap-2 text-[10px] px-1">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">SAM &lt;−3</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">MAM −3 to −2</span>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">Normal ≥−2</span>
              </div>
            </>
          )}

          {!zResult && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-4">{t('nutrition.noResult')}</p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2 px-1">
        <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t('nutrition.disclaimer')}</p>
      </div>
    </div>
  );
}
