import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type SVGProps,
} from 'react';

/**
 * boulder.best brand mark, split so you can pass in your own logo component
 * instead of inlining the rock paths. <AppBrandMark logo={RockLogo} height={22}
 * />
 *
 * - `BrandWordmark` is the pure inline-SVG wordmark (the part that must be SVG:
 *   "boulder" + the "da"/dot glyph column + "best"). Spacing is pinned with
 *   `textLength`, so it's font-independent. No icon, no HTML spans.
 * - `AppBrandMark` is a thin inline-flex wrapper that renders YOUR logo at the
 *   left, sized to match, then the wordmark. The only CSS here is flexbox to
 *   sit two components side by side — the lettering layout is still all SVG.
 *
 * Accessibility: the wrapper is aria-hidden; put the label on the parent link:
 * <a href="/" aria-label="boulder.best"><AppBrandMark logo={RockLogo} /></a>
 */

// ── Wordmark geometry (SVG user units; icon lives outside now) ────────────────
const CAP = 15; // main wordmark font size
const CH = 0.52 * CAP; // monospace char advance ≈ 7.8

const W_BOULDER = 7 * CH; // 54.6
const X_GLYPH = W_BOULDER; // start of the . column (wordmark origin; no icon inside)
const W_GLYPH = CH; // 7.8  (one char slot)
const X_GLYPH_MID = X_GLYPH + W_GLYPH / 2; // 58.5
const X_BEST = X_GLYPH + W_GLYPH; // 62.4
const W_BEST = 4 * CH; // 31.2

const WORDMARK_W = X_BEST + W_BEST; // 93.6 — trimmed to content
const WORDMARK_H = 22;

const BASELINE = 16;

const FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

// ─────────────────────────────────────────────────────────────────────────────
// Rock icon (matches public/favicon.svg)
// ─────────────────────────────────────────────────────────────────────────────

export interface RockLogoProps extends Omit<
  SVGProps<SVGSVGElement>,
  'height' | 'width'
> {
  width?: number | string;
  height?: number | string;
}

/** Bouldering rock with hold — standalone React version of public/favicon.svg. */
export const RockLogo = ({ width, height, ...rest }: RockLogoProps) => {
  const uid = useId();
  const rockGradientId = `${uid}-rock`;
  const holdGradientId = `${uid}-hold`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        <linearGradient
          id={rockGradientId}
          x1="10"
          y1="10"
          x2="54"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6D737C" />
          <stop offset="1" stopColor="#1F2328" />
        </linearGradient>
        <linearGradient
          id={holdGradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#FF4FD8" />
          <stop offset="1" stopColor="#FF4FD8" />
        </linearGradient>
      </defs>

      <path
        d="M18 8 L25 6 L32 8 L38 6 L45 8 L52 12 L57 18 L60 26 L59 35 L56 43 L50 51 L42 56 L33 59 L24 58 L16 53 L10 45 L8 36 L9 26 L12 17 L14 12 Z"
        fill={`url(#${rockGradientId})`}
      />

      <path
        d="M20 12 C15 14 13 19 12 24 C11 31 12 38 15 44 C18 49 22 53 27 55 C29 56 31 56 33 56 C27 51 24 45 24 38 C24 30 27 22 32 15 C28 12 24 11 20 12 Z"
        fill="#FFFFFF"
        opacity="0.11"
      />

      <path
        d="M24 30 C26 23 35 20 41 24 C47 28 48 37 43 42 C38 47 29 47 24 43 C19 39 21 36 24 30 Z"
        fill={`url(#${holdGradientId})`}
      />

      <path
        d="M25 31 C27 26 35 23 40 26 C44 29 45 36 41 39 C37 42 31 42 26 39 C23 37 23 35 25 31 Z"
        fill="#000000"
        opacity="0.15"
      />

      <path
        d="M27 29 C29 26 35 25 38 27 C40 29 40 31 39 32 C37 30 33 29 30 30 C29 30 28 30 27 29 Z"
        fill="#FFFFFF"
        opacity="0.22"
      />

      <g opacity="0.95">
        <circle cx="33" cy="33" r="2.2" fill="#A80077" />
        <circle cx="33" cy="33" r="0.95" fill="#000000" opacity="0.22" />
        <circle cx="37.5" cy="35.5" r="1.8" fill="#A80077" />
        <circle cx="37.5" cy="35.5" r="0.8" fill="#000000" opacity="0.2" />
      </g>

      <g fill="none" stroke="#000000" opacity="0.18" strokeWidth="1">
        <circle cx="18" cy="22" r="1.4" />
        <circle cx="46" cy="20" r="1.4" />
        <circle cx="20" cy="46" r="1.4" />
        <circle cx="49" cy="46" r="1.4" />
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// The wordmark only (pure SVG). Useful on its own, e.g. footers without the icon.
// ─────────────────────────────────────────────────────────────────────────────
export interface BrandWordmarkProps extends Omit<
  SVGProps<SVGSVGElement>,
  'height' | 'width'
> {
  /** Rendered height in px. Width follows the aspect ratio. */
  height?: number;
}

export const BrandWordmark = ({ height = 22, ...rest }: BrandWordmarkProps) => (
  <svg
    height={height}
    width={height * (WORDMARK_W / WORDMARK_H)}
    viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <text
      x={0}
      y={BASELINE}
      textLength={W_BOULDER}
      lengthAdjust="spacingAndGlyphs"
      fontFamily={FONT_STACK}
      fontWeight={700}
      fontSize={CAP}
      fill="currentColor"
    >
      boulder
    </text>

    {/* glyph column: "da" superscript centered over the dot */}
    <text
      x={X_GLYPH_MID}
      y={10.5}
      textAnchor="middle"
      fontFamily={FONT_STACK}
      fontWeight={700}
      fontSize={7.5}
      fill="var(--mantine-color-dimmed)"
    >
      da
    </text>

    {/* the separator dot — sits under "da", pink to pop against blue "best" */}
    <text
      x={X_GLYPH_MID}
      y={11.5}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily={FONT_STACK}
      fontWeight={700}
      fontSize={9}
      fill="var(--mantine-color-pink-filled)"
    >
      .
    </text>

    <text
      x={X_BEST}
      y={BASELINE}
      textLength={W_BEST}
      lengthAdjust="spacingAndGlyphs"
      fontFamily={FONT_STACK}
      fontWeight={700}
      fontSize={CAP}
      fill="var(--mantine-color-blue-filled)"
    >
      best
    </text>
  </svg>
);

export interface AppBrandMarkProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'color'
> {
  /** Rendered height in px. e.g. sm 18, md 22, lg 26. */
  height?: number;
}

export const AppBrandMark = ({
  height = 22,
  style,
  ...rest
}: AppBrandMarkProps) => {
  const iconPx = height * (20 / WORDMARK_H);
  const gap = height * (3 / WORDMARK_H);

  const blockSvg: CSSProperties = { display: 'block' };

  const wrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap,
    ...style,
  };

  return (
    // aria-hidden by default — the parent link supplies aria-label="boulder.best".
    // Spread `rest` last so callers can override (className, aria-*, etc).
    <span aria-hidden {...rest} style={wrapperStyle}>
      <RockLogo height={iconPx} style={blockSvg} width={iconPx} />
      <BrandWordmark height={height} style={blockSvg} />
    </span>
  );
};
