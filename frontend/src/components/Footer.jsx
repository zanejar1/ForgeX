export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t border-neutral-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-center text-xs text-neutral-500">
        © {year} ForgeX
      </div>
    </footer>
  )
}
