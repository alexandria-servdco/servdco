import { ShieldAlert, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReviewsSupabaseService, reviewQueryKeys } from "@/services/supabase/reviews.service";

export function ContentModeration() {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [...reviewQueryKeys.all, "admin"],
    queryFn: () => ReviewsSupabaseService.listAllAdmin(),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => ReviewsSupabaseService.softDeleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
  });

  const flagged = reviews.filter((r) => r.rating <= 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          padding: "20px",
          background: "rgba(255, 122, 89, 0.05)",
          border: "1px solid rgba(255, 122, 89, 0.2)",
          borderRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldAlert size={20} color="#FF7A59" />
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#FFF", margin: 0 }}>
              Review Moderation
            </h3>
            <p style={{ fontSize: "13px", color: "#A8A8A8", margin: "4px 0 0" }}>
              {reviews.length} total reviews · {flagged.length} low-rating flagged
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
          <Loader2 className="animate-spin" color="#FF7A59" size={20} />
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "24px" }}>
          No reviews to moderate yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {(flagged.length > 0 ? flagged : reviews.slice(0, 6)).map((review) => (
            <div
              key={review.id}
              style={{
                background: "rgba(25,25,25,0.4)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: review.rating <= 2 ? "#ef4444" : "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "inline-flex",
                    background:
                      review.rating <= 2
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(245, 158, 11, 0.1)",
                    padding: "2px 8px",
                    borderRadius: "100px",
                    marginBottom: "8px",
                  }}
                >
                  {review.rating <= 2 ? "Low Rating" : "Review"}
                </span>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#FFF", margin: 0 }}>
                  {review.name} · {review.rating}★
                </h4>
                <p style={{ fontSize: "12px", color: "#A8A8A8", margin: "4px 0 0" }}>
                  Chef profile {review.chefId.slice(0, 8)}… · {review.date}
                </p>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  color: "#F5F5F5",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                }}
              >
                {review.text || "(No comment)"}
              </div>
              <button
                type="button"
                onClick={() => deleteReview.mutate(review.id)}
                disabled={deleteReview.isPending}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#ef4444",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Trash2 size={14} /> Remove Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
