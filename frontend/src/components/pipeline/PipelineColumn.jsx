import { useState, useRef, useCallback } from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import PipelineCard from './PipelineCard'
import EmptyState from '../ui/EmptyState'
import { PIPELINE_STATUSES } from '../../hooks/usePipeline'

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

export default function PipelineColumn({
  status,
  items,
  onStatusChange,
  onUpdateNotes,
  onRemove,
  allItemsRef,
}) {
  const columnRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    // Only clear if actually leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) {
      onStatusChange(itemId, status)
    }
  }, [status, onStatusChange])

  const handleDragStart = useCallback((e, itemId) => {
    e.dataTransfer.setData('text/plain', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const statusItems = items.filter(item => item.status === status)
  const count = statusItems.length

  return (
    <div
      ref={columnRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] flex-1 ${
        dragOver ? 'bg-primary-50/50 rounded-xl' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="list"
      aria-label={`${statusLabels[status]} column`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-xl border-b border-slate-200 ${statusColors[status]}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{statusLabels[status]}</h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/50">
            {count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px]">
        {statusItems.length === 0 ? (
          <EmptyState
            title="No items"
            description={`Drag items here or add new opportunities to "${statusLabels[status].toLowerCase()}"`}
            icon={
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        ) : (
          statusItems.map(item => (
            <PipelineCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onUpdateNotes={onUpdateNotes}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Drop zone hint */}
      {dragOver && (
        <div className="p-3 text-center text-sm text-primary-600 font-medium bg-primary-50 border-t border-primary-100">
          Drop to move here
        </div>
      )}
    </div>
  )
}