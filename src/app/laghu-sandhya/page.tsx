'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowLeft, Heart, Sun, Feather, PlayCircle, Star } from 'lucide-react';
import Link from 'next/link';
import SandhyaVoiceModal from '@/components/LaghuSandhya/SandhyaVoiceModal';

const LAGHU_SANDHYA_MANTRAS = [
    {
        id: 1,
        title: '१. आचमन मन्त्र',
        sanskrit: 'ओं शन्नो देवीरभिष्टयऽआपो भवन्तु पीतये। शंयोरभि स्रवन्तु नः।।',
        desc: 'जल से तीन बार आचमन कर पवित्रता ग्रहण करें।'
    },
    {
        id: 2,
        title: '२. इन्द्रियस्पर्श मन्त्र',
        sanskrit: 'ओं वाक् वाक्। ओं प्राणः प्राणः। ओं चक्षुः चक्षुः। ओं श्रोत्रं श्रोत्रम्। ओं नाभिः। ओं हृदयम्। ओं कण्ठः। ओं शिरः। ओं बाहुभ्यां यशोबलम्। ओं करतलकरपृष्ठे।।',
        desc: 'अंगुलियों से जल स्पर्श कर मुख, नाक, आँख, कान आदि अंगों का स्पर्श करें।'
    },
    {
        id: 3,
        title: '३. मार्जन मन्त्र',
        sanskrit: 'ओं भूः पुनातु शिरसि। ओं भुवः पुनातु नेत्रयोः। ओं स्वः पुनातु कण्ठे। ओं महः पुनातु हृदये। ओं जनः पुनातु नाभ्याम्। ओं तपः पुनातु पादयोः। ओं सत्यं पुनातु पुनशिशरसि। ओं खं ब्रह्म पुनातु सर्वत्र।।',
        desc: 'इन मन्त्रों को बोलते हुए शरीर के भिन्न-भिन्न अंगों पर जल छिड़कें।'
    },
    {
        id: 4,
        title: '४. प्राणायाम मन्त्र',
        sanskrit: 'ओं भूः। ओं भुवः। ओं स्वः। ओं महः। ओं जनः। ओं तपः। ओं सत्यम्।।',
        desc: 'मन को एकाग्र करते हुए प्राणायाम करें।'
    },
    {
        id: 5,
        title: '५. अघमर्षण मन्त्र',
        sanskrit: 'ओ३म् ऋतं च सत्यं चाभीद्धात्तपसोऽध्यजायत। ततो रात्र्यजायत ततः समुद्रो अर्णवः।।१।।\nओं समुद्रादर्णवादधि संवत्सरोऽअजायत। अहोरात्राणि विदधद्विश्वस्य मिषतो वशी।।२।।\nओं सूर्याचन्द्रमसौ धाता यथापूर्वमकल्पयत्। दिवं च पृथिवीं चान्तरिक्षमथो स्वः।।३।।',
        desc: 'परमात्मा की न्यायपूर्ण व्यवस्था का चिंतन कर पापों से दूर रहने का संकल्प करें।'
    },
    {
        id: 6,
        title: '६. मनसापरिक्रमा मन्त्र',
        sanskrit: 'ॐ प्राची दिगग्निरधिपतिरसितो रक्षितादित्या इषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥१॥\nॐ दक्षिणा दिगिन्द्रोऽधिपतिस्तिरश्चिराजी रक्षिता पितर इषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥२॥\nॐ प्रतीची दिग् वरुणोऽधिपतिः पृदाकू रक्षितान्नमिषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥३॥\nॐ उदीची दिक् सोमोऽधिपतिः स्वजो रक्षिताऽशनिरिषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥४॥\nॐ ध्रुवा दिग्विष्णुरधिपतिः कल्माषग्रीवो रक्षिता वीरुध इषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥५॥\nॐ ऊर्ध्वा दिग्बृहस्पतिरधिपतिः श्वित्रो रक्षिता वर्षमिषवः। तेभ्यो नमोऽधिपतिभ्यो नमो रक्षितृभ्यो नम इषुभ्यो नम एभ्यो अस्तु। योऽस्मान्द्वेष्टि यं वयं द्विष्मस्तं वो जम्भे दध्मः॥६॥',
        desc: 'सभी दिशाओं में सर्वव्यापक परमात्मा की उपस्थिति का अनुभव करें।'
    },
    {
        id: 7,
        title: '७. उपस्थान मन्त्र',
        sanskrit: 'ओ३म् उद्वयं तमसस्परि स्वः पश्यन्त उत्तरम्। देवं देवत्रा सूर्यमगन्म ज्योतिरुत्तमम्॥१॥\nओ३म् उदु त्यं जातवेदसं देवं वहन्ति केतवः। दृशे विश्वाय सूर्यम्॥२॥\nओ३म् चित्रं देवानामुदगादनीकं चक्षुर्मित्रस्य वरुणस्याग्नेः। आप्रा द्यावापृथिवी अन्तरिक्षं सूर्य आत्मा जगतस्तस्थुषश्च॥३॥\nओ३म् तच्चक्षुर्देवहितं पुरस्ताच्छुक्रमुच्चरत्। पश्येम शरदः शतं जीवेम शरदः शतं शृणुयाम शरदः शतं प्र ब्रवाम शरदः शतमदीनाः स्याम शरदः शतं भूयश्च शरदः शतात्॥४॥',
        desc: 'परमात्मा प्रकाशस्वरूप है, उसकी ओर हमारी गति हो।'
    },
    {
        id: 8,
        title: '८. गुरुमन्त्र (गायत्री)',
        sanskrit: 'ओ३म् भूर्भुवः स्वः। तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्।।',
        desc: 'परमात्मा हमारे दुखों को हरने वाला और सुखस्वरूप है, वह हमारी बुद्धियों को सन्मार्ग पर प्रेरित करे।'
    },
    {
        id: 9,
        title: '९. समर्पण एवं नमस्कार',
        sanskrit: 'समर्पण: हे ईश्वर दयानिधे! भवत्कृपयाऽनेन जपोपासनादिकर्मणा धर्मार्थकाममोक्षाणां सद्यः सिद्धिर्भवेन्नः।।\n\nनमस्कार: ओं नमः शम्भवाय च मयोभवाय च नमः शङ्कराय च मयस्कराय च नमः शिवाय च शिवतराय च।।',
        desc: 'अपने सभी कर्म परमात्मा को समर्पित करें और उन्हें प्रणाम करें।'
    },
    {
        id: 10,
        title: '१०. शान्ति पाठ (वैदिक)',
        sanskrit: 'ओ३म् द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि।।\nओ३म् शान्तिः शान्तिः शान्तिः।।',
        desc: 'सम्पूर्ण ब्रह्मांड में, प्रकृति में और हमारे मन में शान्ति हो।'
    }
];

export default function LaghuSandhyaPage() {
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0a0a0a, #1a1510)', color: '#fff', padding: '2rem 1rem', fontFamily: 'Poppins, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Link href="/" style={{ color: '#f472b6', background: 'rgba(244, 114, 182, 0.1)', padding: '0.75rem', borderRadius: '50%', marginRight: '1.5rem', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #f472b6, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sun size={32} color="#f472b6" /> लघु वैदिक संध्या
                        </h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#a1a1aa', fontSize: '1.1rem' }}>
                            दैनिक उपासना एवं आत्मशुद्धि के सम्पूर्ण मन्त्र
                        </p>
                    </div>
                </div>

                {/* Voice Guru Trigger */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.05))',
                        border: '1px solid rgba(236, 72, 153, 0.4)',
                        borderRadius: '1.5rem', padding: '2rem', textAlign: 'center', marginBottom: '3rem',
                        boxShadow: '0 10px 30px rgba(236, 72, 153, 0.15)', cursor: 'pointer', position: 'relative',
                        overflow: 'hidden'
                    }}
                    onClick={() => setIsVoiceModalOpen(true)}
                >
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                        <PlayCircle size={150} color="#f472b6" />
                    </div>
                    <Volume2 size={48} color="#f472b6" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#fff' }}>Voice Guru (वॉयस गुरु)</h2>
                    <p style={{ margin: 0, color: '#fbcfe8', fontSize: '1.1rem' }}>इस पर क्लिक करें और "संध्या गुरु" के साथ निरंतर संध्या उपासना प्रारम्भ करें। <br /><span style={{ fontSize: '0.9rem', opacity: 0.8 }}>(Click here to start reciting non-stop with the AI Guru)</span></p>
                    <button style={{ marginTop: '1.5rem', background: '#ec4899', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlayCircle size={20} /> Start Sandhya
                    </button>
                </motion.div>

                {/* Text Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {LAGHU_SANDHYA_MANTRAS.map((item, idx) => (
                        <div key={item.id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderLeft: '4px solid #f472b6',
                            padding: '1.5rem 2rem',
                            borderRadius: '0 1rem 1rem 0'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#fbcfe8', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Feather size={20} color="#ec4899" />
                                {item.title}
                            </h3>
                            <div style={{
                                fontSize: '1.25rem', color: '#fff', lineHeight: 1.8, marginBottom: '1rem',
                                whiteSpace: 'pre-line'
                            }}>
                                {item.sanskrit}
                            </div>
                            <div style={{
                                background: 'rgba(236, 72, 153, 0.05)', padding: '1rem', borderRadius: '0.5rem',
                                color: '#a1a1aa', fontSize: '1rem', fontStyle: 'italic'
                            }}>
                                <strong>अर्थ: </strong> {item.desc}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Heart size={32} color="#ec4899" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: '#a1a1aa' }}>इति लघु वैदिक संध्या विधि सम्पूर्णम्</p>
                </div>

            </div>

            {/* AI Voice Modal */}
            <SandhyaVoiceModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                lang="hi"
            />
        </div>
    );
}