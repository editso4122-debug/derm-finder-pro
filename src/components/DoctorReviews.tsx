import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, User, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
}

interface DoctorReviewsProps {
  doctorName: string;
  doctorSpecialty?: string;
  doctorLocation?: string;
}

const DoctorReviews = ({ doctorName, doctorSpecialty, doctorLocation }: DoctorReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [doctorName]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("doctor_reviews")
        .select("id, rating, review_text, created_at, user_id")
        .eq("doctor_name", doctorName)
        .order("created_at", { ascending: false });

      if (doctorSpecialty) {
        query = query.eq("doctor_specialty", doctorSpecialty);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching reviews:", error);
        return;
      }

      if (data && data.length > 0) {
        setReviews(data);
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      } else {
        setReviews([]);
        setAverageRating(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted/50 rounded w-24" />
          <div className="h-3 bg-muted/30 rounded w-full" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground italic">No patient reviews yet</p>
      </div>
    );
  }

  const displayedReviews = isExpanded ? reviews : reviews.slice(0, 2);

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Summary */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Patient Reviews</span>
          {averageRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        <AnimatePresence mode="sync">
          {displayedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-secondary/30 rounded-lg p-2"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {renderStars(review.rating)}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {review.review_text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More/Less Toggle */}
      {reviews.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show {reviews.length - 2} more reviews
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default DoctorReviews;
