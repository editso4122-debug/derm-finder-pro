import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pill, Upload, Camera, Loader2, AlertCircle } from "lucide-react";

const MedicineScanner = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const languageLabels: Record<string, string> = {
    en: "English",
    hi: "हिंदी (Hindi)",
    mr: "मराठी (Marathi)",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleVideoRef = (video: HTMLVideoElement | null) => {
    if (video && stream) {
      video.srcObject = stream;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setImage(imageData);
        setResult(null);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const analyzeMedicine = async () => {
    if (!image) {
      toast({
        title: "No Image",
        description: "Please upload or capture an image of the medicine first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("scan-medicine", {
        body: { image, language },
      });

      if (error) throw error;

      if (data?.result) {
        setResult(data.result);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Medicine analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <section id="medicine-scanner" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Pill className="w-4 h-4" />
            <span className="text-sm font-medium">Medicine Scanner</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Scan Medicine – Know Before You Use
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload or capture an image of any medicine to learn about its uses, ingredients, 
            and who should avoid it.
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Medicine Analyzer
            </CardTitle>
            <CardDescription>
              Upload a clear image of the medicine packaging or tablet strip
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Response Language:</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageLabels).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload/Capture Area */}
            {!image ? (
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center">
                <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-6">
                  Upload or capture an image of your medicine
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                        Browse Files
                      </span>
                    </Button>
                  </label>
                  <Button variant="outline" className="gap-2" onClick={openCamera}>
                    <Camera className="w-4 h-4" />
                    Click Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black/5 flex justify-center">
                  <img
                    src={image}
                    alt="Medicine"
                    className="max-h-64 object-contain"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={analyzeMedicine}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Pill className="w-4 h-4" />
                        Analyze Medicine
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetScanner}>
                    Upload Different Image
                  </Button>
                </div>
              </div>
            )}

            {/* Analysis Result */}
            {result && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Medicine Information</h3>
                </div>
                <div className="bg-muted/50 rounded-xl p-6 prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{result}</div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ This information is for educational purposes only. Always consult a healthcare professional before using any medication.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Dialog */}
        <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Capture Medicine Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={(el) => {
                    (videoRef as any).current = el;
                    handleVideoRef(el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full"
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-4 justify-center">
                <Button onClick={capturePhoto} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Capture
                </Button>
                <Button variant="outline" onClick={closeCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default MedicineScanner;
