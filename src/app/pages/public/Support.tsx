import React, { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Phone, MapPin, MessageSquare, Send, ChevronLeft, CheckCircle2, LifeBuoy, FileText, Settings, Globe, CreditCard } from 'lucide-react';
import { supportTicketStorage, notificationStorage } from '../../lib/storage';
import { Modal } from '../../components/ui/Modal';

const FAQ_ANSWERS = [
  {
    q: 'How to setup POS?',
    icon: Settings,
    color: 'blue',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">Follow these simple steps to get your retail business running on Rizqara POS:</p>
        <div className="space-y-3">
          {[
            { t: 'Account Activation', d: 'Sign in using the credentials provided during your subscription.' },
            { t: 'Configure Shop', d: 'Visit Settings to update your shop name, address, and logo for invoices.' },
            { t: 'Add Products', d: 'Create categories first, then add your products with barcodes and pricing.' },
            { t: 'Open Register', d: 'Go to POS, open your daily register, and start serving customers!' }
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
              <div>
                <div className="text-sm font-bold text-slate-800">{step.t}</div>
                <div className="text-xs text-slate-500">{step.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    q: 'Multi-shop management?',
    icon: Globe,
    color: 'emerald',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">Manage your entire business empire from a single dashboard:</p>
        <div className="grid gap-3">
          {[
            { t: 'Centralized Control', d: 'Super Admins can monitor sales and inventory for all branches in real-time.' },
            { t: 'Branch Switching', d: 'Seamlessly toggle between different locations to view specific reports.' },
            { t: 'Staff Assignment', d: 'Assign managers and cashiers to specific branches with granular permissions.' }
          ].map((item, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm font-bold text-slate-800 mb-1">{item.t}</div>
              <div className="text-xs text-slate-500">{item.d}</div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    q: 'Payment integration?',
    icon: CreditCard,
    color: 'violet',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600">Accept payments your way with our built-in integrations:</p>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <strong>bKash & Nagad:</strong> Enter your merchant numbers in settings to enable mobile payments.
          </li>
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <strong>Card Payments:</strong> Supports standard POS terminal integration for credit/debit cards.
          </li>
          <li className="flex items-center gap-3 text-sm text-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong>Cash Management:</strong> Advanced tracking for cash-on-hand and daily register balancing.
          </li>
        </ul>
      </div>
    )
  }
];

export default function PublicSupport() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      // Create ticket
      const ticket = supportTicketStorage.create({
        shopId: 'public',
        customerName: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'open',
        priority: 'medium',
        messages: [{
          id: 'm1',
          senderId: 'guest',
          senderName: formData.name,
          message: formData.message,
          createdAt: new Date().toISOString()
        }]
      });

      // Notify Super Admin
      notificationStorage.create({
        shopId: null, // Super Admin
        type: 'new_ticket',
        title: 'New Support Ticket',
        message: `From: ${formData.name} - ${formData.subject}`,
        read: false,
        details: { ticketId: ticket.id }
      });

      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Contact Info */}
          <div className="space-y-10">
            <div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                How can we <span className="text-blue-600">help you?</span>
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                Have a question about our POS system? Our team is here to help you optimize your business operations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Email us at</div>
                  <div className="text-lg font-bold text-slate-800">rizqarasolution@gmail.com</div>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Call us</div>
                  <div className="text-lg font-bold text-slate-800">+880 134-3042761</div>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Visit our office</div>
                  <div className="text-lg font-bold text-slate-800">Nikunja-2, Dhaka, Bangladesh</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-500">We've received your request and will get back to you within 24 hours.</p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <MessageSquare size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Send a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all appearance-none"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option>General Inquiry</option>
                      <option>Technical Support</option>
                      <option>Billing Question</option>
                      <option>Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                    <textarea 
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you today?"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="mt-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-6">
            <LifeBuoy size={16} />
            Support Center
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick answers for you</h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            Check out our documentation for instant solutions to common questions.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {FAQ_ANSWERS.map((faq, i) => (
              <div key={i} className="p-8 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 transition-colors flex flex-col h-full">
                <div className={`w-10 h-10 rounded-xl bg-${faq.color}-50 flex items-center justify-center text-${faq.color}-600 mb-5`}>
                  <faq.icon size={20} />
                </div>
                <h4 className="font-bold text-slate-800 mb-3">{faq.q}</h4>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {i === 0 ? 'Follow our step-by-step guide to get your shop running in minutes.' : 
                   i === 1 ? 'Learn how to manage multiple branches from the super admin panel.' : 
                   'Setup bKash, Nagad, and other payment methods easily.'}
                </p>
                <button 
                  onClick={() => setSelectedFaq(i)}
                  className="text-blue-600 text-sm font-bold mt-auto hover:underline flex items-center gap-2 group/btn"
                >
                  Read more 
                  <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Detail Modal */}
        <Modal 
          open={selectedFaq !== null} 
          onClose={() => setSelectedFaq(null)} 
          title={selectedFaq !== null ? FAQ_ANSWERS[selectedFaq].q : ''}
          size="md"
        >
          {selectedFaq !== null && (
            <div className="py-2">
              {FAQ_ANSWERS[selectedFaq].content}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-4">Still need help? Our support team is ready to assist you.</p>
                <button 
                  onClick={() => setSelectedFaq(null)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="text-lg font-black tracking-tighter text-slate-400">
              Rizqara <span className="text-slate-300">Solution</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

