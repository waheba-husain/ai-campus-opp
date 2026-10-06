import { useState } from 'react'
import { useBulkExtract } from '../../hooks/useOpportunities'
import Card from '../ui/Card'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function AddOpportunityForm({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [rawText, setRawText] = useState('')
  const [selected, setSelected] = useState({}) // index -> true/false
  const [summary, setSummary] = useState(null)
  const { candidates, loading, saving, error, extractBulk, saveSelected, reset } = useBulkExtract()

  const handleExtract = async () => {
    if (!rawText.trim()) return
    try {
      const list = await extractBulk(rawText)
      // tick everything that is not already saved
      const initial = {}
      list.forEach((c, i) => { initial[i] = !c.alreadyExists })
      setSelected(initial)
    } catch {
      // error already captured in hook
    }
  }

  const toggle = (i) => setSelected((prev) => ({ ...prev, [i]: !prev[i] }))

  const chosen = candidates.filter((c, i) => selected[i] && !c.alreadyExists)

  const handleSave = async () => {
    if (chosen.length === 0) return
    try {
      const res = await saveSelected(chosen)
      setSummary({ saved: res.saved?.length || 0, skipped: res.skipped || 0 })
      onAdded?.(res.saved || [])
    } catch {
      // error already captured in hook
    }
  }

  const handleClose = () => {
    setOpen(false)
    setRawText('')
    setSelected({})
    setSummary(null)
    reset()
  }

  const handleAnother = () => {
    setRawText('')
    setSelected({})
    setSummary(null)
    reset()
  }

  const formatEligibility = (val) => {
    if (val === null || val === undefined || val === '') return '—'
    if (typeof val === 'object') {
      return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'
    }
    return String(val)
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add opportunities
      </Button>
    )
  }

  return (
    <Card padding="md" className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Paste opportunities</h3>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          ✕
        </button>
      </div>

      {/* STEP 3: saved */}
      {summary ? (
        <>
          <p className="text-sm text-slate-700 mb-4">
            Added {summary.saved} to your feed
            {summary.skipped > 0 ? `, skipped ${summary.skipped} duplicate${summary.skipped > 1 ? 's' : ''}` : ''}.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleAnother} className="flex-1">Paste more</Button>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </>
      ) : candidates.length === 0 ? (
        /* STEP 1: paste */
        <>
          <Textarea
            label="Paste one or many — WhatsApp forwards, Instagram captions, emails"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the whole message here. The AI will split it into separate opportunities…"
            rows={8}
            error={error}
            disabled={loading}
          />
          <div className="flex gap-3 mt-4">
            <Button onClick={handleExtract} loading={loading} className="flex-1">
              {loading ? 'Extracting with AI…' : 'Extract Opportunities'}
            </Button>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          </div>
        </>
      ) : (
        /* STEP 2: preview and pick */
        <>
          <p className="text-sm text-slate-600 mb-3">
            Found {candidates.length} opportunit{candidates.length > 1 ? 'ies' : 'y'}. Tick the ones to keep.
          </p>

          <div className="space-y-3 mb-4">
            {candidates.map((c, i) => (
              <label
                key={i}
                className={`block border rounded-lg p-3 ${
                  c.alreadyExists ? 'bg-slate-50 opacity-60' : 'bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!selected[i] && !c.alreadyExists}
                    disabled={c.alreadyExists}
                    onChange={() => toggle(i)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{c.title}</span>
                      <Badge size="sm">{c.type}</Badge>
                      {c.alreadyExists && <Badge size="sm" variant="default">Already saved</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {c.organization ? `${c.organization} · ` : ''}
                      Deadline: {c.deadline || '—'}
                    </p>
                    <p className="text-sm text-slate-600">Eligibility: {formatEligibility(c.eligibility)}</p>
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.skills.map((s, j) => <Badge key={j} size="sm">{s}</Badge>)}
                      </div>
                    )}
                    {c.raw_snippet && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 cursor-pointer">Show original text</summary>
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded mt-1">
                          {c.raw_snippet}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving} disabled={chosen.length === 0} className="flex-1">
              {saving ? 'Saving…' : `Save ${chosen.length} selected`}
            </Button>
            <Button variant="secondary" onClick={handleAnother}>Back</Button>
          </div>
        </>
      )}
    </Card>
  )
}