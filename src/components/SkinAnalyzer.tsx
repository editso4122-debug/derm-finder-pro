import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, AlertTriangle, CheckCircle, X, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  condition: string;
  confidence: number;
  description: string;
  severity: string;
  suggestedDoctor: string;
  symptomAnalysis: string;
  recommendations: string[];
  predictions: Array<{ disease: string; confidence: number }>;
}

// REMOVED: getDemoAnalysis function - all predictions must come from real ML model only

const SkinAnalyzer = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // REMOVED: useDemoMode state - no demo/fallback mode allowed

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please upload an image of the affected skin area.",
        variant: "destructive",
      });
      return;
    }

    if (!symptoms.trim()) {
      toast({
        title: "Symptoms required",
        description: "Please describe your symptoms for accurate analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("symptoms", symptoms);

      // STRICTLY use Flask backend - no fallback/demo logic
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Return actual error from backend - no fake results
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Analysis Complete",
        description: `Detected: ${data.condition} (${data.confidence}% confidence)`,
      });
    } catch (err) {
      // REMOVED: Demo mode fallback - if backend fails, show error only
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      console.error("Analysis error:", errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const getSeverityColor = (severity: string) => {
    if (severity.toLowerCase().includes("high")) return "text-destructive";
    if (severity.toLowerCase().includes("moderate")) return "text-yellow-500";
    return "text-primary";
  };

  return (
    <section id="analyze" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            AI Skin <span className="text-primary">Analysis</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload an image and describe your symptoms for AI-powered skin condition analysis
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                {/* Image Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
                    preview ? "border-primary/50" : "border-border hover:border-primary/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {preview ? (
                    <div className="relative aspect-square">
                      <img
                        src={preview}
                        alt="Uploaded skin image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                          <div className="text-center">
                            <Scan className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
                            <p className="text-sm text-muted-foreground">Analyzing with ML Model...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square cursor-pointer p-8">
                      <motion.div
                        className="p-4 rounded-full bg-primary/10 mb-4"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="w-8 h-8 text-primary" />
                      </motion.div>
                      <p className="text-foreground font-medium mb-1">
                        Drop your image here
                      </p>
                      <p className="text-muted-foreground text-sm">
                        or click to browse
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Symptoms Input */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Describe Your Symptoms
                  </label>
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="E.g., red itchy patches on arm, appeared 3 days ago, mild burning sensation..."
                    className="min-h-[120px] bg-secondary/50 border-border/50 resize-none"
                  />
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!image || !symptoms.trim() || isAnalyzing}
                  className="w-full mt-6 h-12 text-base font-medium"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running ML Model...
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5 mr-2" />
                      Analyze Skin Condition
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              {error ? (
                /* Error State - REMOVED: Demo fallback, shows actual error */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-destructive/50 bg-destructive/10 backdrop-blur-sm h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <h3 className="font-display text-xl font-semibold text-destructive">Analysis Failed</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{error}</p>
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <p className="text-sm font-medium mb-2">Troubleshooting:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Ensure your Flask backend (app.py) is running on port 5000</li>
                          <li>• Check that ML models are loaded successfully</li>
                          <li>• Verify the image is a valid JPG/PNG file</li>
                          <li>• Make sure symptoms are provided</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <h3 className="font-display text-xl font-semibold">Analysis Results</h3>
                        </div>
                        {/* REMOVED: Demo mode badge - only real ML results shown */}
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                          ML Model
                        </span>
                      </div>

                      {/* Primary Result */}
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                        <p className="text-sm text-muted-foreground mb-1">Detected Condition</p>
                        <p className="text-2xl font-display font-bold text-primary capitalize">
                          {result.condition}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            Confidence: <span className="font-semibold">{result.confidence}%</span>
                          </span>
                          <span className={`text-sm ${getSeverityColor(result.severity)}`}>
                            Severity: <span className="font-semibold">{result.severity}</span>
                          </span>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-2">AI Analysis</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.symptomAnalysis}
                        </p>
                      </div>

                      {/* Top Predictions */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Top Predictions</h4>
                        <div className="space-y-2">
                          {result.predictions.slice(0, 3).map((pred) => (
                            <div
                              key={pred.disease}
                              className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                            >
                              <span className="text-sm capitalize">{pred.disease}</span>
                              <span className="text-xs text-muted-foreground">
                                {(pred.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-500 text-sm mb-2">Important Notice</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {result.recommendations.map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm h-full flex items-center justify-center">
                    <CardContent className="text-center p-12">
                      <motion.div
                        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
                        animate={{ 
                          boxShadow: ["0 0 0 0 hsl(174 72% 50% / 0.2)", "0 0 0 20px hsl(174 72% 50% / 0)", "0 0 0 0 hsl(174 72% 50% / 0.2)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Camera className="w-10 h-10 text-primary" />
                      </motion.div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Ready to Analyze
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Upload a clear image of the affected skin area and describe your symptoms to get started
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SkinAnalyzer;
