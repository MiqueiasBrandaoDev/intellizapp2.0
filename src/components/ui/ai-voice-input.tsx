"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onRecordingComplete?: (audioBlob: Blob) => void;
  isRecording?: boolean;
  recordingTime?: number;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  onRecordingComplete,
  isRecording: externalIsRecording,
  recordingTime: externalRecordingTime,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);

  // Use external recording state if provided, otherwise use internal state
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : submitted;
  const displayTime = externalRecordingTime !== undefined ? externalRecordingTime : time;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run internal timer if not using external recording control
    if (externalIsRecording !== undefined) return;

    let intervalId: NodeJS.Timeout;

    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      onStop?.(time);
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [submitted, time, onStart, onStop, externalIsRecording]);

  useEffect(() => {
    // Only run demo mode if not using external recording control
    if (!isDemo || externalIsRecording !== undefined) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval, externalIsRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      // If external recording control is provided, call the callbacks
      if (externalIsRecording !== undefined) {
        if (externalIsRecording) {
          onStop?.(externalRecordingTime || 0);
        } else {
          onStart?.();
        }
      } else {
        // Otherwise use internal state
        setSubmitted((prev) => !prev);
      }
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            isRecording
              ? "bg-none"
              : "bg-none hover:bg-primary/10"
          )}
          type="button"
          onClick={handleClick}
        >
          {isRecording ? (
            <div
              className="w-6 h-6 rounded-sm animate-pulse bg-primary cursor-pointer pointer-events-auto"
              style={{ animationDuration: "1s" }}
            />
          ) : (
            <Mic className="w-6 h-6 text-primary" />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            isRecording
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {formatTime(displayTime)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                isRecording
                  ? "bg-primary/50 animate-pulse"
                  : "bg-muted-foreground/20 h-1"
              )}
              style={
                isRecording && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-muted-foreground">
          {isRecording ? "Gravando... Clique para parar" : "Clique para gravar"}
        </p>
      </div>
    </div>
  );
}
