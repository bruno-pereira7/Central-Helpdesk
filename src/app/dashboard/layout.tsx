"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, TicketProvider, NotificationProvider, useNotifications } from "@/contexts";
import { ToastProvider, ProtectedRoute, FloatingChat } from "@/components";
import { useState, useEffect } from "react";

function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", adminOnly: false },
    { href: "/dashboard/notificacoes", label: "Notificações", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", adminOnly: false, badge: true },
    { href: "/dashboard/dashboard", label: "Gráficos", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", adminOnly: false },
    { href: "/dashboard/tickets", label: "Chamados", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", adminOnly: false },
    { href: "/dashboard/validacao", label: "Validação", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", adminOnly: true },
    { href: "/dashboard/usuarios", label: "Usuários", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", adminOnly: true },
    { href: "/dashboard/backup", label: "Backup", icon: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4", adminOnly: true },
    { href: "/dashboard/admin/logs", label: "Logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", adminOnly: true },
    { href: "/dashboard/admin", label: "Admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", adminOnly: true },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {isMobile && (
        <button 
          className="mobile-menu-btn" 
          onClick={() => setSidebarOpen(true)}
          style={{
            display: "flex",
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 45,
            background: "var(--color-surface)",
            borderRadius: "var(--radius-sm)",
            padding: "8px",
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div 
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} 
        onClick={closeSidebar}
        style={!isMobile ? { display: "none" } : {}}
      />

      <aside 
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={!isMobile ? { position: "fixed", left: 0 } : {}}
      >
        <div className="sidebar-logo">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span style={{ fontWeight: 700 }}>Help Desk</span>
          {isMobile && (
            <button onClick={closeSidebar} className="mobile-menu-btn" style={{ marginLeft: "auto", display: "flex" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "var(--color-danger)",
                  color: "white",
                  borderRadius: "10px",
                  padding: "2px 6px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="card" style={{ marginBottom: "var(--space-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
                <span style={{ color: "#000", fontWeight: 700, fontSize: "0.9rem" }}>
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>{user?.name}</p>
                <small style={{ fontSize: "0.75rem" }}>{user?.role === "admin" ? "Administrador" : "Usuário"}</small>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div style={{ marginLeft: window.innerWidth <= 768 ? "50px" : "0" }}>
        <h1 style={{ marginBottom: "var(--space-xs)" }}>Bem-vindo, {user?.name}</h1>
        <p style={{ fontSize: "0.9rem" }}>
          {user?.role === "admin" ? "Painel de administração do Help Desk" : "Abra um novo chamado de suporte"}
        </p>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TicketProvider>
        <NotificationProvider>
          <ToastProvider>
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <Sidebar />
              <main className="main-content" style={{ marginLeft: "260px" }}>
                <Header />
                {children}
              </main>
            </div>
            <FloatingChat />
          </ToastProvider>
        </NotificationProvider>
      </TicketProvider>
    </ProtectedRoute>
  );
}
