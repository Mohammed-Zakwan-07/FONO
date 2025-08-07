import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Avatar } from "./components/ui/avatar";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { AIAvatar } from "./components/AIAvatar";
import { VoiceInterface } from "./components/VoiceInterface";
import { FeatureCard } from "./components/FeatureCard";
import { Dashboard } from "./components/Dashboard";
import {
  Mic,
  Phone,
  MessageSquare,
  Clock,
  Users,
  Zap,
  CheckCircle2,
  Star,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { projectId, publicAnonKey } from "./utils/supabase/info";

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [showDashboard, setShowDashboard] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [formData, setFormData] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [useDemo, setUseDemo] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-8200c55f`;

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        setServerStatus("online");
        setUseDemo(false);
      } else {
        throw new Error("Server not responding correctly");
      }
    } catch (error) {
      console.log("Server is offline, using demo mode:", error);
      setServerStatus("offline");
      setUseDemo(true);
    }
  };

  const processWithAI = (
    message: string
  ): { response: string; formData?: any } => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("appointment") ||
      lowerMessage.includes("schedule") ||
      lowerMessage.includes("book")
    ) {
      const timeMatch = lowerMessage.match(/(\d{1,2})\s*(pm|am|o'clock)/i);
      const dayMatch = lowerMessage.match(
        /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)/i
      );

      const time = timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : "2:00 PM";
      const day = dayMatch ? dayMatch[1] : "Tuesday";

      return {
        response: `Perfect! I've scheduled your appointment for ${day} at ${time}. You'll receive a confirmation email shortly with all the details. Is there anything else I can help you with today?`,
        formData: {
          type: "appointment",
          customerName: "Demo User",
          customerEmail: "demo@example.com",
          customerPhone: "(555) 123-4567",
          appointmentDate: day,
          appointmentTime: time,
          service: "General Consultation",
          status: "confirmed",
        },
      };
    } else if (
      lowerMessage.includes("hours") ||
      lowerMessage.includes("open") ||
      lowerMessage.includes("close")
    ) {
      return {
        response:
          "We're open Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 4:00 PM. We're closed on Sundays. Is there a specific time you'd like to visit?",
      };
    } else if (lowerMessage.includes("cancel")) {
      return {
        response:
          "I can help you cancel your appointment. Could you please provide your name or appointment confirmation number so I can locate your booking?",
      };
    } else if (
      lowerMessage.includes("insurance") ||
      lowerMessage.includes("payment") ||
      lowerMessage.includes("cost")
    ) {
      return {
        response:
          "We accept most major insurance plans including Blue Cross Blue Shield, Aetna, Cigna, and UnitedHealthcare. We also offer flexible payment options. Would you like me to verify your specific insurance coverage?",
      };
    } else if (
      lowerMessage.includes("wait time") ||
      lowerMessage.includes("how long")
    ) {
      return {
        response:
          "Current wait times are approximately 15-20 minutes for walk-ins. However, I'd be happy to schedule you an appointment to avoid any wait. What time works best for you?",
      };
    } else {
      return {
        response:
          "Thank you for reaching out! I'd be happy to help you with that. Let me connect you with the right person who can assist you further. In the meantime, is there anything else I can help you with?",
      };
    }
  };

  const handleVoiceInput = async (message: string) => {
    setCurrentMessage(message);
    setIsProcessing(true);
    setAiResponse("");
    setFormData(null);

    try {
      if (useDemo || serverStatus === "offline") {
        // Demo mode - use local AI processing
        console.log("Using demo mode for processing");
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing time

        const result = processWithAI(message);
        setAiResponse(result.response);

        if (result.formData) {
          setFormData(result.formData);
          console.log("Demo: Form data processed locally:", result.formData);
        }
      } else {
        // Try to use real server
        const response = await fetch(`${serverUrl}/process-conversation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            message,
            sessionId,
            customerInfo: {
              name: "Demo User",
              email: "demo@example.com",
              phone: "(555) 123-4567",
            },
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Server Response:", result);

        if (result.success) {
          setAiResponse(result.response);

          if (result.formData) {
            setFormData(result.formData);
            await submitForm(result.formData);
          }
        } else {
          throw new Error("Server returned unsuccessful response");
        }
      }
    } catch (error) {
      console.error("Error processing conversation:", error);

      // Fallback to demo mode if server fails
      if (!useDemo) {
        console.log("Falling back to demo mode due to error");
        setUseDemo(true);
        setServerStatus("offline");

        const result = processWithAI(message);
        setAiResponse(result.response);

        if (result.formData) {
          setFormData(result.formData);
        }
      } else {
        setAiResponse(
          "I'm sorry, I'm experiencing technical difficulties. Please try again in a moment."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const submitForm = async (data: any) => {
    if (useDemo || serverStatus === "offline") {
      console.log("Demo: Form would be submitted to CRM:", data);
      console.log(
        "Demo: Email confirmation would be sent to:",
        data.customerEmail
      );
      return;
    }

    try {
      // Submit to CRM
      const crmResponse = await fetch(`${serverUrl}/submit-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000),
      });

      if (crmResponse.ok) {
        console.log("Form submitted to CRM successfully");

        // Send notification
        await fetch(`${serverUrl}/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            type: "appointment_confirmation",
            recipientEmail: data.customerEmail,
            recipientPhone: data.customerPhone,
            data,
          }),
          signal: AbortSignal.timeout(5000),
        });

        console.log("Notification sent successfully");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.log(
        "Form submission failed, data would be stored locally in production"
      );
    }
  };

  if (showDashboard) {
    return (
      <Dashboard onBack={() => setShowDashboard(false)} useDemo={useDemo} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">FONO</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                How it Works
              </a>
              <button
                onClick={() => setShowDashboard(true)}
                className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center space-x-1"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </nav>
            <div className="flex items-center space-x-4">
              {/* Server Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    serverStatus === "online"
                      ? "bg-green-500"
                      : serverStatus === "offline"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-xs text-gray-500">
                  {serverStatus === "online"
                    ? "Live"
                    : serverStatus === "offline"
                    ? "Demo"
                    : "Checking..."}
                </span>
              </div>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Notice */}
      {useDemo && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span>
                Demo Mode: Backend server unavailable, using local AI processing
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkServerStatus}
                className="text-yellow-800 hover:text-yellow-900"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-100 text-indigo-800 border-indigo-200">
              🚀 The Future of Customer Service
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              The receptionist that
              <span className="text-indigo-600 block">never sleeps</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Small businesses can't afford 24/7 human receptionists. Our
              AI-powered virtual receptionist listens to your customers,
              understands their requests, and responds instantly - all day,
              every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6">
                Try It Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-8 bg-white shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold mb-2">
                    Try the AI Receptionist
                  </h3>
                  <p className="text-gray-600">
                    Speak or type your message and watch the{" "}
                    {useDemo ? "demo" : "real"} automation happen
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${
                      useDemo
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    {useDemo ? "⚡ Demo Mode" : "✅ Live Backend"}
                  </Badge>
                </div>

                <AIAvatar
                  isListening={isListening}
                  isProcessing={isProcessing}
                  message={currentMessage}
                  response={aiResponse}
                />

                <VoiceInterface
                  onVoiceInput={handleVoiceInput}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />

                <div className="mt-6 space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {useDemo
                      ? "Demo speech-to-text processing"
                      : "Real speech-to-text processing"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {useDemo
                      ? "Local AI understanding and response"
                      : "Live AI understanding and response"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {useDemo
                      ? "Simulated CRM integration"
                      : "Automatic CRM integration"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {useDemo
                      ? "Mock email/SMS notifications"
                      : "Instant email/SMS notifications"}
                  </div>
                </div>

                {/* Form Data Display */}
                {formData && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      ✅ {useDemo ? "Demo" : "Automatically"} Processed:
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {formData.customerName}
                      </p>
                      <p>
                        <strong>Date:</strong> {formData.appointmentDate}
                      </p>
                      <p>
                        <strong>Time:</strong> {formData.appointmentTime}
                      </p>
                      <p>
                        <strong>Service:</strong> {formData.service}
                      </p>
                      <p className="text-green-600 font-medium">
                        ✅{" "}
                        {useDemo
                          ? "Demo: Would be saved to CRM & Email sent!"
                          : "Saved to CRM & Email sent!"}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Customer Inquiry
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      "Hi, I'd like to schedule an appointment for next Tuesday
                      at 2 PM"
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 shadow-lg border-2 border-indigo-200">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      AI Processing
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Converting speech → Understanding intent → Checking
                      availability → Booking appointment
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 shadow-lg border-2 border-green-200">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Automated Response
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      "Perfect! I've scheduled your appointment for Tuesday,
                      January 9th at 2:00 PM. You'll receive a confirmation
                      email shortly."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your business needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI receptionist handles everything from appointment booking to
              customer inquiries, seamlessly integrating with your existing
              systems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-indigo-600" />}
              title="24/7 Availability"
              description="Never miss a call or inquiry again. Your AI receptionist works around the clock."
            />
            <FeatureCard
              icon={<Mic className="w-8 h-8 text-indigo-600" />}
              title="Voice Recognition"
              description="Advanced speech-to-text technology understands natural conversation perfectly."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-indigo-600" />}
              title="Instant Processing"
              description="AI processes requests and provides responses in seconds, not minutes."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-indigo-600" />}
              title="Multi-Channel"
              description="Works with phone calls, web chat, and mobile app interactions."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-indigo-600" />}
              title="CRM Integration"
              description="Automatically syncs with your CRM and customer management systems."
            />
            <FeatureCard
              icon={<Phone className="w-8 h-8 text-indigo-600" />}
              title="Smart Routing"
              description="Routes complex queries to human staff when needed, with full context."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple automation that transforms customer interactions into
              business results
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Speech-to-Text",
                desc: "Customer speaks or types their request",
              },
              {
                step: "02",
                title: "AI Processing",
                desc: "Advanced AI understands intent and context",
              },
              {
                step: "03",
                title: "Data Integration",
                desc: "Syncs with CRM and Google Sheets automatically",
              },
              {
                step: "04",
                title: "Automated Response",
                desc: "Sends email/SMS confirmation instantly",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by growing businesses
            </h2>
            <div className="flex items-center justify-center space-x-1 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-400 fill-current"
                />
              ))}
              <span className="ml-2 text-gray-600">
                4.9/5 from 2,000+ businesses
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Our appointment bookings increased by 300% since implementing the AI receptionist. It never sleeps!",
                author: "Sarah Johnson",
                role: "Spa Owner",
                company: "Serenity Wellness",
              },
              {
                quote:
                  "We went from missing 40% of after-hours calls to capturing every single inquiry. Game changer.",
                author: "Michael Chen",
                role: "Practice Manager",
                company: "Downtown Dental",
              },
              {
                quote:
                  "The automation saved us 20 hours per week on administrative tasks. ROI was immediate.",
                author: "Lisa Rodriguez",
                role: "Clinic Director",
                company: "HealthFirst Medical",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10 bg-gray-200" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to never miss another customer?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Start your free trial today and transform your customer service in
            minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-6"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">AI Receptionist</span>
            </div>
            <p className="text-gray-400 mb-8">
              The receptionist that never sleeps
            </p>
            <div className="text-sm text-gray-400">
              © 2025 AI Receptionist. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
