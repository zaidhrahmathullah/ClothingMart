export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  cardImageUrl: string | null;
  animationImageUrl: string | null;
  bannerImageUrl: string | null;
  isActive: boolean;
  children: Category[];
};