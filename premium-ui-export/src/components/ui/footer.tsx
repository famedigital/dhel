"use client";

import { DIcons } from "dicons";
import { useTheme } from "next-themes";

function handleScrollTop() {
  window.scroll({
    top: 0,
    behavior: "smooth",
  });
}

const Footer = () => {
  const { setTheme } = useTheme();

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center rounded-full border border-dotted">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className="mr-3 rounded-full bg-black p-2 text-white dark:bg-background dark:text-white"
        >
          <DIcons.Sun className="h-5 w-5" strokeWidth={1} />
          <span className="sr-only">Light mode</span>
        </button>

        <button type="button" onClick={handleScrollTop}>
          <DIcons.ArrowUp className="h-3 w-3" />
          <span className="sr-only">Top</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className="ml-3 rounded-full p-2 text-black dark:bg-black dark:text-white"
        >
          <DIcons.Moon className="h-5 w-5" strokeWidth={1} />
          <span className="sr-only">Dark mode</span>
        </button>
      </div>
    </div>
  );
};

export default Footer;
