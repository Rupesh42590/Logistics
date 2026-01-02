import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ZoneMap from '../components/ZoneMap';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('fleet');
  const [filter, setFilter] = useState('All Zones');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  
  // Data State
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
      if (!token) return;
      
      try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const [vehRes, ordRes, zoneRes] = await Promise.all([
              axios.get('http://localhost:8000/vehicles'),
              axios.get('http://localhost:8000/orders'),
              axios.get('http://localhost:8000/zones')
          ]);
          setVehicles(vehRes.data);
          setOrders(ordRes.data);
          setZones(zoneRes.data);
      } catch (err) {
          console.error("Failed to fetch admin data", err);
          if (err.response?.status === 401) {
              alert("Session expired. Please login again.");
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [token]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter Data
  const filteredVehicles = filter === 'All Zones' 
    ? vehicles 
    : vehicles.filter(v => v.zone?.name === filter);

  // Close dropdown when clicking outside (simple implementation utilizing conditional rendering but not precise click-away listener for speed)
  // Or just simpler logic: Toggle on click.

  // Calculate filtered stats
  const filteredVehicleStats = filteredVehicles.map(v => {
      const vOrders = orders.filter(o => o.assigned_vehicle_id === v.id);
      const currentWeight = vOrders.reduce((acc, o) => acc + o.weight_kg, 0);
      const currentVol = vOrders.reduce((acc, o) => acc + o.volume_m3, 0);
      
      const volUtil = (currentVol / v.max_volume_m3) * 100;
      const weightUtil = (currentWeight / v.max_weight_kg) * 100;
      const utilPct = Math.min(Math.max(volUtil, weightUtil), 100);
      
      return { ...v, currentWeight, currentVol, utilPct };
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
            <h1 className="page-title">
                {activeTab === 'fleet' ? 'Fleet Capacity Monitor' : 'Service Zone Manager'}
            </h1>
            <p className="page-subtitle">
                {activeTab === 'fleet' 
                    ? 'Real-time load tracking and zone distribution' 
                    : 'Manage geographical boundaries for vehicle assignments'
                }
            </p>
        </div>
        <div className="header-actions">
             {/* Tab Switcher acting as sub-nav */}
             <div className="tab-switcher">
                <button 
                    onClick={() => setActiveTab('fleet')}
                    className={`tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
                >
                    Fleet Monitor
                </button>
                <button 
                    onClick={() => setActiveTab('zones')}
                    className={`tab-btn ${activeTab === 'zones' ? 'active' : ''}`}
                >
                    Zone Manager
                </button>
                 <button 
                    onClick={() => setActiveTab('orders')}
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                >
                    Orders
                </button>
             </div>
             
             {activeTab === 'fleet' && (
                 <button className="btn btn-primary" onClick={() => setIsVehicleModalOpen(true)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Add Vehicle
                 </button>
             )}
        </div>
      </div>

      {activeTab === 'fleet' ? (
          <>
            {/* Filter Section using Dropdown */}
            <div className="filter-section">
                <div className="filter-dropdown">
                    <div 
                        className="filter-trigger"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <span>{filter}</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6"></path>
                        </svg>
                    </div>

                    {isFilterOpen && (
                        <div className="filter-menu">
                            <div 
                                className={`filter-item ${filter === 'All Zones' ? 'active' : ''}`}
                                onClick={() => { setFilter('All Zones'); setIsFilterOpen(false); }}
                            >
                                All Zones
                                {filter === 'All Zones' && <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            {zones.map(z => (
                                <div 
                                    key={z.id}
                                    className={`filter-item ${filter === z.name ? 'active' : ''}`}
                                    onClick={() => { setFilter(z.name); setIsFilterOpen(false); }}
                                >
                                    {z.name}
                                    {filter === z.name && <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="stats-grid">
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Displayed Vehicles</div>
                   <div className="stat-value">{filteredVehicles.length}</div>
               </div>
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Orders</div>
                   <div className="stat-value">{orders.length}</div>
               </div>
               <div className="card stat-card">
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Utilization Avg.</div>
                   <div className="stat-value">
                       {filteredVehicleStats.length > 0 ? (
                           (filteredVehicleStats.reduce((acc, v) => acc + v.utilPct, 0) / filteredVehicleStats.length).toFixed(1)
                       ) : '0.0'}%
                   </div>
               </div>
            </div>

            <FleetGrid vehicles={filteredVehicles} orders={orders} onUpdate={fetchData} />
          </>
      ) : activeTab === 'zones' ? (
          <ZoneManager />
      ) : (
          <OrderManager orders={orders} onUpdate={fetchData} />
      )}
      
      {isVehicleModalOpen && (
          <AddVehicleModal 
            onClose={() => setIsVehicleModalOpen(false)} 
            onSuccess={() => {
                setIsVehicleModalOpen(false);
                fetchData();
            }}
          />
      )}
    </div>
  );
}

function FleetGrid({ vehicles, orders, onUpdate }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  if (vehicles.length === 0) {
      return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles in fleet. Add one to get started.</div>;
  }

  // Calculate current loads for display
  const vehicleStats = vehicles.map(v => {
      const vOrders = orders.filter(o => o.assigned_vehicle_id === v.id);
      const currentWeight = vOrders.reduce((acc, o) => acc + o.weight_kg, 0);
      const currentVol = vOrders.reduce((acc, o) => acc + o.volume_m3, 0);
      
      const volUtil = (currentVol / v.max_volume_m3) * 100;
      const weightUtil = (currentWeight / v.max_weight_kg) * 100;
      const utilPct = Math.min(Math.max(volUtil, weightUtil), 100);
      
      return { ...v, currentWeight, currentVol, utilPct };
  });

  const avgUtil = vehicleStats.length > 0 
    ? (vehicleStats.reduce((acc, v) => acc + v.utilPct, 0) / vehicleStats.length).toFixed(1) 
    : '0.0';

  return (
    <>
     {/* Stats Summary - Now using data from FleetGrid calculation implicitly if we hoisted state, 
        but since FleetGrid is a child, we should perhaps move the calc up or just do a quick calc here for the prop.
        Actually, the parent passes vehicles and orders. Let's lift the calc or just do it in parent? 
        The prompt asked to fix it. The stats grid is in the PARENT component. 
        So I need to modify the PARENT component too. 
        For now, let's fix FleetGrid logic first, and I will fix the Parent logic in a separate MultiReplace or next step. 
        Wait, I can't easily fix the parent's "0%" from inside FleetGrid component code block if I am only targeting FleetGrid.
        
        Let's look at the file structure again.
        AdminDashboard (Parent) -> renders Stats Grid AND FleetGrid.
        FleetGrid calculates stats.
        I should move the calculation to the Parent or duplicate it. Moving to parent is cleaner.
     */}
    <div className="fleet-grid">
      {vehicleStats.map(v => (
        <div 
            key={v.id} 
            className="card card-hover vehicle-card" 
            onClick={() => setSelectedVehicle(v)}
        >
            {/* Header */}
            <div className="vehicle-header">
                <div className="vehicle-icon-wrapper">
                    <div className="vehicle-icon">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4 1l-2.7 5C.4 14 1 15 2 15v2c0 .6.4 1 1 1h2m9 0h6m-6 0c0 .6.4 1 1 1h2c.6 0 1-.4 1-1m-9 0H9m-4 0H4c-.6 0-1-.4-1-1v-2"/></svg>
                    </div>
                    <div className="vehicle-info">
                        <h3>{v.vehicle_number}</h3>
                        <p>Max: {v.max_volume_m3} m³</p>
                    </div>
                </div>
                <span className="badge vehicle-zone-badge">
                    {v.zone?.name || 'Unassigned'}
                </span>
            </div>

            {/* Utilization Bar */}
            <div className="utilization-section">
                <div className="utilization-header">
                    <span style={{ color: 'var(--text-muted)' }}>Utilization</span>
                    <span style={{ fontWeight: '700', color: v.utilPct > 90 ? 'var(--error)' : 'var(--success)' }}>
                        {v.utilPct.toFixed(1)}%
                    </span>
                </div>
                <div className="utilization-bar-bg">
                    <div 
                        className="utilization-bar-fill"
                        style={{ 
                            width: `${v.utilPct}%`, 
                            background: v.utilPct > 90 ? 'var(--error)' : 'var(--success)'
                        }}
                    ></div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="vehicle-footer">
                <span>{v.currentWeight} kg loaded</span>
                <span>{v.max_weight_kg} kg capacity</span>
            </div>
        </div>
      ))}
    </div>

    {selectedVehicle && (
        <VehicleDetailsModal 
            vehicle={selectedVehicle}
            orders={orders.filter(o => o.assigned_vehicle_id === selectedVehicle.id)}
            onClose={() => setSelectedVehicle(null)}
            onUpdate={onUpdate}
        />
    )}
    </>
  );
}

function VehicleDetailsModal({ vehicle, orders, onClose, onUpdate }) {
    const handleUnassign = async (orderId) => {
        if (!confirm("Are you sure you want to unassign this order?")) return;
        try {
            await axios.post(`http://localhost:8000/orders/${orderId}/unassign`);
            // alert("Order unassigned.");
            onUpdate(); // Refresh data, which should remove order from this modal's list automatically
        } catch (err) {
            console.error("Failed to unassign", err);
            alert("Failed to unassign order.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content-lg">
                <div className="modal-header">
                    <h3 className="modal-title">Vehicle {vehicle.vehicle_number}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>

                <div className="modal-stats-row">
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load</div>
                        <div style={{ fontWeight: '600' }}>{orders.length} Orders</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight</div>
                        <div style={{ fontWeight: '600' }}>{vehicle.currentWeight} / {vehicle.max_weight_kg} kg</div>
                    </div>
                    <div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume</div>
                        <div style={{ fontWeight: '600' }}>{vehicle.currentVol.toFixed(3)} / {vehicle.max_volume_m3} m³</div>
                    </div>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Assigned Shipments</h4>
                
                {orders.length === 0 ? (
                    <div className="table-empty" style={{ border: '1px dashed var(--border)', borderRadius: '0.5rem' }}>
                        No orders assigned to this vehicle.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead className="table-head">
                            <tr>
                                <th className="table-th">ID</th>
                                <th className="table-th">Item</th>
                                <th className="table-th">User</th>
                                <th className="table-th" style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id} className="table-td">
                                    <td style={{ padding: '0.75rem 0.5rem' }}>#{o.id}</td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>{o.item_name}</td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>User #{o.user_id}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleUnassign(o.id)}
                                            className="btn-unassign"
                                        >
                                            Unassign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn" style={{ border: '1px solid var(--border)' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

function AddVehicleModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({
        vehicle_number: '',
        max_volume_m3: '',
        max_weight_kg: '',
        zone_id: ''
    });
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:8000/zones')
            .then(res => {
                setZones(res.data);
                if (res.data.length > 0) {
                    setForm(f => ({ ...f, zone_id: res.data[0].id }));
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:8000/vehicles', {
                ...form,
                max_volume_m3: parseFloat(form.max_volume_m3),
                max_weight_kg: parseFloat(form.max_weight_kg),
                zone_id: form.zone_id ? parseInt(form.zone_id) : null
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to create vehicle", err);
            const msg = err.response?.data?.detail || "Failed to create vehicle";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Add New Vehicle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Vehicle Number</label>
                        <input 
                            required 
                            className="form-input" 
                            placeholder="KA-01-AB-1234"
                            value={form.vehicle_number}
                            onChange={e => setForm({...form, vehicle_number: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Volume (m³)</label>
                        <input 
                            required type="number" step="0.1" 
                            className="form-input"
                            value={form.max_volume_m3}
                            onChange={e => setForm({...form, max_volume_m3: e.target.value})}
                        />
                    </div>
                     <div className="form-group">
                        <label className="form-label">Max Weight (kg)</label>
                        <input 
                            required type="number" step="0.1" 
                            className="form-input"
                            value={form.max_weight_kg}
                            onChange={e => setForm({...form, max_weight_kg: e.target.value})}
                        />
                    </div>
                     <div className="form-group">
                        <label className="form-label">Service Zone</label>
                        <select 
                            className="form-input"
                            value={form.zone_id}
                            onChange={e => setForm({...form, zone_id: e.target.value})}
                        >
                            <option value="">Select Zone</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                            {loading ? 'Adding...' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ZoneManager() {
  const [zones, setZones] = useState([]);
  
  useEffect(() => {
      axios.get('http://localhost:8000/zones')
          .then(res => setZones(res.data))
          .catch(err => console.error(err));
  }, []);

  const handleCreated = async (geoJSON) => {
      // geoJSON.geometry.coordinates is [[[lng,lat],...]] for Polygon
      // We assume single polygon for now.
      // We need a name. Prompt for now.
      const name = prompt("Enter Name for this Zone:");
      if (!name) return;

      const coords = geoJSON.geometry.coordinates[0].map(pt => [pt[1], pt[0]]); // Swap to lat,lng
      
      try {
          const res = await axios.post('http://localhost:8000/zones', {
              name,
              coordinates: coords
          });
          setZones(prev => [...prev, res.data]);
      } catch (err) {
          console.error("Failed to create zone", err);
          alert("Failed to create zone");
      }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', height: '600px' }}>
        <div className="card" style={{ padding: '1rem', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Active Zones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {zones.map(z => (
                    <div key={z.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                        <div style={{ fontWeight: '600' }}>{z.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {z.id}</div>
                    </div>
                ))}
                {zones.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No zones created yet. Draw on map.</div>}
            </div>
        </div>
        <div className="card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
            <ZoneMap zones={zones} onCreated={handleCreated} />
        </div>
    </div>
  );
}

function OrderManager({ orders, onUpdate }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--background)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Order ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Weight / Vol</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Assigned To</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>#{o.id}</td>
                        <td style={{ padding: '1rem' }}>{o.item_name}</td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {o.weight_kg}kg <br/> {o.volume_m3.toFixed(3)}m³
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <span className={`badge ${o.status === 'ASSIGNED' ? 'badge-success' : 'badge-warning'}`}>
                                {o.status}
                            </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                            {o.assigned_vehicle_number || o.assigned_vehicle_id || '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {o.status === 'PENDING' && (
                                <button 
                                    className="btn-sm btn-primary"
                                    onClick={() => setSelectedOrder(o)}
                                >
                                    Assign
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                {orders.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td></tr>
                )}
            </tbody>
        </table>

        {selectedOrder && (
            <AssignVehicleModal 
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onSuccess={() => {
                    setSelectedOrder(null);
                    onUpdate();
                }}
            />
        )}
    </div>
  );
}

function AssignVehicleModal({ order, onClose, onSuccess }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehId, setSelectedVehId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:8000/orders/${order.id}/compatible-vehicles`)
            .then(res => {
                setVehicles(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [order.id]);

    const handleAssign = async () => {
        if (!selectedVehId) return;
        setSubmitting(true);
        try {
            await axios.post(`http://localhost:8000/orders/${order.id}/assign`, {
                vehicle_id: parseInt(selectedVehId)
            });
            alert("Order assigned successfully!");
            onSuccess();
        } catch (err) {
            console.error("Assignment failed", err);
            alert("Failed to assign order.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ 
                background: 'white', padding: '2rem', borderRadius: '1rem', width: '500px',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <h3 style={{ marginBottom: '1rem' }}>Assign Order #{order.id}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Select a compatible vehicle for <strong>{order.item_name}</strong> ({order.weight_kg}kg).
                </p>

                {loading ? (
                    <div>Finding compatible vehicles...</div>
                ) : vehicles.length === 0 ? (
                    <div className="alert alert-error">
                        No compatible vehicles found in the pickup zone with sufficient capacity.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vehicles.map(v => (
                            <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', background: selectedVehId == v.id ? '#f0f9ff' : 'white', borderColor: selectedVehId == v.id ? 'var(--primary)' : 'var(--border)' }}>
                                <input 
                                    type="radio" 
                                    name="vehicle" 
                                    value={v.id}
                                    checked={selectedVehId == v.id}
                                    onChange={(e) => setSelectedVehId(e.target.value)}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>{v.vehicle_number}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Max: {v.max_weight_kg}kg | {v.max_volume_m3}m³ (Zone: {v.zone_id})
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                    <button 
                        onClick={handleAssign} 
                        disabled={!selectedVehId || submitting} 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                    >
                        {submitting ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
