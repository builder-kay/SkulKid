import { useId } from "react";
import type { AvatarConfig } from "@/lib/student/student-profile";
import { avatarShopAssets, type AvatarAsset, type AvatarAssetCategory } from "@/lib/student/avatar-shop";
import { cn } from "@/lib/utils";

export function CharacterAvatar({ avatar, className = "size-24", label = "Custom student avatar" }: { avatar: AvatarConfig; className?: string; label?: string }) {
  const uid = useId().replace(/:/g, "");
  const skin = `${uid}-skin`;
  const shirtFill = `${uid}-shirt`;
  const pantsFill = `${uid}-pants`;
  const premium = (category: AvatarAssetCategory) => avatarShopAssets.find((asset) => asset.id === avatar.equippedPremium[category]);
  const shirt = premium("shirt"); const bottoms = premium("bottoms"); const shoes = premium("shoes"); const glasses = premium("glasses"); const watch = premium("watch"); const skateboard = premium("skateboard"); const bag = premium("bag"); const cap = premium("cap");
  const shirtColour = shirt?.colour ?? avatar.shirtColor;
  const pantsColour = bottoms?.colour ?? avatar.pantsColor;
  const shoulder = avatar.bodyStyle === "slim" ? 39 : avatar.bodyStyle === "strong" ? 31 : 35;
  const torsoWidth = avatar.bodyStyle === "slim" ? 62 : avatar.bodyStyle === "strong" ? 78 : 70;

  return <svg aria-label={label} className={cn("overflow-hidden rounded-2xl", className)} preserveAspectRatio="xMidYMid meet" role="img" viewBox="-8 -5 176 220">
    <defs>
      <radialGradient id={`${uid}-bg`} cx=".3" cy=".18"><stop stopColor="#fff" /><stop offset=".45" stopColor="#dbeafe" /><stop offset="1" stopColor="#c4b5fd" /></radialGradient>
      <linearGradient id={skin} x1=".08" x2=".92" y1=".05" y2=".95"><stop stopColor="#fff" stopOpacity=".52" /><stop offset=".24" stopColor={avatar.skinColor} /><stop offset=".72" stopColor={avatar.skinColor} /><stop offset="1" stopColor="#000" stopOpacity=".28" /></linearGradient>
      <linearGradient id={shirtFill} x1=".05" x2=".95" y1=".05" y2=".9"><stop stopColor="#fff" stopOpacity=".34" /><stop offset=".3" stopColor={shirtColour} /><stop offset=".72" stopColor={shirtColour} /><stop offset="1" stopColor="#000" stopOpacity=".32" /></linearGradient>
      <linearGradient id={pantsFill} x1=".05" x2=".95" y1=".05" y2=".95"><stop stopColor="#fff" stopOpacity=".25" /><stop offset=".35" stopColor={pantsColour} /><stop offset=".76" stopColor={pantsColour} /><stop offset="1" stopColor="#000" stopOpacity=".36" /></linearGradient>
      <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="1" dy="5" floodColor="#172554" floodOpacity=".3" stdDeviation="3.5" /></filter>
      <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="4" /></filter>
    </defs>
    <rect fill={`url(#${uid}-bg)`} height="220" width="176" x="-8" y="-5" />
    <g transform="translate(-12 0) scale(1.15 1)">
    <circle cx="28" cy="29" fill="white" opacity=".42" r="23" />
    <ellipse cx="80" cy={skateboard ? "204" : "193"} fill="#312e81" filter={`url(#${uid}-soft)`} opacity=".24" rx={skateboard ? "67" : "55"} ry="7" />
    {skateboard ? <g filter={`url(#${uid}-shadow)`}><path d="M16 187q4 8 15 7h98q11 1 15-7-7 2-17 0H33q-10 2-17 0z" fill={skateboard.colour} stroke="#0f172a" strokeOpacity=".3" strokeWidth="2" /><path d="M28 188h104" opacity=".35" stroke="white" strokeLinecap="round" strokeWidth="2" /><BrandMark brand={skateboard.brand} scale=".45" x="71" y="181" /><path d="M34 194v4m92-4v4" stroke="#64748b" strokeWidth="4" /><circle cx="34" cy="202" fill="#1e293b" r="6" /><circle cx="126" cy="202" fill="#1e293b" r="6" /><circle cx="34" cy="202" fill="#94a3b8" r="2" /><circle cx="126" cy="202" fill="#94a3b8" r="2" /></g> : null}
    {bag ? <g filter={`url(#${uid}-shadow)`}><rect fill={bag.colour} height="67" rx="14" width="64" x="48" y="91" /><path d="M59 101Q80 79 101 101" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="6" /><rect fill="black" fillOpacity=".2" height="27" rx="7" width="48" x="56" y="120" /><BrandMark brand={bag.brand} scale=".55" x="69" y="124" /></g> : null}

    <g filter={`url(#${uid}-shadow)`}>
      {/* chunky toy legs */}
      {avatar.pantsStyle === "skirt" ? <path d="M43 126h74l10 35H33z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".18" strokeWidth="2" /> : <>
        <path d="M45 124h34v51H42l-3-10z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
        <path d="M81 124h34l6 41-3 10H81z" fill={`url(#${pantsFill})`} stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" />
        <path d="M69 129h10v43H69zM105 129h10l5 35-7 7z" fill="#000" opacity=".12" />
        <path d="M48 130h24" stroke="white" strokeLinecap="round" strokeOpacity=".22" strokeWidth="3" />
        {bottoms ? <BrandMark brand={bottoms.brand} scale=".38" x="50" y="135" /> : null}
        {avatar.pantsStyle === "shorts" ? <><path d="M43 147h35v26H46z" fill={`url(#${skin})`} /><path d="M82 147h35l-3 26H82z" fill={`url(#${skin})`} /></> : null}
      </>}
      {/* oversized game shoes */}
      <path d="M36 166q18-8 43 1v18q-2 8-43 4-8-2 0-23z" fill={shoes?.colour ?? avatar.shoeColor} stroke="#0f172a" strokeOpacity=".3" strokeWidth="2" />
      <path d="M82 167q25-9 43 1 8 21 0 23-41 4-43-5z" fill={shoes?.colour ?? avatar.shoeColor} stroke="#0f172a" strokeOpacity=".3" strokeWidth="2" />
      <path d="M45 174h25M91 174h25" stroke="white" strokeLinecap="round" strokeOpacity=".65" strokeWidth="3" />
      <path d="M38 184q19 4 40 0M84 185q20 4 42 0" fill="none" stroke="#0f172a" strokeOpacity=".18" strokeWidth="3" />
      {shoes ? <><BrandMark brand={shoes.brand} scale=".25" x="49" y="173" /><BrandMark brand={shoes.brand} scale=".25" x="96" y="174" /></> : null}

      {/* block torso and articulated arms */}
      <rect fill={`url(#${skin})`} height="15" rx="5" width="18" x="71" y="70" />
      <path d={`M${shoulder} 78h${torsoWidth}l7 51H${shoulder - 7}z`} fill={`url(#${shirtFill})`} stroke="#0f172a" strokeOpacity=".24" strokeLinejoin="round" strokeWidth="2" />
      <path d={`M${shoulder + torsoWidth} 78l7 9 0 42-7-4z`} fill="#000" opacity=".16" />
      <path d={`M${shoulder + 7} 84h${torsoWidth - 19}`} stroke="white" strokeLinecap="round" strokeOpacity=".25" strokeWidth="3" />
      <g>
        <path d={`M${shoulder + 3} 83L22 91l-8 34 20 5 13-34z`} fill={`url(#${shirtFill})`} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <circle cx="25" cy="98" fill="white" opacity=".14" r="6" />
        <rect fill={`url(#${skin})`} height="24" rx="8" transform="rotate(13 24 125)" width="19" x="15" y="113" />
        <ellipse cx="22" cy="139" fill={`url(#${skin})`} rx="14" ry="13" stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" transform="rotate(12 22 139)" />
        <path d="M12 136q-2 10 7 14M18 133q9-8 17 0M18 145q7 5 14-1" fill="none" stroke="#2d160f" strokeLinecap="round" strokeOpacity=".28" strokeWidth="2.3" />
        <ellipse cx="17" cy="134" fill="white" opacity=".24" rx="4" ry="2" transform="rotate(12 17 134)" />
      </g>
      <g>
        <path d={`M${shoulder + torsoWidth - 3} 83l17 8 8 34-20 5-13-34z`} fill={`url(#${shirtFill})`} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
        <circle cx="135" cy="98" fill="white" opacity=".12" r="6" />
        <rect fill={`url(#${skin})`} height="24" rx="8" transform="rotate(-13 136 125)" width="19" x="126" y="113" />
        <ellipse cx="138" cy="139" fill={`url(#${skin})`} rx="14" ry="13" stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" transform="rotate(-12 138 139)" />
        <path d="M148 136q2 10-7 14M142 133q-9-8-17 0M142 145q-7 5-14-1" fill="none" stroke="#2d160f" strokeLinecap="round" strokeOpacity=".28" strokeWidth="2.3" />
        <ellipse cx="143" cy="134" fill="white" opacity=".24" rx="4" ry="2" transform="rotate(-12 143 134)" />
      </g>
      <ShirtMark style={avatar.shirtStyle} premiumBrand={shirt?.brand} />
      {watch ? <g><rect fill={watch.colour} height="13" rx="4" transform="rotate(-12 132 126)" width="22" x="121" y="120" /><rect fill="#dbeafe" height="9" rx="2" transform="rotate(-12 132 126)" width="12" x="126" y="122" /><BrandMark brand={watch.brand} scale=".16" x="128" y="123" /></g> : null}

      {/* interchangeable toy head */}
      <HeadShape fill={`url(#${skin})`} style={avatar.headStyle} />
      <path d="M108 27q7 17 0 42" fill="none" stroke="#000" strokeLinecap="round" strokeOpacity=".13" strokeWidth="6" />
      <path d="M52 27q8-7 18-7" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".32" strokeWidth="5" />
      <Hair style={avatar.hairStyle} color={avatar.hairColor} />
      {cap ? <Cap brand={cap.brand} colour={cap.colour} /> : null}
      <path d="M57 42q7-4 14 0M89 42q7-4 14 0" fill="none" stroke="#422006" strokeLinecap="round" strokeOpacity=".55" strokeWidth="2" />
      <ellipse cx="64" cy="51" fill="white" rx="7" ry="6" /><ellipse cx="96" cy="51" fill="white" rx="7" ry="6" /><circle cx="64" cy="52" fill={avatar.eyeColor} r="3.5" /><circle cx="96" cy="52" fill={avatar.eyeColor} r="3.5" /><circle cx="63" cy="50" fill="white" r="1" /><circle cx="95" cy="50" fill="white" r="1" />
      <path d="M78 53l-2 7 5 1" fill="none" stroke="#000" strokeLinecap="round" strokeOpacity=".16" strokeWidth="2" />
      {glasses ? <g><path d="M49 38h62l-5 26H87l-7-9-7 9H54z" fill={glasses.colour} opacity=".92" /><path d="M55 43h21l-5 14H57zm29 0h21l-3 14H89z" fill="#67e8f9" opacity=".8" /><path d="M58 44h11" stroke="white" strokeLinecap="round" strokeOpacity=".8" strokeWidth="3" /><BrandMark brand={glasses.brand} scale=".2" x="72" y="38" /></g> : null}
      {!glasses ? <path d="M67 66q13 10 26 0" fill="none" stroke="#5c2e24" strokeLinecap="round" strokeWidth="3" /> : null}
    </g>
    </g>
  </svg>;
}

export function PremiumAssetPreview({ asset, className = "h-36 w-full" }: { asset: AvatarAsset; className?: string }) {
  const common = { fill: asset.colour, stroke: "#0f172a", strokeOpacity: .22, strokeWidth: 2 };
  return <svg aria-label={`${asset.name} product preview`} className={cn(className)} role="img" viewBox="0 0 160 120">
    <defs><filter id={`asset-${asset.id}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="1" dy="5" floodColor="#172554" floodOpacity=".22" stdDeviation="3" /></filter></defs>
    <ellipse cx="80" cy="105" fill="#312e81" opacity=".12" rx="48" ry="7" />
    <g filter={`url(#asset-${asset.id})`}>
      {asset.category === "shirt" ? <g><path d="M51 23 66 12h28l15 11 24 13-13 25-14-7v48H54V54l-14 7-13-25z" {...common} /><path d="M66 13q14 18 28 0" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="5" /><path d="M61 31h38M61 88h38" stroke="white" strokeOpacity=".18" strokeWidth="3" /><BrandMark brand={asset.brand} scale="1.05" x="60" y="48" /></g> : null}
      {asset.category === "bottoms" ? <g><path d="M42 18h76l-5 75H87l-7-39-7 39H47z" {...common} /><path d="M48 27h64M80 20v35" stroke="white" strokeOpacity=".28" strokeWidth="4" /><path d="M48 83h24M88 83h24" stroke="#000" strokeOpacity=".18" strokeWidth="3" /><BrandMark brand={asset.brand} scale=".72" x="48" y="36" /></g> : null}
      {asset.category === "shoes" ? <g><path d="M17 63q22-15 48 1l7 17q2 16-9 18H20q-13-3-3-36z" {...common} /><path d="M88 64q27-16 48 2 10 33-3 36H91q-11-2-8-19z" {...common} /><path d="M26 72h29M96 73h29" stroke="white" strokeLinecap="round" strokeOpacity=".7" strokeWidth="5" /><path d="M18 91h50M87 94h50" stroke="white" strokeOpacity=".65" strokeWidth="6" /><BrandMark brand={asset.brand} scale=".48" x="30" y="76" /><BrandMark brand={asset.brand} scale=".48" x="101" y="77" /></g> : null}
      {asset.category === "glasses" ? <g><path d="M19 41h122l-10 49H93L80 73 67 90H29z" {...common} /><path d="M30 50h40l-9 29H35zm60 0h40l-6 29H99z" fill="#67e8f9" opacity=".78" /><path d="M37 55h22" stroke="white" strokeLinecap="round" strokeOpacity=".85" strokeWidth="6" /><BrandMark brand={asset.brand} scale=".58" x="67" y="43" /></g> : null}
      {asset.category === "watch" ? <g><path d="M66 5h28l5 31-5 68H66l-5-68z" {...common} /><rect fill="#dbeafe" height="50" rx="12" stroke="#0f172a" strokeOpacity=".25" strokeWidth="3" width="58" x="51" y="34" /><circle cx="80" cy="59" fill="#0f172a" opacity=".1" r="18" /><BrandMark brand={asset.brand} scale=".8" x="64" y="48" /></g> : null}
      {asset.category === "skateboard" ? <g transform="rotate(-4 80 62)"><path d="M13 48q8-14 22-8h90q14-6 22 8v29q-8 14-22 8H35q-14 6-22-8z" {...common} /><BrandMark brand={asset.brand} scale="1.2" x="57" y="49" /><circle cx="36" cy="94" fill="#1e293b" r="9" /><circle cx="124" cy="94" fill="#1e293b" r="9" /><circle cx="36" cy="94" fill="#94a3b8" r="3" /><circle cx="124" cy="94" fill="#94a3b8" r="3" /></g> : null}
      {asset.category === "bag" ? <g><path d="M54 31q3-23 26-23t26 23" fill="none" stroke={asset.colour} strokeWidth="12" /><rect height="79" rx="18" width="88" x="36" y="27" {...common} /><rect fill="#000" fillOpacity=".16" height="35" rx="10" width="68" x="46" y="61" /><path d="M47 43h66" stroke="white" strokeOpacity=".28" strokeWidth="4" /><BrandMark brand={asset.brand} scale="1" x="60" y="65" /></g> : null}
      {asset.category === "cap" ? <g><path d="M34 61q7-43 48-43 39 0 46 43l-9 24H43z" {...common} /><path d="M81 19v65M48 58q29-28 64 0" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="3" /><path d="M107 69h45q-8 18-30 20l-23-2z" {...common} /><path d="M112 73h32" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="4" /><circle cx="81" cy="17" fill={asset.colour} r="6" stroke="#0f172a" strokeOpacity=".22" strokeWidth="2" /><path d="M48 47q18-25 31-26" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="5" /><BrandMark brand={asset.brand} scale="1" x="61" y="48" /></g> : null}
    </g>
  </svg>;
}

function HeadShape({ style, fill }: { style: AvatarConfig["headStyle"]; fill: string }) {
  const shared = { fill, stroke: "#0f172a", strokeOpacity: .2, strokeWidth: 2 };
  if (style === "round") return <g><ellipse cx="80" cy="48" rx="36" ry="34" {...shared} /><ellipse cx="80" cy="20" fill="white" opacity=".16" rx="23" ry="5" /></g>;
  if (style === "oval") return <g><ellipse cx="80" cy="48" rx="30" ry="38" {...shared} /><ellipse cx="80" cy="15" fill="white" opacity=".16" rx="18" ry="4" /></g>;
  if (style === "wide") return <g><rect height="60" rx="19" width="82" x="39" y="19" {...shared} /><ellipse cx="80" cy="21" fill="white" opacity=".15" rx="31" ry="5" /></g>;
  return <g><rect height="64" rx="14" width="72" x="44" y="16" {...shared} /><ellipse cx="80" cy="18" fill="white" opacity=".15" rx="28" ry="6" /></g>;
}

function Cap({ brand, colour }: { brand: AvatarAsset["brand"]; colour: string }) {
  return <g>
    <path d="M42 34q5-30 38-30t39 30l-7 13H48z" fill={colour} stroke="#0f172a" strokeOpacity=".28" strokeWidth="2" />
    <path d="M80 5v39M49 34q15-25 30-28M111 34Q97 9 82 6" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="2" />
    <path d="M101 39h37q-8 12-23 14l-20-5z" fill={colour} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" />
    <path d="M105 42h27" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="3" />
    <circle cx="80" cy="5" fill={colour} r="4" stroke="#0f172a" strokeOpacity=".25" />
    <path d="M50 27q10-17 22-19" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".3" strokeWidth="4" />
    <BrandMark brand={brand} scale=".46" x="70" y="23" />
  </g>;
}

function Hair({ style, color }: { style: AvatarConfig["hairStyle"]; color: string }) {
  if (style === "bald") return null;
  if (style === "short") return <g><path d="M43 42V27q5-20 27-19l9-8 5 8q26-1 34 21l-8 13-7-16-9 10-9-14-12 14-9-11-12 15z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" /><path d="M52 23q17-15 38-10M58 31l10-11m10 10 9-15m6 17 8-11" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".16" strokeWidth="3" /></g>;
  if (style === "afro") return <g stroke="#0f172a" strokeOpacity=".17">{[[48,25,16],[59,13,16],[76,10,17],[94,14,16],[108,26,16],[43,39,15],[115,40,15],[59,34,17],[79,29,18],[99,35,17]].map(([x,y,r], i) => <circle cx={x} cy={y} fill={color} key={i} r={r} />)}<path d="M51 16q14-12 28-9M92 18q9 2 15 10" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".18" strokeWidth="4" /></g>;
  if (style === "mohawk") return <g><path d="M60 27Q61 2 70 8 75-7 82 7 90-5 99 28L90 20l-9 10-8-10-6 11z" fill={color} stroke="#0f172a" strokeOpacity=".24" strokeWidth="2" /><path d="M72 12q6-8 11 4" fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".2" strokeWidth="3" /></g>;
  if (style === "braids") return <g><path d="M46 27q6-17 34-18 27 1 35 20" fill={color} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" /><g fill="none" stroke={color} strokeLinecap="round" strokeWidth="9"><path d="M48 24q-10 27-4 62" /><path d="M62 15q-8 35-3 73" /><path d="M78 12q-4 38 0 77" /><path d="M95 16q10 35 5 72" /><path d="M110 27q11 28 5 58" /></g><g fill="none" stroke="white" strokeOpacity=".15" strokeWidth="2"><path d="M41 48l10 5m-11 9 11 5M56 42l11 5m-12 10 11 5m28-18 11 5m-10 10 11 5" /></g></g>;
  return <g><path d="M44 28q8-19 36-19 27 0 36 20" fill={color} stroke="#0f172a" strokeOpacity=".2" strokeWidth="2" /><g fill="none" stroke={color} strokeLinecap="round" strokeWidth="10"><path d="M49 20q-14 35-5 67" /><path d="M66 13q-12 39-6 76" /><path d="M84 13q12 39 6 76" /><path d="M102 21q15 35 7 65" /></g><g fill="none" stroke="white" strokeLinecap="round" strokeOpacity=".14" strokeWidth="2"><path d="M45 42q8 4 1 10m13-18q10 5 2 11m28-10q10 5 2 11m15-5q9 5 2 11" /></g></g>;
}

function ShirtMark({ style, premiumBrand }: { style: AvatarConfig["shirtStyle"]; premiumBrand?: string }) {
  if (style === "plain" && !premiumBrand) return null;
  if (premiumBrand) return <g><rect fill="white" fillOpacity=".94" height="32" rx="8" width="45" x="58" y="91" /><BrandMark brand={premiumBrand as AvatarAsset["brand"]} scale=".72" x="66" y="98" /></g>;
  const text = premiumBrand?.slice(0, 2).toUpperCase() ?? (style === "skulkid" ? "SK" : style === "math" ? "M" : style === "science" ? "SCI" : "AB");
  return <g><rect fill="white" fillOpacity=".92" height="32" rx="8" width="39" x="61" y="91" /><text fill="#172554" fontFamily="sans-serif" fontSize="15" fontWeight="900" textAnchor="middle" x="80" y="112">{text}</text></g>;
}

function BrandMark({ brand, x, y, scale = "1" }: { brand: AvatarAsset["brand"]; x: string; y: string; scale?: string }) {
  const transform = `translate(${x} ${y}) scale(${scale})`;
  if (brand === "Nike") return <g aria-label="Nike logo" fill="white" transform={transform}><path d="M1 13c7 5 13 5 20 1L39 3 23 10C14 14 8 15 1 13Z" /></g>;
  if (brand === "Adidas") return <g aria-label="Adidas logo" fill="white" transform={transform}><path d="m2 14 7-4 6 10H9zm10-7 7-4 10 17h-7zm12-5 7-2 12 20h-7z" /><text fontFamily="Arial, sans-serif" fontSize="7" fontWeight="900" x="8" y="27">adidas</text></g>;
  return <g aria-label="Puma logo" fill="white" transform={transform}><text fontFamily="Arial Black, Arial, sans-serif" fontSize="10" fontWeight="900" letterSpacing="-.5" x="0" y="16">PUMA</text><path d="M28 5c4-4 8-3 10 0l5 1-4 3-2 6-4-1-2-5-5 1z" /></g>;
}
