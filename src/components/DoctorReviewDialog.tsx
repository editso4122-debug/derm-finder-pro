import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, X, Loader2, FileImage, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DoctorReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    name: string;
    specialty: string;
    city: string;
  };
}

const DoctorReviewDialog = ({ isOpen, onClose, doctor }: DoctorReviewDialogProps) => {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetDialog = () => {
    setStep("upload");
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    setRating(0);
    setHoverRating(0);
    setReviewText("");
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, WebP) or PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setPrescriptionFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPrescriptionPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview(null);
    }
  };

  const handleProceedToReview = () => {
    if (!prescriptionFile) {
      toast({
        title: "Prescription required",
        description: "Please upload a prescription to write a review.",
        variant: "destructive",
      });
      return;
    }
    setStep("review");
  };

  const handleSubmitReview = async () => {
    if (!prescriptionFile) {
      toast({
        title: "Prescription required",
        description: "Please upload a prescription to write a review.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating for the doctor.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review required",
        description: "Please write your review about the doctor.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit a review.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload prescription to storage
      const fileExt = prescriptionFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, prescriptionFile);

      if (uploadError) {
        throw new Error("Failed to upload prescription: " + uploadError.message);
      }

      // Get the URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);

      // Insert review into database
      const { error: insertError } = await supabase
        .from("doctor_reviews")
        .insert({
          user_id: user.id,
          doctor_name: doctor.name,
          doctor_specialty: doctor.specialty,
          doctor_location: doctor.city,
          rating: rating,
          review_text: reviewText.trim(),
          prescription_url: fileName, // Store path instead of public URL since bucket is private
        });

      if (insertError) {
        throw new Error("Failed to submit review: " + insertError.message);
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your experience.",
      });

      handleClose();
    } catch (error) {
      console.error("Review submission error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Write a Review
          </DialogTitle>
          <DialogDescription>
            Review for <span className="font-medium text-foreground">{doctor.name}</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Step 1: Upload Prescription</p>
                <p>To verify your visit, please upload a prescription from this doctor.</p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />

              {prescriptionFile ? (
                <div className="relative rounded-lg border border-border bg-secondary/30 p-4">
                  <button
                    onClick={() => {
                      setPrescriptionFile(null);
                      setPrescriptionPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {prescriptionPreview ? (
                    <img
                      src={prescriptionPreview}
                      alt="Prescription preview"
                      className="w-full h-40 object-contain rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      <FileImage className="w-12 h-12" />
                    </div>
                  )}
                  
                  <p className="text-sm text-center mt-2 truncate">{prescriptionFile.name}</p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Click to upload prescription</span>
                  <span className="text-xs">JPEG, PNG, WebP or PDF (max 5MB)</span>
                </button>
              )}

              <Button
                onClick={handleProceedToReview}
                disabled={!prescriptionFile}
                className="w-full"
              >
                Continue to Review
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Step 2: Write Your Review</p>
                <p>Share your experience with this doctor.</p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this doctor..."
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {reviewText.length}/1000
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || rating === 0 || !reviewText.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorReviewDialog;
