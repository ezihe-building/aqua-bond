import { useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";

const MUSIC_PREFERENCE_KEY = "aqua-bond-ambient-music";

function readMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_PREFERENCE_KEY) !== "off";
  } catch (error) {
    console.error("Could not read the relaxing music preference.", error);
    return true;
  }
}

export default function RelaxingMusic({ className }: { className: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(readMusicPreference);
  const [waitingForGesture, setWaitingForGesture] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) {
      audio?.pause();
      setWaitingForGesture(false);
      return;
    }

    audio.volume = 0.22;
    const startPlayback = () => {
      void audio.play().then(() => setWaitingForGesture(false)).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setWaitingForGesture(true);
          return;
        }
        console.error("Could not play the relaxing music. Check that public/relaxing-music.mp3 exists.", error);
      });
    };
    const resumePlayback = () => {
      if (document.visibilityState === "visible") startPlayback();
    };

    startPlayback();
    window.addEventListener("pointerdown", startPlayback);
    window.addEventListener("keydown", startPlayback);
    document.addEventListener("visibilitychange", resumePlayback);
    return () => {
      window.removeEventListener("pointerdown", startPlayback);
      window.removeEventListener("keydown", startPlayback);
      document.removeEventListener("visibilitychange", resumePlayback);
      audio.pause();
    };
  }, [enabled]);

  const toggleMusic = () => {
    if (enabled && waitingForGesture) {
      const audio = audioRef.current;
      if (audio) {
        void audio.play().then(() => setWaitingForGesture(false)).catch((error: unknown) => {
          console.error("Could not start the relaxing music.", error);
        });
      }
      return;
    }
    const nextEnabled = !enabled;
    try {
      localStorage.setItem(MUSIC_PREFERENCE_KEY, nextEnabled ? "on" : "off");
    } catch (error) {
      console.error("Could not save the relaxing music preference.", error);
    }
    setEnabled(nextEnabled);
  };

  return (
    <>
      <button
        className={`${className} ${enabled ? "music-active" : ""}`}
        type="button"
        onClick={toggleMusic}
        aria-label={!enabled ? "Play relaxing music" : waitingForGesture ? "Start relaxing music" : "Turn relaxing music off"}
        title={!enabled ? "Play relaxing music" : waitingForGesture ? "Tap to start relaxing music" : "Turn relaxing music off"}
      >
        {!enabled ? <VolumeX size={17} /> : waitingForGesture ? <Music2 size={17} /> : <Volume2 size={17} />}
      </button>
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}relaxing-music.mp3`} loop preload="auto" />
    </>
  );
}
