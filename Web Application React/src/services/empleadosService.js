import { apiRequest } from './apiClient.js';

export function listarVistaEmpleados() {
  return apiRequest('/Empleado/ListarVista');
}

export function buscarEmpleadoPorId(id) {
  return apiRequest(`/Empleado/ListarPorId/${id}`);
}

export function registrarEmpleado(empleado) {
  return apiRequest('/Empleado/Insertar', {
    method: 'POST',
    body: JSON.stringify(empleado)
  });
}

export function modificarEmpleado(id, empleado) {
  return apiRequest(`/Empleado/Modificar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(empleado)
  });
}

export function listarCargos() {
  return apiRequest('/Cargo/ListarTodo');
}

export function listarAreas() {
  return apiRequest('/Area/ListarTodo');
}

export function listarBarrios() {
  return apiRequest('/Barrio/ListarTodo');
}
