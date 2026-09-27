"use client";

import { useEffect } from "react";

export default function MotionEnhancements() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;

    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });

    elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.9) element.classList.add("in-view");
      observer.observe(element);
    });
    document.documentElement.classList.add("motion-ready");
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
