import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePipeline, PIPELINE_STATUSES } from '../hooks/usePipeline'
import { pipelineApi } from '../lib/api'
import PipelineBoard from '../components/pipeline/PipelineBoard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const statusLabels = {
  saved: 'Saved',
  preparing: 'Preparing',
  applied: 'Applied',
  result: 'Result',
}

const statusColors = {
  saved: 'bg-primary-50 text-primary-700 border-primary-200',
  preparing: 'bg-warning-50 text-warning-700 border-warning-200',
  applied: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  result: 'bg-success-50 text-success-700 border-success-200',
}

export default function Pipeline() {
  const navigate = useNavigate()
  const { items, loading, error, refetch, updateStatus, updateNotes, removeFromPipeline } = usePipeline()
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Optimistic status change
  const handleStatusChange = async (itemId, newStatus) => {
    const item = items.find(i => i.id === itemId)
    const oldStatus = item?.status
    try {
      await updateStatus(itemId, newStatus)
      showToast(`Moved to ${statusLabels[newStatus]}`)
    } catch (err) {
      showToast(err.message || 'Failed to update', 'danger')
    }
  }

  const handleUpdateNotes = async (itemId, notes) => {
    try {
      await updateNotes(itemId, notes)
      showToast('Notes saved')
    } catch (err) {
      showToast(err.message || 'Failed to save notes', 'danger')
    }
  }

  const handleRemove = async (itemId) => {
    if (!window.confirm('Remove this opportunity from your pipeline?')) return
    try {
      await removeFromPipeline(itemId)
      showToast('Removed from pipeline')
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'danger')
    }
  }

  // Group items by status for summary cards
  const counts = PIPELINE_STATUSES.reduce((acc, status) => {
    acc[status] = items.filter(i => i.status === status).length
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load pipeline"
        description={error}
        action={<button onClick={refetch} className="btn-primary">Try Again</button>}
      />
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Pipeline</h1>
          <p className="text-slate-600 mt-1">Track your applications from discovery to result</p>
        </div>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STATUSES.map(status => (
            <div key={status} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${statusColors[status]}`}>
              {statusLabels[status]}: {counts[status]}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="min-h-[680px]">
        {items.length === 0 ? (
          <Card className="text-center py-16">
            <EmptyState
              icon={
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Your pipeline is empty"
              description="Start by exploring opportunities on the Dashboard and save ones you want to apply to."
              action={
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                  Explore Opportunities
                </button>
              }
            />
          </Card>
        ) : (
          <PipelineBoard
            items={items}
            onStatusChange={handleStatusChange}
            onUpdateNotes={handleUpdateNotes}
            onRemove={handleRemove}
          />
        )}
      </div>

      {/* Legend / Help */}
      <Card padding="md" className="border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">How it works</h3>
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          {PIPELINE_STATUSES.map(status => (
            <div key={status} className="flex items-start gap-2">
              <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 bg-slate-400`} style={{ backgroundColor: status === 'saved' ? '#6366f1' : status === 'preparing' ? '#f59e0b' : status === 'applied' ? '#4f46e5' : '#10b981' }} />
              <div>
                <p className="font-medium text-slate-900">{statusLabels[status]}</p>
                <p className="text-slate-500">
                  {status === 'saved' && 'Bookmarked for later'}
                  {status === 'preparing' && 'Actively working on application'}
                  {status === 'applied' && 'Application submitted'}
                  {status === 'result' && 'Outcome known (accepted/rejected)'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}