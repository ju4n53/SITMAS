import { apiRequest } from './apiClient.js';

export function login(usuario, password) {
  return apiRequest('/Usuario/Login', {
    method: 'POST',
    body: JSON.stringify({
      Usuario: usuario,
      Password: password
    })
  });
}

export function getStoredSession() {
  const rawSession = localStorage.getItem('usuarioSesion');
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession);
  } catch {
    localStorage.removeItem('usuarioSesion');
    return null;
  }
}

export function storeSession(data) {
  const session = {
    nombre: data.nombre,
    rol: data.rol,
    permisos: data.permisos
  };

  localStorage.setItem('usuarioSesion', JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem('usuarioSesion');
}
