import type { CSSProperties } from 'react'

// Shared "energy" palette CSS custom properties — applied as inline style on
// each page's top-level wrapper so every client-facing surface (marketing
// site, portal, admin where relevant) stays visually consistent.
export const energyTheme: CSSProperties = {
  ['--paper' as string]: '#FAFCF5',
  ['--paper-deep' as string]: '#EFF3E4',
  ['--ink' as string]: '#20252D',
  ['--ink-soft' as string]: '#616876',
  ['--lime' as string]: '#C8F05B',
  ['--lime-deep' as string]: '#B1E23A',
  ['--lime-wash' as string]: '#EDFACD',
  ['--lime-ink' as string]: '#517E00',
  ['--purple' as string]: '#A795F6',
  ['--purple-deep' as string]: '#7C66E3',
  ['--purple-wash' as string]: '#ECE8FD',
  ['--blue' as string]: '#7DB9F0',
  ['--blue-deep' as string]: '#2E6FB4',
  ['--blue-wash' as string]: '#E3F0FC',
  ['--line' as string]: 'rgba(32,37,45,0.12)',
}
