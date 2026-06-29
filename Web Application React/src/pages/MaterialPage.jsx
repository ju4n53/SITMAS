import { useEffect, useMemo, useRef, useState } from 'react';
import AccordionCard from '../components/AccordionCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import Field from '../components/Field.jsx';
import { filterRows } from '../utils/filterRows.js';
import {
  borrarSubtipoMaterial,
  borrarTipoMaterial,
  guardarSubtipoMaterial,
  guardarTipoMaterial,
  listarSubtiposMaterial,
  listarTiposMaterial
} from '../services/materialService.js';

const emptyTipo = { id: '0', TipoMaterial: '' };
const emptySubtipo = { id: '0', Id_Tipo_Material: '', Subtipo: '' };

export default function MaterialPage() {
  const [tipoForm, setTipoForm] = useState(emptyTipo);
  const [subtipoForm, setSubtipoForm] = useState(emptySubtipo);
  const [tipos, setTipos] = useState([]);
  const [subtipos, setSubtipos] = useState([]);
  const [filterTipos, setFilterTipos] = useState('');
  const [filterSubtipos, setFilterSubtipos] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tipoOpen, setTipoOpen] = useState(false);
  const [subtipoOpen, setSubtipoOpen] = useState(false);
  const tipoFormRef = useRef(null);
  const subtipoFormRef = useRef(null);

  async function cargarDatos() {
    setLoading(true);
    setMessage('');
    try {
      const [tiposData, subtiposData] = await Promise.all([
        listarTiposMaterial(),
        listarSubtiposMaterial()
      ]);
      setTipos(tiposData || []);
      setSubtipos(subtiposData || []);
    } catch (error) {
      setMessage(`No se pudieron cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredTipos = useMemo(() => filterRows(tipos, filterTipos), [tipos, filterTipos]);
  const subtiposConTipo = useMemo(() => subtipos.map((subtipo) => ({
    ...subtipo,
    TipoMaterialNombre: tipos.find((tipo) => Number(tipo.IdTipoMaterial) === Number(subtipo.Id_Tipo_Material))?.TipoMaterial || 'N/A'
  })), [subtipos, tipos]);
  const filteredSubtipos = useMemo(() => filterRows(subtiposConTipo, filterSubtipos), [subtiposConTipo, filterSubtipos]);

  async function handleGuardarTipo(event) {
    event.preventDefault();
    setMessage('');
    try {
      await guardarTipoMaterial(tipoForm.id, { TipoMaterial: tipoForm.TipoMaterial });
      setTipoForm(emptyTipo);
      await cargarDatos();
      setMessage('Material guardado correctamente.');
    } catch (error) {
      setMessage(`Error al guardar tipo: ${error.message}`);
    }
  }

  async function handleGuardarSubtipo(event) {
    event.preventDefault();
    setMessage('');
    try {
      await guardarSubtipoMaterial(subtipoForm.id, {
        Id_Tipo_Material: subtipoForm.Id_Tipo_Material,
        Subtipo: subtipoForm.Subtipo
      });
      setSubtipoForm(emptySubtipo);
      await cargarDatos();
      setMessage('Subtipo de material guardado correctamente.');
    } catch (error) {
      setMessage(`Error al guardar subtipo: ${error.message}`);
    }
  }

  async function confirmarEliminar() {
    if (!deleteTarget) return;

    // Validación: Verificar si el tipo tiene subtipos antes de borrar
    if (deleteTarget.kind === 'tipo') {
      const tieneSubtipos = subtipos.some(s => Number(s.Id_Tipo_Material) === Number(deleteTarget.id));
      if (tieneSubtipos) {
        setMessage('Recuerda: primero debes borrar los subtipos de materiales que se encuentran dentro de esta categoria.');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll automático hacia arriba
        setDeleteTarget(null);
        return;
      }
    }

    setMessage('');
    try {
      if (deleteTarget.kind === 'tipo') {
        await borrarTipoMaterial(deleteTarget.id);
        await cargarDatos();
        setMessage('Tipo de material eliminado correctamente.');
      } else {
        await borrarSubtipoMaterial(deleteTarget.id);
        await cargarDatos();
        setMessage('Subtipo de material eliminado correctamente.');
      }
    } catch (error) {
      setMessage(`Error al eliminar ${deleteTarget.label}: ${error.message}`);
    } finally {
      setDeleteTarget(null);
    }
  }

  function scrollToForm(ref) {
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleEditarTipo(tipo) {
    setTipoForm({ id: String(tipo.IdTipoMaterial), TipoMaterial: tipo.TipoMaterial || '' });
    setTipoOpen(true);
    scrollToForm(tipoFormRef);
  }

  function handleEditarSubtipo(subtipo) {
    setSubtipoForm({
      id: String(subtipo.IdSubtipoM),
      Id_Tipo_Material: String(subtipo.Id_Tipo_Material || ''),
      Subtipo: subtipo.Subtipo || ''
    });
    setSubtipoOpen(true);
    scrollToForm(subtipoFormRef);
  }

  return (
    <>
      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div className="alert alert-secondary">Cargando datos...</div>}

      <div ref={tipoFormRef} className="edit-scroll-target">
        <AccordionCard title="Registrar Tipo de Material" open={tipoOpen} onOpenChange={setTipoOpen}>
        <form onSubmit={handleGuardarTipo}>
          <input type="hidden" value={tipoForm.id} readOnly />
          <div className="row g-3">
            <Field label="Nombre del Tipo" className="col-md-6">
              <input className="form-control" value={tipoForm.TipoMaterial} onChange={(e) => setTipoForm((current) => ({ ...current, TipoMaterial: e.target.value }))} required />
            </Field>
            <div className="col-md-6 d-flex align-items-end gap-2">
              <button type="submit" className="btn-submit btn-sitmas-success py-2 shadow-sm">Guardar Tipo</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setTipoForm(emptyTipo)}>Limpiar</button>
            </div>
          </div>
        </form>
        </AccordionCard>
      </div>

      <div ref={subtipoFormRef} className="edit-scroll-target">
        <AccordionCard title="Registrar Subtipo de Material" open={subtipoOpen} onOpenChange={setSubtipoOpen}>
        <form onSubmit={handleGuardarSubtipo}>
          <input type="hidden" value={subtipoForm.id} readOnly />
          <div className="row g-3">
            <Field label="Tipo al que pertenece" className="col-md-6">
              <select className="form-select" value={subtipoForm.Id_Tipo_Material} onChange={(e) => setSubtipoForm((current) => ({ ...current, Id_Tipo_Material: e.target.value }))} required>
                <option value="">Seleccione Tipo</option>
                {tipos.map((tipo) => <option key={tipo.IdTipoMaterial} value={tipo.IdTipoMaterial}>{tipo.TipoMaterial}</option>)}
              </select>
            </Field>
            <Field label="Nombre del Subtipo" className="col-md-6">
              <input className="form-control" value={subtipoForm.Subtipo} onChange={(e) => setSubtipoForm((current) => ({ ...current, Subtipo: e.target.value }))} required />
            </Field>
            <div className="col-12 form-buttons">
              <button type="submit" className="btn-submit btn-sitmas-success py-2 shadow-sm">Guardar Subtipo</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setSubtipoForm(emptySubtipo)}>Limpiar</button>
            </div>
          </div>
        </form>
        </AccordionCard>
      </div>

      <AccordionCard title="Listado de Tipos de Material">
        <div className="table-filter"><input value={filterTipos} onChange={(e) => setFilterTipos(e.target.value)} placeholder="Filtrar tipos..." /></div>
        <DataTable columns={['ID', 'Nombre', 'Acciones']} rows={filteredTipos} emptyText="No hay tipos de material para mostrar." renderRow={(tipo) => (
          <tr key={tipo.IdTipoMaterial}>
            <td>{tipo.IdTipoMaterial}</td>
            <td>{tipo.TipoMaterial}</td>
            <td className="table-actions">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditarTipo(tipo)}>Editar</button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget({ kind: 'tipo', id: tipo.IdTipoMaterial, label: 'tipo de material' })}>Eliminar</button>
            </td>
          </tr>
        )} />
      </AccordionCard>

      <AccordionCard title="Listado de Subtipos de Material">
        <div className="table-filter"><input value={filterSubtipos} onChange={(e) => setFilterSubtipos(e.target.value)} placeholder="Filtrar subtipos..." /></div>
        <DataTable columns={['ID', 'Tipo', 'Subtipo', 'Acciones']} rows={filteredSubtipos} emptyText="No hay subtipos de material para mostrar." renderRow={(subtipo) => (
          <tr key={subtipo.IdSubtipoM}>
            <td>{subtipo.IdSubtipoM}</td>
            <td>{subtipo.TipoMaterialNombre}</td>
            <td>{subtipo.Subtipo}</td>
            <td className="table-actions">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditarSubtipo(subtipo)}>Editar</button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget({ kind: 'subtipo', id: subtipo.IdSubtipoM, label: 'subtipo de material' })}>Eliminar</button>
            </td>
          </tr>
        )} />
      </AccordionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Esta seguro que desea eliminar este ${deleteTarget?.label || 'registro'} permanentemente?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmarEliminar}
      />
    </>
  );
}