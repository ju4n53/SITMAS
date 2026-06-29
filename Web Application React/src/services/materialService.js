import { apiRequest } from './apiClient.js';

export function listarTiposMaterial() {
  return apiRequest('/TP_Material/ListarTodo');
}

export function guardarTipoMaterial(id, data) {
  const path = id && id !== '0' ? `/TP_Material/Modificar/${id}` : '/TP_Material/Insertar';
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function borrarTipoMaterial(id) {
  return apiRequest(`/TP_Material/Borrar/${id}`, { method: 'POST' });
}

export function listarSubtiposMaterial() {
  return apiRequest('/SbTp_Material/ListarTodo');
}

export function guardarSubtipoMaterial(id, data) {
  const path = id && id !== '0' ? `/SbTp_Material/Modificar/${id}` : '/SbTp_Material/Insertar';
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function borrarSubtipoMaterial(id) {
  return apiRequest(`/SbTp_Material/Borrar/${id}`, { method: 'POST' });
}
