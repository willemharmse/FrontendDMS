import React, { useEffect, useRef, useState, useCallback } from 'react';

function formatTime(s) {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export default function MiniAudioPlayer({ src, className = '' }) {
    const audioRef = useRef(null);
    const rafRef = useRef(null);

    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [seeking, setSeeking] = useState(false);

    // Keep UI in sync with playback with rAF (smoother than timeupdate)
    const tick = useCallback(() => {
        const a = audioRef.current;
        if (a && !seeking) setCurrent(a.currentTime || 0);
        rafRef.current = requestAnimationFrame(tick);
    }, [seeking]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const onLoadedMetadata = () => {
        const a = audioRef.current;
        setDuration(a?.duration || 0);
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
        setPlaying(false);
        setCurrent(0);
    };

    const toggle = () => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) a.play();
        else a.pause();
    };

    const onSeekStart = () => setSeeking(true);
    const onSeek = (e) => {
        const val = Number(e.target.value);
        setCurrent(val);
    };
    const onSeekEnd = (e) => {
        const a = audioRef.current;
        const val = Number(e.target.value);
        if (a) a.currentTime = val;
        setSeeking(false);
    };

    return (
        <div className={`mini-audio ${className}`}>
            {/* Visually hidden native element retains media semantics/keyboard shortcuts */}
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={onLoadedMetadata}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
            />

            <button
                type="button"
                className="mini-audio__btn"
                onClick={toggle}
                aria-label={playing ? 'Pause audio' : 'Play audio'}
            >
                {playing ? '❚❚' : '►'}
            </button>

            <div className="mini-audio__times">
                <span className="mini-audio__time">{formatTime(current)}</span>
            </div>

            <input
                className="mini-audio__seek"
                type="range"
                min={0}
                max={Math.max(duration, 0)}
                step="0.1"
                value={Math.min(current, duration || 0)}
                onMouseDown={onSeekStart}
                onTouchStart={onSeekStart}
                onChange={onSeek}
                onMouseUp={onSeekEnd}
                onTouchEnd={onSeekEnd}
                aria-label="Audio timeline"
            />

            <div className="mini-audio__times mini-audio__times--end">
                <span className="mini-audio__time">{formatTime(duration)}</span>
            </div>
        </div>
    );
}
