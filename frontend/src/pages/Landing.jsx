import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const features = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" />
      </svg>
    ),
    title: 'Discover',
    description: 'Find opportunities from across the web — hackathons, internships, scholarships and more.'
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    title: 'Personalize',
    description: 'Tell AI about your goals and profile. It understands what matters to you.'
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15V9" /><path d="M12 17V7" /><path d="M16 13v-2" />
      </svg>
    ),
    title: 'Prioritize',
    description: 'Get opportunities ranked for YOU — so you focus on what fits best.'
  },
]

const steps = [
  { num: '01', title: 'Paste any announcement', description: 'Drop in a WhatsApp forward, email, or social post — AI structures it automatically.' },
  { num: '02', title: 'Share your profile', description: 'Tell us your year, interests, and goals. AI ranks every opportunity by fit.' },
  { num: '03', title: 'Prep with confidence', description: 'Pick one and get a registration + prep checklist tailored to that opportunity.' },
]

export default function Landing({ onEnter }) {
  const handleClick = () => onEnter?.()

  return (
    <div className="landing-page min-h-screen bg-slate-50">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-primary-600 font-semibold text-lg">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <span>AI Campus</span>
        </div>
        <Link to="/auth" className="btn-primary text-sm">Get Started</Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium text-primary-600 mb-4">AI-powered opportunity discovery</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
              Never Miss an
              <br />
              <span className="text-primary-600">Opportunity</span> Again.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              AI Campus discovers, understands and prioritizes hackathons, internships and
              competitions that actually match you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={handleClick} className="w-full sm:w-auto">
                Get Started →
              </Button>
              <Button size="lg" variant="secondary" onClick={handleClick} className="w-full sm:w-auto">
                Explore Opportunities
              </Button>
            </div>
          </div>

          {/* Hero Visual - Mock Feed */}
          <div className="hidden lg:block animate-slide-up">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-sm font-medium text-slate-600">AI Campus · Your Feed</span>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { title: 'Smart India Hackathon 2026', org: 'AICTE', type: 'hackathon', match: 94, urgency: 'urgent', days: '3 days left', insight: 'Strong fit for your CS background and hackathon interest.' },
                  { title: 'Google Summer of Code 2026', org: 'Google', type: 'internship', match: 88, urgency: 'soon', days: '10 days left', insight: 'Matches your open-source and remote internship goals.' },
                  { title: 'AI Case Study Competition', org: 'IIM Lucknow', type: 'competition', match: 76, urgency: 'normal', days: '21 days left', insight: 'Relevant if you want applied AI experience.' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.org}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-xl text-primary-600">{item.match}%</span>
                        <span className="text-xs text-slate-500">match</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-type-hackathon/10 text-type-hackathon border border-type-hackathon/20">{item.type}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                        item.urgency === 'urgent' ? 'bg-urgency-urgent/10 text-urgency-urgent border-urgency-urgent/20' :
                        item.urgency === 'soon' ? 'bg-urgency-soon/10 text-urgency-soon border-urgency-soon/20' :
                        'bg-urgency-normal/10 text-urgency-normal border-urgency-normal/20'
                      }`}>{item.days}</span>
                    </div>
                    <p className="text-sm text-slate-600">{item.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Built for ambitious students</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center p-6 rounded-xl hover:bg-slate-50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-lg flex items-center justify-center">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="absolute left-5 top-14 bottom-14 w-0.5 bg-slate-200 hidden md:block" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to find your next big opportunity?</h2>
          <p className="text-primary-100 text-lg mb-8">Join students who never miss a deadline again.</p>
          <Button size="xl" variant="secondary" className="bg-white text-primary-600 hover:bg-primary-50" onClick={handleClick}>
            Get Started →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-600 font-semibold">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              <span>AI Campus</span>
            </div>
            <span className="text-sm text-slate-500">Built for campus builders</span>
          </div>
        </div>
      </footer>
    </div>
  )
}