import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <Container>
        <div className="flex flex-col gap-4 py-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-neutral-950">
              ClothingMart
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Modern fashion, made simple.
            </p>
          </div>

          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} ClothingMart. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}