import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <Container>
        <div className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold tracking-tight text-neutral-950">
              ClothingMart
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              Modern fashion, made simple.
            </p>
          </div>

          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} ClothingMart. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}