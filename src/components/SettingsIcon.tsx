import type { ReactNode } from 'react'

const paths = {
  theme: (
    <>
      <circle cx="13.5" cy="6.5" r="1.2" />
      <circle cx="17.3" cy="10.5" r="1.2" />
      <circle cx="8.5" cy="7.5" r="1.2" />
      <circle cx="6.5" cy="12.5" r="1.2" />
      <path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2-4c-.3-.4-.5-.8-.5-1.2a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-4.4-4.5-8-10-8z" />
    </>
  ),
  fontSize: (
    <>
      <path d="M3 19 7.5 5 12 19" />
      <path d="M4.6 14.5h5.8" />
      <path d="M15 19v-5a3 3 0 0 1 6 0v5" />
      <path d="M15 16h6" />
    </>
  ),
  fontFamily: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  opacity: <path d="M12 3s6 5.7 6 10a6 6 0 0 1-12 0c0-4.3 6-10 6-10z" />,
  lineHeight: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <path d="M2 4v16" />
    </>
  ),
  paragraph: (
    <>
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
    </>
  ),
  align: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h14" />
    </>
  ),
  flow: (
    <>
      <path d="M12 6C10 4.5 7 4 4 4v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z" />
      <path d="M12 6v14" />
    </>
  ),
  width: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
    </>
  ),
  grain: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
    </>
  ),
  speed: (
    <>
      <path d="M12 14l4-4" />
      <path d="M3.5 16a9 9 0 1 1 17 0" />
    </>
  ),
  pitch: (
    <>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 8v8" />
      <path d="M20 11v2" />
    </>
  ),
  voice: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  debug: (
    <>
      <rect x="7" y="8" width="10" height="12" rx="5" />
      <path d="M12 8V5" />
      <path d="M9 4l1.5 2" />
      <path d="M15 4l-1.5 2" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M3 17h4" />
      <path d="M17 17h4" />
    </>
  ),
  spread: (
    <>
      <path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z" />
      <path d="M21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </>
  ),
  crop: (
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  margin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>
  ),
  reflow: (
    <>
      <path d="M5 4h12a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7" />
      <path d="M6 18l3 3 3-3" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type SettingIconName = keyof typeof paths

export function SettingIcon({ name }: { name: SettingIconName }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
