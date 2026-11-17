// src/pages/Landing/Workflow.tsx
import { Camera, GitBranch, Activity, Scale, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const STAGES = [
  {
    icon: Camera,
    step: 'Stage 1',
    title: 'Detect',
    description:
      'Continuous optical analysis of every CCTV feed identifies people and motion across the campus from entry gates to corridors.',
  },
  {
    icon: GitBranch,
    step: 'Stage 2',
    title: 'Track',
    description:
      'Persistent subject tracking keeps identity across occlusions and crowd surges — the difference between people moving and people fighting.',
  },
  {
    icon: Activity,
    step: 'Stage 3',
    title: 'Analyse',
    description:
      'Body-relative kinematics measure strike velocity and posture collapse — fast limbs, explosive trunk motion, knockdowns — not guesses.',
  },
  {
    icon: Scale,
    step: 'Stage 4',
    title: 'Classify',
    description:
      'A multi-task model scores aggression, severity and scene risk — calibrated so 0.8 actually means 80% likelihood, not a tuned heuristic.',
  },
  {
    icon: Siren,
    step: 'Stage 5',
    title: 'Dispatch',
    description:
      'Confirmed incidents route instantly to the nearest guard, HOD Warden and the chief proctor, with evidence captured and sealed.',
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="lp-section border-y border-neutral-200/70 bg-neutral-100/50 dark:border-white/5 dark:bg-[#08090a]/60">
      <div className="lp-container">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <span className="lp-eyebrow lp-eyebrow-accent">How it works</span>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight text-neutral-900 dark:text-white sm:text-4xl md:text-5xl">
              See it. Validate it.
              <br />
              <span className="lp-gradient-text">Act on it — in seconds.</span>
            </h2>
          </motion.div>
          <motion.p
            className="max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
          >
            Aggression is not a single frame. C3S fuses five stages into one verified chain:
            detection → tracking → kinematics → calibrated classification → operator-confirmed dispatch.
          </motion.p>
        </div>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map(({ icon: Icon, step, title, description }, index) => (
            <motion.li
              key={step}
              className="lp-card lp-card-interactive relative flex flex-col gap-3 p-5"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.09, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200/70 bg-orange-50 text-[#ff602e] dark:border-orange-500/20 dark:bg-orange-500/10">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {step}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>

        {/* Bottom discriminant: what separates C3S from raw CCTV */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Hysteresis, not hard thresholds',
              description:
                'Asymmetric leaky integrators confirm only sustained aggression — no single-frame false alarms, no flapping between states.',
            },
            {
              title: 'Operator-in-the-loop triage',
              description:
                'Every AI alert requires a human confirm or false-positive verdict, which feeds a hard-negative retrain loop.',
            },
            {
              title: 'Forensic-grade evidence',
              description:
                'Auto-captured snapshots and pre/post video are hashed with SHA-256 for an immutable chain of custody.',
            },
          ].map(({ title, description }, index) => (
            <motion.div
              key={title}
              className="rounded-2xl border border-neutral-200/70 bg-white/70 p-5 dark:border-white/5 dark:bg-white/[0.02]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ff602e]">
                {title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/control-room"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            See the live command centre
          </Link>
        </div>
      </div>
    </section>
  );
}
