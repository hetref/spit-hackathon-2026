'use client'

import { FullscreenMenu } from "@/components/fullscreen-menu";
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
      <FullscreenMenu />

      {/* Logo */}
      <div className="fixed top-8 left-8 z-[100]">
        <h1 className="text-2xl font-bold text-white">
          SitePilot
        </h1>
      </div>

      {/* Sign In Button */}
      <div className="fixed top-8 right-20 z-[100]">
        <button className="px-6 py-2 text-white rounded-lg font-medium hover:text-blue-500 transition-all duration-300">
          Sign In
        </button>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/stock1vid.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-semibold border border-white/20">
                ✨ AI-Powered Multi-Tenant Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build Websites for<br />
              Every Tenant
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Empower organizations to create, customize, and deploy professional websites with intelligent automation and complete tenant isolation
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
                Get Started Free →
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-white/20 transition-all duration-300">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold mb-6">
              Platform Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-500">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors duration-500">
              Powerful features designed for modern multi-tenant website management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-500">
                AI Website Builder
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-500">
                Create professional layouts instantly with AI-powered suggestions and automated optimization
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-500">
                Multi-Tenant Architecture
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-500">
                Secure infrastructure with complete data isolation for unlimited organizations
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-500">
                Team Collaboration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-500">
                Granular permissions for seamless teamwork across your organization
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-500">
                Smart Deployment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-500">
                Deploy with confidence using intelligent workflows and version control
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-white dark:bg-gray-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-10 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
              <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3">
                99.9%
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-500">
                Uptime Guarantee
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                Always available when you need it
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-10 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
              <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3">
                10k+
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-500">
                Websites Deployed
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                Trusted by thousands worldwide
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-10 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
              <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3">
                500+
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-500">
                Organizations
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                Growing businesses trust us
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold mb-6">
              Pricing Plans
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-500">
              Choose your perfect plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors duration-500">
              Flexible pricing that grows with your organization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-500">
                  Starter
                </h3>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-500">
                  Perfect for small teams getting started
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-500">$39</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2 transition-colors duration-500">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-500">5 Websites</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-500">AI Builder Access</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-500">Custom Domains</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-500">Email Support</span>
                </li>
              </ul>
              <button className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg transition-all duration-300">
                Get Started
              </button>
            </div>

            {/* Professional Plan - Featured */}
            <div className="bg-blue-600 rounded-3xl p-10 relative overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="absolute top-6 right-6">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Professional
                </h3>
                <p className="text-blue-100">
                  For growing organizations
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$69</span>
                  <span className="text-blue-100 ml-2">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Unlimited Websites</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Advanced AI Features</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Priority Support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Advanced Analytics</span>
                </li>
              </ul>
              <button className="w-full py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-300">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-blue-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join hundreds of organizations building amazing websites with SitePilot
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-12 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Start Free Trial
            </button>
            <button className="px-12 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
