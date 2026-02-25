/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { getVeterinaryAdvice } from './services/geminiService';
import { generateSpeech } from './services/ttsService';
import { 
  Stethoscope, 
  Dog, 
  Cat, 
  Beef, 
  Milk, 
  AlertTriangle, 
  Send, 
  RefreshCw,
  Info,
  ChevronRight,
  HeartPulse,
  Volume2,
  VolumeX
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ANIMALS = [
  { 
    id: 'kopek', 
    name: 'Köpek', 
    icon: Dog, 
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80',
    description: 'Sadık dostlarımızın sağlığı için.'
  },
  { 
    id: 'kedi', 
    name: 'Kedi', 
    icon: Cat, 
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    description: 'Minik dostlarımızın bakımı ve teşhisi.'
  },
  { 
    id: 'inek', 
    name: 'İnek', 
    icon: Beef, 
    color: 'bg-orange-100 text-orange-600 border-orange-200',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    description: 'Büyükbaş hayvan sağlığı ve verimliliği.'
  },
  { 
    id: 'koyun', 
    name: 'Koyun/Keçi', 
    icon: Milk, 
    color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=800&q=80',
    description: 'Küçükbaş hayvanların hastalık tespiti.'
  },
  { 
    id: 'buzagi', 
    name: 'Buzağı', 
    icon: HeartPulse, 
    color: 'bg-rose-100 text-rose-600 border-rose-200',
    image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
    description: 'Yeni doğanların hassas bakımı.'
  },
];

type Step = 'selection' | 'symptoms' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('selection');
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedAnimalData = ANIMALS.find(a => a.id === selectedAnimal);

  const handleAnimalSelect = (id: string) => {
    setSelectedAnimal(id);
    setStep('symptoms');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !symptoms.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    stopSpeaking();

    try {
      const advice = await getVeterinaryAdvice(selectedAnimal, symptoms);
      setResult(advice || 'Üzgünüm, bir yanıt oluşturulamadı.');
      setStep('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!result) return;
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    try {
      setIsSpeaking(true);
      if (audioUrl) {
        audioRef.current?.play();
        return;
      }

      // Clean markdown for better TTS
      const cleanText = result.replace(/[#*`]/g, '').slice(0, 1000); 
      const base64Audio = await generateSpeech(cleanText);
      const url = `data:audio/mp3;base64,${base64Audio}`;
      setAudioUrl(url);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      console.error("TTS failed", err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const resetForm = () => {
    setStep('selection');
    setSelectedAnimal('');
    setSymptoms('');
    setResult(null);
    setError(null);
    stopSpeaking();
    setAudioUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-emerald-100">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsSpeaking(false)} 
        className="hidden"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={resetForm}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <Stethoscope size={24} />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-lg leading-tight">Vet Niko</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Profesyonel Veteriner Desteği</p>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {step !== 'selection' && (
              <button 
                onClick={resetForm}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                <span className="hidden sm:inline">Başa Dön</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STEP 1: ANIMAL SELECTION */}
          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-serif italic text-slate-800"
                >
                  Hoş Geldiniz, Ben Niko.
                </motion.h2>
                <p className="text-slate-500 max-w-lg mx-auto text-lg">
                  Hangi hayvan dostumuz için yardıma ihtiyacınız var? Lütfen aşağıdan seçin.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ANIMALS.map((animal, index) => (
                  <motion.button
                    key={animal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnimalSelect(animal.id)}
                    className="group relative h-64 rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                  >
                    <img 
                      src={animal.image} 
                      alt={animal.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", animal.color)}>
                        <animal.icon size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-1">{animal.name}</h3>
                      <p className="text-xs text-white/70 font-medium">{animal.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: SYMPTOMS INPUT */}
          {step === 'symptoms' && selectedAnimalData && (
            <motion.div
              key="symptoms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", selectedAnimalData.color)}>
                  <selectedAnimalData.icon size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedAnimalData.name} Teşhis Formu</h2>
                  <p className="text-sm text-slate-500">Lütfen belirtileri mümkün olduğunca detaylı yazın.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                    Belirtiler ve Şikayetler
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={`Örn: ${selectedAnimalData.name} son 2 gündür iştahsız, ateşi var ve çok halsiz...`}
                    className="w-full min-h-[200px] p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none text-slate-700 text-lg"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('selection')}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Geri Dön
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !symptoms.trim()}
                    className={cn(
                      "flex-[2] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg",
                      loading || !symptoms.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.98]"
                    )}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        Niko Analiz Ediyor...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Analizi Başlat
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <p>
                  <strong>Unutmayın:</strong> Bu bilgiler yapay zeka tarafından sağlanır. Acil durumlarda hemen bir kliniğe gidin.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                  {/* Decorative background pattern */}
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Stethoscope size={120} />
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        {selectedAnimalData && <selectedAnimalData.icon size={32} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl">Niko'nun Teşhis Raporu</h3>
                        <p className="text-emerald-100 text-sm font-medium">En güncel veterinerlik verileriyle hazırlandı</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSpeak}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                        isSpeaking ? "bg-white text-emerald-600 animate-pulse" : "bg-emerald-500 text-white hover:bg-emerald-400"
                      )}
                      title={isSpeaking ? "Durdur" : "Sesli Dinle"}
                    >
                      {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                  </div>
                </div>
                
                <div className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-emerald-700 prose-li:text-slate-600">
                  <div className="markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Info size={16} />
                    <p className="text-xs italic">
                      Bu rapor {new Date().toLocaleDateString('tr-TR')} tarihinde Niko AI tarafından oluşturulmuştur.
                    </p>
                  </div>
                  <button 
                    onClick={resetForm}
                    className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                    Yeni Bir Analiz Başlat <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Yakındaki Klinikleri Bul</h4>
                    <p className="text-sm text-blue-700">Google Haritalar üzerinden size en yakın veterinerleri görüntüleyin.</p>
                  </div>
                </div>
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <Milk size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 mb-1">Beslenme Tavsiyeleri</h4>
                    <p className="text-sm text-emerald-700">İyileşme sürecinde hayvanınızın beslenmesi için özel öneriler.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm flex items-center gap-3"
            >
              <Info size={18} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
            <Stethoscope size={20} />
            <span className="font-bold tracking-tighter text-xl">Vet Niko</span>
          </div>
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Vet Niko. Hayvan sağlığı için teknoloji ile yanınızdayız.
          </p>
        </div>
      </footer>
    </div>
  );
}
