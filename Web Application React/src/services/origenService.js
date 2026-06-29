import { apiRequest } from './apiClient.js';

export function listarOrigenes() {
  return apiRequest('/Origen/ListarTodo');
}

export function guardarOrigen(id, data) {
  const path = id && id !== '0' ? `/Origen/Modificar?id=${encodeURIComponent(id)}` : '/Origen/Insertar';
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function borrarOrigen(id) {
  return apiRequest(`/Origen/Borrar?id=${encodeURIComponent(id)}`, { method: 'POST' });
}

export function listarBarriosOrigen() {
  return apiRequest('/Barrio/ListarTodo');
}
