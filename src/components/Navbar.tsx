import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, User, Sparkles, Leaf, Home, MessageCircle, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navHeader}>
                <Link href="/" className={styles.logoLink} onClick={closeMenu}>
                    <Flame size={28} className={styles.logoIcon} />
                    <span>Pranav Samadhaan</span>
                </Link>

                <button
                    className={styles.hamburgerBtn}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Desktop Links */}
            <div className={`${styles.navLinks} ${styles.desktopOnly}`}>
                <Link href="/" className={styles.navLink}>
                    <Home size={18} /> प्रारम्भ
                </Link>
                <Link href="/vedic-rasoi" className={styles.navLink}>
                    <Sparkles size={18} color="var(--accent-saffron)" />
                    <span>
                        आयुर्वेदिक भोजन
                        <span style={{ display: 'block', fontSize: '0.75em', marginTop: '-2px', opacity: 0.8 }}>
                            (अन्नपूर्णा)
                        </span>
                    </span>
                </Link>
                <Link href="/acharya-samvad" className={styles.navLink}>
                    <MessageCircle size={18} /> आचार्य संवाद
                </Link>
                <Link href="/dhyan-kshetra" className={`${styles.navLink} ${styles.dhyanLink}`}>
                    <Leaf size={18} color="var(--accent-amber)" /> विशेष ध्यान क्षेत्र
                </Link>
            </div>

            <div className={`${styles.actions} ${styles.desktopOnly}`}>
                <button className={styles.profileBtn} aria-label="Profile">
                    <User size={20} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`${styles.mobileMenuOverlay} ${isMenuOpen ? styles.open : ''}`}>
                <div className={styles.mobileLinks}>
                    <Link href="/" className={styles.mobileLink} onClick={closeMenu}>
                        <Home size={24} /> प्रारम्भ
                    </Link>
                    <Link href="/vedic-rasoi" className={styles.mobileLink} onClick={closeMenu}>
                        <Sparkles size={24} color="var(--accent-saffron)" /> भोजन परामर्श
                    </Link>
                    <Link href="/acharya-samvad" className={styles.mobileLink} onClick={closeMenu}>
                        <MessageCircle size={24} /> आचार्य संवाद
                    </Link>
                    <Link href="/dhyan-kshetra" className={`${styles.mobileLink} ${styles.dhyanMobileLink}`} onClick={closeMenu}>
                        <Leaf size={24} color="var(--accent-amber)" /> विशेष ध्यान क्षेत्र
                    </Link>
                </div>
            </div>
        </nav>
    );
}
