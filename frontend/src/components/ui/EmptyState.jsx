import { forwardRef } from 'react'

const EmptyState = forwardRef(({
  title = 'Nothing here yet',
  description = '',
  icon,
  action,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        flex flex-col items-center justify-center text-center py-12 px-4
        bg-slate-50 rounded-xl border border-slate-200
        ${className}
      `}
      {...props}
    >
      {icon && (
        <div className="text-slate-300 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  )
})

EmptyState.displayName = 'EmptyState'
export default EmptyState