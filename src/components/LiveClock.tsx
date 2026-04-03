"use client";

import { useEffect, useState } from "react";

function getMDT() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(getMDT());

    const id = setInterval(() => {
      setTime(getMDT());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  if (time === null) return <span className="inline-block w-16" />;

  return <span>{time}</span>;
}
