import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Send, Loader2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

 interface VoiceAssistantProps {
   farmId?: string | null;
 }
 
 export function VoiceAssistant({ farmId }: VoiceAssistantProps) {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getLanguageCode = () => {
    switch (language) {
      case "ta": return "ta-IN";
      case "hi": return "hi-IN";
      case "tanglish": return "ta-IN"; // Use Tamil recognition for Tanglish
      default: return "en-IN";
    }
  };

  const startListening = () => {
    const win = window as any;
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.lang = getLanguageCode();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      sendMessage(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode();
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("farm-assistant", {
         body: { message: text, language, farmId },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't understand. Please try again.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response
      speakResponse(data.response);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Could not get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 sm:w-96 max-h-[500px] shadow-xl border-0 z-50 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{t.voiceAssistant}</h3>
            <p className="text-xs opacity-80">{t.askQuestion}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </Button>
      </div>

      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t.tapToSpeak}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] p-3 rounded-xl text-sm",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-card shadow-sm border"
              )}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t.thinking}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t bg-card">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopListening : startListening}
              className="shrink-0"
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.askQuestion}
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-center mt-2 text-primary animate-pulse">
              🎤 {t.listening}
            </p>
          )}
          {isSpeaking && (
            <p className="text-xs text-center mt-2 text-accent flex items-center justify-center gap-1">
              <Volume2 className="h-3 w-3" /> Speaking...
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}