import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-xl border border-slate-200 shadow-card
        ${hover ? 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
export default Card