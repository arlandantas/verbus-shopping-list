import { icons, type IconName } from './icons'

export type { IconName }

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={icons[name]} />
    </svg>
  )
}
