"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookHeart,
  CalendarDays,
  Check,
  CircleAlert,
  CircleOff,
  Coins,
  Flame,
  GraduationCap,
  Heart,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  Save,
  School,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  Zap
} from "lucide-react";
import { CharacterAvatar, PremiumAssetPreview } from "@/components/student/character-avatar";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { avatarShopAssets, type AvatarAsset } from "@/lib/student/avatar-shop";
import { useStudentGame } from "@/lib/gamification/student-game";
import { defaultAvatar, useStudentProfile, type AvatarConfig, type StudentProfileData } from "@/lib/student/student-profile";
import { isButtonSoundEnabled, setButtonSoundEnabled } from "@/lib/student/ui-sounds";

export function ProfilePage() {
  const { profile, save } = useStudentProfile();
  const { state, achievements, redeemAvatarAsset } = useStudentGame();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"avatar" | "about" | "settings">("avatar");
  const [classChatSound, setClassChatSound] = useState(true);
  const [buttonSound, setButtonSound] = useState(true);
  const [studioTab, setStudioTab] = useState<"body" | "head" | "hair" | "face" | "shirt" | "bottoms" | "shoes">("body");
  const [shopCategory, setShopCategory] = useState<AvatarAsset["category"]>("shirt");
  const level = getStudentLevel(state.xp);
  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(profile), [form, profile]);
  const profileCompletion = useMemo(() => {
    const checks = [
      form.displayName.trim().length >= 2,
      form.age >= 5 && form.age <= 18,
      /^Basic [1-6]$/.test(form.grade),
      form.school.trim().length >= 2,
      form.bio.trim().length >= 10,
      form.favouriteSubject.trim().length >= 2
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);
  const earnedAchievements = achievements.filter((achievement) => achievement.earned).length;
  useEffect(() => setForm(profile), [profile]);
  useEffect(() => {
    setClassChatSound(window.localStorage.getItem("skulkid:class-chat-sound") !== "off");
    setButtonSound(isButtonSoundEnabled());
  }, []);

  function updateClassChatSound(enabled: boolean) {
    setClassChatSound(enabled);
    window.localStorage.setItem("skulkid:class-chat-sound", enabled ? "on" : "off");
    window.dispatchEvent(new CustomEvent("skulkid:class-chat-sound-change", { detail: { enabled } }));
  }

  function updateButtonSound(enabled: boolean) {
    setButtonSound(enabled);
    setButtonSoundEnabled(enabled);
  }

  const update = <K extends keyof StudentProfileData>(field: K, value: StudentProfileData[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError("");
  };
  const updateGender = (gender: StudentProfileData["gender"]) => {
    setForm((current) => {
      const switchingToGirl = gender === "female" && current.gender !== "female";
      const useGirlStarterHair = switchingToGirl
        && (current.avatar.hairStyle === defaultAvatar.hairStyle || current.avatar.hairStyle === "mohawk");
      return {
        ...current,
        gender,
        avatarUrl: null,
        avatar: {
          ...current.avatar,
          gender,
          hairStyle: useGirlStarterHair ? "ponytail" : current.avatar.hairStyle
        }
      };
    });
    setSaved(false);
    setSaveError("");
  };
  const updateAvatar = <K extends keyof AvatarConfig>(field: K, value: AvatarConfig[K]) => {
    setForm((current) => ({ ...current, avatarUrl: null, avatar: { ...current.avatar, [field]: value } }));
    setSaved(false);
    setSaveError("");
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await save({ ...form, displayName: form.displayName.trim(), school: form.school.trim(), bio: form.bio.trim() });
      setSaved(true);
    } catch {
      setSaveError("We could not save your changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }
  function persistAvatar(next: StudentProfileData) {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    void save(next)
      .then(() => setSaved(true))
      .catch(() => setSaveError("Your avatar change could not be saved. Please try again."))
      .finally(() => setSaving(false));
  }
  function equip(asset: AvatarAsset) {
    const next = {
      ...form,
      avatarUrl: null,
      avatar: {
        ...form.avatar,
        pantsStyle: asset.category === "bottoms" ? "shorts" as const : form.avatar.pantsStyle,
        equippedPremium: { ...form.avatar.equippedPremium, [asset.category]: asset.id }
      }
    };
    setForm(next);
    persistAvatar(next);
  }
  function unequip(category: AvatarAsset["category"]) {
    const equippedPremium = { ...form.avatar.equippedPremium };
    delete equippedPremium[category];
    const next = {
      ...form,
      avatarUrl: null,
      avatar: { ...form.avatar, equippedPremium }
    };
    setForm(next);
    persistAvatar(next);
  }
  function redeem(asset: AvatarAsset) { const result = redeemAvatarAsset(asset.id, asset.cost); if (result.redeemed) equip(asset); }

  return <StudentShell activeItem="profile"><main className="mx-auto grid w-full min-w-0 max-w-7xl gap-5 lg:gap-6">
    <header className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-4"><Avatar profile={form} size="large" /><div className="min-w-0 flex-1"><p className="text-sm font-bold uppercase tracking-normal text-muted">{activeTab === "about" ? "About me" : "My avatar"}</p><h1 className="truncate text-3xl font-bold text-text-primary sm:text-4xl">{activeTab === "avatar" ? `@${form.username}` : form.displayName}</h1><p className="mt-1 text-sm text-text-secondary sm:text-base">{form.grade} · {level.title}</p></div></div><div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap lg:justify-center"><Pill icon={Trophy} text={`Level ${level.level}`} /><Pill icon={Zap} text={`${state.xp} XP`} /><Pill icon={Flame} text={`${state.streak} day streak`} /></div><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white shadow-sm sm:w-auto" onClick={() => setActiveTab("avatar")} type="button"><Palette className="size-5" />{activeTab === "about" ? "Open Avatar Studio" : "Customise avatar"}</button></div></header>
    <StudentPageNav
      backHref="/dashboard"
      backLabel="Back to dashboard"
      crumbs={[
        { label: "Home", href: "/dashboard" },
        { label: activeTab === "about" ? "About Me" : "My Avatar" }
      ]}
    />

    <nav aria-label="Profile sections" className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><button aria-current={activeTab === "avatar" ? "page" : undefined} className={`inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-xs font-black sm:gap-2 sm:text-base ${activeTab === "avatar" ? "bg-violet-700 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setActiveTab("avatar")} type="button"><Palette className="size-5" /><span className="hidden min-[420px]:inline">Avatar Studio</span><span className="min-[420px]:hidden">Avatar</span></button><button aria-current={activeTab === "about" ? "page" : undefined} className={`inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-xs font-black sm:gap-2 sm:text-base ${activeTab === "about" ? "bg-violet-700 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setActiveTab("about")} type="button"><UserRound className="size-5" />About Me</button><button aria-current={activeTab === "settings" ? "page" : undefined} className={`inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-xs font-black sm:gap-2 sm:text-base ${activeTab === "settings" ? "bg-violet-700 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setActiveTab("settings")} type="button"><Settings2 className="size-5" />Settings</button></nav>
    <form className="grid min-w-0 gap-5 lg:gap-6" onSubmit={submit}>
        {activeTab === "avatar" ? <>
        <section className="min-w-0 rounded-[2rem] border border-violet-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6" id="avatar-studio">
          <SectionTitle icon={Palette} title="Avatar studio" description="Start with your face and hair, then create a style that feels like you." />
          <nav aria-label="Avatar customisation categories" className="mt-4 flex w-full min-w-0 snap-x gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-2 sm:mt-5">
            {([["body","Body"],["head","Head"],["hair","Hair"],["face","Face"],["shirt","Shirt"],["bottoms","Pants"],["shoes","Shoes"]] as const).map(([id, label]) => <button aria-current={studioTab === id ? "page" : undefined} className={`min-h-11 shrink-0 snap-start rounded-xl px-4 text-sm font-black transition ${studioTab === id ? "bg-violet-700 text-white shadow-md" : "bg-white text-slate-600 hover:text-violet-700"}`} key={id} onClick={() => setStudioTab(id)} type="button">{label}</button>)}
          </nav>
          <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)] sm:mt-6 sm:gap-6">
            <div className="grid place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 p-3 sm:rounded-3xl sm:p-5"><CharacterAvatar avatar={form.avatar} className="h-auto w-full max-w-44 rounded-2xl sm:max-w-52 sm:rounded-3xl" interactive label={`${form.username}'s custom avatar`} motion="expressive" /><p className="mt-2 text-center text-xs font-bold text-violet-800 sm:mt-3">Tap your avatar to wave</p></div>
            <div className="min-h-40 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-h-44 sm:rounded-3xl sm:p-5">
              {studioTab === "body" ? <div className="grid gap-5"><ChoiceGroup label="Character" options={[["male","Boy"],["female","Girl"]]} value={form.gender} onChange={(value) => updateGender(value as StudentProfileData["gender"])} /><ChoiceGroup label="Body style" options={[["slim","Slim"],["classic","Classic"],["strong","Strong"]]} value={form.avatar.bodyStyle} onChange={(value) => updateAvatar("bodyStyle", value as AvatarConfig["bodyStyle"])} /><ColorGroup label="Skin colour" colors={["#F6D0B1","#E5A77B","#C68642","#A66A3F","#8D5524","#6B3E26","#4A2A1B"]} value={form.avatar.skinColor} onChange={(value) => updateAvatar("skinColor", value)} /></div> : null}
              {studioTab === "head" ? <ChoiceGroup label="Face shape" options={[["block","Soft square"],["round","Round"],["oval","Oval"],["wide","Wide"]]} value={form.avatar.headStyle} onChange={(value) => updateAvatar("headStyle", value as AvatarConfig["headStyle"])} /> : null}
              {studioTab === "hair" ? <div className="grid gap-5"><ChoiceGroup label="Hair style" options={[["short","Short"],["afro","Afro"],["braids","Braids"],["locs","Locs"],["long","Long"],["ponytail","Ponytail"],["mohawk","Mohawk"],["bald","Bald"]]} value={form.avatar.hairStyle} onChange={(value) => updateAvatar("hairStyle", value as AvatarConfig["hairStyle"])} /><ColorGroup label="Hair colour" colors={["#21140F","#4A2A1B","#7A4A25","#D4A017","#8B1E3F","#312E81"]} value={form.avatar.hairColor} onChange={(value) => updateAvatar("hairColor", value)} /></div> : null}
              {studioTab === "face" ? <div className="grid gap-5"><ChoiceGroup label="Expression" options={[["classic","Classic"],["happy","Happy"],["smirk","Smirk"],["surprised","Surprised"],["wink","Wink"],["cool","Cool"],["sleepy","Sleepy"],["silly","Silly"]]} value={form.avatar.expression ?? "classic"} onChange={(value) => updateAvatar("expression", value as AvatarConfig["expression"])} /><ChoiceGroup label="Eyebrows" options={[["soft","Soft"],["straight","Straight"],["arched","Arched"],["bold","Bold"]]} value={form.avatar.eyebrowStyle ?? "soft"} onChange={(value) => updateAvatar("eyebrowStyle", value as NonNullable<AvatarConfig["eyebrowStyle"]>)} /><ChoiceGroup label="Nose" options={[["button","Button"],["soft","Soft"],["wide","Wide"],["defined","Defined"]]} value={form.avatar.noseStyle ?? "button"} onChange={(value) => updateAvatar("noseStyle", value as NonNullable<AvatarConfig["noseStyle"]>)} /><ColorGroup label="Eye colour" colors={["#3B2414","#6B4F2A","#2563EB","#15803D","#64748B","#111827"]} value={form.avatar.eyeColor} onChange={(value) => updateAvatar("eyeColor", value)} /></div> : null}
              {studioTab === "shirt" ? <div className="grid gap-5"><ChoiceGroup label="Shirt design" options={[["skulkid","SkulKid"],["math","Math Club"],["science","Science Lab"],["reader","Book Club"],["plain","Plain"]]} value={form.avatar.shirtStyle} onChange={(value) => updateAvatar("shirtStyle", value as AvatarConfig["shirtStyle"])} /><ColorGroup label="Shirt colour" colors={["#2563EB","#7C3AED","#16A34A","#DC2626","#F59E0B","#0F172A"]} value={form.avatar.shirtColor} onChange={(value) => updateAvatar("shirtColor", value)} /></div> : null}
              {studioTab === "bottoms" ? <div className="grid gap-5"><ChoiceGroup label="Pants style" options={[["trousers","Trousers"],["shorts","Shorts"],["skirt","Skirt"]]} value={form.avatar.pantsStyle} onChange={(value) => updateAvatar("pantsStyle", value as AvatarConfig["pantsStyle"])} /><ColorGroup label="Pants colour" colors={["#172554","#312E81","#14532D","#3F3F46","#7C2D12","#111827"]} value={form.avatar.pantsColor} onChange={(value) => updateAvatar("pantsColor", value)} /></div> : null}
              {studioTab === "shoes" ? <ColorGroup label="Shoe colour" colors={["#FFFFFF","#111827","#DC2626","#2563EB","#F59E0B"]} value={form.avatar.shoeColor} onChange={(value) => updateAvatar("shoeColor", value)} /> : null}
            </div>
          </div>
        </section>
        <section className="min-w-0 rounded-[2rem] border border-amber-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><SectionTitle icon={ShoppingBag} title="Premium avatar shop" description="Choose a category, preview the gear and redeem your favourite." /><div className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-950"><Coins className="size-5" />{state.avatarPoints} points</div></div>
          <nav aria-label="Premium shop categories" className="mt-4 flex w-full min-w-0 snap-x gap-2 overflow-x-auto rounded-2xl bg-amber-50 p-2 sm:mt-5">
            {([["shirt","Shirts"],["bottoms","Pants"],["shoes","Sneakers"],["cap","Caps"],["glasses","Glasses"],["watch","Watches"],["skateboard","Boards"]] as const).map(([category, label]) => <button aria-current={shopCategory === category ? "page" : undefined} className={`min-h-11 shrink-0 snap-start rounded-xl px-4 text-sm font-black transition ${shopCategory === category ? "bg-amber-500 text-slate-950 shadow-md" : "bg-white text-slate-600 hover:text-amber-800"}`} key={category} onClick={() => setShopCategory(category)} type="button">{label}</button>)}
          </nav>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {avatarShopAssets.filter((asset) => asset.category === shopCategory).map((asset) => {
              const equipped = form.avatar.equippedPremium[asset.category] === asset.id;
              const unlocked = equipped || state.unlockedAvatarAssetIds.includes(asset.id);
              const affordable = state.avatarPoints >= asset.cost;
              return (
                <article
                  className={`overflow-hidden rounded-2xl border-2 ${equipped ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_30px_rgba(16,185,129,.12)]" : unlocked ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                  key={asset.id}
                >
                  <div className="relative grid h-48 place-items-center bg-gradient-to-br from-cyan-100 via-white to-violet-100 p-3">
                    <PremiumAssetPreview asset={asset} className="h-40 w-full" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black capitalize text-slate-700 shadow-sm">
                      {asset.category === "bottoms" ? "pants" : asset.category}
                    </span>
                    {equipped ? (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                        <Check className="size-3.5" />
                        Wearing
                      </span>
                    ) : null}
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                      <span aria-hidden="true" className="size-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: asset.colour }} />
                      {asset.brand}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black">{asset.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-800">
                      <Coins className="size-4" />
                      {asset.cost} points
                    </p>
                    {unlocked ? (
                      equipped ? (
                        <button
                          aria-label={`Remove ${asset.name} from your avatar`}
                          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-white font-black text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                          onClick={() => unequip(asset.category)}
                          type="button"
                        >
                          <CircleOff className="size-4" />
                          Remove from avatar
                        </button>
                      ) : (
                        <button
                          className="mt-4 min-h-11 w-full rounded-xl bg-blue-700 font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          onClick={() => equip(asset)}
                          type="button"
                        >
                          Equip
                        </button>
                      )
                    ) : (
                      <button
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!affordable}
                        onClick={() => redeem(asset)}
                        type="button"
                      >
                        <Lock className="size-4" />
                        {affordable ? "Redeem" : `Need ${asset.cost - state.avatarPoints} more`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Removing an item keeps it in your collection, so you can equip it again anytime. Adidas, Nike, Puma and their marks are trademarks of their respective owners. SkulKid is not affiliated with or endorsed by these brands.
          </p>
        </section>
        </> : null}
        {activeTab === "about" ? <>
        <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-5 text-white shadow-[var(--shadow-card)] sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="size-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white/80 bg-white/15 shadow-xl sm:size-28">
                <CharacterAvatar avatar={form.avatar} className="size-full rounded-2xl" label={`${form.username}'s avatar`} motion="idle" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[.18em] text-violet-200">My learner card</p>
                <h2 className="mt-1 truncate text-2xl font-black sm:text-3xl">@{form.username}</h2>
                <p className="mt-1 text-sm font-bold text-blue-100">{form.grade} · {form.age} years old</p>
                <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-black ring-1 ring-white/25 transition hover:bg-white/25" onClick={() => setActiveTab("avatar")} type="button"><Palette className="size-4" />Edit my avatar</button>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
              <div className="flex items-center justify-between gap-3"><span className="font-black">Profile power</span><span className="rounded-full bg-white px-2.5 py-1 text-sm font-black text-violet-800">{profileCompletion}%</span></div>
              <div aria-label={`Profile ${profileCompletion}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={profileCompletion} className="mt-3 h-3 overflow-hidden rounded-full bg-slate-950/25" role="progressbar"><span className="block h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-[width] motion-reduce:transition-none" style={{ width: `${profileCompletion}%` }} /></div>
              <p className="mt-2 text-xs leading-5 text-blue-100">{profileCompletion === 100 ? "Brilliant—your learner card is complete!" : "Add your school and learning story to complete your card."}</p>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.65fr)] lg:items-start lg:gap-6">
          <div className="grid min-w-0 gap-5 lg:gap-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <SectionTitle icon={UserRound} title="My details" description="Tell SkulKid what you would like to be called and where you learn." />
              <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Field label="My name"><input autoComplete="name" maxLength={50} minLength={2} placeholder="What should we call you?" required value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /><span className="mt-1 block text-right text-xs font-bold text-muted">{form.displayName.length}/50</span></Field>
                <Field label="My school"><div className="relative"><School className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input autoComplete="organization" className="!pl-12" maxLength={80} placeholder="Enter your school" value={form.school} onChange={(event) => update("school", event.target.value)} /></div></Field>
                <Field label="My age"><input max={18} min={5} required type="number" value={form.age} onChange={(event) => update("age", Number(event.target.value))} /></Field>
                <Field label="My Primary level"><select value={form.grade} onChange={(event) => update("grade", event.target.value)}>{[1, 2, 3, 4, 5, 6].map((grade) => <option key={grade}>Basic {grade}</option>)}</select></Field>
                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-black text-text-secondary">I am a</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">{([["male", "Boy"], ["female", "Girl"]] as const).map(([value, label]) => <button aria-pressed={form.gender === value} className={`min-h-12 rounded-xl border-2 px-4 font-black transition motion-reduce:transition-none ${form.gender === value ? "border-violet-600 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"}`} key={value} onClick={() => updateGender(value)} type="button">{label}</button>)}</div>
                  <p className="mt-2 text-xs leading-5 text-muted">This also helps us prepare a matching starter style for your avatar.</p>
                </fieldset>
              </div>
            </section>

            <section className="rounded-[2rem] border border-rose-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <SectionTitle icon={Heart} title="My learning story" description="Write a short message about what makes learning exciting for you." />
              <div className="mt-5">
                <label className="text-sm font-black text-text-secondary" htmlFor="student-learning-bio">About me</label>
                <textarea className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-300 p-4 leading-6 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" id="student-learning-bio" maxLength={180} placeholder="I enjoy learning because..." rows={4} value={form.bio} onChange={(event) => update("bio", event.target.value)} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2" aria-label="Learning story starters">{["I love discovering new things!", "I want to become a great reader.", "Solving problems makes me proud!"].map((prompt) => <button className="min-h-9 rounded-full border border-rose-200 bg-rose-50 px-3 text-left text-xs font-bold text-rose-800 hover:bg-rose-100" key={prompt} onClick={() => update("bio", prompt)} type="button">{prompt}</button>)}</div>
                  <span className={`ml-auto text-xs font-black ${form.bio.length > 160 ? "text-amber-700" : "text-muted"}`}>{form.bio.length}/180</span>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-blue-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <SectionTitle icon={BookHeart} title="How I like to learn" description="Choose a favourite subject and a daily goal that feels right for you." />
              <fieldset className="mt-5">
                <legend className="text-sm font-black text-text-secondary">My favourite subject</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([["Mathematics", "Maths"], ["English", "English"], ["Science", "Science"], ["Computing", "Computing"], ["Creative Arts", "Creative Arts"], ["RME", "RME"], ["OWOP", "OWOP"], ["French", "French"]] as const).map(([value, label]) => <button aria-pressed={form.favouriteSubject === value} className={`min-h-12 rounded-xl border-2 px-2 text-sm font-black transition motion-reduce:transition-none ${form.favouriteSubject === value ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"}`} key={value} onClick={() => update("favouriteSubject", value)} type="button">{label}</button>)}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="text-sm font-black text-text-secondary">My daily XP goal</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {([[30, "Easy start", "A little each day"], [60, "Keep growing", "A steady challenge"], [100, "Big mission", "Ready to go far"]] as const).map(([value, title, detail]) => (
                    <button aria-pressed={form.dailyGoalXp === value} className={`min-h-20 rounded-2xl border-2 p-3 text-left transition motion-reduce:transition-none ${form.dailyGoalXp === value ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"}`} key={value} onClick={() => update("dailyGoalXp", value)} type="button">
                      <span className="block font-black">{value} XP · {title}</span>
                      <span className="mt-1 block text-xs font-medium opacity-80">{detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-24">
            <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[var(--shadow-card)]">
              <SectionTitle icon={Sparkles} title="My learner card" description="This is how your profile is coming together." />
              <div className="mt-5 rounded-2xl border border-white bg-white/80 p-4 text-center shadow-sm">
                <div className="mx-auto size-24 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-100 to-violet-100"><CharacterAvatar avatar={form.avatar} className="size-full rounded-2xl" label={`${form.username}'s avatar preview`} /></div>
                <h3 className="mt-3 truncate text-xl font-black text-slate-950">@{form.username}</h3>
                <p className="mt-1 text-sm font-bold text-violet-700">{form.grade} learner</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{form.bio.trim() || "Add your learning story to make this card yours."}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                  <MiniDetail icon={School} label="School" value={form.school.trim() || "Not added"} />
                  <MiniDetail icon={BookHeart} label="Favourite" value={subjectLabel(form.favouriteSubject)} />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <SectionTitle icon={Award} title="My journey" description="A quick look at how far you have come." />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <JourneyStat icon={GraduationCap} label="Lessons done" value={state.completedLessonIds.length} tone="blue" />
                <JourneyStat icon={Trophy} label="Achievements" value={earnedAchievements} tone="amber" />
                <JourneyStat icon={Zap} label="Total XP" value={state.xp} tone="violet" />
                <JourneyStat icon={Flame} label="Day streak" value={state.streak} tone="rose" />
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <div><p className="text-xs font-black uppercase tracking-wide text-slate-500">Adventure started</p><p className="mt-1 text-sm font-bold text-slate-800">{formatJoinedDate(form.joinedAt)}</p></div>
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <div className="flex items-start gap-3"><Lock className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div><h3 className="font-black">Your private details stay private</h3><p className="mt-1 leading-5 text-emerald-900">This page never shows your phone number or password. Ask a trusted adult if you need help changing account details.</p></div></div>
            </section>
          </aside>
        </div>

        </> : null}
        {activeTab === "settings" ? (
          <section className="overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-[var(--shadow-card)]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white sm:p-7">
              <Settings2 className="size-7 text-blue-100" />
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Student settings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Choose how SkulKid behaves on this device.</p>
            </div>
            <div className="grid gap-4 p-5 sm:p-7">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${buttonSound ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-600"}`}>
                    {buttonSound ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
                  </span>
                  <div>
                    <h3 className="font-black text-slate-950">Button tap sounds</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Play a quick confirmation blip when you tap buttons, choices, and links.</p>
                  </div>
                </div>
                <button
                  aria-pressed={buttonSound}
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 font-black transition ${buttonSound ? "bg-violet-700 text-white hover:bg-violet-800" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                  onClick={() => updateButtonSound(!buttonSound)}
                  type="button"
                >
                  {buttonSound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  {buttonSound ? "Sound on" : "Sound off"}
                </button>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${classChatSound ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                    {classChatSound ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
                  </span>
                  <div>
                    <h3 className="font-black text-slate-950">Class message sound</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Play a gentle sound when a new class discussion message arrives while SkulKid is open.</p>
                  </div>
                </div>
                <button
                  aria-pressed={classChatSound}
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 font-black transition ${classChatSound ? "bg-blue-700 text-white hover:bg-blue-800" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                  onClick={() => updateClassChatSound(!classChatSound)}
                  type="button"
                >
                  {classChatSound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  {classChatSound ? "Sound on" : "Sound off"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
        <div className={`${activeTab === "about" ? "sticky bottom-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,.16)] backdrop-blur sm:bottom-4" : ""}`}>
          {saveError ? <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" />{saveError}</div> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {hasChanges ? <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-black text-slate-700 hover:bg-slate-50" onClick={() => { setForm(profile); setSaved(false); setSaveError(""); }} type="button"><RotateCcw className="size-4" />Undo changes</button> : null}
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-black text-white shadow-sm hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || !hasChanges} type="submit">
              {saving ? <Loader2 className="size-5 animate-spin" /> : saved || !hasChanges ? <Check className="size-5" /> : <Save className="size-5" />}
              {saving ? "Saving..." : saved ? "Changes saved" : hasChanges ? "Save changes" : "Everything is saved"}
            </button>
          </div>
        </div>
    </form>
  </main></StudentShell>;
}

function subjectLabel(subject: StudentProfileData["favouriteSubject"]) {
  if (subject === "English") return "English Language";
  if (subject === "RME") return "RME";
  if (subject === "OWOP") return "OWOP";
  return subject;
}

function formatJoinedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Your first day on SkulKid";
  return new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function MiniDetail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-2.5"><Icon className="size-4 text-violet-600" /><p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 truncate text-xs font-bold text-slate-800" title={value}>{value}</p></div>;
}

function JourneyStat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: "blue" | "amber" | "violet" | "rose" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100"
  };
  return <div className={`rounded-2xl p-3 ring-1 ${tones[tone]}`}><Icon className="size-5" /><p className="mt-2 text-xl font-black">{value.toLocaleString()}</p><p className="mt-0.5 text-xs font-bold opacity-80">{label}</p></div>;
}

function Avatar({ profile, size = "small" }: { profile: StudentProfileData; size?: "small" | "large" }) { return <div className={`aspect-square shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-blue-100 to-violet-100 shadow-[0_8px_24px_rgba(37,99,235,0.2)] sm:rounded-3xl ${size === "large" ? "size-20 sm:size-24" : "size-11"}`}><CharacterAvatar avatar={profile.avatar} className="size-full rounded-[.85rem] sm:rounded-[1.25rem]" label={`${profile.username}'s avatar`} /></div>; }
function ChoiceGroup({ label, options, value, onChange }: { label: string; options: string[][]; value: string; onChange: (value: string) => void }) { return <fieldset><legend className="text-sm font-black text-slate-800">{label}</legend><div className="mt-2 flex flex-wrap gap-2">{options.map(([option, name]) => <button aria-pressed={value === option} className={`min-h-11 min-w-[5rem] flex-1 rounded-xl border-2 px-3 text-sm font-bold sm:min-h-10 sm:flex-none ${value === option ? "border-violet-600 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-700"}`} key={option} onClick={() => onChange(option)} type="button">{name}</button>)}</div></fieldset>; }
function ColorGroup({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (value: string) => void }) { return <fieldset><legend className="text-sm font-black text-slate-800">{label}</legend><div className="mt-2 flex flex-wrap gap-2.5">{colors.map((color) => <button aria-label={`${label} ${color}`} aria-pressed={value === color} className={`size-11 rounded-full border-4 shadow-sm sm:size-10 ${value === color ? "border-violet-600 ring-2 ring-violet-200" : "border-white"}`} key={color} onClick={() => onChange(color)} style={{ backgroundColor: color }} type="button" />)}</div></fieldset>; }
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={`block text-sm font-black text-text-secondary [&_input]:mt-2 [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-4 [&_select]:mt-2 [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 ${className}`}>{label}{children}</label>; }
function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 sm:size-11 sm:rounded-2xl"><Icon className="size-5" /></span><div><h2 className="text-lg font-black sm:text-xl">{title}</h2><p className="mt-1 text-sm leading-5 text-text-secondary sm:leading-normal">{description}</p></div></div>; }
function Pill({ icon: Icon, text }: { icon: React.ElementType; text: string }) { return <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-violet-50 px-2 py-2.5 text-center text-[11px] font-black text-violet-800 ring-1 ring-violet-100 sm:gap-1.5 sm:px-3 sm:text-sm"><Icon className="size-4 shrink-0 text-amber-500" /><span className="truncate">{text}</span></span>; }
