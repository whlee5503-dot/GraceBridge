import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, AlertTriangle, CheckCircle2, Circle, RefreshCw, Baby } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// ── Types ──────────────────────────────────────────────────────────
type Tab = 'dehydration' | 'pneumonia' | 'malDen' | 'newborn';
type DHKey = 'diarrhoea' | 'vomiting' | 'reducedUrine' | 'noTears' | 'dryMouth' | 'skinPinch' | 'lethargy' | 'unableDrink';
type PNKey = 'chestIndrawing' | 'stridor' | 'cyanosis' | 'alteredConsciousness';
type MalariaKey = 'feverChills' | 'pallor' | 'splenomegaly' | 'cerebral';
type DengueKey = 'musclePain' | 'rash' | 'bleeding' | 'retroOrbital' | 'tourniquet';
type NBKey = 'unableToFeed' | 'convulsions' | 'fastBreathing' | 'chestIndrawing' | 'fever' | 'hypothermia' | 'jaundice' | 'decreasedMovement' | 'umbilicalRedness' | 'eyeDischarge';

// ── Constants ──────────────────────────────────────────────────────
const DH_KEYS: DHKey[] = ['diarrhoea', 'vomiting', 'reducedUrine', 'noTears', 'dryMouth', 'skinPinch', 'lethargy', 'unableDrink'];
const DH_CRITICAL: DHKey[] = ['lethargy', 'unableDrink'];
const PN_DANGER_KEYS: PNKey[] = ['chestIndrawing', 'stridor', 'cyanosis', 'alteredConsciousness'];
const MALARIA_KEYS: MalariaKey[] = ['feverChills', 'pallor', 'splenomegaly', 'cerebral'];
const DENGUE_KEYS: DengueKey[] = ['musclePain', 'rash', 'bleeding', 'retroOrbital', 'tourniquet'];
const NB_KEYS: NBKey[] = ['unableToFeed', 'convulsions', 'fastBreathing', 'chestIndrawing', 'fever', 'hypothermia', 'jaundice', 'decreasedMovement', 'umbilicalRedness', 'eyeDischarge'];
const NB_CRITICAL: NBKey[] = ['unableToFeed', 'convulsions', 'fastBreathing', 'chestIndrawing'];

// ── Logic ──────────────────────────────────────────────────────────
function rrThreshold(ageMonths: number): number | null {
  if (ageMonths < 2) return 60;
  if (ageMonths < 12) return 50;
  if (ageMonths < 60) return 40;
  return null;
}

function dhSeverity(c: Set<DHKey>): 'none' | 'some' | 'severe' {
  if (DH_CRITICAL.some(k => c.has(k)) || c.size >= 4) return 'severe';
  if (c.size >= 2) return 'some';
  return 'none';
}

// ── Result Banner ──────────────────────────────────────────────────
type BannerColor = 'green' | 'yellow' | 'red';

const BANNER_STYLES: Record<BannerColor, { wrap: string; icon: string; title: string; body: string }> = {
  green: { wrap: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500', icon: 'text-green-600 dark:text-green-400', title: 'text-green-900 dark:text-green-200', body: 'text-green-800 dark:text-green-300' },
  yellow: { wrap: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500', icon: 'text-yellow-600 dark:text-yellow-400', title: 'text-yellow-900 dark:text-yellow-200', body: 'text-yellow-800 dark:text-yellow-300' },
  red: { wrap: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500', icon: 'text-red-600 dark:text-red-400', title: 'text-red-900 dark:text-red-200', body: 'text-red-800 dark:text-red-300' },
};

function ResultBanner({ color, title, action }: { color: BannerColor; title: string; action: string }) {
  const s = BANNER_STYLES[color];
  return (
    <div className={`rounded-2xl p-4 ${s.wrap}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {color === 'green'
          ? <CheckCircle2 size={22} className={s.icon} />
          : <AlertTriangle size={22} className={s.icon} />}
        <p className={`font-bold text-base ${s.title}`}>{title}</p>
      </div>
      <p className={`text-sm leading-relaxed ${s.body}`}>{action}</p>
    </div>
  );
}

// ── Symptom Toggle Row ─────────────────────────────────────────────
function SymRow({
  label, checked, onToggle, critical = false,
}: { label: string; checked: boolean; onToggle: () => void; critical?: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors border ${
        checked
          ? critical
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
            : 'bg-emerald-50 border-emerald-300'
          : 'bg-slate-50 dark:bg-[#243d36] border-slate-200 dark:border-[#2a4a40] hover:border-slate-300 dark:hover:border-[#4ade80]/40'
      }`}
    >
      {checked
        ? <CheckCircle2 size={20} className={`shrink-0 ${critical ? 'text-red-500' : 'text-emerald-500'}`} />
        : <Circle size={20} className="shrink-0 text-slate-300" />}
      <span className={`text-sm font-medium flex-1 ${
        checked ? (critical ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300') : 'text-slate-700 dark:text-slate-300'
      }`}>
        {label}
      </span>
      {critical && checked && (
        <span className="ml-auto shrink-0 text-xs bg-red-200 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">!</span>
      )}
    </button>
  );
}

// ── Score Bar ──────────────────────────────────────────────────────
function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-semibold ${color}`}>{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{score}/{max}</span>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-[#243d36] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DiagnosticCheck() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('dehydration');

  // Dehydration
  const [dhChecked, setDhChecked] = useState<Set<DHKey>>(new Set());
  const [dhResult, setDhResult] = useState<'none' | 'some' | 'severe' | null>(null);

  function dhToggle(k: DHKey) {
    setDhChecked(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setDhResult(null);
  }
  function dhReset() { setDhChecked(new Set()); setDhResult(null); }

  // Pneumonia
  const [pnAge, setPnAge] = useState('');
  const [pnRR, setPnRR] = useState('');
  const [pnDanger, setPnDanger] = useState<Set<PNKey>>(new Set());
  const [pnResult, setPnResult] = useState<'none' | 'pneumonia' | 'severe' | 'outOfRange' | null>(null);
  const [pnThresholdVal, setPnThresholdVal] = useState<number | null>(null);

  function pnToggle(k: PNKey) {
    setPnDanger(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setPnResult(null);
  }
  function pnAssess() {
    const age = parseFloat(pnAge);
    const rr = parseFloat(pnRR);
    if (isNaN(age) || isNaN(rr) || age < 0 || rr <= 0) return;
    const threshold = rrThreshold(age);
    setPnThresholdVal(threshold);
    if (threshold === null) { setPnResult('outOfRange'); return; }
    if (PN_DANGER_KEYS.some(k => pnDanger.has(k))) { setPnResult('severe'); return; }
    setPnResult(rr >= threshold ? 'pneumonia' : 'none');
  }
  function pnReset() { setPnAge(''); setPnRR(''); setPnDanger(new Set()); setPnResult(null); setPnThresholdVal(null); }

  // Malaria / Dengue
  const [mdMalaria, setMdMalaria] = useState<Set<MalariaKey>>(new Set());
  const [mdDengue, setMdDengue] = useState<Set<DengueKey>>(new Set());
  const [mdResult, setMdResult] = useState<'malaria' | 'dengue' | 'undifferentiated' | null>(null);

  function mdToggleM(k: MalariaKey) {
    setMdMalaria(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setMdResult(null);
  }
  function mdToggleD(k: DengueKey) {
    setMdDengue(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setMdResult(null);
  }
  function mdAssess() {
    const mPct = mdMalaria.size / MALARIA_KEYS.length;
    const dPct = mdDengue.size / DENGUE_KEYS.length;
    if (mPct > dPct) setMdResult('malaria');
    else if (dPct > mPct) setMdResult('dengue');
    else setMdResult('undifferentiated');
  }
  function mdReset() { setMdMalaria(new Set()); setMdDengue(new Set()); setMdResult(null); }

  // Newborn
  const [nbChecked, setNbChecked] = useState<Set<NBKey>>(new Set());
  const [nbResult, setNbResult] = useState<'danger' | 'safe' | null>(null);

  function nbToggle(k: NBKey) {
    setNbChecked(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setNbResult(null);
  }
  function nbReset() { setNbChecked(new Set()); setNbResult(null); }

  // Computed values for pneumonia threshold hint
  const pnAgeNum = parseFloat(pnAge);
  const pnLiveThreshold = !isNaN(pnAgeNum) && pnAgeNum >= 0 ? rrThreshold(pnAgeNum) : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dehydration', label: t('diagnose.tabDehydration') },
    { id: 'pneumonia', label: t('diagnose.tabPneumonia') },
    { id: 'malDen', label: t('diagnose.tabMalDen') },
    { id: 'newborn', label: t('diagnose.tabNewborn') },
  ];

  return (
    <div className="p-4 pb-10">
      {/* Header */}
      <header className="mb-4 pt-2">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Stethoscope size={20} style={{ color: 'var(--brand)' }} />
          {t('diagnose.title')}
        </h1>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#1a2e28] rounded-xl p-1 mb-5">
        {tabs.map(t_ => (
          <button
            key={t_.id}
            onClick={() => setTab(t_.id)}
            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg transition-colors leading-tight ${
              tab === t_.id
                ? 'bg-white dark:bg-[#243d36] text-[#1a6b4a] dark:text-[#4ade80] shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t_.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Dehydration ────────────────────────────────────── */}
      {tab === 'dehydration' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              {t('diagnose.dhInstr')}
            </p>
            <div className="space-y-2">
              {DH_KEYS.map(k => (
                <SymRow
                  key={k}
                  label={t(`diagnose.dh_${k}`)}
                  checked={dhChecked.has(k)}
                  onToggle={() => dhToggle(k)}
                  critical={DH_CRITICAL.includes(k)}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            {t('diagnose.dhSigns', { n: dhChecked.size })}
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={dhReset} className="flex items-center gap-1.5 shrink-0">
              <RefreshCw size={13} /> {t('diagnose.reset')}
            </Button>
            <Button fullWidth onClick={() => setDhResult(dhSeverity(dhChecked))}>
              {t('diagnose.assess')}
            </Button>
          </div>

          {dhResult !== null && (
            <>
              <ResultBanner
                color={dhResult === 'none' ? 'green' : dhResult === 'some' ? 'yellow' : 'red'}
                title={t(`diagnose.dhResult_${dhResult}`)}
                action={t(`diagnose.dhAction_${dhResult}`)}
              />

              {dhResult === 'some' && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                    {t('diagnose.dhORS')}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">{t('diagnose.dhORSDetail')}</p>
                </Card>
              )}
            </>
          )}

          <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic pt-1">{t('diagnose.disclaimer')}</p>
        </div>
      )}

      {/* ── Tab 2: Pneumonia ──────────────────────────────────────── */}
      {tab === 'pneumonia' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t('diagnose.pnAge')}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={pnAge}
                onChange={e => { setPnAge(e.target.value); setPnResult(null); }}
                placeholder="0 – 59"
                className="w-full border border-slate-200 dark:border-[#2a4a40] bg-white dark:bg-[#243d36] text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1a6b4a] dark:focus:ring-[#4ade80] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t('diagnose.pnRR')}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={pnRR}
                onChange={e => { setPnRR(e.target.value); setPnResult(null); }}
                placeholder="e.g. 45"
                className="w-full border border-slate-200 dark:border-[#2a4a40] bg-white dark:bg-[#243d36] text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1a6b4a] dark:focus:ring-[#4ade80] focus:border-transparent"
              />
            </div>

            {pnAge !== '' && !isNaN(pnAgeNum) && (
              <div className={`text-xs px-3 py-2 rounded-lg font-medium ${
                pnLiveThreshold !== null
                  ? 'bg-slate-100 dark:bg-[#243d36] text-slate-600 dark:text-slate-300'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              }`}>
                {pnLiveThreshold !== null
                  ? t('diagnose.pnThreshold', { n: pnLiveThreshold })
                  : t('diagnose.pnOutOfRange')}
              </div>
            )}
          </Card>

          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              {t('diagnose.pnDangerTitle')}
            </p>
            <div className="space-y-2">
              {PN_DANGER_KEYS.map(k => (
                <SymRow
                  key={k}
                  label={t(`diagnose.pn_${k}`)}
                  checked={pnDanger.has(k)}
                  onToggle={() => pnToggle(k)}
                  critical={true}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={pnReset} className="flex items-center gap-1.5 shrink-0">
              <RefreshCw size={13} /> {t('diagnose.reset')}
            </Button>
            <Button
              fullWidth
              onClick={pnAssess}
              disabled={pnAge === '' || pnRR === '' || isNaN(parseFloat(pnAge)) || isNaN(parseFloat(pnRR))}
            >
              {t('diagnose.assess')}
            </Button>
          </div>

          {pnResult !== null && pnResult !== 'outOfRange' && (
            <>
              <ResultBanner
                color={pnResult === 'none' ? 'green' : pnResult === 'pneumonia' ? 'yellow' : 'red'}
                title={t(`diagnose.pnResult_${pnResult}`)}
                action={t(`diagnose.pnAction_${pnResult}`)}
              />

              {pnThresholdVal !== null && pnRR !== '' && (
                <div className="space-y-1 px-1">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{t('diagnose.pnRR')}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{pnRR} / {pnThresholdVal} bpm</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-[#243d36] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pnResult === 'none' ? 'bg-green-400' : pnResult === 'pneumonia' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, (parseFloat(pnRR) / (pnThresholdVal * 1.6)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {pnResult === 'outOfRange' && (
            <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300">{t('diagnose.pnOutOfRange')}</p>
            </Card>
          )}

          <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic pt-1">{t('diagnose.disclaimer')}</p>
        </div>
      )}

      {/* ── Tab 3: Malaria / Dengue ───────────────────────────────── */}
      {tab === 'malDen' && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t('diagnose.mdInstr')}
          </p>

          {/* Malaria signs */}
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
              {t('diagnose.mdMalariaLabel')}
            </p>
            <div className="space-y-2">
              {MALARIA_KEYS.map(k => (
                <SymRow
                  key={k}
                  label={t(`diagnose.md_${k}`)}
                  checked={mdMalaria.has(k)}
                  onToggle={() => mdToggleM(k)}
                />
              ))}
            </div>
          </div>

          {/* Dengue signs */}
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
              {t('diagnose.mdDengueLabel')}
            </p>
            <div className="space-y-2">
              {DENGUE_KEYS.map(k => (
                <SymRow
                  key={k}
                  label={t(`diagnose.md_${k}`)}
                  checked={mdDengue.has(k)}
                  onToggle={() => mdToggleD(k)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={mdReset} className="flex items-center gap-1.5 shrink-0">
              <RefreshCw size={13} /> {t('diagnose.reset')}
            </Button>
            <Button fullWidth onClick={mdAssess}>
              {t('diagnose.assess')}
            </Button>
          </div>

          {mdResult !== null && (
            <>
              {/* Score bars */}
              <div className="space-y-3">
                <ScoreBar
                  label={t('diagnose.mdMalariaScore')}
                  score={mdMalaria.size}
                  max={MALARIA_KEYS.length}
                  color="text-orange-500"
                />
                <ScoreBar
                  label={t('diagnose.mdDengueScore')}
                  score={mdDengue.size}
                  max={DENGUE_KEYS.length}
                  color="text-purple-500"
                />
              </div>

              <ResultBanner
                color="yellow"
                title={t(`diagnose.mdResult_${mdResult}`)}
                action={t(`diagnose.mdAction_${mdResult}`)}
              />
            </>
          )}

          <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic pt-1">{t('diagnose.disclaimer')}</p>
        </div>
      )}

      {/* ── Tab 4: Newborn ───────────────────────────────────────── */}
      {tab === 'newborn' && (
        <div className="space-y-4">
          {/* Age note */}
          <div className="flex items-center gap-2 px-1 py-2 rounded-xl bg-slate-50 dark:bg-[#1a2e28] border border-slate-200 dark:border-[#2a4a40]">
            <Baby size={15} style={{ color: 'var(--brand)' }} className="shrink-0 ml-1" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {t('diagnose.nbAgeNote')}
            </p>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t('diagnose.nbInstr')}
          </p>

          <div className="space-y-2">
            {NB_KEYS.map(k => (
              <SymRow
                key={k}
                label={t(`diagnose.nb_${k}`)}
                checked={nbChecked.has(k)}
                onToggle={() => nbToggle(k)}
                critical={NB_CRITICAL.includes(k)}
              />
            ))}
          </div>

          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            {t('diagnose.nbSigns', { n: nbChecked.size })}
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={nbReset} className="flex items-center gap-1.5 shrink-0">
              <RefreshCw size={13} /> {t('diagnose.reset')}
            </Button>
            <Button fullWidth onClick={() => setNbResult(nbChecked.size > 0 ? 'danger' : 'safe')}>
              {t('diagnose.assess')}
            </Button>
          </div>

          {nbResult !== null && (
            <ResultBanner
              color={nbResult === 'danger' ? 'red' : 'green'}
              title={t(`diagnose.nbResult_${nbResult}`)}
              action={t(`diagnose.nbAction_${nbResult}`)}
            />
          )}

          <p className="text-xs text-center text-slate-400 dark:text-slate-500 italic pt-1">{t('diagnose.disclaimer')}</p>
        </div>
      )}
    </div>
  );
}
