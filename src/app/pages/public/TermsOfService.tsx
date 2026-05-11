import React from 'react';
import { Link } from 'react-router';
import { Scale, BookOpen, UserCheck, AlertCircle, ChevronLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Rizqara Solution
            </span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Scale size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
          </div>
          <p className="text-slate-500 text-lg">Effective Date: May 10, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="prose prose-slate prose-indigo max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <BookOpen size={18} />
              </div>
              Agreement to Terms
            </h2>
            <p className="text-slate-600 leading-relaxed">
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Rizqara Solution ("Company", "we", "us", or "our"), concerning your access to and use of the Rizqara POS platform as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserCheck size={18} />
              </div>
              User Representation
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              By using the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>All registration information you submit will be true, accurate, current, and complete.</li>
              <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
              <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
              <li>You are not a minor in the jurisdiction in which you reside.</li>
              <li>You will not access the Service through automated or non-human means, whether through a bot, script, or otherwise.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <AlertCircle size={18} />
              </div>
              Subscription and Payments
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our Service is available via monthly or annual subscription plans. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Pay all fees associated with your chosen plan on time.</li>
              <li>Subscriptions will automatically renew unless cancelled before the renewal date.</li>
              <li>We reserve the right to change our pricing upon 30 days notice.</li>
              <li>No refunds will be provided for partial months of service or unused accounts.</li>
            </ul>
          </section>

          <section className="mb-12 p-8 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-indigo-100 leading-relaxed mb-6">
              In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              If you have questions or comments about these terms, please contact us.
            </p>
            <Link 
              to="/support" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Contact Legal Team
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="text-lg font-black tracking-tighter text-slate-400">
              Rizqara <span className="text-slate-300">Solution</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-blue-600 transition-colors">Support</Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
