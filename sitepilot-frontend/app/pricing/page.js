"use client";

import { Inter } from "next/font/google";
import { CheckCircle2, Zap } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

const FADE_UP_VARIANTS = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.8 } },
};

const STAGGER_CONTAINER = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function PricingPage() {
    return (
        <div className={`min-h-screen bg-white text-gray-900 ${inter.className}`}>
            {/* Top Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] pt-6 pb-24 md:pb-32">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px]" />

                <AppNavbar />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-12 sm:mt-20 text-center">
                    <motion.div initial="hidden" animate="show" variants={STAGGER_CONTAINER} className="max-w-3xl mx-auto">
                        <motion.h1 variants={FADE_UP_VARIANTS} className="text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-black text-white uppercase tracking-tighter mb-8">
                            Predictable Pricing
                        </motion.h1>
                        <motion.p variants={FADE_UP_VARIANTS} className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light mb-10">
                            Clear capacity limits spanning sites, AI usage, and storage. Integrated workflows to automate upgrades seamlessly.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Tiers (Matching user reqs) */}
            <section className="py-24 sm:py-32 relative -mt-16 z-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={STAGGER_CONTAINER}
                        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                    >
                        {/* Starter */}
                        <motion.div variants={FADE_UP_VARIANTS} className="bg-white border border-gray-200 rounded-[2rem] p-8 sm:p-10 flex flex-col hover:border-[#8bc4b1] transition-colors hover:shadow-xl hover:-translate-y-2 duration-300">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-[#0b1411] mb-2">Basic</h4>
                                <p className="text-gray-500 text-sm min-h-[40px]">Essential features for getting started.</p>
                            </div>
                            <div className="mb-8 border-b border-gray-100 pb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-[#0b1411]">$15</span>
                                    <span className="text-gray-500 text-sm font-medium">/month</span>
                                </div>
                            </div>
                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    1 Website Limit
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Up to 5 Pages
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    500MB Asset Storage
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    10 AI Generative Prompts/mo
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-500 font-medium group line-through">
                                    Standard Domain Routing only
                                </li>
                            </ul>
                            <button className="w-full bg-[#f2f4f2] text-[#0b1411] py-4 rounded-full font-bold hover:bg-gray-200 transition-colors active:scale-95 duration-200">
                                Subscribe Now
                            </button>
                        </motion.div>

                        {/* Pro */}
                        <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0b1411] border border-transparent rounded-[2rem] p-8 sm:p-10 flex flex-col transform md:-translate-y-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative hover:shadow-[0_25px_60px_-15px_rgba(211,255,74,0.15)] transition-all duration-300">
                            <div className="absolute top-0 inset-x-0 h-1 bg-[#d3ff4a] rounded-t-[2rem]" />
                            <div className="absolute -top-4 right-8 bg-[#d3ff4a] text-[#0b1411] text-[10px] uppercase font-black tracking-widest py-1.5 px-3 rounded-full animate-pulse">
                                Most Popular
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Growth</h4>
                                <p className="text-gray-400 text-sm min-h-[40px]">Expanded limits for scaling operations.</p>
                            </div>
                            <div className="mb-8 border-b border-white/10 pb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">$49</span>
                                    <span className="text-gray-500 text-sm font-medium">/month</span>
                                </div>
                            </div>
                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                                    Up to 10 Websites
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                                    Unlimited Pages
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                                    10GB Asset Storage
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                                    Unlimited AI Generative Prompts
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                                    Custom Domain Access
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                                    <Zap className="w-5 h-5 text-[#00e5ff] shrink-0 group-hover:scale-110 transition-transform" />
                                    Premium Builder Components
                                </li>
                            </ul>
                            <button className="w-full bg-[#d3ff4a] text-[#0b1411] py-4 rounded-full font-bold hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 duration-200 shadow-[0_0_20px_rgba(211,255,74,0.3)]">
                                Upgrade Plan
                            </button>
                        </motion.div>

                        {/* Enterprise */}
                        <motion.div variants={FADE_UP_VARIANTS} className="bg-white border border-gray-200 rounded-[2rem] p-8 sm:p-10 flex flex-col hover:border-[#8bc4b1] transition-colors hover:shadow-xl hover:-translate-y-2 duration-300">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-[#0b1411] mb-2">Scale</h4>
                                <p className="text-gray-500 text-sm min-h-[40px]">Uncapped infrastructure limits.</p>
                            </div>
                            <div className="mb-8 border-b border-gray-100 pb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-[#0b1411]">$199</span>
                                    <span className="text-gray-500 text-sm font-medium">/month</span>
                                </div>
                            </div>
                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Unlimited Websites
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Unlimited Pages
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Unlimited Storage
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Dashboard Billing Visibility
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                                    <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                                    Automated Prorated Upgrades
                                </li>
                            </ul>
                            <button className="w-full bg-[#0b1411] text-white py-4 rounded-full font-bold hover:bg-[#132a25] transition-colors active:scale-95 duration-200">
                                Contact Sales
                            </button>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center mt-24">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrated Payments Engine</h3>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        Our dashboard fully manages the subscription lifecycle. Upgrading dynamically unlocks new builder components and domain access instantly, without developer intervention. Tenant entitlement logic is handled completely by SitePilot.
                    </p>
                </div>
            </section>

            <AppFooter />
        </div>
    );
}
