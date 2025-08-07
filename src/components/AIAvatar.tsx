import { motion } from "framer-motion";
import { Avatar } from "./ui/avatar";
import { Loader2 } from "lucide-react";

interface AIAvatarProps {
  isListening: boolean;
  isProcessing: boolean;
  message: string;
  response?: string;
}

export function AIAvatar({
  isListening,
  isProcessing,
  message,
  response,
}: AIAvatarProps) {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      {/* Avatar with animations */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.8,
            repeat: isListening ? Infinity : 0,
          }}
          className="relative"
        >
          <Avatar className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-600">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isListening || isProcessing ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: isListening || isProcessing ? Infinity : 0,
                }}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                ) : (
                  <motion.div
                    animate={{
                      scale: isListening ? [1, 0.8, 1] : 1,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isListening ? Infinity : 0,
                    }}
                    className="text-2xl"
                  >
                    🤖
                  </motion.div>
                )}
              </motion.div>
            </div>
          </Avatar>
        </motion.div>

        {/* Sound waves animation */}
        {isListening && (
          <div className="absolute -inset-6 flex items-center justify-center">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{
                  scale: [0.8, 2, 2],
                  opacity: [0.7, 0.3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: ring * 0.3,
                }}
                className="absolute w-full h-full border-2 border-indigo-300 rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="text-center min-h-[80px] flex flex-col justify-center max-w-md">
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="font-medium text-gray-700">
              Processing your request...
            </p>
            <p className="text-sm text-gray-500">Understanding: "{message}"</p>
          </motion.div>
        ) : isListening ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="font-medium text-indigo-600">Listening...</p>
            <p className="text-sm text-gray-500">
              Speak now or type your message
            </p>
          </motion.div>
        ) : response ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="font-medium text-green-600">AI Response:</p>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg text-left">
              <p className="font-medium text-gray-600 mb-2">
                Customer: "{message}"
              </p>
              <p className="text-gray-800">{response}</p>
            </div>
          </motion.div>
        ) : message ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="font-medium text-green-600">Request processed!</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              "Thank you! I've processed your request: '{message}'. I've updated
              your records and sent a confirmation. Is there anything else I can
              help you with today?"
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="font-medium text-gray-700">
              Hi! I'm your AI Receptionist
            </p>
            <p className="text-sm text-gray-500">
              Click the microphone to start speaking or type below
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
