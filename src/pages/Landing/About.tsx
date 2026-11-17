// src/pages/Landing/About.tsx
import { Info, Compass, HelpCircle, Users, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  return (
    <section className="lp-section bg-[#fcfaf6] dark:bg-[#050505]">
      <div className="lp-container">
        <motion.div
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <span className="lp-eyebrow lp-eyebrow-accent">
            <Info className="h-3.5 w-3.5" />
            Our mission
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl md:text-5xl">
            One campus. One defence grid.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
            We believe campus safety and navigation should be unified. C3S fuses MITS Gwalior's
            indoor mapping, 24/7 AI-validated surveillance and instant responder dispatch into a
            single, trusted defence grid for{' '}
            <strong className="text-neutral-900 dark:text-white">Madhav Institute of Technology and Science</strong>.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Compass,
              tone: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
              title: 'Why C3S exists',
              body: 'MITS is an extensive ecosystem of blocks, labs and gates. C3S combines precision indoor mapping with real-time emergency safety — one grid, not two tools.',
            },
            {
              icon: HelpCircle,
              tone: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
              title: 'The problem we solve',
              body: 'Standard navigation stops at the entrance. C3S picks up indoors — room-level guidance to lecture halls, labs and safety points across every floor.',
            },
            {
              icon: Users,
              tone: 'text-[#ff602e] bg-orange-500/10 border-orange-500/20',
              title: 'Built for everyone',
              body: 'Students rushing to lectures, visitors finding the conclave, heads of departments locating their office — and guards responding to an SOS in under three seconds.',
            },
            {
              icon: RefreshCw,
              tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
              title: 'Always improving',
              body: 'Every verified incident calibrates the system: thresholds tune to the campus, routes sharpen, and response gets measurably faster over time.',
            },
          ].map(({ icon: Icon, tone, title, body }, index) => (
            <motion.div
              key={title}
              className="lp-card p-6"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.09, ease: 'easeOut' }}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-neutral-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
