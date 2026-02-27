"use client";

import React from "react";

interface StripProps {
  /** Array of strings to scroll — change these to any text you want */
  items?: string[];
  /** Animation speed in seconds (lower = faster) */
  speed?: number;
  /** Separator character between items */
  separator?: string;
}

const itemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "18px",
  paddingRight: "18px",
  fontFamily: "'Helvetica Neue Bold', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  color: "#000000",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
};

const dotStyle: React.CSSProperties = {
  display: "inline-block",
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: "#000000",
  flexShrink: 0,
};

export default function Strip({
  items = ["HEEVAS"],
  speed = 50,
  separator = "•",
}: StripProps) {
  // Repeat items enough times to guarantee the row is way wider than any screen
  const repeated = Array(30).fill(null).flatMap(() => items);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background: "#ffffff",
        borderTop: "1px solid #e0e0e0",
        borderBottom: "1px solid #e0e0e0",
        padding: "13px 0",
      }}
    >
      <style>{`
        @keyframes marquee-seamless {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .strip-inner {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marquee-seamless ${speed}s linear infinite;
        }
        .strip-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/*
        Two identical halves side by side.
        The animation shifts left by exactly 50% (= one full half),
        then snaps back to 0 — perfectly seamless, never any gap.
      */}
      <div className="strip-inner">
        {/* First half */}
        {repeated.map((text, i) => (
          <span key={`a-${i}`} style={itemStyle}>
            {text}
            {separator === "•" ? (
              <span style={dotStyle} />
            ) : (
              <span style={{ fontSize: "9px", color: "#000000", fontWeight: 900 }}>
                {separator}
              </span>
            )}
          </span>
        ))}
        {/* Second half — exact copy, enables seamless snap */}
        {repeated.map((text, i) => (
          <span key={`b-${i}`} style={itemStyle}>
            {text}
            {separator === "•" ? (
              <span style={dotStyle} />
            ) : (
              <span style={{ fontSize: "9px", color: "#000000", fontWeight: 900 }}>
                {separator}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}