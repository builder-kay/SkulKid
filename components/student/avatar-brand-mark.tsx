import type { AvatarAsset } from "@/lib/student/avatar-shop";

type Props = {
  brand: AvatarAsset["brand"];
  x?: number | string;
  y?: number | string;
  scale?: number | string;
  contrastPlate?: boolean;
};

/**
 * Compact, recognisable brand marks for tiny avatar assets. These are original
 * SVG redraws for UI use and are not supplied or endorsed by the brands.
 */
export function AvatarBrandMark({ brand, x = 0, y = 0, scale = 1, contrastPlate = false }: Props) {
  const transform = `translate(${x} ${y}) scale(${scale})`;
  const plate = {
    Nike: { x: 0, y: 2, width: 45, height: 20 },
    Adidas: { x: 0, y: -1, width: 45, height: 32 },
    Puma: { x: -1, y: 0, width: 46, height: 25 }
  }[brand];
  return (
    <g aria-label={`${brand} brand mark`} role="img" transform={transform}>
      {contrastPlate ? (
        <rect
          fill="#fff"
          height={plate.height}
          rx="3.5"
          stroke="#0f172a"
          strokeOpacity=".12"
          strokeWidth=".8"
          width={plate.width}
          x={plate.x}
          y={plate.y}
        />
      ) : null}
      {brand === "Nike" ? (
        <path
          d="M1.5 15.2c8.2 4.8 14.5 4.5 22.5 1.2L43 5.2 25.8 12.5C15.8 16.8 8.5 18.7 1.5 15.2Z"
          fill="#0f172a"
        />
      ) : null}
      {brand === "Adidas" ? (
        <g fill="#0f172a">
          <path d="m2 14 7-4 6 10H9Zm10-7 7-4 10 17h-7Zm12-5 7-2 12 20h-7Z" />
          <text fontFamily="Arial Black, Arial, sans-serif" fontSize="7" fontWeight="900" letterSpacing="-.35" textAnchor="middle" x="23" y="29">adidas</text>
        </g>
      ) : null}
      {brand === "Puma" ? (
        <g fill="#0f172a">
          <text fontFamily="Arial Black, Arial, sans-serif" fontSize="11" fontWeight="900" letterSpacing="-.8" x="0" y="21">PUMA</text>
          <path d="M29 7q5-6 10-1l5 1-4 3-1 6-5-1-2-5-6 1 2-3Z" />
        </g>
      ) : null}
    </g>
  );
}
