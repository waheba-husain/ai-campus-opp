import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useOpportunities } from '../hooks/useOpportunities'
import { pipelineApi } from '../lib/api'
import OpportunityCard from '../components/opportunity/OpportunityCard'
import AddOpportunityForm from '../components/opportunity/AddOpportunityForm'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'

const URGENCY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'urgent', label: 'Urgent (≤3d)' },
  { value: 'soon', label: 'Soon (≤7d)' },
  { value: 'normal', label: 'Normal' },
]

const urgencyColors = {
  urgent: 'bg-urgency-urgent/10 text-urgency-urgent border-urgency-urgent/20',
  soon: 'bg-urgency-soon/10 text-urgency-soon border-urgency-soon/20',
  normal: 'bg-urgency-normal/10 text-urgency-normal border-urgency-normal/20',
}

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const { ranked, triage, loading, triageLoading, error, fetchRanked } = useOpportunities()
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [savingPipeline, setSavingPipeline] = useState(null)
  const [toast, setToast] = useState(null)

  const filteredRanked = urgencyFilter
    ? ranked.filter(r => r.urgency === urgencyFilter)
    : ranked

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveToPipeline = async (opp) => {
    if (savingPipeline) return
    setSavingPipeline(opp.id)
    try {
      await pipelineApi.add(opp.id, 'saved')
      showToast(`Saved "${opp.title}" to pipeline`)
    } catch (err) {
      if (err.status === 409) {
        showToast('Already in your pipeline', 'warning')
      } else {
        showToast(err.message || 'Failed to save', 'danger')
      }
    } finally {
      setSavingPipeline(null)
    }
  }

  const urgentCount = ranked.filter(r => r.urgency === 'urgent').length
  const soonCount = ranked.filter(r => r.urgency === 'soon').length

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
            toast.type === 'success' ? 'bg-success-50 text-success-800 border-success-200' :
            toast.type === 'warning' ? 'bg-warning-50 text-warning-800 border-warning-200' :
            'bg-danger-50 text-danger-800 border-danger-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-900">{user?.email?.split('@')[0] || 'there'}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
            profile?.skills?.length > 0
              ? 'bg-success-50 text-success-700 border-success-200'
              : 'bg-warning-50 text-warning-700 border-warning-200'
          }`}>
            {profile?.skills?.length > 0 ? 'Profile Complete' : 'Complete Profile'}
          </div>
          {urgentCount > 0 && (
            <Badge variant="urgent" size="sm">{urgentCount} Urgent</Badge>
          )}
          {soonCount > 0 && (
            <Badge variant="soon" size="sm">{soonCount} Soon</Badge>
          )}
        </div>
      </div>

      {/* Add Opportunity */}
      <div>
        <AddOpportunityForm onAdded={() => fetchRanked()} />
      </div>

      {/* Triage Filter Bar */}
      <Card padding="sm" className="border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 mr-2">Filter by urgency:</span>
          {URGENCY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setUrgencyFilter(value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${urgencyFilter === value
                  ? `border-2 ${urgencyColors[value] || 'bg-primary-50 text-primary-700 border-primary-300'}`
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }
              `}
              aria-pressed={urgencyFilter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Couldn't load opportunities"
            description={error}
            action={
              <button onClick={() => fetchRanked()} className="btn-primary">
                Try Again
              </button>
            }
          />
        )}

        {!loading && !error && filteredRanked.length === 0 && (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title={urgencyFilter ? `No ${urgencyFilter} opportunities` : 'No ranked opportunities yet'}
            description={urgencyFilter
              ? `No opportunities match the "${urgencyFilter}" filter. Try a different filter or rank your feed.`
              : 'Complete your profile and rank your feed to see personalized opportunities.'}
            action={
              <>
                {(!profile?.skills?.length || !profile?.skills?.length > 0) && (
                  <button onClick={() => navigate('/onboarding')} className="btn-primary">
                    Complete Profile
                  </button>
                )}
                <button onClick={() => fetchRanked()} className="btn-secondary ml-2">
                  Refresh Feed
                </button>
              </>
            }
          />
        )}

        {!loading && filteredRanked.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {urgencyFilter
                  ? `${URGENCY_FILTERS.find(f => f.value === urgencyFilter)?.label} — ${filteredRanked.length} opportunity${filteredRanked.length !== 1 ? 's' : ''}`
                  : `Your Feed — ${filteredRanked.length} opportunity${filteredRanked.length !== 1 ? 's' : ''}`}
              </h2>
              <span className="text-sm text-slate-500">Ranked by skill match</span>
            </div>
            <div className="space-y-4">
              {filteredRanked.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opp={item}
                  score={item}
                  onSaveToPipeline={handleSaveToPipeline}
                  savingToPipeline={savingPipeline === item.id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <details className="mt-8 text-xs text-slate-500">
          <summary className="cursor-pointer mb-2">Debug: Triage data</summary>
          <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-64">{JSON.stringify(triage, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}