'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [mood, setMood] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const toggleAmbientAudio = (start: boolean) => {
    if (!start) {
      oscillatorsRef.current.forEach((osc) => osc.stop());
      oscillatorsRef.current = [];
      setIsPlayingSound(false);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(110, ctx.currentTime); 
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(114, ctx.currentTime); 
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();

      oscillatorsRef.current = [osc1, osc2];
      setIsPlayingSound(true);
    } catch (e) {
      console.error('Web Audio API unsupported:', e);
    }
  };

  const handleGenerateMeditation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;

    setLoading(true);
    setScript('');
    toggleAmbientAudio(true); 

    try {
      const response = await fetch('/api/meditate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });

      // Directly extracts the complete ChatGPT / Gemini-style text block from the backend
      const responseText = await response.text();
      setScript(responseText);

    } catch (err) {
      console.error('Text Extraction Error:', err);
      setScript('The response generation pipeline hit a temporary error chunk. Let us retry!');
      toggleAmbientAudio(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-slate-100">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl transition-all duration-500">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
            ZenithAI
          </h1>
          <p className="text-sm text-slate-400 mt-2 tracking-wide uppercase">
            Where deep tech meets deep peace
          </p>
        </div>

        <form onSubmit={handleGenerateMeditation} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              How is your mind feeling at this precise millisecond?
            </label>
            <textarea
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Ex: I feel overwhelmed by work deadlines and scattered..."
              rows={3}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !mood.trim()}
            className="w-full h-12 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-semibold rounded-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-teal-500/10"
          >
            {loading ? 'Processing Input Channels...' : 'Generate Instant Session'}
          </button>
        </form>

        {(script || isPlayingSound) && (
          <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPlayingSound ? 'bg-teal-400 animate-pulse' : 'bg-rose-400'}`} />
                {isPlayingSound ? 'Ambient Frequency Generator: ACTIVE (110Hz / 114Hz)' : 'Audio Off'}
              </span>
              {isPlayingSound && (
                <button
                  onClick={() => toggleAmbientAudio(false)}
                  className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 transition"
                >
                  Mute Sound
                </button>
              )}
            </div>

            {script && (
              <div className="p-6 bg-slate-950/40 rounded-2xl border border-white/5 min-h-[100px]">
                <p className="text-lg leading-relaxed font-light text-cyan-50/90 whitespace-pre-wrap">
                  {script}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
