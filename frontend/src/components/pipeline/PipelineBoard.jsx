import { useRef } from 'react'
import PipelineColumn from './PipelineColumn'
import { PIPELINE_STATUSES } from '../../hooks/usePipeline'
import Card from '../ui/Card'

export default function PipelineBoard({
  items,
  onStatusChange,
  onUpdateNotes,
  onRemove,
}) {
  const columnsRef = useRef({})

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex overflow-x-auto pb-4 -mx-6 px-6 space-x-4 min-h-[680px]">
        {PIPELINE_STATUSES.map(status => (
          <PipelineColumn
            key={status}
            ref={el => { columnsRef.current[status] = el }}
            status={status}
            items={items}
            onStatusChange={onStatusChange}
            onUpdateNotes={onUpdateNotes}
            onRemove={onRemove}
          />
        ))}
      </div>
    </Card>
  )
}