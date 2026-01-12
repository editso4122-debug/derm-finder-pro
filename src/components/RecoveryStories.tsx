import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, RefreshCw, User, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface RecoveryStory {
  name: string;
  age: number;
  story: string;
  recoveryTime: string;
}

interface RecoveryStoriesProps {
  condition: string;
  language: string;
}

const RecoveryStories = ({ condition, language }: RecoveryStoriesProps) => {
  const [stories, setStories] = useState<RecoveryStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("recovery-stories", {
        body: { condition, language },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.stories && data.stories.length > 0) {
        setStories(data.stories);
      } else {
        setError("No stories available at the moment.");
      }
    } catch (err) {
      console.error("Recovery stories error:", err);
      if (err instanceof Error) {
        if (err.message.includes("429") || err.message.includes("Rate limit")) {
          setError("Too many requests. Please wait a moment and try again.");
        } else if (err.message.includes("402") || err.message.includes("credits")) {
          setError("AI service temporarily unavailable.");
        } else {
          setError("Unable to load recovery stories. Please try again.");
        }
      } else {
        setError("Unable to load recovery stories.");
      }
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    if (condition && !hasLoaded) {
      fetchStories();
    }
  }, [condition]);

  if (!condition) return null;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Recovery Stories</h3>
              <p className="text-xs text-muted-foreground">
                Inspiring journeys from patients who recovered
              </p>
            </div>
          </div>
          {hasLoaded && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStories}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              New Stories
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">
                Finding inspiring recovery stories...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchStories}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          ) : stories.length > 0 ? (
            <motion.div
              key="stories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {stories.map((story, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-4 rounded-xl bg-background/50 border border-primary/10"
                >
                  {/* Sparkle decoration */}
                  <Sparkles className="absolute top-3 right-3 w-4 h-4 text-primary/30" />

                  {/* Story header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {story.name}, {story.age}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Recovered in {story.recoveryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Story content */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {story.story}
                  </p>
                </motion.div>
              ))}

              {/* Motivational footer */}
              <div className="text-center pt-2">
                <p className="text-xs text-primary/70 italic">
                  Remember: Every recovery journey is unique. These stories are meant to inspire hope.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RecoveryStories;
