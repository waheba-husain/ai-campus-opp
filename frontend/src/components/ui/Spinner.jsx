import { forwardRef } from 'react'

const Spinner = forwardRef(({
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  }

  return (
    <div
      ref={ref}
      className={`${sizes[size]} rounded-full border-primary-500 border-t-transparent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
})

Spinner.displayName = 'Spinner'
export default Spinner