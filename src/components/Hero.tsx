import { motion } from "framer-motion";
import { ArrowDown, Shield, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const features = [
    { icon: Brain, text: "AI-Powered Analysis" },
    { icon: Zap, text: "Instant Results" },
    { icon: Shield, text: "Privacy First" },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm text-primary font-medium">Powered by Advanced AI Models</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Skin Health
          <br />
          <span className="relative">
            <span className="text-primary">Intelligence</span>
            <motion.svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 20"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.path
                d="M 0 15 Q 150 0 300 15"
                fill="none"
                stroke="hsl(174 72% 50%)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </motion.svg>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Upload a photo and describe your symptoms. Our AI analyzes skin conditions 
          using BioMedCLIP, CLIP, and FLAN-T5 models to provide instant insights.
        </motion.p>

        {/* Features */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-base font-medium rounded-full shadow-lg shadow-primary/25"
          >
            <a href="#analyze">
              Start Free Analysis
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 px-8 text-base font-medium rounded-full border-border/50 bg-secondary/50"
          >
            <a href="#doctors">
              Find a Doctor
            </a>
          </Button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.a
            href="#analyze"
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs">Scroll to explore</span>
            <ArrowDown className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;