// src/pages/Landing/Hero.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, School, BookOpen, Coffee, Flame, Heart, ArrowUpDown, Navigation, MapPin } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import chrome from '@/assets/chrome.webp';
import firefox from '@/assets/firefox.webp';
import apple from '@/assets/safari.webp';

export default function Hero() {
    const { scrollY } = useScroll();
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
    const [isShortScreen, setIsShortScreen] = useState(window.innerHeight < 780);

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 768);
            setIsShortScreen(window.innerHeight < 780);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Heading transitions: Fades out completely by scroll 220px, Recedes/scales down
    const headingOpacity = useTransform(scrollY, [0, 220], [1, 0]);
    const headingScale = useTransform(scrollY, [0, 220], [1, 0.88]);
    const headingY = useTransform(scrollY, [0, 220], ["-50%", "-120%"]);

    // Dynamic layer index logic: Text in front (z-30) at first, then goes back (z-10) as we scroll down
    const headingZIndex = useTransform(scrollY, (y) => (y > 150 ? 10 : 30));
    const phoneZIndex = useTransform(scrollY, (y) => (y > 150 ? 30 : 10));

    // 2. Phone transitions: Opacity increases, scale increases, rotation becomes upright
    const phoneOpacity = useTransform(scrollY, [0, 250], [0.15, 1.0]);
    const phoneScale = useTransform(scrollY, [0, 420], [0.85, 1.0]);
    // Dynamically shift the phone up as the footer fades in to make room at the bottom, keeping its original full size.
    const phoneY = useTransform(
        scrollY,
        [0, 420, 480, 680],
        ["0px", "0px", "0px", isShortScreen ? (isLargeScreen ? "-95px" : "-115px") : (isLargeScreen ? "-45px" : "-65px")]
    );
    const phoneRotateX = useTransform(scrollY, [0, 420], [16, 0]);

    // 3. Side location cards fanning out: Slides out and fades in. Dims to 0.25 when details card pops out (480px to 680px)
    const cardsOpacity = useTransform(scrollY, [200, 380, 480, 680], [0, 1, 1, 0.25]);
    const cardsScale = useTransform(scrollY, [200, 420], [0.8, 1]);
    const leftCardsX = useTransform(scrollY, [220, 480], [222, 0]);
    const rightCardsX = useTransform(scrollY, [220, 480], [-222, 0]);

    // 4. Footer transitions: Slides and fades in at the bottom between scroll 480px and 680px
    const footerOpacity = useTransform(scrollY, [480, 680], [0, 1]);
    const footerY = useTransform(scrollY, [480, 680], [40, 0]);

    // 5. Destination card pop-out: Slides out on the right between scroll 480px and 750px
    // On mobile viewports, keep cardY offset small so it overlays neatly on the phone instead of sliding deep into the footer.
    const cardX = useTransform(scrollY, [480, 750], [0, isLargeScreen ? 230 : 0]);
    const cardY = useTransform(scrollY, [480, 750], [0, isLargeScreen ? -40 : 45]);
    const cardOpacity = useTransform(scrollY, [520, 700], [0, 1]);
    const cardScale = useTransform(scrollY, [480, 750], [0.7, 1]);

    return (
        <div className="relative w-full h-[240vh] bg-[#faf7f2] dark:bg-neutral-950">
            {/* Pinned viewport screen */}
            <section className="sticky top-0 h-screen w-full overflow-hidden blueprint-grid text-neutral-900 dark:text-white">

                {/* Decorative top background gradient mist */}
                <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-[#ff602e]/5 to-transparent pointer-events-none z-0" />

                {/* Absolutely positioned headline centered in the viewport at scroll 0 */}
                <motion.h1
                    style={{
                        opacity: headingOpacity,
                        scale: headingScale,
                        x: "-50%",
                        y: headingY,
                        zIndex: headingZIndex,
                    }}
                    className="absolute top-1/2 left-1/2 w-full max-w-5xl text-4xl sm:text-7xl md:text-[80px] lg:text-[92px] font-extrabold tracking-tighter text-center leading-[1.01] select-none"
                >
                    Reimagine How <br />
                    You Navigate <br />
                    <span className="text-[#ff602e]">Your Campus</span>
                </motion.h1>

                {/* Absolutely positioned Device & Cards wrapper visually centered in the viewport */}
                <div className="absolute top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[280px] h-[480px] sm:h-[530px] z-20">

                    {/* Soft Background Glow under the phone */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#ff602e]/12 blur-[65px] pointer-events-none z-0" />

                    {/* LEFT COLUMN OF CARDS - fans out to the left */}
                    <motion.div
                        style={{
                            opacity: cardsOpacity,
                            scale: cardsScale,
                            x: leftCardsX,
                            y: "-50%",
                        }}
                        className="hidden lg:flex flex-col gap-8 absolute right-full mr-16 top-1/2 z-10 w-[260px] select-none"
                    >
                        {/* Card 1 */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 -translate-y-4 translate-x-4 -rotate-[6deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                                <School size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Conclave Centre</h4>
                                <p className="text-[10px] text-neutral-400 truncate">Main Building • Floor 0</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">120m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 translate-x-0 rotate-[3deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                <Flame size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">CIoT Lab</h4>
                                <p className="text-[10px] text-neutral-400 truncate">AI Building • Floor 0</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">340m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 translate-y-4 translate-x-3 -rotate-[4deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Library</h4>
                                <p className="text-[10px] text-neutral-400 truncate">Campus Area • Outdoor</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">80m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* PHONE DEVICE MOCKUP */}
                    <motion.div
                        style={{
                            scale: phoneScale,
                            y: phoneY,
                            transformPerspective: 1000,
                            rotateX: phoneRotateX,
                            opacity: phoneOpacity,
                            zIndex: phoneZIndex,
                        }}
                        className="relative w-full h-full bg-neutral-950 rounded-[44px] shadow-2xl p-[4px] border-[2.5px] border-neutral-300 dark:border-neutral-700 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                    >
                        {/* Metallic Side Buttons */}
                        {/* Ring / Action Button */}
                        <div className="absolute -left-[3px] top-[90px] w-[3px] h-6 bg-neutral-400 dark:bg-neutral-500 rounded-l shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1)]" />
                        {/* Volume Up */}
                        <div className="absolute -left-[3px] top-[130px] w-[3px] h-12 bg-neutral-400 dark:bg-neutral-500 rounded-l shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1)]" />
                        {/* Volume Down */}
                        <div className="absolute -left-[3px] top-[190px] w-[3px] h-12 bg-neutral-400 dark:bg-neutral-500 rounded-l shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1)]" />
                        {/* Power Button */}
                        <div className="absolute -right-[3px] top-[150px] w-[3px] h-20 bg-neutral-400 dark:bg-neutral-500 rounded-r shadow-[inset_-1px_1px_1px_rgba(255,255,255,0.1)]" />

                        {/* Inner Glossy Screen Boundary Bezel */}
                        <div className="flex-1 bg-[#fbf9f4] dark:bg-neutral-950 rounded-[38px] overflow-hidden flex flex-col justify-between border-[3.5px] border-neutral-950 relative z-10">
                            {/* Glossy Screen Reflection Diagonal Flare */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20 rounded-[38px]" />

                            {/* Status Bar Section */}
                            <div className="h-10 w-full px-6 flex items-center justify-between text-[11px] font-bold text-neutral-800 dark:text-neutral-200 select-none z-20 relative shrink-0">
                                <span className="z-10">9:41</span>
                                {/* Dynamic Island Notch */}
                                <div className="w-[85px] h-[22px] rounded-full bg-black shrink-0 absolute left-1/2 -translate-x-1/2 top-2 z-10" />
                                <div className="flex items-center gap-1 z-10 text-neutral-800 dark:text-neutral-200">
                                    <span className="material-symbols-outlined text-[12px] font-bold">signal_cellular_4_bar</span>
                                    <span className="material-symbols-outlined text-[12px] font-bold">wifi</span>
                                    <span className="material-symbols-outlined text-[12px] font-bold">battery_5_bar</span>
                                </div>
                            </div>

                            {/* mobile map view */}
                            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                                {/* Stylized Vector Map Canvas in Background */}
                                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#faf7f2] dark:bg-neutral-900">
                                    <svg className="absolute inset-0 w-full h-full opacity-70 dark:opacity-40" viewBox="0 0 320 600" preserveAspectRatio="xMidYMid slice">
                                        <defs>
                                            <pattern id="mapGridHero" width="20" height="20" patternUnits="userSpaceOnUse">
                                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-neutral-900/5 dark:text-white/5" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#mapGridHero)" />

                                        {/* Campus Pathways */}
                                        <path d="M 60 160 L 260 160 M 160 160 L 160 480 M 60 360 L 260 360" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-neutral-300/60 dark:text-neutral-800/60" />
                                        <path d="M 160 480 L 160 560" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" className="text-neutral-300/60 dark:text-neutral-800/60" />

                                        {/* Main Building Block */}
                                        <rect x="50" y="380" width="220" height="90" rx="12" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="fill-orange-500/5 stroke-orange-500/20 dark:fill-orange-500/10" />
                                        <text x="160" y="430" textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400 font-black text-[11px] uppercase tracking-wider">Main Building</text>

                                        {/* AI Building Block */}
                                        <rect x="30" y="70" width="110" height="70" rx="12" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="fill-blue-500/5 stroke-blue-500/20 dark:fill-blue-500/10" />
                                        <text x="85" y="110" textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400 font-black text-[10px] uppercase tracking-wider">AI Building</text>

                                        {/* Library Block */}
                                        <rect x="180" y="75" width="110" height="65" rx="12" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="fill-yellow-500/5 stroke-yellow-500/20 dark:fill-yellow-500/10" />
                                        <text x="235" y="110" textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400 font-black text-[10px] uppercase tracking-wider">Library</text>

                                        {/* Active Route Highlight (Main Gate -> Main Building Lobby/Conclave Centre) */}
                                        <path d="M 160 550 L 160 440" fill="none" stroke="#ff602e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M 160 440 L 120 440" fill="none" stroke="#ff602e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />

                                        {/* Starting Point Marker (Main Gate) */}
                                        <g transform="translate(160, 550)">
                                            <circle r="6" className="fill-emerald-500" />
                                            <circle r="12" fill="none" className="stroke-emerald-500/50" strokeWidth="2" />
                                        </g>

                                        {/* Destination Marker (Conclave Centre) */}
                                        <g transform="translate(120, 440)">
                                            <circle r="6" className="fill-[#ff602e]" />
                                            <circle r="12" fill="none" className="stroke-[#ff602e]/50" strokeWidth="2" />
                                        </g>
                                    </svg>
                                </div>

                                {/* Floating Route planning capsule */}
                                <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-black/5 dark:border-white/5 p-2.5 mx-2.5 mt-2 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300">
                                            <Navigation size={14} className="rotate-45" />
                                        </div>

                                        {/* Inputs Stack */}
                                        <div className="flex-1 flex flex-col gap-1 relative py-0.5">
                                            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2.5 py-1 text-left">
                                                <div className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500 mr-2 shrink-0" />
                                                <span className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                                    Main Gate
                                                </span>
                                            </div>

                                            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2.5 py-1 text-left">
                                                <MapPin size={10} className="text-[#ff602e] mr-2 shrink-0" />
                                                <span className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                                    Conclave Centre
                                                </span>
                                            </div>

                                            <div className="absolute left-[13px] top-[14px] bottom-[14px] w-[1px] bg-neutral-300 dark:bg-neutral-700 pointer-events-none" />
                                        </div>

                                        {/* Swap Button */}
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                                            <ArrowUpDown size={12} />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Sheet Card */}
                                <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)] border-t border-black/5 dark:border-white/5 p-3 relative z-10 text-left mt-auto">
                                    <div className="w-8 h-0.5 bg-neutral-350 dark:bg-neutral-700 rounded-full mx-auto mb-2" />

                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-neutral-900 dark:text-white">3 min</span>
                                                <span className="text-[10px] text-neutral-400 font-bold">(240 m)</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-emerald-600 mt-0.5">Fastest route via indoor paths</p>
                                        </div>
                                        <span className="text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">
                                            Main • GF
                                        </span>
                                    </div>

                                    <button className="w-full bg-[#ff602e] hover:bg-[#ff7b52] text-white font-extrabold text-[11px] py-2.5 rounded-xl transition-all duration-200 shadow flex items-center justify-center gap-1">
                                        <Navigation size={12} className="fill-white rotate-45" />
                                        <span>Start Navigation</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Destination Card Pop-out (inside phone wrapper for correct 3D context, Z-indexed on top of bezel) */}
                        <motion.div
                            style={{
                                x: cardX,
                                y: cardY,
                                opacity: cardOpacity,
                                scale: cardScale,
                            }}
                            className="absolute top-[28%] left-4 right-4 z-30 bg-[#faf7f2]/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-[#ff602e]/20 dark:border-white/10 rounded-2xl p-4 shadow-xl text-left select-none animate-none"
                        >
                            <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-[#ff602e] bg-orange-500/10 px-2 py-0.5 rounded">
                                    Academic
                                </span>
                                <span className="text-[8px] text-neutral-450 font-bold dark:text-neutral-400">Main • Floor 0</span>
                            </div>
                            <h4 className="text-xs font-black text-neutral-900 dark:text-white mt-2">Conclave Centre</h4>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">Room J001 • Seminar Hall</p>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                                    <School size={12} className="text-[#ff602e]" />
                                    <span className="text-[9px] font-bold">Academic Presentations</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                                    <Compass size={12} className="text-blue-500" />
                                    <span className="text-[9px] font-bold">Accessible Entrance</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                                <Link to="/map">
                                    <button className="w-full bg-[#ff602e] hover:bg-[#ff7b52] text-white font-extrabold text-[10px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <Navigation size={10} className="fill-white" />
                                        <span>Start Navigation</span>
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* RIGHT COLUMN OF CARDS - fans out to the right */}
                    <motion.div
                        style={{
                            opacity: cardsOpacity,
                            scale: cardsScale,
                            x: rightCardsX,
                            y: "-50%",
                        }}
                        className="hidden lg:flex flex-col gap-8 absolute left-full ml-16 top-1/2 z-10 w-[260px] select-none"
                    >
                        {/* Card 4 - Right Top */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 -translate-y-4 -translate-x-4 rotate-[5deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                                <Coffee size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Student Activity Center</h4>
                                <p className="text-[10px] text-neutral-400 truncate">Main Building • Floor 1</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">210m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>

                        {/* Card 5 - Right Middle */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 translate-x-0 -rotate-[3deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <Heart size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Programming Lab</h4>
                                <p className="text-[10px] text-neutral-400 truncate">Main Building • Floor 1</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">450m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>

                        {/* Card 6 - Right Bottom */}
                        <div className="bg-[#faf7f2]/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-4 translate-y-4 -translate-x-3 rotate-[2deg] transform hover:rotate-0 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Compass size={20} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">Main Gate</h4>
                                <p className="text-[10px] text-neutral-400 truncate">Campus Entrance • Gate</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">0m</span>
                                <p className="text-[9px] text-neutral-400">Distance</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Absolutely positioned sub-text description & actions at the bottom */}
                <motion.div
                    style={{
                        opacity: footerOpacity,
                        y: footerY,
                        x: "-50%",
                    }}
                    className="absolute bottom-1.5 sm:bottom-4 left-1/2 w-full max-w-xs sm:max-w-md flex flex-col items-center select-none z-30 pb-1"
                >
                    <p className="text-[11px] sm:text-sm text-neutral-500 dark:text-neutral-400 text-center leading-relaxed mb-1.5 sm:mb-2 px-4">
                        From classrooms to labs — navigate every corner of <strong>Madhav Institute of Technology and Science (MITS) Gwalior</strong> with our official campus map.
                    </p>

                    {/* Action Button */}
                    <Link to="/map" className="mb-2 sm:mb-4 shrink-0">
                        <button className="bg-[#ff602e] hover:bg-[#ff7b52] text-white font-extrabold text-[11px] sm:text-xs px-8 py-2.5 sm:py-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-[#ff602e]/25">
                            Start Navigating
                        </button>
                    </Link>

                    {/* Browser Availability Badges */}
                    <div className="flex flex-col items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                            <img src={chrome} alt="Chrome" className="w-5 h-5 sm:w-6 sm:h-6 grayscale hover:grayscale-0 transition-all duration-200" />
                            <img src={firefox} alt="Firefox" className="w-4 h-4 sm:w-5 sm:h-5 grayscale hover:grayscale-0 transition-all duration-200" />
                            <img src={apple} alt="Safari" className="w-4 h-4 sm:w-5 sm:h-5 grayscale hover:grayscale-0 transition-all duration-200" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Also available in browsers</span>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
