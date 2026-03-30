export default function Header({ title = "Overview", onSignOut }) {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="flex justify-between items-center px-8 py-4">
        {/* Left: Page Title */}
        <h1 className="text-2xl font-semibold text-gray-700">{title}</h1>

        {/* Right: Sign Out */}
        <button
          onClick={onSignOut}
          className="text-gray-500 font-semibold hover:text-[#0E9CD9] transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>

      {/* Subtle underline shadow */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-transparent shadow-sm" />
    </header>
  );
}
