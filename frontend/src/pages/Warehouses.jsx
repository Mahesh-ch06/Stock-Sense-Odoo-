// Warehouses & Locations Management with Shadcn design system & ConfirmDialog
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import {
  Building2,
  MapPin,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWh, setSelectedWh] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Modals state
  const [showWhModal, setShowWhModal] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [whForm, setWhForm] = useState({ name: '', address: '' });
  const [whSaving, setWhSaving] = useState(false);

  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locForm, setLocForm] = useState({ name: '' });
  const [locSaving, setLocSaving] = useState(false);

  // Confirm delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, locId: null, loading: false });

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/warehouses');
      setWarehouses(data);
      if (selectedWh) {
        const stillExists = data.find((w) => w.id === selectedWh.id);
        if (stillExists) setSelectedWh(stillExists);
      }
    } catch (err) {
      console.error('Failed to load warehouses', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWh]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchLocations = useCallback(async (whId) => {
    setLocLoading(true);
    try {
      const { data } = await API.get(`/warehouses/${whId}/locations`);
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations', err);
    } finally {
      setLocLoading(false);
    }
  }, []);

  function handleSelectWarehouse(wh) {
    setSelectedWh(wh);
    fetchLocations(wh.id);
  }

  // Warehouse CRUD
  function openAddWh() {
    setEditingWh(null);
    setWhForm({ name: '', address: '' });
    setShowWhModal(true);
  }

  function openEditWh(wh) {
    setEditingWh(wh);
    setWhForm({ name: wh.name, address: wh.address || '' });
    setShowWhModal(true);
  }

  async function handleSaveWh(e) {
    e.preventDefault();
    setWhSaving(true);
    try {
      if (editingWh) {
        await API.patch(`/warehouses/${editingWh.id}`, whForm);
        setFeedback({ type: 'success', message: 'Warehouse updated successfully.' });
      } else {
        await API.post('/warehouses', whForm);
        setFeedback({ type: 'success', message: 'Warehouse facility created with default location.' });
      }
      setShowWhModal(false);
      fetchWarehouses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save warehouse.' });
    } finally {
      setWhSaving(false);
    }
  }

  // Location CRUD
  function openAddLoc() {
    setEditingLoc(null);
    setLocForm({ name: '' });
    setShowLocModal(true);
  }

  function openEditLoc(loc) {
    setEditingLoc(loc);
    setLocForm({ name: loc.name });
    setShowLocModal(true);
  }

  async function handleSaveLoc(e) {
    e.preventDefault();
    if (!selectedWh) return;
    setLocSaving(true);
    try {
      if (editingLoc) {
        await API.patch(`/warehouses/${selectedWh.id}/locations/${editingLoc.id}`, locForm);
        setFeedback({ type: 'success', message: 'Location bin updated.' });
      } else {
        await API.post(`/warehouses/${selectedWh.id}/locations`, locForm);
        setFeedback({ type: 'success', message: 'Location added to facility.' });
      }
      setShowLocModal(false);
      fetchLocations(selectedWh.id);
      fetchWarehouses();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save location.' });
    } finally {
      setLocSaving(false);
    }
  }

  async function executeDeleteLocation() {
    if (!selectedWh || !deleteDialog.locId) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await API.delete(`/warehouses/${selectedWh.id}/locations/${deleteDialog.locId}`);
      setFeedback({ type: 'success', message: 'Location deleted successfully.' });
      setDeleteDialog({ isOpen: false, locId: null, loading: false });
      fetchLocations(selectedWh.id);
      fetchWarehouses();
    } catch (err) {
      setDeleteDialog((d) => ({ ...d, loading: false }));
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Cannot delete location — verify if stock exists.',
      });
    }
  }

  const filtered = warehouses.filter((w) =>
    (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Warehouses">
      <PageHeader
        title="Warehouses & Storage Facilities"
        description="Configure physical distribution hubs, storage racks, and bin zones"
      >
        <Button id="add-warehouse-btn" onClick={openAddWh}>
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Warehouse</span>
        </Button>
      </PageHeader>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`mb-4 flex items-center justify-between p-3 rounded-lg border text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 280 }}>
          <span className="search-icon">
            <Search size={14} />
          </span>
          <input
            id="warehouse-search"
            placeholder="Search facility name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={fetchWarehouses}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </Button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Warehouse Table Card */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Building2 size={15} className="text-zinc-400" />
                Active Facilities ({filtered.length})
              </span>
              <span className="text-[11px] text-zinc-500">Click a row to manage zones</span>
            </div>

            <div className="table-wrap border-0 rounded-none shadow-none">
              <table>
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Address</th>
                    <th>Zones</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        <div className="empty-icon flex justify-center">
                          <Building2 size={32} className="text-zinc-600" />
                        </div>
                        <div className="empty-text">No warehouses configured yet</div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((w) => (
                    <tr
                      key={w.id}
                      className={`cursor-pointer transition-colors ${
                        selectedWh?.id === w.id ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/40'
                      }`}
                      onClick={() => handleSelectWarehouse(w)}
                    >
                      <td className="fw-600 text-head">
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300">
                            <Building2 size={13} />
                          </div>
                          <span>{w.name}</span>
                        </div>
                      </td>
                      <td className="text-muted text-xs truncate max-w-[140px]">{w.address || '—'}</td>
                      <td>
                        <span className="badge badge-draft text-[10.5px]">
                          <Layers size={10} className="mr-1" />
                          {w.location_count || 0}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectWarehouse(w)}
                            className="h-6 px-2 text-[11px]"
                          >
                            <span>Bins</span>
                            <ArrowRight size={11} />
                          </Button>
                          <button
                            className="btn-icon"
                            onClick={() => openEditWh(w)}
                            title="Edit Warehouse"
                            style={{ width: 26, height: 26 }}
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Locations Sub-Panel for Selected Warehouse */}
          {selectedWh ? (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>Locations in {selectedWh.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {selectedWh.address || 'Central Facility'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    id="add-location-btn"
                    size="sm"
                    onClick={openAddLoc}
                    className="h-7 text-xs"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Add Bin</span>
                  </Button>
                  <button
                    className="btn-icon"
                    onClick={() => setSelectedWh(null)}
                    title="Close locations panel"
                    style={{ width: 28, height: 28 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {locLoading && <div className="spinner-page" />}

              {!locLoading && (
                <div className="table-wrap border-0 rounded-none shadow-none">
                  <table>
                    <thead>
                      <tr>
                        <th>Storage Bin / Zone</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.length === 0 && (
                        <tr>
                          <td colSpan={3} className="empty-state">
                            <div className="empty-icon flex justify-center">
                              <MapPin size={28} className="text-zinc-600" />
                            </div>
                            <div className="empty-text">No location bins configured yet</div>
                          </td>
                        </tr>
                      )}
                      {locations.map((loc) => (
                        <tr key={loc.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="fw-600 text-head">
                            <div className="flex items-center gap-2">
                              <MapPin size={13} className="text-zinc-500 shrink-0" />
                              <span>{loc.name}</span>
                            </div>
                          </td>
                          <td className="text-muted text-xs">
                            {loc.created_at ? new Date(loc.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div className="td-actions">
                              <button
                                className="btn-icon"
                                onClick={() => openEditLoc(loc)}
                                title="Edit Location Name"
                                style={{ width: 26, height: 26 }}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => setDeleteDialog({ isOpen: true, locId: loc.id, loading: false })}
                                title="Delete Location"
                                style={{ width: 26, height: 26, color: 'var(--rose)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                <MapPin size={18} />
              </div>
              <div className="text-xs font-semibold text-zinc-300">No Warehouse Selected</div>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                Select a warehouse facility from the table on the left to inspect, create, or modify its internal storage aisles and racks.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Modal */}
      {showWhModal && (
        <div className="modal-overlay" onClick={() => setShowWhModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingWh ? 'Edit Facility Details' : 'Add Storage Facility'}
              </div>
              <button className="btn-icon" onClick={() => setShowWhModal(false)} style={{ width: 26, height: 26 }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveWh}>
              <div className="space-y-3.5 mb-5">
                <div className="form-group">
                  <label className="form-label">Facility / Warehouse Name *</label>
                  <input
                    id="warehouse-name"
                    className="form-control"
                    placeholder="e.g. Central Logistics Hub"
                    value={whForm.name}
                    onChange={(e) => setWhForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input
                    id="warehouse-address"
                    className="form-control"
                    placeholder="e.g. 100 Industrial Parkway, Sector 4"
                    value={whForm.address}
                    onChange={(e) => setWhForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowWhModal(false)}>
                  Cancel
                </Button>
                <Button id="warehouse-save-btn" type="submit" disabled={whSaving}>
                  {whSaving ? 'Saving…' : editingWh ? 'Save Changes' : 'Create Warehouse'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocModal && (
        <div className="modal-overlay" onClick={() => setShowLocModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingLoc ? 'Edit Bin Name' : `Add Bin to ${selectedWh?.name}`}
              </div>
              <button className="btn-icon" onClick={() => setShowLocModal(false)} style={{ width: 26, height: 26 }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveLoc}>
              <div className="space-y-3.5 mb-5">
                <div className="form-group">
                  <label className="form-label">Storage Bin / Aisle / Zone Name *</label>
                  <input
                    id="location-name"
                    className="form-control"
                    placeholder="e.g. Aisle 3 - Pallet Rack B"
                    value={locForm.name}
                    onChange={(e) => setLocForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowLocModal(false)}>
                  Cancel
                </Button>
                <Button id="location-save-btn" type="submit" disabled={locSaving}>
                  {locSaving ? 'Saving…' : editingLoc ? 'Save Changes' : 'Create Location'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Storage Location?"
        description="Are you sure you want to remove this storage location? If active inventory exists at this location, deletion will be blocked."
        confirmLabel="Delete Location"
        loading={deleteDialog.loading}
        onConfirm={executeDeleteLocation}
        onCancel={() => setDeleteDialog({ isOpen: false, locId: null, loading: false })}
      />
    </Layout>
  );
}
