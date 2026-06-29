import { useState } from 'react';

export default function Sidebar({ activePage, onNavigate }) {
  const [openMenus, setOpenMenus] = useState({
    personal: activePage === 'empleados',
    trazabilidad: activePage?.startsWith('traz-')
  });

  function navClass(page, section) {
    const active = activePage === page || activePage?.startsWith(`${section}-`);
    return `nav-link d-flex align-items-center ${active ? 'active' : ''}`;
  }

  function toggleMenu(menu) {
    setOpenMenus((current) => ({ ...current, [menu]: !current[menu] }));
  }

  function submenuClass(menu) {
    return `submenu-panel ${openMenus[menu] ? 'is-open' : ''}`;
  }

  return (
    <aside className="sidebar-vertical sidebar-collapsible d-none d-md-block">
      <ul className="nav flex-column nav-list pt-3">
        <li className="nav-item">
          <button type="button" className={navClass('inicio', 'inicio')} onClick={() => onNavigate('empleados')}>
            <span className="material-symbols-outlined">home</span>
            <span className="menu-text">INICIO</span>
          </button>
        </li>

        <li className={`nav-item ${openMenus.personal ? 'has-open-submenu' : ''}`}>
          <button type="button" className={navClass('empleados', 'personal')} onClick={() => toggleMenu('personal')} aria-expanded={openMenus.personal}>
            <span className="material-symbols-outlined">group</span>
            <span className="menu-text">PERSONAL</span>
            <span className="submenu-caret">v</span>
          </button>
          <div className={submenuClass('personal')}>
            <button type="button" className="nav-link small ps-4" onClick={() => onNavigate('empleados')}>Empleados</button>
          </div>
        </li>

        <li className="nav-item">
          <button type="button" className={navClass('logistica', 'logistica')} disabled>
            <span className="material-symbols-outlined">local_shipping</span>
            <span className="menu-text">LOGISTICA</span>
          </button>
        </li>

        <li className={`nav-item ${openMenus.trazabilidad ? 'has-open-submenu' : ''}`}>
          <button type="button" className={navClass('traz-material', 'traz')} onClick={() => toggleMenu('trazabilidad')} aria-expanded={openMenus.trazabilidad}>
            <span className="material-symbols-outlined">sync</span>
            <span className="menu-text">TRAZABILIDAD</span>
            <span className="submenu-caret">v</span>
          </button>
          <div className={submenuClass('trazabilidad')}>
            <button type="button" className="nav-link small ps-4" onClick={() => onNavigate('traz-material')}>Ingreso Material</button>
            <button type="button" className="nav-link small ps-4" onClick={() => onNavigate('traz-origen')}>Origen</button>
          </div>
        </li>

        <li className="nav-item">
          <button type="button" className={navClass('configuracion', 'configuracion')} disabled>
            <span className="material-symbols-outlined">settings</span>
            <span className="menu-text">CONFIGURACION</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}
