import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Menu, X, Pill } from "lucide-react";

const GooeyNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{
    name: "Home",
    href: "#home"
  }, {
    name: "Analyze",
    href: "#analyze"
  }, {
    name: "Find Doctor",
    href: "#doctors"
  }, {
    name: "About",
    href: "#about"
  }];
  return <>
      {/* SVG Filter for Gooey Effect */}
      <svg className="hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Gooey background blobs */}
            <div className="absolute inset-0 gooey-filter">
              <motion.div className="absolute -left-4 -top-2 w-32 h-16 bg-secondary/80 rounded-full" animate={{
              scale: [1, 1.1, 1],
              x: [0, 5, 0]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }} />
              <motion.div className="absolute left-20 -top-1 w-full h-14 bg-secondary/90 rounded-full" animate={{
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }} />
              <motion.div className="absolute -right-4 -top-2 w-32 h-16 bg-secondary/80 rounded-full" animate={{
              scale: [1, 1.1, 1],
              x: [0, -5, 0]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }} />
            </div>

            {/* Navbar content */}
            <div className="relative flex items-center justify-between px-6 py-3">
              {/* Logo */}
              <motion.a href="#home" className="flex items-center gap-2 text-foreground" whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
                <div className="relative">
                  <Activity className="w-8 h-8 text-primary" />
                  <motion.div className="absolute inset-0 bg-primary/30 rounded-full blur-md" animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }} transition={{
                  duration: 2,
                  repeat: Infinity
                }} />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">
                  ​medi<span className="text-primary">​bot</span>
                </span>
              </motion.a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item, index) => <motion.a key={item.name} href={item.href} className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} initial={{
                opacity: 0,
                y: -10
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: index * 0.1
              }}>
                    {item.name}
                    <motion.div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full" initial={{
                  width: 0
                }} whileHover={{
                  width: "60%"
                }} transition={{
                  duration: 0.2
                }} />
                  </motion.a>)}
              </div>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Link to="/medicine-scanner">
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-medium text-sm rounded-full border border-primary/30"
                    whileHover={{
                      scale: 1.05,
                      borderColor: "hsl(174 72% 50% / 0.6)"
                    }}
                    whileTap={{
                      scale: 0.95
                    }}
                  >
                    <Pill className="w-4 h-4 text-primary" />
                    Scan Medicine
                  </motion.div>
                </Link>
                <motion.a href="#analyze" className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-full shadow-lg shadow-primary/25" whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px hsl(174 72% 50% / 0.4)"
              }} whileTap={{
                scale: 0.95
              }}>
                  Start Analysis
                </motion.a>
              </div>

              {/* Mobile menu button */}
              <motion.button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} whileTap={{
              scale: 0.9
            }}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile menu */}
          <motion.div className="md:hidden overflow-hidden" initial={false} animate={{
          height: isOpen ? "auto" : 0
        }} transition={{
          duration: 0.3
        }}>
            <div className="bg-secondary/90 backdrop-blur-lg rounded-2xl mt-2 p-4 space-y-2">
              {navItems.map(item => <a key={item.name} href={item.href} className="block px-4 py-3 text-foreground hover:bg-primary/10 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  {item.name}
                </a>)}
              <Link 
                to="/medicine-scanner" 
                className="flex items-center gap-2 px-4 py-3 text-foreground hover:bg-primary/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Pill className="w-4 h-4 text-primary" />
                Scan Medicine
              </Link>
              <a href="#analyze" className="block px-4 py-3 bg-primary text-primary-foreground text-center rounded-lg font-medium" onClick={() => setIsOpen(false)}>
                Start Analysis
              </a>
            </div>
          </motion.div>
        </div>
      </nav>
    </>;
};
export default GooeyNavbar;