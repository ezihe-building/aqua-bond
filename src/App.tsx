import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Activity, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, Droplets, Flame, GlassWater, Heart, History, Music2, Plus,
  Moon, Share2, ShieldCheck, Sparkles, Sun, Trophy, UserRound, Users, Volume2, VolumeX, Waves, X,
} from "lucide-react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Profile = {
  id: string;
  display_name: string;
  invite_code: string;
  daily_goal_ml: number;
  reminder_time: string | null;
  sound_enabled: boolean;
};
type WaterLog = { id: string; user_id: string; amount_ml: number; created_at: string; challenge_date: string };
type DailyChallenge = { challenge_date: string; goal_ml: number; completed_at: string | null };
type FriendLink = { id: string; user_id: string; friend_id: string };
type FriendProgress = { link: FriendLink; profile: Profile; logs: WaterLog[]; challenges: DailyChallenge[] };
type Screen = "home" | "history" | "achievements" | "profile";
type LevelStyle = CSSProperties & { "--level": string };
type ProgressStyle = CSSProperties & { "--progress": string };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const cloudReady = Boolean(supabaseUrl && supabaseKey);
const supabase: SupabaseClient | null = cloudReady
  ? createClient(supabaseUrl!, supabaseKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
const MILESTONES = [3, 7, 14, 30, 100];
const AMOUNTS = [100, 250, 500];

const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDay = (key: string) => new Date(`${key}T12:00:00`);
const shortDate = (key: string) => parseDay(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const displayDate = (date = new Date()) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
const formatMl = (amount: number) => new Intl.NumberFormat().format(amount);
const relativeDays = (count: number) => {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return dateKey(date);
};
const makeId = () => crypto.randomUUID();
const MUSIC_PREFERENCE_KEY = "aqua-bond-ambient-music";
const THEME_PREFERENCE_KEY = "aqua-bond-theme";

function getMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_PREFERENCE_KEY) !== "off";
  } catch (error) {
    console.error("Could not read the relaxing music preference.", error);
    return true;
  }
}

function getThemePreference(): "dark" | "light" {
  try {
    return localStorage.getItem(THEME_PREFERENCE_KEY) === "light" ? "light" : "dark";
  } catch (error) {
    console.error("Could not read the theme preference.", error);
    return "dark";
  }
}

function Bottle({ percent, compact = false, hue = "blue" }: { percent: number; compact?: boolean; hue?: "blue" | "purple" }) {
  const amount = Math.max(0, Math.min(100, percent));
  return (
    <div className={`bottle-wrap ${compact ? "bottle-compact" : ""} bottle-${hue}`} style={{ "--level": `${100 - amount}%` } as LevelStyle}>
      <div className="bottle-glow" />
      <div className="bottle-cap"><span /></div>
      <div className="bottle-neck" />
      <div className="bottle-body">
        <div className="bottle-water">
          <div className="water-surface" />
          <div className="water-shimmer" />
          <div className="water-bubble bubble-one" />
          <div className="water-bubble bubble-two" />
        </div>
        <div className="bottle-reflection" />
        <div className="bottle-ridge ridge-one" />
        <div className="bottle-ridge ridge-two" />
        {!compact && <div className="bottle-mark"><Droplets size={18} /><span>AQUA<br />BOND</span></div>}
        <div className="bottle-measure measure-one" /><div className="bottle-measure measure-two" /><div className="bottle-measure measure-three" />
      </div>
      <div className="bottle-shadow" />
    </div>
  );
}

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [friends, setFriends] = useState<FriendProgress[]>([]);
  const [screen, setScreen] = useState<Screen>("home");
  const [authLoading, setAuthLoading] = useState(cloudReady);
  const [cloudError, setCloudError] = useState("");
  const [isAnonymousAuth, setIsAnonymousAuth] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [drinkAmount, setDrinkAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState("");
  const [nameEntry, setNameEntry] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  const [toast, setToast] = useState("");
  const [inviteEntry, setInviteEntry] = useState("");
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const friendCompletionState = useRef<Map<string, boolean>>(new Map());
  const [musicEnabled, setMusicEnabled] = useState(getMusicPreference);
  const [musicState, setMusicState] = useState<"off" | "waiting" | "playing">(musicEnabled ? "waiting" : "off");
  const ambientAudio = useRef<AudioContext | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(getThemePreference);
  const [today, setToday] = useState(dateKey());
  const confettiBits = useMemo(() => Array.from({ length: 34 }, (_, index) => ({ id: index, left: `${(index * 37) % 100}%`, delay: `${(index % 9) * 0.11}s`, color: ["#71e7ff", "#83a8ff", "#a988ff", "#fff", "#50caff"][index % 5] })), []);
  const todayLogs = logs.filter((log) => log.challenge_date === today);
  const consumed = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const goal = profile?.daily_goal_ml ?? 2000;
  const percent = Math.min(100, Math.round((consumed / goal) * 100));
  const remaining = Math.max(0, goal - consumed);
  const friend = friends[0]?.profile ?? null;
  const friendLogs = friends[0]?.logs ?? [];
  const friendChallenges = friends[0]?.challenges ?? [];
  const friendToday = friendLogs.filter((log) => log.challenge_date === today).reduce((sum, log) => sum + log.amount_ml, 0);
  const friendPercent = friend ? Math.min(100, Math.round((friendToday / friend.daily_goal_ml) * 100)) : 0;
  const completedDays = useMemo(() => new Set(challenges.filter((day) => day.completed_at).map((day) => day.challenge_date)), [challenges]);
  const streak = useMemo(() => {
    let start = completedDays.has(today) ? 0 : completedDays.has(relativeDays(1)) ? 1 : -1;
    if (start < 0) return 0;
    let count = 0;
    while (completedDays.has(relativeDays(start + count))) count++;
    return count;
  }, [completedDays, today]);
  const nextMilestone = MILESTONES.find((milestone) => milestone > streak) ?? null;
  const nowChallenge = challenges.find((day) => day.challenge_date === today);
  const bestStreak = useMemo(() => {
    const dates = [...completedDays].sort();
    let best = 0;
    let current = 0;
    let previous: Date | null = null;
    for (const key of dates) {
      const currentDate = parseDay(key);
      const gap = previous ? Math.round((currentDate.getTime() - previous.getTime()) / 86_400_000) : 0;
      current = gap === 1 ? current + 1 : 1;
      best = Math.max(best, current);
      previous = currentDate;
    }
    return best;
  }, [completedDays]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_PREFERENCE_KEY, theme);
    } catch (error) {
      console.error("Could not save the theme preference.", error);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");

  const startAmbientMusic = useCallback(async () => {
    try {
      let context = ambientAudio.current;
      if (!context || context.state === "closed") {
        context = new AudioContext();
        const master = context.createGain();
        master.gain.setValueAtTime(0.0001, context.currentTime);
        master.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 3);
        master.connect(context.destination);
        [130.81, 164.81, 196, 246.94].forEach((frequency) => {
          const oscillator = context!.createOscillator();
          const voice = context!.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          voice.gain.value = 0.18;
          oscillator.connect(voice);
          voice.connect(master);
          oscillator.start();
        });
        ambientAudio.current = context;
      }
      if (context.state === "suspended") await context.resume();
      if (ambientAudio.current !== context) return;
      setMusicState(context.state === "running" ? "playing" : "waiting");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "NotAllowedError")) {
        console.error("Could not start relaxing music.", error);
        notify("Relaxing music couldn't start. Try again using the music button.");
      }
      setMusicState("waiting");
    }
  }, [notify]);

  const toggleAmbientMusic = () => {
    if (musicEnabled && musicState === "waiting") {
      void startAmbientMusic();
      return;
    }
    const enabled = !musicEnabled;
    try {
      localStorage.setItem(MUSIC_PREFERENCE_KEY, enabled ? "on" : "off");
    } catch (error) {
      console.error("Could not save the relaxing music preference.", error);
    }
    setMusicEnabled(enabled);
    if (enabled) void startAmbientMusic();
  };

  useEffect(() => {
    if (!musicEnabled) {
      const context = ambientAudio.current;
      ambientAudio.current = null;
      setMusicState("off");
      if (context && context.state !== "closed") {
        void context.close().catch((error: unknown) => console.error("Could not stop relaxing music.", error));
      }
      return;
    }
    setMusicState("waiting");
    void startAmbientMusic();
  }, [musicEnabled, startAmbientMusic]);

  useEffect(() => {
    if (!musicEnabled) return;
    const resumeMusic = () => {
      if (document.visibilityState === "visible") void startAmbientMusic();
    };
    window.addEventListener("pointerdown", resumeMusic);
    window.addEventListener("keydown", resumeMusic);
    document.addEventListener("visibilitychange", resumeMusic);
    return () => {
      window.removeEventListener("pointerdown", resumeMusic);
      window.removeEventListener("keydown", resumeMusic);
      document.removeEventListener("visibilitychange", resumeMusic);
    };
  }, [musicEnabled, startAmbientMusic]);

  const loadCloudData = useCallback(async (userId: string) => {
    if (!supabase) return;
    const since = relativeDays(399);
    const [profileResult, logResult, challengeResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("water_logs").select("*").eq("user_id", userId).gte("challenge_date", since).order("created_at", { ascending: false }),
      supabase.from("daily_challenges").select("*").eq("user_id", userId).gte("challenge_date", since),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (logResult.error) throw logResult.error;
    if (challengeResult.error) throw challengeResult.error;
    setProfile(profileResult.data as Profile);
    setLogs(logResult.data as WaterLog[]);
    setChallenges(challengeResult.data as DailyChallenge[]);
    const { data: links, error: linkError } = await supabase.from("friendships").select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`).order("created_at", { ascending: true });
    if (linkError) throw linkError;
    const friendLinks = (links ?? []) as FriendLink[];
    const uniqueLinks = new Map<string, FriendLink>();
    friendLinks.forEach((link) => {
      const friendId = link.user_id === userId ? link.friend_id : link.user_id;
      if (!uniqueLinks.has(friendId)) uniqueLinks.set(friendId, link);
    });
    const friendIds = [...uniqueLinks.keys()];
    if (friendIds.length) {
      const [friendProfiles, friendHistory, friendDays] = await Promise.all([
        supabase.from("profiles").select("*").in("id", friendIds),
        supabase.from("water_logs").select("*").in("user_id", friendIds).eq("challenge_date", today).order("created_at", { ascending: false }),
        supabase.from("daily_challenges").select("*").in("user_id", friendIds).gte("challenge_date", since),
      ]);
      if (friendProfiles.error) throw friendProfiles.error;
      if (friendHistory.error) throw friendHistory.error;
      if (friendDays.error) throw friendDays.error;
      const profilesById = new Map((friendProfiles.data as Profile[]).map((item) => [item.id, item]));
      const logsById = new Map<string, WaterLog[]>();
      (friendHistory.data as WaterLog[]).forEach((item) => logsById.set(item.user_id, [...(logsById.get(item.user_id) ?? []), item]));
      const challengesById = new Map<string, DailyChallenge[]>();
      (friendDays.data as (DailyChallenge & { user_id: string })[]).forEach((item) => challengesById.set(item.user_id, [...(challengesById.get(item.user_id) ?? []), item]));
      const loadedFriends = friendIds.map((friendId) => {
        const friendProfile = profilesById.get(friendId);
        const link = uniqueLinks.get(friendId);
        if (!friendProfile || !link) throw new Error("Could not load a followed profile. Check the Supabase friend access policies.");
        return { link, profile: friendProfile, logs: logsById.get(friendId) ?? [], challenges: challengesById.get(friendId) ?? [] };
      });
      setFriends(loadedFriends);
    } else {
      setFriends([]);
    }
    const { error: todayError } = await supabase.from("daily_challenges").upsert(
      { user_id: userId, challenge_date: today, goal_ml: profileResult.data.daily_goal_ml },
      { onConflict: "user_id,challenge_date", ignoreDuplicates: true },
    );
    if (todayError) throw todayError;
    if (!challengeResult.data.some((item) => item.challenge_date === today)) {
      setChallenges((current) => [...current, { challenge_date: today, goal_ml: profileResult.data.daily_goal_ml, completed_at: null }]);
    }
  }, [today]);

  const handleProfile = useCallback(async (nextProfile: Pick<Profile, "id">, anonymous: boolean) => {
    setIsGuest(false);
    setIsAnonymousAuth(anonymous);
    await loadCloudData(nextProfile.id);
  }, [loadCloudData]);

  useEffect(() => {
    if (!cloudReady || !supabase) {
      setCloudError("Aqua Bond could not connect to its data service. Refresh the page or contact the app owner.");
      setAuthLoading(false);
      return;
    }
    let active = true;
    setAuthLoading(true);
    setCloudError("");
    const startAnonymousProfile = async () => {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: "Aqua friend" } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not start a private profile.");
      await handleProfile({ id: data.user.id }, true);
    };
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.error("Could not restore the Aqua Bond session.", error);
      if (!active) return;
      const user = data.session?.user ?? null;
      if (!user) {
        setProfile(null);
        setIsAnonymousAuth(false);
        await startAnonymousProfile();
      } else {
        await handleProfile({ id: user.id }, Boolean(user.is_anonymous));
      }
      if (!active) return;
      setCloudError("");
      setAuthLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      console.error("Could not start the Aqua Bond session.", caught);
      const message = caught instanceof Error ? caught.message : "Couldn't start your private profile.";
      setCloudError(/anonymous|disabled/i.test(message)
        ? "Device profiles are not enabled in Supabase. The app owner needs to turn on Anonymous Sign-Ins in Authentication → Sign In / Providers."
        : message);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && event === "SIGNED_OUT") {
        setProfile(null);
        setLogs([]);
        setChallenges([]);
        setFriends([]);
        setIsAnonymousAuth(false);
        setCloudError("Your private device profile was signed out. Refresh the page to start a new one.");
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [handleProfile]);


  useEffect(() => {
    if (!supabase || !profile || isGuest) return;
    const updates = supabase.channel(`aqua-bond-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_challenges" }, () => {
        void loadCloudData(profile.id).catch((error: unknown) => console.error("Could not refresh your water logs.", error));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        void loadCloudData(profile.id).catch((error: unknown) => console.error("Could not refresh a followed profile.", error));
      });
    updates.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") notify("Live sync paused. Check your connection.");
    });
    return () => { void supabase.removeChannel(updates); };
  }, [profile?.id, isGuest, loadCloudData, notify]);

  useEffect(() => {
    if (!supabase || !profile || isGuest) return;
    const channel = supabase.channel(`aqua-friend-link-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        void loadCloudData(profile.id).catch((error: unknown) => console.error("Could not refresh your friend connection.", error));
      });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [profile?.id, isGuest, loadCloudData]);

  useEffect(() => {
    friends.forEach(({ profile: followed, logs: followedLogs }) => {
      const key = `${today}:${followed.id}`;
      const total = followedLogs.filter((log) => log.challenge_date === today).reduce((sum, log) => sum + log.amount_ml, 0);
      const complete = total >= followed.daily_goal_ml;
      const previous = friendCompletionState.current.get(key);
      friendCompletionState.current.set(key, complete);
      if (previous !== false || !complete) return;
      notify(`${followed.display_name} reached today's water goal 💧`);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`${followed.display_name} made it! 💧`, { body: "Someone you follow reached today's goal. Send them some love!" });
      }
    });
  }, [friends, today, notify]);

  useEffect(() => {
    if (!profile?.reminder_time) return;
    const check = () => {
      const now = new Date();
      if (now.toTimeString().slice(0, 5) !== profile.reminder_time) return;
      const key = `aqua-reminder-${today}-${profile.reminder_time}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "shown");
      if ("Notification" in window && Notification.permission === "granted") new Notification("A little water break? 💧", { body: "Your Aqua Bond challenge is waiting for you." });
      notify("A gentle reminder to take a sip 💧");
    };
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [profile?.reminder_time, today, notify]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDate = dateKey();
      if (currentDate !== today) setToday(currentDate);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [today]);

  useEffect(() => {
    if (!profile) return;
    if (isGuest) {
      setChallenges((current) => current.some((day) => day.challenge_date === today)
        ? current
        : [...current, { challenge_date: today, goal_ml: profile.daily_goal_ml, completed_at: null }]);
      return;
    }
    void loadCloudData(profile.id).catch((error: unknown) => {
      console.error("Could not start today's water challenge.", error);
      notify(error instanceof Error ? error.message : "Couldn't start today's challenge.");
    });
  }, [today, profile?.id, isGuest, loadCloudData, notify]);

  useEffect(() => {
    const handler = (event: Event) => setInstallPrompt(event as BeforeInstallPromptEvent);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const persistProfile = async (updated: Profile) => {
    if (!isGuest && supabase) {
      const { error } = await supabase.from("profiles").update({
        display_name: updated.display_name, daily_goal_ml: updated.daily_goal_ml,
        reminder_time: updated.reminder_time, sound_enabled: updated.sound_enabled,
      }).eq("id", updated.id);
      if (error) throw error;
    }
    setProfile(updated);
  };

  const saveDisplayName = async () => {
    if (!profile) return;
    const displayName = (nameEntry ?? profile.display_name).trim();
    if (!displayName || displayName.length > 32) { notify("Your name needs to be between 1 and 32 characters."); return; }
    try {
      await persistProfile({ ...profile, display_name: displayName });
      setNameEntry(null);
      notify("Your name is updated 💙");
    } catch (error) {
      console.error("Could not update your display name.", error);
      notify(error instanceof Error ? `Couldn't update your name: ${error.message}` : "Couldn't update your name.");
    }
  };

  const logDrink = async () => {
    if (!profile || busy) return;
    const amount = drinkAmount === -1 ? Number(customAmount) : drinkAmount;
    if (!Number.isInteger(amount) || amount < 1 || amount > 5000) { notify("Choose an amount from 1 to 5,000 ml."); return; }
    setBusy(true);
    try {
      const entry: WaterLog = { id: makeId(), user_id: profile.id, amount_ml: amount, created_at: new Date().toISOString(), challenge_date: today };
      const total = consumed + amount;
      const completionTime = total >= goal ? new Date().toISOString() : null;
      let completedChallenge = Boolean(completionTime && consumed < goal);
      if (isGuest) {
        setLogs((current) => [entry, ...current]);
        setChallenges((current) => {
          const found = current.some((day) => day.challenge_date === today);
          return found
            ? current.map((day) => day.challenge_date === today ? { ...day, goal_ml: goal, completed_at: completionTime ?? day.completed_at } : day)
            : [...current, { challenge_date: today, goal_ml: goal, completed_at: completionTime }];
        });
      } else if (supabase) {
        const { data: newlyCompleted, error: logError } = await supabase.rpc("log_water", {
          p_amount_ml: amount,
          p_challenge_date: today,
        });
        if (logError) throw logError;
        completedChallenge = newlyCompleted === true;
        await loadCloudData(profile.id);
      }
      if (profile.sound_enabled) {
        try {
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const volume = context.createGain();
          oscillator.type = "sine"; oscillator.frequency.value = 660;
          volume.gain.setValueAtTime(0.06, context.currentTime);
          volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
          oscillator.connect(volume); volume.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.18);
          oscillator.onended = () => { void context.close(); };
        } catch (error) { console.error("Could not play the sip sound.", error); }
      }
      if (completedChallenge) {
        setNotification("You did it! Today's goal is all yours ✨");
        window.setTimeout(() => setNotification(""), 5200);
        if ("Notification" in window && Notification.permission === "granted") new Notification("Goal reached! 💧", { body: "You showed up for yourself today. Your water buddy is cheering you on!" });
      } else notify(["Nice! Keep going 💙", "A lovely little sip 💧", "Your future self says thanks ✨"][Math.floor(Math.random() * 3)]);
    } catch (error) {
      console.error("Could not save your water entry.", error);
      notify(error instanceof Error ? `Couldn't save your sip: ${error.message}` : "Couldn't save your sip. Try again.");
    } finally { setBusy(false); }
  };

  const undoDrink = async () => {
    if (!profile || !todayLogs.length || busy) return;
    const newest = [...todayLogs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    setBusy(true);
    try {
      if (isGuest) {
        const nextLogs = logs.filter((log) => log.id !== newest.id);
        const nextTotal = nextLogs.filter((log) => log.challenge_date === today).reduce((sum, log) => sum + log.amount_ml, 0);
        setLogs(nextLogs);
        setChallenges((current) => current.map((day) => day.challenge_date === today ? { ...day, completed_at: nextTotal >= day.goal_ml ? day.completed_at : null } : day));
      } else if (supabase) {
        const { error } = await supabase.from("water_logs").delete().eq("id", newest.id).eq("user_id", profile.id);
        if (error) throw error;
        await loadCloudData(profile.id);
      }
      notify(`${formatMl(newest.amount_ml)} ml removed.`);
    } catch (error) {
      console.error("Could not undo your water entry.", error);
      notify(error instanceof Error ? `Couldn't undo that sip: ${error.message}` : "Couldn't undo that sip.");
    } finally { setBusy(false); }
  };

  const setGoal = async (newGoal: number) => {
    if (!profile || newGoal < 500 || newGoal > 8000 || !Number.isInteger(newGoal)) { notify("Your daily goal needs to be between 500 and 8,000 ml."); return; }
    try {
      const updated = { ...profile, daily_goal_ml: newGoal };
      await persistProfile(updated);
      if (isGuest) setChallenges((current) => current.map((day) => day.challenge_date === today ? { ...day, goal_ml: newGoal, completed_at: consumed >= newGoal ? day.completed_at ?? new Date().toISOString() : null } : day));
      else if (supabase) {
        const { error } = await supabase.from("daily_challenges").upsert({ user_id: profile.id, challenge_date: today, goal_ml: newGoal, completed_at: consumed >= newGoal ? nowChallenge?.completed_at ?? new Date().toISOString() : null }, { onConflict: "user_id,challenge_date" });
        if (error) throw error;
        await loadCloudData(profile.id);
      }
      notify(`Daily goal updated to ${formatMl(newGoal)} ml.`);
    } catch (error) {
      console.error("Could not update your daily goal.", error);
      notify(error instanceof Error ? `Couldn't update your goal: ${error.message}` : "Couldn't update your goal.");
    }
  };

  const resetToday = async () => {
    if (!profile || !window.confirm("Remove all of today's water logs? Your earlier history will stay safe.")) return;
    try {
      if (isGuest) {
        setLogs((current) => current.filter((log) => log.challenge_date !== today));
        setChallenges((current) => current.map((day) => day.challenge_date === today ? { ...day, completed_at: null } : day));
      } else if (supabase) {
        const { error } = await supabase.from("water_logs").delete().eq("user_id", profile.id).eq("challenge_date", today);
        if (error) throw error;
        const { error: updateError } = await supabase.from("daily_challenges").update({ completed_at: null }).eq("user_id", profile.id).eq("challenge_date", today);
        if (updateError) throw updateError;
        await loadCloudData(profile.id);
      }
      notify("Today's challenge is fresh again 💧");
    } catch (error) {
      console.error("Could not reset today's challenge.", error);
      notify(error instanceof Error ? `Couldn't reset today's challenge: ${error.message}` : "Couldn't reset today's challenge.");
    }
  };

  const connectFriend = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !supabase || isGuest) { notify("Friend connections need an online account."); return; }
    const code = inviteEntry.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("connect_friend", { p_invite_code: code });
      if (error) throw error;
      const match = data?.[0] as { friend_id: string; friend_name: string } | undefined;
      if (!match) throw new Error("We couldn't connect that friend. Please check the invite code and try again.");
      setInviteEntry("");
      await loadCloudData(profile.id);
      notify(`You're connected with ${match.friend_name} 💙`);
    } catch (error) {
      console.error("Could not connect your Aqua Bond friend.", error);
      notify(error instanceof Error ? error.message : "Couldn't connect. Please try again.");
    } finally { setBusy(false); }
  };

  const disconnectFriend = async (followed: FriendProgress) => {
    if (!profile || !supabase || !window.confirm(`Stop following ${followed.profile.display_name}? Your own history stays safe.`)) return;
    try {
      const { error } = await supabase.from("friendships").delete().eq("id", followed.link.id);
      if (error) throw error;
      await loadCloudData(profile.id);
      notify(`You stopped following ${followed.profile.display_name}.`);
    } catch (error) {
      console.error("Could not remove your friend connection.", error);
      notify(error instanceof Error ? `Couldn't disconnect: ${error.message}` : "Couldn't disconnect.");
    }
  };

  const shareInvite = async () => {
    if (!profile) return;
    const text = `Join me on Aqua Bond 💧 Use my private invite code: ${profile.invite_code}`;
    try {
      if (navigator.share) await navigator.share({ title: "Aqua Bond", text });
      else { await navigator.clipboard.writeText(text); notify("Invite copied to your clipboard 💧"); }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Could not share the invite code.", error);
      notify("Couldn't share your invite. Copy your code instead.");
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) { notify("This browser doesn't support notifications."); return; }
    try {
      const permission = await Notification.requestPermission();
      notify(permission === "granted" ? "Gentle reminders are turned on 💧" : "Notifications are off. You can enable them in browser settings.");
    } catch (error) {
      console.error("Could not request notification permission.", error);
      notify("Couldn't request notifications. Check your browser settings.");
    }
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const key = relativeDays(6 - index);
      const count = logs.filter((log) => log.challenge_date === key).reduce((sum, log) => sum + log.amount_ml, 0);
      const challenge = challenges.find((day) => day.challenge_date === key);
      return { key, count, goal: challenge?.goal_ml ?? goal, completed: Boolean(challenge?.completed_at) };
    });
  }, [logs, challenges, goal]);

  const monthData = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const key = relativeDays(29 - index);
      const challenge = challenges.find((day) => day.challenge_date === key);
      return { key, complete: Boolean(challenge?.completed_at), hasData: Boolean(challenge) };
    });
  }, [challenges]);

  const historyData = useMemo(() => {
    const byDate = new Map<string, number>();
    logs.forEach((log) => byDate.set(log.challenge_date, (byDate.get(log.challenge_date) ?? 0) + log.amount_ml));
    return [...byDate.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [logs]);

  const friendStreak = useMemo(() => {
    const days = new Set(friendChallenges.filter((day) => day.completed_at).map((day) => day.challenge_date));
    let start = days.has(today) ? 0 : days.has(relativeDays(1)) ? 1 : -1;
    if (start < 0) return 0;
    let count = 0;
    while (days.has(relativeDays(start + count))) count++;
    return count;
  }, [friendChallenges, today]);

  if (authLoading) return <div className="loading-screen"><div className="loader-drop"><Droplets size={23} /></div><p>Preparing Aqua Bond…</p></div>;
  if (!profile) return <main className="auth-page"><section className="guest-card"><h1>Couldn’t open Aqua Bond</h1><p>{cloudError || "Your private profile could not be started. Check your connection and try again."}</p><button className="button-primary" onClick={() => window.location.reload()}>Try again <ArrowRight size={16} /></button></section></main>;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setScreen("home"); }}><span className="brand-mark"><Droplets size={18} /></span><span>aqua<span className="brand-light">bond</span></span></a>
        <div className="topbar-right">
          <div className={`sync-pill ${isGuest ? "sync-local" : "sync-online"}`}><span className="sync-dot" />{isGuest ? "On this device" : "Live together"}</div>
          <button className={`icon-button music-button ${musicEnabled ? "music-active" : ""}`} onClick={toggleAmbientMusic} aria-label={musicEnabled ? musicState === "waiting" ? "Start relaxing music" : "Turn relaxing music off" : "Play relaxing music"} title={musicEnabled ? musicState === "waiting" ? "Tap to start relaxing music" : "Turn relaxing music off" : "Play relaxing music"}><Music2 size={17} /></button>
          <button className="icon-button theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button className="icon-button profile-button" aria-label="Profile settings" onClick={() => setScreen("profile")}><span className="avatar">{profile.display_name.slice(0, 1).toUpperCase()}</span></button>
        </div>
      </header>

      {isGuest && <div className="local-banner"><CircleHelp size={15} /><span>Local mode · your data stays on this device. <b>Supabase enables friend sync.</b></span>{!cloudReady && <button onClick={() => notify("Add your Supabase project URL and anon/publishable key to .env, then run the setup SQL.")}>How to connect?</button>}</div>}

      <main className="main-content">
        <section className="welcome-row">
          <div><p className="date-label">{displayDate()}</p><h1>{screen === "home" ? <>A little more <span>you</span> time.</> : screen === "history" ? <>Your hydration <span>story.</span></> : screen === "achievements" ? <>Look at you <span>glow.</span></> : <>Your little <span>corner.</span></>}</h1><p className="welcome-sub">{screen === "home" ? "Small sips add up. Let’s make today feel good." : screen === "history" ? "Every little sip is a step in the right direction." : screen === "achievements" ? "Every day you show up is worth celebrating." : "Make Aqua Bond feel like yours."}</p></div>
          <button className="streak-chip" onClick={() => setScreen("achievements")}><span className="streak-flame"><Flame size={18} fill="currentColor" /></span><span><b>{streak} day{streak === 1 ? "" : "s"}</b><small>current streak</small></span><ChevronRight size={15} /></button>
        </section>

        {screen === "home" && <>
          <section className="dashboard-grid">
            <article className={`glass-card hero-card ${consumed >= goal ? "goal-complete" : ""}`}>
              <div className="hero-head"><div><span className="card-kicker"><span className="kicker-dot" />YOUR DAILY CHALLENGE</span><h2>Make a little <span>wave.</span></h2></div><div className="today-tag"><Waves size={14} /> Today</div></div>
              <div className="hero-body">
                <div className="hero-stats">
                  <div className="goal-total">{formatMl(goal)}<span> ml</span></div><p className="goal-caption">your daily water goal</p>
                  <div className="progress-ring" style={{ "--progress": `${percent}%` } as ProgressStyle}><div className="ring-inner"><strong>{percent}<small>%</small></strong><span>complete</span></div></div>
                  <div className="stat-line"><span><i className="stat-dot consumed-dot" />Drunk</span><b>{formatMl(consumed)} <small>ml</small></b></div>
                  <div className="stat-line"><span><i className="stat-dot remaining-dot" />To go</span><b>{formatMl(remaining)} <small>ml</small></b></div>
                </div>
                <div className="hero-bottle-stage"><div className="stage-halo" /><div className="stage-ring ring-outer" /><div className="stage-ring ring-inner-a" /><Bottle percent={100 - percent} /><div className="bottle-caption"><Sparkles size={12} /> YOUR LITTLE DAILY RESET</div><div className="floating-drop drop-a"><Droplets size={16} /></div><div className="floating-drop drop-b"><Droplets size={11} /></div><div className="floating-drop drop-c"><Droplets size={14} /></div></div>
              </div>
              <div className="hero-footer"><div className="drink-customizer"><span className="amount-label">YOUR SIP</span><div className="amount-options">{AMOUNTS.map((amount) => <button key={amount} className={drinkAmount === amount ? "selected" : ""} onClick={() => { setDrinkAmount(amount); setCustomAmount(""); }}>{amount} <small>ml</small></button>)}<button className={drinkAmount === -1 ? "selected custom-chip" : "custom-chip"} onClick={() => setDrinkAmount(-1)}><Plus size={13} /> Custom</button></div>{drinkAmount === -1 && <label className="custom-input"><input inputMode="numeric" type="number" min="1" max="5000" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="Enter ml" /><span>ml</span></label>}</div>
                <button className="drink-button" onClick={() => void logDrink()} disabled={busy}><span className="drink-button-icon"><Droplets size={19} fill="currentColor" /></span><span>I DRANK WATER</span><ArrowRight size={17} /></button>
              </div>
              {todayLogs.length > 0 && <button className="undo-link" onClick={() => void undoDrink()} disabled={busy}><ArrowLeft size={13} /> Undo last sip · {formatMl([...todayLogs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].amount_ml)} ml</button>}
              {notification && <div className="completion-overlay"><div className="confetti-layer">{confettiBits.map((bit) => <i key={bit.id} style={{ left: bit.left, animationDelay: bit.delay, background: bit.color }} />)}</div><button className="close-celebration" aria-label="Close celebration" onClick={() => setNotification("")}><X size={18} /></button><div className="celebration-icon"><Trophy size={30} /></div><span className="eyebrow">DAILY CHALLENGE COMPLETE</span><h3>{notification}</h3><p>You showed up for yourself today. That's something to be proud of.</p><div className="celebration-badge"><span>💧</span> Daily wave maker</div></div>}
            </article>

            <aside className="side-column">
              <article className="glass-card buddy-card">
                <div className="card-title-row"><div><span className="card-kicker"><span className="kicker-dot purple-dot" />CONNECTED FRIENDS · {friends.length}</span><h3>Better <span>together.</span></h3></div><div className="buddy-hearts"><Heart size={15} fill="currentColor" /></div></div>
                {friend ? <div className="duo-progress">
                  <BuddyBottle name="YOU" percent={percent} consumed={consumed} goal={goal} hue="blue" initial={profile.display_name.slice(0, 1)} />
                  <div className="duo-divider"><span>✦</span></div>
                  <BuddyBottle name={friend.display_name.toUpperCase()} percent={friendPercent} consumed={friendToday} goal={friend.daily_goal_ml} hue="purple" initial={friend.display_name.slice(0, 1)} />
                  <div className="buddy-streaks"><span><Flame size={13} fill="currentColor" /> You · {streak} day{streak === 1 ? "" : "s"}</span><span><Flame size={13} fill="currentColor" /> {friend.display_name} · {friendStreak} day{friendStreak === 1 ? "" : "s"}</span></div>
                  <p className="buddy-encourage">{friendPercent >= 100 ? `${friend.display_name} crushed today's goal. Send them a little love!` : percent >= friendPercent ? "You're making a lovely little splash today." : `${friend.display_name} is making waves. You've got this!`}</p>
                </div> : <div className="buddy-empty">
                  <div className="buddy-art"><div className="mini-buddy one"><Droplets size={20} /></div><div className="mini-buddy two"><Droplets size={20} /></div><span className="buddy-art-heart">♡</span></div>
                  <p>Your favorite person makes every sip a little sweeter.</p>
                  <button className="button-outline" onClick={() => setScreen("profile")}><Users size={15} /> Invite your person</button>
                </div>}
              </article>
              <article className="glass-card week-card">
                <div className="card-title-row"><div><span className="card-kicker"><span className="kicker-dot" />LITTLE WINS ADD UP</span><h3>This week <span>so far.</span></h3></div><button className="text-arrow" onClick={() => setScreen("history")}>All history <ChevronRight size={14} /></button></div>
                <div className="week-chart">{weekData.map((day) => <div className="week-column" key={day.key}><div className="week-bar-track"><div className={`week-bar ${day.completed ? "bar-complete" : ""}`} style={{ height: `${Math.min(100, Math.round((day.count / day.goal) * 100))}%` }} />{day.completed && <span className="bar-check"><Check size={10} /></span>}</div><span className={`week-day ${day.key === today ? "day-today" : ""}`}>{parseDay(day.key).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span></div>)}</div>
                <div className="week-summary"><span><i className="legend-dot" /> Daily water <span className="chart-caption">· ml</span></span><span><b>{weekData.filter((day) => day.completed).length}</b> of 7 goals</span></div>
              </article>
              <div className="daily-note"><div className="note-icon"><Sparkles size={17} /></div><div><span>A LITTLE NOTE FOR TODAY</span><p>{["You don't need to do it all at once. Just take the next sip.", "A tiny act of care still counts. Here's to yours.", "Slow and steady looks lovely on you.", "You're doing better than you think. Keep sipping.", "Your body does a lot for you. This one's for it."][new Date().getDay() % 5]}</p></div></div>
            </aside>
          </section>
          {installPrompt && <button className="install-banner" onClick={() => void installApp()}><span><Sparkles size={15} /> Keep Aqua Bond close</span><span>Install app <ArrowRight size={15} /></span></button>}
        </>}

        {screen === "history" && <section className="content-grid">
          <article className="glass-card history-card"><div className="card-title-row"><div><span className="card-kicker"><span className="kicker-dot" />YOUR LAST 7 DAYS</span><h2>Little by <span>little.</span></h2></div><div className="history-total"><b>{weekData.filter((day) => day.completed).length}</b><span>days reached</span></div></div>
            <div className="history-chart">{weekData.map((day) => <div className="history-column" key={day.key}><span className="history-amount">{day.count ? `${(day.count / 1000).toFixed(day.count % 1000 ? 1 : 0)}L` : "—"}</span><div className="history-track"><div className={`history-fill ${day.completed ? "fill-complete" : ""}`} style={{ height: `${Math.max(day.count ? 4 : 0, Math.min(100, Math.round((day.count / day.goal) * 100)))}%` }} />{day.completed && <span className="history-check"><Check size={10} /></span>}</div><span className={`history-label ${day.key === today ? "day-today" : ""}`}>{parseDay(day.key).toLocaleDateString(undefined, { weekday: "short" })}</span></div>)}</div>
            <div className="chart-footnote"><span><i className="legend-dot" /> Drank</span><span><i className="legend-dot legend-goal" /> Goal reached</span><span>Daily goal · {formatMl(goal)} ml</span></div>
          </article>
          <article className="glass-card month-card"><div className="card-title-row"><div><span className="card-kicker"><span className="kicker-dot purple-dot" />SHOWING UP</span><h3>Your last <span>30 days.</span></h3></div><div className="month-percent">{monthData.filter((day) => day.complete).length}<small> / 30</small></div></div>
            <div className="month-grid">{monthData.map((day) => <div key={day.key} title={`${shortDate(day.key)}${day.complete ? " · goal reached" : day.hasData ? " · challenge started" : ""}`} className={`month-cell ${day.complete ? "month-complete" : day.hasData ? "month-started" : ""} ${day.key === today ? "month-today" : ""}`} />)}</div>
            <div className="month-legend"><span><i className="month-cell month-empty" /> Not yet</span><span><i className="month-cell month-started" /> Sipped</span><span><i className="month-cell month-complete" /> Goal reached</span></div>
          </article>
          <article className="glass-card log-card"><div className="card-title-row"><div><span className="card-kicker"><span className="kicker-dot" />YOUR SIP HISTORY</span><h3>Every little <span>bit.</span></h3></div><History size={17} className="muted-icon" /></div>
            {historyData.length ? <div className="log-list">{historyData.slice(0, 30).map(([day, amount]) => <div className="log-row" key={day}><div className="log-day-icon"><Droplets size={17} /></div><div className="log-day"><b>{shortDate(day)}</b><span>{challenges.find((entry) => entry.challenge_date === day)?.completed_at ? "A goal reached kind of day" : `${logs.filter((log) => log.challenge_date === day).length} little sip${logs.filter((log) => log.challenge_date === day).length === 1 ? "" : "s"}`}</span></div><div className="log-amount">{formatMl(amount)} <small>ml</small></div><div className="log-progress"><div style={{ width: `${Math.min(100, Math.round((amount / (challenges.find((entry) => entry.challenge_date === day)?.goal_ml ?? goal)) * 100))}%` }} /></div></div>)}</div> : <div className="empty-history"><div><GlassWater size={24} /></div><b>Your story starts with a sip.</b><span>Log a glass of water and your progress will show up here.</span><button className="text-arrow" onClick={() => setScreen("home")}>Back to today <ChevronRight size={14} /></button></div>}
          </article>
        </section>}

        {screen === "achievements" && <section className="achievement-page">
          <article className="glass-card achievement-hero"><div className="achievement-hero-copy"><span className="card-kicker"><span className="kicker-dot" />YOUR AQUA BOND STREAK</span><h2>{streak === 0 ? "Your next little win is a sip away." : `${streak} days of showing up.`}</h2><p>Consistency isn't about being perfect. It's about coming back to yourself.</p><div className="streak-stat"><Flame size={17} fill="currentColor" /><b>{streak}</b><span>day streak</span></div>{nextMilestone && <div className="next-milestone"><div className="milestone-progress"><i style={{ width: `${Math.min(100, Math.round((streak / nextMilestone) * 100))}%` }} /></div><span>{nextMilestone - streak} more day{nextMilestone - streak === 1 ? "" : "s"} to your {nextMilestone}-day badge</span></div>}</div><div className="streak-graphic"><div className="streak-halo" /><div className="streak-flame-large"><Flame size={76} fill="currentColor" /><Droplets size={28} /></div><div className="streak-sparkle spark-one">✦</div><div className="streak-sparkle spark-two">✦</div></div></article>
          <div className="achievement-heading"><div><span className="card-kicker"><span className="kicker-dot purple-dot" />A LITTLE SOMETHING TO CELEBRATE</span><h3>Lovely milestones.</h3></div><span>{MILESTONES.filter((milestone) => bestStreak >= milestone).length} of {MILESTONES.length} unlocked</span></div>
          <div className="badge-grid">{MILESTONES.map((milestone, index) => <article key={milestone} className={`glass-card badge-card ${bestStreak >= milestone ? "badge-unlocked" : "badge-locked"}`}><div className="badge-medal">{index < 2 ? <Flame size={24} fill="currentColor" /> : index === 2 ? <Waves size={24} /> : index === 3 ? <Trophy size={24} /> : <Sparkles size={24} />}{bestStreak >= milestone && <i><Check size={10} /></i>}</div><span className="badge-day">{milestone} DAYS</span><h4>{["First ripple", "On a roll", "Flow state", "Ocean energy", "Aqua legend"][index]}</h4><p>{["Your first little streak.", "A lovely week of showing up.", "Two weeks of feeling good.", "A whole month of self-care.", "One hundred days. Incredible."][index]}</p><span className={`badge-status ${bestStreak >= milestone ? "status-earned" : ""}`}>{bestStreak >= milestone ? "EARNED WITH LOVE" : `${Math.max(0, milestone - bestStreak)} days to go`}</span></article>)}</div>
          <article className="glass-card weekly-progress"><div><span className="card-kicker"><span className="kicker-dot" />THIS WEEK, JUST FOR YOU</span><h3>A week of <span>little wins.</span></h3></div><div className="weekly-dots">{weekData.map((day) => <div key={day.key} className={`weekly-day ${day.completed ? "weekly-done" : ""}`}><span className="weekly-dot">{day.completed ? <Check size={14} /> : <span>{parseDay(day.key).getDate()}</span>}</span><small>{parseDay(day.key).toLocaleDateString(undefined, { weekday: "short" })}</small></div>)}</div><div className="weekly-count"><b>{weekData.filter((day) => day.completed).length} lovely {weekData.filter((day) => day.completed).length === 1 ? "day" : "days"}</b> of meeting your goal this week</div></article>
        </section>}

        {screen === "profile" && <section className="settings-layout">
          <div className="settings-main">
            <article className="glass-card settings-profile"><div className="settings-avatar">{profile.display_name.slice(0, 1).toUpperCase()}<span><Check size={11} /></span></div><div className="settings-person"><span className="card-kicker">{isAnonymousAuth ? "YOUR DEVICE PROFILE" : "YOUR AQUA BOND PROFILE"}</span><h2>{profile.display_name}</h2><p>{isAnonymousAuth ? "Saved to this browser. Clearing browser data may remove access to this profile." : "Showing up for yourself, beautifully."}</p></div><div className="profile-streak"><Flame size={16} fill="currentColor" /><b>{streak}</b><span>day streak</span></div></article>
            <article className="glass-card settings-section"><div className="settings-section-head"><div className="settings-icon"><UserRound size={17} /></div><div><h3>Your name</h3><p>Choose the name your water buddy sees.</p></div></div><div className="custom-goal-row name-row"><label htmlFor="display-name">Display name</label><div><input id="display-name" type="text" maxLength={32} value={nameEntry ?? profile.display_name} onChange={(event) => setNameEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveDisplayName(); }} /><button onClick={() => void saveDisplayName()}>Save name</button></div></div></article>
            <article className="glass-card settings-section"><div className="settings-section-head"><div className="settings-icon"><Activity size={17} /></div><div><h3>Your daily goal</h3><p>A good place to start is whatever feels right for you.</p></div></div><div className="goal-presets">{[1500, 2000, 2500, 3000].map((amount) => <button key={amount} className={goal === amount ? "goal-selected" : ""} onClick={() => void setGoal(amount)}>{formatMl(amount)} <small>ml</small></button>)}</div><div className="custom-goal-row"><label htmlFor="custom-goal">Or choose your own amount</label><div><input id="custom-goal" type="number" min="500" max="8000" step="100" placeholder={`${goal}`} onKeyDown={(event) => { if (event.key === "Enter") void setGoal(Number((event.target as HTMLInputElement).value)); }} /><span>ml</span><button onClick={(event) => { const input = (event.currentTarget.previousElementSibling?.previousElementSibling as HTMLInputElement); void setGoal(Number(input.value)); }}>Save goal</button></div></div></article>
            <article className="glass-card settings-section"><div className="settings-section-head"><div className="settings-icon reminder-icon"><Bell size={17} /></div><div><h3>A gentle reminder</h3><p>A little nudge, right when you need one.</p></div></div><div className="setting-row"><div className="setting-row-icon"><Clock3 size={16} /></div><div className="setting-row-copy"><b>Daily water break</b><span>{profile.reminder_time ? `A little sip at ${profile.reminder_time}` : "Choose a time for your gentle reminder"}</span></div><input aria-label="Reminder time" type="time" value={profile.reminder_time ?? ""} onChange={(event) => { void persistProfile({ ...profile, reminder_time: event.target.value || null }).then(() => notify(event.target.value ? "Your gentle reminder is set 💧" : "Reminder turned off." )).catch((error: unknown) => { console.error("Could not save reminder time.", error); notify("Couldn't save your reminder time."); }); }} /></div><button className="setting-row setting-button" onClick={() => void requestNotifications()}><div className="setting-row-icon"><Bell size={16} /></div><div className="setting-row-copy"><b>Allow notifications</b><span>Get a nudge even when you're away from the app</span></div><ChevronRight size={16} /></button></article>
            <article className="glass-card settings-section"><div className="settings-section-head"><div className="settings-icon sound-icon">{profile.sound_enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}</div><div><h3>Little things</h3><p>Make this space feel just like you.</p></div></div><button className="setting-row setting-button" onClick={() => void persistProfile({ ...profile, sound_enabled: !profile.sound_enabled }).then(() => notify(profile.sound_enabled ? "Sip sounds are off." : "Sip sounds are on 💧")).catch((error: unknown) => { console.error("Could not update sound preference.", error); notify("Couldn't update sound preference."); })}><div className="setting-row-icon">{profile.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</div><div className="setting-row-copy"><b>Sip sounds</b><span>A tiny, satisfying sound when you log a drink</span></div><div className={`toggle ${profile.sound_enabled ? "toggle-on" : ""}`}><i /></div></button><button className="setting-row setting-button" onClick={toggleAmbientMusic}><div className="setting-row-icon"><Music2 size={16} /></div><div className="setting-row-copy"><b>Relaxing background music</b><span>{musicEnabled ? musicState === "playing" ? "Playing softly" : "Tap to start or turn off" : "Off"}</span></div><div className={`toggle ${musicEnabled ? "toggle-on" : ""}`}><i /></div></button></article>
            <article className="glass-card settings-section"><div className="settings-section-head"><div className="settings-icon theme-icon">{theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}</div><div><h3>Your appearance</h3><p>Choose the light that feels comfortable.</p></div></div><button className="setting-row setting-button" onClick={toggleTheme}><div className="setting-row-icon">{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}</div><div className="setting-row-copy"><b>{theme === "dark" ? "Dark mode" : "Light mode"}</b><span>Tap to switch to {theme === "dark" ? "light" : "dark"} mode</span></div><div className="theme-switch">{theme === "dark" ? "Dark" : "Light"}</div></button></article>
            <article className="glass-card settings-section challenge-settings"><div className="settings-section-head"><div className="settings-icon"><Waves size={17} /></div><div><h3>Today’s challenge</h3><p>Start fresh without losing your earlier days.</p></div></div><button className="setting-row setting-button reset-row" onClick={() => void resetToday()}><div className="setting-row-icon"><History size={16} /></div><div className="setting-row-copy"><b>Reset today’s progress</b><span>Remove today's logs and keep your history</span></div><ChevronRight size={16} /></button></article>
          </div>
          <aside className="settings-side">
            {isGuest ? <article className="glass-card invite-card invite-disabled"><div className="invite-decoration"><Users size={21} /></div><span className="card-kicker">BETTER TOGETHER</span><h3>Your people are<br /><span>one sip away.</span></h3><p>Connect this app to Supabase to get a private invite code and connect with multiple friends. No sign-up needed.</p><div className="invite-code"><span>FRIEND SYNC</span><b>Needs Supabase</b><button onClick={() => notify("Add your Supabase project URL and anon/publishable key to .env, then run the setup SQL.")}><CircleHelp size={15} /></button></div></article> : <article className="glass-card invite-card"><div className="invite-decoration"><Users size={21} /></div><span className="card-kicker">YOUR WATER BUDDIES</span><h3>Good habits are<br /><span>better together.</span></h3><p>Share your private code, then connect with other people's invite codes. Connected friends can see each other's progress live.</p><div className="invite-code"><span>YOUR PRIVATE CODE</span><b>{profile.invite_code}</b><button aria-label="Share invite code" onClick={() => void shareInvite()}><Share2 size={15} /></button></div><form className="join-form" onSubmit={(event) => void connectFriend(event)}><input value={inviteEntry} onChange={(event) => setInviteEntry(event.target.value.toUpperCase())} placeholder="Enter their invite code" aria-label="Friend invite code" /><button className="button-primary" disabled={busy}>Connect <ArrowRight size={15} /></button></form><div className="followed-list" aria-live="polite">{friends.length === 0 ? <p className="followed-empty">You haven’t connected with anyone yet. Add your first person above.</p> : friends.map((followed) => { const amount = followed.logs.filter((log) => log.challenge_date === today).reduce((sum, log) => sum + log.amount_ml, 0); const percentComplete = Math.min(100, Math.round((amount / followed.profile.daily_goal_ml) * 100)); return <div className="connected-friend" key={followed.profile.id}><span className="avatar friend-avatar">{followed.profile.display_name.slice(0, 1).toUpperCase()}</span><div><b>{followed.profile.display_name}</b><span>{percentComplete}% of today’s goal</span></div><span className="live-dot" /><button className="disconnect-button" aria-label={`Disconnect from ${followed.profile.display_name}`} onClick={() => void disconnectFriend(followed)}><X size={14} /></button></div>; })}</div></article>}
            <article className="glass-card privacy-card"><div className="privacy-icon"><ShieldCheck size={20} /></div><div><h4>Your water is personal.</h4><p>Connected friends can see each other's drink logs and daily goals.</p></div></article>
            {installPrompt && <button className="install-setting" onClick={() => void installApp()}><Sparkles size={15} /> Install Aqua Bond on this device <ArrowRight size={15} /></button>}
          </aside>
        </section>}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button className={screen === "home" ? "nav-active" : ""} aria-current={screen === "home" ? "page" : undefined} onClick={() => setScreen("home")}><Droplets size={18} /><span>Today</span></button>
        <button className={screen === "history" ? "nav-active" : ""} aria-current={screen === "history" ? "page" : undefined} onClick={() => setScreen("history")}><History size={18} /><span>History</span></button>
        <button className={screen === "achievements" ? "nav-active" : ""} aria-current={screen === "achievements" ? "page" : undefined} onClick={() => setScreen("achievements")}><Trophy size={18} /><span>Milestones</span></button>
        <button className={screen === "profile" ? "nav-active" : ""} aria-current={screen === "profile" ? "page" : undefined} onClick={() => setScreen("profile")}><UserRound size={18} /><span>You</span></button>
      </nav>
      {toast && <div className="toast"><span><CheckCircle2 size={17} /></span>{toast}</div>}
    </div>
  );
}

function BuddyBottle({ name, percent, consumed, goal, hue, initial }: { name: string; percent: number; consumed: number; goal: number; hue: "blue" | "purple"; initial: string }) {
  return <div className={`buddy-person buddy-${hue}`}><div className="buddy-bottle"><Bottle percent={100 - percent} compact hue={hue} /><span className="buddy-initial">{initial}</span></div><b className="buddy-name">{name}</b><strong>{percent}<small>%</small></strong><div className="buddy-meter"><i style={{ width: `${percent}%` }} /></div><span className="buddy-ml">{formatMl(consumed)} / {formatMl(goal)} ml</span></div>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default App;
