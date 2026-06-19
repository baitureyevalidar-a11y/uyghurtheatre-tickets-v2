type PomegranateProps = {
  size?: number;
  className?: string;
};

/**
 * Pomegranate (гранат) brand motif — the cultural hero mark.
 * Ported from design-source/files/01-theme.js. Main body uses `currentColor`
 * (set garnet via text colour); seeds are fixed white. Decorative only.
 */
export function Pomegranate({ size = 20, className }: PomegranateProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 4.5c0-1.4 1.2-2 2.4-1.6-.3 1-1 1.6-1.6 1.9 3.3.5 5.7 3.3 5.7 6.9 0 4-3 7.3-6.5 7.3S5.5 15.7 5.5 11.7c0-3.5 2.3-6.3 5.5-6.9-.6-.3-1.2-.9-1.5-1.8C10.7 2.6 12 3.1 12 4.5Z"
        fill="currentColor"
      />
      <g fill="#fff" fillOpacity="0.85">
        <circle cx="10" cy="11" r="1" />
        <circle cx="13.4" cy="10.4" r="1" />
        <circle cx="11.7" cy="13.2" r="1" />
        <circle cx="14.2" cy="13" r="0.9" />
        <circle cx="9.4" cy="13.7" r="0.9" />
      </g>
    </svg>
  );
}
