import { useId } from "react";
import type { AvatarConfig } from "@/lib/student/student-profile";
import { avatarShopAssets, type AvatarAsset, type AvatarAssetCategory } from "@/lib/student/avatar-shop";
import { cn } from "@/lib/utils";

/**
 * Game-character avatar in 3/4 ready stance.
 * Far limbs draw first; near limbs + head sit on top for depth.
 */
export function CharacterAvatar({ avatar, className = "size-24", label = "Custom student avatar", animated = true }: { avatar: AvatarConfig; className?: string; label?: string; animated?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const skin = `${uid}-skin`;
  const skinFar = `${uid}-skin-far`;
  const shirtFill = `${uid}-shirt`;
  const pantsFill = `${uid}-pants`;
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
  const torsoW = avatar.bodyStyle === "slim" ? (female ? 43 : 46) : avatar.bodyStyle === "strong" ? (female ? 53 : 58) : (female ? 48 : 52);
  const shoulderX = Math.round((164 - torsoW) / 2);

  return (
    <svg aria-label={label} className={cn("overflow-hidden rounded-2xl", animated && "avatar-game-idle", className)} preserveAspectRatio="xMidYMid meet" role="img" viewBox="0 0 180 220">
      <defs>
        <linearGradient id={skin} x1=".15" x2=".9" y1=".05" y2=".95">
          <stop stopColor="#fff" stopOpacity=".48" />
          <stop offset=".28" stopColor={avatar.skinColor} />
          <stop offset=".7" stopColor={avatar.skinColor} />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={skinFar} x1=".2" x2=".85" y1=".1" y2="1">
          <stop stopColor={avatar.skinColor} />
          <stop offset="1" stopColor="#000" stopOpacity=".38" />
        </linearGradient>
        <linearGradient id={shirtFill} x1=".1" x2=".95" y1=".05" y2=".92">
          <stop stopColor="#fff" stopOpacity=".38" />
          <stop offset=".32" stopColor={shirtColour} />
          <stop offset=".7" stopColor={shirtColour} />
          <stop offset="1" stopColor="#000" stopOpacity=".34" />
        </linearGradient>
        <linearGradient id={pantsFill} x1=".1" x2=".9" y1=".05" y2=".95">
          <stop stopColor="#fff" stopOpacity=".28" />
          <stop offset=".35" stopColor={pantsColour} />
          <stop offset=".75" stopColor={pantsColour} />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-35%" y="-30%" width="170%" height="175%">
          <feDropShadow dx="2" dy="6" floodColor="#0f172a" floodOpacity=".28" stdDeviation="3.2" />
        </filter>
        <filter id={`${uid}-soft`}>
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {/* ground plane */}
      <ellipse className="avatar-game-shadow" cx="92" cy={skateboard ? 206 : 198} fill="#1e1b4b" filter={`url(#${uid}-soft)`} opacity=".28" rx={skateboard ? 62 : 48} ry="8" />

      {skateboard ? (
        <g filter={`url(#${uid}-shadow)`} transform="translate(8 4) rotate(-6 90 190)">
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
        {/* FAR arm (back, slightly darker) — hanging ready */}
        <g transform="translate(-4 2)">
          <path d={`M${shoulderX + 4} 86 L42 98 l-6 28 16 6 10-30z`} fill={`url(#${shirtFill})`} stroke="#0f172a" strokeOpacity=".2" strokeWidth="1.8" opacity=".88" />
          <rect fill={`url(#${skinFar})`} height="20" rx="7" transform="rotate(18 42 128)" width="15" x="34" y="118" />
          <ellipse cx="38" cy="142" fill={`url(#${skinFar})`} rx="11" ry="10" stroke="#0f172a" strokeOpacity=".2" strokeWidth="1.6" transform="rotate(14 38 142)" />
        </g>

        {/* FAR leg (planted back) */}
        {avatar.pantsStyle === "skirt" ? null : (
          <g opacity=".92">
            <path d="M58 128h28l-2 42-8 8H52l-2-12z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
            <path d="M62 134h16" stroke="white" strokeLinecap="round" strokeOpacity=".18" strokeWidth="2.5" />
            {avatar.pantsStyle === "shorts" ? <path d="M54 150h28l-2 22H56z" fill={`url(#${skinFar})`} /> : null}
            {/* far shoe — heel planted */}
            <path d="M46 168q16-6 34 2v14q-2 7-34 3-7-2 0-19z" fill={shoeColour} stroke="#0f172a" strokeOpacity=".28" strokeWidth="2" />
            <path d="M52 176h18" stroke="white" strokeLinecap="round" strokeOpacity=".55" strokeWidth="2.5" />
            {shoes ? <BrandMark brand={shoes.brand} scale=".2" x="54" y="174" /> : null}
          </g>
        )}

        {bag ? (
          <g transform="translate(-6 8)">
            <rect fill={bag.colour} height="52" rx="12" width="28" x="36" y="98" stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
            <path d="M42 104q8-14 16 0" fill="none" stroke="white" strokeOpacity=".3" strokeWidth="4" />
            <rect fill="black" fillOpacity=".18" height="18" rx="5" width="18" x="41" y="118" />
            <BrandMark brand={bag.brand} scale=".28" x="42" y="120" />
          </g>
        ) : null}

        {/* Torso — angled 3/4 */}
        <rect fill={`url(#${skin})`} height="14" rx="5" width="16" x="78" y="72" />
        <path
          d={`M${shoulderX} 80
             h${torsoW}
             c6 2 10 8 11 18
             l4 36
             c0 6-4 10-10 10
             H${shoulderX - 4}
             c-6 0-10-4-10-10
             l-2-34
             c0-12 4-18 11-20z`}
          fill={`url(#${shirtFill})`}
          stroke="#0f172a"
          strokeLinejoin="round"
          strokeOpacity=".24"
          strokeWidth="2"
        />
        {/* torso depth crease (near side brighter) */}
        <path d={`M${shoulderX + torsoW - 2} 86 l6 8 2 38-8-4z`} fill="#000" opacity=".14" />
        <path d={`M${shoulderX + 8} 88 h${torsoW - 18}`} stroke="white" strokeLinecap="round" strokeOpacity=".28" strokeWidth="3" />
        <ShirtMark premiumBrand={shirt?.brand} style={avatar.shirtStyle} />

        {/* skirt sits over legs when equipped */}
        {avatar.pantsStyle === "skirt" ? (
          <g>
            <path d="M52 126h66l12 42H42z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" />
            <path d="M58 132h48" stroke="white" strokeLinecap="round" strokeOpacity=".2" strokeWidth="3" />
            {bottoms ? <BrandMark brand={bottoms.brand} scale=".35" x="62" y="140" /> : null}
            <path d="M48 158q18-5 36 1v14q-2 6-34 2-6-1 0-17z" fill={shoeColour} stroke="#0f172a" strokeOpacity=".28" strokeWidth="2" />
            <path d="M92 156q22-7 38 2 6 18-2 20-36 4-38-4z" fill={shoeColour} stroke="#0f172a" strokeOpacity=".28" strokeWidth="2" />
            <path d="M56 166h20M102 166h22" stroke="white" strokeLinecap="round" strokeOpacity=".55" strokeWidth="2.5" />
          </g>
        ) : (
          <g>
            {/* NEAR leg — stepped forward (game walk-ready) */}
            <path d="M86 126h32l10 48-6 10H90l-4-12z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
            <path d="M92 132h18" stroke="white" strokeLinecap="round" strokeOpacity=".22" strokeWidth="2.5" />
            <path d="M108 130h8l6 36-6 6" fill="#000" opacity=".12" />
            {bottoms ? <BrandMark brand={bottoms.brand} scale=".32" x="90" y="136" /> : null}
            {avatar.pantsStyle === "shorts" ? <path d="M88 150h34l4 24H90z" fill={`url(#${skin})`} /> : null}
            {/* near shoe — toe forward */}
            <path d="M88 172q28-10 48 4 8 18-2 20-44 5-48-6z" fill={shoeColour} stroke="#0f172a" strokeOpacity=".3" strokeWidth="2" />
            <path d="M98 180h26" stroke="white" strokeLinecap="round" strokeOpacity=".65" strokeWidth="3" />
            <path d="M92 190q22 3 42-1" fill="none" stroke="#0f172a" strokeOpacity=".16" strokeWidth="2.5" />
            {shoes ? <BrandMark brand={shoes.brand} scale=".22" x="104" y="178" /> : null}
          </g>
        )}

        {/* NEAR arm — bent, ready pose */}
        <g>
          <path d={`M${shoulderX + torsoW - 6} 84 l22 6 10 26-18 8-16-28z`} fill={`url(#${shirtFill})`} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
          <circle cx="138" cy="96" fill="white" opacity=".16" r="5" />
          <rect fill={`url(#${skin})`} height="22" rx="8" transform="rotate(-22 136 122)" width="17" x="127" y="110" />
          <ellipse cx="142" cy="136" fill={`url(#${skin})`} rx="12" ry="11" stroke="#0f172a" strokeOpacity=".22" strokeWidth="1.8" transform="rotate(-16 142 136)" />
          <path d="M134 132q8-6 16 0M136 142q6 4 12-1" fill="none" stroke="#2d160f" strokeLinecap="round" strokeOpacity=".26" strokeWidth="2" />
          <ellipse cx="146" cy="130" fill="white" opacity=".28" rx="3.5" ry="2" transform="rotate(-16 146 130)" />
          {watch ? (
            <g>
              <rect fill={watch.colour} height="12" rx="3" transform="rotate(-22 134 120)" width="20" x="124" y="114" />
              <rect fill="#dbeafe" height="8" rx="2" transform="rotate(-22 134 120)" width="11" x="128" y="116" />
              <BrandMark brand={watch.brand} scale=".14" x="130" y="116" />
            </g>
          ) : null}
        </g>

        {/* Head — 3/4 turn toward camera */}
        <g className="avatar-game-head">
          <g transform="translate(3 -5) scale(1.04)">
            <HeadShape fill={`url(#${skin})`} style={avatar.headStyle} />
            {/* cheek / jaw depth */}
            <path d="M108 32q8 16 2 40" fill="none" stroke="#000" strokeLinecap="round" strokeOpacity=".14" strokeWidth="5" />
            <path d="M54 30q10-8 22-8" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".34" strokeWidth="4.5" />
            <Hair color={avatar.hairColor} gender={avatar.gender} style={avatar.hairStyle} />
            {cap ? <Cap brand={cap.brand} colour={cap.colour} /> : null}
            {/* brows angled with head turn */}
            <path d={female ? "M57 44q8-5 17 0M88 42q9-5 18 1" : "M58 44q8-5 16 1M88 42q9-5 17 2"} fill="none" stroke="#422006" strokeLinecap="round" strokeOpacity=".55" strokeWidth={female ? "1.8" : "2.2"} />
            {/* eyes — near eye larger */}
            <ellipse cx="66" cy="54" fill="white" rx={female ? "7.2" : "6.5"} ry={female ? "7.8" : "7"} />
            <ellipse cx="98" cy="52" fill="white" rx={female ? "8.1" : "7.5"} ry={female ? "8.3" : "7.5"} />
            <circle cx="67" cy="55" fill={avatar.eyeColor} r={female ? "3.8" : "3.2"} />
            <circle cx="99" cy="53" fill={avatar.eyeColor} r={female ? "4.1" : "3.6"} />
            <circle cx="65.5" cy="52.5" fill="white" r=".9" />
            <circle cx="97.5" cy="50.5" fill="white" r="1.1" />
            {female ? <><path d="M58 48l-4-3m7 1-2-4m38 3 3-4m1 6 5-3" fill="none" stroke="#21140f" strokeLinecap="round" strokeWidth="1.5" /><ellipse cx="59" cy="64" fill="#fb7185" opacity=".18" rx="7" ry="3.5" /><ellipse cx="104" cy="62" fill="#fb7185" opacity=".18" rx="7" ry="3.5" /></> : null}
            <path d="M80 55l-2 7 5 1.5" fill="none" stroke="#000" strokeLinecap="round" strokeOpacity=".16" strokeWidth="2" />
            {glasses ? (
              <g>
                <path d="M50 40h64l-4 24H90l-6-7-6 7H54z" fill={glasses.colour} opacity=".92" />
                <path d="M56 45h20l-4 12H58zm28 0h22l-3 12H90z" fill="#67e8f9" opacity=".78" />
                <path d="M59 47h10" stroke="white" strokeLinecap="round" strokeOpacity=".8" strokeWidth="2.5" />
                <BrandMark brand={glasses.brand} scale=".18" x="74" y="40" />
              </g>
            ) : (
              female ? <g><path d="M70 69q12 7 24 0-12 13-24 0z" fill="#c94d65" opacity=".9" /><path d="M74 70q8 3 16 0" stroke="#ffd5dc" strokeLinecap="round" strokeWidth="1.2" /></g> : <path d="M70 68q12 9 24 1" fill="none" stroke="#5c2e24" strokeLinecap="round" strokeWidth="2.8" />
            )}
          </g>
        </g>
      </g>
    </svg>
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

function HeadShape({ style, fill }: { style: AvatarConfig["headStyle"]; fill: string }) {
  const shared = { fill, stroke: "#0f172a", strokeOpacity: .2, strokeWidth: 2 };
  /* Slightly wider on the near (right) side for 3/4 read */
  if (style === "round") {
    return (
      <g>
        <ellipse cx="82" cy="50" rx="35" ry="34" {...shared} />
        <ellipse cx="74" cy="24" fill="white" opacity=".18" rx="18" ry="5" />
      </g>
    );
  }
  if (style === "oval") {
    return (
      <g>
        <ellipse cx="82" cy="50" rx="29" ry="38" {...shared} />
        <ellipse cx="74" cy="18" fill="white" opacity=".18" rx="15" ry="4" />
      </g>
    );
  }
  if (style === "wide") {
    return (
      <g>
        <rect height="60" rx="20" width="84" x="40" y="20" {...shared} />
        <ellipse cx="74" cy="23" fill="white" opacity=".16" rx="28" ry="5" />
      </g>
    );
  }
  return (
    <g>
      <rect height="64" rx="15" width="74" x="45" y="17" {...shared} />
      <ellipse cx="74" cy="20" fill="white" opacity=".16" rx="24" ry="5.5" />
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
      <rect fill="white" fillOpacity=".92" height="28" rx="7" width="36" x="70" y="96" />
      <text fill="#172554" fontFamily="sans-serif" fontSize="13" fontWeight="900" textAnchor="middle" x="88" y="115">
        {text}
      </text>
    </g>
  );
}

function BrandMark({ brand, x, y, scale = "1" }: { brand: AvatarAsset["brand"]; x: string; y: string; scale?: string }) {
  const transform = `translate(${x} ${y}) scale(${scale})`;
  if (brand === "Nike") return <g aria-label="Nike logo" fill="white" transform={transform}><path d="M1 13c7 5 13 5 20 1L39 3 23 10C14 14 8 15 1 13Z" /></g>;
  if (brand === "Adidas") return <g aria-label="Adidas logo" fill="white" transform={transform}><path d="m2 14 7-4 6 10H9zm10-7 7-4 10 17h-7zm12-5 7-2 12 20h-7z" /><text fontFamily="Arial, sans-serif" fontSize="7" fontWeight="900" x="8" y="27">adidas</text></g>;
  return <g aria-label="Puma logo" fill="white" transform={transform}><text fontFamily="Arial Black, Arial, sans-serif" fontSize="10" fontWeight="900" letterSpacing="-.5" x="0" y="16">PUMA</text><path d="M28 5c4-4 8-3 10 0l5 1-4 3-2 6-4-1-2-5-5 1z" /></g>;
}
