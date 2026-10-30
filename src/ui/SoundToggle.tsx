import { useEffect, useState } from 'react';
import { isPlaying, onSoundChange, toggle } from '../audio/ambient';
import './sound-toggle.css';

/** Round top-right sound control. Animated waveform while music plays; flat line when muted. */
export function SoundToggle() {
  const [on, setOn] = useState(isPlaying());
  useEffect(() => {
    const off = onSoundChange(setOn);
    return () => {
      off();
    };
  }, []);
  return (
    <button
      type="button"
      className="sound-toggle"
      data-on={on || undefined}
      aria-pressed={on}
      aria-label={on ? 'Mute music' : 'Unmute music'}
      title={on ? 'Mute music' : 'Unmute music'}
      onClick={() => void toggle()}
    >
      <span className="sound-toggle__bars" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} style={{ animationDelay: `${i * -0.23}s` }} />
        ))}
      </span>
      <span className="sound-toggle__label">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
