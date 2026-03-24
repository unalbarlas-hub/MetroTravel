import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";
import { API } from "@/App";

// Star Rating Input Component
function StarRating({ value, onChange, size = "md" }) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === "lg" ? "w-8 h-8" : "w-5 h-5";
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`${sizeClass} ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Category Rating Component
function CategoryRating({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star * 2)}
            className="focus:outline-none"
          >
            <Star
              className={`w-4 h-4 ${
                star * 2 <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Write Review Dialog
export function WriteReviewDialog({ booking, onReviewSubmitted }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
    categories: {
      cleanliness: 0,
      comfort: 0,
      location: 0,
      facilities: 0,
      staff: 0,
      value: 0
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error("Please select an overall rating");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hotel_id: booking.hotel_id,
          booking_id: booking.booking_id,
          rating: formData.rating,
          title: formData.title || null,
          comment: formData.comment || null,
          categories: formData.categories
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to submit review");
      }
      
      toast.success("Review submitted! Thank you for your feedback.");
      setOpen(false);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCategoryChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: value }
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary" data-testid="write-review-btn">
          <MessageSquare className="w-4 h-4 mr-2" />
          Write Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Your Stay</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hotel Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold">{booking.hotel_name}</h4>
            <p className="text-sm text-muted-foreground">
              {booking.check_in} - {booking.check_out}
            </p>
          </div>
          
          {/* Overall Rating */}
          <div className="text-center">
            <Label className="block mb-3">Overall Rating</Label>
            <StarRating
              value={formData.rating}
              onChange={(v) => setFormData(prev => ({ ...prev, rating: v }))}
              size="lg"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {formData.rating > 0 ? `${formData.rating}/10` : "Select a rating"}
            </p>
          </div>
          
          {/* Category Ratings */}
          <div className="border rounded-lg p-4">
            <Label className="block mb-2">Rate by Category</Label>
            <CategoryRating
              label="Cleanliness"
              value={formData.categories.cleanliness}
              onChange={(v) => handleCategoryChange("cleanliness", v)}
            />
            <CategoryRating
              label="Comfort"
              value={formData.categories.comfort}
              onChange={(v) => handleCategoryChange("comfort", v)}
            />
            <CategoryRating
              label="Location"
              value={formData.categories.location}
              onChange={(v) => handleCategoryChange("location", v)}
            />
            <CategoryRating
              label="Facilities"
              value={formData.categories.facilities}
              onChange={(v) => handleCategoryChange("facilities", v)}
            />
            <CategoryRating
              label="Staff"
              value={formData.categories.staff}
              onChange={(v) => handleCategoryChange("staff", v)}
            />
            <CategoryRating
              label="Value for Money"
              value={formData.categories.value}
              onChange={(v) => handleCategoryChange("value", v)}
            />
          </div>
          
          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title (optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
              className="mt-1"
            />
          </div>
          
          {/* Comment */}
          <div>
            <Label htmlFor="comment">Your Review (optional)</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with other travelers..."
              rows={4}
              className="mt-1"
            />
          </div>
          
          {/* Submit */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Display Review Component
export function ReviewCard({ review }) {
  return (
    <div className="border rounded-lg p-4" data-testid={`review-${review.review_id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{review.user_name}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#003580] text-white px-2 py-1 rounded">
          <Star className="w-4 h-4 fill-white" />
          <span className="font-bold">{review.rating}</span>
        </div>
      </div>
      
      {review.title && (
        <h4 className="font-medium mb-2">{review.title}</h4>
      )}
      
      {review.comment && (
        <p className="text-muted-foreground">{review.comment}</p>
      )}
      
      {/* Category Ratings */}
      {review.categories && Object.values(review.categories).some(v => v > 0) && (
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {Object.entries(review.categories)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => (
              <span key={key} className="bg-slate-100 px-2 py-1 rounded capitalize">
                {key}: {value}/10
              </span>
            ))}
        </div>
      )}
      
      {/* Hotel Response */}
      {review.response && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-[#003580]">
          <div className="text-sm font-medium text-[#003580]">Hotel Response</div>
          <p className="text-sm text-muted-foreground mt-1">{review.response}</p>
          {review.response_at && (
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(review.response_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reviews List Component
export function ReviewsList({ hotelId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  useState(() => {
    loadReviews();
  }, [hotelId, page]);
  
  const loadReviews = async () => {
    try {
      const response = await fetch(`${API}/reviews/hotel/${hotelId}?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No reviews yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <ReviewCard key={review.review_id} review={review} />
      ))}
      
      {total > 10 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 10 >= total}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
