import React from 'react';
import { Link } from 'react-router';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Shield size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-500 text-lg">Last updated: May 10, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="prose prose-slate prose-blue max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Eye size={18} />
              </div>
              Introduction
            </h2>
            <p className="text-slate-600 leading-relaxed">
              At Rizqara Solution, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our POS platform and related services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Lock size={18} />
              </div>
              Information We Collect
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We collect information that you provide directly to us when you create an account, use our POS system, or communicate with us. This may include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Account Information:</strong> Name, email address, phone number, and password.</li>
              <li><strong>Business Information:</strong> Shop name, business address, tax identification numbers, and business type.</li>
              <li><strong>Transaction Data:</strong> Details of sales, purchases, inventory levels, and customer interactions processed through our POS.</li>
              <li><strong>Payment Information:</strong> We use secure third-party payment processors (like bKash, Nagad) to handle subscription payments. We do not store your full payment card details.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <FileText size={18} />
              </div>
              How We Use Your Information
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We use the collected information for various purposes, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>To provide and maintain our Service, including monitoring usage.</li>
              <li>To manage your account and process transactions.</li>
              <li>To provide customer support and respond to your inquiries.</li>
              <li>To generate business reports and analytics for your shop.</li>
              <li>To send you administrative information, such as subscription updates and security alerts.</li>
            </ul>
          </section>

          <section className="mb-12 p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200">
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-blue-100 leading-relaxed mb-6">
              We implement industry-standard security measures to protect your data. All communication between your device and our servers is encrypted using SSL/TLS. Your data is stored on secure servers with regular backups.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-400 flex items-center justify-center text-[10px] font-bold">
                    SSL
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-blue-50">Enterprise-grade security guaranteed.</span>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              If you have any questions about this Privacy Policy, please contact our privacy team.
            </p>
            <Link 
              to="/support" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Contact Privacy Team
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
            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            <Link to="/support" className="hover:text-blue-600 transition-colors">Support</Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
