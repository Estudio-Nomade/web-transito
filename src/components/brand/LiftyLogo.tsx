import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-20',
} as const

type LiftyLogoProps = {
  className?: string
  size?: keyof typeof sizeClass
  alt?: string
  /** Soft translucent plate so the dark/transparent wordmark stays visible on navy/dark surfaces */
  onLightPlate?: boolean
  plateClassName?: string
}

export function LiftyLogo({
  className,
  size = 'md',
  alt = 'Lifty',
  onLightPlate = false,
  plateClassName,
}: LiftyLogoProps) {
  const img = (
    <img
      src="/lifty-logo.png"
      alt={alt}
      className={cn('w-auto max-w-full object-contain', sizeClass[size], className)}
    />
  )

  if (!onLightPlate) return img

  return (
    <div
      className={cn(
        'inline-flex w-fit items-center justify-center rounded-md bg-white/80 p-1 backdrop-blur-sm',
        plateClassName,
      )}
    >
      {img}
    </div>
  )
}
