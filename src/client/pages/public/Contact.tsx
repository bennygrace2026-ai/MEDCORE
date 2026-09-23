import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  const { settings, frontendSettings } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Course Inquiry',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: 'Your message has been sent to the administrator!' });
        setFormData({ name: '', email: '', subject: 'Course Inquiry', message: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'A network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic mb-4">Contact Support</h1>
          <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
            Have questions about MedCore Academy? Reach out to our team of medical education experts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200">
              <h2 className="text-xl font-black text-zinc-900 uppercase italic mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Email Us</p>
                    <p className="text-zinc-900 font-bold">{frontendSettings?.contactEmail || 'support@uni9jamedia.com'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Phone className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Call Us</p>
                    <p className="text-zinc-900 font-bold">{frontendSettings?.contactPhone || settings?.supportPhone || '+234 XXX XXX XXXX'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Location</p>
                    <p className="text-zinc-900 font-bold">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/20 blur-3xl rounded-full" />
              <h3 className="text-lg font-black uppercase italic mb-2">Academic Support</h3>
              <p className="text-zinc-400 text-sm font-medium">
                Our academic counselors are available Mon-Fri, 9am - 5pm for course guidance.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl shadow-zinc-200"
          >
            {status && (
              <div className={`mb-8 p-4 rounded-2xl flex items-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
                <p className="text-sm font-bold">{status.message}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Subject</label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium"
                >
                  <option>Course Inquiry</option>
                  <option>Payment Issue</option>
                  <option>Technical Support</option>
                  <option>Collaboration</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Message</label>
                <textarea 
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5} 
                  className="w-full px-5 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600 transition-all font-medium resize-none" 
                  placeholder="How can we help you today?" 
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-3" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
