import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SkillGapBadges from './SkillGapBadges'
import PrepChecklist from './PrepChecklist'
import { usePrepChecklist } from '../../hooks/useOpportunities'

const urgencyIcons = {
  urgent: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  soon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  normal: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  closed: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
}

const urgencyLabels = {
  urgent: 'Urgent',
  soon: 'Soon',
  normal: 'Normal',
  closed: 'Closed',
}

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

export default function OpportunityCard({
  opp,
  score,
  onSaveToPipeline,
  savingToPipeline,
  initialPrep = false,
}) {
  const [showPrep, setShowPrep] = useState(initialPrep)
  const { prep, loading: prepLoading, error: prepError, fetch: fetchPrep } = usePrepChecklist(opp.id)

  const urgency = opp.urgency || 'normal'
  const daysLeft = opp.daysLeft

  const hasPrep = !!prep
  const eligibilityText = formatEligibility(opp.eligibility)

  return (
    <Card className="transition-all duration-200 hover:shadow-card-hover" padding="md">
      {/* Header: Title + Match Score */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <Link to={`/opportunities/${opp.id}`} className="font-semibold text-lg text-slate-900 hover:text-primary-600 transition-colors block mb-1">
            {opp.title}
          </Link>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            {opp.organization}
            {opp.source && <span className="text-slate-300">·</span>}
            {opp.source && <span>via {opp.source}</span>}
          </p>
        </div>

        {score && score.score != null && (
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
              <span className="text-2xl font-bold text-primary-700">{score.score}%</span>
            </div>
            <span className="text-xs text-slate-500">match</span>
          </div>
        )}
      </div>

      {/* Badges Row: Type + Urgency */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant={opp.type} size="sm">{opp.type}</Badge>
        <Badge variant={urgency} size="sm" className="flex items-center gap-1">
          {urgencyIcons[urgency]}
          {daysLeft !== null && daysLeft !== undefined
            ? daysLeft < 0 ? 'Closed' : daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
            : urgencyLabels[urgency]}
        </Badge>
      </div>

      {/* Summary & Eligibility */}
      {opp.summary && (
        <p className="text-sm text-slate-600 mb-2">{opp.summary}</p>
      )}
      {eligibilityText && (
        <p className="text-sm text-slate-500 mb-3">
          <span className="font-medium">Eligibility:</span> {eligibilityText}
        </p>
      )}

      {/* Tags */}
      {opp.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opp.tags.slice(0, 6).map((tag, i) => (
            <Badge key={i} variant="default" size="sm">{tag}</Badge>
          ))}
          {opp.tags.length > 6 && <Badge variant="default" size="sm">+{opp.tags.length - 6} more</Badge>}
        </div>
      )}

      {/* Match Insight */}
      {score?.reason && (
        <div className="mb-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
          <p className="text-xs font-medium text-primary-700 mb-1">Why this matches you</p>
          <p className="text-sm text-primary-800">{score.reason}</p>
        </div>
      )}

      {/* Skill Gap Badges */}
      {(score?.matched_skills?.length > 0 || score?.missing_skills?.length > 0) && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 mb-1.5">Skill match · green = matched, amber = to build</p>
          <SkillGapBadges
            matched={score.matched_skills || []}
            missing={score.missing_skills || []}
            maxVisible={5}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
        {!hasPrep ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowPrep(true); if (!prep) fetchPrep() }}
            loading={prepLoading && showPrep}
          >
            Help me prepare
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPrep(!showPrep)}
          >
            {showPrep ? 'Hide prep plan' : 'Show prep plan'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSaveToPipeline?.(opp)}
          disabled={savingToPipeline}
          className="ml-auto"
        >
          {savingToPipeline ? 'Saving…' : 'Save to pipeline'}
        </Button>

        <Link to={`/opportunities/${opp.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium ml-2">
          Details →
        </Link>
      </div>

      {/* Prep Checklist (when requested) */}
      {showPrep && (
        <div className="mt-4 animate-slide-up">
          {prepLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-primary-500 border-t-transparent" />
            </div>
          ) : prepError ? (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
              Couldn't build prep plan: {prepError}
            </div>
          ) : (
            <PrepChecklist prep={prep} />
          )}
        </div>
      )}
    </Card>
  )
}