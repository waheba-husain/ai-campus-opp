import Badge from '../ui/Badge'

export default function SkillGapBadges({ matched = [], missing = [], maxVisible = 6 }) {
  const allMatched = matched.slice(0, maxVisible)
  const allMissing = missing.slice(0, maxVisible)
  const moreMatched = matched.length > maxVisible
  const moreMissing = missing.length > maxVisible

  if (!matched.length && !missing.length) {
    return <span className="text-sm text-slate-500">No skill analysis available</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allMatched.map((skill, i) => (
        <Badge key={i} variant="success" size="sm" className="gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden="true" />
          {skill}
        </Badge>
      ))}
      {moreMatched && (
        <Badge variant="default" size="sm">+{matched.length - maxVisible} more</Badge>
      )}
      {allMissing.map((skill, i) => (
        <Badge key={i} variant="warning" size="sm" className="gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning-500" aria-hidden="true" />
          {skill}
        </Badge>
      ))}
      {moreMissing && (
        <Badge variant="default" size="sm">+{missing.length - maxVisible} more</Badge>
      )}
    </div>
  )
}