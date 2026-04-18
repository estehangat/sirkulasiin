"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  User,
  Bell,
  Shield,
  Camera,
  Save,
  Lock,
  ScanLine,
  Gift,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  X,
  MapPin,
  Globe,
  Phone,
  AtSign,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  payoutChannel: "bank" | "ewallet";
  payoutBankCode: string;
  payoutAccountNumber: string;
  payoutAccountName: string;
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
  payoutChannel: "bank",
  payoutBankCode: "",
  payoutAccountNumber: "",
  payoutAccountName: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Reusable: Section Card ───────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={{
        borderRadius: "24px",
        border: "1px solid #EFEFEB",
        background: "#ffffff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "24px",
        ...style,
      }}
    >
      {children}
    </article>
  );
}

// ─── Reusable: Section Header ──────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "rgba(39,174,96,0.1)",
          border: "1px solid rgba(39,174,96,0.18)",
          flexShrink: 0,
          color: "#1E8449",
        }}
      >
        {icon}
      </div>
      <div>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: "#1A1A1A",
            marginBottom: "3px",
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: "13px", color: "#737369", lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ─── Reusable: Form Field ──────────────────────────────────────────────────────
function Field({
  label,
  icon,
  children,
  fullWidth,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#52524C",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {icon && (
          <span style={{ color: "#829E60", display: "flex" }}>{icon}</span>
        )}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: "12px",
  border: "1px solid #EFEFEB",
  background: "#f7f7f5",
  fontSize: "14px",
  color: "#1A1A1A",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.18s ease, background 0.18s ease",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#f0f0ee",
  color: "#A3A39B",
  cursor: "not-allowed",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "90px",
  lineHeight: 1.6,
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        flexShrink: 0,
        width: "44px",
        height: "24px",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        padding: "3px",
        background: checked ? "#27AE60" : "#D4D4CC",
        transition: "background 0.22s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        boxShadow: checked
          ? "0 0 0 2px rgba(39,174,96,0.2)"
          : "0 0 0 2px transparent",
      }}
    >
      <span
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "transform 0.22s ease",
        }}
      />
    </button>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function PrimaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "10px 20px",
        borderRadius: "12px",
        border: "none",
        background: disabled
          ? "#A3A39B"
          : hovered
            ? "#1E8449"
            : "#27AE60",
        color: "#fff",
        fontWeight: 700,
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s ease",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(39,174,96,0.25)",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ─── Secondary Button ─────────────────────────────────────────────────────────
function SecondaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "10px 20px",
        borderRadius: "12px",
        border: "1px solid #EFEFEB",
        background: disabled ? "#f0f0ee" : hovered ? "#f0f0ee" : "#fff",
        color: disabled ? "#A3A39B" : "#3D3D38",
        fontWeight: 700,
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ─── Warn Button ──────────────────────────────────────────────────────────────
function WarnBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "10px 20px",
        borderRadius: "12px",
        border: "none",
        background: disabled
          ? "#A3A39B"
          : hovered
            ? "#b91c1c"
            : "#dc2626",
        color: "#fff",
        fontWeight: 700,
        fontSize: "14px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s ease",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(220,38,38,0.22)",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
        payoutChannel: "bank",
        payoutBankCode: "",
        payoutAccountNumber: "",
        payoutAccountName: "",
      });
      setPrefs({
        emailScan: meta.preferences?.emailScan ?? DEFAULT_PREFS.emailScan,
        emailRewards:
          meta.preferences?.emailRewards ?? DEFAULT_PREFS.emailRewards,
        emailMarketplace:
          meta.preferences?.emailMarketplace ?? DEFAULT_PREFS.emailMarketplace,
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("payout_channel, payout_bank_code, payout_account_number, payout_account_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setForm((prev) => ({
          ...prev,
          payoutChannel:
            profile.payout_channel === "ewallet" ? "ewallet" : "bank",
          payoutBankCode: profile.payout_bank_code || "",
          payoutAccountNumber: profile.payout_account_number || "",
          payoutAccountName: profile.payout_account_name || "",
        }));
      }
      setLoading(false);
    }
    bootstrap();
  }, [supabase]);

  const profileName = form.fullName || email || "Pengguna";

  const onChangeField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onChangePref = (key: keyof NotificationPrefs, value: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

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
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.fullName.trim(),
        username: form.username.trim(),
        avatar_url: form.avatarUrl.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        payout_channel: form.payoutChannel,
        payout_bank_code: form.payoutBankCode.trim() || null,
        payout_account_number: form.payoutAccountNumber.trim() || null,
        payout_account_name: form.payoutAccountName.trim() || null,
      });
    }
    setSavingProfile(false);
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();
    const freshMeta = freshUser?.user_metadata || {};
    window.dispatchEvent(
      new CustomEvent("account-profile-updated", {
        detail: {
          name:
            (freshMeta.full_name as string) ||
            (freshMeta.name as string) ||
            form.fullName.trim() ||
            email.split("@")[0] ||
            "Pengguna",
          email: freshUser?.email || email,
          avatar:
            (freshMeta.avatar_url as string) ||
            (freshMeta.picture as string) ||
            form.avatarUrl.trim() ||
            null,
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "3px solid #EFEFEB",
              borderTop: "3px solid #27AE60",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "14px", color: "#737369", fontWeight: 600 }}>
            Memuat data profil...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gap: "18px" }}>
      {/* Toast */}
      {status && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "sticky",
            top: "12px",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            borderRadius: "16px",
            padding: "13px 16px",
            border: `1px solid ${status.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            background: status.type === "success" ? "#f0fdf4" : "#fef2f2",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
            ) : (
              <XCircle size={18} style={{ color: "#dc2626" }} />
            )}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: status.type === "success" ? "#166534" : "#991b1b",
              }}
            >
              {status.text}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatus(null)}
            aria-label="Tutup notifikasi"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: status.type === "success" ? "#16a34a" : "#dc2626",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 1. Profil Publik ───────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={<User size={18} />}
          title="Profil Publik"
          subtitle="Kelola identitas yang tampil di area akun Anda."
        />

        {/* Avatar Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "18px",
            background: "#f7f7f5",
            border: "1px solid #EFEFEB",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid rgba(39,174,96,0.25)",
              background: "rgba(39,174,96,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {form.avatarUrl ? (
              <Image
                src={form.avatarUrl}
                alt={profileName}
                width={72}
                height={72}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                unoptimized
              />
            ) : (
              <span
                style={{ fontSize: "20px", fontWeight: 800, color: "#1E8449" }}
              >
                {getInitials(profileName)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1A1A1A",
                marginBottom: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profileName}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#737369",
                marginBottom: "10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email || "email@contoh.com"}
            </p>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "10px",
                border: "1px solid #EFEFEB",
                background: "#fff",
                cursor: uploadingAvatar ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 700,
                color: uploadingAvatar ? "#A3A39B" : "#3D3D38",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Camera size={14} />
              {uploadingAvatar ? "Mengunggah..." : "Upload foto"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
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

        {/* Form Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <Field label="Nama Lengkap" icon={<User size={12} />}>
            <input
              style={inputStyle}
              value={form.fullName}
              onChange={(e) => onChangeField("fullName", e.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </Field>

          <Field label="Username" icon={<AtSign size={12} />}>
            <input
              style={inputStyle}
              value={form.username}
              onChange={(e) => onChangeField("username", e.target.value)}
              placeholder="contoh: greenguardian"
            />
          </Field>

          <Field label="Email">
            <input style={inputDisabledStyle} value={email} disabled />
          </Field>

          <Field label="No. Telepon" icon={<Phone size={12} />}>
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => onChangeField("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </Field>

          <Field label="Lokasi" icon={<MapPin size={12} />}>
            <input
              style={inputStyle}
              value={form.location}
              onChange={(e) => onChangeField("location", e.target.value)}
              placeholder="Kota, Provinsi"
            />
          </Field>

          <Field label="Website" icon={<Globe size={12} />}>
            <input
              style={inputStyle}
              value={form.website}
              onChange={(e) => onChangeField("website", e.target.value)}
              placeholder="https://websiteanda.com"
            />
          </Field>

          <Field label="Avatar URL" fullWidth>
            <input
              style={inputStyle}
              value={form.avatarUrl}
              onChange={(e) => onChangeField("avatarUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>

          <Field label="Bio" fullWidth>
            <textarea
              style={textareaStyle}
              value={form.bio}
              onChange={(e) => onChangeField("bio", e.target.value)}
              placeholder="Ceritakan singkat tentang Anda"
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <PrimaryBtn onClick={saveProfile} disabled={savingProfile}>
            <Save size={15} />
            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
          </PrimaryBtn>
        </div>
      </Card>

      {/* ── 2. Metode Pencairan Dana (Seller) ─────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={<ShoppingBag size={18} />}
          title="Metode Pencairan Dana"
          subtitle="Untuk pencairan hasil penjualan marketplace ke rekening/ewallet Anda."
        />

        <div
          style={{
            display: "grid",
            gap: "12px",
            padding: "16px",
            borderRadius: "18px",
            background: "#f7f7f5",
            border: "1px solid #EFEFEB",
          }}
        >
          <Field label="Channel" fullWidth>
            <select
              value={form.payoutChannel}
              onChange={(e) =>
                onChangeField("payoutChannel", e.target.value as ProfileForm["payoutChannel"])
              }
              style={{
                ...inputStyle,
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value="bank">Bank</option>
              <option value="ewallet" disabled>
                E-wallet (coming soon)
              </option>
            </select>
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <Field label={form.payoutChannel === "bank" ? "Kode Bank" : "Provider"}>
              <input
                value={form.payoutBankCode}
                onChange={(e) => onChangeField("payoutBankCode", e.target.value)}
                placeholder={form.payoutChannel === "bank" ? "bca" : "gopay"}
                style={inputStyle}
              />
            </Field>
            <Field label={form.payoutChannel === "bank" ? "Nomor Rekening" : "Nomor Akun"}>
              <input
                value={form.payoutAccountNumber}
                onChange={(e) => onChangeField("payoutAccountNumber", e.target.value)}
                placeholder={form.payoutChannel === "bank" ? "1234567890" : "081234567890"}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Nama Pemilik" fullWidth>
            <input
              value={form.payoutAccountName}
              onChange={(e) => onChangeField("payoutAccountName", e.target.value)}
              placeholder="Sesuai rekening"
              style={inputStyle}
            />
          </Field>
          <p style={{ fontSize: "12px", color: "#737369", lineHeight: 1.5, margin: 0 }}>
            Catatan: Untuk sandbox IRIS, pastikan kode bank sesuai daftar Midtrans IRIS.
          </p>
        </div>
      </Card>

      {/* ── 2. Notifikasi ─────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={<Bell size={18} />}
          title="Notifikasi"
          subtitle="Atur jenis update yang ingin Anda terima lewat email."
        />

        <div
          style={{
            display: "grid",
            gap: "3px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              key: "emailScan" as const,
              icon: <ScanLine size={16} style={{ color: "#27AE60" }} />,
              title: "Update Hasil Scan",
              desc: "Notifikasi ketika scan selesai diproses.",
              iconBg: "#f0fdf4",
              iconBorder: "#bbf7d0",
            },
            {
              key: "emailRewards" as const,
              icon: <Gift size={16} style={{ color: "#d97706" }} />,
              title: "Update Rewards",
              desc: "Info poin, voucher, dan promo terbaru.",
              iconBg: "#fffbeb",
              iconBorder: "#fde68a",
            },
            {
              key: "emailMarketplace" as const,
              icon: <ShoppingBag size={16} style={{ color: "#3b82f6" }} />,
              title: "Aktivitas Marketplace",
              desc: "Notifikasi listing, order, dan pesan masuk.",
              iconBg: "#eff6ff",
              iconBorder: "#bfdbfe",
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                padding: "14px",
                borderRadius: "16px",
                border: "1px solid #EFEFEB",
                background: prefs[item.key] ? "#fafefb" : "#fafafa",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: item.iconBg,
                    border: `1px solid ${item.iconBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1A1A1A",
                      marginBottom: "2px",
                    }}
                  >
                    {item.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "#737369" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs[item.key]}
                onChange={(val) => onChangePref(item.key, val)}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SecondaryBtn onClick={saveProfile} disabled={savingProfile}>
            <Save size={15} />
            {savingProfile ? "Menyimpan..." : "Simpan Preferensi"}
          </SecondaryBtn>
        </div>
      </Card>

      {/* ── 3. Keamanan ───────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon={<Shield size={18} />}
          title="Keamanan Akun"
          subtitle="Perbarui password untuk menjaga keamanan akun Anda."
        />

        <div
          style={{
            display: "grid",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <Field label="Password Baru" icon={<Lock size={12} />} fullWidth>
            <input
              type="password"
              style={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </Field>

          <Field
            label="Konfirmasi Password Baru"
            icon={<Lock size={12} />}
            fullWidth
          >
            <input
              type="password"
              style={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
            />
          </Field>

          {/* Password match indicator */}
          {confirmPassword.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color:
                  newPassword === confirmPassword ? "#16a34a" : "#dc2626",
              }}
            >
              {newPassword === confirmPassword ? (
                <CheckCircle2 size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {newPassword === confirmPassword
                ? "Password cocok"
                : "Password tidak cocok"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <WarnBtn onClick={savePassword} disabled={savingPassword}>
            <Shield size={15} />
            {savingPassword ? "Memperbarui..." : "Perbarui Password"}
          </WarnBtn>
        </div>
      </Card>
    </div>
  );
}
