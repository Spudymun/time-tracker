"use client";

/**
 * app/global-error.tsx — граница ошибок для root layout.
 * Используется когда ошибка происходит прямо в app/layout.tsx.
 * Минимальный HTML (без доступа к layout).
 * ОБЯЗАН быть "use client" — требование Next.js.
 */
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#ffffff",
          color: "#18181b",
          textAlign: "center",
          padding: "16px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#70707a", margin: 0 }}>
          A critical error occurred. Please reload the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#5b5bd6",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
