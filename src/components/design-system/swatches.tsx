// Component for color swatches
export function ColorSwatch({
  name,
  className,
  textClass = "text-text-default",
}: { name: string; className?: string; textClass?: string }) {
  return (
    <div className="flex flex-col">
      <div className={`h-20 rounded-radius-04 ${className}`}></div>
      <p className={`mt-spacing-02 text-small font-medium ${textClass}`}>{name}</p>
    </div>
  )
}

// Component for border swatches
export function BorderSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col">
      <div className={`h-20 rounded-radius-04 border-4 ${className}`}></div>
      <p className="mt-spacing-02 text-small font-medium">{name}</p>
    </div>
  )
}

// Component for avatar swatches
export function AvatarSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-16 h-16 rounded-radius-round flex items-center justify-center text-text-inverted font-bold ${className}`}
      >
        AB
      </div>
      <p className="mt-spacing-03 text-small font-medium">{name}</p>
    </div>
  )
}

// Component for tag swatches
export function TagSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`px-spacing-04 py-spacing-02 rounded-radius-round ${className}`}>Tag Example</div>
      <p className="mt-spacing-03 text-small font-medium">{name}</p>
    </div>
  )
}

// Component for spacing swatches
export function SpacingSwatch({ name, size }: { name: string; size: string }) {
  const spacingClass = `p-${name}`

  return (
    <div className="flex items-center">
      <div className="w-32 text-small font-medium">{name}</div>
      <div className="flex-1 flex items-center">
        <div className="bg-bg-primary h-4"></div>
        <div className={`${spacingClass} bg-bg-primary-light h-4`}></div>
        <div className="bg-bg-primary h-4"></div>
      </div>
      <div className="w-32 text-small text-text-lighter ml-spacing-04">{size}</div>
    </div>
  )
}

// Component for border radius swatches
export function BorderRadiusSwatch({ name, size }: { name: string; size: string }) {
  const radiusClass = `rounded-${name}`

  return (
    <div className="flex flex-col">
      <div className={`h-24 w-full bg-bg-primary ${radiusClass}`}></div>
      <p className="mt-spacing-03 text-small font-medium">{name}</p>
      <p className="text-small text-text-lighter">{size}</p>
    </div>
  )
}

// Component for shadow swatches
export function ShadowSwatch({ name }: { name: string }) {
  return (
    <div className="flex flex-col">
      <div className={`h-24 w-full bg-bg-lightest rounded-radius-04 ${name}`}></div>
      <p className="mt-spacing-03 text-small font-medium">{name}</p>
    </div>
  )
}
