import { useState } from 'react';
import biocbaLogo from '../assets/biocba-solo-noBG.png';
import footerLogos from '../assets/footer-logos.png';
import { login, storeSession } from '../services/authService.js';

export default function LoginPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const usuario = String(formData.get('usuario') || '').trim();
    const password = String(formData.get('password') || '');
    const errorBox = event.currentTarget.querySelector('[data-login-error]');

    errorBox.textContent = '';
    errorBox.style.display = 'none';

    if (!usuario || !password) {
      errorBox.textContent = '* Complete todos los campos';
      errorBox.style.display = 'block';
      return;
    }

    try {
      const data = await login(usuario, password);
      onLogin(storeSession(data));
    } catch {
      errorBox.textContent = '* Usuario o contrasena incorrectos';
      errorBox.style.display = 'block';
    }
  }

  return (
    <div className={`login-page gradient-bg d-flex flex-column min-vh-100 ${showLogin ? 'is-login-visible' : ''}`}>
      <main className="login-stage flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="login-stage-content w-100 mx-3">
          <button type="button" className="login-logo-button" onClick={() => setShowLogin(true)} aria-label="Mostrar ingreso">
            <img src={biocbaLogo} alt="Ente Municipal BioCordoba" className="logo-header-login" />
          </button>

          <div className="login-transparent-container w-100">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                name="usuario"
                className="form-control form-control-lg login-input-rounded"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                name="password"
                className="form-control form-control-lg login-input-rounded"
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
              />
              <span className="error-msg mt-1" data-login-error />
            </div>

            <button type="submit" className="btn btn-login-custom btn-lg w-100 py-2 shadow-sm">
              Ingresar
            </button>
          </form>
          </div>
        </div>
      </main>

      <footer className="footer-liston mt-auto">
        <div className="container text-center">
          <div className="d-flex flex-wrap justify-content-center gap-4 align-items-center">
            <img src={footerLogos} alt="Logos Institucionales" className="logo-inst" />
          </div>
        </div>
      </footer>
    </div>
  );
}
