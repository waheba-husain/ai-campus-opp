import Badge from '../ui/Badge'
import Card from '../ui/Card'

export default function PrepChecklist({ prep }) {
  if (!prep) return null

  return (
    <div className="space-y-4">
      {prep.needsRegistration && prep.registrationSteps?.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary" size="sm">Registration</Badge>
            <h4 className="font-semibold text-slate-900">Registration Steps</h4>
          </div>
          <ol className="space-y-2">
            {prep.registrationSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {prep.prepChecklist?.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="success" size="sm">Prep</Badge>
            <h4 className="font-semibold text-slate-900">Prep Checklist</h4>
          </div>
          <ul className="space-y-2">
            {prep.prepChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <svg className="flex-shrink-0 mt-0.5 h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {prep.timeline && (
        <Card padding="md" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-semibold text-primary-900">Suggested Timeline</h4>
          </div>
          <p className="text-sm text-primary-800">{prep.timeline}</p>
        </Card>
      )}
    </div>
  )
}