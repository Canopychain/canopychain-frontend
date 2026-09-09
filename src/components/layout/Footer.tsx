export function Footer() {
  return (
    <footer className="border-t border-gray-200 px-6 py-8 text-sm text-gray-500 sm:px-12">
      <p>Canopychain — open source, built on Stellar.</p>
      <div className="mt-2 flex gap-4">
        <a
          href="https://github.com/canopychain"
          className="hover:text-black"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://github.com/canopychain/canopychain-docs"
          className="hover:text-black"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
      </div>
    </footer>
  );
}
