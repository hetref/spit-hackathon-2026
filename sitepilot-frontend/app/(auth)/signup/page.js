'use client'
import { signUp } from '@/lib/auth-client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BlurText from '@/components/ui/BlurText'

// Google Icon Component
const IconGoogle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.189 1.186 15.479 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.885 0 11.954-4.823 11.954-12.015 0-.795-.084-1.588-.239-2.356H12.24z" fill="currentColor" />
  </svg>
);

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signUp.email(formData)
      // Email verification is automatically sent by Better Auth
      alert('Account created! Check your email to verify your address.')
      router.push(redirectUrl || '/dashboard')
    } catch (err) {
      console.error('Sign up error:', err)
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      // Implement Google sign up if needed
      alert('Google sign up coming soon!')
    } catch (err) {
      console.error('Google sign up error:', err)
      setError('Google sign up failed.')
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-gray-900">SitePilot</h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-10">
            <BlurText
              text="Create Account"
              delay={50}
              className="text-5xl font-bold text-gray-900 mb-4"
              animateBy="words"
            />
            <p className="text-gray-600 text-base">
              Join us and start building amazing websites today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm text-gray-700 mb-2 font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2 font-medium">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors pr-10"
                  placeholder="Create a password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-1 bg-white border border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !agreeToTerms}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-3"
            >
              <IconGoogle className="w-5 h-5" />
              Continue with Google
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <a href="/signin" className="text-blue-600 hover:text-blue-500 transition-colors font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image with Gradient Overlay and Testimonials */}
      <div className="hidden lg:flex lg:w-[calc(50%-2rem)] relative overflow-hidden rounded-3xl my-4 mr-4 ml-0">
        {/* Background Image */}
        <img
          src="/img1.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Testimonials at Bottom */}
        <div className="absolute bottom-8 left-8 right-8 flex gap-4 z-10">
          {/* Testimonial 1 */}
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0"></div>
              <div>
                <div className="text-white font-semibold text-sm">Emily Rodriguez</div>
                <div className="text-white/70 text-xs">@emilyrodriguez</div>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Setting up was incredibly easy! I had my first website live in minutes. Highly recommend!
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0"></div>
              <div>
                <div className="text-white font-semibold text-sm">Alex Thompson</div>
                <div className="text-white/70 text-xs">@alexthompson</div>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              The AI features are game-changing. It's like having a professional web designer on demand.
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0"></div>
              <div>
                <div className="text-white font-semibold text-sm">Jessica Lee</div>
                <div className="text-white/70 text-xs">@jessicalee</div>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Perfect for managing multiple client sites. The multi-tenant features are exactly what we needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
