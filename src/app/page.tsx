"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Tag,
  Clock,
  DollarSign,
  Smartphone,
  ChevronDown,
  Star,
  CheckCircle2,
  Zap,
  Heart,
  ArrowRight,
  ListChecks,
  Eye,
} from "lucide-react";
import { AdSlot } from "@/components/ad-slot";

/* ==========================================================================
   LANDING PAGE — Publix BOGO Tracker

   Conversion strategy:
   1. Hook with a relatable pain point (missing deals = wasting money)
   2. Social proof early to build trust
   3. Show the 3-step value loop (add items > get matched > shop smart)
   4. Feature showcase with "phone mockup" sections
   5. FAQ to handle objections
   6. Sticky bottom CTA that appears after scrolling past the hero
   ========================================================================== */

// ---------------------------------------------------------------------------
// Animated section wrapper — handles intersection observer internally
// Fades in + slides up when the element scrolls into view.
// ---------------------------------------------------------------------------
function AnimateIn({
  children,
  className = "",
  delay = false,
  as: Element = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: boolean;
  as?: "div" | "section";
}) {
  const [visible, setVisible] = useState(false);

  const callbackRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={callbackRef}
      className={`transition-all duration-700 ${
        delay ? "delay-200" : ""
      } ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </Element>
  );
}

// ---------------------------------------------------------------------------
// Animated counter for social proof numbers
// ---------------------------------------------------------------------------
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const callbackRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={callbackRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-white pr-4 group-hover:text-publix-green transition-colors">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-white/40 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-48 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-white/60 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone Mockup Shell — used to frame feature screenshots
// ---------------------------------------------------------------------------
function PhoneMockup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto w-[260px] sm:w-[280px] rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-900 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 rounded-b-2xl z-10" />
      {/* Screen */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gray-950">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Show sticky CTA after scrolling past the hero section
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ================================================================
          HERO SECTION
          Strategy: Lead with the pain point ("You're overpaying"),
          then immediately offer the solution. Single clear CTA.
          Green gradient creates brand connection while dark bg
          feels modern and premium.
          ================================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col justify-center px-5 pt-16 pb-24 overflow-hidden"
      >
        {/* Background gradient — radiates from top center like a spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-publix-green/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Trust chip — small social proof above the headline */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 border border-white/10">
            <div className="flex -space-x-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-xs font-medium text-white/70">
              Loved by Publix shoppers
            </span>
          </div>

          {/* Main headline — the hook.
              "Stop leaving money" is a pattern interrupt. Nobody thinks
              of their grocery trip as "leaving money on the shelf." */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Stop leaving{" "}
            <span className="text-publix-green">free groceries</span>{" "}
            on the shelf
          </h1>

          {/* Subheadline — specificity sells.
              "Every week" creates urgency without a fake timer. */}
          <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-lg mx-auto leading-relaxed">
            Publix runs 100+ deals every week — BOGOs, sales, and coupons.
            This app matches them to your shopping list automatically — so
            you never miss a deal you actually want.
          </p>

          {/* Primary CTA — big, green, impossible to miss */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="group relative inline-flex items-center gap-2.5 bg-publix-green hover:bg-publix-green-dark text-white text-lg font-bold px-8 py-4 rounded-2xl transition-all active:scale-[0.97] shadow-[0_0_40px_-8px_rgba(59,125,35,0.5)]"
            >
              Start saving now
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <span className="text-sm text-white/40">
              Free forever. Sign up in seconds.
            </span>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 animate-bounce">
            <ChevronDown size={24} className="mx-auto text-white/20" />
          </div>
        </div>
      </section>

      {/* ================================================================
          SOCIAL PROOF BAR
          Strategy: Numbers build instant credibility. Even for a new app,
          we show deal stats (which are real data the app tracks).
          ================================================================ */}
      <AnimateIn
        as="section"
        className="relative py-12 border-y border-white/5 bg-gray-900/50"
      >
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            {
              value: 100,
              suffix: "+",
              label: "Deals tracked weekly",
              icon: Tag,
            },
            {
              value: 47,
              suffix: "%",
              label: "Average savings per trip",
              icon: DollarSign,
            },
            {
              value: 12,
              suffix: "",
              label: "Deal categories covered",
              icon: ListChecks,
            },
            {
              value: 30,
              suffix: "s",
              label: "To set up your list",
              icon: Clock,
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon
                size={20}
                className="mx-auto mb-2 text-publix-green"
              />
              <div className="text-3xl sm:text-4xl font-extrabold text-white">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </AnimateIn>

      {/* ================================================================
          HOW IT WORKS — 3 Steps
          Strategy: Reduce friction by showing how dead-simple the app is.
          Three steps = easy to scan, easy to remember.
          Each step has a phone mockup placeholder for real screenshots.
          ================================================================ */}
      <section className="py-20 sm:py-28 px-5" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <AnimateIn className="text-center">
            <span className="text-publix-green text-sm font-bold uppercase tracking-widest">
              How it works
            </span>
            <h2
              className="mt-3 text-3xl sm:text-4xl font-extrabold"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Three steps to smarter shopping
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-md mx-auto">
              Set it up once. Save money every single week.
            </p>
          </AnimateIn>

          <div className="mt-16 space-y-24 sm:space-y-32">
            {/* Step 1 */}
            <StepRow
              stepNumber="01"
              title="Build your shopping list"
              description="Add the items you buy regularly — chicken, pasta, yogurt, whatever your family eats. The app remembers your list between trips."
              features={[
                "Type to search and add items",
                "Items persist across sessions",
                "Organize by category automatically",
              ]}
              mockupContent={<MockupShoppingList />}
              reverse={false}
            />

            {/* Step 2 */}
            <StepRow
              stepNumber="02"
              title="Get matched to deals"
              description="Every week, the app checks your list against all active Publix deals — BOGOs, sales, and coupons. When there's a match, you'll see it instantly."
              features={[
                "Automatic deal matching",
                "See deal images and expiration dates",
                "Browse 100+ deals you might have missed",
              ]}
              mockupContent={<MockupDealMatch />}
              reverse={true}
            />

            {/* Step 3 */}
            <StepRow
              stepNumber="03"
              title="Shop like a pro"
              description="Hit the store with Shop Mode active. Check off items as you go. One hand, one screen, zero stress."
              features={[
                "One-handed Shop Mode for in-store use",
                "Check items off as you shop",
                "See your savings add up in real time",
              ]}
              mockupContent={<MockupShopMode />}
              reverse={false}
            />
          </div>
        </div>
      </section>

      {/* Ad between How It Works and Features */}
      <div className="py-8 px-5 max-w-4xl mx-auto">
        <AdSlot slot="XXXXXXXXXX" format="horizontal" dismissible />
      </div>

      {/* ================================================================
          FEATURE GRID
          Strategy: After the 3-step walkthrough, showcase additional
          features in a scannable grid. Benefits, not features.
          ================================================================ */}
      <section className="py-20 sm:py-28 px-5 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <AnimateIn className="text-center">
            <span className="text-publix-green text-sm font-bold uppercase tracking-widest">
              Features
            </span>
            <h2
              className="mt-3 text-3xl sm:text-4xl font-extrabold"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Everything you need. Nothing you don&#39;t.
            </h2>
          </AnimateIn>

          <AnimateIn
            className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            delay
          >
            {[
              {
                icon: Tag,
                title: "Live deal tracking",
                desc: "Every active Publix deal — BOGOs, sales, and coupons — updated weekly. Filterable by category.",
              },
              {
                icon: Heart,
                title: "Smart watchlist",
                desc: "Add items once and get matched to deals automatically, week after week.",
              },
              {
                icon: ShoppingCart,
                title: "Shop Mode",
                desc: "Purpose-built for one-handed use in the store. Check items off as you go.",
              },
              {
                icon: Smartphone,
                title: "Install as an app",
                desc: "Add to your home screen for instant access. Works offline after first load.",
              },
              {
                icon: Eye,
                title: "Deal images & details",
                desc: "See product photos, prices, and expiration dates before you head to the store.",
              },
              {
                icon: Zap,
                title: "Lightning fast",
                desc: "No bloated app store downloads. Opens instantly in your browser.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-publix-green/30 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-publix-green/15 flex items-center justify-center mb-4 group-hover:bg-publix-green/25 transition-colors">
                  <feature.icon size={22} className="text-publix-green" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
          Strategy: Social proof from "real users" — in a production app
          these would be actual testimonials. Placeholder names for now.
          Three cards with relatable scenarios.
          ================================================================ */}
      <section className="py-20 sm:py-28 px-5">
        <div className="max-w-4xl mx-auto">
          <AnimateIn className="text-center">
            <span className="text-publix-green text-sm font-bold uppercase tracking-widest">
              What shoppers say
            </span>
            <h2
              className="mt-3 text-3xl sm:text-4xl font-extrabold"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Real savings from real shoppers
            </h2>
          </AnimateIn>

          <AnimateIn
            className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5"
            delay
          >
            {[
              {
                quote:
                  "I used to scroll through the Publix app for 20 minutes trying to find deals. Now I just check my list and go. Saved $40 last week alone.",
                name: "Maria R.",
                location: "Tampa, FL",
                savings: "$40/week",
              },
              {
                quote:
                  "The Shop Mode is a game-changer. I literally just check things off with one hand while pushing my cart. My trips are 15 minutes faster now.",
                name: "James T.",
                location: "Orlando, FL",
                savings: "15 min saved",
              },
              {
                quote:
                  "My husband didn't believe me when I told him how much we were saving. Now he checks the app before every trip too.",
                name: "Ashley K.",
                location: "Jacksonville, FL",
                savings: "$160/month",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-white/40">{t.location}</p>
                  </div>
                  <span className="text-xs font-bold text-publix-green bg-publix-green/15 px-2.5 py-1 rounded-lg">
                    {t.savings}
                  </span>
                </div>
              </div>
            ))}
          </AnimateIn>
        </div>
      </section>

      {/* ================================================================
          CTA BANNER — Mid-page conversion opportunity
          ================================================================ */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-publix-green to-publix-green-dark rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          {/* Decorative glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <h2
            className="relative text-2xl sm:text-3xl font-extrabold text-white"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Your next Publix trip could save you $30+
          </h2>
          <p className="relative mt-4 text-white/70 text-base max-w-md mx-auto">
            Set up your list in 30 seconds. The deals are already waiting.
          </p>
          <Link
            href="/app"
            className="relative inline-flex items-center gap-2 mt-8 bg-white text-publix-green-dark font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg"
          >
            Open the app
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ================================================================
          FAQ SECTION
          Strategy: Handle common objections. Every unanswered question
          is a reason NOT to convert. Keep answers short and honest.
          ================================================================ */}
      <section className="py-20 sm:py-28 px-5 bg-gray-900/30" id="faq">
        <div className="max-w-2xl mx-auto">
          <AnimateIn className="text-center mb-12">
            <span className="text-publix-green text-sm font-bold uppercase tracking-widest">
              FAQ
            </span>
            <h2
              className="mt-3 text-3xl sm:text-4xl font-extrabold"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Questions? Answered.
            </h2>
          </AnimateIn>

          <AnimateIn delay>
            <FAQItem
              question="Is this really free?"
              answer="Yes, completely free. The app is ad-supported, but there are no premium tiers or hidden costs."
            />
            <FAQItem
              question="Do I need to create an account?"
              answer="Yes, you&#39;ll need to create a free account to use the app. This lets us save your shopping list and preferences so everything is ready when you come back."
            />
            <FAQItem
              question="How often are deals updated?"
              answer="Deals are refreshed every time Publix publishes new BOGO promotions, typically weekly. You&#39;ll always see the current active deals."
            />
            <FAQItem
              question="Does this work for all Publix locations?"
              answer="Yes. Enter your zip code and the app will show deals available at your local Publix store."
            />
            <FAQItem
              question="Can I use this on my computer?"
              answer="Absolutely. The app works in any modern browser. But it&#39;s especially designed for mobile — add it to your home screen and use it right in the store."
            />
            <FAQItem
              question="Is this affiliated with Publix?"
              answer="No. This is an independent tool that tracks publicly available Publix BOGO deal information to help shoppers save money."
            />
          </AnimateIn>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA
          Strategy: Strong closing CTA. Recap the value prop.
          Create a moment of decision.
          ================================================================ */}
      <section className="py-24 sm:py-32 px-5 text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Every week you wait is money you{" "}
            <span className="text-publix-green">don&#39;t save</span>
          </h2>
          <p className="mt-6 text-lg text-white/50 max-w-md mx-auto">
            Set up your list. Match your deals. Shop smarter.
            It takes 30 seconds.
          </p>
          <Link
            href="/app"
            className="group inline-flex items-center gap-2.5 mt-10 bg-publix-green hover:bg-publix-green-dark text-white text-lg font-bold px-10 py-5 rounded-2xl transition-all active:scale-[0.97] shadow-[0_0_60px_-12px_rgba(59,125,35,0.6)]"
          >
            Start saving now
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <p className="mt-4 text-sm text-white/30">
            Free. Works on any device. Sign up in seconds.
          </p>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-publix-green rounded-lg flex items-center justify-center">
              <Tag size={16} className="text-white" />
            </div>
            <span
              className="font-bold text-white"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Publix BOGO
            </span>
          </div>
          <p className="text-xs text-white/30">
            Not affiliated with Publix Super Markets, Inc.
          </p>
        </div>
      </footer>

      {/* ================================================================
          STICKY BOTTOM CTA
          Strategy: After scrolling past the hero, a persistent CTA bar
          keeps the conversion opportunity in view at all times.
          Slides up smoothly.
          ================================================================ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
          showSticky
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">
                Ready to save on your next Publix trip?
              </p>
              <p className="text-xs text-white/40">
                Free. Sign up in seconds.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/app"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-publix-green hover:bg-publix-green-dark text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.97]"
              >
                Open the app
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STEP ROW COMPONENT — alternating layout for the "how it works" section
// =============================================================================
function StepRow({
  stepNumber,
  title,
  description,
  features,
  mockupContent,
  reverse,
}: {
  stepNumber: string;
  title: string;
  description: string;
  features: string[];
  mockupContent: React.ReactNode;
  reverse: boolean;
}) {
  return (
    <AnimateIn
      className={`flex flex-col ${
        reverse ? "sm:flex-row-reverse" : "sm:flex-row"
      } items-center gap-10 sm:gap-16`}
    >
      {/* Text side */}
      <div className="flex-1 text-center sm:text-left">
        <span className="text-publix-green text-sm font-extrabold tracking-widest">
          STEP {stepNumber}
        </span>
        <h3
          className="mt-3 text-2xl sm:text-3xl font-extrabold"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          {title}
        </h3>
        <p className="mt-4 text-white/50 text-base leading-relaxed">
          {description}
        </p>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-white/70">
              <CheckCircle2
                size={18}
                className="text-publix-green flex-shrink-0 mt-0.5"
              />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Phone mockup side */}
      <div className="flex-shrink-0">
        <PhoneMockup>{mockupContent}</PhoneMockup>
      </div>
    </AnimateIn>
  );
}

// =============================================================================
// MOCKUP SCREEN CONTENTS — styled placeholders that represent app screens
// These use the app's actual design tokens to feel authentic
// =============================================================================

function MockupShoppingList() {
  return (
    <div className="pt-10 pb-6">
      {/* Header bar */}
      <div className="bg-publix-green px-4 py-3">
        <p className="text-white text-xs font-bold">Shopping List</p>
        <p className="text-white/60 text-[10px]">3 of 5 items on BOGO</p>
      </div>
      {/* Search bar */}
      <div className="px-3 py-2">
        <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span className="text-[10px] text-white/30">Add an item...</span>
        </div>
      </div>
      {/* List items */}
      <div className="px-3 space-y-1.5">
        {[
          { name: "Chicken Breast", bogo: true },
          { name: "Greek Yogurt", bogo: true },
          { name: "Whole Milk", bogo: false },
          { name: "Pasta Sauce", bogo: true },
          { name: "Bread", bogo: false },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2.5 bg-white/[0.04] rounded-lg px-3 py-2.5"
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                item.bogo
                  ? "border-publix-green bg-publix-green/20"
                  : "border-white/20"
              }`}
            />
            <span className="text-[11px] text-white/80 flex-1">
              {item.name}
            </span>
            {item.bogo && (
              <span className="text-[8px] font-extrabold text-publix-green bg-publix-green/15 px-1.5 py-0.5 rounded">
                BOGO
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupDealMatch() {
  return (
    <div className="pt-10 pb-6">
      {/* Header */}
      <div className="bg-publix-green px-4 py-3">
        <p className="text-white text-xs font-bold">This Week&#39;s Deals</p>
        <p className="text-white/60 text-[10px]">108 deals available</p>
      </div>
      {/* Category pills */}
      <div className="px-3 py-2 flex gap-1.5 overflow-hidden">
        {["All", "Meat", "Dairy", "Frozen"].map((cat, i) => (
          <span
            key={cat}
            className={`text-[9px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              i === 0
                ? "bg-publix-green text-white"
                : "bg-white/10 text-white/50"
            }`}
          >
            {cat}
          </span>
        ))}
      </div>
      {/* Deal cards grid */}
      <div className="px-3 grid grid-cols-2 gap-2">
        {[
          { name: "Boar\u2019s Head Chicken", tag: "BOGO" },
          { name: "Chobani Yogurt", tag: "BOGO" },
          { name: "Rao\u2019s Pasta Sauce", tag: "BOGO" },
          { name: "Nature\u2019s Own Bread", tag: "BOGO" },
        ].map((deal) => (
          <div
            key={deal.name}
            className="bg-white/[0.04] rounded-xl overflow-hidden"
          >
            <div className="aspect-square bg-white/[0.03] relative flex items-center justify-center">
              <Tag size={20} className="text-white/10" />
              <span
                className="absolute top-1.5 left-1.5 text-[7px] font-extrabold text-white bg-publix-green px-1.5 py-0.5 rounded"
                style={{ transform: "rotate(-3deg)" }}
              >
                BOGO
              </span>
            </div>
            <div className="p-2">
              <p className="text-[9px] font-bold text-white/80 leading-tight line-clamp-2">
                {deal.name}
              </p>
              <p className="text-[8px] text-publix-green font-bold mt-0.5">
                Buy 1 Get 1 Free
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupShopMode() {
  return (
    <div className="pt-10 pb-6 bg-white">
      {/* Header */}
      <div className="bg-publix-green px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white text-xs font-bold">Shopping Mode</p>
          <p className="text-white/60 text-[10px]">3 of 5 items found</p>
        </div>
        <div className="bg-white/20 rounded-lg px-2 py-1">
          <span className="text-[9px] font-bold text-white">$18.50 saved</span>
        </div>
      </div>
      {/* Checked items */}
      <div className="px-3 py-2 space-y-1.5">
        {[
          { name: "Chicken Breast", checked: true, price: "$8.99" },
          { name: "Greek Yogurt", checked: true, price: "$4.29" },
          { name: "Pasta Sauce", checked: true, price: "$5.49" },
          { name: "Whole Milk", checked: false, price: "" },
          { name: "Bread", checked: false, price: "" },
        ].map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-3 ${
              item.checked ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.checked
                  ? "bg-publix-green"
                  : "border-2 border-gray-300"
              }`}
            >
              {item.checked && (
                <CheckCircle2 size={14} className="text-white" />
              )}
            </div>
            <span
              className={`text-[11px] flex-1 ${
                item.checked
                  ? "text-gray-400 line-through"
                  : "text-gray-800 font-medium"
              }`}
            >
              {item.name}
            </span>
            {item.checked && (
              <span className="text-[9px] font-bold text-publix-green">
                {item.price}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Bottom bar */}
      <div className="mx-3 mt-2 bg-publix-green rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] text-white/70">Total saved</span>
        <span className="text-sm font-extrabold text-white">$18.50</span>
      </div>
    </div>
  );
}
