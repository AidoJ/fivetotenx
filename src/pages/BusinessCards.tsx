import { motion } from 'framer-motion';
import { Mail, Phone, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-5to10x-new.png';

interface CardProps {
  name: string;
  title: string;
  email: string;
  phone: string;
}

const BusinessCard = ({ name, title, email, phone }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="rounded-2xl overflow-hidden relative"
    style={{
      width: '3.5in',
      height: '2in',
      background: '#FFFFFF',
      boxShadow: '0 25px 60px hsl(230 20% 70% / 0.3), 0 0 0 1px hsl(230 20% 85% / 0.5)',
    }}
  >
    {/* Gradient accent line */}
    <div
      className="absolute top-0 left-0 right-0 h-1"
      style={{ backgroundImage: 'var(--gradient-vibrant)' }}
    />

    {/* Content */}
    <div className="relative z-10 flex flex-col p-4 pt-3 gap-2">
      {/* Logo */}
      <div className="flex items-start">
        <img src={logo} alt="5to10X" className="h-10 w-auto" />
      </div>

      {/* Name & Title */}
      <div className="space-y-0">
        <h3
          className="text-sm font-display font-bold"
          style={{ color: 'hsl(230 35% 12%)' }}
        >
          {name}
        </h3>
        <p
          className="text-xs font-medium tracking-wide uppercase"
          style={{ color: 'hsl(260 50% 50%)' }}
        >
          {title}
        </p>
      </div>

      {/* Contact details stacked */}
      <div className="flex flex-col gap-1">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'hsl(230 20% 35%)' }}
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          {email}
        </a>
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'hsl(230 20% 35%)' }}
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          {phone}
        </a>
        <a
          href="https://5to10x.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'hsl(230 20% 35%)' }}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          5to10x.app
        </a>
      </div>
    </div>

    {/* Subtle radial glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 50% 40% at 80% 20%, hsl(260 65% 40% / 0.15), transparent)',
      }}
    />
  </motion.div>
);

const BusinessCards = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-10" style={{ background: '#0E0B1F' }}>
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 gap-2"
        style={{ color: 'hsl(220 20% 72%)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <h1
        className="text-2xl font-display font-bold text-center"
        style={{ color: 'hsl(0 0% 95%)' }}
      >
        Our Team
      </h1>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        <BusinessCard
          name="Eoghan Leonard"
          title="Senior Developer"
          email="eoghan@5to10x.app"
          phone="0422 286198"
        />
        <BusinessCard
          name="Aidan Leonard"
          title="Business Analyst"
          email="aidan@5to10x.app"
          phone="0409 484012"
        />
      </div>

      <p className="text-xs" style={{ color: 'hsl(220 15% 40%)' }}>
        © {new Date().getFullYear()} 5to10X — Build • Innovate • Scale
      </p>
    </div>
  );
};

export default BusinessCards;
