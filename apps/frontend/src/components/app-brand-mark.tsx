import type { SVGProps } from 'react';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Cap height for boulder / best (viewBox units). */
const CAP = 15;
const BASELINE = 16;

/** Monospace advance at CAP (tuned to avoid gaps in the SVG layout). */
const charAdvance = (count: number) => count * CAP * 0.52;

const ICON = 20;
const ICON_GAP = 4;
const BOULDER_X = ICON + ICON_GAP;
const BOULDER_LEN = 6;
const GLYPH_W = 7;
const BEST_LEN = 4;

const BOULDER_END = BOULDER_X + charAdvance(BOULDER_LEN);
const GLYPH_X = BOULDER_END;
const BEST_X = GLYPH_X + GLYPH_W;
const VIEW_W = BEST_X + charAdvance(BEST_LEN);

/** Wordmark + rock icon as a single scalable SVG (viewBox units). */
export const AppBrandMark = ({
  height = 22,
  ...props
}: SVGProps<SVGSVGElement> & { height?: number }) => (
  <svg
    aria-hidden
    fill="none"
    height={height}
    viewBox={`0 0 ${VIEW_W} 20`}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <image height={ICON} href="/favicon.svg" width={ICON} x="0" y="0" />

    <text
      fill="currentColor"
      fontFamily={MONO}
      fontSize={CAP}
      fontWeight="700"
      x={BOULDER_X}
      y={BASELINE}
    >
      boulder
    </text>

    {/* da + . share one column: dot centered under da, cap height matches wordmark */}
    <g transform={`translate(${GLYPH_X}, 2.5)`}>
      <text
        fill="var(--mantine-color-dimmed)"
        fontFamily={MONO}
        fontSize="7.5"
        fontWeight="600"
        textAnchor="middle"
        x={GLYPH_W / 2}
        y="6"
      >
        da
      </text>
      <text
        dominantBaseline="middle"
        fill="var(--mantine-color-blue-filled)"
        fontFamily={MONO}
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
        x={GLYPH_W / 2}
        y="10.5"
      >
        .
      </text>
    </g>

    <text
      fill="var(--mantine-color-blue-filled)"
      fontFamily={MONO}
      fontSize={CAP}
      fontWeight="700"
      x={BEST_X}
      y={BASELINE}
    >
      best
    </text>
  </svg>
);
