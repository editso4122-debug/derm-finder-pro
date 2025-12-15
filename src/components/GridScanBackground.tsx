import { motion } from "framer-motion";

const GridScanBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(174 72% 50% / 0.08) 1px, transparent 1px),
            linear-gradient(90deg, hsl(174 72% 50% / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsl(174 72% 50% / 0.15), hsl(174 72% 50% / 0.3), hsl(174 72% 50% / 0.15), transparent)',
        }}
        animate={{
          top: ['-10%', '110%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Horizontal scan lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{ top: `${20 + i * 15}%` }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(174 72% 50% / 0.1) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(199 89% 48% / 0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M 0 30 L 0 0 L 30 0"
            fill="none"
            stroke="hsl(174 72% 50%)"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-64 h-64 rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M 0 30 L 0 0 L 30 0"
            fill="none"
            stroke="hsl(174 72% 50%)"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </svg>
      </div>
    </div>
  );
};

export default GridScanBackground;