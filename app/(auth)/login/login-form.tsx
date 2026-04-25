"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loginWithEmail,
  loginWithPhone,
  verifyPhoneOtp,
  loginWithGoogle,
  type AuthState,
} from "@/app/actions/auth";
import styles from "../auth.module.css";

/* ===== SVG ICON COMPONENTS ===== */
const IconRecycle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 4.875 7.97l5.088.023" />
    <path d="m9.5 5.5 4-7" />
    <path d="M13.5 5.5 12 2" />
    <path d="m16 13 5.5-9.5" />
    <path d="M5.607 6.196 2.857 1.5h7.5" />
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const IconGoogle = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const BrandLogo = () => (
  <Image
    src="/logoSirkulasiInPolos.png"
    alt="SirkulasiIn"
    width={28}
    height={28}
    priority
  />
);

type LoginMode = "phone" | "email";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<LoginMode>("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [emailState, emailAction, emailPending] = useActionState<AuthState, FormData>(loginWithEmail, null);
  const [phoneState, phoneAction, phonePending] = useActionState<AuthState, FormData>(
    async (prevState: AuthState, formData: FormData) => {
      const result = await loginWithPhone(prevState, formData);
      if (result?.success) {
        setOtpSent(true);
        setPhoneNumber(formData.get("phone") as string);
      }
      return result;
    },
    null
  );
  const [otpState, otpAction, otpPending] = useActionState<AuthState, FormData>(verifyPhoneOtp, null);

  const handleGoogleLogin = async () => {
    await loginWithGoogle(next);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* ===== LEFT HERO ===== */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBrand}>
            <div className={styles.brandIcon}><BrandLogo /></div>
            <span className={styles.brandName}>Sirkulasi<span className={styles.brandNameHighlight}>In</span></span>
          </div>

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              AI companion<br />
              untuk gaya hidup{" "}
              <span className={styles.heroTitleAccent}>sirkular.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Bergabung dengan komunitas global yang mengubah limbah menjadi kebijaksanaan dan kebiasaan menjadi dampak.
            </p>
          </div>

          <div className={styles.heroImageWrapper}>
            <Image src="/login-hero.png" alt="Tangan memegang tanaman hijau" fill className={styles.heroImage} priority sizes="(max-width: 900px) 100vw, 480px" />
          </div>
        </div>

        {/* ===== RIGHT FORM ===== */}
        <div className={styles.formPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Selamat Datang</h2>
              <p className={styles.formSubtitle}>Masuk untuk melanjutkan perjalanan hijau Anda.</p>
            </div>

            {urlError === "account_deactivated" && (
              <div className={styles.errorMessage} style={{ marginBottom: "8px" }}>
                <span className={styles.alertIcon}><IconAlertTriangle /></span>
                Akun Anda telah dinonaktifkan oleh administrator. Hubungi admin untuk informasi lebih lanjut.
              </div>
            )}

            {/* Google */}
            <button type="button" className={styles.oauthButton} onClick={handleGoogleLogin} id="google-login-button">
              <span className={styles.oauthIcon}><IconGoogle /></span>
              Lanjutkan dengan Google
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>ATAU</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Mode Tabs */}
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${mode === "phone" ? styles.modeTabActive : ""}`}
                onClick={() => { setMode("phone"); setOtpSent(false); }}
              >
                <span className={styles.modeTabIcon}><IconPhone /></span>
                Telepon
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${mode === "email" ? styles.modeTabActive : ""}`}
                onClick={() => setMode("email")}
              >
                <span className={styles.modeTabIcon}><IconMail /></span>
                Email
              </button>
            </div>

            {/* PHONE LOGIN */}
            {mode === "phone" && !otpSent && (
              <form action={phoneAction}>
                <input type="hidden" name="next" value={next} />
                {phoneState?.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.alertIcon}><IconAlertTriangle /></span>
                    {phoneState.error}
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="phone">Nomor Telepon</label>
                  <div className={styles.fieldInputWrapper}>
                    <span className={styles.fieldIcon}><IconPhone /></span>
                    <input id="phone" name="phone" type="tel" placeholder="+62 812 3456 7890" className={`${styles.fieldInput} ${styles.fieldInputWithIcon}`} required />
                  </div>
                  <span className={styles.fieldHint}>Kami akan mengirim kode OTP 6 digit untuk verifikasi identitas Anda.</span>
                </div>
                <button type="submit" disabled={phonePending} className={styles.submitButton} id="phone-login-button">
                  {phonePending ? <div className={styles.spinner} /> : <>Lanjutkan <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
              </form>
            )}

            {/* OTP VERIFY */}
            {mode === "phone" && otpSent && (
              <form action={otpAction}>
                <input type="hidden" name="next" value={next} />
                {phoneState?.success && (
                  <div className={styles.successMessage}>
                    <span className={styles.alertIcon}><IconCheckCircle /></span>
                    {phoneState.success}
                  </div>
                )}
                {otpState?.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.alertIcon}><IconAlertTriangle /></span>
                    {otpState.error}
                  </div>
                )}
                <input type="hidden" name="phone" value={phoneNumber} />
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="otp">Kode OTP</label>
                  <input id="otp" name="otp" type="text" placeholder="000000" className={styles.fieldInput} maxLength={6} pattern="[0-9]{6}" required autoFocus style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: 700 }} />
                </div>
                <button type="submit" disabled={otpPending} className={styles.submitButton} id="verify-otp-button">
                  {otpPending ? <div className={styles.spinner} /> : <>Verifikasi <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className={styles.backButton}>
                  <span className={styles.backIcon}><IconArrowLeft /></span> Kembali
                </button>
              </form>
            )}

            {/* EMAIL LOGIN */}
            {mode === "email" && (
              <form action={emailAction}>
                <input type="hidden" name="next" value={next} />
                {emailState?.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.alertIcon}><IconAlertTriangle /></span>
                    {emailState.error}
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="email">Alamat Email</label>
                  <input id="email" name="email" type="email" placeholder="nama@email.com" className={styles.fieldInput} required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" placeholder="••••••••" className={styles.fieldInput} required />
                </div>
                <button type="submit" disabled={emailPending} className={styles.submitButton} id="email-login-button">
                  {emailPending ? <div className={styles.spinner} /> : <>Masuk <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
              </form>
            )}

            <p className={styles.switchText}>
              Baru di ekosistem? <Link href="/signup" className={styles.switchLink}>Buat akun</Link>
            </p>
            <div className={styles.footerLinks}>
              <a href="#" className={styles.footerLink}>Privacy Policy</a>
              <a href="#" className={styles.footerLink}>Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge */}
      <div className={styles.floatingBadge}>
        <div className={styles.floatingBadgeIcon}><IconRecycle /></div>
        <div className={styles.floatingBadgeContent}>
          <span className={styles.floatingBadgeTitle}>2.4M Ton</span>
          <span className={styles.floatingBadgeSubtitle}>Limbah didaur ulang bulan ini</span>
        </div>
      </div>
    </div>
  );
}
