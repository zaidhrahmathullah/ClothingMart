import CategorySection from "@/features/home/CategorySection";
import FeaturedProducts from "@/features/home/FeaturedProducts";
import Hero from "@/features/home/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
    </>
  );
}