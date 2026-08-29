import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ContactUsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <span className="text-xs font-mono text-slate-500">24/7 Priority Support</span>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Contact SpeakWise AI
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
          Have questions about your speech practice, payment gateway subscriptions, or enterprise training plans? Our team responds within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Cols: Contact Information & FAQ */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="neu-flat p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Support & Inquiries</h3>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl neu-pressed">
                <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Email Support</div>
                  <div className="text-slate-500 font-mono mt-0.5">support@speakwise.ai</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Replies within 12-24 hours</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl neu-pressed">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Operating Hours</div>
                  <div className="text-slate-500 mt-0.5">Monday - Saturday: 9:00 AM – 8:00 PM IST</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl neu-pressed">
                <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Headquarters</div>
                  <div className="text-slate-500 mt-0.5">SpeakWise AI Technologies, Bangalore, India</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="neu-flat p-6 space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Billing & Gateway Assistance</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              For transaction issues, invoice receipts, or refund queries, include your payment transaction ID or registered email address for expedited review.
            </p>
          </Card>
        </div>

        {/* Right 7 Cols: Contact Form */}
        <div className="lg:col-span-7">
          <Card className="neu-flat p-6 sm:p-8">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center shadow-neu-glow">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
                  Thank you for reaching out, {name}. Our customer support team has received your ticket and will reply to <strong className="text-indigo-600 dark:text-indigo-400">{email}</strong> shortly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                  Send Us a Direct Message
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Inquiry Topic</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Support" className="dark:bg-slate-900">Technical / Speech AI Support</option>
                      <option value="Billing" className="dark:bg-slate-900">Billing & Payment Inquiries</option>
                      <option value="Enterprise" className="dark:bg-slate-900">Enterprise Team Coaching</option>
                      <option value="Feedback" className="dark:bg-slate-900">Feature Request & Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can our speech coaching team help you today?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3.5 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center rounded-xl py-3 text-xs font-extrabold shadow-lg shadow-indigo-600/30"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
