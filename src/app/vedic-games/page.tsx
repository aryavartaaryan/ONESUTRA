"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, BookOpen, Sparkles, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Game components
import SlidingPuzzle from '@/components/Games/SlidingPuzzle';
import ChessGame from '@/components/Games/ChessGame';
import EkadhikenGame from '@/components/Games/EkadhikenGame';
import NikhilamGame from '@/components/Games/NikhilamGame';
import MathMagicGame from '@/components/Games/MathMagicGame';
import PallanguzhiGame from '@/components/Games/PallanguzhiGame';
import AaduPuliGame from '@/components/Games/AaduPuliGame';
import GyanChauparGame from '@/components/Games/GyanChauparGame';
import AshtapadaGame from '@/components/Games/AshtapadaGame';
import AkshauhiniGame from '@/components/Games/AkshauhiniGame';

// ─── Types ──────────────────────────────────────────────────────────────────
type Lang = 'en' | 'hi';
type GameId = 'chess' | 'puzzle' | 'ekadhiken' | 'nikhilam' | 'mathmagic' | 'pallanguzhi' | 'aadupuli' | 'gyanchaupar' | 'ashtapada' | 'akshauhini';

interface BiText { en: string; hi: string; }
interface BiRule { title: BiText; content: BiText; }

interface GameDef {
    id: GameId;
    emoji: string;
    title: BiText;
    subtitle: BiText;
    color: string;
    gradient: string;
    rules: BiRule[];
    badge?: BiText;
}

const tx = (b: BiText, l: Lang) => b[l];

// ─── Game Definitions ────────────────────────────────────────────────────────
const GAMES: GameDef[] = [
    {
        id: 'chess', emoji: '♟️', color: '#fbbf24',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
        title: { en: 'Shatranj', hi: 'शतरंज' },
        subtitle: { en: 'The ancient game of strategy', hi: 'रणनीति का प्राचीन खेल' },
        badge: { en: 'vs Bot', hi: 'बॉट से' },
        rules: [
            { title: { en: 'Objective', hi: 'उद्देश्य' }, content: { en: "Checkmate your opponent's King so it cannot escape capture.", hi: 'शत्रु के राजा को ऐसी स्थिति में फँसाओ जहाँ से वह बच न सके।' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'You play as White. Drag and drop pieces on the board. Pawns go forward, Rooks straight, Bishops diagonal, Knights in L-shape, Queens any direction, King one step.', hi: 'आप सफेद मोहरों से खेलते हैं। मोहरे बोर्ड पर खींचकर छोड़ें। प्यादे आगे, हाथी सीधे, ऊँट तिरछे, घोड़ा L-आकार में, वज़ीर किसी भी दिशा में, राजा एक कदम।' } },
            { title: { en: 'Special Moves', hi: 'विशेष चाल' }, content: { en: 'Pawns auto-promote to Queen when they reach the last row.', hi: 'जब प्यादा अंतिम पंक्ति पर पहुँचे तो वह स्वचालित रूप से वज़ीर बन जाता है।' } },
            { title: { en: 'Bot Opponent', hi: 'बॉट प्रतिद्वंद्वी' }, content: { en: 'The bot plays as Black and makes a random legal move. Try to checkmate it!', hi: 'बॉट काले मोहरों से खेलता है और एक वैध चाल चलता है। उसे शहमात दो!' } },
        ]
    },
    {
        id: 'puzzle', emoji: '🧩', color: '#f472b6',
        gradient: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(236,72,153,0.05))',
        title: { en: 'Sattvik Sliding Puzzle', hi: 'सात्विक स्लाइडिंग पहेली' },
        subtitle: { en: 'Classic 8-tile mind game', hi: 'क्लासिक 8-टाइल दिमागी खेल' },
        rules: [
            { title: { en: 'Objective', hi: 'उद्देश्य' }, content: { en: 'Arrange tiles 1–8 in order with blank in bottom-right.', hi: 'टाइलों को 1 से 8 क्रम में लगाओ, खाली जगह नीचे-दाईं ओर हो।' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Click a tile next to the blank space to slide it.', hi: 'खाली जगह के पास वाली टाइल पर क्लिक करें, वह वहाँ खिसक जाएगी।' } },
            { title: { en: 'Win Condition', hi: 'जीत की शर्त' }, content: { en: 'Order: 1,2,3 / 4,5,6 / 7,8,_ — Puzzle complete!', hi: 'क्रम: 1,2,3 / 4,5,6 / 7,8,_ — पहेली पूरी!' } },
            { title: { en: 'Vedic Connection', hi: 'वैदिक संबंध' }, content: { en: 'This game trains spatial reasoning — a key Vedic wisdom skill.', hi: 'यह खेल स्थानिक तर्कशक्ति को प्रशिक्षित करता है — वैदिक ज्ञान की मुख्य कुशलता।' } },
        ]
    },
    {
        id: 'ekadhiken', emoji: '🔢', color: '#fbbf24',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(234,179,8,0.05))',
        title: { en: 'Ekadhiken Purven', hi: 'एकाधिकेन पूर्वेण' },
        subtitle: { en: 'Squaring numbers ending in 5', hi: '5 पर समाप्त संख्याओं का वर्ग' },
        badge: { en: 'Vedic Math', hi: 'वैदिक गणित' },
        rules: [
            { title: { en: 'The Sutra', hi: 'सूत्र' }, content: { en: '"Ekadhiken Purven" = "by one more than the previous". Lightning-fast squaring of any number ending in 5.', hi: '"एकाधिकेन पूर्वेण" = "पूर्व से एक अधिक द्वारा"। 5 पर समाप्त किसी भी संख्या का तुरंत वर्ग निकालें।' } },
            { title: { en: 'The Method', hi: 'विधि' }, content: { en: 'For n5: take n, multiply n×(n+1), append 25. Done!', hi: 'n5 के लिए: n लो, n×(n+1) करो, अंत में 25 जोड़ो। उत्तर तैयार!' } },
            { title: { en: 'Example', hi: 'उदाहरण' }, content: { en: '35² → n=3, 3×4=12 → Answer = 1225 ✨', hi: '35² → n=3, 3×4=12 → उत्तर = 1225 ✨' } },
            { title: { en: 'Another Example', hi: 'एक और उदाहरण' }, content: { en: '75² → n=7, 7×8=56 → Answer = 5625 ✨', hi: '75² → n=7, 7×8=56 → उत्तर = 5625 ✨' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'A number ending in 5 is shown. Apply the method and enter the answer. Use hints if needed!', hi: '5 पर समाप्त संख्या दिखाई जाएगी। विधि से उत्तर निकालें। संकेत का उपयोग कर सकते हैं!' } },
        ]
    },
    {
        id: 'nikhilam', emoji: '⚡', color: '#a78bfa',
        gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.05))',
        title: { en: 'Nikhilam Sutra', hi: 'निखिलम सूत्र' },
        subtitle: { en: 'Multiply near a base instantly', hi: 'आधार के पास जल्दी गुणा करें' },
        badge: { en: 'Vedic Math', hi: 'वैदिक गणित' },
        rules: [
            { title: { en: 'The Sutra', hi: 'सूत्र' }, content: { en: '"All from 9 and last from 10" — multiply numbers near base 10, 100, 1000 super fast!', hi: '"नौ में से सभी और दस में से अंतिम" — 10, 100, 1000 के पास की संख्याओं का तुरंत गुणा!' } },
            { title: { en: 'The Method', hi: 'विधि' }, content: { en: 'Find deviation from base. Cross-add. Multiply deviations. Combine: (cross × base) + (product of deviations).', hi: 'आधार से अंतर निकालें। क्रॉस जोड़ें। अंतरों को गुणा करें। मिलाएं: (क्रॉस × आधार) + (अंतरों का गुणनफल)।' } },
            { title: { en: 'Example (Base 100)', hi: 'उदाहरण (आधार 100)' }, content: { en: '98×97 → dev: -2,-3. Cross: 98-3=95. Product: 6. Answer = 9506 ✨', hi: '98×97 → अंतर: -2,-3. क्रॉस: 98-3=95. गुणनफल: 6. उत्तर = 9506 ✨' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Choose base (10/100/1000), enter product of two shown numbers. Use Steps hint!', hi: 'आधार चुनें (10/100/1000), दो संख्याओं का गुणनफल दर्ज करें। चरण संकेत का उपयोग करें!' } },
        ]
    },
    {
        id: 'mathmagic', emoji: '🪄', color: '#ec4899',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(219,39,119,0.05))',
        title: { en: 'Ganit ke Jadugar', hi: 'गणित के जादूगर' },
        subtitle: { en: 'Vedic number mind-reading tricks', hi: 'वैदिक मन-पढ़ने की जादुई तरकीबें' },
        badge: { en: 'Magic', hi: 'जादू' },
        rules: [
            { title: { en: 'What is this?', hi: 'यह क्या है?' }, content: { en: 'Ancient Vedic Math "magic tricks" that feel like mind-reading — guess age, birth date, or secret number!', hi: 'प्राचीन वैदिक गणित की जादुई तरकीबें — उम्र, जन्मतिथि, या मन की संख्या का अनुमान लगाएं!' } },
            { title: { en: 'Available Tricks', hi: 'उपलब्ध जादू' }, content: { en: '🎂 Age Guesser\n🔮 Number Oracle (always 2!)\n✨ Birthday Magic', hi: '🎂 उम्र का अनुमान\n🔮 संख्या दैवज्ञ (हमेशा 2!)\n✨ जन्मदिन जादू' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Choose a trick, follow steps with a friend, enter final number, see the magic!', hi: 'एक जादू चुनें, दोस्त के साथ चरण अपनाएं, अंतिम संख्या दर्ज करें, जादू देखें!' } },
            { title: { en: 'Educational Value', hi: 'शैक्षिक महत्व' }, content: { en: 'Teaches algebraic thinking and pattern recognition — core Vedic skills.', hi: 'बीजगणितीय सोच और पैटर्न पहचान सिखाता है — मुख्य वैदिक कौशल।' } },
        ]
    },
    {
        id: 'pallanguzhi', emoji: '🪶', color: '#34d399',
        gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.05))',
        title: { en: 'Pallanguzhi', hi: 'पल्लांगुड़ी' },
        subtitle: { en: 'Ancient Mancala counting strategy', hi: 'प्राचीन मनकाला गिनती रणनीति' },
        badge: { en: 'Strategy', hi: 'रणनीति' },
        rules: [
            { title: { en: 'Origin', hi: 'उत्पत्ति' }, content: { en: "South India's oldest board game from the Sangam period (300 BCE). 'Pallu' = many, 'Kazhi' = holes.", hi: 'संगम काल (300 ईसा पूर्व) का दक्षिण भारत का सबसे पुराना बोर्ड खेल। "पल्लु" = बहुत, "कड़ी" = गड्ढे।' } },
            { title: { en: 'The Board', hi: 'बोर्ड' }, content: { en: '14 pits in 2 rows of 7. Each starts with 6 seeds. Your row is at the bottom.', hi: '14 गड्ढे, 2 पंक्तियाँ 7-7 की। हर एक में 6 बीज। आपकी पंक्ति नीचे है।' } },
            { title: { en: 'How to Sow', hi: 'बोने का तरीका' }, content: { en: 'Click a pit — all seeds are picked and sown counter-clockwise, one per pit.', hi: 'एक गड्ढे पर क्लिक करें — सभी बीज उठते हैं और घड़ी की विपरीत दिशा में एक-एक बोए जाते हैं।' } },
            { title: { en: 'Capture Rule', hi: 'जीत का नियम' }, content: { en: 'Last seed lands in your empty pit AND opposite pit has seeds → you capture all!', hi: 'आखिरी बीज आपके खाली गड्ढे में पड़े और सामने वाले गड्ढे में बीज हों → आप सभी जीत लेते हैं!' } },
            { title: { en: 'Winning', hi: 'जीत' }, content: { en: 'When one side is empty, sweep remaining. Most seeds in store wins!', hi: 'जब एक तरफ खाली हो जाए, बचे बीज जोड़ें। सबसे ज्यादा बीजों वाला जीता!' } },
        ]
    },
    {
        id: 'aadupuli', emoji: '🐯', color: '#f97316',
        gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.05))',
        title: { en: 'Aadu Puli Aattam', hi: 'आडु पुली आट्टम' },
        subtitle: { en: 'Goats vs Tigers strategy showdown', hi: 'बकरियाँ बनाम बाघ की रणनीति' },
        badge: { en: 'Asymmetric', hi: 'असममित' },
        rules: [
            { title: { en: 'Origin', hi: 'उत्पत्ति' }, content: { en: 'Ancient South Indian "Pulijudam" (Tiger Game) — both players have completely different goals!', hi: 'प्राचीन दक्षिण भारतीय "पुलिजुदम" (बाघ खेल) — दोनों खिलाड़ियों के लक्ष्य बिल्कुल अलग!' } },
            { title: { en: 'Setup', hi: 'सेटअप' }, content: { en: 'You = Goats 🐐 (15 total). Bot = Tigers 🐯 (3 at corners).', hi: 'आप = बकरियाँ 🐐 (कुल 15)। बॉट = बाघ 🐯 (3 कोनों पर)।' } },
            { title: { en: 'Tiger Goals', hi: 'बाघ का लक्ष्य' }, content: { en: 'Tigers capture goats by jumping over them. Capture 5 to win!', hi: 'बाघ बकरियों के ऊपर से कूदकर उन्हें पकड़ते हैं। 5 पकड़ने पर जीत!' } },
            { title: { en: 'Goat Goals', hi: 'बकरी का लक्ष्य' }, content: { en: 'Surround all tigers so they cannot move — Goats win!', hi: 'सभी बाघों को घेर लो ताकि वे हिल न सकें — बकरियाँ जीतेंगी!' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Phase 1: click empty cells to place goats (15). Phase 2: click goat then destination to move.', hi: 'चरण 1: खाली खाने पर क्लिक करके बकरियाँ रखें (15)। चरण 2: बकरी क्लिक करें, फिर गंतव्य।' } },
        ]
    },
    {
        id: 'gyanchaupar', emoji: '🎲', color: '#60a5fa',
        gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.05))',
        title: { en: 'Gyan Chaupar', hi: 'ज्ञान चौपड़' },
        subtitle: { en: 'Original Snakes & Ladders with dharma', hi: 'धर्म के साथ मूल साँप-सीढ़ी' },
        badge: { en: 'Dharma', hi: 'धर्म' },
        rules: [
            { title: { en: 'History', hi: 'इतिहास' }, content: { en: 'Invented by Saint Gyandev (13th century). The original "Snakes & Ladders" with deep spiritual meaning!', hi: 'संत ज्ञानदेव द्वारा (13वीं सदी) बनाया गया। मूल "साँप-सीढ़ी" खेल जिसमें गहरा आध्यात्मिक अर्थ था!' } },
            { title: { en: 'The Board', hi: 'बोर्ड' }, content: { en: '100 squares. Reach 100 = Moksha! Each snake and ladder has a moral lesson.', hi: '100 खाने। 100 तक पहुँचना = मोक्ष! हर साँप और सीढ़ी का नैतिक अर्थ है।' } },
            { title: { en: 'Ladders (Virtues)', hi: 'सीढ़ियाँ (गुण)' }, content: { en: 'Land on 🪜 = go up! Satya, Daan, Ahimsa, Bhakti, Gyaan...', hi: '🪜 पर पड़ें = ऊपर जाएं! सत्य, दान, अहिंसा, भक्ति, ज्ञान...' } },
            { title: { en: 'Snakes (Vices)', hi: 'साँप (अवगुण)' }, content: { en: 'Land on 🐍 = slide down! Krodha, Lobha, Maya, Kama, Ahankara...', hi: '🐍 पर पड़ें = नीचे जाएं! क्रोध, लोभ, माया, काम, अहंकार...' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Click Roll Dice — you and bot alternate. First to reach 100 wins Moksha!', hi: '"पासा फेंको" क्लिक करें — आप और बॉट बारी-बारी। 100 तक पहुँचने वाला पहले मोक्ष पाता है!' } },
        ]
    },
    {
        id: 'ashtapada', emoji: '♾️', color: '#e879f9',
        gradient: 'linear-gradient(135deg, rgba(232,121,249,0.15), rgba(217,70,239,0.05))',
        title: { en: 'Ashtapada', hi: 'अष्टपद' },
        subtitle: { en: '8x8 ancient Indian path race game', hi: '8x8 प्राचीन भारतीय पथ दौड़ खेल' },
        badge: { en: 'Ancient', hi: 'प्राचीन' },
        rules: [
            { title: { en: 'History', hi: 'इतिहास' }, content: { en: 'Ashtapada predates Chess by centuries — the ancestor of Chaturanga and modern chess!', hi: 'अष्टपद शतरंज से सदियों पुराना है — चतुरंग और आधुनिक शतरंज का पूर्वज!' } },
            { title: { en: 'Objective', hi: 'उद्देश्य' }, content: { en: 'Move both your tokens to the center ★ squares before the bot!', hi: 'बॉट से पहले दोनों मोहरों को केंद्र के ★ खानों पर ले जाएं!' } },
            { title: { en: 'Movement', hi: 'चाल' }, content: { en: 'Roll dice, then click a token to move it that many steps toward center.', hi: 'पासा फेंकें, फिर एक मोहरे पर क्लिक करें और उसे उतने कदम केंद्र की ओर बढ़ाएं।' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Click Roll Dice → click your 🟡 token to move. Bot 🩷 plays automatically after your turn.', hi: '"पासा फेंको" क्लिक → अपना 🟡 मोहरा क्लिक करें। बॉट 🩷 आपकी बारी के बाद खुद चलता है।' } },
        ]
    },
    {
        id: 'akshauhini', emoji: '⚔️', color: '#a78bfa',
        gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.05))',
        title: { en: 'Akshauhini Vyuh', hi: 'अक्षौहिणी व्यूह' },
        subtitle: { en: 'Identify ancient battle formations', hi: 'प्राचीन युद्ध व्यूहों को पहचानें' },
        badge: { en: 'Quiz', hi: 'प्रश्नोत्तरी' },
        rules: [
            { title: { en: 'What is Akshauhini?', hi: 'अक्षौहिणी क्या है?' }, content: { en: 'In Mahabharata armies formed "Vyuh" — special battle formations requiring deep strategic thinking.', hi: 'महाभारत में सेनाएं "व्यूह" बनाती थीं — विशेष युद्ध संरचनाएं जिनके लिए गहरी रणनीतिक सोच चाहिए थी।' } },
            { title: { en: 'Famous Formations', hi: 'प्रसिद्ध व्यूह' }, content: { en: '♟ Chakravyuh (Wheel)\n🌸 Padmavyuh (Lotus)\n🦅 Garudavyuh (Eagle)\n📍 Suchivyuh (Needle)', hi: '♟ चक्रव्यूह\n🌸 पद्मव्यूह\n🦅 गरुड़व्यूह\n📍 सूचीव्यूह' } },
            { title: { en: 'How to Play', hi: 'कैसे खेलें' }, content: { en: 'Study the visual grid and clue, then identify the formation from 4 options.', hi: 'दृश्य ग्रिड और सुराग को ध्यान से देखें, फिर 4 विकल्पों में से सही व्यूह पहचानें।' } },
            { title: { en: 'Educational Value', hi: 'शैक्षिक महत्व' }, content: { en: 'Teaches spatial awareness and ancient Indian strategic thinking.', hi: 'स्थानिक जागरूकता और प्राचीन भारतीय रणनीतिक सोच सिखाता है।' } },
        ]
    },
];

// ─── UI Labels ───────────────────────────────────────────────────────────────
const UI = {
    pageTitle: { en: 'Vedic Games', hi: 'वैदिक खेल' },
    pageSubtitle: { en: 'Ancient wisdom · Modern play', hi: 'प्राचीन ज्ञान · आधुनिक खेल' },
    strategySection: { en: 'Strategy Games', hi: 'रणनीति के खेल' },
    vedicMathSection: { en: 'Vedic Mathematics', hi: 'वैदिक गणित' },
    ancientSection: { en: 'Ancient Indian Board Games', hi: 'प्राचीन भारतीय बोर्ड खेल' },
    comingSoon: { en: 'More Games Coming Soon!', hi: 'और खेल जल्द आ रहे हैं!' },
    comingSoonSub: { en: 'Chaturanga · Dashavatara · Moksha Patam', hi: 'चतुरंग · दशावतार · मोक्ष पटम' },
    rulesBtn: { en: 'Rules', hi: 'नियम' },
    playBtn: { en: 'Play Now →', hi: 'अभी खेलें →' },
    startPlaying: { en: 'Start Playing!', hi: 'खेलना शुरू करें!' },
    toggleHi: { en: 'हिन्दी', hi: 'English' },
};

// ─── Rules Modal ─────────────────────────────────────────────────────────────
function RulesModal({ game, lang, onStart, onClose }: { game: GameDef; lang: Lang; onStart: () => void; onClose: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#0f0f1f', border: `1px solid ${game.color}40`, borderRadius: '28px', padding: '2rem', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: `0 0 80px ${game.color}20` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${game.color}20`, border: `1px solid ${game.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                            {game.emoji}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: game.color, fontSize: '1.3rem', fontFamily: '"Playfair Display", serif' }}>{tx(game.title, lang)}</h2>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{tx(game.subtitle, lang)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {game.rules.map((rule, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: `1px solid ${game.color}20` }}>
                            <div style={{ fontWeight: 700, color: game.color, marginBottom: '0.4rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <BookOpen size={14} /> {tx(rule.title, lang)}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{tx(rule.content, lang)}</div>
                        </motion.div>
                    ))}
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onStart}
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: `linear-gradient(135deg, ${game.color}, ${game.color}cc)`, color: '#000', border: 'none', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <Sparkles size={18} /> {tx(UI.startPlaying, lang)}
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// ─── Game Card ────────────────────────────────────────────────────────────────
function GameCard({ game, lang, onShowRules, onPlay }: { game: GameDef; lang: Lang; onShowRules: () => void; onPlay: () => void }) {
    return (
        <motion.div whileHover={{ scale: 1.02, translateY: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ borderRadius: '20px', background: game.gradient, border: `1px solid ${game.color}30`, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>{game.emoji}</div>
                    {game.badge && (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', background: `${game.color}20`, border: `1px solid ${game.color}50`, color: game.color, fontSize: '0.7rem', fontWeight: 700 }}>
                            {tx(game.badge, lang)}
                        </span>
                    )}
                </div>
                <h3 style={{ margin: '0 0 0.3rem', color: game.color, fontFamily: '"Playfair Display", serif', fontSize: '1.1rem' }}>{tx(game.title, lang)}</h3>
                <p style={{ margin: '0 0 1.2rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>{tx(game.subtitle, lang)}</p>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={onShowRules}
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <BookOpen size={13} /> {tx(UI.rulesBtn, lang)}
                    </button>
                    <button onClick={onPlay}
                        style={{ flex: 2, padding: '0.6rem', borderRadius: '10px', background: game.color, color: '#000', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                        {tx(UI.playBtn, lang)}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Game Renderer ────────────────────────────────────────────────────────────
function ActiveGame({ gameId }: { gameId: GameId }) {
    switch (gameId) {
        case 'chess': return <ChessGame />;
        case 'puzzle': return <SlidingPuzzle />;
        case 'ekadhiken': return <EkadhikenGame />;
        case 'nikhilam': return <NikhilamGame />;
        case 'mathmagic': return <MathMagicGame />;
        case 'pallanguzhi': return <PallanguzhiGame />;
        case 'aadupuli': return <AaduPuliGame />;
        case 'gyanchaupar': return <GyanChauparGame />;
        case 'ashtapada': return <AshtapadaGame />;
        case 'akshauhini': return <AkshauhiniGame />;
    }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VedicGamesPage() {
    const router = useRouter();
    const [lang, setLang] = useState<Lang>('en');
    const [activeGame, setActiveGame] = useState<GameId | null>(null);
    const [rulesGame, setRulesGame] = useState<GameDef | null>(null);

    const activeGameDef = GAMES.find(g => g.id === activeGame);
    const openRules = (game: GameDef) => setRulesGame(game);
    const startGame = (gameId: GameId) => { setRulesGame(null); setActiveGame(gameId); };

    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d1a2e 100%)', fontFamily: '"Inter", sans-serif', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient Orbs */}
            <div style={{ position: 'fixed', top: '10%', left: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '5%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: '40%', right: '5%', width: '25%', height: '25%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
                {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={() => activeGame ? setActiveGame(null) : router.push('/')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
                        <ChevronLeft size={22} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, background: 'linear-gradient(90deg, #fbbf24, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {activeGame ? tx(activeGameDef!.title, lang) : tx(UI.pageTitle, lang)}
                        </h1>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
                            {activeGame ? tx(activeGameDef!.subtitle, lang) : tx(UI.pageSubtitle, lang)}
                        </p>
                    </div>

                    {/* Language Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.9rem', borderRadius: '20px', cursor: 'pointer',
                            background: lang === 'hi' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                            border: lang === 'hi' ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.15)',
                            color: lang === 'hi' ? '#fbbf24' : 'rgba(255,255,255,0.75)',
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                            transition: 'all 0.3s ease',
                        }}>
                        <Languages size={16} />
                        {tx(UI.toggleHi, lang)}
                    </motion.button>
                </header>

                <AnimatePresence mode="wait">
                    {/* ── Catalog ── */}
                    {!activeGame && (
                        <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tx(UI.strategySection, lang)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                {GAMES.filter(g => ['chess', 'puzzle'].includes(g.id)).map((game, i) => (
                                    <motion.div key={game.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                        <GameCard game={game} lang={lang} onShowRules={() => openRules(game)} onPlay={() => startGame(game.id)} />
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tx(UI.vedicMathSection, lang)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                {GAMES.filter(g => ['ekadhiken', 'nikhilam', 'mathmagic'].includes(g.id)).map((game, i) => (
                                    <motion.div key={game.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 2) * 0.08 }}>
                                        <GameCard game={game} lang={lang} onShowRules={() => openRules(game)} onPlay={() => startGame(game.id)} />
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tx(UI.ancientSection, lang)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                                {GAMES.filter(g => ['pallanguzhi', 'aadupuli', 'gyanchaupar', 'ashtapada', 'akshauhini'].includes(g.id)).map((game, i) => (
                                    <motion.div key={game.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 5) * 0.08 }}>
                                        <GameCard game={game} lang={lang} onShowRules={() => openRules(game)} onPlay={() => startGame(game.id)} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Coming Soon */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} color="#a78bfa" />
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{tx(UI.comingSoon, lang)}</span>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{tx(UI.comingSoonSub, lang)}</span>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── Active Game ── */}
                    {activeGame && (
                        <motion.div key={`game-${activeGame}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                            <ActiveGame gameId={activeGame} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Rules Modal */}
            <AnimatePresence>
                {rulesGame && (
                    <RulesModal
                        game={rulesGame}
                        lang={lang}
                        onClose={() => setRulesGame(null)}
                        onStart={() => startGame(rulesGame.id)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
