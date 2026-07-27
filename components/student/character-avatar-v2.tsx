import { useId } from "react";
import type { AvatarConfig } from "@/lib/student/student-profile";
import { avatarShopAssets, type AvatarAsset, type AvatarAssetCategory } from "@/lib/student/avatar-shop";
import { cn } from "@/lib/utils";
import { AvatarBrandMark } from "@/components/student/avatar-brand-mark";

type Props = {
  avatar: AvatarConfig;
  className?: string;
  label?: string;
  animated?: boolean;
};

/**
 * A clean, portrait-led SkulKid character. Every feature uses the same
 * illustrated line weight and restrained shading so the avatar reads as one
 * character instead of a collection of separate game parts.
 */
export function CharacterAvatar({
  avatar,
  className = "size-24",
  label = "Custom student avatar",
  animated = true,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const asset = (category: AvatarAssetCategory) =>
    avatarShopAssets.find((item) => item.id === avatar.equippedPremium[category]);
  const shirt = asset("shirt");
  const bottoms = asset("bottoms");
  const shoes = asset("shoes");
  const glasses = asset("glasses");
  const watch = asset("watch");
  const bag = asset("bag");
  const cap = asset("cap");
  const skateboard = asset("skateboard");
  const shirtColor = shirt?.colour ?? avatar.shirtColor;
  const pantsColor = bottoms?.colour ?? avatar.pantsColor;
  const shoeColor = shoes?.colour ?? avatar.shoeColor;
  const outline = "#35211d";
  const female = avatar.gender === "female";
  const torsoHalf = female
    ? avatar.bodyStyle === "slim" ? 25 : avatar.bodyStyle === "strong" ? 32 : 28
    : avatar.bodyStyle === "slim" ? 27 : avatar.bodyStyle === "strong" ? 36 : 31;
  const waistHalf = female ? Math.max(18, torsoHalf - 8) : torsoHalf - 3;
  const hipHalf = female ? torsoHalf + 5 : torsoHalf - 1;
  const torsoPath = female
    ? `M${100 - torsoHalf + 5} 111
       Q100 104 ${100 + torsoHalf - 5} 111
       Q${100 + torsoHalf + 8} 120 ${100 + waistHalf} 143
       Q${100 + hipHalf} 160 ${100 + hipHalf} 173
       Q100 181 ${100 - hipHalf} 173
       Q${100 - hipHalf} 160 ${100 - waistHalf} 143
       Q${100 - torsoHalf - 8} 120 ${100 - torsoHalf + 5} 111 Z`
    : `M${100 - torsoHalf + 5} 111
       Q100 104 ${100 + torsoHalf - 5} 111
       Q${100 + torsoHalf + 8} 120 ${100 + torsoHalf - 3} 173
       Q100 180 ${100 - torsoHalf + 3} 173
       Q${100 - torsoHalf - 8} 120 ${100 - torsoHalf + 5} 111 Z`;

  return (
    <svg
      aria-label={label}
      className={cn("overflow-hidden rounded-2xl", animated && "avatar-game-idle", className)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 200 240"
    >
      <defs>
        <linearGradient id={`${uid}-skin`} x1=".18" x2=".82" y1=".08" y2=".92">
          <stop stopColor={avatar.skinColor} />
          <stop offset=".55" stopColor={avatar.skinColor} />
          <stop offset="1" stopColor={avatar.skinColor} />
        </linearGradient>
        <linearGradient id={`${uid}-shirt`} x1=".2" x2=".8" y1="0" y2="1">
          <stop stopColor={shirtColor} />
          <stop offset=".55" stopColor={shirtColor} />
          <stop offset="1" stopColor={shirtColor} />
        </linearGradient>
        <linearGradient id={`${uid}-pants`} x1=".2" x2=".8" y1="0" y2="1">
          <stop stopColor={pantsColor} />
          <stop offset=".55" stopColor={pantsColor} />
          <stop offset="1" stopColor={pantsColor} />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="4" floodColor="#312e81" floodOpacity=".18" stdDeviation="3" />
        </filter>
      </defs>

      <ellipse cx="100" cy={skateboard ? 226 : 222} fill="#312e81" opacity=".13" rx={skateboard ? 71 : 48} ry="7" />
      {skateboard ? <Skateboard color={skateboard.colour} outline={outline} /> : null}

      <g filter={`url(#${uid}-shadow)`}>
        {bag ? <Bag color={bag.colour} outline={outline} /> : null}

        {/* Legs are tapered continuous shapes instead of stacked capsules. */}
        {avatar.pantsStyle === "skirt" ? (
          <>
            <path d="M70 167h60l13 39H57z" fill={`url(#${uid}-pants)`} stroke={outline} strokeOpacity=".55" strokeWidth="2" />
            <path d="M75 199q2 15 1 20h18l3-20m6 0 3 20h18q-1-5 1-20" fill={`url(#${uid}-skin)`} stroke={outline} strokeLinecap="round" strokeOpacity=".45" strokeWidth="2" />
          </>
        ) : (
          <>
            <path d="M69 166q14-5 30 1l-5 51H72q3-29-3-52Z" fill={`url(#${uid}-pants)`} stroke={outline} strokeOpacity=".55" strokeWidth="2" />
            <path d="M101 167q16-6 30-1-6 23-3 52h-22Z" fill={`url(#${uid}-pants)`} stroke={outline} strokeOpacity=".55" strokeWidth="2" />
            {avatar.pantsStyle === "shorts" ? (
              <>
                <path d="M74 190h20v28H72q3-14 2-28Z" fill={`url(#${uid}-skin)`} stroke={outline} strokeOpacity=".4" strokeWidth="2" />
                <path d="M106 190h20q-1 14 2 28h-22Z" fill={`url(#${uid}-skin)`} stroke={outline} strokeOpacity=".4" strokeWidth="2" />
              </>
            ) : null}
          </>
        )}

        <path d="M67 217q15-7 29 0l-2 10H65q-3-6 2-10Z" fill={shoeColor} stroke={outline} strokeOpacity=".6" strokeWidth="2" />
        <path d="M104 217q15-7 29 0 5 4 2 10h-29Z" fill={shoeColor} stroke={outline} strokeOpacity=".6" strokeWidth="2" />
        <path d="M68 220h24m16 0h24" stroke="#fff" strokeLinecap="round" strokeOpacity=".55" strokeWidth="2" />

        {/* Curved arms, sleeves and torso form a single consistent silhouette. */}
        <path d={`M${100 - torsoHalf + 5} 115 Q58 111 51 131 l-9 40 q-3 10 7 13 q10 1 13-9 l11-30 Z`} fill={`url(#${uid}-skin)`} stroke={outline} strokeLinejoin="round" strokeOpacity=".55" strokeWidth="2.2" />
        <path d={`M${100 + torsoHalf - 5} 115 Q142 111 149 131 l9 40 q3 10-7 13 q-10 1-13-9 l-11-30 Z`} fill={`url(#${uid}-skin)`} stroke={outline} strokeLinejoin="round" strokeOpacity=".55" strokeWidth="2.2" />
        <path d={torsoPath} fill={`url(#${uid}-shirt)`} stroke={outline} strokeLinejoin="round" strokeOpacity=".58" strokeWidth="2.2" />
        <path d={`M${100 - torsoHalf + 6} 113 Q59 111 52 130 l-4 15 20 6 8-25 Z`} fill={`url(#${uid}-shirt)`} stroke={outline} strokeLinejoin="round" strokeOpacity=".5" strokeWidth="2" />
        <path d={`M${100 + torsoHalf - 6} 113 Q141 111 148 130 l4 15-20 6-8-25 Z`} fill={`url(#${uid}-shirt)`} stroke={outline} strokeLinejoin="round" strokeOpacity=".5" strokeWidth="2" />
        <path d="M83 116q17 10 34 0" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity=".26" strokeWidth="2" />

        <ShirtSymbol brand={shirt?.brand} style={avatar.shirtStyle} />
        {watch ? <Watch color={watch.colour} outline={outline} /> : null}

        <rect
          fill={`url(#${uid}-skin)`}
          height="23"
          rx="9"
          stroke={outline}
          strokeOpacity=".45"
          strokeWidth="2"
          width={female ? 20 : 25}
          x={female ? 90 : 87.5}
          y="96"
        />

        {/* Hair behind the face where required. */}
        <BackHair color={avatar.hairColor} style={avatar.hairStyle} />
        <Ears fill={`url(#${uid}-skin)`} outline={outline} />
        <FaceShape fill={`url(#${uid}-skin)`} gender={avatar.gender} outline={outline} style={avatar.headStyle} />
        <FrontHair color={avatar.hairColor} style={avatar.hairStyle} />
        {cap ? <Cap color={cap.colour} outline={outline} /> : null}
        <Features
          eyebrowStyle={avatar.eyebrowStyle ?? "soft"}
          eyeColor={avatar.eyeColor}
          expression={avatar.expression ?? "classic"}
          gender={avatar.gender}
          noseStyle={avatar.noseStyle ?? "button"}
          outline={outline}
        />
        {female ? <GirlDetails outline={outline} /> : null}
        {glasses ? <Glasses color={glasses.colour} /> : null}
      </g>
    </svg>
  );
}

function FaceShape({ fill, gender, outline, style }: { fill: string; gender: AvatarConfig["gender"]; outline: string; style: AvatarConfig["headStyle"] }) {
  const female = gender === "female";
  const path = female
    ? style === "round"
      ? "M100 18C67 18 49 36 49 68c0 30 17 47 37 59q14 9 28 0c20-12 37-29 37-59 0-32-18-50-51-50Z"
      : style === "oval"
        ? "M100 13C72 13 53 30 52 64c-1 32 15 52 35 65q13 9 26 0c20-13 36-33 35-65-1-34-20-51-48-51Z"
        : style === "wide"
          ? "M100 22C63 22 44 39 47 72c3 28 20 44 40 55q13 8 26 0c20-11 37-27 40-55 3-33-16-50-53-50Z"
          : "M100 18C68 18 49 35 49 67c0 29 16 47 37 59q14 9 28 0c21-12 37-30 37-59 0-32-19-49-51-49Z"
    : style === "round"
      ? "M100 18C65 18 47 36 48 68c0 31 17 48 36 58q16 9 32 0c20-11 36-28 36-58 1-32-17-50-52-50Z"
      : style === "oval"
        ? "M100 13C70 13 52 30 51 64c-1 32 15 52 34 64q15 10 30 0c19-12 35-32 34-64-1-34-19-51-49-51Z"
        : style === "wide"
          ? "M100 22C61 22 42 39 46 72c3 28 20 44 39 54q15 8 30 0c19-10 36-26 39-54 4-33-15-50-54-50Z"
          : "M100 18C65 18 47 34 47 68c0 29 17 48 38 59q15 8 30 0c21-11 38-30 38-59 0-34-18-50-53-50Z";
  return <path d={path} fill={fill} stroke={outline} strokeOpacity=".62" strokeWidth="2.3" />;
}

function Ears({ fill, outline }: { fill: string; outline: string }) {
  return (
    <g>
      <ellipse cx="48" cy="75" fill={fill} rx="9" ry="15" stroke={outline} strokeOpacity=".5" strokeWidth="2" />
      <ellipse cx="152" cy="75" fill={fill} rx="9" ry="15" stroke={outline} strokeOpacity=".5" strokeWidth="2" />
      <path d="M48 70q-5 5 0 11m104-11q5 5 0 11" fill="none" stroke={outline} strokeLinecap="round" strokeOpacity=".3" strokeWidth="1.5" />
    </g>
  );
}

function Features({ eyebrowStyle, eyeColor, expression, gender, noseStyle, outline }: {
  eyebrowStyle: NonNullable<AvatarConfig["eyebrowStyle"]>;
  eyeColor: string;
  expression: AvatarConfig["expression"];
  gender: AvatarConfig["gender"];
  noseStyle: NonNullable<AvatarConfig["noseStyle"]>;
  outline: string;
}) {
  const surprised = expression === "surprised";
  const sleepy = expression === "sleepy" || expression === "cool";
  const browArch = surprised ? -9 : eyebrowStyle === "arched" ? -8 : eyebrowStyle === "straight" ? -2 : -5;
  const browWidth = eyebrowStyle === "bold" ? 4.3 : 3;
  const eyeRy = surprised ? 11 : sleepy ? 6 : 9;
  const wink = expression === "wink";
  const eyeRx = gender === "female" ? 13 : 12;
  const browLift = gender === "female" ? browArch - 1 : browArch;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={`M66 52q12 ${browLift} 24 0M110 52q12 ${browLift} 24 0`} fill="none" stroke={outline} strokeWidth={gender === "female" ? Math.min(3, browWidth) : browWidth} />
      {wink ? <path d="M66 72q12 7 24 0" fill="none" stroke={outline} strokeWidth="2.5" /> : <Eye cx={78} cy={70} color={eyeColor} outline={outline} rx={eyeRx} ry={eyeRy} />}
      <Eye cx={122} cy={70} color={eyeColor} outline={outline} rx={eyeRx} ry={eyeRy} />
      {gender === "female" && !sleepy ? (
        <path
          d="m66 66-6-3m9 0-3-6m7 5-1-6m62 10 6-3m-9 0 3-6m-7 5 1-6"
          fill="none"
          stroke={outline}
          strokeWidth="2"
        />
      ) : null}
      <Nose outline={outline} style={noseStyle} />
      <Mouth expression={expression} gender={gender} outline={outline} />
      <ellipse cx="66" cy="94" fill="#fb7185" opacity={gender === "female" ? ".2" : ".12"} rx={gender === "female" ? "11" : "10"} ry={gender === "female" ? "5" : "4"} />
      <ellipse cx="134" cy="94" fill="#fb7185" opacity={gender === "female" ? ".2" : ".12"} rx={gender === "female" ? "11" : "10"} ry={gender === "female" ? "5" : "4"} />
    </g>
  );
}

function Eye({ color, cx, cy, outline, rx = 12, ry }: { color: string; cx: number; cy: number; outline: string; rx?: number; ry: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} fill="#fff" rx={rx} ry={ry} stroke={outline} strokeWidth="2" />
      <circle cx={cx} cy={cy + .5} fill={color} r={Math.min(7, ry - 1)} />
      <circle cx={cx} cy={cy + .5} fill="#211713" opacity=".72" r={Math.min(3.5, ry / 2)} />
      <circle cx={cx - 2.5} cy={cy - 2.5} fill="#fff" r="2" />
    </g>
  );
}

function Nose({ outline, style }: { outline: string; style: NonNullable<AvatarConfig["noseStyle"]> }) {
  const path = style === "wide" ? "M97 76q-4 12 0 16 7 4 14 0" : style === "defined" ? "M100 75q-4 13 0 18 5 2 9-1" : style === "soft" ? "M100 79q-2 9 2 12 3 1 6-1" : "M99 80q-2 8 2 11 4 2 8-1";
  return <path d={path} fill="none" stroke={outline} strokeOpacity=".58" strokeWidth={style === "defined" ? 2.2 : 1.7} />;
}

function Mouth({ expression, gender, outline }: { expression: AvatarConfig["expression"]; gender: AvatarConfig["gender"]; outline: string }) {
  const lip = gender === "female" ? "#be185d" : outline;
  if (expression === "surprised") return <ellipse cx="103" cy="107" fill={gender === "female" ? "#9f1239" : outline} rx="7" ry="9" />;
  if (expression === "happy") return <path d="M86 103q17 20 34 0-17 12-34 0Z" fill="#fff" stroke={lip} strokeWidth={gender === "female" ? "2.7" : "2.2"} />;
  if (expression === "silly") return <path d="M87 103q16 13 32 0m-20 8q5 16 12 0" fill="#fb7185" stroke={outline} strokeWidth="2" />;
  if (expression === "sleepy") return <path d="M94 108q9 3 18 0" fill="none" stroke={lip} strokeWidth="2.2" />;
  if (expression === "smirk" || expression === "cool") return <path d="M90 107q13 4 26-3" fill="none" stroke={lip} strokeWidth="2.5" />;
  return <path d="M88 104q15 14 30 0" fill="none" stroke={lip} strokeWidth={gender === "female" ? "2.8" : "2.5"} />;
}

function GirlDetails({ outline }: { outline: string }) {
  return (
    <g aria-label="Girl avatar details">
      <circle cx="47" cy="84" fill="#fbbf24" r="3.6" stroke={outline} strokeOpacity=".45" strokeWidth="1.2" />
      <circle cx="153" cy="84" fill="#fbbf24" r="3.6" stroke={outline} strokeOpacity=".45" strokeWidth="1.2" />
      <circle cx="46.2" cy="83.2" fill="#fff" opacity=".7" r=".9" />
      <circle cx="152.2" cy="83.2" fill="#fff" opacity=".7" r=".9" />
    </g>
  );
}

function BackHair({ color, style }: { color: string; style: AvatarConfig["hairStyle"] }) {
  if (style === "long") return <path d="M48 54q2-43 52-43t52 43l-5 82-25-10 5-76H73l5 76-25 10Z" fill={color} />;
  if (style === "ponytail") return <path d="M138 34q31 11 22 61-5 25-23 35 9-34-3-68Z" fill={color} stroke="#35211d" strokeOpacity=".45" strokeWidth="2" />;
  if (style === "braids" || style === "locs") {
    const width = style === "braids" ? 7 : 10;
    return (
      <g>
        <path d="M51 49Q52 12 100 12t49 37q-15-3-26-21-18 17-37 0-12 17-35 21Z" fill={color} stroke="#35211d" strokeOpacity=".4" strokeWidth="2" />
        <g fill="none" stroke={color} strokeLinecap="round" strokeWidth={width}>
          <path d="M57 39q-12 44-5 85" />
          <path d="M72 27q-10 54-4 105" />
          <path d="M128 28q10 53 4 104" />
          <path d="M143 40q12 43 5 84" />
        </g>
        {style === "braids" ? <g fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.4"><path d="m49 67 10 4m-11 11 10 4m7-28 10 4m-11 12 10 4m52-18 10 4m-9 12 10 4m8-14 10 4m-9 12 10 4" /></g> : null}
      </g>
    );
  }
  return null;
}

function FrontHair({ color, style }: { color: string; style: AvatarConfig["hairStyle"] }) {
  if (style === "bald") return null;
  if (style === "afro") {
    return <g fill={color} stroke="#35211d" strokeOpacity=".24">{[[55,35,20],[69,21,21],[91,16,23],[114,18,22],[138,34,20],[51,52,18],[149,52,18],[74,40,22],[101,36,24],[128,42,21]].map(([cx,cy,r], index) => <circle cx={cx} cy={cy} key={index} r={r} />)}</g>;
  }
  if (style === "mohawk") return <path d="M75 28q2-29 12-16 9-25 19 0 12-15 20 18l-14-8-12 10-11-10Z" fill={color} stroke="#35211d" strokeOpacity=".5" strokeWidth="2" />;
  if (style === "braids" || style === "locs") return null;
  if (style === "long" || style === "ponytail") return <path d="M50 49Q53 11 100 11t50 38q-18-3-30-24-18 20-38 2-12 18-32 22Z" fill={color} stroke="#35211d" strokeOpacity=".45" strokeWidth="2" />;
  return <path d="M49 50Q50 12 98 12q46 0 52 38-13-3-23-20-10 12-24 2-12 13-24-1-11 14-30 19Z" fill={color} stroke="#35211d" strokeOpacity=".45" strokeWidth="2" />;
}

function Glasses({ color }: { color: string }) {
  return <g fill="#e0f2fe" fillOpacity=".16" stroke={color} strokeWidth="3"><rect height="25" rx="11" width="36" x="58" y="59" /><rect height="25" rx="11" width="36" x="106" y="59" /><path d="M94 69q6-4 12 0M58 65l-10-3m94 3 10-3" fill="none" /></g>;
}

function Cap({ color, outline }: { color: string; outline: string }) {
  return <g><path d="M54 45q5-39 46-39t48 39l-10 12H61Z" fill={color} stroke={outline} strokeOpacity=".55" strokeWidth="2" /><path d="M116 48h54q-12 15-37 15Z" fill={color} stroke={outline} strokeOpacity=".55" strokeWidth="2" /></g>;
}

function ShirtSymbol({ brand, style }: { brand?: string; style: AvatarConfig["shirtStyle"] }) {
  if (style === "plain" && !brand) return null;
  const text = brand ?? (style === "skulkid" ? "SK" : style === "math" ? "M" : style === "science" ? "SCI" : "AB");
  return (
    <g aria-label={brand ? `${brand} shirt logo` : `${text} shirt badge`}>
      <rect fill="#fff" height="24" rx="7" stroke="#0f172a" strokeOpacity=".16" strokeWidth="1.5" width="44" x="78" y="135" />
      {brand
        ? <AvatarBrandMark brand={brand as AvatarAsset["brand"]} contrastPlate={false} scale=".68" x="85" y="138" />
        : <text fill="#0f172a" fontFamily="Arial, sans-serif" fontSize={text.length > 2 ? "9" : "12"} fontWeight="900" textAnchor="middle" x="100" y="151">{text}</text>}
    </g>
  );
}

function Watch({ color, outline }: { color: string; outline: string }) {
  return <g transform="rotate(-10 147 163)"><rect fill={color} height="15" rx="5" stroke={outline} strokeOpacity=".5" width="22" x="136" y="155" /><rect fill="#dbeafe" height="9" rx="3" width="12" x="141" y="158" /></g>;
}

function Bag({ color, outline }: { color: string; outline: string }) {
  return <g><path d="M47 119q-20 9-18 52l5 28 33-4-2-64Z" fill={color} stroke={outline} strokeOpacity=".55" strokeWidth="2" /><path d="M39 130q7-15 17-2" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" /></g>;
}

function Skateboard({ color, outline }: { color: string; outline: string }) {
  return <g transform="rotate(-3 100 219)"><path d="M28 215q8 10 22 7h102q14 3 20-7-12 3-24 1H52q-12 2-24-1Z" fill={color} stroke={outline} strokeOpacity=".55" strokeWidth="2" /><circle cx="50" cy="228" fill="#334155" r="6" /><circle cx="150" cy="228" fill="#334155" r="6" /></g>;
}
