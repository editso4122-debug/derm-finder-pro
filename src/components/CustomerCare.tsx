import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Bot, User, Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
}

const featureInfo: Record<string, string> = {
  "skin analysis": "Our AI-powered Skin Analysis feature uses advanced image recognition to analyze skin conditions. Simply upload a photo of your skin concern, and our AI will provide insights about potential conditions, along with care recommendations.",
  "doctor finder": "The Doctor Finder helps you locate dermatologists near you. Enter your pin code or city name, and we'll show you nearby skin specialists with their contact information, ratings, and Google Maps directions.",
  "how to use": "To use MediBot: 1) Navigate to the Skin Analysis section and upload an image of your skin concern. 2) Our AI will analyze it and provide insights. 3) Use the Doctor Finder to locate dermatologists near you if needed.",
  "features": "MediBot offers: 1) AI-Powered Skin Analysis - Upload images for condition detection 2) Doctor Finder - Locate dermatologists near you 3) Customer Care - Get help with any issues or questions.",
  "accuracy": "Our AI model is trained on thousands of dermatological images and provides educational insights. However, it's not a substitute for professional medical advice. Always consult a dermatologist for accurate diagnosis.",
  "privacy": "Your privacy is our priority. Images uploaded for analysis are processed securely and are not stored permanently. We do not share your data with third parties.",
};

const CustomerCare = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! Welcome to MediBot Customer Care. How can I help you today? You can:\n\n• Ask about MediBot features\n• Report an issue you're facing\n\nJust type your message below!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [reportedIssue, setReportedIssue] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: "bot" | "user", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type, content },
    ]);
  };

  const handleFeatureQuery = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, value] of Object.entries(featureInfo)) {
      if (lowerQuery.includes(key)) {
        return value;
      }
    }
    
    if (lowerQuery.includes("what") || lowerQuery.includes("how") || lowerQuery.includes("tell")) {
      return featureInfo["features"];
    }
    
    return null;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");

    const lowerMessage = userMessage.toLowerCase();

    // Check if user wants to report an issue
    if (
      lowerMessage.includes("report") ||
      lowerMessage.includes("issue") ||
      lowerMessage.includes("problem") ||
      lowerMessage.includes("bug") ||
      lowerMessage.includes("not working") ||
      lowerMessage.includes("error")
    ) {
      setTimeout(() => {
        addMessage(
          "bot",
          "I'm sorry to hear you're facing an issue. Please describe the problem in detail, and I'll help you report it to our team."
        );
        setIsReportingIssue(true);
      }, 500);
      return;
    }

    // Check if asking about features
    const featureResponse = handleFeatureQuery(userMessage);
    if (featureResponse) {
      setTimeout(() => {
        addMessage("bot", featureResponse);
      }, 500);
      return;
    }

    // Default response
    setTimeout(() => {
      addMessage(
        "bot",
        "I can help you with:\n\n• Information about MediBot features (skin analysis, doctor finder, etc.)\n• Reporting issues or problems\n\nPlease let me know what you'd like to know!"
      );
    }, 500);
  };

  const handleIssueSubmit = () => {
    if (!input.trim()) return;

    setReportedIssue(input.trim());
    addMessage("user", input.trim());
    setInput("");

    setTimeout(() => {
      addMessage(
        "bot",
        "Thank you for describing the issue. To help you better and send you updates, please provide your email address:"
      );
    }, 500);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    addMessage("user", email);

    try {
      const { data, error } = await supabase.functions.invoke("send-customer-email", {
        body: { email: email.trim(), issue: reportedIssue },
      });

      if (error) {
        throw error;
      }

      setTimeout(() => {
        addMessage(
          "bot",
          `Thank you! Your issue has been reported and our team has been notified. We'll review it and contact you at ${email} soon.\n\nIs there anything else I can help you with?`
        );
        setIsReportingIssue(false);
        setReportedIssue("");
        setEmail("");
      }, 500);

      toast.success("Issue reported successfully!");
    } catch (error: any) {
      console.error("Error sending email:", error);
      addMessage(
        "bot",
        "Sorry, there was an error sending the email. Please try again or contact us directly."
      );
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">MediBot Support</h3>
                  <p className="text-xs text-primary-foreground/70">We're here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.type === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "bot"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.type === "bot" ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-line ${
                      message.type === "bot"
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              {isReportingIssue && reportedIssue ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleEmailSubmit()}
                      className="pl-10"
                      disabled={isSending}
                    />
                  </div>
                  <Button onClick={handleEmailSubmit} disabled={isSending} size="icon">
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      isReportingIssue
                        ? "Describe your issue in detail..."
                        : "Type your message..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        isReportingIssue ? handleIssueSubmit() : handleSend();
                      }
                    }}
                    className="min-h-[44px] max-h-[100px] resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={isReportingIssue ? handleIssueSubmit : handleSend}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerCare;
