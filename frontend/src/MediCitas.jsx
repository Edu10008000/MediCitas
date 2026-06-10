import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API = "http://localhost:8000/api";

// Leaflet se carga desde CDN en index.html — usamos window.L
// OpenStreetMap no requiere API key (a diferencia de Google Maps)

const request = async (method, path, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    cross_circle: <><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></>,
    check_circle: <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    map_pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    star: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    log_out: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    file_text: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>,
    activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    x: <><path d="M18 6L6 18M6 6l12 12"/></>,
    arrow_left: <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    building: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    stethoscope: <><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    toggle_on: <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3"/></>,
    toggle_off: <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3"/></>,
    navigation: <><polygon points="3 11 22 2 13 21 11 13 3 11"/></>,
    star_filled: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

// ─── PRIMITIVAS UI ─────────────────────────────────────────────────────────────
const SatBadge = ({ level }) => {
  const cfg = {
    Baja:  { bg: "#dcfce7", color: "#166534", label: "Baja ocupación" },
    Media: { bg: "#fef9c3", color: "#854d0e", label: "Media ocupación" },
    Alta:  { bg: "#fee2e2", color: "#991b1b", label: "Alta ocupación" },
  };
  const c = cfg[level] || cfg.Baja;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20 }}>
      {c.label}
    </span>
  );
};

const Input = ({ label, error, type = "text", hint, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{label}</label>}
    <input type={type} style={{
      width: "100%", boxSizing: "border-box",
      padding: "10px 14px", fontSize: 14,
      border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`,
      borderRadius: 8, outline: "none", background: "#fff",
      fontFamily: "inherit", color: "#111",
    }} {...props} />
    {hint && !error && <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{hint}</p>}
    {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>}
  </div>
);

const Select = ({ label, error, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{label}</label>}
    <select style={{
      width: "100%", boxSizing: "border-box",
      padding: "10px 14px", fontSize: 14,
      border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`,
      borderRadius: 8, outline: "none", background: "#fff",
      fontFamily: "inherit", color: "#111",
    }} {...props}>
      {children}
    </select>
    {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>}
  </div>
);

const Btn = ({ children, variant = "primary", loading, full, small, onClick, type = "button", disabled }) => {
  const styles = {
    primary:   { bg: "#1d4ed8", color: "#fff", border: "none" },
    secondary: { bg: "#fff", color: "#374151", border: "1px solid #d1d5db" },
    danger:    { bg: "#dc2626", color: "#fff", border: "none" },
    ghost:     { bg: "transparent", color: "#1d4ed8", border: "none" },
    success:   { bg: "#16a34a", color: "#fff", border: "none" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled} style={{
      background: s.bg, color: s.color, border: s.border,
      padding: small ? "6px 14px" : "10px 20px",
      fontSize: small ? 13 : 14, fontWeight: 500,
      borderRadius: 8, cursor: (loading || disabled) ? "not-allowed" : "pointer",
      opacity: (loading || disabled) ? 0.6 : 1,
      width: full ? "100%" : "auto",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      {loading ? "Cargando…" : children}
    </button>
  );
};

const Alert = ({ type = "error", message, onClose }) => {
  if (!message) return null;
  const cfg = {
    error:   { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", icon: "cross_circle" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", icon: "check_circle" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", icon: "shield" },
    warning: { bg: "#fefce8", border: "#fde047", color: "#854d0e", icon: "bell" },
  };
  const c = cfg[type] || cfg.info;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
      <Icon name={c.icon} size={16} color={c.color} />
      <p style={{ color: c.color, fontSize: 13, margin: 0, flex: 1 }}>{message}</p>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Icon name="x" size={14} color={c.color} /></button>}
    </div>
  );
};

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={20} color="#6b7280" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── MAPA LEAFLET (CU05) ──────────────────────────────────────────────────────
// Usamos Leaflet con OpenStreetMap (sin API key requerida)
const MapaConsultorios = ({ consultorios, onSelect, selectedId }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Cargar Leaflet CSS si no está
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Cargar Leaflet JS si no está
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };
    loadLeaflet();
  }, []);

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [18.0325, -93.1645], // Cunduacán, Tabasco
      zoom: 14,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    updateMarkers(map, consultorios);
  };

  const updateMarkers = (map, items) => {
    const L = window.L;
    if (!L || !map) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    items.forEach(c => {
      if (!c.latitud || !c.longitud) return;

      const satColor = c.nivel_saturacion === "Alta" ? "#dc2626" : c.nivel_saturacion === "Media" ? "#ca8a04" : "#16a34a";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${satColor};border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:700;color:#fff;
          cursor:pointer;transition:transform 0.15s;
          ${c.id === selectedId ? "transform:scale(1.3);" : ""}
        ">${(c.nombre || "?")[0].toUpperCase()}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([c.latitud, c.longitud], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui;min-width:200px;">
            <strong style="font-size:14px;color:#111">${c.doctor_nombre || c.nombre}</strong><br/>
            <span style="font-size:12px;color:#666">${c.especialidad_nombre || "Medicina General"}</span><br/>
            <span style="font-size:12px;color:#666">${c.direccion}</span><br/>
            <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
              <span style="background:${satColor}22;color:${satColor};font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500">
                ${c.nivel_saturacion === "Baja" ? "Baja ocupación" : c.nivel_saturacion === "Media" ? "Media ocupación" : "Alta ocupación"}
              </span>
              <span style="font-size:11px;color:${c.estado === "Abierto" ? "#16a34a" : "#dc2626"}">● ${c.estado}</span>
            </div>
            <button onclick="window.__selectConsultorio(${c.id})" style="
              margin-top:8px;width:100%;padding:7px;
              background:#1d4ed8;color:#fff;border:none;
              border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;
            ">Ver disponibilidad →</button>
          </div>
        `, { maxWidth: 260 });

      markersRef.current.push(marker);
    });

    // Ajustar vista si hay marcadores
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // Exponer callback global para el popup
  useEffect(() => {
    window.__selectConsultorio = (id) => {
      const c = consultorios.find(x => x.id === id);
      if (c && onSelect) onSelect(c);
    };
    return () => { delete window.__selectConsultorio; };
  }, [consultorios, onSelect]);

  // Actualizar marcadores cuando cambian consultorios
  useEffect(() => {
    if (mapInstance.current && window.L) {
      updateMarkers(mapInstance.current, consultorios);
    }
  }, [consultorios, selectedId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: 10, zIndex: 1 }} />
      {consultorios.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: 10, zIndex: 2 }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="map" size={32} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "8px 0 0" }}>Sin consultorios con ubicación registrada</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAPA PARA SELECCIONAR UBICACIÓN (doctor) ─────────────────────────────────
const MapaUbicacion = ({ lat, lng, onChange }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const loadLeaflet = () => {
      if (window.L) { initMap(); return; }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };
    loadLeaflet();
  }, []);

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    const initLat = lat || 18.0325;
    const initLng = lng || -93.1645;
    const map = L.map(mapRef.current, { center: [initLat, initLng], zoom: 15 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    const redIcon = L.divIcon({
      className: "",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: redIcon, draggable: true }).addTo(map);
      markerRef.current.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        onChange(lat, lng);
      });
    }

    map.on("click", (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng], { icon: redIcon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (ev) => {
          const { lat, lng } = ev.target.getLatLng();
          onChange(lat, lng);
        });
      }
      onChange(newLat, newLng);
    });

    mapInstance.current = map;
  };

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: 280, borderRadius: 8, border: "1px solid #d1d5db" }} />
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
        {lat && lng
          ? `📍 Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)} — Arrastra el pin para ajustar`
          : "Haz clic en el mapa para marcar la ubicación de tu consultorio"}
      </p>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin, onGoRegister }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Correo inválido";
    if (!form.password) e.password = "La contraseña es requerida";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setApiError(""); setLoading(true);
    try {
      const data = await request("POST", "/auth/login", { email: form.email.trim().toLowerCase(), password: form.password });
      onLogin(data);
    } catch (err) {
      setApiError(err.message || "Credenciales incorrectas");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, background: "#1d4ed8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="stethoscope" size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: -0.5 }}>MediCitas</span>
          </div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Sistema de citas médicas · Cunduacán, Tabasco</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "32px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Bienvenido</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Ingresa tus datos para continuar</p>
          <Alert type="error" message={apiError} onClose={() => setApiError("")} />
          <form onSubmit={handleSubmit}>
            <Input label="Correo electrónico" type="email" placeholder="nombre@ejemplo.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
            <Input label="Contraseña" type="password" placeholder="Tu contraseña"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={errors.password} />
            <Btn type="submit" full loading={loading}>Iniciar sesión</Btn>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 16 }}>
            ¿No tienes cuenta?{" "}
            <button onClick={onGoRegister} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Regístrate aquí</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
const RegisterScreen = ({ onLogin, onGoLogin }) => {
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "", confirm: "", telefono: "", rol: "paciente" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!form.apellido.trim()) e.apellido = "El apellido es requerido";
    if (!form.email.trim()) e.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Formato de correo inválido";
    if (!form.password) e.password = "La contraseña es requerida";
    else if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    else if (!/[A-Z]/.test(form.password)) e.password = "Debe incluir al menos una mayúscula";
    if (form.password !== form.confirm) e.confirm = "Las contraseñas no coinciden";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setApiError(""); setLoading(true);
    try {
      const data = await request("POST", "/auth/register", {
        nombre: form.nombre.trim(), apellido: form.apellido.trim(),
        email: form.email.trim().toLowerCase(), password: form.password,
        telefono: form.telefono || undefined, rol: form.rol,
      });
      onLogin(data);
    } catch (err) {
      setApiError(err.message || "No se pudo completar el registro");
    } finally { setLoading(false); }
  };

  const strength = form.password.length === 0 ? 0 :
    (form.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(form.password) ? 1 : 0) +
    (/[0-9]/.test(form.password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
  const sColors = ["#e5e7eb","#ef4444","#f59e0b","#22c55e","#16a34a"];
  const sLabels = ["","Débil","Regular","Buena","Excelente"];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#1d4ed8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="stethoscope" size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: -0.5 }}>MediCitas</span>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "32px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Crear cuenta</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>Completa tus datos para registrarte</p>
          <Alert type="error" message={apiError} onClose={() => setApiError("")} />
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Tipo de cuenta</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ v: "paciente", label: "Paciente", desc: "Busca y agenda citas" }, { v: "doctor", label: "Consultorio", desc: "Gestiona tu agenda" }].map(opt => (
                  <div key={opt.v} onClick={() => setForm(f => ({ ...f, rol: opt.v }))} style={{
                    border: `1.5px solid ${form.rol === opt.v ? "#1d4ed8" : "#e5e7eb"}`,
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                    background: form.rol === opt.v ? "#eff6ff" : "#fff",
                  }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: form.rol === opt.v ? "#1d4ed8" : "#374151", margin: "0 0 2px" }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Nombre" placeholder="Juan" value={form.nombre} onChange={set("nombre")} error={errors.nombre} />
              <Input label="Apellido" placeholder="García" value={form.apellido} onChange={set("apellido")} error={errors.apellido} />
            </div>
            <Input label="Correo electrónico" type="email" placeholder="juan@ejemplo.com" value={form.email} onChange={set("email")} error={errors.email} />
            <Input label="Teléfono (opcional)" type="tel" placeholder="993 000 0000" value={form.telefono} onChange={set("telefono")} />
            <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres, una mayúscula" value={form.password} onChange={set("password")} error={errors.password} />
            {form.password.length > 0 && (
              <div style={{ marginTop: -10, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? sColors[strength] : "#e5e7eb" }} />)}
                </div>
                <p style={{ fontSize: 11, color: sColors[strength], margin: 0 }}>{sLabels[strength]}</p>
              </div>
            )}
            <Input label="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
            <Btn type="submit" full loading={loading}>Crear cuenta</Btn>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 16 }}>
            ¿Ya tienes cuenta?{" "}
            <button onClick={onGoLogin} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Iniciar sesión</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ user, view, setView, onLogout }) => {
  const navItems = user?.rol === "paciente"
    ? [
        { id: "home", label: "Inicio", icon: "home" },
        { id: "buscar", label: "Buscar consultorios", icon: "search" },
        { id: "mapa", label: "Mapa de consultorios", icon: "map" },
        { id: "citas", label: "Mis citas", icon: "calendar" },
        { id: "perfil", label: "Mi perfil", icon: "user" },
      ]
    : user?.rol === "doctor"
    ? [
        { id: "home", label: "Inicio", icon: "home" },
        { id: "agenda", label: "Agenda del día", icon: "calendar" },
        { id: "horarios", label: "Horarios", icon: "clock" },
        { id: "mi_consultorio", label: "Mi consultorio", icon: "settings" },
        { id: "perfil", label: "Mi perfil", icon: "user" },
      ]
    : [
        { id: "home", label: "Panel", icon: "home" },
        { id: "reportes", label: "Reportes", icon: "activity" },
      ];

  return (
    <aside style={{ width: 230, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#1d4ed8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="stethoscope" size={17} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>MediCitas</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Cunduacán, Tab.</p>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px",
            borderRadius: 8, background: view === item.id ? "#eff6ff" : "transparent",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            color: view === item.id ? "#1d4ed8" : "#374151",
            fontSize: 13, fontWeight: view === item.id ? 600 : 400, marginBottom: 2, textAlign: "left",
          }}>
            <Icon name={item.icon} size={16} color={view === item.id ? "#1d4ed8" : "#6b7280"} />
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "14px 16px 20px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>
            {(user?.nombre || "U")[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "#111827", margin: 0 }}>{user?.nombre}</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, textTransform: "capitalize" }}>{user?.rol}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
          <Icon name="log_out" size={14} color="#9ca3af" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

// ─── HOME PACIENTE ────────────────────────────────────────────────────────────
const HomePaciente = ({ user, token, setView }) => {
  const [citas, setCitas] = useState([]);
  useEffect(() => {
    request("GET", "/citas/", null, token).then(setCitas).catch(() => {});
  }, [token]);

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = citas.filter(c => c.fecha >= hoy && !["Cancelada","Atendida"].includes(c.estado)).slice(0, 3);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Hola, {user?.nombre}</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: 0, textTransform: "capitalize" }}>
          {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { icon: "search", label: "Buscar consultorio", id: "buscar", bg: "#eff6ff", iconColor: "#1d4ed8" },
          { icon: "map", label: "Ver mapa", id: "mapa", bg: "#f0fdf4", iconColor: "#16a34a" },
          { icon: "calendar", label: "Mis citas", id: "citas", bg: "#fefce8", iconColor: "#ca8a04" },
          { icon: "file_text", label: "Historial", id: "citas", bg: "#fdf4ff", iconColor: "#7c3aed" },
        ].map(item => (
          <button key={item.label} onClick={() => setView(item.id)} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 16px",
            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon name={item.icon} size={18} color={item.iconColor} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "#111827", margin: 0 }}>{item.label}</p>
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Citas próximas</h2>
      {proximas.length === 0 ? (
        <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <Icon name="calendar" size={28} color="#d1d5db" />
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "10px 0 14px" }}>No tienes citas próximas</p>
          <Btn onClick={() => setView("buscar")} small>Buscar consultorio</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {proximas.map(c => (
            <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 3px" }}>{c.consultorio_nombre}</p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  {new Date(c.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} · {c.hora?.slice(0,5)}
                </p>
              </div>
              <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20 }}>{c.estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── BUSCAR CONSULTORIOS (CU04) ────────────────────────────────────────────────
const BuscarView = ({ token, onAgendarFrom }) => {
  const [consultorios, setConsultorios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [loading, setLoading] = useState(false);

  const buscar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("busqueda", busqueda);
      if (saturacion) params.set("saturacion", saturacion);
      const data = await request("GET", `/consultorios?${params}`, null, token);
      setConsultorios(data);
    } catch { setConsultorios([]); }
    finally { setLoading(false); }
  }, [busqueda, saturacion, token]);

  useEffect(() => { buscar(); }, [buscar]);

  return (
    <div style={{ padding: "32px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>Buscar consultorios</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color="#9ca3af" />
          </div>
          <input type="text" placeholder="Especialidad, nombre del médico o dirección…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px 10px 38px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <select value={saturacion} onChange={e => setSaturacion(e.target.value)}
          style={{ padding: "10px 14px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
          <option value="">Cualquier ocupación</option>
          <option value="Baja">Baja ocupación</option>
          <option value="Media">Media ocupación</option>
          <option value="Alta">Alta ocupación</option>
        </select>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
        {loading ? "Buscando…" : `${consultorios.length} consultorio${consultorios.length !== 1 ? "s" : ""} encontrado${consultorios.length !== 1 ? "s" : ""}`}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {consultorios.length === 0 && !loading && (
          <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: "40px", textAlign: "center" }}>
            <Icon name="search" size={28} color="#d1d5db" />
            <p style={{ color: "#9ca3af", fontSize: 14, margin: "10px 0 0" }}>No se encontraron consultorios con ese criterio</p>
          </div>
        )}
        {consultorios.map(c => (
          <div key={c.id} onClick={() => onAgendarFrom(c)} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px",
            cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,78,216,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: "#1d4ed8", flexShrink: 0 }}>
                {(c.doctor_nombre || c.nombre || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: "0 0 2px" }}>{c.doctor_nombre || c.nombre}</p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px" }}>{c.especialidad_nombre || "Medicina general"} · {c.direccion}</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <SatBadge level={c.nivel_saturacion} />
                  <span style={{ fontSize: 12, color: c.estado === "Abierto" ? "#16a34a" : "#dc2626", fontWeight: 500 }}>● {c.estado}</span>
                  {c.latitud && <span style={{ fontSize: 11, color: "#9ca3af" }}>📍 Ubicación registrada</span>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px" }}>Clic para agendar</p>
              <Icon name="arrow_left" size={16} color="#1d4ed8" style={{ transform: "scaleX(-1)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAPA DE CONSULTORIOS (CU05) ───────────────────────────────────────────────
const MapaView = ({ token, onAgendarFrom }) => {
  const [consultorios, setConsultorios] = useState([]);
  const [todos, setTodos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    (async () => {
      try {
        const data = await request("GET", "/consultorios", null, token);
        setTodos(data);
        setConsultorios(data.filter(c => c.latitud && c.longitud));
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  const filtrados = filtro === "mapa"
    ? todos.filter(c => c.latitud && c.longitud)
    : todos;

  const sinUbicacion = todos.filter(c => !c.latitud || !c.longitud);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Mapa de consultorios</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["todos", "mapa"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: "7px 14px", fontSize: 13, fontWeight: 500,
              background: filtro === f ? "#1d4ed8" : "#fff",
              color: filtro === f ? "#fff" : "#374151",
              border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
            }}>
              {f === "todos" ? "Todos" : "Solo con ubicación"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, height: "calc(100vh - 180px)" }}>
        {/* Lista lateral */}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <p style={{ color: "#9ca3af", fontSize: 13 }}>Cargando…</p>}
          {filtrados.map(c => (
            <div key={c.id} onClick={() => { setSelectedId(c.id); }} style={{
              background: selectedId === c.id ? "#eff6ff" : "#fff",
              border: `1px solid ${selectedId === c.id ? "#1d4ed8" : "#e5e7eb"}`,
              borderRadius: 10, padding: "12px 14px", cursor: "pointer",
            }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 3px" }}>{c.doctor_nombre || c.nombre}</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px" }}>{c.especialidad_nombre} · {c.direccion}</p>
              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <SatBadge level={c.nivel_saturacion} />
                  {!c.latitud && <span style={{ fontSize: 11, color: "#f59e0b" }}>Sin ubicación</span>}
                </div>
                <Btn small variant="ghost" onClick={(e) => { e.stopPropagation(); onAgendarFrom(c); }}>Agendar</Btn>
              </div>
            </div>
          ))}
          {sinUbicacion.length > 0 && filtro === "todos" && (
            <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
              <p style={{ fontSize: 12, color: "#854d0e", margin: 0 }}>
                <strong>{sinUbicacion.length}</strong> consultorio(s) sin ubicación registrada no aparecen en el mapa.
              </p>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <MapaConsultorios
            consultorios={consultorios}
            onSelect={(c) => { setSelectedId(c.id); onAgendarFrom(c); }}
            selectedId={selectedId}
          />
        </div>
      </div>
    </div>
  );
};

// ─── MIS CITAS (CU09) ─────────────────────────────────────────────────────────
const CitasView = ({ token }) => {
  const [citas, setCitas] = useState([]);
  const [tab, setTab] = useState("proximas");
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(null);
  const [msg, setMsg] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try { const data = await request("GET", "/citas/", null, token); setCitas(data); }
    catch { setCitas([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = citas.filter(c => c.fecha >= hoy && !["Cancelada","Atendida"].includes(c.estado));
  const pasadas  = citas.filter(c => c.fecha < hoy || ["Atendida","Cancelada"].includes(c.estado));

  const cancelar = async (cita) => {
    if (!confirm(`¿Cancelar la cita con ${cita.consultorio_nombre}?\n\nFecha: ${cita.fecha} · Hora: ${cita.hora?.slice(0,5)}`)) return;
    setCancelando(cita.id);
    try {
      await request("PATCH", `/citas/${cita.id}/estado`, { estado: "Cancelada" }, token);
      setMsg({ type: "success", text: "Cita cancelada. El horario fue liberado." });
      cargar();
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setCancelando(null); }
  };

  const lista = tab === "proximas" ? proximas : pasadas;
  const estadoColor = { Confirmada: "#1d4ed8", Pendiente: "#ca8a04", Atendida: "#16a34a", Cancelada: "#dc2626", En_Espera: "#7c3aed", No_Asistio: "#9ca3af" };
  const estadoBg = { Confirmada: "#eff6ff", Pendiente: "#fefce8", Atendida: "#f0fdf4", Cancelada: "#fef2f2", En_Espera: "#fdf4ff", No_Asistio: "#f9fafb" };

  return (
    <div style={{ padding: "32px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>Mis citas</h1>
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
        {[["proximas", `Próximas (${proximas.length})`], ["pasadas", `Historial (${pasadas.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            padding: "10px 18px", fontSize: 14, fontWeight: tab === id ? 600 : 400,
            color: tab === id ? "#1d4ed8" : "#6b7280",
            borderBottom: tab === id ? "2px solid #1d4ed8" : "2px solid transparent",
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>
      {loading && <p style={{ color: "#9ca3af", fontSize: 14 }}>Cargando citas…</p>}
      {!loading && lista.length === 0 && (
        <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: "40px", textAlign: "center" }}>
          <Icon name="calendar" size={28} color="#d1d5db" />
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "10px 0 0" }}>
            {tab === "proximas" ? "No tienes citas próximas" : "Sin historial de citas"}
          </p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lista.map(c => (
          <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: "0 0 2px" }}>{c.consultorio_nombre}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Código: MC-{String(c.id).padStart(6,"0")}</p>
              </div>
              <span style={{ background: estadoBg[c.estado] || "#f9fafb", color: estadoColor[c.estado] || "#374151", fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20 }}>
                {c.estado.replace("_", " ")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="calendar" size={13} color="#9ca3af" />
                {new Date(c.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <span style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="clock" size={13} color="#9ca3af" /> {c.hora?.slice(0,5)}
              </span>
            </div>
            {c.motivo && <p style={{ fontSize: 13, color: "#374151", background: "#f9fafb", borderRadius: 6, padding: "6px 10px", margin: "0 0 10px" }}>Motivo: {c.motivo}</p>}
            {c.notas && <p style={{ fontSize: 13, color: "#374151", background: "#eff6ff", borderRadius: 6, padding: "6px 10px", margin: "0 0 10px" }}>📋 Nota médica: {c.notas}</p>}
            {!["Cancelada","Atendida"].includes(c.estado) && (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small variant="danger" loading={cancelando === c.id} onClick={() => cancelar(c)}>Cancelar cita</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── AGENDAR CITA (CU06) ──────────────────────────────────────────────────────
const AgendarView = ({ token, consultorioInicial, onBack }) => {
  const [step, setStep] = useState(consultorioInicial ? 2 : 1);
  const [consultorio, setConsultorio] = useState(consultorioInicial || null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const today = new Date();
  const [mesActual, setMesActual] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const diasEnMes = new Date(mesActual.year, mesActual.month + 1, 0).getDate();
  const primerDia = new Date(mesActual.year, mesActual.month, 1).getDay();
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const cargarSlots = useCallback(async (fecha) => {
    if (!consultorio) return;
    setLoadingSlots(true);
    try {
      const data = await request("GET", `/citas/slots-disponibles?consultorio_id=${consultorio.id}&fecha=${fecha}`, null, token);
      setSlots(data.slots || []);
      if (data.slots?.length === 0 && data.mensaje) setError(data.mensaje);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }, [consultorio, token]);

  const seleccionarFecha = (d) => {
    const f = `${mesActual.year}-${String(mesActual.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    setFechaSeleccionada(f); setHoraSeleccionada(null); setError(""); cargarSlots(f);
  };

  const confirmar = async () => {
    setLoading(true); setError("");
    try {
      const cita = await request("POST", "/citas/", {
        consultorio_id: consultorio.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada + ":00",
        motivo: motivo || undefined,
      }, token);
      setSuccess(cita); setStep(4);
    } catch (err) { setError(err.message || "No se pudo agendar la cita."); }
    finally { setLoading(false); }
  };

  if (step === 4 && success) {
    return (
      <div style={{ padding: "32px 36px", maxWidth: 520 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "32px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="check_circle" size={26} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#14532d", margin: "0 0 6px" }}>¡Cita agendada exitosamente!</h2>
          <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", textAlign: "left", marginTop: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 24, color: "#111827", margin: "0 0 2px", letterSpacing: 1 }}>MC-{String(success.id).padStart(6,"0")}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 14px" }}>Código de confirmación</p>
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <p style={{ fontSize: 14, color: "#374151", margin: "0 0 4px" }}><strong>{success.consultorio_nombre}</strong></p>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 3px" }}>
                {new Date(success.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{success.hora?.slice(0,5)}</p>
            </div>
          </div>
        </div>
        <Alert type="info" message="Recibirás un recordatorio 24 horas antes de tu cita." />
        <Btn full onClick={onBack}>Volver al inicio</Btn>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
          <Icon name="arrow_left" size={20} color="#6b7280" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Agendar cita</h1>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 0 }}>
        {["Consultorio","Fecha y hora","Confirmar"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step > i+1 ? "#16a34a" : step === i+1 ? "#1d4ed8" : "#e5e7eb", fontSize: 13, fontWeight: 600, color: step >= i+1 ? "#fff" : "#9ca3af" }}>
                {step > i+1 ? "✓" : i+1}
              </div>
              <p style={{ fontSize: 11, color: step === i+1 ? "#1d4ed8" : "#9ca3af", margin: 0, fontWeight: step === i+1 ? 600 : 400 }}>{s}</p>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i+1 ? "#16a34a" : "#e5e7eb", margin: "0 6px", marginBottom: 16 }} />}
          </div>
        ))}
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />

      {/* Step 1 — Solo si no vino precargado */}
      {step === 1 && (
        <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 10, padding: 24, textAlign: "center" }}>
          <Icon name="search" size={28} color="#d1d5db" />
          <p style={{ color: "#6b7280", fontSize: 14, margin: "10px 0 14px" }}>Selecciona un consultorio desde la sección "Buscar consultorios"</p>
          <Btn onClick={onBack}>Ir a buscar</Btn>
        </div>
      )}

      {/* Step 2 — Fecha y hora */}
      {step === 2 && consultorio && (
        <div>
          <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#1e40af", margin: 0 }}>{consultorio.doctor_nombre || consultorio.nombre}</p>
            <p style={{ fontSize: 13, color: "#3b82f6", margin: "2px 0 0" }}>{consultorio.especialidad_nombre} · {consultorio.direccion}</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={() => setMesActual(m => { const d = new Date(m.year, m.month-1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="arrow_left" size={18} color="#6b7280" />
              </button>
              <p style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: 0 }}>{meses[mesActual.month]} {mesActual.year}</p>
              <button onClick={() => setMesActual(m => { const d = new Date(m.year, m.month+1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
              {["L","M","M","J","V","S","D"].map((d,i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 500, padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array.from({length: (primerDia === 0 ? 6 : primerDia-1)}).map((_,i) => <div key={`e${i}`} />)}
              {Array.from({length: diasEnMes}).map((_,i) => {
                const d = i+1;
                const f = `${mesActual.year}-${String(mesActual.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const pasado = f < today.toISOString().split("T")[0];
                const selec = f === fechaSeleccionada;
                return (
                  <button key={d} disabled={pasado} onClick={() => !pasado && seleccionarFecha(d)} style={{
                    padding: "7px 0", borderRadius: 7, border: "none", cursor: pasado ? "not-allowed" : "pointer",
                    background: selec ? "#1d4ed8" : "transparent",
                    color: selec ? "#fff" : pasado ? "#d1d5db" : "#374151",
                    fontSize: 13, fontWeight: selec ? 600 : 400, fontFamily: "inherit",
                  }}>{d}</button>
                );
              })}
            </div>
          </div>

          {fechaSeleccionada && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                Horarios disponibles — {new Date(fechaSeleccionada+"T12:00:00").toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"short" })}
              </p>
              {loadingSlots ? <p style={{ color:"#9ca3af", fontSize:13 }}>Cargando horarios…</p> : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.length === 0 && <p style={{ color:"#9ca3af", fontSize:13 }}>No hay horarios disponibles para esta fecha</p>}
                  {slots.map(s => (
                    <button key={s} onClick={() => setHoraSeleccionada(s)} style={{
                      padding: "7px 16px", border: `1.5px solid ${horaSeleccionada===s ? "#1d4ed8" : "#e5e7eb"}`,
                      borderRadius: 8, background: horaSeleccionada===s ? "#eff6ff" : "#fff",
                      color: horaSeleccionada===s ? "#1d4ed8" : "#374151",
                      fontSize: 14, fontWeight: horaSeleccionada===s ? 600 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Btn onClick={() => { if (fechaSeleccionada && horaSeleccionada) { setError(""); setStep(3); } }} disabled={!fechaSeleccionada || !horaSeleccionada} full>
            Continuar
          </Btn>
        </div>
      )}

      {/* Step 3 — Confirmar */}
      {step === 3 && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Resumen de tu cita</h3>
            {[
              ["Consultorio", consultorio?.doctor_nombre || consultorio?.nombre],
              ["Especialidad", consultorio?.especialidad_nombre || "Medicina general"],
              ["Dirección", consultorio?.direccion],
              ["Fecha", new Date(fechaSeleccionada+"T12:00:00").toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long", year:"numeric" })],
              ["Hora", horaSeleccionada],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Motivo de consulta <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Describe brevemente el motivo de tu visita…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", fontFamily: "inherit", minHeight: 80, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>Regresar</Btn>
            <Btn full loading={loading} onClick={confirmar}>Confirmar cita</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PERFIL ───────────────────────────────────────────────────────────────────
const PerfilView = ({ user }) => (
  <div style={{ padding: "32px 36px", maxWidth: 500 }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Mi perfil</h1>
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "28px" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#1d4ed8" }}>
          {(user?.nombre || "U")[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: "0 0 4px" }}>{user?.nombre}</p>
          <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" }}>{user?.rol}</span>
        </div>
      </div>
      {[["ID de usuario", `#${user?.usuario_id}`], ["Rol asignado", user?.rol], ["Correo", user?.email || "—"]].map(([k,v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{v}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── DOCTOR: HOME ─────────────────────────────────────────────────────────────
const DoctorHome = ({ user, token }) => {
  const [citas, setCitas] = useState([]);
  const [consultorio, setConsultorio] = useState(null);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    request("GET", "/citas/", null, token).then(setCitas).catch(() => {});
    request("GET", "/consultorios/mi/consultorio", null, token).then(setConsultorio).catch(() => {});
  }, [token]);

  const hoy = new Date().toISOString().split("T")[0];
  const citasHoy = citas.filter(c => c.fecha === hoy);
  const confirmadas = citasHoy.filter(c => c.estado === "Confirmada").length;
  const pendientes  = citasHoy.filter(c => c.estado === "Pendiente").length;

  const toggleEstado = async () => {
    if (!consultorio) return;
    setLoadingEstado(true);
    try {
      const nuevo = consultorio.estado === "Abierto" ? "Cerrado" : "Abierto";
      await request("PATCH", `/consultorios/${consultorio.id}/estado`, { estado: nuevo }, token);
      setConsultorio(c => ({ ...c, estado: nuevo }));
      setMsg({ type: "success", text: `Consultorio marcado como ${nuevo}` });
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setLoadingEstado(false); }
  };

  const confirmarLlegada = async (citaId) => {
    try {
      await request("PATCH", `/citas/${citaId}/estado`, { estado: "En_Espera" }, token);
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: "En_Espera" } : c));
    } catch (err) { setMsg({ type: "error", text: err.message }); }
  };

  const marcarAtendida = async (citaId) => {
    try {
      await request("PATCH", `/citas/${citaId}/estado`, { estado: "Atendida" }, token);
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: "Atendida" } : c));
      setMsg({ type: "success", text: "Cita marcada como atendida" });
    } catch (err) { setMsg({ type: "error", text: err.message }); }
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Panel del consultorio</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {consultorio && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px" }}>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 2px" }}>Estado del consultorio</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: consultorio.estado === "Abierto" ? "#16a34a" : "#dc2626", margin: 0 }}>
                ● {consultorio.estado}
              </p>
            </div>
            <button onClick={toggleEstado} disabled={loadingEstado} style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: loadingEstado ? "not-allowed" : "pointer",
              background: consultorio.estado === "Abierto" ? "#fef2f2" : "#f0fdf4",
              color: consultorio.estado === "Abierto" ? "#dc2626" : "#16a34a",
              border: `1px solid ${consultorio.estado === "Abierto" ? "#fecaca" : "#bbf7d0"}`,
              fontFamily: "inherit",
            }}>
              {loadingEstado ? "…" : consultorio.estado === "Abierto" ? "Cerrar" : "Abrir"}
            </button>
          </div>
        )}
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      {!consultorio && (
        <Alert type="warning" message="No tienes un consultorio registrado. Ve a 'Mi consultorio' para configurarlo." />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total hoy", value: citasHoy.length, bg: "#eff6ff", color: "#1d4ed8" },
          { label: "Confirmadas", value: confirmadas, bg: "#f0fdf4", color: "#16a34a" },
          { label: "Pendientes", value: pendientes, bg: "#fefce8", color: "#ca8a04" },
        ].map(item => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: "20px" }}>
            <p style={{ fontSize: 32, fontWeight: 700, color: item.color, margin: "0 0 4px" }}>{item.value}</p>
            <p style={{ fontSize: 13, color: item.color, margin: 0, opacity: 0.8 }}>{item.label}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 14px" }}>Agenda de hoy — En vivo</h2>
      {citasHoy.length === 0 ? (
        <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: "36px", textAlign: "center" }}>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No hay citas programadas para hoy</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {citasHoy.sort((a,b) => a.hora.localeCompare(b.hora)).map(c => (
            <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 3px" }}>{c.paciente_nombre}</p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{c.hora?.slice(0,5)} · {c.motivo || "Sin motivo especificado"}</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {c.estado === "Pendiente" && (
                  <Btn small variant="secondary" onClick={() => confirmarLlegada(c.id)}>Llegó</Btn>
                )}
                {c.estado === "En_Espera" && (
                  <Btn small variant="success" onClick={() => marcarAtendida(c.id)}>Atendida</Btn>
                )}
                <span style={{
                  background: c.estado === "Confirmada" ? "#eff6ff" : c.estado === "En_Espera" ? "#fdf4ff" : c.estado === "Atendida" ? "#f0fdf4" : "#fefce8",
                  color: c.estado === "Confirmada" ? "#1d4ed8" : c.estado === "En_Espera" ? "#7c3aed" : c.estado === "Atendida" ? "#16a34a" : "#ca8a04",
                  fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                }}>{c.estado.replace("_"," ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── DOCTOR: HORARIOS (CU12) ──────────────────────────────────────────────────
const HorariosView = ({ token }) => {
  const [consultorio, setConsultorio] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "14:00", duracion_cita: 30 });

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const c = await request("GET", "/consultorios/mi/consultorio", null, token);
      setConsultorio(c);
      const h = await request("GET", `/consultorios/${c.id}/horarios`, null, token);
      setHorarios(h);
    } catch (err) {
      if (err.message?.includes("404")) setConsultorio(null);
    }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarHorario = async () => {
    if (!consultorio) return;
    setSaving(true);
    try {
      await request("POST", `/consultorios/${consultorio.id}/horarios`, {
        ...form,
        hora_inicio: form.hora_inicio + ":00",
        hora_fin: form.hora_fin + ":00",
        duracion_cita: parseInt(form.duracion_cita),
      }, token);
      setMsg({ type: "success", text: "Horario guardado correctamente" });
      setShowForm(false);
      cargar();
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  const eliminarHorario = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await request("DELETE", `/horarios/${id}`, null, token);
      setHorarios(h => h.filter(x => x.id !== id));
      setMsg({ type: "success", text: "Horario eliminado" });
    } catch (err) { setMsg({ type: "error", text: err.message }); }
  };

  if (loading) return <div style={{ padding: 32 }}><p style={{ color: "#9ca3af" }}>Cargando…</p></div>;

  if (!consultorio) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>Horarios de atención</h1>
        <Alert type="warning" message="Primero debes registrar tu consultorio en la sección 'Mi consultorio'." />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Horarios de atención</h1>
        <Btn small onClick={() => setShowForm(!showForm)}><Icon name="plus" size={15} /> Agregar horario</Btn>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>Nuevo horario</h3>
          <Select label="Día de la semana" value={form.dia_semana} onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))}>
            {dias.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Hora inicio" type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            <Input label="Hora fin" type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
          </div>
          <Select label="Duración por cita (minutos)" value={form.duracion_cita} onChange={e => setForm(f => ({ ...f, duracion_cita: e.target.value }))}>
            {[15,20,30,45,60].map(m => <option key={m} value={m}>{m} min</option>)}
          </Select>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn small variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn small loading={saving} onClick={guardarHorario}>Guardar horario</Btn>
          </div>
        </div>
      )}

      {horarios.length === 0 ? (
        <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <Icon name="clock" size={28} color="#d1d5db" />
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "10px 0 0" }}>No has configurado horarios de atención</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dias.map(dia => {
            const h = horarios.find(x => x.dia_semana === dia);
            return (
              <div key={dia} style={{ background: "#fff", border: `1px solid ${h ? "#e5e7eb" : "#f3f4f6"}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: h ? "#16a34a" : "#d1d5db" }} />
                  <p style={{ fontWeight: 500, fontSize: 14, color: h ? "#111827" : "#9ca3af", margin: 0 }}>{dia}</p>
                </div>
                {h ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                      {String(h.hora_inicio).slice(0,5)} — {String(h.hora_fin).slice(0,5)} · {h.duracion_cita} min/cita
                    </p>
                    <button onClick={() => eliminarHorario(h.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Icon name="trash" size={15} color="#9ca3af" />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "#d1d5db" }}>Sin atención</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── DOCTOR: MI CONSULTORIO (CU13 + mapa) ────────────────────────────────────
const MiConsultorioView = ({ token }) => {
  const [consultorio, setConsultorio] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [modo, setModo] = useState("ver"); // "ver" | "crear" | "editar"
  const [form, setForm] = useState({ nombre: "", direccion: "", colonia: "", telefono: "", especialidad_id: "", descripcion: "", capacidad_diaria: 20, latitud: null, longitud: null });

  useEffect(() => {
    (async () => {
      try {
        const [c, esp] = await Promise.all([
          request("GET", "/consultorios/mi/consultorio", null, token).catch(() => null),
          request("GET", "/especialidades", null, token),
        ]);
        setConsultorio(c);
        setEspecialidades(esp);
        if (c) {
          setForm({
            nombre: c.nombre, direccion: c.direccion, colonia: c.colonia || "",
            telefono: c.telefono || "", especialidad_id: c.especialidad_id || "",
            descripcion: c.descripcion || "", capacidad_diaria: c.capacidad_diaria,
            latitud: c.latitud, longitud: c.longitud,
          });
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  const guardar = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        especialidad_id: form.especialidad_id ? parseInt(form.especialidad_id) : null,
        capacidad_diaria: parseInt(form.capacidad_diaria),
        latitud: form.latitud, longitud: form.longitud,
      };
      let res;
      if (consultorio) {
        res = await request("PUT", `/consultorios/${consultorio.id}`, payload, token);
      } else {
        res = await request("POST", "/consultorios", payload, token);
      }
      setConsultorio(res);
      setMsg({ type: "success", text: consultorio ? "Consultorio actualizado correctamente" : "Consultorio creado exitosamente" });
      setModo("ver");
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 32 }}><p style={{ color: "#9ca3af" }}>Cargando…</p></div>;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 680 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Mi consultorio</h1>
        {consultorio && modo === "ver" && (
          <Btn small onClick={() => setModo("editar")}><Icon name="edit" size={14} /> Editar</Btn>
        )}
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      {/* Sin consultorio → formulario de creación */}
      {!consultorio && modo !== "crear" && (
        <div style={{ background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <Icon name="building" size={32} color="#d1d5db" />
          <p style={{ color: "#6b7280", fontSize: 14, margin: "10px 0 16px" }}>Aún no tienes un consultorio registrado</p>
          <Btn onClick={() => setModo("crear")}><Icon name="plus" size={16} /> Registrar mi consultorio</Btn>
        </div>
      )}

      {/* Vista de datos */}
      {consultorio && modo === "ver" && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{consultorio.nombre}</h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{consultorio.especialidad_nombre || "Sin especialidad"}</p>
              </div>
              <span style={{ background: consultorio.estado === "Abierto" ? "#f0fdf4" : "#fef2f2", color: consultorio.estado === "Abierto" ? "#16a34a" : "#dc2626", fontSize: 13, fontWeight: 500, padding: "4px 12px", borderRadius: 20 }}>
                ● {consultorio.estado}
              </span>
            </div>
            {[
              ["Dirección", `${consultorio.direccion}${consultorio.colonia ? `, ${consultorio.colonia}` : ""}`],
              ["Teléfono", consultorio.telefono || "—"],
              ["Capacidad diaria", `${consultorio.capacidad_diaria} citas/día`],
              ["Saturación actual", consultorio.nivel_saturacion],
              ["Descripción", consultorio.descripcion || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
            <div style={{ paddingTop: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Ubicación en mapa</span>
              {consultorio.latitud && consultorio.longitud ? (
                <p style={{ fontSize: 13, fontWeight: 500, color: "#16a34a", margin: "4px 0 0" }}>
                  ✅ Registrada ({consultorio.latitud?.toFixed(4)}, {consultorio.longitud?.toFixed(4)})
                </p>
              ) : (
                <p style={{ fontSize: 13, color: "#f59e0b", margin: "4px 0 0" }}>⚠️ Sin ubicación — los pacientes no podrán verte en el mapa</p>
              )}
            </div>
          </div>

          {/* Mini mapa de vista */}
          {consultorio.latitud && consultorio.longitud && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Tu ubicación en el mapa</h3>
              <div style={{ height: 220, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <MapaConsultorios consultorios={[consultorio]} selectedId={consultorio.id} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulario crear/editar */}
      {(modo === "crear" || modo === "editar") && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px" }}>
            {modo === "crear" ? "Registrar consultorio" : "Editar consultorio"}
          </h3>
          <Input label="Nombre del consultorio *" placeholder="Ej. Consultorio Dr. García" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Dirección *" placeholder="Av. Principal #14" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
            <Input label="Colonia" placeholder="Col. Centro" value={form.colonia} onChange={e => setForm(f => ({ ...f, colonia: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Teléfono" placeholder="993 000 0000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <Input label="Capacidad diaria (citas)" type="number" min="1" max="100" value={form.capacidad_diaria} onChange={e => setForm(f => ({ ...f, capacidad_diaria: e.target.value }))} />
          </div>
          <Select label="Especialidad" value={form.especialidad_id} onChange={e => setForm(f => ({ ...f, especialidad_id: e.target.value }))}>
            <option value="">Seleccionar especialidad</option>
            {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Describe brevemente los servicios de tu consultorio…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", fontFamily: "inherit", minHeight: 70, resize: "vertical" }}
            />
          </div>

          {/* Mapa para seleccionar ubicación */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Ubicación en el mapa <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>(para que los pacientes te encuentren)</span>
            </label>
            <MapaUbicacion
              lat={form.latitud}
              lng={form.longitud}
              onChange={(lat, lng) => setForm(f => ({ ...f, latitud: lat, longitud: lng }))}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setModo(consultorio ? "ver" : "ver")}>Cancelar</Btn>
            <Btn loading={saving} onClick={guardar}>{modo === "crear" ? "Registrar consultorio" : "Guardar cambios"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [auth, setAuth] = useState(null);
  const [view, setView] = useState("home");
  const [agendarConsultorio, setAgendarConsultorio] = useState(null);

  const handleLogin = (data) => { setAuth(data); setScreen("app"); setView("home"); };
  const handleLogout = () => { setAuth(null); setScreen("login"); setView("home"); };

  const irAgendar = (consultorio) => { setAgendarConsultorio(consultorio); setView("agendar"); };

  if (screen === "login") return <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} />;
  if (screen === "register") return <RegisterScreen onLogin={handleLogin} onGoLogin={() => setScreen("login")} />;

  const renderView = () => {
    if (view === "agendar") return (
      <AgendarView token={auth.access_token} consultorioInicial={agendarConsultorio}
        onBack={() => { setView("buscar"); setAgendarConsultorio(null); }} />
    );

    if (auth.rol === "paciente") {
      switch(view) {
        case "home":    return <HomePaciente user={auth} token={auth.access_token} setView={setView} />;
        case "buscar":  return <BuscarView token={auth.access_token} onAgendarFrom={irAgendar} />;
        case "mapa":    return <MapaView token={auth.access_token} onAgendarFrom={irAgendar} />;
        case "citas":   return <CitasView token={auth.access_token} />;
        case "perfil":  return <PerfilView user={auth} />;
        default:        return <HomePaciente user={auth} token={auth.access_token} setView={setView} />;
      }
    }

    if (auth.rol === "doctor") {
      switch(view) {
        case "home":           return <DoctorHome user={auth} token={auth.access_token} />;
        case "agenda":         return <CitasView token={auth.access_token} />;
        case "horarios":       return <HorariosView token={auth.access_token} />;
        case "mi_consultorio": return <MiConsultorioView token={auth.access_token} />;
        case "perfil":         return <PerfilView user={auth} />;
        default:               return <DoctorHome user={auth} token={auth.access_token} />;
      }
    }

    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Panel de administración</h1>
        <Alert type="info" message="Panel de superadmin. Usa /docs para explorar todos los endpoints de administración." />
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc" }}>
      <Sidebar user={auth} view={view} setView={setView} onLogout={handleLogout} />
      <main style={{ flex: 1, overflowY: "auto" }}>{renderView()}</main>
    </div>
  );
}
