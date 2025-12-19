import Link from "next/link";
import { Player, User, ViewMode } from "@/lib/types";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  currentUser: User | null;
  players: Player[];
  setShowAddGameModal: (show: boolean) => void;
  handleEditStats: () => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  setMobileMenuOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  handleLogout: () => void;
}

export default function Header({ currentUser, players, setShowAddGameModal, handleEditStats, viewMode, setViewMode, setMobileMenuOpen, mobileMenuOpen, handleLogout }: HeaderProps) {

  return (
    <div>
      {/* Top bar - Modernized */}
      <div className="bg-[color:var(--color-nav)] backdrop-blur-md shadow-lg border-b border-[color:var(--color-border)] sticky top-0 z-50 transition-colors">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NBA2K Stat Tracker
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4 text-[color:var(--color-text)]">
              {currentUser && (
                <>
                  <button
                    onClick={() => setShowAddGameModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Add Game
                  </button>
                  <button
                    onClick={handleEditStats}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Edit Stats
                  </button>
                </>
              )}

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-4 py-2 border border-[color:var(--color-border)] rounded-xl bg-[color:var(--color-surface)] text-sm font-semibold text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-focus)] focus:border-transparent shadow-sm hover:shadow-md transition-all"
              >
                {players.length >= 2 && (
                  <option value="split">Split View</option>
                )}
                {players.length > 0 && (
                  <option value="player1">
                    {getDisplayPlayerName(players[0], currentUser)}
                  </option>
                )}
                {players.length > 1 && (
                  <option value="player2">
                    {getDisplayPlayerName(players[1], currentUser)}
                  </option>
                )}
              </select>

              <ThemeToggle className="hidden md:inline-flex" />

              {currentUser && (
                <div className="px-4 py-2 bg-[color:var(--color-surface-muted)] rounded-xl text-sm font-medium text-[color:var(--color-text)] border border-[color:var(--color-border)]">
                  {currentUser.display_name}
                </div>
              )}

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 text-sm font-medium text-[color:var(--color-text)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-muted)] border border-transparent hover:border-[color:var(--color-border)] rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-muted)] transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[color:var(--color-border)] py-4 space-y-3 text-[color:var(--color-text)]">
              <div className="flex items-stretch gap-3">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="w-2/3 px-4 py-2 border border-[color:var(--color-border)] rounded-xl bg-[color:var(--color-surface)] text-sm font-semibold text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-focus)] focus:border-transparent shadow-sm"
                >
                  {players.length >= 2 && (
                    <option value="split">Split View</option>
                  )}
                  {players.length > 0 && (
                    <option value="player1">
                      {getDisplayPlayerName(players[0], currentUser)}
                    </option>
                  )}
                  {players.length > 1 && (
                    <option value="player2">
                      {getDisplayPlayerName(players[1], currentUser)}
                    </option>
                  )}
                </select>
                <ThemeToggle className="flex-1" size="sm" />
              </div>

              {currentUser && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowAddGameModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Add Game
                  </button>
                  <button
                    onClick={() => {
                      handleEditStats();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Edit Stats
                  </button>
                </div>
              )}

              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 px-4 py-2 bg-[color:var(--color-surface-muted)] rounded-xl text-sm font-medium text-[color:var(--color-text)] border border-[color:var(--color-border)] text-center">
                    {currentUser.display_name}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-5 py-2 text-sm font-medium text-[color:var(--color-text)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-muted)] border border-transparent hover:border-[color:var(--color-border)] rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="w-full px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm text-center cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}