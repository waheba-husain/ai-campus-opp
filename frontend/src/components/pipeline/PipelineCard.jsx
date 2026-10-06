import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Button from '../ui/Button'

const urgencyColors = {
  urgent: 'text-urgency-urgent border-urgency-urgent/20 bg-urgency-urgent/10',
  soon: 'text-urgency-soon border-urgency-soon/20 bg-urgency-soon/10',
  normal: 'text-urgency-normal border-urgency-normal/20 bg-urgency-normal/10',
  closed: 'text-urgency-closed border-urgency-closed/20 bg-urgency-closed/10',
}

export default function PipelineCard({
  item,
  onStatusChange,
  onUpdateNotes,
  onRemove,
  isDragging = false,
}) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')
  const { opportunity } = item
  const urgency = opportunity?.urgency || 'normal'

  const handleSaveNotes = () => {
    onUpdateNotes(item.id, notes || null)
    setEditingNotes(false)
  }

  return (
    <Card
      className={`transition-all duration-150 ${isDragging ? 'opacity-50 rotate-1 scale-102 shadow-lg' : ''}`}
      padding="md"
      onClick={() => !editingNotes && (window.location.href = `/opportunities/${opportunity.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link to={`/opportunities/${opportunity.id}`} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <h4 className="font-semibold text-slate-900 truncate mb-1">{opportunity.title}</h4>
          <p className="text-xs text-slate-500">{opportunity.organization}</p>
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          className="text-slate-400 hover:text-danger-500 p-1 rounded transition-colors"
          aria-label="Remove from pipeline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {opportunity.deadline && (
        <div className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyColors[urgency]} mb-3 inline-block`}>
          {opportunity.daysLeft != null && opportunity.daysLeft < 0
            ? 'Closed'
            : opportunity.daysLeft === 0
              ? 'Deadline today!'
              : `${opportunity.daysLeft}d left`}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant={opportunity.type} size="sm">{opportunity.type}</Badge>
        {opportunity.tags?.slice(0, 3).map((tag, i) => (
          <Badge key={i} variant="default" size="sm">{tag}</Badge>
        ))}
        {opportunity.tags?.length > 3 && <Badge variant="default" size="sm">+{opportunity.tags.length - 3}</Badge>}
      </div>

      {/* Match score if available */}
      {item.score != null && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500">Match:</span>
          <div className="w-20 h-5 rounded bg-primary-50 border border-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">{item.score}%</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="border-t border-slate-100 pt-3">
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => { e.stopPropagation(); setNotes(e.target.value) }}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add notes..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotes(item.notes || '') }}>Cancel</Button>
              <Button size="sm" onClick={handleSaveNotes}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {item.notes ? (
                <p className="text-sm text-slate-600 line-clamp-2">{item.notes}</p>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingNotes(true) }}
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  + Add notes
                </button>
              )}
            </div>
            {item.notes && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingNotes(true) }}
                className="text-xs text-slate-400 hover:text-primary-600"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}