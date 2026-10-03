import React, { useLayoutEffect, useRef } from "react";

export default function ViewerHeading({ title, subtitle, children }) {
  const heading = useRef(null);
  useLayoutEffect(() => {
    const element = heading.current;
    const viewer = element.parentElement;
    const measure = () => {
      viewer.style.setProperty(
        "--viewer-content-top",
        `${element.offsetTop + element.offsetHeight + 10}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      viewer.style.removeProperty("--viewer-content-top");
    };
  }, []);
  return (
    <div className="viewer-heading" ref={heading}>
      <div className="viewer-title" aria-live="polite">
        <span>{title}</span>
        {subtitle && <span className="view-subtitle">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
