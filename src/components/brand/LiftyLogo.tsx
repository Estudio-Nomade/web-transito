import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
} as const

type LiftyLogoProps = {
  className?: string
  size?: keyof typeof sizeClass
  alt?: string
}

export function LiftyLogo({ className, size = 'md', alt = 'Lifty' }: LiftyLogoProps) {
  return (
    <img
      src="/lifty-logo.png"
      alt={alt}
      className={cn('w-auto max-w-full object-contain', sizeClass[size], className)}
    />
  )
}
