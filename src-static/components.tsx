import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function BackgroundBeams({ className = "" }: { className?: string }) {
  const beamRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const beams = beamRef.current;
    if (!beams) return;
    const handleMove = (e: MouseEvent) => {
      const rect = beams.getBoundingClientRect();
      beams.style.setProperty("--beam-x", `${e.clientX - rect.left}px`);
      beams.style.setProperty("--beam-y", `${e.clientY - rect.top}px`);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);
  return <div ref={beamRef} className={`background-beams ${className}`} />;
}

export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useSpring(mouseX, { stiffness: 200, damping: 25 });
  const spotlightY = useSpring(mouseY, { stiffness: 200, damping: 25 });
  const background = useTransform([spotlightX, spotlightY], ([x, y]) =>
    `radial-gradient(520px circle at ${x}px ${y}px, rgba(34,211,238,0.18), transparent 70%)`
  );
  return (
    <div
      ref={containerRef}
      className={`spotlight ${className}`}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div className="spotlight-layer" style={{ background, opacity: isHovered ? 1 : 0 }} />
      {children}
    </div>
  );
}

export function TextGenerateEffect({ words, className = "" }: { words: string; className?: string }) {
  const parts = words.split(" ");
  return (
    <span className={className}>
      {parts.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="word"
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, delay: idx * 0.055 }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

export function SparklesCore({ className = "" }: { className?: string }) {
  const sparkles = Array.from({ length: 42 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 4,
    size: 2 + Math.random() * 4,
  }));
  return (
    <div className={`sparkles ${className}`}>
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="sparkle"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 0.2] }}
          transition={{ duration: 2.8, delay: s.delay, repeat: Infinity, repeatDelay: 1.2 }}
        />
      ))}
    </div>
  );
}

export function FloatingNav({ items }: { items: { name: string; href: string }[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.nav className="floating-nav" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}>
          {items.map((item) => (
            <a key={item.href} href={item.href}>{item.name}</a>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export function LampHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="lamp-header">
      <div className="lamp-glow" />
      <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="eyebrow">{eyebrow}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>{title}</motion.h2>
    </div>
  );
}
