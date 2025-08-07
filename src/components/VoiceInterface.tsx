import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mic, MicOff, Send, Keyboard } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceInterfaceProps {
  onVoiceInput: (message: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export function VoiceInterface({
  onVoiceInput,
  isListening,
  setIsListening,
}: VoiceInterfaceProps) {
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onVoiceInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.log("Speech recognition error:", event.error);
          setIsListening(false);
          // Fallback to demo text for common errors
          setTimeout(() => {
            const demoMessages = [
              "I'd like to schedule an appointment for next Tuesday at 2 PM",
              "What are your business hours?",
              "Do you accept insurance?",
              "I need to cancel my appointment",
            ];
            const randomMessage =
              demoMessages[Math.floor(Math.random() * demoMessages.length)];
            onVoiceInput(randomMessage);
          }, 500);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.start();
      } catch (error) {
        console.log("Speech recognition not available:", error);
        // Fallback to demo mode
        setIsListening(true);
        setTimeout(() => {
          onVoiceInput(
            "I'd like to schedule an appointment for next Tuesday at 2 PM"
          );
          setIsListening(false);
        }, 2000);
      }
    } else {
      // Fallback for browsers that don't support speech recognition
      console.log("Speech recognition not supported, using demo mode");
      setIsListening(true);
      setTimeout(() => {
        const demoMessages = [
          "I'd like to schedule an appointment for next Tuesday at 2 PM",
          "What are your business hours today?",
          "Do you accept walk-in customers?",
          "Can I speak to someone about your services?",
        ];
        const randomMessage =
          demoMessages[Math.floor(Math.random() * demoMessages.length)];
        onVoiceInput(randomMessage);
        setIsListening(false);
      }, 2000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Error stopping recognition:", error);
      }
    }
    setIsListening(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onVoiceInput(textInput.trim());
      setTextInput("");
    }
  };

  const handleSampleQuery = (query: string) => {
    onVoiceInput(query);
  };

  const sampleQueries = [
    "Schedule an appointment for Tuesday at 2 PM",
    "What are your business hours?",
    "I need to cancel my appointment",
    "Do you accept insurance?",
    "I'd like to speak to someone about pricing",
  ];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setInputMode("voice")}
            className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
              inputMode === "voice"
                ? "bg-white shadow-sm text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
              inputMode === "text"
                ? "bg-white shadow-sm text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Type</span>
          </button>
        </div>
      </div>

      {inputMode === "voice" ? (
        /* Voice Input */
        <div className="text-center space-y-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </motion.div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {isListening
                ? "Click to stop recording"
                : "Click to start speaking"}
            </p>
            {!(
              "webkitSpeechRecognition" in window ||
              "SpeechRecognition" in window
            ) && (
              <p className="text-xs text-yellow-600">
                Speech recognition not supported - will use demo messages
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Text Input */
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Type your message here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="pr-12"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!textInput.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Sample Queries */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Try these examples:</p>
        <div className="grid gap-2">
          {sampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuery(query)}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700 hover:text-gray-900"
            >
              "{query}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
