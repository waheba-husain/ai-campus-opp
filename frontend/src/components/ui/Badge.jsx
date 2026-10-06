import { forwardRef } from 'react'

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-primary-100 text-primary-700 border border-primary-200',
    success: 'bg-success-50 text-success-700 border border-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    danger: 'bg-danger-50 text-danger-700 border border-danger-100',
    // Urgency variants
    urgent: 'bg-urgency-urgent/10 text-urgency-urgent border border-urgency-urgent/20',
    soon: 'bg-urgency-soon/10 text-urgency-soon border border-urgency-soon/20',
    normal: 'bg-urgency-normal/10 text-urgency-normal border border-urgency-normal/20',
    closed: 'bg-urgency-closed/10 text-urgency-closed border border-urgency-closed/20',
    // Type variants
    hackathon: 'bg-type-hackathon/10 text-type-hackathon border border-type-hackathon/20',
    internship: 'bg-type-internship/10 text-type-internship border border-type-internship/20',
    competition: 'bg-type-competition/10 text-type-competition border border-type-competition/20',
    scholarship: 'bg-type-scholarship/10 text-type-scholarship border border-type-scholarship/20',
    workshop: 'bg-type-workshop/10 text-type-workshop border border-type-workshop/20',
    other: 'bg-type-other/10 text-type-other border border-type-other/20',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  }

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variants[variant] || variants.default}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'
export default Badge