import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Bell } from 'lucide-react';
import { getSocket } from '../services/socket.js';

export function PatientCallBanner() {
  const [activeCall, setActiveCall] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    const handlePatientCalled = (data) => {
      if (data && data.patientToken) {
        const callObj = {
          patientToken: data.patientToken,
          roomName: data.roomName || 'Exam Bay',
          message: data.message,
          timestamp: new Date().toLocaleTimeString(),
        };
        setActiveCall(callObj);

        if (audioEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const text = `Attention please. Patient ${data.patientToken}, please report to ${data.roomName || 'your assigned examination room'}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.error('Speech synthesis error:', e);
          }
        }

        const timer = setTimeout(() => {
          setActiveCall(prev => (prev?.patientToken === data.patientToken ? null : prev));
        }, 12000);

        return () => clearTimeout(timer);
      }
    };

    socket.on('patient:called', handlePatientCalled);
    return () => {
      socket.off('patient:called', handlePatientCalled);
    };
  }, [audioEnabled]);

  if (!activeCall) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl px-4 py-3 border-b border-emerald-400/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-emerald-100 flex items-center gap-2">
              <span>Patient Call Announcement</span>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
            <div className="text-lg md:text-xl font-bold tracking-tight">
              Patient <span className="bg-black/30 px-2.5 py-0.5 rounded font-mono text-cyan-200">{activeCall.patientToken}</span> — Please proceed to <span className="underline decoration-cyan-300 font-extrabold">{activeCall.roomName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-xs font-medium backdrop-blur transition-colors cursor-pointer"
            title={audioEnabled ? 'Mute announcement audio' : 'Enable voice announcement'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-200" /> : <VolumeX className="w-4 h-4 text-red-200" />}
            <span>{audioEnabled ? 'Audio Chime ON' : 'Audio Muted'}</span>
          </button>
          <button
            onClick={() => setActiveCall(null)}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
