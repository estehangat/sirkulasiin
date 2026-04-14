"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "./settings.module.css";

type NotificationPrefs = {
  emailScan: boolean;
  emailRewards: boolean;
  emailMarketplace: boolean;
};

type ProfileForm = {
  fullName: string;
  username: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  emailScan: true,
  emailRewards: true,
  emailMarketplace: false,
};

const DEFAULT_FORM: ProfileForm = {
  fullName: "",
  username: "",
  phone: "",
  bio: "",
  location: "",
  website: "",
  avatarUrl: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SettingsClientPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ProfileForm>(DEFAULT_FORM);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        setStatus({
          type: "error",
          text: "Sesi tidak ditemukan. Silakan login ulang.",
        });
        return;
      }

      const meta = session.user.user_metadata || {};
      setUserId(session.user.id);
      const fullName =
        meta.full_name ||
        meta.name ||
        `${meta.first_name || ""} ${meta.last_name || ""}`.trim() ||
        session.user.email?.split("@")[0] ||
        "";

      setEmail(session.user.email || "");
      setForm({
        fullName,
        username: meta.username || "",
        phone: meta.phone || session.user.phone || "",
        bio: meta.bio || "",
        location: meta.location || "",
        website: meta.website || "",
        avatarUrl: meta.avatar_url || meta.picture || "",
      });

      setPrefs({
        emailScan: meta.preferences?.emailScan ?? DEFAULT_PREFS.emailScan,
        emailRewards:
          meta.preferences?.emailRewards ?? DEFAULT_PREFS.emailRewards,
        emailMarketplace:
          meta.preferences?.emailMarketplace ?? DEFAULT_PREFS.emailMarketplace,
      });

      setLoading(false);
    }

    bootstrap();
  }, [supabase]);

  const profileName = form.fullName || email || "Pengguna";

  const onChangeField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onChangePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const uploadAvatar = async (file: File) => {
    setStatus(null);

    if (!userId) {
      setStatus({ type: "error", text: "Sesi user belum siap. Coba lagi." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", text: "File harus berupa gambar." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", text: "Ukuran avatar maksimal 2MB." });
      return;
    }

    setUploadingAvatar(true);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `avatars/${userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("scan-images")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      setStatus({ type: "error", text: uploadError.message });
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("scan-images")
      .getPublicUrl(path);

    setForm((prev) => ({ ...prev, avatarUrl: publicUrlData.publicUrl }));
    setUploadingAvatar(false);
    setStatus({
      type: "success",
      text: "Avatar berhasil diunggah. Jangan lupa simpan profil.",
    });
  };

  const saveProfile = async () => {
    setStatus(null);
    setSavingProfile(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.fullName.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        avatar_url: form.avatarUrl.trim(),
        preferences: prefs,
      },
    });

    if (error) {
      setSavingProfile(false);
      setStatus({ type: "error", text: error.message });
      return;
    }

    // Sync ke tabel profiles (publik)
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.fullName.trim(),
        username: form.username.trim(),
        avatar_url: form.avatarUrl.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
      });
    }

    setSavingProfile(false);

    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();

    const freshMeta = freshUser?.user_metadata || {};
    const freshName =
      (freshMeta.full_name as string) ||
      (freshMeta.name as string) ||
      form.fullName.trim() ||
      email.split("@")[0] ||
      "Pengguna";
    const freshAvatar =
      (freshMeta.avatar_url as string) ||
      (freshMeta.picture as string) ||
      form.avatarUrl.trim() ||
      null;

    window.dispatchEvent(
      new CustomEvent("account-profile-updated", {
        detail: {
          name: freshName,
          email: freshUser?.email || email,
          avatar: freshAvatar,
        },
      }),
    );

    setStatus({ type: "success", text: "Profil berhasil diperbarui." });
  };

  const savePassword = async () => {
    setStatus(null);

    if (newPassword.length < 6) {
      setStatus({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "Konfirmasi password tidak sama." });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setStatus({ type: "error", text: error.message });
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setStatus({ type: "success", text: "Password berhasil diperbarui." });
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <article className={styles.card}>
          <p className={styles.loading}>Memuat data profil...</p>
        </article>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {status && (
        <div
          className={
            status.type === "success" ? styles.toastSuccess : styles.toastError
          }
          role="status"
          aria-live="polite"
        >
          <span>{status.text}</span>
          <button
            type="button"
            onClick={() => setStatus(null)}
            className={styles.toastClose}
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Profil Publik</h2>
          <p className={styles.sectionText}>
            Kelola identitas yang tampil di area akun Anda.
          </p>

          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              {form.avatarUrl ? (
                <Image
                  src={form.avatarUrl}
                  alt={profileName}
                  width={96}
                  height={96}
                  className={styles.avatarImage}
                  unoptimized
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {getInitials(profileName)}
                </span>
              )}
            </div>

            <div className={styles.avatarMeta}>
              <p className={styles.avatarName}>{profileName}</p>
              <p className={styles.avatarEmail}>
                {email || "email@contoh.com"}
              </p>
              <label className={styles.uploadBtn}>
                {uploadingAvatar ? "Mengunggah..." : "Upload foto"}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAvatar(file);
                    e.currentTarget.value = "";
                  }}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nama Lengkap</span>
              <input
                className={styles.input}
                value={form.fullName}
                onChange={(e) => onChangeField("fullName", e.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Username</span>
              <input
                className={styles.input}
                value={form.username}
                onChange={(e) => onChangeField("username", e.target.value)}
                placeholder="contoh: greenguardian"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input className={styles.inputDisabled} value={email} disabled />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>No. Telepon</span>
              <input
                className={styles.input}
                value={form.phone}
                onChange={(e) => onChangeField("phone", e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Avatar URL</span>
              <input
                className={styles.input}
                value={form.avatarUrl}
                onChange={(e) => onChangeField("avatarUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Bio</span>
              <textarea
                className={styles.textarea}
                value={form.bio}
                onChange={(e) => onChangeField("bio", e.target.value)}
                placeholder="Ceritakan singkat tentang Anda"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Lokasi</span>
              <input
                className={styles.input}
                value={form.location}
                onChange={(e) => onChangeField("location", e.target.value)}
                placeholder="Kota, Provinsi"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Website</span>
              <input
                className={styles.input}
                value={form.website}
                onChange={(e) => onChangeField("website", e.target.value)}
                placeholder="https://websiteanda.com"
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={saveProfile}
              className={styles.primaryBtn}
              disabled={savingProfile}
            >
              {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Notifikasi</h2>
          <p className={styles.sectionText}>
            Atur jenis update yang ingin Anda terima lewat email.
          </p>

          <div className={styles.switchList}>
            <label className={styles.switchItem}>
              <div>
                <p className={styles.switchTitle}>Update Hasil Scan</p>
                <p className={styles.switchDesc}>
                  Notifikasi ketika scan selesai diproses.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailScan}
                onChange={(e) => onChangePref("emailScan", e.target.checked)}
              />
            </label>

            <label className={styles.switchItem}>
              <div>
                <p className={styles.switchTitle}>Update Rewards</p>
                <p className={styles.switchDesc}>
                  Info poin, voucher, dan promo terbaru.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailRewards}
                onChange={(e) => onChangePref("emailRewards", e.target.checked)}
              />
            </label>

            <label className={styles.switchItem}>
              <div>
                <p className={styles.switchTitle}>Aktivitas Marketplace</p>
                <p className={styles.switchDesc}>
                  Notifikasi listing, order, dan pesan masuk.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailMarketplace}
                onChange={(e) =>
                  onChangePref("emailMarketplace", e.target.checked)
                }
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={saveProfile}
              className={styles.secondaryBtn}
              disabled={savingProfile}
            >
              {savingProfile ? "Menyimpan..." : "Simpan Preferensi"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>Keamanan Akun</h2>
          <p className={styles.sectionText}>
            Perbarui password untuk menjaga keamanan akun Anda.
          </p>

          <div className={styles.formGridSingle}>
            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Password Baru</span>
              <input
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>
                Konfirmasi Password Baru
              </span>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={savePassword}
              className={styles.warnBtn}
              disabled={savingPassword}
            >
              {savingPassword ? "Memperbarui..." : "Perbarui Password"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
