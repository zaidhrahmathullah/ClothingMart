export default function Footer() {
    return (
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-neutral-900">ClothingMart</p>
            <p className="mt-1 text-sm text-neutral-500">
              Modern fashion, made simple.
            </p>
          </div>
  
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} ClothingMart. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }