"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "3rem",
          fontFamily: "sans-serif",
          background: "#000",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#888", marginBottom: "1rem" }}>A critical error occurred.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            color: "#7cf",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
