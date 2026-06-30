import React, { useState, useEffect, useRef } from 'react';
import { Task, Goal } from '../types';
import { Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X, Play, Loader2 } from 'lucide-react';

interface VoiceAssistantProps {
  tasks: Task[];
  goals: Goal[];
  onAddTaskViaVoice: (task: any) => void;
  onNavigate: (tab: string) => void;
  onClose: () => void;
}

export default function VoiceAssistant({ tasks, goals, onAddTaskViaVoice, onNavigate, onClose }: VoiceAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; timestamp: string }[]>([
    { sender: 'assistant', text: "Hello! I am your active Deadline Guardian Assistant. Ask me 'What should I work on now?' or 'Add assignment due Friday' to coordinate your schedule hands-free.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text to Speech voice synthesizer helper
  const speakText = (text: string) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    
    // Stop any currently running speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to select a good professional female sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira") || v.lang === "en-US");
    if (targetVoice) utterance.voice = targetVoice;

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const query = queryToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: query,
          tasks,
          goals
        })
      });

      const data = await response.json();
      if (data.responseText) {
        const assistantMsg = {
          sender: 'assistant' as const,
          text: data.responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
        speakText(data.responseText);

        // Execute actions if parsed
        if (data.action === 'add_task' && data.parsedTask) {
          onAddTaskViaVoice(data.parsedTask);
        } else if (data.action === 'recommend') {
          onNavigate('rescue');
        } else if (data.action === 'risk_check') {
          onNavigate('home');
        } else if (data.action === 'generate_plan') {
          onNavigate('planner');
        }
      }
    } catch (error) {
      console.error("Failed to parse voice command:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition API is not supported in this browser. Try using the typed text assistant instead!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-full glass-panel border border-brand-indigo/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 glow-indigo" id="voice-assistant-panel">
      {/* Header */}
      <div className="bg-app-bg/95 p-4 border-b border-app-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-indigo w-4.5 h-4.5 animate-pulse" />
          <span className="font-display font-bold text-xs text-app-text-primary">Active AI Voice Companion</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            id="toggle-speech-synth"
            onClick={() => {
              setSpeechEnabled(!speechEnabled);
              if (speechEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
            }}
            className="text-app-text-secondary hover:text-app-text-primary p-1 rounded"
            title={speechEnabled ? "Mute responses" : "Read responses aloud"}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            id="close-voice-assistant"
            onClick={onClose}
            className="text-app-text-secondary hover:text-app-text-primary p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 p-4 space-y-3.5 max-h-[300px] overflow-y-auto min-h-[220px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-brand-indigo text-black font-semibold rounded-tr-none'
                : 'bg-app-surface border border-app-border text-app-text-primary rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            <span className="text-[9px] text-app-text-secondary font-mono mt-1">{msg.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-[10px] text-brand-indigo italic font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Core intelligence thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Inputs controls */}
      <div className="p-3 bg-app-bg/95 border-t border-app-border flex items-center gap-2">
        {/* Toggle Speech Microphone */}
        <button
          id="mic-activate-btn"
          onClick={toggleListening}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-brand-violet text-white animate-pulse'
              : 'bg-app-surface text-app-text-secondary hover:text-app-text-primary border border-app-border'
          }`}
          title={isListening ? "Listening... click to submit" : "Activate Speech Input"}
        >
          {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
        </button>

        {/* Text Field input */}
        <input
          id="text-assistant-input"
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={isListening ? "Say your command..." : "Type command, e.g. 'What next?'"}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-app-surface border border-app-border text-app-text-primary text-xs rounded-xl p-3 focus:outline-none focus:border-brand-indigo"
        />

        <button
          id="submit-text-command-btn"
          onClick={() => handleSendMessage()}
          className="p-3 bg-brand-indigo text-black hover:bg-brand-indigo/90 rounded-xl transition-all cursor-pointer font-semibold"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
