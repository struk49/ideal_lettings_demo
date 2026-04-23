import React, { useEffect, useMemo, useRef, useState } from "react";

const pageWidth = {
  maxWidth: 1280,
  margin: "0 auto",
  paddingLeft: 24,
  paddingRight: 24,
};

const fieldStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  fontSize: 14,
  background: "#ffffff",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const navButtonStyle = {
  background: "transparent",
  border: "none",
  padding: 0,
  fontWeight: 700,
  color: "#334155",
  fontSize: 16,
  cursor: "pointer",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 46,
          height: 46,
          background: "#111111",
          color: "#ffffff",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        }}
      >
        IL
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 22, color: "#111111" }}>Ideal Lettings</div>
        <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 0.5 }}>
          Property Management Company
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label, subtext }) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111111",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 22,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#334155" }}>{subtext}</div>
    </div>
  );
}

function statusPill(status) {
  if (status === "Application Received") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "Contacted") {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    background: "#fee2e2",
    color: "#b91c1c",
  };
}

export default function App() {
  const API_BASE = "https://ideal-lettings-demo.onrender.com/api";
  const DASHBOARD_API_KEY = "123456";

  const [view, setView] = useState("landing");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    moveInDate: "",
    employmentStatus: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [inquiries, setInquiries] = useState([
    {
      id: "demo-1",
      name: "Emma Taylor",
      phone: "07855 987654",
      email: "emma.t@example.com",
      property: "3-Bedroom House for Rent - £1,300 pcm",
      date: "2 hours ago",
      status: "New",
      notes: "Wants to move in quickly and asked about viewing availability.",
      autoReplySent: false,
    },
    {
      id: "demo-2",
      name: "Michael Jones",
      phone: "07856 987654",
      email: "michael.j@example.com",
      property: "3-Bedroom House for Rent - £1,300 pcm",
      date: "5 hours ago",
      status: "New",
      notes: "Interested in the driveway and garage space.",
      autoReplySent: false,
    },
    {
      id: "demo-3",
      name: "Sophie Clarke",
      phone: "07944 723456",
      email: "sophie.c@example.com",
      property: "3-Bedroom House for Rent - £1,300 pcm",
      date: "2 days ago",
      status: "Contacted",
      notes: "Requested a callback after work hours.",
      autoReplySent: true,
    },
  ]);

  const homeRef = useRef(null);
  const propertiesRef = useRef(null);
  const formRef = useRef(null);
  const aboutRef = useRef(null);

  const stats = useMemo(() => {
    const newLeads = inquiries.filter((lead) => lead.status === "New").length;
    const followUps = inquiries.filter((lead) => lead.status === "Contacted").length;
    const booked = inquiries.filter((lead) => lead.status === "Application Received").length;
    return [
      { label: "New Inquiries", value: String(newLeads) },
      { label: "Follow Ups", value: String(followUps) },
      { label: "Applications", value: String(booked) },
      { label: "Total Leads", value: String(inquiries.length) },
    ];
  }, [inquiries]);

  function scrollToRef(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function mapInquiry(item) {
    return {
      id: item.id,
      name: item.full_name,
      phone: item.phone,
      email: item.email,
      property: item.property_title,
      date: item.created_at,
      status: item.status,
      notes:
        item.message ||
        `Move-in date: ${item.move_in_date || "Not provided"}. Employment: ${
          item.employment_status || "Not provided"
        }.`,
      autoReplySent: Boolean(item.auto_reply_sent),
    };
  }

  async function loadDashboardInquiries() {
    try {
      setDashboardError("");
      const response = await fetch(`${API_BASE}/dashboard/inquiries`, {
        headers: {
          "X-API-Key": DASHBOARD_API_KEY,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load dashboard inquiries.");
      }

      if (Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries.map(mapInquiry));
      }
    } catch (error) {
      console.error(error);
      setDashboardError(error.message || "Failed to load dashboard inquiries.");
    }
  }

  useEffect(() => {
    if (view === "dashboard") {
      loadDashboardInquiries();
    }
  }, [view]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    if (!form.fullName || !form.phone || !form.email) {
      setSubmitError("Please fill in your name, phone number, and email address.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          moveInDate: form.moveInDate,
          employmentStatus: form.employmentStatus,
          message: form.message,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || (data.errors && data.errors.join(", ")) || "Failed to send inquiry.");
      }

      setSubmitted(true);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        moveInDate: "",
        employmentStatus: "",
        message: "",
      });

      await loadDashboardInquiries();
      setView("dashboard");
    } catch (error) {
      console.error(error);
      setSubmitError(error.message || "Something went wrong while sending your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "dashboard") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#111827", fontFamily: "Arial, sans-serif" }}>
        <header
          style={{
            background: "#0f0f10",
            color: "#ffffff",
            borderBottom: "3px solid #111111",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              ...pageWidth,
              paddingTop: 18,
              paddingBottom: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  background: "#111111",
                  color: "#ffffff",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: 18,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                }}
              >
                IL
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>Ideal Lettings</div>
                <div style={{ fontSize: 12, color: "#d1d5db", letterSpacing: 0.5 }}>
                  PRIVATE DASHBOARD
                </div>
              </div>
            </div>

            <button
              onClick={() => setView("landing")}
              style={{
                background: "#ffffff",
                color: "#111111",
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Website
            </button>
          </div>
        </header>

        <main style={{ ...pageWidth, paddingTop: 36, paddingBottom: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: "#111111", fontWeight: 700, fontSize: 13, letterSpacing: 1.2, marginBottom: 8 }}>
              STAFF-ONLY AREA
            </div>
            <h1 style={{ fontSize: 38, margin: "0 0 10px 0" }}>Tenant Inquiries</h1>
            <p style={{ color: "#475569", fontSize: 17, lineHeight: 1.7, maxWidth: 820, margin: 0 }}>
              This private dashboard shows new rental inquiries, follow-up activity, and tenant interest for the featured property.
            </p>
          </div>

          {dashboardError && (
            <div
              style={{
                marginBottom: 18,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                padding: 14,
                borderRadius: 10,
                fontSize: 14,
                color: "#b91c1c",
              }}
            >
              {dashboardError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 22,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 34, fontWeight: 700 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {inquiries.map((lead) => (
              <div
                key={`${lead.id}-${lead.email}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 22,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>{lead.name}</div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                      {lead.property}
                    </div>
                  </div>

                  <div
                    style={{
                      ...statusPill(lead.status),
                      padding: "8px 12px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      height: "fit-content",
                    }}
                  >
                    {lead.status}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Phone</div>
                    <div style={{ fontWeight: 600 }}>{lead.phone}</div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Email</div>
                    <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{lead.email}</div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Received</div>
                    <div style={{ fontWeight: 600 }}>{lead.date}</div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#111827",
                    color: "#ffffff",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8, letterSpacing: 0.8 }}>
                    INQUIRY NOTES
                  </div>
                  <div style={{ lineHeight: 1.7 }}>{lead.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div ref={homeRef} style={{ minHeight: "100vh", background: "#ffffff", color: "#111827", fontFamily: "Arial, sans-serif" }}>
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            ...pageWidth,
            paddingTop: 16,
            paddingBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Logo />

          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 16 }}>📞 07738 427425</div>
            <div style={{ color: "#475569", fontSize: 14 }}>✉️ bill-ideallettings@hotmail.com</div>
            <button
              onClick={() => scrollToRef(formRef)}
              style={{
                background: "#111111",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Inquire About a Property
            </button>
          </div>
        </div>
      </header>

      <nav style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            ...pageWidth,
            paddingTop: 14,
            paddingBottom: 14,
            display: "flex",
            gap: 34,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button onClick={() => scrollToRef(homeRef)} style={navButtonStyle}>Home</button>
          <button onClick={() => scrollToRef(propertiesRef)} style={navButtonStyle}>Properties to Rent</button>
          <button onClick={() => scrollToRef(aboutRef)} style={navButtonStyle}>About</button>
          <button onClick={() => scrollToRef(formRef)} style={navButtonStyle}>Contact</button>
          <button
            onClick={() => setView("dashboard")}
            style={{
              marginLeft: "auto",
              background: "#111111",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Open Dashboard
          </button>
        </div>
      </nav>

      <section style={{ position: "relative", color: "#ffffff", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/house_to_let.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "scale(1.03)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.58) 100%)",
          }}
        />
        <div style={{ ...pageWidth, position: "relative", paddingTop: 110, paddingBottom: 110 }}>
          <div style={{ maxWidth: 700 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#ffffff",
                borderRadius: 999,
                padding: "8px 14px",
                marginBottom: 22,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.6,
              }}
            >
              PROPERTY TO RENT
            </div>

            <h1 style={{ fontSize: 58, lineHeight: 1.08, margin: "0 0 20px 0", fontWeight: 800 }}>
              Rent with confidence.
            </h1>

            <p style={{ fontSize: 19, lineHeight: 1.8, margin: "0 0 30px 0", color: "#f3f4f6", maxWidth: 620 }}>
              Ideal Lettings is a family-run agency committed to delivering top-quality short and long-term lettings. With a focus on trust, care, and satisfaction, we provide a high-end, personal service that you can rely on.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => scrollToRef(formRef)}
                style={{
                  background: "#111111",
                  color: "#ffffff",
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                }}
              >
                Inquire About a Property to Rent
              </button>

              <button
                style={{
                  background: "#ffffff",
                  color: "#111111",
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Call 07738 427425
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...pageWidth, paddingTop: 60, paddingBottom: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#111111",
              color: "#ffffff",
              borderRadius: 16,
              padding: 22,
            }}
          >
            <div style={{ fontSize: 13, color: "#d1d5db", marginBottom: 8 }}>Trusted Local Team</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Family-Run Service</div>
          </div>

          <MetricCard icon="🏠" value="1" label="Featured property" subtext="Currently highlighted to rent" />
          <MetricCard icon="💬" value={String(inquiries.length)} label="Active inquiries" subtext="Interest captured through the system" />
          <MetricCard icon="⚡" value="< 30s" label="Response speed" subtext="Automatic reply process enabled" />
        </div>
      </section>

      <section
        ref={propertiesRef}
        style={{
          ...pageWidth,
          paddingTop: 28,
          paddingBottom: 24,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
            padding: 18,
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: 22,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 280 }}>
            <img
              src="/house_to_let.jpg"
              alt="3-bedroom house for rent"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "#111111",
                color: "#ffffff",
                padding: "10px 14px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              3 BEDROOM
              <br />
              HOUSE TO LET
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                background: "rgba(15,23,42,0.92)",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              £1,300 <span style={{ fontWeight: 500 }}>/ month</span>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 38, margin: "0 0 16px 0", fontWeight: 800 }}>
              3-Bedroom House for Rent - £1,300 pcm
            </h3>
            <p style={{ fontSize: 17, color: "#334155", lineHeight: 1.8, marginBottom: 20 }}>
              A well-presented 3-bedroom home located in a quiet neighbourhood, ideal for families or professionals seeking comfortable living with outdoor space.
            </p>

            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
              £1,300 <span style={{ fontSize: 18, fontWeight: 500 }}>/ month</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 18,
                color: "#334155",
                fontSize: 16,
              }}
            >
              <div>🛏️ 3 spacious bedrooms</div>
              <div>🛁 Main bathroom + ensuite</div>
              <div>🚗 Double driveway + garage</div>
              <div>🌿 Large rear garden</div>
            </div>

            <div style={{ color: "#475569", lineHeight: 1.8, marginBottom: 18, fontSize: 15 }}>
              <strong>Key Features:</strong> fitted wardrobes, downstairs W/C, gas central heating, double glazing, small front garden, unfurnished.
              <br />
              <strong>Restrictions:</strong> No pets • No smoking
            </div>

            <button
              onClick={() => scrollToRef(formRef)}
              style={{
                background: "#111111",
                color: "#ffffff",
                padding: "15px 24px",
                borderRadius: 12,
                border: "none",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Inquire About This Property ›
            </button>
          </div>
        </div>
      </section>

      <section
        ref={aboutRef}
        style={{
          ...pageWidth,
          paddingTop: 28,
          paddingBottom: 70,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ color: "#111111", fontWeight: 700, fontSize: 13, letterSpacing: 1.2, marginBottom: 10 }}>
            PROPERTY INQUIRY
          </div>
          <h2 style={{ fontSize: 38, margin: "0 0 14px 0" }}>Inquire about this property</h2>
          <p style={{ color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.8 }}>
            Fill in your details below and a member of the Ideal Lettings team will contact you to discuss the property and next steps.
          </p>

          <form
            ref={formRef}
            style={{
              display: "grid",
              gap: 16,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
            onSubmit={handleSubmit}
          >
            <input style={fieldStyle} name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" />
            <input style={fieldStyle} name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
            <input style={fieldStyle} name="email" value={form.email} onChange={handleChange} placeholder="Email address" />
            <input style={fieldStyle} name="moveInDate" value={form.moveInDate} onChange={handleChange} placeholder="Preferred move-in date" />

            <select style={fieldStyle} name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
              <option value="">Employment status</option>
              <option>Employed full-time</option>
              <option>Self-employed</option>
              <option>Part-time</option>
              <option>Student</option>
              <option>Other</option>
            </select>

            <textarea
              style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your enquiry"
            />

            <button
              disabled={submitting}
              style={{
                background: "#111111",
                color: "#ffffff",
                padding: "14px 20px",
                borderRadius: 10,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {submitting ? "Sending..." : "Send Inquiry"}
            </button>

            {submitError && (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#b91c1c",
                  lineHeight: 1.6,
                }}
              >
                {submitError}
              </div>
            )}

            {submitted && (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#15803d",
                  lineHeight: 1.6,
                }}
              >
                Your inquiry has been submitted successfully and added to the private dashboard.
              </div>
            )}
          </form>
        </div>

        <div
          style={{
            background: "#111111",
            color: "#ffffff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 14px 32px rgba(15,23,42,0.12)",
          }}
        >
          <div style={{ color: "#d1d5db", fontWeight: 700, fontSize: 13, letterSpacing: 1.1, marginBottom: 10 }}>
            PRIVATE STAFF DASHBOARD
          </div>
          <h3 style={{ fontSize: 32, margin: "0 0 14px 0" }}>See the dashboard in action</h3>
          <p style={{ color: "#e5e7eb", lineHeight: 1.8, marginBottom: 22 }}>
            The dashboard button opens a private staff-only area where Ideal Lettings can view rental inquiries, contact details, notes, and follow-up status.
          </p>

          <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>Who sees it</div>
              <div style={{ fontWeight: 700 }}>Ideal Lettings staff only</div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>What it shows</div>
              <div style={{ fontWeight: 700 }}>Rental inquiries, notes, and follow-ups</div>
            </div>
          </div>

          <button
            onClick={() => setView("dashboard")}
            style={{
              background: "#ffffff",
              color: "#111111",
              padding: "14px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Open Private Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}