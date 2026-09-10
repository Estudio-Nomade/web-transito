import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
} as const

const platePadClass = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
} as const

type LiftyLogoProps = {
  className?: string
  size?: keyof typeof sizeClass
  alt?: string
  /** Light plate so the dark/transparent wordmark stays visible on navy/dark surfaces */
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
        'flex items-center justify-center rounded-xl border border-black/5 bg-[#EDF1F5]',
        platePadClass[size],
        plateClassName,
      )}
    >
      {img}
    </div>
  )
}
