import { Activity, Heart } from "lucide-react";
const Footer = () => {
  return <footer id="about" className="relative py-16 px-4 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <a href="#home" className="flex items-center gap-2 mb-4">Medibot​<Activity className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg">Medi​<span className="text-primary">​</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered skin condition analysis using state-of-the-art machine learning models. 
              Not a replacement for professional medical advice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#home" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="#analyze" className="hover:text-primary transition-colors">Skin Analysis</a></li>
              <li><a href="#doctors" className="hover:text-primary transition-colors">Find Doctor</a></li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="font-display font-semibold mb-4">Medical Disclaimer</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This tool provides educational information only. It is not intended as a substitute 
              for professional medical advice, diagnosis, or treatment. Always consult with a 
              qualified healthcare provider.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DermAI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive" /> using AI
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;