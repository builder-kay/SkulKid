import { useId } from "react";
import type { AvatarConfig } from "@/lib/student/student-profile";
import { avatarShopAssets, type AvatarAsset, type AvatarAssetCategory } from "@/lib/student/avatar-shop";
import { cn } from "@/lib/utils";
import { AvatarBrandMark } from "@/components/student/avatar-brand-mark";
export { CharacterAvatar } from "@/components/student/character-avatar-v2";

/**
 * Expressive SkulKid portrait avatar with soft, friendly proportions.
 * Far limbs draw first; near limbs and the face sit on top for depth.
 */
function LegacyCharacterAvatar({ avatar, className = "size-24", label = "Custom student avatar", animated = true }: { avatar: AvatarConfig; className?: string; label?: string; animated?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const skin = `${uid}-skin`;
  const skinFar = `${uid}-skin-far`;
  const shirtFill = `${uid}-shirt`;
  const pantsFill = `${uid}-pants`;
  const limbShine = `${uid}-limb`;
  const premium = (category: AvatarAssetCategory) => avatarShopAssets.find((asset) => asset.id === avatar.equippedPremium[category]);
  const shirt = premium("shirt");
  const bottoms = premium("bottoms");
  const shoes = premium("shoes");
  const glasses = premium("glasses");
  const watch = premium("watch");
  const skateboard = premium("skateboard");
  const bag = premium("bag");
  const cap = premium("cap");
  const female = avatar.gender === "female";
  const shirtColour = shirt?.colour ?? avatar.shirtColor;
  const pantsColour = bottoms?.colour ?? avatar.pantsColor;
  const shoeColour = shoes?.colour ?? avatar.shoeColor;
  /* Compact body and an oversized expressive head keep the face recognisable
     even in navigation and leaderboard thumbnails. */
  const torsoW = avatar.bodyStyle === "slim" ? (female ? 44 : 48) : avatar.bodyStyle === "strong" ? (female ? 56 : 62) : (female ? 50 : 54);
  const torsoX = Math.round((180 - torsoW) / 2);
  const torsoY = 78;
  const torsoH = female ? 52 : 54;
  const armW = avatar.bodyStyle === "slim" ? 16 : avatar.bodyStyle === "strong" ? 20 : 18;
  const legW = avatar.bodyStyle === "slim" ? (female ? 18 : 20) : avatar.bodyStyle === "strong" ? (female ? 24 : 26) : (female ? 20 : 22);

  return (
    <svg aria-label={label} className={cn("overflow-hidden rounded-2xl", animated && "avatar-game-idle", className)} preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 180 220">
      <defs>
        <linearGradient id={skin} x1=".18" x2=".86" y1=".05" y2=".95">
          <stop stopColor="#fff" stopOpacity=".5" />
          <stop offset=".3" stopColor={avatar.skinColor} />
          <stop offset=".72" stopColor={avatar.skinColor} />
          <stop offset="1" stopColor="#000" stopOpacity=".26" />
        </linearGradient>
        <linearGradient id={skinFar} x1=".2" x2=".85" y1=".1" y2="1">
          <stop stopColor={avatar.skinColor} />
          <stop offset="1" stopColor="#000" stopOpacity=".34" />
        </linearGradient>
        <linearGradient id={shirtFill} x1=".12" x2=".9" y1=".04" y2=".96">
          <stop stopColor="#fff" stopOpacity=".4" />
          <stop offset=".3" stopColor={shirtColour} />
          <stop offset=".68" stopColor={shirtColour} />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={pantsFill} x1=".12" x2=".88" y1=".05" y2=".95">
          <stop stopColor="#fff" stopOpacity=".3" />
          <stop offset=".32" stopColor={pantsColour} />
          <stop offset=".7" stopColor={pantsColour} />
          <stop offset="1" stopColor="#000" stopOpacity=".36" />
        </linearGradient>
        <linearGradient id={limbShine} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#fff" stopOpacity=".28" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-35%" y="-30%" width="170%" height="175%">
          <feDropShadow dx="1.5" dy="5" floodColor="#0f172a" floodOpacity=".24" stdDeviation="3" />
        </filter>
        <filter id={`${uid}-soft`}>
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <ellipse className="avatar-game-shadow" cx="90" cy={skateboard ? 208 : 200} fill="#1e1b4b" filter={`url(#${uid}-soft)`} opacity=".26" rx={skateboard ? 60 : 46} ry="7.5" />

      {skateboard ? (
        <g filter={`url(#${uid}-shadow)`} transform="translate(6 6) rotate(-5 90 190)">
          <path d="M28 186q6 10 18 8h86q14 2 18-8-8 3-20 1H48q-12 2-20 0z" fill={skateboard.colour} stroke="#0f172a" strokeOpacity=".3" strokeWidth="2" />
          <path d="M42 188h90" opacity=".4" stroke="white" strokeLinecap="round" strokeWidth="2" />
          <BrandMark brand={skateboard.brand} scale=".42" x="78" y="180" />
          <circle cx="44" cy="200" fill="#1e293b" r="6" />
          <circle cx="138" cy="198" fill="#1e293b" r="6" />
          <circle cx="44" cy="200" fill="#94a3b8" r="2" />
          <circle cx="138" cy="198" fill="#94a3b8" r="2" />
        </g>
      ) : null}

      <g className="avatar-game-body" filter={`url(#${uid}-shadow)`}>
        {/* FAR arm — soft hanging cylinder */}
        <g opacity=".92">
          <SmoothLimb
            fill={`url(#${shirtFill})`}
            height={36}
            rotate={12}
            shine={`url(#${limbShine})`}
            width={armW}
            x={torsoX - armW + 4}
            y={torsoY + 4}
          />
          <SmoothLimb
            fill={`url(#${skinFar})`}
            height={28}
            rotate={16}
            shine={`url(#${limbShine})`}
            width={armW - 2}
            x={torsoX - armW + 2}
            y={torsoY + 36}
          />
          <ellipse cx={torsoX - armW / 2 + 2} cy={torsoY + 68} fill={`url(#${skinFar})`} rx={armW * 0.55} ry={armW * 0.5} stroke="#0f172a" strokeOpacity=".16" strokeWidth="1.4" />
        </g>

        {/* FAR leg */}
        {avatar.pantsStyle === "skirt" ? null : (
          <g opacity=".9">
            <SmoothLimb
              fill={`url(#${pantsFill})`}
              height={avatar.pantsStyle === "shorts" ? 28 : 52}
              rotate={-4}
              shine={`url(#${limbShine})`}
              width={legW}
              x={torsoX + 2}
              y={torsoY + torsoH - 6}
            />
            {avatar.pantsStyle === "shorts" ? (
              <SmoothLimb fill={`url(#${skinFar})`} height={26} rotate={-4} shine={`url(#${limbShine})`} width={legW - 2} x={torsoX + 3} y={torsoY + torsoH + 20} />
            ) : null}
            <ellipse cx={torsoX + legW * 0.45} cy={torsoY + torsoH + 52} fill={shoeColour} rx={legW * 0.72} ry="8" stroke="#0f172a" strokeOpacity=".22" strokeWidth="1.6" />
            <ellipse cx={torsoX + legW * 0.35} cy={torsoY + torsoH + 49} fill="#fff" opacity=".25" rx={legW * 0.35} ry="2.5" />
            {shoes ? <BrandMark brand={shoes.brand} scale=".18" x={String(torsoX + 2)} y={String(torsoY + torsoH + 46)} /> : null}
          </g>
        )}

        {bag ? (
          <g transform="translate(-4 6)">
            <rect fill={bag.colour} height="48" rx="14" width="26" x={torsoX - 18} y={torsoY + 16} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" />
            <path d={`M${torsoX - 12} ${torsoY + 20}q6-12 12 0`} fill="none" stroke="white" strokeOpacity=".28" strokeWidth="3.5" />
            <BrandMark brand={bag.brand} scale=".26" x={String(torsoX - 14)} y={String(torsoY + 34)} />
          </g>
        ) : null}

        {/* Soft neck */}
        <rect fill={`url(#${skin})`} height="16" rx="7" width="18" x={90 - 9} y={torsoY - 10} />
        <rect fill={`url(#${limbShine})`} height="16" opacity=".55" rx="7" width="18" x={90 - 9} y={torsoY - 10} />

        {/* Soft shoulders and a gently tapered torso */}
        <path
          d={`M${torsoX + torsoW * .2} ${torsoY}
              Q${90} ${torsoY - 5} ${torsoX + torsoW * .8} ${torsoY}
              Q${torsoX + torsoW + 5} ${torsoY + 7} ${torsoX + torsoW - 1} ${torsoY + torsoH}
              Q${90} ${torsoY + torsoH + 4} ${torsoX + 1} ${torsoY + torsoH}
              Q${torsoX - 5} ${torsoY + 7} ${torsoX + torsoW * .2} ${torsoY}Z`}
          fill={`url(#${shirtFill})`}
          stroke="#0f172a"
          strokeOpacity=".16"
          strokeWidth="2"
        />
        <path
          d={`M${torsoX + torsoW * .2} ${torsoY}
              Q${90} ${torsoY - 5} ${torsoX + torsoW * .8} ${torsoY}
              Q${torsoX + torsoW + 5} ${torsoY + 7} ${torsoX + torsoW - 1} ${torsoY + torsoH}
              Q${90} ${torsoY + torsoH + 4} ${torsoX + 1} ${torsoY + torsoH}
              Q${torsoX - 5} ${torsoY + 7} ${torsoX + torsoW * .2} ${torsoY}Z`}
          fill={`url(#${limbShine})`}
          opacity=".7"
        />
        <ellipse cx={torsoX + torsoW * 0.42} cy={torsoY + 10} fill="#fff" opacity=".22" rx={torsoW * 0.28} ry="5" />
        <ShirtMark premiumBrand={shirt?.brand} style={avatar.shirtStyle} />

        {/* Legs / skirt */}
        {avatar.pantsStyle === "skirt" ? (
          <g>
            <path
              d={`M${torsoX + 2} ${torsoY + torsoH - 8}
                 h${torsoW - 4}
                 l${12} ${44}
                 H${torsoX - 10}
                 z`}
              fill={`url(#${pantsFill})`}
              stroke="#0f172a"
              strokeOpacity=".18"
              strokeWidth="2"
            />
            <path d={`M${torsoX + 10} ${torsoY + torsoH - 2} h${torsoW - 20}`} stroke="white" strokeLinecap="round" strokeOpacity=".22" strokeWidth="3" />
            {bottoms ? <BrandMark brand={bottoms.brand} scale=".32" x={String(torsoX + 12)} y={String(torsoY + torsoH + 8)} /> : null}
            <ellipse cx={torsoX + 16} cy={torsoY + torsoH + 48} fill={shoeColour} rx="14" ry="8" stroke="#0f172a" strokeOpacity=".22" strokeWidth="1.6" />
            <ellipse cx={torsoX + torsoW - 10} cy={torsoY + torsoH + 48} fill={shoeColour} rx="15" ry="8" stroke="#0f172a" strokeOpacity=".22" strokeWidth="1.6" />
          </g>
        ) : (
          <g>
            <SmoothLimb
              fill={`url(#${pantsFill})`}
              height={avatar.pantsStyle === "shorts" ? 28 : 52}
              rotate={5}
              shine={`url(#${limbShine})`}
              width={legW}
              x={torsoX + torsoW - legW - 2}
              y={torsoY + torsoH - 6}
            />
            {bottoms ? <BrandMark brand={bottoms.brand} scale=".28" x={String(torsoX + torsoW - legW + 2)} y={String(torsoY + torsoH + 4)} /> : null}
            {avatar.pantsStyle === "shorts" ? (
              <SmoothLimb fill={`url(#${skin})`} height={26} rotate={5} shine={`url(#${limbShine})`} width={legW - 2} x={torsoX + torsoW - legW - 1} y={torsoY + torsoH + 20} />
            ) : null}
            <ellipse cx={torsoX + torsoW - legW * 0.35} cy={torsoY + torsoH + 52} fill={shoeColour} rx={legW * 0.85} ry="9" stroke="#0f172a" strokeOpacity=".24" strokeWidth="1.6" />
            <ellipse cx={torsoX + torsoW - legW * 0.45} cy={torsoY + torsoH + 49} fill="#fff" opacity=".3" rx={legW * 0.4} ry="2.8" />
            {shoes ? <BrandMark brand={shoes.brand} scale=".2" x={String(torsoX + torsoW - legW)} y={String(torsoY + torsoH + 46)} /> : null}
          </g>
        )}

        {/* NEAR arm — soft bent cylinder */}
        <g>
          <SmoothLimb
            fill={`url(#${shirtFill})`}
            height={34}
            rotate={-14}
            shine={`url(#${limbShine})`}
            width={armW}
            x={torsoX + torsoW - 6}
            y={torsoY + 2}
          />
          <SmoothLimb
            fill={`url(#${skin})`}
            height={30}
            rotate={-20}
            shine={`url(#${limbShine})`}
            width={armW - 1}
            x={torsoX + torsoW + 4}
            y={torsoY + 32}
          />
          <ellipse cx={torsoX + torsoW + armW * 0.7} cy={torsoY + 66} fill={`url(#${skin})`} rx={armW * 0.58} ry={armW * 0.52} stroke="#0f172a" strokeOpacity=".18" strokeWidth="1.5" transform={`rotate(-12 ${torsoX + torsoW + armW * 0.7} ${torsoY + 66})`} />
          <ellipse cx={torsoX + torsoW + armW * 0.85} cy={torsoY + 62} fill="#fff" opacity=".28" rx="3" ry="2" />
          {watch ? (
            <g>
              <rect fill={watch.colour} height="11" rx="4" transform={`rotate(-20 ${torsoX + torsoW + 10} ${torsoY + 40})`} width="18" x={torsoX + torsoW + 2} y={torsoY + 36} />
              <rect fill="#dbeafe" height="7" rx="2" transform={`rotate(-20 ${torsoX + torsoW + 10} ${torsoY + 40})`} width="10" x={torsoX + torsoW + 6} y={torsoY + 38} />
              <BrandMark brand={watch.brand} scale=".12" x={String(torsoX + torsoW + 6)} y={String(torsoY + 38)} />
            </g>
          ) : null}
        </g>

        {/* Head */}
        <g className="avatar-game-head">
          <g transform="translate(2 -6)">
            <HeadShape fill={`url(#${skin})`} gender={avatar.gender} style={avatar.headStyle} uid={uid} />
            <Hair color={avatar.hairColor} gender={avatar.gender} style={avatar.hairStyle} />
            {cap ? <Cap brand={cap.brand} colour={cap.colour} /> : null}
            <FaceFeatures eyebrowStyle={avatar.eyebrowStyle ?? "soft"} eyeColor={avatar.eyeColor} expression={avatar.expression ?? "classic"} female={female} glasses={Boolean(glasses)} noseStyle={avatar.noseStyle ?? "button"} />
            {glasses ? (
              <g>
                <rect fill="#dff7ff" fillOpacity=".16" height="21" rx="9" stroke={glasses.colour} strokeWidth="3" width="29" x="51" y="39" />
                <rect fill="#dff7ff" fillOpacity=".16" height="21" rx="9" stroke={glasses.colour} strokeWidth="3" width="29" x="87" y="39" />
                <path d="M80 47q3-3 7 0M49 44l-8-3m77 3 8-3" fill="none" stroke={glasses.colour} strokeLinecap="round" strokeWidth="3" />
                <path d="M56 43q8-4 16 0m36 0q-8-4-16 0" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".7" strokeWidth="2" />
              </g>
            ) : null}
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Soft cylindrical limb segment with volume wash */
function SmoothLimb({
  x,
  y,
  width,
  height,
  fill,
  shine,
  rotate = 0,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  shine: string;
  rotate?: number;
}) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const r = Math.min(width / 2, 12);
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <rect fill={fill} height={height} rx={r} ry={r} stroke="#0f172a" strokeOpacity=".16" strokeWidth="1.6" width={width} x={x} y={y} />
      <rect fill={shine} height={height} opacity=".75" rx={r} ry={r} width={width} x={x} y={y} />
      <ellipse cx={x + width * 0.35} cy={y + 6} fill="#fff" opacity=".18" rx={width * 0.22} ry="3" />
    </g>
  );
}

export function PremiumAssetPreview({ asset, className = "h-36 w-full" }: { asset: AvatarAsset; className?: string }) {
  const common = { fill: asset.colour, stroke: "#0f172a", strokeOpacity: .22, strokeWidth: 2 };
  return (
    <svg aria-label={`${asset.name} product preview`} className={cn(className)} role="img" viewBox="0 0 160 120">
      <defs>
        <filter id={`asset-${asset.id}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="1" dy="5" floodColor="#172554" floodOpacity=".22" stdDeviation="3" />
        </filter>
      </defs>
      <ellipse cx="80" cy="105" fill="#312e81" opacity=".12" rx="48" ry="7" />
      <g filter={`url(#asset-${asset.id})`}>
        {asset.category === "shirt" ? (
          <g>
            <path d="M51 23 66 12h28l15 11 24 13-13 25-14-7v48H54V54l-14 7-13-25z" {...common} />
            <path d="M66 13q14 18 28 0" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="5" />
            <path d="M61 31h38M61 88h38" stroke="white" strokeOpacity=".18" strokeWidth="3" />
            <BrandMark brand={asset.brand} scale="1.05" x="60" y="48" />
          </g>
        ) : null}
        {asset.category === "bottoms" ? (
          <g>
            <path d="M42 18h76l-5 75H87l-7-39-7 39H47z" {...common} />
            <path d="M48 27h64M80 20v35" stroke="white" strokeOpacity=".28" strokeWidth="4" />
            <path d="M48 83h24M88 83h24" stroke="#000" strokeOpacity=".18" strokeWidth="3" />
            <BrandMark brand={asset.brand} scale=".72" x="48" y="36" />
          </g>
        ) : null}
        {asset.category === "shoes" ? (
          <g>
            <path d="M17 63q22-15 48 1l7 17q2 16-9 18H20q-13-3-3-36z" {...common} />
            <path d="M88 64q27-16 48 2 10 33-3 36H91q-11-2-8-19z" {...common} />
            <path d="M26 72h29M96 73h29" stroke="white" strokeLinecap="round" strokeOpacity=".7" strokeWidth="5" />
            <path d="M18 91h50M87 94h50" stroke="white" strokeOpacity=".65" strokeWidth="6" />
            <BrandMark brand={asset.brand} scale=".48" x="30" y="76" />
            <BrandMark brand={asset.brand} scale=".48" x="101" y="77" />
          </g>
        ) : null}
        {asset.category === "glasses" ? (
          <g>
            <path d="M19 41h122l-10 49H93L80 73 67 90H29z" {...common} />
            <path d="M30 50h40l-9 29H35zm60 0h40l-6 29H99z" fill="#67e8f9" opacity=".78" />
            <path d="M37 55h22" stroke="white" strokeLinecap="round" strokeOpacity=".85" strokeWidth="6" />
            <BrandMark brand={asset.brand} scale=".58" x="67" y="43" />
          </g>
        ) : null}
        {asset.category === "watch" ? (
          <g>
            <path d="M66 5h28l5 31-5 68H66l-5-68z" {...common} />
            <rect fill="#dbeafe" height="50" rx="12" stroke="#0f172a" strokeOpacity=".25" strokeWidth="3" width="58" x="51" y="34" />
            <circle cx="80" cy="59" fill="#0f172a" opacity=".1" r="18" />
            <BrandMark brand={asset.brand} scale=".8" x="64" y="48" />
          </g>
        ) : null}
        {asset.category === "skateboard" ? (
          <g transform="rotate(-4 80 62)">
            <path d="M13 48q8-14 22-8h90q14-6 22 8v29q-8 14-22 8H35q-14 6-22-8z" {...common} />
            <BrandMark brand={asset.brand} scale="1.2" x="57" y="49" />
            <circle cx="36" cy="94" fill="#1e293b" r="9" />
            <circle cx="124" cy="94" fill="#1e293b" r="9" />
            <circle cx="36" cy="94" fill="#94a3b8" r="3" />
            <circle cx="124" cy="94" fill="#94a3b8" r="3" />
          </g>
        ) : null}
        {asset.category === "bag" ? (
          <g>
            <path d="M54 31q3-23 26-23t26 23" fill="none" stroke={asset.colour} strokeWidth="12" />
            <rect height="79" rx="18" width="88" x="36" y="27" {...common} />
            <rect fill="#000" fillOpacity=".16" height="35" rx="10" width="68" x="46" y="61" />
            <path d="M47 43h66" stroke="white" strokeOpacity=".28" strokeWidth="4" />
            <BrandMark brand={asset.brand} scale="1" x="60" y="65" />
          </g>
        ) : null}
        {asset.category === "cap" ? (
          <g>
            <path d="M34 61q7-43 48-43 39 0 46 43l-9 24H43z" {...common} />
            <path d="M81 19v65M48 58q29-28 64 0" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="3" />
            <path d="M107 69h45q-8 18-30 20l-23-2z" {...common} />
            <path d="M112 73h32" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="4" />
            <circle cx="81" cy="17" fill={asset.colour} r="6" stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
            <path d="M48 47q18-25 31-26" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="5" />
            <BrandMark brand={asset.brand} scale="1" x="61" y="48" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

/** Original soft 3D face silhouette with adjustable cheeks and chin. */
function HeadShape({
  style,
  fill,
  gender,
  uid,
}: {
  style: AvatarConfig["headStyle"];
  fill: string;
  gender: AvatarConfig["gender"];
  uid: string;
}) {
  const female = gender === "female";
  /* Each option changes the silhouette while keeping facial landmarks stable. */
  const dims =
    style === "round"
      ? { x: 43, y: 8, w: 84, h: 78, cheek: 3, chin: 19 }
      : style === "oval"
        ? { x: 47, y: 5, w: 76, h: 83, cheek: 1, chin: 16 }
        : style === "wide"
          ? { x: 38, y: 12, w: 94, h: 72, cheek: 4, chin: 22 }
          : { x: female ? 43 : 42, y: 9, w: female ? 84 : 86, h: female ? 79 : 77, cheek: 2, chin: female ? 18 : 21 };

  const { x, y, w, h, cheek, chin } = dims;
  const cx = x + w / 2;
  const headPath = `M${cx} ${y}
    C${x + w * .23} ${y - 1} ${x + 2} ${y + 8} ${x} ${y + h * .35}
    C${x - cheek} ${y + h * .6} ${x + 5} ${y + h * .84} ${cx - chin} ${y + h}
    Q${cx} ${y + h + 8} ${cx + chin} ${y + h}
    C${x + w - 5} ${y + h * .84} ${x + w + cheek} ${y + h * .6} ${x + w} ${y + h * .35}
    C${x + w - 2} ${y + 8} ${x + w * .77} ${y - 1} ${cx} ${y}Z`;
  const rimId = `${uid}-head-rim`;
  const volumeId = `${uid}-head-vol`;

  return (
    <g>
      <defs>
        <linearGradient id={volumeId} x1=".12" x2=".9" y1=".05" y2=".95">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".32" stopColor="#fff" stopOpacity=".08" />
          <stop offset=".72" stopColor="#000" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
        <radialGradient cx="38%" cy="28%" id={rimId} r="72%">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".16" />
        </radialGradient>
      </defs>

      {/* soft contact shadow under chin */}
      <ellipse cx={cx} cy={y + h + 2} fill="#0f172a" opacity=".14" rx={w * 0.34} ry="5" />

      {/* Ears sit behind the face and make the portrait silhouette natural. */}
      <ellipse cx={x + 1} cy={y + h * .55} fill={fill} rx="7" ry="12" stroke="#0f172a" strokeOpacity=".15" strokeWidth="1.5" />
      <ellipse cx={x + w - 1} cy={y + h * .55} fill={fill} rx="7" ry="12" stroke="#0f172a" strokeOpacity=".15" strokeWidth="1.5" />

      {/* Organic face silhouette */}
      <path d={headPath} fill={fill} stroke="#0f172a" strokeOpacity=".16" strokeWidth="1.8" />

      {/* cylindrical volume wash */}
      <path d={headPath} fill={`url(#${volumeId})`} opacity=".9" />
      <path d={headPath} fill={`url(#${rimId})`} />

      {/* crown highlight — flat top plane catching light */}
      <ellipse cx={cx - w * .12} cy={y + h * .16} fill="#fff" opacity=".2" rx={w * .24} ry={h * .08} />
      <ellipse cx={x + w * .2} cy={y + h * .68} fill="#fb7185" opacity=".08" rx={w * .1} ry={h * .055} />
      <ellipse cx={x + w * .8} cy={y + h * .68} fill="#fb7185" opacity=".08" rx={w * .1} ry={h * .055} />

      {/* near-side rim light */}
      <path
        d={`M${x + w - 7} ${y + h * .28}q7 ${h * .2} 1 ${h * .42}`}
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeOpacity=".16"
        strokeWidth="5"
      />

      {/* far-side depth crease */}
      <path
        d={`M${x + 7} ${y + h * .32}q-4 ${h * .2} 0 ${h * .36}`}
        fill="none"
        stroke="#000"
        strokeLinecap="round"
        strokeOpacity=".12"
        strokeWidth="6"
      />

      {/* chin soft shade */}
      <ellipse cx={cx + 1} cy={y + h * .88} fill="#000" opacity=".055" rx={w * .22} ry={h * .06} />
    </g>
  );
}

/** Expressive portrait features with selectable moods. */
function FaceFeatures({
  female,
  eyebrowStyle,
  eyeColor,
  glasses: _glasses,
  noseStyle,
  expression,
}: {
  female: boolean;
  eyebrowStyle: NonNullable<AvatarConfig["eyebrowStyle"]>;
  eyeColor: string;
  glasses: boolean;
  noseStyle: NonNullable<AvatarConfig["noseStyle"]>;
  expression: AvatarConfig["expression"];
}) {
  const leftEye = { cx: 66, cy: 48 };
  const rightEye = { cx: 100, cy: 48 };
  const eyeRx = female ? 9.2 : 8.4;
  const eyeRy = expression === "surprised" ? (female ? 10.2 : 9.2) : expression === "sleepy" || expression === "cool" ? (female ? 6.4 : 5.6) : female ? 8.6 : 7.6;
  const pupilR = expression === "surprised" ? (female ? 6 : 5.4) : female ? 5.2 : 4.6;
  const browStroke = eyebrowStyle === "bold" ? 3.8 : female ? 2.1 : 2.8;
  const winkLeft = expression === "wink";

  const brows =
    expression === "surprised"
      ? { left: "M54 32.5q12-8 24 0", right: "M88 32q13-8.5 25 .5" }
      : expression === "sleepy" || expression === "cool"
        ? { left: "M54 39q12-2.5 24 1", right: "M88 38.5q13-2.5 25 1.5" }
        : expression === "silly" || expression === "happy"
          ? { left: "M54 35q12-8 24 0", right: "M88 34.5q13-8.5 25 .5" }
          : eyebrowStyle === "straight"
            ? { left: "M54 36.5q12-1 24 0", right: "M88 36q13-1 25 .5" }
            : eyebrowStyle === "arched"
              ? { left: "M54 37q12-11 24-.5", right: "M88 36.5q13-11 25 0" }
              : female
                ? { left: "M54 36.5q12-7.5 24-.5", right: "M88 36q13-8 25 0" }
                : { left: "M54 37.5q11-5.5 23 1", right: "M89 36.5q12-5.5 24 1.5" };

  function Eye({ side }: { side: "left" | "right" }) {
    const eye = side === "left" ? leftEye : rightEye;
    const closed = winkLeft && side === "left";
    if (closed) {
      return (
        <g>
          <path d={`M${eye.cx - eyeRx} ${eye.cy + 1} q${eyeRx} ${4} ${eyeRx * 2} 0`} fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.4" />
          {female ? <path d={`M${eye.cx - eyeRx + 2} ${eye.cy - 1}l-2.5-2.5M${eye.cx - 2} ${eye.cy - 2.5}l-1-3`} fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="1.4" /> : null}
        </g>
      );
    }
    const lidSquash = expression === "sleepy" || expression === "cool" ? 0.72 : 1;
    const ry = eyeRy * lidSquash;
    return (
      <g>
        <path d={`M${eye.cx - eyeRx + 1} ${eye.cy - 1} q${eyeRx} ${-ry * 0.95} ${eyeRx * 2 - 2} 0`} fill="none" stroke="#1c1917" strokeLinecap="round" strokeOpacity=".85" strokeWidth="1.35" />
        <ellipse cx={eye.cx} cy={eye.cy} fill="#fff" rx={eyeRx} ry={ry} stroke="#0f172a" strokeOpacity=".35" strokeWidth="1.2" />
        <circle cx={eye.cx + 0.4} cy={eye.cy + (expression === "sleepy" ? 1.4 : 0.6)} fill={eyeColor} r={pupilR * (expression === "cool" ? 0.9 : 1)} />
        <circle cx={eye.cx - 1.8} cy={eye.cy - 1.6} fill="#fff" r="1.7" />
        <circle cx={eye.cx + 2.2} cy={eye.cy + 2.4} fill="#fff" opacity=".55" r=".7" />
        <path d={`M${eye.cx - eyeRx + 2} ${eye.cy + 2} q${eyeRx} ${ry * 0.7} ${eyeRx * 2 - 4} 0`} fill="none" stroke="#1c1917" strokeLinecap="round" strokeOpacity=".35" strokeWidth="1.1" />
        {expression === "sleepy" || expression === "cool" ? (
          <path d={`M${eye.cx - eyeRx + 1} ${eye.cy - ry * 0.15} q${eyeRx} ${ry * 0.9} ${eyeRx * 2 - 2} 0`} fill="#1c1917" opacity=".12" />
        ) : null}
      </g>
    );
  }

  function Mouth() {
    if (expression === "surprised") {
      return <ellipse cx="83" cy="70" fill="#1c1917" rx="6.5" ry="8" />;
    }
    if (expression === "happy") {
      return female ? (
        <g>
          <path d="M68 64.5q15 16 30 0-15 12-30 0z" fill="#1c1917" />
          <path d="M72 66q11 8 22 0" fill="#fff" opacity=".85" />
          <path d="M70 64q7-3.5 13 0 6-3.5 13 0" fill="#e8799a" />
        </g>
      ) : (
        <g>
          <path d="M69 65q14 15 28 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.6" />
          <path d="M73 67q10 8 20 0" fill="#1c1917" opacity=".14" />
        </g>
      );
    }
    if (expression === "silly") {
      return (
        <g>
          <path d="M70 65q13 10 26 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.2" />
          <path d="M78 68q5 14 12 1 1 8-6 10-8 1-8-8z" fill="#fb7185" stroke="#1c1917" strokeWidth="1.2" />
          <path d="M82 72q3 4 6 1" fill="none" stroke="#fda4af" strokeWidth="1.2" />
        </g>
      );
    }
    if (expression === "sleepy") {
      return female ? (
        <g>
          <path d="M74 68q9 3 18 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M76 68.5q7 4 14 0" fill="#f472b6" opacity=".75" />
        </g>
      ) : (
        <path d="M74 69q9 2.5 18 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2" />
      );
    }
    if (expression === "cool" || expression === "smirk" || (expression === "classic" && !female)) {
      return (
        <g>
          <path d="M74 67.5q8 2 14-1.5 5 5.5 12 4" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.2" />
          <path d="M108 62q1.5 7-.5 13" fill="none" stroke="#1c1917" strokeLinecap="round" strokeOpacity=".75" strokeWidth="1.6" />
        </g>
      );
    }
    if (expression === "wink") {
      return female ? (
        <g>
          <path d="M72 66.5q6-3 10 0 4-3 10 0" fill="#e8799a" />
          <path d="M72 66.8q10 8 20 0-10 6-20 0z" fill="#f472b6" />
          <path d="M72.5 66.8q9.5 4.5 19 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="1.7" />
        </g>
      ) : (
        <path d="M72 68q12 7 24 1" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.3" />
      );
    }
    return female ? (
      <g>
        <path d="M72 66.5q6-3.5 10-.2 4-3.4 10 .2" fill="#e8799a" />
        <path d="M72 66.8q10 9.5 20 0-10 7-20 0z" fill="#f472b6" />
        <path d="M72.5 66.8q9.5 5.5 19 0" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="1.7" />
        <path d="M78 69.5q6 2.2 12 0" fill="none" stroke="#ffd6e3" strokeLinecap="round" strokeOpacity=".7" strokeWidth="1.1" />
      </g>
    ) : (
      <path d="M72 68q12 8 24 1" fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="2.4" />
    );
  }

  return (
    <g>
      <g fill="none" stroke={female ? "#1c1917" : "#292524"} strokeLinecap="round" strokeLinejoin="round">
        <path d={brows.left} strokeWidth={browStroke} />
        <path d={brows.right} strokeWidth={browStroke} />
      </g>

      <Eye side="left" />
      <Eye side="right" />

      <AvatarNose style={noseStyle} />

      {female && expression !== "sleepy" ? (
        <>
          <g fill="none" stroke="#1c1917" strokeLinecap="round" strokeWidth="1.55">
            <path d="M56 44.5l-3.2-2.8M58.5 42.5l-1.6-3.4M108.5 44.5l3.2-2.8M106 42.5l1.6-3.4" />
          </g>
          <ellipse cx="54" cy="60" fill="#fb7185" opacity={expression === "happy" || expression === "surprised" ? ".22" : ".16"} rx="7" ry="3.2" />
          <ellipse cx="112" cy="60" fill="#fb7185" opacity={expression === "happy" || expression === "surprised" ? ".22" : ".16"} rx="7" ry="3.2" />
        </>
      ) : null}

      <Mouth />
    </g>
  );
}

function AvatarNose({ style }: { style: NonNullable<AvatarConfig["noseStyle"]> }) {
  const common = {
    fill: "none",
    stroke: "#7c2d12",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeOpacity: .38,
  };
  if (style === "soft") {
    return <path {...common} d="M84 52q-2 7 .5 9.5 2 1.5 4.5-.5" strokeWidth="1.25" />;
  }
  if (style === "wide") {
    return (
      <g>
        <path {...common} d="M83 51q-3 8 .5 11 4 2.5 8-.2" strokeWidth="1.45" />
        <path {...common} d="M80.5 62q3 2 6 .2m2.5 0q3 1.7 6-.5" strokeWidth="1.2" />
      </g>
    );
  }
  if (style === "defined") {
    return (
      <g>
        <path {...common} d="M84 50q-3 10 0 13 4 2 7-1" strokeWidth="1.65" />
        <path d="M82 63q4 2 8-.5" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity=".24" strokeWidth="1" />
      </g>
    );
  }
  return (
    <g>
      <path {...common} d="M84 53q-2 6 .5 8.5 3 2 6-.5" strokeWidth="1.35" />
      <path d="M84 62q3 1.2 5-.4" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity=".22" strokeWidth="1" />
    </g>
  );
}

function Cap({ brand, colour }: { brand: AvatarAsset["brand"]; colour: string }) {
  return (
    <g>
      <path d="M44 36q6-30 38-30t40 30l-6 12H50z" fill={colour} stroke="#0f172a" strokeOpacity=".28" strokeWidth="2" />
      <path d="M82 7v38M51 36q16-26 32-28M114 36Q100 10 84 8" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="2" />
      <path d="M104 40h38q-7 12-24 14l-20-4z" fill={colour} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
      <path d="M108 43h28" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="3" />
      <circle cx="82" cy="7" fill={colour} r="4" stroke="#0f172a" strokeOpacity=".25" />
      <path d="M52 28q11-18 24-20" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="4" />
      <BrandMark brand={brand} scale=".46" x="72" y="24" />
    </g>
  );
}

function Hair({ style, color, gender }: { style: AvatarConfig["hairStyle"]; color: string; gender: AvatarConfig["gender"] }) {
  if (style === "bald") return null;
  if (style === "long") {
    return (
      <g>
        <path d="M43 29q8-23 39-23 33 0 42 25l-5 75-18-11 3-55-12-18-12 17-13-15-9 18 4 54-19 10z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <path d="M51 29q14-19 31-17m-28 29-3 49m59-49 2 49M69 14q-10 17-11 34m31-35q14 14 17 34" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".18" strokeWidth="3" />
      </g>
    );
  }
  if (style === "ponytail") {
    return (
      <g>
        <path d="M47 31q7-22 36-22 31 0 39 25l-10 15-10-24-15 16-11-16-15 19z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <path d="M113 23q28 12 19 54-9 24-23 31 10-31 0-53z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <circle cx="113" cy="28" fill="#f59e0b" r="5" />
        <path d="M55 26q17-15 36-10m29 19q10 19 2 44" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".18" strokeWidth="3" />
      </g>
    );
  }
  if (style === "short") {
    return (
      <g>
        <path d="M45 44V28q6-20 28-19l10-8 5 8q24 0 34 22l-6 12-8-15-10 10-8-13-12 14-10-10-14 14z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <path d="M54 24q18-16 40-10M60 32l10-11m10 10 9-14m7 16 8-10" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".16" strokeWidth="3" />
      </g>
    );
  }
  if (style === "afro") {
    return (
      <g stroke="#0f172a" strokeOpacity=".17">
        {[
          [50, 26, 16],
          [62, 14, 16],
          [78, 11, 17],
          [96, 14, 16],
          [110, 27, 16],
          [45, 40, 15],
          [118, 42, 14],
          [61, 35, 17],
          [81, 30, 18],
          [101, 36, 16],
        ].map(([x, y, r], i) => (
          <circle cx={x} cy={y} fill={color} key={i} r={r} />
        ))}
        <path d="M53 17q14-12 28-9M94 19q9 2 15 10" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".18" strokeWidth="4" />
      </g>
    );
  }
  if (style === "mohawk") {
    return (
      <g>
        <path d="M62 28Q63 3 72 9 77-6 84 8 92-4 101 29L92 21l-9 10-8-10-6 11z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <path d="M74 13q6-8 11 4" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".2" strokeWidth="3" />
      </g>
    );
  }
  if (style === "braids") {
    return (
      <g>
        <path d="M48 28q6-17 34-18 27 1 36 20" fill={color} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" />
        <g fill="none" stroke={color} strokeLinecap="round" strokeWidth="9">
          <path d="M50 25q-10 27-4 62" />
          <path d="M64 16q-8 35-3 73" />
          <path d="M80 13q-4 38 0 77" />
          <path d="M97 17q10 35 5 72" />
          <path d="M112 28q11 28 5 58" />
        </g>
        <g fill="none" stroke="white" strokeOpacity=".15" strokeWidth="2">
          <path d="M43 49l10 5m-11 9 11 5M58 43l11 5m-12 10 11 5m28-18 11 5m-10 10 11 5" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <path d="M46 29q8-19 36-19 27 0 37 20" fill={color} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" />
      <g fill="none" stroke={color} strokeLinecap="round" strokeWidth="10">
        <path d="M51 21q-14 35-5 67" />
        <path d="M68 14q-12 39-6 76" />
        <path d="M86 14q12 39 6 76" />
        <path d="M104 22q15 35 7 65" />
      </g>
      <g fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".14" strokeWidth="2">
        <path d="M47 43q8 4 1 10m13-18q10 5 2 11m28-10q10 5 2 11m15-5q9 5 2 11" />
      </g>
      {gender === "female" ? <path d="M46 32q-4 31 2 58m65-59q8 31 1 59" fill="none" stroke={color} strokeLinecap="round" strokeWidth="7" /> : null}
    </g>
  );
}

function ShirtMark({ style, premiumBrand }: { style: AvatarConfig["shirtStyle"]; premiumBrand?: string }) {
  if (style === "plain" && !premiumBrand) return null;
  if (premiumBrand) {
    return (
      <g>
        <rect fill="white" fillOpacity=".94" height="28" rx="7" width="40" x="68" y="96" />
        <BrandMark brand={premiumBrand as AvatarAsset["brand"]} scale=".64" x="74" y="102" />
      </g>
    );
  }
  const text = style === "skulkid" ? "SK" : style === "math" ? "M" : style === "science" ? "SCI" : "AB";
  return (
    <g>
      <rect fill="white" fillOpacity=".92" height="26" rx="8" width="36" x="72" y="94" />
      <text fill="#172554" fontFamily="sans-serif" fontSize="12" fontWeight="900" textAnchor="middle" x="90" y="112">
        {text}
      </text>
    </g>
  );
}

function BrandMark({ brand, x, y, scale = "1" }: { brand: AvatarAsset["brand"]; x: string; y: string; scale?: string }) {
  return <AvatarBrandMark brand={brand} contrastPlate scale={scale} x={x} y={y} />;
}
