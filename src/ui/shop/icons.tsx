/** Shop UI icons (Figma icon set, redrawn as currentColor strokes so they follow the header tone). */
type Name = 'plus' | 'minus' | 'x' | 'search' | 'heart' | 'bag' | 'chevron-down' | 'chevron-right' | 'filter' | 'menu' | 'arrow-left' | 'arrow-right';
const P: Record<Name, JSX.Element> = {
  plus: <path d="M5 12h14M12 5v14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.3 4.5 7.5 4.5c1.9 0 3.4 1 4.5 2.6 1.1-1.6 2.6-2.6 4.5-2.6 3.2 0 5.5 2.9 4.5 6.2C19.5 15.4 12 20 12 20z" />,
  bag: (
    <>
      <path d="M5.5 7.5h13l-1 12.5h-11z" />
      <path d="M9 10V7a3 3 0 016 0v3" />
    </>
  ),
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  filter: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
};
export function SIcon({ name, size = 24, stroke = 2, className }: { name: Name; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
