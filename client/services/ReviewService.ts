export interface Review {
  id: string;
  chefId: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
}

export const ReviewService = {
  /**
   * Retrieves all verified ratings reviews.
   */
  async getReviews(): Promise<Review[]> {
    // Return standard mock review log listings
    return [
      { id: "rev-1", chefId: "chef-maria", name: "Jessica M.", rating: 5, text: "Chef Maria's meals are absolutely delicious! My kids love the homemade organic chicken pot roast. Grateful for her tidy cleanup!", date: "May 20, 2026", verified: true },
      { id: "rev-2", chefId: "chef-maria", name: "David R.", rating: 5, text: "Healthy, fresh and always on schedule. Maria's weekly meal preps are an absolute lifesaver.", date: "May 18, 2026", verified: true },
      { id: "rev-3", chefId: "chef-maria", name: "Sarah J.", rating: 5, text: "Excellent execution on all fronts. Maria adjusted spice ranges perfectly to suit child diets.", date: "May 15, 2026", verified: true },
      { id: "rev-4", chefId: "chef-priya", name: "Amanda T.", rating: 5, text: "Outstanding Indian meal preps. Truly premium comfort food.", date: "May 12, 2026", verified: true }
    ];
  },

  /**
   * Retrieves review metrics for a specific chef.
   */
  async getReviewsByChef(chefId: string): Promise<Review[]> {
    const all = await this.getReviews();
    return all.filter(r => r.chefId === chefId);
  }
};
