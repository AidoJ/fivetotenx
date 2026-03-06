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
    className="w-full max-w-[420px] aspect-[1.75/1] rounded-2xl overflow-hidden relative"
    style={{
      background: 'linear-gradient(145deg, #0E0B1F 0%, hsl(260 45% 15%) 50%, #0E0B1F 100%)',
      boxShadow: '0 25px 60px hsl(260 60% 20% / 0.4), 0 0 0 1px hsl(260 40% 25% / 0.5)',
    }}
  >
    {/* Gradient accent line */}
    <div
      className="absolute top-0 left-0 right-0 h-1"
      style={{ backgroundImage: 'var(--gradient-vibrant)' }}
    />

    {/* Content */}
    <div className="relative z-10 h-full flex flex-col justify-between p-6">
      {/* Top: Logo */}
      <div className="flex items-start justify-between">
        <img src={logo} alt="5to10X" className="h-12 w-auto" />
      </div>

      {/* Bottom: Contact info */}
      <div className="space-y-1">
        <h3
          className="text-lg font-display font-bold"
          style={{ color: 'hsl(0 0% 95%)' }}
        >
          {name}
        </h3>
        <p
          className="text-xs font-medium tracking-wide uppercase"
          style={{ color: 'hsl(260 60% 70%)' }}
        >
          {title}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'hsl(220 20% 72%)' }}
          >
            <Mail className="w-3 h-3" />
            {email}
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'hsl(220 20% 72%)' }}
          >
            <Phone className="w-3 h-3" />
            {phone}
          </a>
          <a
            href="https://5to10x.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'hsl(220 20% 72%)' }}
          >
            <Globe className="w-3 h-3" />
            5to10x.app
          </a>
        </div>
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
