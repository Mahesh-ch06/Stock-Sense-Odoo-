// Warehouses & Locations Management
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWh, setSelectedWh] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);

  // Modals state
  const [showWhModal, setShowWhModal] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [whForm, setWhForm] = useState({ name: '', address: '' });
  const [whSaving, setWhSaving] = useState(false);

  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [locForm, setLocForm] = useState({ name: '' });
  const [locSaving, setLocSaving] = useState(false);

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
      } else {
        await API.post('/warehouses', whForm);
      }
      setShowWhModal(false);
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save warehouse.');
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
      } else {
        await API.post(`/warehouses/${selectedWh.id}/locations`, locForm);
      }
      setShowLocModal(false);
      fetchLocations(selectedWh.id);
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save location.');
    } finally {
      setLocSaving(false);
    }
  }

  async function handleDeleteLoc(locId) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await API.delete(`/warehouses/${selectedWh.id}/locations/${locId}`);
      fetchLocations(selectedWh.id);
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot delete location.');
    }
  }

  const filtered = warehouses.filter((w) =>
    (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Warehouses">
      <div className="page-header">
        <div>
          <div className="page-title">Warehouses & Locations</div>
          <div className="page-sub">Manage facilities, storage zones, and internal locations</div>
        </div>
        <button id="add-warehouse-btn" className="btn btn-primary" onClick={openAddWh}>
          ＋ Add Warehouse
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <span className="search-icon">🔍</span>
          <input
            id="warehouse-search"
            placeholder="Search warehouse name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchWarehouses}>
          ↻ Refresh
        </button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedWh ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* Warehouse Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fw-600 text-head" style={{ fontSize: 15 }}>Warehouses ({filtered.length})</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Locations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        <div className="empty-icon">🏢</div>
                        <div className="empty-text">No warehouses found</div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((w) => (
                    <tr
                      key={w.id}
                      style={{
                        cursor: 'pointer',
                        background: selectedWh?.id === w.id ? 'var(--bg-hover)' : undefined,
                      }}
                      onClick={() => handleSelectWarehouse(w)}
                    >
                      <td className="fw-600 text-head">
                        <div className="flex-center" style={{ gap: 8, justifyContent: 'flex-start' }}>
                          <span>🏢</span>
                          <span>{w.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{w.address || '—'}</td>
                      <td>
                        <span className="badge badge-draft" style={{ fontSize: 12 }}>
                          {w.location_count || 0} locations
                        </span>
                      </td>
                      <td>
                        <div className="td-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleSelectWarehouse(w)}
                            style={{ fontSize: 11 }}
                          >
                            Locations →
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => openEditWh(w)}
                            title="Edit Warehouse"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Locations Panel for Selected Warehouse */}
          {selectedWh && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div className="fw-600 text-head" style={{ fontSize: 15 }}>
                    Locations in {selectedWh.name}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {selectedWh.address || 'No address set'}
                  </div>
                </div>
                <div className="flex-center" style={{ gap: 8 }}>
                  <button
                    id="add-location-btn"
                    className="btn btn-primary btn-sm"
                    onClick={openAddLoc}
                  >
                    ＋ Add Location
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => setSelectedWh(null)}
                    title="Close locations panel"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {locLoading && <div className="spinner-page" />}

              {!locLoading && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Location Name</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.length === 0 && (
                        <tr>
                          <td colSpan={3} className="empty-state">
                            <div className="empty-icon">📍</div>
                            <div className="empty-text">No locations configured for this warehouse</div>
                          </td>
                        </tr>
                      )}
                      {locations.map((loc) => (
                        <tr key={loc.id}>
                          <td className="fw-600 text-head">
                            <div className="flex-center" style={{ gap: 8, justifyContent: 'flex-start' }}>
                              <span>📍</span>
                              <span>{loc.name}</span>
                            </div>
                          </td>
                          <td className="text-muted" style={{ fontSize: 12 }}>
                            {loc.created_at ? new Date(loc.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div className="td-actions">
                              <button
                                className="btn-icon"
                                onClick={() => openEditLoc(loc)}
                                title="Edit Location"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => handleDeleteLoc(loc.id)}
                                title="Delete Location"
                                style={{ color: 'var(--red)' }}
                              >
                                🗑️
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
          )}
        </div>
      )}

      {/* Warehouse Modal */}
      {showWhModal && (
        <div className="modal-overlay" onClick={() => setShowWhModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingWh ? 'Edit Warehouse' : 'Add Warehouse'}
              </div>
              <button className="btn-icon" onClick={() => setShowWhModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveWh}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Warehouse Name *</label>
                  <input
                    id="warehouse-name"
                    className="form-control"
                    placeholder="e.g. Central Hub or Main Warehouse"
                    value={whForm.name}
                    onChange={(e) => setWhForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address / Notes</label>
                  <input
                    id="warehouse-address"
                    className="form-control"
                    placeholder="e.g. 100 Industrial Parkway, Section B"
                    value={whForm.address}
                    onChange={(e) => setWhForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowWhModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="warehouse-save-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={whSaving}
                >
                  {whSaving ? (
                    <>
                      <span className="spinner" /> Saving…
                    </>
                  ) : editingWh ? (
                    'Update'
                  ) : (
                    'Create Warehouse'
                  )}
                </button>
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
                {editingLoc ? 'Edit Location' : `Add Location to ${selectedWh?.name}`}
              </div>
              <button className="btn-icon" onClick={() => setShowLocModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveLoc}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Location / Zone / Bin Name *</label>
                  <input
                    id="location-name"
                    className="form-control"
                    placeholder="e.g. Aisle 3 - Shelf B or Cold Storage"
                    value={locForm.name}
                    onChange={(e) => setLocForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowLocModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="location-save-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={locSaving}
                >
                  {locSaving ? (
                    <>
                      <span className="spinner" /> Saving…
                    </>
                  ) : editingLoc ? (
                    'Update'
                  ) : (
                    'Add Location'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
