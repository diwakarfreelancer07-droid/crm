"use client";

import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Loader2, Volume2, VolumeX, Download, FastForward, Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WaveformPlayerProps {
    url: string;
}

export function WaveformPlayer({ url }: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState("0:00");
    const [currentTime, setCurrentTime] = useState("0:00");
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isError, setIsError] = useState(false);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#93c5fd", // blue-300
            progressColor: "#3b82f6", // blue-500
            cursorColor: "#1d4ed8", // blue-700
            barWidth: 2,
            barGap: 3,
            barRadius: 2,
            height: 48,
            normalize: true,
        });

        ws.on("error", (err) => {
            console.error("WaveSurfer error:", err);
            setIsError(true);
        });

        ws.on("ready", () => {
            setIsReady(true);
            setIsError(false);
            setDuration(formatTime(ws.getDuration()));
        });

        ws.on("timeupdate", (currentTime: number) => {
            setCurrentTime(formatTime(currentTime));
        });

        ws.on("finish", () => {
            setIsPlaying(false);
            ws.setTime(0);
        });

        // Manually fetch the blob to avoid chunked stream decoding issues with Next.js proxies
        const proxyUrl = `/api/calls/recording?url=${encodeURIComponent(url)}`;
        fetch(proxyUrl)
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.blob();
            })
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                ws.load(objectUrl);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setIsError(true);
            });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [url]);

    const handlePlayPause = () => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.playPause();
            setIsPlaying(wavesurferRef.current.isPlaying());
        }
    };

    const handleMuteToggle = () => {
        if (wavesurferRef.current && isReady) {
            const newMuted = !isMuted;
            wavesurferRef.current.setVolume(newMuted ? 0 : 1);
            setIsMuted(newMuted);
        }
    };

    const handleRateChange = (rate: number) => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.setPlaybackRate(rate);
            setPlaybackRate(rate);
        }
    };

    const handleSkip = (seconds: number) => {
        if (wavesurferRef.current && isReady) {
            const current = wavesurferRef.current.getCurrentTime();
            const target = current + seconds;
            // Clamp between 0 and duration
            const duration = wavesurferRef.current.getDuration();
            wavesurferRef.current.setTime(Math.max(0, Math.min(target, duration)));
        }
    };

    const handleDownload = () => {
        const proxyUrl = `/api/calls/recording?url=${encodeURIComponent(url)}`;
        const a = document.createElement("a");
        a.href = proxyUrl;
        a.download = `recording_${new Date().getTime()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (isError) {
        return (
            <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 w-full max-w-md">
                Failed to load audio recording.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 bg-gradient-to-r from-muted/50 to-muted/20 p-3 rounded-xl border border-border w-full max-w-[500px]">
            {/* Waveform Visualization */}
            <div className="w-full relative px-1">
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-md shadow-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-xs font-semibold text-muted-foreground tracking-wide">Fetching Secure Audio...</span>
                    </div>
                )}
                <div ref={containerRef} className="w-full cursor-pointer min-h-[48px]" />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleSkip(-5)}
                        disabled={!isReady}
                        title="Rewind 5s"
                    >
                        <Rewind className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        variant="default"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full shadow-sm mx-0.5"
                        onClick={handlePlayPause}
                        disabled={!isReady}
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleSkip(5)}
                        disabled={!isReady}
                        title="Skip 5s"
                    >
                        <FastForward className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="text-[11px] font-medium font-mono text-muted-foreground tabular-nums opacity-80">
                    {currentTime} <span className="mx-0.5">/</span> {duration}
                </div>

                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground hover:text-foreground"
                                disabled={!isReady}
                            >
                                {playbackRate}x
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[80px]">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <DropdownMenuItem
                                    key={rate}
                                    onClick={() => handleRateChange(rate)}
                                    className={`text-xs ${playbackRate === rate ? 'bg-secondary font-medium' : ''}`}
                                >
                                    {rate}x
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleMuteToggle}
                        disabled={!isReady}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleDownload}
                        disabled={!isReady}
                        title="Download Recording"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
