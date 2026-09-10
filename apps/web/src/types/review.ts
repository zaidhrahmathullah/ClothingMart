export type ReviewUser = {
    id: string;
    name: string;
  };
  
  export type Review = {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    user: ReviewUser;
  };
  
  export type ReviewResponse = {
    reviews: Review[];
    averageRating: number;
    reviewCount: number;
  };