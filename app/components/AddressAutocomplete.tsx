"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Check, Search } from "lucide-react";

export type AreaSuggestion = {
  id: string;
  name: string;
  postal_code: string | number | null;
};

type Props = {
  value: { id: string; name: string; postal: string } | null;
  onChange: (val: { id: string; name: string; postal: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px 10px 38px",
  borderRadius: "12px",
  border: "1px solid #EFEFEB",
  background: "#f7f7f5",
  fontSize: "14px",
  color: "#1A1A1A",
  fontFamily: "inherit",
  outline: "none",
};

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Ketik kelurahan/kota (min. 3 karakter)",
  disabled,
}: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<AreaSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value → input
  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.id, value?.name]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3 || query === value?.name) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/maps/areas?input=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(Array.isArray(data.areas) ? data.areas : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value?.name]);

  const handleSelect = (area: AreaSuggestion) => {
    const postal = area.postal_code != null ? String(area.postal_code) : "";
    onChange({ id: area.id, name: area.name, postal });
    setQuery(area.name);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: "13px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#A3A39B",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value && e.target.value !== value.name) onChange(null);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={inputStyle}
        />
        {loading && (
          <Loader2
            size={15}
            style={{
              position: "absolute",
              right: "13px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#27AE60",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
        {!loading && value?.id && (
          <Check
            size={16}
            style={{
              position: "absolute",
              right: "13px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#27AE60",
            }}
          />
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: "280px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #EFEFEB",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {results.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSelect(area)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #f5f5f4",
                cursor: "pointer",
                fontSize: "13px",
                color: "#1A1A1A",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <MapPin size={14} style={{ color: "#27AE60", marginTop: "2px", flexShrink: 0 }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{area.name}</span>
                {area.postal_code && (
                  <span style={{ color: "#737369", marginLeft: "6px", fontSize: "12px" }}>
                    · {area.postal_code}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.trim().length >= 3 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #EFEFEB",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: "14px",
            fontSize: "13px",
            color: "#737369",
            textAlign: "center",
          }}
        >
          Tidak ada area cocok dengan &ldquo;{query}&rdquo;.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
