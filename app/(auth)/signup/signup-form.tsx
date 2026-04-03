"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  signupWithEmail,
  loginWithGoogle,
  loginWithPhone,
  verifyPhoneOtp,
  type AuthState,
} from "@/app/actions/auth";
import styles from "../auth.module.css";

/* ===== SVG ICON COMPONENTS ===== */
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
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

const IconBrandLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2a10 10 0 0 1 3.44 1.66" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

type SignupMode = "email" | "phone";

export default function SignupForm() {
  const [mode, setMode] = useState<SignupMode>("email");
  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [emailState, emailAction, emailPending] = useActionState<AuthState, FormData>(signupWithEmail, null);
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
    await loginWithGoogle();
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* ===== LEFT HERO ===== */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBrand}>
            <div className={styles.brandIcon}><IconBrandLogo /></div>
            <span className={styles.brandName}>SirkulasiIn</span>
          </div>

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Bergabung di<br />
              <span className={styles.heroTitleAccent}>Ekosistem.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Ubah jejak lingkungan Anda menjadi gaya hidup berkelanjutan yang terkurasi.
            </p>
            <div className={styles.heroBadge}>
              <div className={styles.badgeIcon}><IconUsers /></div>
              <div className={styles.badgeContent}>
                <span className={styles.badgeTitle}>12rb+ Eco-Guardian</span>
                <span className={styles.badgeSubtitle}>Aktif Melindungi Bumi</span>
              </div>
            </div>
          </div>

          <div className={styles.heroImageWrapper}>
            <Image src="/signup-hero.png" alt="Ilustrasi tanaman hijau bertumbuh" fill className={styles.heroImage} priority sizes="(max-width: 900px) 100vw, 480px" />
          </div>
        </div>

        {/* ===== RIGHT FORM ===== */}
        <div className={styles.formPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Buat akun Anda</h2>
              <p className={styles.formSubtitle}>Mulai perjalanan Anda bersama kami hari ini</p>
            </div>

            {/* Google */}
            <button type="button" className={styles.oauthButton} onClick={handleGoogleLogin} id="google-signup-button">
              <span className={styles.oauthIcon}><IconGoogle /></span>
              Daftar dengan Google
            </button>

            {/* Phone toggle */}
            <button type="button" className={styles.oauthButton} onClick={() => setMode(mode === "phone" ? "email" : "phone")} id="phone-signup-toggle">
              <span className={styles.oauthIcon}><IconPhone /></span>
              {mode === "phone" ? "Daftar dengan Email" : "Daftar dengan Telepon"}
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>{mode === "email" ? "ATAU GUNAKAN EMAIL" : "ATAU GUNAKAN TELEPON"}</span>
              <div className={styles.dividerLine} />
            </div>

            {/* EMAIL SIGNUP */}
            {mode === "email" && (
              <form action={emailAction}>
                {emailState?.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.alertIcon}><IconAlertTriangle /></span>
                    {emailState.error}
                  </div>
                )}
                {emailState?.success && (
                  <div className={styles.successMessage}>
                    <span className={styles.alertIcon}><IconCheckCircle /></span>
                    {emailState.success}
                  </div>
                )}

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="firstName">Nama Depan</label>
                    <input id="firstName" name="firstName" type="text" placeholder="John" className={styles.fieldInput} required />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="lastName">Nama Belakang</label>
                    <input id="lastName" name="lastName" type="text" placeholder="Doe" className={styles.fieldInput} />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-email">Alamat Email</label>
                  <input id="signup-email" name="email" type="email" placeholder="nama@email.com" className={styles.fieldInput} required />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-password">Password</label>
                  <input id="signup-password" name="password" type="password" placeholder="••••••••" className={styles.fieldInput} required minLength={6} />
                </div>

                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="terms" className={styles.checkbox} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <label htmlFor="terms" className={styles.checkboxLabel}>
                    Saya setuju dengan <a href="#" className={styles.checkboxLink}>Syarat Layanan</a> dan <a href="#" className={styles.checkboxLink}>Kebijakan Privasi</a>
                  </label>
                </div>

                <button type="submit" disabled={emailPending || !agreed} className={styles.submitButton} id="email-signup-button">
                  {emailPending ? <div className={styles.spinner} /> : <>Bergabung di Ekosistem <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
              </form>
            )}

            {/* PHONE SIGNUP */}
            {mode === "phone" && !otpSent && (
              <form action={phoneAction}>
                {phoneState?.error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.alertIcon}><IconAlertTriangle /></span>
                    {phoneState.error}
                  </div>
                )}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-phone">Nomor Telepon</label>
                  <div className={styles.fieldInputWrapper}>
                    <span className={styles.fieldIcon}><IconPhone /></span>
                    <input id="signup-phone" name="phone" type="tel" placeholder="+62 812 3456 7890" className={`${styles.fieldInput} ${styles.fieldInputWithIcon}`} required />
                  </div>
                  <span className={styles.fieldHint}>Kami akan mengirim kode OTP 6 digit untuk verifikasi.</span>
                </div>

                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="terms-phone" className={styles.checkbox} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <label htmlFor="terms-phone" className={styles.checkboxLabel}>
                    Saya setuju dengan <a href="#" className={styles.checkboxLink}>Syarat Layanan</a> dan <a href="#" className={styles.checkboxLink}>Kebijakan Privasi</a>
                  </label>
                </div>

                <button type="submit" disabled={phonePending || !agreed} className={styles.submitButton} id="phone-signup-button">
                  {phonePending ? <div className={styles.spinner} /> : <>Lanjutkan <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
              </form>
            )}

            {/* PHONE OTP */}
            {mode === "phone" && otpSent && (
              <form action={otpAction}>
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
                  <label className={styles.fieldLabel} htmlFor="signup-otp">Kode OTP</label>
                  <input id="signup-otp" name="otp" type="text" placeholder="000000" className={styles.fieldInput} maxLength={6} pattern="[0-9]{6}" required autoFocus style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: 700 }} />
                </div>
                <button type="submit" disabled={otpPending} className={styles.submitButton} id="verify-signup-otp-button">
                  {otpPending ? <div className={styles.spinner} /> : <>Verifikasi <span className={styles.submitArrow}><IconArrowRight /></span></>}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className={styles.backButton}>
                  <span className={styles.backIcon}><IconArrowLeft /></span> Kembali
                </button>
              </form>
            )}

            <p className={styles.switchText}>
              Sudah menjadi Eco-Guardian? <Link href="/login" className={styles.switchLink}>Masuk</Link>
            </p>

            <div className={styles.securityBadges}>
              <div className={styles.securityBadge}>
                <span className={styles.securityBadgeIcon}><IconLock /></span>
                Enkripsi Aman
              </div>
              <div className={styles.securityBadge}>
                <span className={styles.securityBadgeIcon}><IconShield /></span>
                Kepatuhan Data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
