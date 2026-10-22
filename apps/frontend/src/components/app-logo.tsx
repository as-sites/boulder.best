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

/** Bouldering wall with B mark — standalone React version of public/favicon.svg. */
export const RockLogo = ({ width, height, ...rest }: RockLogoProps) => {
  const uid = useId();
  const g0 = `${uid}-g0`;
  const g1 = `${uid}-g1`;
  const g2 = `${uid}-g2`;

  // The "B" letterform uses the HarvestItal font from the original SVG source.
  // Load it via @font-face in global CSS; browsers fall back to serif without it.
  const bStyle = {
    textAlign: 'start',
    textAlignLast: 'auto',
    fontFamily: 'HarvestItal',
    fontSize: 330,
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 540 540"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        <linearGradient
          id={g0}
          gradientUnits="objectBoundingBox"
          x1="0.0372146115093478"
          y1="0.0593732194111215"
          x2="0.041095890410959"
          y2="0.0603988603988602"
          spreadMethod="repeat"
        >
          <stop
            stopColor="#ad7549"
            offset="0.228187918663025"
            stopOpacity="1"
          />
          <stop
            stopColor="#956639"
            offset="0.255033552646637"
            stopOpacity="1"
          />
          <stop
            stopColor="#ae6a3c"
            offset="0.268456369638443"
            stopOpacity="1"
          />
          <stop
            stopColor="#d78738"
            offset="0.416107386350632"
            stopOpacity="1"
          />
          <stop
            stopColor="#ae6a3c"
            offset="0.429530203342438"
            stopOpacity="1"
          />
          <stop
            stopColor="#af6535"
            offset="0.610738277435303"
            stopOpacity="1"
          />
          <stop
            stopColor="#af6739"
            offset="0.785234928131104"
            stopOpacity="1"
          />
          <stop
            stopColor="#b05720"
            offset="0.798657715320587"
            stopOpacity="1"
          />
          <stop
            stopColor="#ad7549"
            offset="0.805369138717651"
            stopOpacity="1"
          />
        </linearGradient>
        <linearGradient
          id={g1}
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="0"
          x2="1.01238004289882"
          y2="1.08304917062348"
          spreadMethod="reflect"
        >
          <stop
            stopColor="#273717"
            offset="0.219653179190751"
            stopOpacity="1"
          />
          <stop
            stopColor="#0e1b0f"
            offset="0.531791925430298"
            stopOpacity="1"
          />
          <stop
            stopColor="#152c1d"
            offset="0.791907489299774"
            stopOpacity="1"
          />
        </linearGradient>
        <linearGradient
          id={g2}
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="0"
          x2="-1.57093564887371"
          y2="-0.471795862242512"
          spreadMethod="reflect"
        >
          <stop
            stopColor="#273717"
            offset="0.265895962715149"
            stopOpacity="1"
          />
          <stop
            stopColor="#0e1b0f"
            offset="0.531791925430298"
            stopOpacity="1"
          />
          <stop
            stopColor="#152c1d"
            offset="0.791907489299774"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>

      <path
        transform="translate(67.5, 85.05)"
        fill={`url(#${g0})`}
        fillRule="evenodd"
        stroke="#000000"
        strokeWidth={5.76}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M7.10543e-15 1.45388e-14L394.2 0L394.2 359.1L0 359.1Z"
      />

      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 224.966183019518 409.91147027177)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 431.079998698238 370.211470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 384.088528489225 370.211470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 337.300428222415 370.2)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 290.308958013401 370.2)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 243.688528489224 370.222940530669)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 196.900428222415 370.211470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 149.908958013401 370.211470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 102.948958025024 370.211470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 410.688528489224 333.611470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 363.900428222416 333.6)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />

      <path
        transform="matrix(1.35088760180491 1.36389205161977 -1.99985594882014 1.79988551260583 172.128953531026 325.642721257561)"
        fill={`url(#${g1})`}
        fillRule="evenodd"
        stroke="#000000"
        strokeWidth={1.44}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M2.07971 23.5545C9.4004 30.3244 20.7726 35.8419 31.0277 32.28C38.799 29.5808 47.1833 20.2005 48.3597 17.3625C49.5361 14.5245 51.0404 9.91569 44.9982 4.45617C40.6103 1.67398 35.2609 -0.604094 28.0299 0.14381C12.5883 0.567859 24.5771 4.27486 15.4836 9.78554C11.9783 12.55 7.16376 11.452 3.83092 14.4652C0.0471894 16.7979 -1.63643 20.1179 2.07971 23.5545Z"
      />

      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 316.908958013401 333.6)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 270.288528489223 333.622940530669)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 223.500428222415 333.611470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 176.508958013401 333.611470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 129.548958025024 333.611470265335)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 430.984998690528 295.811470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 383.993528481514 295.811470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 337.205428214703 295.800000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 290.213958005691 295.800000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 243.593528481512 295.822940530669)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 196.805428214702 295.811470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 149.81395800569 295.811470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 102.853958017314 295.811470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 410.593528481511 259.211470265333)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 363.805428214707 259.200000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 316.81395800569 259.200000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 270.193528481512 259.222940530668)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 223.405428214704 259.211470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 176.413958005691 259.211470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 129.453958017313 259.211470265334)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 457.843958032734 333.799999941887)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 457.748958025019 259.399999941886)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 82.4224998054996 333.39000005029)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 82.5137499623686 259.139999998659)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 431.206456917762 220.471470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 384.214986708749 220.471470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 337.426886441938 220.460000001341)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 290.435416232925 220.460000001342)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 243.814986708748 220.48294053201)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 197.026886441939 220.471470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 150.035416232925 220.471470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 103.075416244548 220.471470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 410.814986708749 183.871470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 364.026886441939 183.860000001341)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 317.035416232925 183.860000001341)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 270.414986708745 183.88294053201)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 223.626886441939 183.871470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 176.635416232925 183.871470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 129.675416244548 183.871470266676)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 431.111456910051 146.071470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 384.119986701038 146.071470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 337.331886434228 146.060000001342)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 290.340416225214 146.060000001342)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 243.719986701036 146.08294053201)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 196.931886434226 146.071470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 149.940416225215 146.071470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 102.980416236838 146.071470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 410.719986701034 109.471470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 363.931886434231 109.460000001342)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 316.940416225214 109.460000001342)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 270.319986701036 109.482940532009)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 223.531886434228 109.471470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 176.540416225214 109.471470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 129.580416236837 109.471470266675)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 457.970416252258 184.059999943228)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 457.875416244544 109.659999943227)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 82.5489580250232 183.650000051631)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 82.6402081818922 109.4)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 410.414986708742 410.811470265333)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 363.626886441944 410.800000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 316.635416232924 410.800000000001)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 270.014986708745 410.822940530668)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 129.275416244547 410.811470265333)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 457.570416252257 410.999999941886)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <circle
        transform="matrix(-0.999969016691285 0.0078718268188165 0.0078718268188165 0.999969016691285 82.1489580250225 410.59000005029)"
        r={3.594_590_384_815_35}
        cx={3.594_590_384_815_35}
        cy={3.594_590_384_815_35}
        fill="#000000"
        fillRule="evenodd"
        stroke="#463432"
        strokeWidth={1.8}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />

      <path
        transform="matrix(1.35088760180491 1.36389205161977 -1.99985594882014 1.79988551260583 172.256898759685 324.622244011516)"
        fill={`url(#${g2})`}
        fillRule="evenodd"
        stroke="#000000"
        strokeWidth={1.44}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M3.38251 24.245C10.5921 30.6158 18.3698 30.6642 28.2055 26.5956C33.4905 24.4094 39.7012 19.1976 42.3623 14.3559C44.886 9.76397 44.064 5.54278 41.7168 3.19472C37.3955 0.576529 33.2376 -0.49247 26.1165 0.211347C10.9092 0.6104 22.7161 4.09889 13.7606 9.28473C10.3085 11.8863 5.56706 10.853 2.28481 13.6885C-1.44148 15.8838 -0.277213 21.011 3.38251 24.245Z"
      />
      <path
        transform="matrix(-0.864043022253572 -1.73533117157931 -2.25338651465666 1.44513498051398 151.325166493422 375.067516012243)"
        fill="#1f1b0f"
        fillRule="evenodd"
        stroke="#596c73"
        strokeWidth={1.08}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M3.75136 0.789955C3.31663 0.150933 2.27119 -0.155571 1.32302 0.0780049C0.37485 0.311581 -0.173412 1.01068 0.049515 1.70188C0.272442 2.39308 1.1954 2.85575 2.19337 2.77657C3.19134 2.69739 3.94577 2.10165 3.94577 1.39276"
      />
      <text
        transform="translate(74.0390625, 343.4540625)"
        fill="#4f153d"
        stroke="#000000"
        strokeWidth={3.6}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        letterSpacing={0}
        wordSpacing={0}
        style={bStyle}
      >
        <tspan x="0">B</tspan>
      </text>
      <path
        transform="matrix(0.864043022253572 -1.73533117157931 2.25338651465666 1.44513498051398 188.274047194545 374.954469838874)"
        fill="#1f1b0f"
        fillRule="evenodd"
        stroke="#596c73"
        strokeWidth={1.08}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M3.75136 0.789955C3.31663 0.150933 2.27119 -0.155571 1.32302 0.0780049C0.37485 0.311581 -0.173412 1.01068 0.049515 1.70188C0.272442 2.39308 1.1954 2.85575 2.19337 2.77657C3.19134 2.69739 3.94577 2.10165 3.94577 1.39276"
      />
      <path
        transform="translate(245.454344773671, 409.289773216862)"
        fill="none"
        stroke="#151436"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M0 0.0302117C2.39711 0.0302117 4.18637 -0.283402 5.58 1.11023C5.95108 1.48131 4.84479 5.70021 4.32 5.70021C1.51867 5.70021 0.298276 0.148488 0.495 0.345212C1.94804 1.79825 7.0074 6.01521 3.915 6.01521"
      />
      <text
        transform="translate(68.6390625, 332.6540625)"
        fill="#501d50"
        stroke="#000000"
        strokeWidth={3.6}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        letterSpacing={0}
        wordSpacing={0}
        style={bStyle}
      >
        <tspan x="0">B</tspan>
      </text>
      <path
        transform="translate(82.9124969218999, 332.617487706161)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025C3.315 6.735 1.6575 3.3675 0 0"
      />
      <path
        transform="translate(172.327047115343, 230.278050769047)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025L0 0"
      />
      <path
        transform="translate(194.433749827482, 141.618045108936)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025L0 0"
      />
      <text
        transform="translate(233.3390625, 419.0540625)"
        fill="#151436"
        stroke="#000000"
        strokeWidth={3.6}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        letterSpacing={0}
        wordSpacing={0}
        style={bStyle}
      >
        <tspan x="0">B</tspan>
      </text>
      <path
        transform="translate(331.625484615343, 305.880238269047)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025L0 0"
      />
      <path
        transform="translate(353.732187327482, 217.220232608936)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025L0 0"
      />
      <path
        transform="translate(245.454344773671, 409.289773216862)"
        fill="none"
        stroke="#151436"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M0 0.0302117C2.39711 0.0302117 4.18637 -0.283402 5.58 1.11023C5.95108 1.48131 4.84479 5.70021 4.32 5.70021C1.51867 5.70021 0.298276 0.148488 0.495 0.345212C1.94804 1.79825 7.0074 6.01521 3.915 6.01521"
      />
      <path
        transform="translate(242.2109344219, 408.219675206161)"
        fill="none"
        stroke="#000000"
        strokeWidth={3.599_996_4}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        d="M4.9725 10.1025C3.315 6.735 1.6575 3.3675 0 0"
      />
      <text
        transform="translate(228.11906239357, 408.2540625)"
        fill="#08204c"
        stroke="#000000"
        strokeWidth={3.6}
        strokeLinecap="square"
        strokeLinejoin="bevel"
        letterSpacing={0}
        wordSpacing={0}
        style={bStyle}
      >
        <tspan x="0">B</tspan>
      </text>
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
