import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useOpportunityDetail, usePrepChecklist } from '../hooks/useOpportunities'
import { pipelineApi } from '../lib/api'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import SkillGapBadges from '../components/opportunity/SkillGapBadges'
import PrepChecklist from '../components/opportunity/PrepChecklist'

function formatEligibility(val) {
  if (!val) return null
  if (typeof val === 'object') {
    const parts = Object.entries(val)
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()))
    return parts.length > 0 ? parts.join(', ') : 'Open'
  }
  return val
}

const urgencyStyles = {
  urgent: 'text-urgency-urgent border-urgency-urgent/20 bg-urgency-urgent/10',
  soon: 'text-urgency-soon border-urgency-soon/20 bg-urgency-soon/10',
  normal: 'text-urgency-normal border-urgency-normal/20 bg-urgency-normal/10',
  closed: 'text-urgency-closed border-urgency-closed/20 bg-urgency-closed/10',
}

function JsonRow({ label, value }) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-slate-800">
        {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
      </dd>
    </div>
  )
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { opportunity, loading, error } = useOpportunityDetail(id)
  const { prep, loading: prepLoading, error: prepError, fetch: fetchPrep } = usePrepChecklist(id)

  const [view, setView] = useState('structured')
  const [pipelineAction, setPipelineAction] = useState(null)
  const [pipelineError, setPipelineError] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handlePrep = () => {
    if (!prep) fetchPrep()
  }

  const handlePipelineAction = async (status) => {
    if (pipelineAction) return
    if (!opportunity) return
    setPipelineAction(status)
    setPipelineError('')
    try {
      await pipelineApi.add(opportunity.id, status)
      showToast(`Moved to "${status}" in pipeline`)
    } catch (err) {
      if (err.status === 409) {
        setPipelineError('This opportunity is already in your pipeline.')
      } else {
        setPipelineError(err.message || 'Could not update pipeline')
      }
      showToast(err.message || 'Could not add to pipeline', 'danger')
    } finally {
      setPipelineAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <EmptyState
        title="Opportunity not found"
        description={error || 'This opportunity may have been removed.'}
        action={<button onClick={() => navigate('/dashboard')} className="btn-primary">← Back to Dashboard</button>}
      />
    )
  }

  const urgency = opportunity.urgency || 'normal'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
            toast.type === 'success' ? 'bg-success-50 text-success-800 border-success-200' :
            toast.type === 'danger' ? 'bg-danger-50 text-danger-800 border-danger-200' :
            'bg-warning-50 text-warning-800 border-warning-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Back link */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header Card */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={opportunity.type} size="sm">{opportunity.type}</Badge>
              <Badge variant={urgency} size="sm">{urgency}</Badge>
              <Badge variant="default" size="sm">via {opportunity.source}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{opportunity.title}</h1>
            <p className="text-slate-500">{opportunity.organization}</p>
          </div>
          {/* External link */}
          {opportunity.external_url && (
            <a
              href={opportunity.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 btn-primary"
            >
              Visit Link
            </a>
          )}
        </div>

        {/* Deadline banner */}
        {opportunity.deadline && (
          <div className={`mt-5 p-4 rounded-xl border ${urgencyStyles[urgency]}`}>
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium">
                  {opportunity.daysLeft != null && opportunity.daysLeft < 0
                    ? 'This opportunity has closed'
                    : opportunity.daysLeft === 0
                      ? 'Deadline is today!'
                      : `${opportunity.daysLeft} day${opportunity.daysLeft === 1 ? '' : 's'} left`}
                </p>
                <p className="text-sm opacity-80">Deadline: {new Date(opportunity.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Pipeline Actions */}
      {pipelineError && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
          {pipelineError}
        </div>
      )}
      <Card padding="sm" className="border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 mr-2">Add to pipeline:</span>
          {['saved', 'preparing', 'applied'].map(status => (
            <Button
              key={status}
              variant="secondary"
              size="sm"
              onClick={() => handlePipelineAction(status)}
              disabled={pipelineAction === status}
              loading={pipelineAction === status}
              className="capitalize"
            >
              {pipelineAction === status ? 'Adding…' : status}
            </Button>
          ))}
        </div>
      </Card>

      {/* View Toggle: Structured vs Raw */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Details</h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('structured')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'structured' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Structured
            </button>
            <button
              onClick={() => setView('raw')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'raw' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Raw
            </button>
          </div>
        </div>

        {view === 'structured' ? (
          <div className="grid sm:grid-cols-2 gap-x-8">
            <div>
              <dl>
                <JsonRow label="Type" value={opportunity.type} />
                <JsonRow label="Source" value={opportunity.source} />
                <JsonRow label="Deadline" value={opportunity.deadline} />
                <JsonRow label="Skills" value={opportunity.skills} />
              </dl>
            </div>
            <div>
              <dl>
                <JsonRow label="Tags" value={opportunity.tags} />
                <JsonRow label="Eligibility" value={formatEligibility(opportunity.eligibility)} />
                <JsonRow label="Organization" value={opportunity.organization} />
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-4">
            {opportunity.raw_text ? (
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{opportunity.raw_text}</pre>
            ) : (
              <p className="text-sm text-slate-500">No raw text available for this opportunity.</p>
            )}
          </div>
        )}
      </Card>

      {/* Prep Checklist Section */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">AI Prep Plan</h2>
          {!prep && (
            <Button onClick={handlePrep} loading={prepLoading}>
              {prepLoading ? 'Building…' : 'Build prep plan'}
            </Button>
          )}
        </div>

        {prepError && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
            Couldn't build prep plan: {prepError}
          </div>
        )}

        {prep ? (
          <PrepChecklist prep={prep} />
        ) : prepLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-sm text-slate-500">Building your personalized prep plan…</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Generate a step-by-step prep plan tailored to your skill gaps and this opportunity's deadline.</p>
        )}
      </Card>
    </div>
  )
}