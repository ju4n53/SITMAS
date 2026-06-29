import emecLogo from '../assets/emec-logo-name-noBG.png';
import footerLogos from '../assets/footer-logos.png';
import Sidebar from './Sidebar.jsx';

export default function AppLayout({ session, onLogout, activePage, onNavigate, title, children }) {
  return (
    <div className="app-shell min-vh-100 d-flex flex-column">
      <header className="main-header header-color-emec d-flex justify-content-between align-items-center">
        <div><img src={emecLogo} alt="Logo Emec" className="header-logo" /></div>
        <div className="info-right d-flex align-items-center gap-3">
          <div className="text-end d-flex flex-column">
            <span>Hola, <span className="data">{session.nombre}</span></span>
            <span>Eres: <span className="data">{String(session.rol || '').toUpperCase()}</span></span>
            <button type="button" className="btn btn-danger btn-sm" onClick={onLogout}>Cerrar Sesion</button>
          </div>
          <div className="role-icon" />
        </div>
      </header>

      <div className="main-layout flex-grow-1">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className="main-body-content flex-grow-1">
          <div className="info-bar border-bottom"><span className="text-uppercase tracking-wider">{title}</span></div>
          <main className="container-fluid p-4">
            <div key={activePage} className="page-transition">
              {children}
            </div>
          </main>
        </div>
      </div>

      <footer className="footer-liston">
        <div className="container text-center">
          <div className="d-flex flex-wrap justify-content-center gap-4 align-items-center">
            <img src={footerLogos} alt="Ente BioCordoba" className="logo-inst" />
          </div>
        </div>
      </footer>
    </div>
  );
}
