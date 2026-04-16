"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, ChartColumn, ShieldCheck, Store, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";

const highlights = [
  {
    title: "Customer Ordering",
    description: "Browse products, build carts, place orders, and review payments from a clean self-service portal.",
    icon: Boxes,
  },
  {
    title: "Regional Fulfilment",
    description: "RDC teams can approve orders, maintain stock accuracy, and coordinate distribution activity faster.",
    icon: ShieldCheck,
  },
  {
    title: "Delivery Tracking",
    description: "Logistics teams update progress in real time so customers and managers always have delivery visibility.",
    icon: Truck,
  },
  {
    title: "Management Reporting",
    description: "Head office and admin users can monitor sales, stock health, delivery performance, and user activity.",
    icon: ChartColumn,
  },
];

const platformPoints = [
  "Centralized order, inventory, payment, and delivery visibility",
  "Role-based access for customers, RDC, logistics, head office, and admin",
  "Responsive interface suitable for both system use and assignment presentation",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1480px] space-y-6 px-4 pb-8 pt-4 sm:px-6">
        <Navbar />

        <section className="hero-banner overflow-hidden rounded-[2rem] p-8 shadow-[0_24px_70px_rgba(245,114,36,0.18)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white/95 backdrop-blur">
                <Store size={16} />
                IslandLink Sales Distribution Network
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                A modern sales distribution platform for island-wide retail and wholesale operations.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/88">
                ISDN connects customers, regional distribution centres, logistics teams, head office managers, and administrators through one secure, centralized web application.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/register" className="btn-secondary !bg-white !text-[#f57224]">
                  Get Started
                </Link>
                <Link href="/login" className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur transition hover:bg-white/16">
                  Login
                </Link>
                <Link href="/register" className="rounded-2xl border border-white/25 bg-transparent px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10">
                  Register
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid gap-4"
            >
              <div className="rounded-[2rem] border border-white/20 bg-white/12 p-6 text-white backdrop-blur">
                <p className="text-sm uppercase tracking-[0.28em] text-white/75">Operational Coverage</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="text-sm text-white/75">Retail outlets served</p>
                    <p className="mt-2 text-3xl font-extrabold">5,000+</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="text-sm text-white/75">Regional distribution centres</p>
                    <p className="mt-2 text-3xl font-extrabold">5</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 text-white backdrop-blur">
                <p className="text-sm uppercase tracking-[0.28em] text-white/75">Core Outcomes</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/88">
                  <li>Faster order handling with fewer manual errors</li>
                  <li>Clear inventory visibility across the distribution network</li>
                  <li>Improved delivery tracking and billing transparency</li>
                </ul>
                <Link href="/customer/products" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                  Browse Products
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="surface-card rounded-[1.5rem] p-6"
              >
                <div className="inline-flex rounded-2xl bg-orange-50 p-3 text-[#f57224]">
                  <Icon size={22} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card rounded-[1.75rem] p-8">
            <p className="page-eyebrow">Platform Benefits</p>
            <h2 className="page-title mt-3">Designed for business clarity, operational speed, and professional presentation.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {platformPoints.map((item) => (
                <div key={item} className="subtle-panel p-4">
                  <p className="font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-soft rounded-[1.75rem] p-8">
            <p className="page-eyebrow">Why ISDN</p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Built to replace disconnected manual workflows.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The system improves how orders are placed, approved, delivered, and reported, while keeping the design simple enough to explain clearly in an academic project presentation.
            </p>
          </div>
        </section>

        <footer className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="font-semibold text-slate-700">IslandLink Sales Distribution Network</p>
            <p>Centralized ordering, fulfilment, delivery tracking, and reporting for island-wide operations.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
