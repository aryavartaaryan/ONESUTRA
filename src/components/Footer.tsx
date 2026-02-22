import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* Brand */}
                <h2 className={styles.brand}>
                    A Fusion of Artificial Intelligence and Great Knowledge of Rishis
                </h2>

                {/* Mantra */}
                <p className={styles.mantra}>
                    &ldquo;Sarve Bhavantu Sukhinah&rdquo;
                </p>
                <p className={styles.mantraSanskrit}>
                    &ldquo;ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै॥ ॐ शान्तिः शान्तिः शान्तिः॥&rdquo;
                </p>

                {/* Translation */}
                <p className={styles.translation}>
                    May all beings be happy, may all beings be free from disease.
                </p>

                {/* Copyright */}
                <div className={styles.copyright}>
                    A Product Crafted by the Research & Development of <span className={styles.highlight}>Pranav.AI</span>
                </div>
            </div>
        </footer>
    );
}
