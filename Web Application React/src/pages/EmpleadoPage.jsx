import { useEffect, useMemo, useState } from 'react';
import AccordionCard from '../components/AccordionCard.jsx';
import DataTable from '../components/DataTable.jsx';
import Field from '../components/Field.jsx';
import { filterRows } from '../utils/filterRows.js';
import {
  buscarEmpleadoPorId,
  listarAreas,
  listarBarrios,
  listarCargos,
  listarVistaEmpleados,
  modificarEmpleado,
  registrarEmpleado
} from '../services/empleadosService.js';

const emptyForm = {
  Apellido: '',
  Nombre: '',
  Cuil: '',
  Telefono: '',
  Email: '',
  Fecha_Ingreso: '',
  Id_Cargo: '',
  Id_Area: '',
  Id_Barrio: '',
  Id_Estado_Empleado: '',
  Calle: '',
  Numero: '',
  Piso: '',
  Dpto: ''
};

const allowedRoles = ['Administrador', 'Supervisor', 'RRHH', 'RRII'];

export default function EmpleadoPage({ session }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [detailFilter, setDetailFilter] = useState('');
  const [detalleEmpleados, setDetalleEmpleados] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const canAccess = allowedRoles.includes(session?.rol);

  async function cargarDatos() {
    setLoading(true);
    setMessage('');
    try {
      const [vistaData, cargosData, areasData, barriosData] = await Promise.all([
        listarVistaEmpleados(),
        listarCargos(),
        listarAreas(),
        listarBarrios()
      ]);
      setDetalleEmpleados(vistaData || []);
      setCargos(cargosData || []);
      setAreas(areasData || []);
      setBarrios(barriosData || []);
    } catch (error) {
      setMessage(`No se pudieron cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccess) {
      cargarDatos();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  const filteredDetalle = useMemo(() => filterRows(detalleEmpleados, detailFilter), [detalleEmpleados, detailFilter]);

  if (!canAccess) {
    return (
      <div className="access-denied min-vh-100 d-flex align-items-center justify-content-center">
        <section className="sitmas-card access-denied-card">
          <h1>Acceso restringido</h1>
          <p>No tiene permisos para acceder a la gestion de empleados.</p>
        </section>
      </div>
    );
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function formatCuil(val) {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    }
  }

  function formatDate(val) {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }
  }

  function handleAlphabetChange(field, val) {
    const sanitized = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    updateForm(field, sanitized);
  }

  function handleNumberChange(field, val) {
    const sanitized = val.replace(/[^0-9]/g, '');
    updateForm(field, sanitized);
  }

  function handleEmailChange(val) {
    const sanitized = val.replace(/[^a-zA-Z0-9@._+-]/g, '');
    updateForm('Email', sanitized);
  }

  function handleCuilChange(val) {
    updateForm('Cuil', formatCuil(val));
  }

  function handleDateChange(val) {
    updateForm('Fecha_Ingreso', formatDate(val));
  }

  function handleCalleChange(val) {
    const sanitized = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,-]/g, '');
    updateForm('Calle', sanitized);
  }

  function handleAlphanumericChange(field, val) {
    const sanitized = val.replace(/[^a-zA-Z0-9]/g, '');
    updateForm(field, sanitized);
  }

  function handleLimpiar() {
    setForm(emptyForm);
    setSearchId('');
    setEditingId(null);
    setMessage('');
  }
  // Validación de duplicados
  function verificarDuplicado(apellido, nombre) {
    return detalleEmpleados.some(
      (emp) => 
        emp.Apellido.toLowerCase() === apellido.toLowerCase() && 
        emp.Nombre.toLowerCase() === nombre.toLowerCase() &&
        emp.Id !== editingId
    );
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    try {
      let successMsg = '';
      if (editingId) {
        await modificarEmpleado(editingId, { ...form });
        successMsg = 'Datos actualizados correctamente.';
      } else {
        await registrarEmpleado({ ...form });
        successMsg = 'Empleado guardado con exito.';
      }
      handleLimpiar();
      await cargarDatos();
      setMessage(successMsg);
    } catch (error) {
      const actionStr = editingId ? 'actualizar' : 'registrar';
      setMessage(`Error al ${actionStr} empleado: ${error.message}`);
    }
  }

  async function handleBuscar() {
    if (!searchId.trim()) {
      setMessage('Ingrese un ID para buscar.');
      return;
    }

    setMessage('');
    try {
      const empleado = await buscarEmpleadoPorId(searchId.trim());
      setForm({
        Apellido: empleado?.Apellido || '',
        Nombre: empleado?.Nombre || '',
        Cuil: formatCuil(empleado?.Cuil || ''),
        Telefono: empleado?.Telefono || '',
        Email: empleado?.Email || '',
        Fecha_Ingreso: formatDate(empleado?.Fecha_Ingreso || ''),
        Id_Cargo: empleado?.Id_Cargo || '',
        Id_Area: empleado?.Id_Area || '',
        Id_Barrio: empleado?.Id_Barrio || '',
        Id_Estado_Empleado: empleado?.Id_Estado_Empleado || '',
        Calle: empleado?.Calle || '',
        Numero: empleado?.Numero || '',
        Piso: empleado?.Piso || '',
        Dpto: empleado?.Dpto || ''
      });
      setEditingId(empleado?.Id || null);
      setMessage('Empleado cargado en el formulario.');
    } catch (error) {
      setMessage(`Empleado no encontrado: ${error.message}`);
    }
  }

  return (
    <>
      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div className="alert alert-secondary">Cargando datos...</div>}

      <AccordionCard title="Registrar Empleado">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <Field label="Apellido"><input className="form-control" value={form.Apellido} onChange={(e) => handleAlphabetChange('Apellido', e.target.value)} required placeholder="Ej: Perez" /></Field>
            <Field label="Nombre"><input className="form-control" value={form.Nombre} onChange={(e) => handleAlphabetChange('Nombre', e.target.value)} required placeholder="Ej: Juan" /></Field>
            <Field label="CUIL"><input className="form-control" value={form.Cuil} onChange={(e) => handleCuilChange(e.target.value)} required placeholder="20-33444555-9" maxLength={13} minLength={13} /></Field>
            <Field label="Telefono"><input type="text" className="form-control" value={form.Telefono} onChange={(e) => handleNumberChange('Telefono', e.target.value)} required /></Field>
            <Field label="Email"><input type="email" className="form-control" value={form.Email} onChange={(e) => handleEmailChange(e.target.value)} required placeholder="Ej: juan.perez@email.com" /></Field>
            <Field label="Fecha de Ingreso"><input className="form-control" value={form.Fecha_Ingreso} onChange={(e) => handleDateChange(e.target.value)} required placeholder="yyyy-mm-dd" maxLength={10} minLength={10} /></Field>
            
            <Field label="Cargo">
              <select className="form-control" value={form.Id_Cargo} onChange={(e) => updateForm('Id_Cargo', e.target.value)} required>
                <option value="">Seleccione Cargo</option>
                {cargos.map((cargo) => <option key={cargo.Id} value={cargo.Id}>{cargo.Cargo}</option>)}
              </select>
            </Field>
            <Field label="Area">
              <select className="form-control" value={form.Id_Area} onChange={(e) => updateForm('Id_Area', e.target.value)} required>
                <option value="">Seleccione Area</option>
                {areas.map((area) => <option key={area.Id} value={area.Id}>{area.Area}</option>)}
              </select>
            </Field>
            <Field label="Barrio">
              <select className="form-control" value={form.Id_Barrio} onChange={(e) => updateForm('Id_Barrio', e.target.value)} required>
                <option value="">Seleccione Barrio</option>
                {barrios.map((barrio) => <option key={barrio.Id} value={barrio.Id}>{barrio.Barrio}</option>)}
              </select>
            </Field>
            
            <Field label="Id Estado">
              <select className="form-control" value={form.Id_Estado_Empleado} onChange={(e) => updateForm('Id_Estado_Empleado', e.target.value)} required>
                <option value="">Seleccione un estado (1:Activo, 2: Inactivo)</option>
                <option value="1">1: Activo</option>
                <option value="2">2: Inactivo</option>
              </select>
            </Field>
            
            <Field label="Calle"><input className="form-control" value={form.Calle} onChange={(e) => handleCalleChange(e.target.value)} required /></Field>
            <Field label="Numero"><input type="text" className="form-control" value={form.Numero} onChange={(e) => handleNumberChange('Numero', e.target.value)} required /></Field>
            <Field label="Piso"><input type="text" className="form-control" value={form.Piso} onChange={(e) => handleNumberChange('Piso', e.target.value)} /></Field>
            <Field label="Dpto"><input className="form-control" value={form.Dpto} onChange={(e) => handleAlphanumericChange('Dpto', e.target.value)} /></Field>
            
            <div className="col-12 search-row"><input className="form-control" value={searchId} onChange={(e) => setSearchId(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Busqueda por Codigo" /><button type="button" className="btn btn-outline-secondary" onClick={handleBuscar}>Buscar</button></div>
            <div className="col-12 form-buttons"><button type="submit" className="btn-submit btn-sitmas-success py-2 shadow-sm">Guardar Empleado</button><button type="button" className="btn btn-outline-secondary" onClick={handleLimpiar}>Limpiar</button></div>
          </div>
        </form>
      </AccordionCard>

      <AccordionCard title="Detalle de Empleados">
        <div className="table-filter"><input value={detailFilter} onChange={(e) => setDetailFilter(e.target.value)} placeholder="Filtrar tabla por cualquier campo..." /></div>
        <DataTable columns={['Id', 'Apellido', 'Nombre', 'CUIL', 'Telefono', 'Email', 'Ingreso', 'Cargo', 'Area', 'Barrio', 'Estado']} rows={filteredDetalle} emptyText="No hay detalle de empleados para mostrar." renderRow={(o) => <tr key={o.Id}><td>{o.Id}</td><td>{o.Apellido}</td><td>{o.Nombre}</td><td>{o.Cuil}</td><td>{o.Telefono}</td><td>{o.Email}</td><td>{o.Fecha_Ingreso}</td><td>{o.Cargo}</td><td>{o.Area}</td><td>{o.Barrio}</td><td>{o.EstadoEmpleado}</td></tr>} />
      </AccordionCard>
    </>
  );
}