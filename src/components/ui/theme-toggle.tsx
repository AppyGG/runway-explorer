import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
      title={theme === "dark" ? "Switch to light" : "Switch to light"}
      className="inline-flex items-center justify-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                 focus:ring-indigo-500 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};
