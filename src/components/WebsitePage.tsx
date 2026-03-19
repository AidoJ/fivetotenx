import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, ArrowLeft, Zap, TrendingUp, BarChart3, CheckCircle, X,
  Clock, Users, Cog, Rocket, Shield, Eye, Link2,
  CreditCard, Mail, MessageSquare, Database, Phone,
  Sparkles, ChevronRight, PlayCircle } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo-5to10x-new.png';
import logoWhiteStrap from '@/assets/logo-5to10x-white-strap.png';
import cellularWellbeingImg from '@/assets/cellular-wellbeing.png';
import rejuvenatorsLogo from '@/assets/rejuvenators-logo.png';
import creatorsLogo from '@/assets/13creators-logo.png';
import cellularWellbeingLogo from '@/assets/cellular-wellbeing-logo.png';
import headshotEoghan from '@/assets/headshot-eoghan.png';
import headshotAidan from '@/assets/headshot-aidan.png';
import logoGoogle from '@/assets/logo-google.png';
import logoXero from '@/assets/logo-xero.png';
import logoStripe from '@/assets/logo-stripe.png';
import logoTwilio from '@/assets/logo-twilio.png';
import logoResend from '@/assets/logo-resend.png';
import logoChatGPT from '@/assets/logo-chatgpt.png';
import logoClaude from '@/assets/logo-claude.png';
import logoSupabase from '@/assets/logo-supabase.png';
import NewsSection from '@/components/NewsSection';
import ClarityEngineSection from '@/components/ClarityEngineSection';
import { FormData, initialFormData, calculateROI, ROIResults } from '@/lib/formTypes';
import StepIndicator from '@/components/StepIndicator';
import BusinessSnapshot from '@/components/steps/BusinessSnapshot';
import CustomerMetrics from '@/components/steps/CustomerMetrics';
import OperationalEfficiency from '@/components/steps/OperationalEfficiency';
import GrowthOpportunity from '@/components/steps/GrowthOpportunity';
import ROIDashboard from '@/components/ROIDashboard';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const stagger = (delay: number) => ({
  ...fadeUp,
  transition: { duration: 0.6, delay }
});

/* ─────────────── Section Components ─────────────── */

const HeroSection = ({ onStartAssessment }: {onStartAssessment: () => void;}) =>
<section
  className="relative flex flex-col items-center justify-center px-4 py-20 md:py-32 overflow-hidden max-w-full"
  style={{ background: '#010100' }}>
  
    <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9 }}
    className="relative z-10 text-center w-full max-w-4xl mx-auto space-y-8 px-2">
    
      <motion.img

      alt="5to10X — Build • Innovate • Scale"
      className="max-h-56 sm:max-h-[28rem] md:max-h-[36rem] w-auto max-w-full mx-auto drop-shadow-2xl"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }} src="/lovable-uploads/840e15a9-3ed0-4c4b-9699-1a4d9a046d8c.webp" />
    

      




    

      <h1
      className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-display font-bold leading-tight break-words"
      style={{ color: 'hsl(0 0% 95%)' }}>
      
        What if your business could run{' '}
        <span style={{ color: '#1789CE' }}>
          5–10x more efficiently?
        </span>
      </h1>

      <p
      className="text-sm sm:text-base md:text-xl max-w-2xl mx-auto leading-relaxed"
      style={{ color: 'hsl(220 20% 72%)' }}>
      
        Discover how AI-powered operational apps can eliminate manual work and transform your business in weeks.
      </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-4 w-full">
          <Button
        onClick={onStartAssessment}
        size="lg"
        className="text-sm sm:text-base md:text-lg px-6 md:px-10 py-6 gap-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-normal"
        style={{ background: '#1789CE', color: 'white', border: 'none', boxShadow: '0 0 30px #1789CE33' }}>
        
            <span className="flex items-center gap-2 text-center">
              Discover Your Hidden Efficiency
              <ArrowRight className="w-5 h-5 shrink-0" />
            </span>
          </Button>
          <p className="text-sm" style={{ color: 'hsl(220 15% 55%)' }}>
            Takes 2 minutes &bull; No obligation
          </p>
        </div>
    </motion.div>
  </section>;


const ShiftSection = () =>
<section className="bg-background px-4 py-20 md:py-28">
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-12">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-6">
          A Major Shift Is Happening
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Artificial Intelligence and modern automation tools are allowing small and mid-sized companies to run leaner, faster, and far more efficiently than ever before.
        </p>
      </motion.div>

      <motion.div {...stagger(0.2)} className="mb-12">
        <p className="text-center text-foreground font-semibold mb-6">
          Processes that once required:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
          {['Spreadsheets', 'Manual Admin', 'Endless Emails', 'Staff Coordination', 'Repetitive Data Entry'].map((item, i) =>
        <motion.div
          key={item}
          {...stagger(0.1 * i)}
          className="rounded-xl border border-border bg-card p-4 text-center"
          style={{ boxShadow: 'var(--shadow-card)' }}>
          
              <X className="w-8 h-8 mx-auto mb-2" strokeWidth={3} style={{ color: '#C42D64' }} />
              <span className="text-sm font-medium text-foreground">{item}</span>
            </motion.div>
        )}
        </div>
      </motion.div>

      <motion.div {...stagger(0.4)} className="text-center space-y-4">
        <p className="text-lg text-foreground font-semibold">
          …can now be handled automatically by simple, intelligent business apps.
        </p>
        <div className="rounded-2xl p-8 inline-block" style={{ background: '#643AA4' }}>
          <p className="text-white text-lg md:text-xl font-display font-bold">
            Businesses that don’t embrace the AI wave risk being overtaken by competitors who are moving faster, making better decisions, and operating far more efficiently.
          </p>
        </div>
      </motion.div>
    </div>
  </section>;


const WhatWeDoSection = () => {
  const capabilities = [
  { icon: BarChart3, text: 'Replace messy spreadsheets' },
  { icon: Zap, text: 'Eliminate repetitive admin' },
  { icon: MessageSquare, text: 'Automate communication with clients and staff' },
  { icon: CreditCard, text: 'Streamline booking and payment systems' },
  { icon: Eye, text: 'Improve reporting and visibility' },
  { icon: Link2, text: 'Connect the tools you already use' }];


  return (
    <section className="bg-background px-4 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
           <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            What{' '}
            <span style={{ color: '#643AA4' }}>
              5to10x
            </span>{' '}
            Does
          </h2>
          <p className="text-lg max-w-3xl mx-auto leading-relaxed text-muted-foreground">
            We analyse how your business actually runs — the real workflows behind the scenes.
            Then we identify where simple technology can remove friction and dramatically improve efficiency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, i) =>
          <motion.div
            key={cap.text}
            {...stagger(0.1 * i)}
            className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
            style={{ boxShadow: 'var(--shadow-card)' }}>
            
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#643AA4' }}>
                <cap.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground">{cap.text}</p>
            </motion.div>
          )}
        </div>

        <motion.p {...stagger(0.5)} className="text-center mt-8 text-base text-muted-foreground">
          Instead of forcing your business to adapt to generic software, we build <strong className="text-foreground">custom operational apps around your workflow</strong>.
        </motion.p>
      </div>
    </section>);

};

const RapidDeploySection = () => {
  const examples = [
  'Booking & scheduling systems',
  'Client portals',
  'Staff portals',
  'Automated quoting tools',
  'Workflow automation dashboards',
  'Internal management systems',
  'AI-assisted business tools'];


  return (
    <section className="bg-background px-4 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            Rapid App Deployment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional software projects take months and huge budgets. We take a different approach.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div {...stagger(0.2)}>
            <p className="text-foreground mb-6 leading-relaxed">
              Using modern development frameworks and AI-assisted engineering, we rapidly design and deploy functional operational apps for businesses.
            </p>
            <ul className="space-y-3">
              {examples.map((ex, i) =>
              <li key={i} className="flex items-center gap-3 text-foreground">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">{ex}</span>
                </li>
              )}
            </ul>
          </motion.div>

          <motion.div
            {...stagger(0.4)}
            className="rounded-2xl border border-border p-8 text-center"
            style={{ boxShadow: 'var(--shadow-card)', background: 'hsl(var(--card))' }}>
            
            <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-4xl font-display font-bold text-foreground mb-2">1–2 Weeks</p>
            <p className="text-muted-foreground">Many MVP apps delivered</p>
            <a href="https://cellularwellbeing.lovable.app" target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <img src={cellularWellbeingImg} alt="Cellular Wellbeing" className="rounded-xl w-full object-cover" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>);

};

const IntegrationsSection = () => {
  const integrations = [
  { name: 'Google', category: 'Calendar & Workspace', logo: logoGoogle },
  { name: 'Xero', category: 'Accounting', logo: logoXero },
  { name: 'Stripe', category: 'Payments', logo: logoStripe },
  { name: 'Twilio', category: 'Communications', logo: logoTwilio },
  { name: 'Resend', category: 'Email', logo: logoResend },
  { name: 'ChatGPT', category: 'AI Assistant', logo: logoChatGPT },
  { name: 'Claude', category: 'AI Assistant', logo: logoClaude },
  { name: 'Supabase', category: 'Backend & Data', logo: logoSupabase },
  ];


  return (
    <section className="px-4 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(0 0% 95%)' }}>
            Built to Integrate With the Tools{' '}
            <span style={{ color: '#D88E08' }}>
              You Already Use
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(220 20% 72%)' }}>
            Your business doesn't need to replace everything to become more efficient.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          {integrations.map((int, i) =>
          <motion.div
            key={int.name}
            {...stagger(0.08 * i)}
            className="rounded-xl border p-6 text-center flex flex-col items-center gap-3"
            style={{ borderColor: 'hsl(0 0% 90%)', background: 'white' }}>
            
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center p-3">
                <img src={int.logo} alt={int.name} className="max-h-[4.5rem] max-w-[4.5rem] object-contain" />
              </div>
              <span className="text-base font-bold" style={{ color: 'hsl(0 0% 15%)' }}>{int.name}</span>
              <span className="text-xs" style={{ color: '#D88E08' }}>{int.category}</span>
            </motion.div>
          )}
        </div>

        <motion.div {...stagger(0.5)} className="text-center space-y-4">
          <p className="text-base" style={{ color: 'hsl(220 20% 72%)' }}>
            If a platform provides API access, we can usually integrate with it. Your existing tools can finally work together in a <strong style={{ color: 'hsl(0 0% 88%)' }}>single streamlined workflow</strong>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>Less admin.</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>Fewer errors.</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold" style={{ color: '#398C08' }}>More time to grow.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>);

};

const HiddenCostSection = () => {
  const tasks = [
  { task: 'Coordinating bookings', minutes: 30 },
  { task: 'Sending confirmations', minutes: 20 },
  { task: 'Updating spreadsheets', minutes: 15 },
  { task: 'Following up clients', minutes: 10 }];


  return (
    <section className="bg-background px-4 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            The Hidden Cost of{' '}
            <span style={{ color: '#643AA4' }}>Manual Workflows</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Small inefficiencies across a business add up to huge hidden costs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div {...stagger(0.2)} className="space-y-3">
            <p className="text-foreground font-semibold mb-4">A team member spends daily:</p>
            {tasks.map((t, i) =>
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <span className="text-sm text-foreground">{t.task}</span>
                <span className="text-sm font-bold" style={{ color: '#643AA4' }}>{t.minutes} min</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border-2 p-4 mt-4" style={{ borderColor: '#643AA433', background: '#643AA40D' }}>
              <span className="text-sm font-semibold text-foreground">Total per day</span>
              <span className="text-lg font-bold" style={{ color: '#643AA4' }}>75 min</span>
            </div>
          </motion.div>

          <motion.div {...stagger(0.4)} className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-muted-foreground mb-2">Across a team of 5 staff</p>
              <p className="text-4xl font-display font-bold text-foreground">20–30 hrs</p>
              <p className="text-muted-foreground">lost per week</p>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: '#643AA4' }}>
              <p className="text-white/80 text-sm mb-1">Over a year, that can represent</p>
              <p className="text-3xl font-display font-bold text-white">Tens of thousands</p>
              <p className="text-white/80 text-sm">in operational cost</p>
            </div>
            <p className="text-center text-foreground font-medium">
              Automation allows your team to focus on <strong>higher value work</strong> that grows the business.
            </p>
          </motion.div>
        </div>
      </div>
    </section>);

};

const SelfAssessmentSection = () => {
  const [answers, setAnswers] = useState<boolean[]>([false, false, false, false, false]);
  const questions = [
  'Are staff manually copying information between systems?',
  'Are bookings, quotes or orders coordinated through email or messages?',
  'Are spreadsheets used to track important business operations?',
  'Do staff spend significant time on repetitive admin tasks?',
  'Are systems disconnected from each other?'];

  const yesCount = answers.filter(Boolean).length;

  return (
    <section className="px-4 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
           <h2 className="text-2xl md:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(0 0% 95%)' }}>
            Where Are You{' '}
            <span style={{ color: '#E0436A' }}>
              Losing Time?
            </span>
          </h2>
          <p className="text-lg" style={{ color: 'hsl(220 20% 72%)' }}>
            Quick diagnostic — answer honestly:
          </p>
        </motion.div>

        <motion.div {...stagger(0.2)} className="space-y-4 mb-8">
          {questions.map((q, i) =>
          <div
            key={i}
            className="rounded-xl border p-5 flex items-center justify-between gap-4 cursor-pointer transition-all"
            style={{
              borderColor: answers[i] ? '#E0436A' : '#E0436A44',
              background: answers[i] ? '#E0436A22' : '#E0436A11'
            }}
            onClick={() => {
              const next = [...answers];
              next[i] = !next[i];
              setAnswers(next);
            }}>
            
              <span className="text-sm" style={{ color: 'hsl(220 20% 85%)' }}>{q}</span>
              <div className="flex gap-2 shrink-0">
                <button
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                answers[i] ? 'text-white' : 'text-white/40'}`
                }
                style={answers[i] ? { background: '#E0436A' } : { background: '#E0436A33' }}
                onClick={(e) => {e.stopPropagation();const next = [...answers];next[i] = true;setAnswers(next);}}>
                
                  Yes
                </button>
                <button
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !answers[i] ? 'bg-muted text-foreground' : 'text-white/40'}`
                }
                style={!answers[i] ? {} : { background: '#E0436A33' }}
                onClick={(e) => {e.stopPropagation();const next = [...answers];next[i] = false;setAnswers(next);}}>
                
                  No
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {yesCount >= 2 &&
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
           className="rounded-2xl p-6 text-center"
           style={{ background: '#398C08' }}>
          
            <CheckCircle className="w-8 h-8 text-white mx-auto mb-3" />
            <p className="text-white font-display font-bold text-lg">
              You answered Yes to {yesCount} questions
            </p>
            <p className="text-white/80 text-sm mt-1">
              There's likely a strong opportunity to improve efficiency through automation and operational apps.
            </p>
          </motion.div>
        }
      </div>
    </section>);

};

const CaseStudiesSection = () => {
  const clients = [
  {
    name: 'Rejuvenators',
    description: 'Custom booking and therapist management systems.',
    logo: rejuvenatorsLogo,
    logoClass: 'max-h-24'
  },
  {
    name: '13Creators',
    description: 'Operational workflow and automation tools.',
    logo: creatorsLogo,
    logoClass: 'max-h-36'
  },
  {
    name: 'Cellular Wellbeing',
    description: 'Client systems and digital service delivery tools.',
    logo: cellularWellbeingLogo,
    logoClass: 'max-h-52'
  }];


  return (
    <section className="bg-background px-4 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            Real Businesses We've Helped
          </h2>
          <p className="text-lg text-muted-foreground">
            Each project focused on removing friction from daily business operations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clients.map((client, i) =>
          <motion.div
            key={client.name}
            {...stagger(0.15 * i)}
            className="rounded-2xl border border-border bg-card p-6 space-y-4"
            style={{ boxShadow: 'var(--shadow-card)' }}>
            
              <div className="rounded-xl bg-white h-40 flex items-center justify-center p-4">
                <img src={client.logo} alt={client.name} className={`${client.logoClass} w-auto object-contain`} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{client.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{client.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

const ProcessSection = () => {
  const steps = [
  { num: '1', title: 'Business Flow Analysis', desc: 'We map how your business currently operates and identify inefficiencies.', icon: Eye },
  { num: '2', title: 'Opportunity Mapping', desc: 'We identify where custom apps can deliver the biggest efficiency gains.', icon: TrendingUp },
  { num: '3', title: 'Rapid App Build', desc: 'We design and build a working MVP quickly.', icon: Rocket },
  { num: '4', title: 'Deploy & Optimise', desc: 'You test the system within your real workflow and we refine it.', icon: Cog }];


  return (
    <section className="px-4 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(0 0% 95%)' }}>
            The 5to10x{' '}
            <span style={{ color: '#D88E08' }}>
              Process
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) =>
          <motion.div
            key={step.num}
            {...stagger(0.15 * i)}
            className="text-center space-y-4">
            
              <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: '#643AA4' }}>
              
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <div
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#D88E08' }}>
              
                Step {step.num}
              </div>
              <h3 className="font-display font-bold text-base" style={{ color: 'hsl(0 0% 95%)' }}>
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: 'hsl(220 20% 65%)' }}>{step.desc}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

const ZeroRiskSection = () =>
<section className="bg-background px-4 py-20 md:py-28">
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 tracking-wide">
          Our Guarantee
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
          We Build It. You Judge It.<br className="hidden md:block" /> Then You Decide.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Most agencies ask for tens of thousands upfront and deliver months later. We flip that entirely.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            step: '01',
            title: 'We Build Your System',
            description: 'In 1–2 weeks, we design and build a working MVP tailored to your business — not a mockup, a real system you can use.',
            icon: Rocket
          },
          {
            step: '02',
            title: 'You See It Working',
            description: 'We demo the live system. You test it, ask questions, and see exactly how it transforms your operations.',
            icon: Eye
          },
          {
            step: '03',
            title: 'You Decide — Zero Pressure',
            description: 'Love it? We go live. Not convinced? Your $1,000 deposit is refunded in full. No invoices, no awkward conversations.',
            icon: Shield
          }
        ].map((item, i) => (
          <motion.div key={item.step} {...stagger(i * 0.15)}
            className="rounded-2xl border border-border bg-card p-8 relative overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}>
            <span className="absolute top-4 right-4 text-5xl font-display font-black text-primary/10">{item.step}</span>
            <item.icon className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeUp}
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              The $1,000 Commitment Deposit
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We build fast — often delivering a working MVP in 1–2 weeks. To make that happen, we need you <strong className="text-foreground">fully engaged</strong> in the discovery and build process. Timely feedback, quick decisions, and real collaboration.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">fully refundable $1,000 deposit</strong> ensures we both have skin in the game. It's your commitment to showing up — and ours to delivering something worth showing up for.
            </p>
          </div>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground text-sm"><strong>Keeps momentum</strong> — your engagement drives a faster, better result for everyone</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground text-sm"><strong>100% refundable</strong> — if the MVP doesn't deliver, you get every cent back</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground text-sm"><strong>Applied to your project</strong> — if you proceed, it comes straight off the total</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground text-sm"><strong>Working system first</strong> — you never pay for promises, only proven results</span>
            </div>
            <p className="text-xs text-muted-foreground italic pt-2">
              We've never had a client disengage — or ask for a refund. But both options are always there.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>;


const FreeTrainingSection = () => {
  const [formState, setFormState] = useState({ name: '', email: '', business: '', industry: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('training_registrations' as any).insert([{
        name: formState.name,
        email: formState.email,
        business_name: formState.business || null,
        industry: formState.industry || null
      }]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Training registration error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-20 md:py-28" style={{ background: '#000000' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <motion.div {...fadeUp} className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <PlayCircle className="w-8 h-8" style={{ color: 'hsl(260 65% 70%)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(260 60% 70%)' }}>Free Training</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
              How AI Can Transform Your Business in{' '}
              <span style={{ color: '#D88E08' }}>
                Days — Not Months
              </span>
            </h2>
            <ul className="space-y-3">
              {[
              'How AI is transforming business operations',
              'Where automation delivers the biggest ROI',
              'Real examples of SME workflow automation',
              'How simple apps replace manual processes',
              'How businesses can deploy operational tools in days'].
              map((item, i) =>
              <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-1" style={{ color: 'hsl(260 65% 70%)' }} />
                  <span className="text-sm" style={{ color: 'hsl(220 20% 78%)' }}>{item}</span>
                </li>
              )}
            </ul>
          </motion.div>

          <motion.div {...stagger(0.3)} className="rounded-2xl border p-8" style={{ borderColor: 'hsl(260 30% 25%)', background: 'hsl(260 30% 12%)' }}>
            {submitted ?
            <div className="text-center py-8 space-y-4">
                <CheckCircle className="w-12 h-12 mx-auto" style={{ color: 'hsl(260 65% 70%)' }} />
                <h3 className="font-display font-bold text-lg" style={{ color: 'hsl(0 0% 95%)' }}>You're Registered!</h3>
                <p className="text-sm" style={{ color: 'hsl(220 20% 72%)' }}>We'll be in touch with session details shortly.</p>
              </div> :

            <>
                <h3 className="font-display font-bold text-lg mb-6" style={{ color: 'hsl(0 0% 95%)' }}>
                  Register for the Free Training
                </h3>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label className="text-sm" style={{ color: 'hsl(220 20% 75%)' }}>Name</Label>
                    <Input
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1 border text-white placeholder:text-white/50"
                    style={{ background: 'hsl(260 30% 18%)', borderColor: 'hsl(260 30% 35%)' }}
                    placeholder="Your name"
                    required />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: 'hsl(220 20% 75%)' }}>Email</Label>
                    <Input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    className="mt-1 border text-white placeholder:text-white/50"
                    style={{ background: 'hsl(260 30% 18%)', borderColor: 'hsl(260 30% 35%)' }}
                    placeholder="you@business.com"
                    required />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: 'hsl(220 20% 75%)' }}>Business Name</Label>
                    <Input
                    value={formState.business}
                    onChange={(e) => setFormState((s) => ({ ...s, business: e.target.value }))}
                    className="mt-1 border text-white placeholder:text-white/50"
                    style={{ background: 'hsl(260 30% 18%)', borderColor: 'hsl(260 30% 35%)' }}
                    placeholder="Your business" />
                  </div>
                  <div>
                    <Label className="text-sm" style={{ color: 'hsl(220 20% 75%)' }}>Industry</Label>
                    <Input
                    value={formState.industry}
                    onChange={(e) => setFormState((s) => ({ ...s, industry: e.target.value }))}
                    className="mt-1 border text-white placeholder:text-white/50"
                    style={{ background: 'hsl(260 30% 18%)', borderColor: 'hsl(260 30% 35%)' }}
                    placeholder="e.g. Health & Wellness" />
                  </div>
                  <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 text-base font-semibold rounded-xl"
                  style={{ background: '#D88E08', color: 'white', border: 'none' }}>
                    {submitting ? 'Registering...' : 'Register My Spot'}
                  </Button>
                  <p className="text-xs text-center" style={{ color: 'hsl(220 15% 50%)' }}>
                    Limited session sizes so we can answer questions and explore real examples.
                  </p>
                </form>
              </>
            }
          </motion.div>
        </div>
      </div>
    </section>);
};

const FounderBio = ({ bio }: { bio: string }) => {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = bio.split('\n\n');

  return (
    <div className="text-sm text-muted-foreground leading-relaxed">
      {expanded ? (
        <div className="space-y-3">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <button onClick={() => setExpanded(false)} className="text-primary font-medium text-xs hover:underline">Show less</button>
        </div>
      ) : (
        <>
          <p className="line-clamp-3">{paragraphs[0]}</p>
          {paragraphs.length > 1 && (
            <button onClick={() => setExpanded(true)} className="text-primary font-medium text-xs hover:underline mt-2">Read more</button>
          )}
        </>
      )}
    </div>
  );
};

const CoFoundersSection = () => {
  const founders = [
  {
    name: 'Eoghan Leonard',
    role: 'Co-Founder - Principle Engineer',
    image: headshotEoghan,
    bio: 'Eoghan has deep experience across Snowflake, dbt, Salesforce, and Fivetran, and has spent his career solving the kinds of data problems that quietly slow businesses down and keep owners up at night. His focus is on helping growing businesses move from scattered spreadsheets and disconnected systems to data that is clear, reliable, and easy to use when making important decisions.\n\nHe specialises in building modern data platforms that simply work. Rather than just installing tools, Eoghan designs practical systems that bring together information from across the business — sales, operations, finance, and marketing — so owners and managers can see what\'s really happening without spending hours chasing numbers.\n\nHis client work includes companies such as David Jones, Isuzu, and Xero, where he has helped solve complex data challenges and turn raw information into insights that support better decisions.\n\nAcross every project, his approach stays the same: understand the business first, then build the technology to support it. The goal is simple — create data systems that run quietly in the background so business owners can spend less time worrying about reports and more time focusing on growth.'
  },
  {
    name: 'Aidan Leonard',
    role: 'Co-Founder - Business Analyst',
    image: '/lovable-uploads/2a135d28-39e2-42c2-8db5-11ef629b36aa.jpg',
    bio: 'Aidan is a business transformation advisor with 30+ years of experience helping organisations improve performance through smarter strategy, operational design, and data-driven decision making.\n\nHaving held senior and executive roles with organisations including Cable & Wireless, Ericsson, Almarai, Construction Skills Queensland, Civil Contractors Federation, and Orbus3, Aidan has spent his career working at the intersection of business strategy, operational efficiency, and technology transformation.\n\nHe has a deep passion for adapting cutting-edge technology to practical business challenges, helping organisations simplify complex workflows and unlock new opportunities for growth.\n\nToday Aidan works closely with SME leaders, advising them on how to modernise their operations and build businesses that run more efficiently. His work focuses on delivering practical improvements that create immediate impact — reducing operational costs, implementing analytics that improve project margins, scaling efficiently as demand grows, and designing workflow systems that cut administrative workload in half.\n\nAidan\'s philosophy is simple: when businesses combine clear strategy with the right technology and efficient workflows, growth becomes far easier to achieve.'
  }];

  return (
    <section className="bg-background px-4 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            Meet the{' '}
            <span style={{ color: '#2258B4' }}>
              Co-Founders
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A father-and-son team passionate about helping business owners simplify their systems and run leaner, more effective businesses.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {founders.map((founder, i) =>
          <motion.div
            key={founder.name}
            {...stagger(0.2 * i)}
            className="rounded-2xl border border-border bg-card overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="relative overflow-hidden flex items-center justify-center py-6" style={{ background: '#2258B4' }}>
                <img src={founder.image} alt={founder.name} className="w-1/4 h-auto rounded-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">{founder.name}</h3>
                  <p className="text-sm font-medium" style={{ color: '#1789CE' }}>{founder.role}</p>
                </div>
                <FounderBio bio={founder.bio} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);
};

const CTASection = ({ onStartAssessment }: {onStartAssessment: () => void;}) =>
<section className="bg-background px-4 py-20 md:py-28">
    <div className="max-w-3xl mx-auto text-center">
      <motion.div {...fadeUp} className="space-y-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">
          Ready to See the Opportunity in{' '}
          <span style={{ color: '#398C08' }}>
            Your Business?
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Take the Business Efficiency Self-Assessment and discover where automation could unlock major improvements.
        </p>
        <Button
        onClick={onStartAssessment}
        size="lg"
        className="text-lg px-10 py-6 gap-3 rounded-xl font-semibold transition-all hover:scale-105"
        style={{ background: '#398C08', color: 'white', border: 'none', boxShadow: '0 0 30px #398C0833' }}>
        
          <Sparkles className="w-5 h-5" />
          Start the Assessment
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  </section>;


const ContactSection = () =>
<section className="px-4 py-20" style={{ background: '#000000' }}>
    <div className="max-w-3xl mx-auto text-center">
      <motion.div {...fadeUp}>
        <Mail className="w-10 h-10 mx-auto mb-4" style={{ color: '#1789CE' }} />
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(220 15% 93%)' }}>
          Get in Touch
        </h2>
        <p className="text-lg mb-8" style={{ color: 'hsl(220 15% 65%)' }}>
          Ready to multiply your business? Drop us a line — we'd love to hear from you.
        </p>
        <a
        href="mailto:grow@5to10x.app"
        className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105"
        style={{
          background: '#2258B4',
          color: '#fff',
          boxShadow: '0 4px 20px #2258B433'
        }}>
        
          <Mail className="w-5 h-5" />
          grow@5to10x.app
        </a>
      </motion.div>
    </div>
  </section>;


const FooterSection = () =>
<footer className="px-4 py-8 border-t" style={{ background: '#010100', borderColor: 'hsl(0 0% 15%)' }}>
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src={logoWhiteStrap} alt="5to10X" className="h-12 w-auto" />
        <span className="text-sm" style={{ color: '#73AD12', opacity: 0.7 }}>
          © {new Date().getFullYear()} 5to10X — Build • Innovate • Scale
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-xs" style={{ color: '#398C08', opacity: 0.5 }}>Automate • Accelerate • Multiply</span>
      </div>
    </div>
  </footer>;


/* ─────────────── Reality Check Section ─────────────── */

const STEP_LABELS = ['Business', 'Metrics', 'Operations', 'Growth'];

const SignalCaptureSection = ({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement> }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [results, setResults] = useState<ROIResults | null>(null);

  const handleChange = (partial: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = () => {
    const roi = calculateROI(formData);
    setResults(roi);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults(null);
    setStep(0);
  };

  const steps = [
    <BusinessSnapshot key="s1" data={formData} onChange={handleChange} />,
    <CustomerMetrics key="s2" data={formData} onChange={handleChange} />,
    <OperationalEfficiency key="s3" data={formData} onChange={handleChange} />,
    <GrowthOpportunity key="s4" data={formData} onChange={handleChange} />,
  ];

  return (
    <section ref={sectionRef} className="bg-background px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 inline-block">
            Reality Check™ — Phase 1 of the Clarity Path
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-3">
            Business Snapshot
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tell us about your business in 2 minutes. We'll show you exactly where automation could unlock hidden efficiency.
          </p>
        </motion.div>

        {results ? (
          <ROIDashboard results={results} formData={formData} onReset={handleReset} />
        ) : (
          <>
            <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-border bg-card p-6 md:p-8"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2">
                  Calculate ROI
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

/* ─────────────── Main Page ─────────────── */

const WebsitePage = () => {
  const [showAssessment, setShowAssessment] = useState(false);
  const signalCaptureRef = useRef<HTMLDivElement>(null);

  const handleStartAssessment = () => {
    setShowAssessment(true);
    setTimeout(() => {
      signalCaptureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* 1. TEASER — Hero with CTA */}
      <HeroSection onStartAssessment={handleStartAssessment} />
      {/* Reality Check™ — inline assessment */}
      {showAssessment && <SignalCaptureSection sectionRef={signalCaptureRef} />}
      {/* 2. WHAT — The Problem */}
      <HiddenCostSection />
      <SelfAssessmentSection />
      {/* 3. WHY — Why Change Now */}
      <ShiftSection />
      {/* 4. HOW — Our Clarity Path */}
      <ClarityEngineSection onStart={handleStartAssessment} />
      <WhatWeDoSection />
      <IntegrationsSection />
      {/* 5. WHEN — Urgency & Speed */}
      <RapidDeploySection />
      <ZeroRiskSection />
      {/* 6. WHO — The Founders */}
      <CoFoundersSection />
      {/* 7. EXAMPLES — Case Studies */}
      <CaseStudiesSection />
      {/* 8. LATEST NEWS */}
      <NewsSection />
      {/* 9. FINAL CTA & CONTACT */}
      <FreeTrainingSection />
      <CTASection onStartAssessment={handleStartAssessment} />
      <ContactSection />
      <FooterSection />
    </div>
  );
};

export default WebsitePage;