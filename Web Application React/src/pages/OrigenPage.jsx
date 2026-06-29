import { useEffect, useMemo, useRef, useState } from 'react';
import AccordionCard from '../components/AccordionCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import Field from '../components/Field.jsx';
import { filterRows } from '../utils/filterRows.js';
import { borrarOrigen, guardarOrigen, listarBarriosOrigen, listarOrigenes } from '../services/origenService.js';

const emptyOrigen = {
  IdOrigen: '0',
  EmpresaInstitucion: '',
  CalleEI: '',
  NumeroEI: '',
  TelefonoEI: '',
  Id_Barrio: '',
  EmailEI: ''
};

export default function OrigenPage() {
  const [form, setForm] = useState(emptyOrigen);
  const [origenes, setOrigenes] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef(null);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [barriosData, origenesData] = await Promise.all([
        listarBarriosOrigen(),
        listarOrigenes()
      ]);
      setBarrios(barriosData || []);
      setOrigenes(origenesData || []);
    } catch (error) {
      setMessage(`No se pudieron cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const origenesConBarrio = useMemo(() => origenes.map((origen) => ({
    ...origen,
    BarrioNombre: barrios.find((barrio) => Number(barrio.Id) === Number(origen.Id_Barrio))?.Barrio || 'Sin asignar'
  })), [origenes, barrios]);
  const filteredOrigenes = useMemo(() => filterRows(origenesConBarrio, filter), [origenesConBarrio, filter]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleTelefonoChange(val) {
    const sanitized = val.replace(/[^0-9+]/g, '');
    updateForm('TelefonoEI', sanitized);
  }

  async function handleGuardar(event) {
    event.preventDefault();
    setLoading(true); // Mostramos carga para bloquear botones
    setMessage('');
    try {
      await guardarOrigen(form.IdOrigen, {
        IdOrigen: form.IdOrigen,
        EmpresaInstitucion: form.EmpresaInstitucion,
        CalleEI: form.CalleEI,
        NumeroEI: form.NumeroEI,
        TelefonoEI: form.TelefonoEI,
        Id_Barrio: form.Id_Barrio,
        EmailEI: form.EmailEI
      });
      
      setForm(emptyOrigen);
      await cargarDatos(); // Recargamos la lista
      setMessage('Origen guardado correctamente.'); // Mensaje de éxito
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll al cartel
    } catch (error) {
      setLoading(false);
      setMessage(`Error al guardar origen: ${error.message}`);
    }
  }

  async function confirmarEliminar() {
    if (!deleteTarget) return;

    setMessage('');
    try {
      await borrarOrigen(deleteTarget.id);
      await cargarDatos();
      setMessage('Origen eliminado correctamente.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(`Error al eliminar origen: ${error.message}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setDeleteTarget(null);
    }
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleEditar(origen) {
    setForm({
      IdOrigen: String(origen.IdOrigen || '0'),
      EmpresaInstitucion: origen.EmpresaInstitucion || '',
      CalleEI: origen.CalleEI || '',
      NumeroEI: origen.NumeroEI || '',
      TelefonoEI: origen.TelefonoEI || '',
      Id_Barrio: String(origen.Id_Barrio || ''),
      EmailEI: origen.EmailEI || ''
    });
    setFormOpen(true);
    scrollToForm();
  }

  return (
    <>
      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div className="alert alert-secondary">Cargando datos...</div>}

      <div ref={formRef} className="edit-scroll-target">
        <AccordionCard title="Registrar Nuevo Origen" open={formOpen} onOpenChange={setFormOpen}>
          <form onSubmit={handleGuardar}>
            <input type="hidden" value={form.IdOrigen} readOnly />
            <div className="row g-3">
              <Field label="Empresa / Institucion" className="col-md-6">
                <input className="form-control" value={form.EmpresaInstitucion} onChange={(e) => updateForm('EmpresaInstitucion', e.target.value)} required placeholder="Ej: Municipalidad de Cordoba" />
              </Field>
              <Field label="Calle" className="col-md-4">
                <input className="form-control" value={form.CalleEI} onChange={(e) => updateForm('CalleEI', e.target.value)} required placeholder="Ej: Av. Colon" />
              </Field>
              <Field label="Numero" className="col-md-2">
                <input type="number" className="form-control" value={form.NumeroEI} onChange={(e) => updateForm('NumeroEI', e.target.value)} required placeholder="1234" min="0" />
              </Field>
              <Field label="Telefono" className="col-md-4">
                <input type="tel" className="form-control" value={form.TelefonoEI} onChange={(e) => handleTelefonoChange(e.target.value)} required placeholder="3511234567" />
              </Field>
              <Field label="Barrio" className="col-md-4">
                <select className="form-select" value={form.Id_Barrio} onChange={(e) => updateForm('Id_Barrio', e.target.value)} required>
                  <option value="">Seleccione un barrio</option>
                  {barrios.map((barrio) => <option key={barrio.Id} value={barrio.Id}>{barrio.Barrio}</option>)}
                </select>
              </Field>
              <Field label="Email" className="col-md-4">
                <input type="email" className="form-control" value={form.EmailEI} onChange={(e) => updateForm('EmailEI', e.target.value)} required placeholder="contacto@empresa.com" />
              </Field>
              <div className="col-12 form-buttons justify-content-end">
                <button type="submit" className="btn-submit btn-sitmas-success py-2 shadow-sm">Guardar Origen</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(emptyOrigen)}>Limpiar</button>
              </div>
            </div>
          </form>
        </AccordionCard>
      </div>

      <AccordionCard title="Listado de Origenes">
        <div className="table-filter"><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar origenes..." /></div>
        <DataTable columns={['ID', 'Empresa / Institucion', 'Calle', 'Numero', 'Telefono', 'Barrio', 'Email', 'Acciones']} rows={filteredOrigenes} emptyText="No hay origenes para mostrar." renderRow={(origen) => (
          <tr key={origen.IdOrigen}>
            <td>{origen.IdOrigen}</td>
            <td>{origen.EmpresaInstitucion}</td>
            <td>{origen.CalleEI}</td>
            <td>{origen.NumeroEI}</td>
            <td>{origen.TelefonoEI}</td>
            <td>{origen.BarrioNombre}</td>
            <td>{origen.EmailEI}</td>
            <td className="table-actions">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditar(origen)}>Editar</button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget({ id: origen.IdOrigen })}>Eliminar</button>
            </td>
          </tr>
        )} />
      </AccordionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message="Esta seguro que desea eliminar este origen permanentemente?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmarEliminar}
      />
    </>
  );
}