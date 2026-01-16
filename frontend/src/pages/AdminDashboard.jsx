import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ZoneMap from '../components/ZoneMap';
import ConfirmModal from '../components/ConfirmModal';
import { useModal } from '../context/ModalContext';
import './AdminDashboard.css';
import '../mobile-overrides.css';



export default function AdminDashboard() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize tab from URL or default to 'fleet'
  const activeTab = searchParams.get('tab') || 'fleet';
  
  const setActiveTab = (tab) => {
      setSearchParams({ tab });
  };

  const [filter, setFilter] = useState('All Zones');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  
  // Data State
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
      if (!token) return;
      
      try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const [vehRes, ordRes, zoneRes, drvRes] = await Promise.all([
              axios.get('http://localhost:8000/vehicles'),
              axios.get('http://localhost:8000/orders'),
              axios.get('http://localhost:8000/zones'),
              axios.get('http://localhost:8000/drivers')
          ]);
          setVehicles(vehRes.data);
          setOrders(ordRes.data);
          setZones(zoneRes.data);
          setDrivers(drvRes.data);
      } catch (err) {
          console.error("Failed to fetch admin data", err);
          if (err.response?.status === 401) {
              // alert("Session expired. Please login again.");
              // Using console instead of alert for now or can use showAlert if we hoist it. 
              // Since this is inside fetchData, we need access to showAlert from component scope.
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
            <h1 
                className="page-title" 
                onClick={() => setActiveTab('fleet')}
                style={{ cursor: 'pointer' }}
            >
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
                <button 
                    onClick={() => setActiveTab('drivers')}
                    className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
                >
                    Drivers
                </button>
             </div>
             
             {activeTab === 'fleet' && (
                 <button className="btn btn-primary" onClick={() => setIsVehicleModalOpen(true)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Add Vehicle
                 </button>
             )}
             {activeTab === 'drivers' && (
                 <button className="btn btn-primary" onClick={() => setIsDriverModalOpen(true)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Add Driver
                 </button>
             )}
        </div>
      </div>
      
      {/* Mobile FAB for Add Vehicle */}
      {activeTab === 'fleet' && (
          <button 
            className="fab-btn"
            onClick={() => setIsVehicleModalOpen(true)}
            aria-label="Add Vehicle"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
      )}

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
      ) : activeTab === 'drivers' ? (
          <DriverManager drivers={drivers} onUpdate={fetchData} />
      ) : (
          <OrderManager orders={orders} onUpdate={fetchData} />
      )}
      
      {isVehicleModalOpen && (
          <AddVehicleModal 
            drivers={drivers}
            zones={zones} 
            onClose={() => setIsVehicleModalOpen(false)} 
            onSuccess={() => {
                setIsVehicleModalOpen(false);
                fetchData();
            }}
          />
      )}
      
      {isDriverModalOpen && (
          <AddDriverModal 
            onClose={() => setIsDriverModalOpen(false)} 
            onSuccess={() => {
                setIsDriverModalOpen(false);
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
      
      return { ...v, currentWeight, currentVol, utilPct, volUtil, weightUtil };
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
            {/* Utilization Bars */}
            <div className="utilization-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Weight */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Weight</span>
                        <span style={{ fontWeight: '600' }}>{v.weightUtil.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${Math.min(v.weightUtil, 100)}%`, 
                            background: v.weightUtil > 90 ? 'var(--error)' : v.weightUtil > 70 ? '#f59e0b' : 'var(--success)',
                            height: '100%',
                            transition: 'width 0.3s ease, background-color 0.3s ease'
                        }}></div>
                    </div>
                </div>
                {/* Volume */}
                <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Volume</span>
                        <span style={{ fontWeight: '600' }}>{v.volUtil.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${Math.min(v.volUtil, 100)}%`, 
                            background: v.volUtil > 90 ? 'var(--error)' : v.volUtil > 70 ? '#f59e0b' : 'var(--success)', 
                            height: '100%',
                            transition: 'width 0.3s ease, background-color 0.3s ease'
                         }}></div>
                    </div>
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



// ... (in VehicleDetailsModal)
function VehicleDetailsModal({ vehicle, orders, onClose, onUpdate }) {
    const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    const openConfirm = (title, message, action) => {
        setConfirmState({ open: true, title, message, action });
    };

    const handleConfirm = async () => {
        if (!confirmState.action) return;
        
        setActionLoading(true);
        try {
            await confirmState.action();
            // Success
        } catch (err) {
            console.error("Confirm action failed:", err);
        } finally {
            setActionLoading(false);
            setConfirmState({ ...confirmState, open: false });
        }
    };

    const handleUnassign = (orderId) => {
        openConfirm(
            "Unassign Order",
            "Are you sure you want to unassign this order?",
            async () => {
                await axios.post(`http://localhost:8000/orders/${orderId}/unassign`);
                onUpdate();
            }
        );
    };

    const handleDeleteVehicle = () => {
        if (orders.length > 0) {
            openConfirm(
                "Cannot Delete Vehicle",
                "This vehicle has assigned orders. Please unassign all orders before deleting the vehicle.",
                null
            );
            return;
        }

         openConfirm(
            "Delete Vehicle",
            "Are you sure you want to DELETE this vehicle? This action cannot be undone.",
            async () => {
                await axios.delete(`http://localhost:8000/vehicles/${vehicle.id}`);
                onClose();
                onUpdate(); 
            }
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content-lg">
                <div className="modal-header">
                    <h3 className="modal-title">Vehicle {vehicle.vehicle_number}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                
                {/* Stats Row */}
                <div className="modal-stats-row" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load</div>
                        <div style={{ fontWeight: '600' }}>{orders.length} Orders</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight</div>
                        <div style={{ fontWeight: '600' }}>{vehicle.currentWeight} / {vehicle.max_weight_kg} kg</div>
                        <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', width: '100px' }}>
                            <div style={{ width: `${Math.min(vehicle.weightUtil, 100)}%`, background: 'var(--primary)', height: '100%', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{vehicle.weightUtil.toFixed(1)}%</div>
                    </div>
                    <div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume</div>
                        <div style={{ fontWeight: '600' }}>{vehicle.currentVol < 0.001 ? vehicle.currentVol.toFixed(6) : vehicle.currentVol.toFixed(3)} / {vehicle.max_volume_m3} m³</div>
                         <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', width: '100px' }}>
                            <div style={{ width: `${Math.min(vehicle.volUtil, 100)}%`, background: 'var(--secondary)', height: '100%', borderRadius: '2px' }}></div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{vehicle.volUtil.toFixed(1)}%</div>
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

                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                    <button 
                        onClick={handleDeleteVehicle}
                        className="btn" 
                        style={{ color: 'var(--error)', borderColor: 'var(--border)' }}
                    >
                        Delete Vehicle
                    </button>
                    <button onClick={onClose} className="btn" style={{ border: '1px solid var(--border)' }}>Close</button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={handleConfirm}
                onClose={() => setConfirmState({ ...confirmState, open: false })}
                loading={actionLoading}
            />
        </div>
    );
}
// ...
// ... in ZoneManager
function ZoneManager() {
  const [zones, setZones] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', action: null });
  const [zoneModal, setZoneModal] = useState({ open: false, geoJson: null, cb: null });
  
  useEffect(() => {
      axios.get('http://localhost:8000/zones')
          .then(res => setZones(res.data))
          .catch(err => console.error(err));
  }, []);

  /* 
   We need to move useModal hook inside the component.
   */
  const { showAlert } = useModal();
  
  const handleCreated = (geoJSON, cb) => {
      setZoneModal({ open: true, geoJson: geoJSON, cb });
  };

  const handleDeleteZone = (zone) => {
      setConfirmState({
          open: true,
          title: "Delete Zone",
          message: `Are you sure you want to delete zone "${zone.name}"?`,
          action: async () => {
              await axios.delete(`http://localhost:8000/zones/${zone.id}`);
              setZones(prev => prev.filter(item => item.id !== zone.id));
          }
      });
  };

  return (
    <div className="zone-manager-layout">
        <div className="card zone-list">
            <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Active Zones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {zones.map(z => (
                    <div key={z.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>{z.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {z.id}</div>
                        </div>
                        <button 
                            className="btn-icon-danger"
                            title="Delete Zone"
                            onClick={() => handleDeleteZone(z)}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                ))}
                {zones.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No zones created yet. Draw on map.</div>}
            </div>
        </div>
        <div className="card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
            <ZoneMap zones={zones} onCreated={handleCreated} />
        </div>

        <ConfirmModal
            isOpen={confirmState.open}
            title={confirmState.title}
            message={confirmState.message}
            onConfirm={async () => {
                if (confirmState.action) {
                    try {
                        await confirmState.action();
                        setConfirmState({ ...confirmState, open: false });
                    } catch (err) {
                        console.error("Zone action failed", err);
                    }
                }
            }}
            onClose={() => setConfirmState({ ...confirmState, open: false })}
        />

        {zoneModal.open && (
            <AddZoneModal
                geoJson={zoneModal.geoJson}
                onClose={() => {
                    setZoneModal({ open: false, geoJson: null, cb: null });
                }}
                onSuccess={(newZone) => {
                    setZones(prev => [...prev, newZone]);
                    if (zoneModal.cb) zoneModal.cb(); // Clear map state
                    setZoneModal({ open: false, geoJson: null, cb: null });
                }}
            />
        )}
    </div>
  );
}

function OrderManager({ orders, onUpdate }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="card table-wrapper">
        <table className="data-table">
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
                            {o.weight_kg}kg <br/> {o.volume_m3 < 0.001 ? o.volume_m3.toFixed(6) : o.volume_m3.toFixed(3)}m³
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <span className={`badge ${
                                o.status === 'SHIPPED' ? 'badge-success' : 'badge-warning'}`}>
                                {o.status}
                            </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                            {o.assigned_vehicle_number || o.assigned_vehicle_id || '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {o.status === 'PENDING' && (
                                <button 
                                    className="btn-sm"
                                    style={{ 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        padding: '0.4rem 0.8rem', 
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => setSelectedOrder(o)}
                                >
                                    Assign Vehicle
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
    const { showAlert } = useModal();
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
            showAlert("Success", "Order assigned successfully!", onSuccess);
        } catch (err) {
            console.error("Assignment failed", err);
            showAlert("Error", "Failed to assign order.");
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

function AddVehicleModal({ onClose, onSuccess, drivers = [], zones = [] }) {
    const { token } = useAuth();
    const { showAlert } = useModal();
     const [formData, setFormData] = useState({
        vehicle_number: '',
        max_weight_kg: '',
        max_volume_m3: '',
        zone_id: '',
        driver_id: ''
    });



    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        const vNumRegex = /^[a-zA-Z0-9-]+$/;
        if (!vNumRegex.test(formData.vehicle_number)) {
            showAlert("Invalid Input", "Vehicle Number must be alphanumeric (hyphens allowed).");
            return;
        }

        if (Number(formData.max_weight_kg) <= 0 || Number(formData.max_volume_m3) <= 0) {
            showAlert("Invalid Input", "Weight and Volume must be positive numbers.");
            return;
        }

        if (!formData.zone_id) {
            showAlert("Missing Input", "Please select a Zone.");
            return;
        }

        try {
            await axios.post('http://localhost:8000/vehicles', {
                ...formData,
                max_weight_kg: parseFloat(formData.max_weight_kg),
                max_volume_m3: parseFloat(formData.max_volume_m3),
                zone_id: parseInt(formData.zone_id),
                driver_id: formData.driver_id ? parseInt(formData.driver_id) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to add vehicle", err);
            showAlert("Error", err.response?.data?.detail || "Failed to add vehicle");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Add New Vehicle</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Vehicle Number</label>
                        <input 
                            className="form-input" 
                            value={formData.vehicle_number}
                            onChange={e => setFormData({...formData, vehicle_number: e.target.value})}
                            placeholder="e.g. TS-09-AB-1234"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Assigned Driver</label>
                        <select 
                            className="form-select"
                            value={formData.driver_id}
                            onChange={e => setFormData({...formData, driver_id: e.target.value})}
                        >
                            <option value="">Unassigned (Select Driver later)</option>
                            {drivers && drivers.filter(d => d.role === 'DRIVER').map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Weight (kg)</label>
                        <input 
                            type="number"
                            className="form-input" 
                            value={formData.max_weight_kg}
                            onChange={e => setFormData({...formData, max_weight_kg: e.target.value})}
                            placeholder="e.g. 1000"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Volume (m³)</label>
                        <input 
                            type="number"
                            className="form-input" 
                            value={formData.max_volume_m3}
                            onChange={e => setFormData({...formData, max_volume_m3: e.target.value})}
                            placeholder="e.g. 15"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Assigned Zone</label>
                        <select 
                            className="form-select"
                            value={formData.zone_id}
                            onChange={e => setFormData({...formData, zone_id: e.target.value})}
                            required
                        >
                            <option value="">Select Zone...</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Vehicle</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddZoneModal({ geoJson, onClose, onSuccess }) {
    const { showAlert } = useModal();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showAlert("Missing Input", "Please enter a Zone Name.");
            return;
        }

        setLoading(true);
        // Prepare coordinates: GeoJSON is [lng, lat], Backend expects [lat, lng]
        const coords = geoJson.geometry.coordinates[0].map(pt => [pt[1], pt[0]]);

        try {
            const res = await axios.post('http://localhost:8000/zones', {
                name,
                coordinates: coords
            });
            onSuccess(res.data);
        } catch (err) {
            console.error("Failed to create zone", err);
            showAlert("Error", "Failed to create zone");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Name New Zone</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Zone Name</label>
                        <input 
                            className="form-input" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. North Hyderabad"
                            autoFocus
                        />
                    </div>
                     <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Create Zone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}


function DriverManager({ drivers, onUpdate }) {
    const { showAlert } = useModal();
    const [deletingDriver, setDeletingDriver] = useState(null);

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:8000/drivers/${deletingDriver.id}`);
            showAlert("Success", "Driver account deleted successfully.");
            onUpdate();
            setDeletingDriver(null);
        } catch (err) {
            console.error(err);
            showAlert("Error", err.response?.data?.detail || "Failed to delete driver");
        }
    };

    return (
        <div className="card table-wrapper">
             <table className="data-table">
                <thead className="table-head">
                    <tr>
                        <th className="table-th">Name</th>
                        <th className="table-th">Vehicle</th>
                        <th className="table-th">Access Key</th>
                        <th className="table-th">ID</th>
                        <th className="table-th">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.map(d => (
                        <tr key={d.id} className="table-td">
                            <td style={{ padding: '1rem', fontWeight: '500' }}>{d.name || '-'}</td>
                            <td style={{ padding: '1rem' }}>{d.vehicle_number || '-'}</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '200px', wordBreak: 'break-all' }}>
                                {d.access_key || '-'}
                            </td>
                             <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{d.id}</td>
                             <td style={{ padding: '1rem' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ color: '#ef4444', borderColor: 'transparent', padding: '0.25rem 0.5rem' }}
                                    onClick={() => setDeletingDriver(d)}
                                >
                                    Delete
                                </button>
                             </td>
                        </tr>
                    ))}
                    {drivers.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found. Add one.</td></tr>
                    )}
                </tbody>
            </table>

            {deletingDriver && (
                <ConfirmModal 
                    isOpen={!!deletingDriver}
                    title="Delete Driver Account"
                    message={`Are you sure you want to delete ${deletingDriver.name}? This will remove their secure access key and unassign them from any vehicles.`}
                    onConfirm={handleDelete}
                    onClose={() => setDeletingDriver(null)}
                />
            )}
        </div>
    );
}

function AddDriverModal({ onClose, onSuccess }) {
    const { showAlert } = useModal();
    const [formData, setFormData] = useState({ name: '', vehicle_number: '' });
    const [loading, setLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/drivers', formData);
            setGeneratedKey(res.data.access_key);
        } catch (err) {
            console.error(err);
            showAlert("Error", err.response?.data?.detail || "Failed to create driver");
            setLoading(false);
        }
    };

    if (generatedKey) {
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="modal-header">
                        <h3 className="modal-title">Driver Created!</h3>
                    </div>
                    <div style={{ padding: '1.5rem 0' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Share this secure Access Key with the driver. They will need it to login.
                        </p>
                        <div style={{ 
                            background: '#f1f5f9', 
                            padding: '1rem', 
                            borderRadius: '0.5rem', 
                            fontFamily: 'monospace', 
                            wordBreak: 'break-all',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border)',
                            marginBottom: '1rem'
                        }}>
                            {generatedKey}
                        </div>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => {
                                navigator.clipboard.writeText(generatedKey);
                                showAlert("Copied", "Key copied to clipboard");
                            }}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <div className="modal-actions">
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%' }}
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Create Driver Account</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Driver Name</label>
                        <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Vehicle Number (Optional)</label>
                        <input className="form-input" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} placeholder="KA-01-HH-1234" />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Enter the vehicle plate number assigned to this driver.
                        </p>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Generating Key...' : 'Create Driver'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
