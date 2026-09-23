import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSend: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopMediaTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopMediaTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      setError('Microphone access was denied or is not supported. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlobRef.current && duration > 0) {
      onSend(audioBlobRef.current, duration);
    }
  };

  const togglePreview = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (audioElementRef.current) {
      if (isPlayingPreview) {
        audioElementRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={onCancel}
          className="ml-3 px-2 py-1 bg-white border border-red-300 rounded font-semibold text-red-700 hover:bg-red-100"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 text-white rounded-2xl border border-zinc-700 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center space-x-3">
        {isRecording ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-red-400">
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              <span>Recording Voice Note: {formatTime(duration)}</span>
            </div>
            {/* Live waveform animation bars */}
            <div className="flex items-center gap-0.5 h-4">
              {[40, 70, 90, 60, 80, 50, 90, 75, 60, 85].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={togglePreview}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
            >
              {isPlayingPreview ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </button>
            <span className="font-mono text-zinc-300 font-semibold">
              Voice Note Ready ({formatTime(duration)})
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Stop and preview"
          >
            <Square className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Review</span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Audio</span>
          </button>
        )}

        <button
          onClick={() => {
            stopMediaTracks();
            onCancel();
          }}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-colors"
          title="Discard Voice Note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
