import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { profileApi } from '../lib/api'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const YEARS = ['1st', '2nd', '3rd', '4th']
const BRANCHES = ['CSE', 'IT', 'AI/ML', 'Data Science', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other']
const TYPES = [
  { key: 'hackathon', label: 'Hackathons' },
  { key: 'internship', label: 'Internships' },
  { key: 'competition', label: 'Competitions' },
  { key: 'scholarship', label: 'Scholarships' },
  { key: 'workshop', label: 'Workshops' },
]

const EMPTY_FORM = { skills: [], interests: [], year: '', branch: '', looking_for: [] }

function formFromProfile(p) {
  if (!p) return { ...EMPTY_FORM }
  return {
    skills: Array.isArray(p.skills) ? p.skills : [],
    interests: Array.isArray(p.interests) ? p.interests : [],
    year: p.eligibility?.year || '',
    branch: p.eligibility?.branch || '',
    looking_for: Array.isArray(p.looking_for) ? p.looking_for : [],
  }
}

// Type a value, press Enter or comma to add it. Click ✕ to remove.
function ChipInput({ label, hint, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim().replace(/,$/, '').trim()
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...values, v])
    }
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-sm rounded-full pl-3 pr-2 py-1"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="text-slate-400 hover:text-slate-700"
              aria-label={`Remove ${v}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const hasExistingProfile = profile?.skills?.length > 0

  // 'view' = saved profile, 'choose' = pick manual/upload, 'form' = editable boxes
  const [step, setStep] = useState(hasExistingProfile ? 'view' : 'choose')
  const [form, setForm] = useState(formFromProfile(profile))
  const [fromAI, setFromAI] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleType = (key) =>
    setField(
      'looking_for',
      form.looking_for.includes(key)
        ? form.looking_for.filter((k) => k !== key)
        : [...form.looking_for, key]
    )

  const applyExtracted = (data) => {
    const p = data.profile || data.extracted || {}
    setForm({
      skills: p.skills || [],
      interests: p.interests || [],
      year: p.eligibility?.year || '',
      branch: p.eligibility?.branch || '',
      looking_for: p.looking_for || [],
    })
    setFromAI(true)
    setStep('form')
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      return
    }
    setExtracting(true)
    setError('')
    try {
      applyExtracted(await profileApi.extractPdf(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  const handlePaste = async () => {
    if (pasteText.trim().length < 10) return
    setExtracting(true)
    setError('')
    try {
      applyExtracted(await profileApi.extract(pasteText))
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  const handleManual = () => {
    setForm(formFromProfile(hasExistingProfile ? profile : null))
    setFromAI(false)
    setError('')
    setStep('form')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await profileApi.update({
        skills: form.skills,
        interests: form.interests,
        eligibility: { year: form.year, branch: form.branch },
        looking_for: form.looking_for,
      })
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const goDashboard = () => navigate('/dashboard', { replace: true })

  // ── VIEW: saved profile ──────────────────────────────────────
  if (step === 'view') {
    const p = profile || {}
    const row = (label, items) => (
      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">{label}</h3>
        {items.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((x, i) => <Badge key={i} variant="primary" size="sm">{x}</Badge>)}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Not set</p>
        )}
      </Card>
    )
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Profile</h1>
          <p className="text-slate-600">This drives your rankings and skill gaps. Keep it current.</p>
        </div>
        <div className="space-y-4 mb-6">
          {row('Skills', p.skills || [])}
          {row('Interests', p.interests || [])}
          {row('Year & branch', [p.eligibility?.year && `${p.eligibility.year} year`, p.eligibility?.branch].filter(Boolean))}
          {row('Looking for', p.looking_for || [])}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={handleManual} className="flex-1 max-w-xs">Edit profile</Button>
          <Button variant="secondary" onClick={() => setStep('choose')}>Update from resume</Button>
          <Button variant="secondary" onClick={goDashboard}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // ── CHOOSE: manual or upload ─────────────────────────────────
  if (step === 'choose') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {hasExistingProfile ? 'Update your profile' : 'Set up your profile'}
          </h1>
          <p className="text-slate-600">Choose how you want to fill it in. You can edit everything before saving.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Card padding="md">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">📄 Upload resume</h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload a PDF and AI fills in the fields for you. The file is read and thrown away, never stored.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            <Button onClick={() => fileRef.current?.click()} loading={extracting} className="w-full">
              {extracting ? 'Reading resume…' : 'Choose PDF'}
            </Button>
            <button
              type="button"
              onClick={() => setShowPaste((s) => !s)}
              className="text-xs text-slate-500 hover:text-slate-700 mt-3 underline"
            >
              {showPaste ? 'Hide paste option' : 'No PDF? Paste text instead'}
            </button>
          </Card>

          <Card padding="md">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">✍️ Fill manually</h3>
            <p className="text-sm text-slate-600 mb-4">
              Add your skills, interests and year yourself. Takes about a minute.
            </p>
            <Button variant="secondary" onClick={handleManual} className="w-full" disabled={extracting}>
              Start filling
            </Button>
          </Card>
        </div>

        {showPaste && (
          <Card padding="md" className="mb-4">
            <Textarea
              label="Paste your resume, LinkedIn About, or a short summary"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              disabled={extracting}
            />
            <Button onClick={handlePaste} loading={extracting} className="mt-3 w-full">
              {extracting ? 'Extracting with AI…' : 'Extract with AI'}
            </Button>
          </Card>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="text-center">
          {hasExistingProfile ? (
            <Button variant="ghost" onClick={() => setStep('view')}>Cancel</Button>
          ) : (
            <Button variant="ghost" onClick={goDashboard}>Skip for now</Button>
          )}
        </div>
      </div>
    )
  }

  // ── FORM: separate editable boxes ────────────────────────────
  const branchOptions = form.branch && !BRANCHES.includes(form.branch)
    ? [form.branch, ...BRANCHES]
    : BRANCHES

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {fromAI ? 'Check what AI found' : 'Your details'}
        </h1>
        <p className="text-slate-600">
          {fromAI
            ? 'AI filled this from your resume. Remove anything that is wrong or that you could not explain in an interview.'
            : 'Type a skill and press Enter to add it.'}
        </p>
      </div>

      <Card padding="md" className="mb-4 space-y-6">
        <ChipInput
          label="Skills"
          hint="Languages, frameworks, tools you actually use"
          values={form.skills}
          onChange={(v) => setField('skills', v)}
          placeholder="e.g. Python, React, SQL"
        />

        <ChipInput
          label="Interests"
          hint="Areas you want to work in"
          values={form.interests}
          onChange={(v) => setField('interests', v)}
          placeholder="e.g. Machine Learning, Web Dev"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Year of study</label>
            <select
              value={form.year}
              onChange={(e) => setField('year', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y} year</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Branch</label>
            <select
              value={form.branch}
              onChange={(e) => setField('branch', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select branch</option>
              {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Looking for</label>
          <div className="flex flex-wrap gap-3">
            {TYPES.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.looking_for.includes(key)}
                  onChange={() => toggleType(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => { setError(''); setStep('choose') }}>← Back</Button>
        <Button onClick={handleSave} loading={saving} className="flex-1 max-w-xs">
          {saving ? 'Saving…' : 'Save & Continue'}
        </Button>
      </div>

      <Button variant="ghost" onClick={goDashboard} className="mt-4 w-full">
        Skip, I'll fill this in later
      </Button>
    </div>
  )
}