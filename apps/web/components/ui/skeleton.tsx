"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skeletonPulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}} />
      <div
        className={className}
        style={{
          borderRadius: "12px",
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.09) 50%, rgba(255, 255, 255, 0.04) 75%)",
          backgroundSize: "400% 100%",
          animation: "skeletonPulse 1.8s infinite ease-in-out",
          width: "100%",
          height: "20px",
          border: "1px solid rgba(255, 255, 255, 0.02)",
          ...style
        }}
        {...props}
      />
    </>
  );
}
