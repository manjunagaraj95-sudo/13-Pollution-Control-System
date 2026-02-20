
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiHome, FiUsers, FiSearch, FiBell, FiSettings, FiLogOut, FiEdit, FiPlus,
    FiX, FiCalendar, FiHardDrive, FiCheckCircle, FiAlertCircle, FiClock,
    FiFilter, FiDownload, FiBarChart, FiActivity, FiTag, FiBook, FiShield,
    FiList, FiTruck, FiGitCommit, FiFileText, FiUpload
} from 'react-icons/fi';
import {
    FaCar, FaSmog, FaChartPie, FaChartLine, FaChartBar, FaGaugeHigh
} from 'react-icons/fa6'; // Using Fa6 for more modern icons

// --- Utility Functions & Data ---

// Dummy Data Generation
const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE', 'SOLD'];
const POLLUTION_CHECK_STATUSES = {
    DRAFT: { label: 'Draft', color: 'draft', icon: <FiFileText /> },
    PENDING: { label: 'Pending Assignment', color: 'pending', icon: <FiClock /> },
    ASSIGNED: { label: 'Assigned', color: 'assigned', icon: <FiUsers /> },
    IN_PROGRESS: { label: 'In Progress', color: 'in_progress', icon: <FiActivity /> },
    COMPLIANT: { label: 'Compliant', color: 'compliant', icon: <FiCheckCircle /> },
    NON_COMPLIANT: { label: 'Non-Compliant', color: 'non_compliant', icon: <FiAlertCircle /> },
    REJECTED: { label: 'Rejected', color: 'rejected', icon: <FiX /> },
};
const WORKFLOW_STEPS = [
    { key: 'DRAFT', label: 'Draft', icon: <FiFileText /> },
    { key: 'PENDING', label: 'Pending', icon: <FiClock /> },
    { key: 'ASSIGNED', label: 'Assigned', icon: <FiUsers /> },
    { key: 'IN_PROGRESS', label: 'Inspection', icon: <FiActivity /> },
    { key: 'COMPLETED', label: 'Result', icon: <FiCheckCircle /> } // Combines Compliant/Non-Compliant
];

const calculateSLAStatus = (startDate, dueDate, status) => {
    if (!startDate || !dueDate) return 'UNKNOWN';
    const now = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (status === 'COMPLIANT' || status === 'NON_COMPLIANT' || status === 'REJECTED') {
        return 'N/A'; // SLA fulfilled or closed
    }

    if (now > due) {
        return 'BREACHED';
    } else if (now > start && now <= due) {
        return 'ON_TRACK';
    }
    return 'NOT_STARTED';
};

const DUMMY_VEHICLES = Array.from({ length: 15 }).map((_, i) => ({
    id: generateId(),
    registrationNumber: `MH04AB${1000 + i}`,
    make: ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes'][getRandomInt(0, 4)],
    model: ['Corolla', 'Civic', 'F-150', 'X5', 'C-Class'][getRandomInt(0, 4)],
    owner: `Owner ${i + 1}`,
    lastServiceDate: getRandomDate(new Date(2022, 0, 1), new Date()).toISOString().split('T')[0],
    status: VEHICLE_STATUSES[getRandomInt(0, 2)],
    engineType: ['Petrol', 'Diesel', 'Electric', 'Hybrid'][getRandomInt(0, 3)],
    mileage: getRandomInt(10000, 150000),
    vin: `VIN${generateId().toUpperCase()}`,
}));

const DUMMY_POLLUTION_CHECKS = DUMMY_VEHICLES.flatMap(vehicle => {
    const checksPerVehicle = getRandomInt(1, 3);
    return Array.from({ length: checksPerVehicle }).map((_, i) => {
        const id = generateId();
        const checkDate = getRandomDate(new Date(2023, 0, 1), new Date(2024, 0, 1));
        const dueDate = new Date(checkDate);
        dueDate.setDate(checkDate.getDate() + getRandomInt(7, 30)); // Due 7-30 days after checkDate

        const statuses = Object.keys(POLLUTION_CHECK_STATUSES);
        let status;
        if (i === checksPerVehicle - 1) { // Make the most recent check more likely to be in progress/pending
            status = statuses[getRandomInt(1, statuses.length - 2)]; // Exclude DRAFT and REJECTED
        } else {
            status = statuses[getRandomInt(0, statuses.length - 1)];
        }
        if (status === 'DRAFT' && getRandomInt(0,1)) status = 'PENDING'; // Drafts are often converted to pending

        const history = [];
        if (status !== 'DRAFT') {
            history.push({
                timestamp: getRandomDate(new Date(checkDate).setHours(0,0,0,0), new Date(checkDate).setHours(1,0,0,0)).toISOString(),
                status: 'DRAFT',
                actor: 'System/Vehicle Owner',
                notes: 'Pollution check record initiated.',
            });
        }
        if (status !== 'DRAFT' && status !== 'PENDING') {
            history.push({
                timestamp: getRandomDate(new Date(checkDate).setHours(2,0,0,0), new Date(checkDate).setHours(3,0,0,0)).toISOString(),
                status: 'PENDING',
                actor: 'System',
                notes: 'Submitted for assignment.',
            });
        }
        if (status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLIANT' || status === 'NON_COMPLIANT' || status === 'REJECTED') {
            history.push({
                timestamp: getRandomDate(new Date(checkDate).setHours(4,0,0,0), new Date(checkDate).setHours(5,0,0,0)).toISOString(),
                status: 'ASSIGNED',
                actor: 'Admin',
                notes: `Assigned to Inspector ${getRandomInt(1, 3)}.`,
            });
        }
        if (status === 'IN_PROGRESS' || status === 'COMPLIANT' || status === 'NON_COMPLIANT' || status === 'REJECTED') {
            history.push({
                timestamp: getRandomDate(new Date(checkDate).setHours(6,0,0,0), new Date(checkDate).setHours(7,0,0,0)).toISOString(),
                status: 'IN_PROGRESS',
                actor: `Inspector ${getRandomInt(1, 3)}`,
                notes: 'Inspection started.',
            });
        }
        if (status === 'COMPLIANT' || status === 'NON_COMPLIANT' || status === 'REJECTED') {
            history.push({
                timestamp: getRandomDate(new Date(checkDate).setHours(8,0,0,0), new Date(checkDate).setHours(9,0,0,0)).toISOString(),
                status: (status === 'COMPLIANT' || status === 'NON_COMPLIANT') ? status : 'REJECTED', // Final actual status
                actor: `Inspector ${getRandomInt(1, 3)}`,
                notes: `Inspection completed. Result: ${POLLUTION_CHECK_STATUSES[status].label}`,
            });
        }

        const currentSLA = calculateSLAStatus(history[history.length - 1]?.timestamp, dueDate, status);

        return {
            id,
            vehicleId: vehicle.id,
            checkDate: checkDate.toISOString().split('T')[0],
            status,
            inspector: (status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLIANT' || status === 'NON_COMPLIANT' || status === 'REJECTED') ? `Inspector ${getRandomInt(1, 3)}` : null,
            dueDate: dueDate.toISOString().split('T')[0],
            resultPdfUrl: status === 'COMPLIANT' || status === 'NON_COMPLIANT' ? `/documents/check_${id}.pdf` : null,
            certificateNumber: status === 'COMPLIANT' ? `PC${generateId().toUpperCase()}` : null,
            workflowHistory: history,
            slaStatus: currentSLA,
        };
    });
}).sort((a,b) => new Date(b.checkDate) - new Date(a.checkDate)); // Sort by most recent

const DUMMY_AUDIT_LOGS = [
    {
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
        actor: 'Admin',
        action: 'CREATED',
        entityType: 'Vehicle',
        entityId: DUMMY_VEHICLES[0].id,
        description: `New vehicle ${DUMMY_VEHICLES[0].registrationNumber} registered.`,
    },
    {
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
        actor: DUMMY_POLLUTION_CHECKS[0].inspector || 'System',
        action: 'STATUS_UPDATE',
        entityType: 'PollutionCheck',
        entityId: DUMMY_POLLUTION_CHECKS[0].id,
        description: `Pollution Check ${DUMMY_POLLUTION_CHECKS[0].id} status changed to ${DUMMY_POLLUTION_CHECKS[0].status}.`,
    },
    {
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
        actor: 'Admin',
        action: 'UPDATED',
        entityType: 'Vehicle',
        entityId: DUMMY_VEHICLES[2].id,
        description: `Vehicle ${DUMMY_VEHICLES[2].registrationNumber} owner updated.`,
    },
    {
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
        actor: 'Inspector 1',
        action: 'FILE_UPLOAD',
        entityType: 'PollutionCheck',
        entityId: DUMMY_POLLUTION_CHECKS[3].id,
        description: `Result PDF uploaded for Pollution Check ${DUMMY_POLLUTION_CHECKS[3].id}.`,
    },
    {
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
        actor: 'Admin',
        action: 'APPROVED',
        entityType: 'PollutionCheck',
        entityId: DUMMY_POLLUTION_CHECKS[1].id,
        description: `Pollution Check ${DUMMY_POLLUTION_CHECKS[1].id} approved as COMPLIANT.`,
    },
    ...Array.from({length: 20}).map(() => ({ // Add more generic logs
        id: generateId(),
        timestamp: new Date(Date.now() - getRandomInt(1, 60) * 24 * 60 * 60 * 1000).toISOString(),
        actor: ['Admin', 'Inspector 1', 'Inspector 2'][getRandomInt(0, 2)],
        action: ['CREATED', 'UPDATED', 'DELETED', 'STATUS_UPDATE', 'FILE_UPLOAD', 'APPROVED', 'REJECTED'][getRandomInt(0, 6)],
        entityType: ['Vehicle', 'PollutionCheck'][getRandomInt(0, 1)],
        entityId: generateId(),
        description: `Generic action on a random entity.`,
    })).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
];


// --- Reusable Components ---

const StatusBadge = ({ status, slaStatus }) => {
    const statusInfo = POLLUTION_CHECK_STATUSES[status] || { label: status, color: 'draft' };
    let className = `value-status status-${statusInfo.color}`;
    let displayLabel = statusInfo.label;

    if (slaStatus) {
        className = `value-status sla-${slaStatus.toLowerCase().replace(' ', '_')}`;
        displayLabel = `${statusInfo.label} (${slaStatus})`;
    }

    return (
        <span className={className}>{displayLabel}</span>
    );
};

const Card = ({ title, subtitle, status, children, onClick, type, footerInfo, slaStatus }) => {
    const statusClass = POLLUTION_CHECK_STATUSES[status]?.color || 'primary';
    const cardTypeClass = type ? `type-${type}` : '';

    return (
        <div className={`card status-${statusClass} ${cardTypeClass}`} onClick={onClick} role="button" tabIndex="0">
            <div className={`card-header status-${statusClass}`}>
                <span>{title}</span>
                {status && <span className="card-status-badge">{POLLUTION_CHECK_STATUSES[status]?.label || status}</span>}
            </div>
            <div className="card-content">
                <h4 style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-dark)' }}>{subtitle}</h4>
                {children}
            </div>
            {footerInfo && (
                <div className="card-footer">
                    <span>{footerInfo.label}</span>
                    {slaStatus && <StatusBadge status={status} slaStatus={slaStatus} />}
                </div>
            )}
            {/* <div className={`card-accent-border status-${statusClass}`}></div> */}
        </div>
    );
};

const KPI = ({ title, value, icon, trend, pulse = false }) => (
    <div className={`kpi-card ${pulse ? 'kpi-pulse-animation' : ''}`}>
        <h3 className="kpi-title">{icon} {title}</h3>
        <span className="kpi-value">{value}</span>
        {trend && <p className="kpi-trend">{trend}</p>}
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="chart-card">
        <h3>{title}</h3>
        <div style={{ flexGrow: 1, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-light)', borderRadius: 'var(--border-radius-sm)' }}>
            {children}
            <span style={{color: 'var(--color-draft)'}}>Chart Placeholder</span>
        </div>
    </div>
);

const ToastNotification = ({ message, type, id, onDismiss }) => {
    const icon = {
        success: <FiCheckCircle />,
        error: <FiAlertCircle />,
        info: <FiBell />,
    }[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    return (
        <div className={`toast ${type}`}>
            <span className="toast-icon">{icon}</span>
            <span className="toast-message">{message}</span>
        </div>
    );
};

const FormGenerator = ({ fields, initialData = {}, onSubmit, onCancel, title, buttonText = "Submit", readOnly = false }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setErrors(prev => ({ ...prev, [name]: undefined })); // Clear error on change
    };

    const validate = () => {
        const newErrors = {};
        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is mandatory.`;
            }
            // Add more specific validations here (e.g., email format, number range)
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (readOnly || !validate()) return;
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form-generator">
            <h2>{title}</h2>
            {fields.map(field => (
                <div className="form-group" key={field.name}>
                    <label htmlFor={field.name}>
                        {field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                        <textarea
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            readOnly={readOnly || field.readOnly}
                        />
                    ) : field.type === 'select' ? (
                        <select
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            disabled={readOnly || field.readOnly}
                        >
                            <option value="">Select...</option>
                            {field.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : field.type === 'file' ? (
                        <div className="file-upload-container">
                            <input
                                type="file"
                                id={field.name}
                                name={field.name}
                                onChange={handleChange}
                                disabled={readOnly || field.readOnly}
                                accept={field.accept || "*/*"}
                            />
                            <FiUpload size={24} style={{ color: 'var(--color-primary)' }} />
                            <span className="upload-text">
                                {formData[field.name]?.name || field.placeholder || `Drag & Drop or Click to Upload ${field.label}`}
                            </span>
                            {formData[field.name] && <span className="file-name">{formData[field.name].name}</span>}
                        </div>
                    ) : (
                        <input
                            type={field.type}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            readOnly={readOnly || field.readOnly}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                        />
                    )}
                    {errors[field.name] && <p className="error-message">{errors[field.name]}</p>}
                </div>
            ))}
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="button button-secondary">Cancel</button>
                {!readOnly && <button type="submit" className="button">{buttonText}</button>}
            </div>
        </form>
    );
};

// --- Application Screens ---

const Dashboard = ({ navigate, addToast, user, vehicles, pollutionChecks }) => {
    const totalVehicles = vehicles.length;
    const compliantChecks = pollutionChecks.filter(pc => pc.status === 'COMPLIANT').length;
    const pendingChecks = pollutionChecks.filter(pc => pc.status === 'PENDING' || pc.status === 'ASSIGNED' || pc.status === 'IN_PROGRESS').length;
    const slaBreaches = pollutionChecks.filter(pc => pc.slaStatus === 'BREACHED').length;

    const recentActivities = DUMMY_AUDIT_LOGS.slice(0, 5);

    return (
        <div className="dashboard">
            <h1>Welcome, {user.name}</h1>

            <div className="dashboard-grid">
                <KPI title="Total Vehicles" value={totalVehicles} icon={<FaCar />} pulse={true} trend="+10% from last month" />
                <KPI title="Compliant Checks" value={compliantChecks} icon={<FiCheckCircle />} pulse={true} trend="+5% from last month" />
                <KPI title="Pending Checks" value={pendingChecks} icon={<FiClock />} pulse={true} trend="-2% from last week" />
                <KPI title="SLA Breaches" value={slaBreaches} icon={<FiAlertCircle />} />

                <ChartCard title="Pollution Check Trends">
                    <FaChartLine size={48} color="var(--color-primary)" />
                </ChartCard>
                <ChartCard title="Compliance Rate (Donut)">
                    <FaChartPie size={48} color="var(--color-primary)" />
                </ChartCard>
                <ChartCard title="Vehicle Types (Bar)">
                    <FaChartBar size={48} color="var(--color-primary)" />
                </ChartCard>
                <ChartCard title="Overall System Health (Gauge)">
                    <FaGaugeHigh size={48} color="var(--color-primary)" />
                </ChartCard>
            </div>

            <div className="recent-activities-card">
                <h2>Recent Activities <FiActivity /></h2>
                <ul className="recent-activities-list">
                    {recentActivities.map(activity => (
                        <li key={activity.id} className="activity-item">
                            <span className="activity-icon"><FiGitCommit /></span>
                            <span>
                                <strong>{new Date(activity.timestamp).toLocaleString()}</strong> - {activity.actor} {activity.description}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const VehiclesList = ({ navigate, vehicles, addToast, updateVehicle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const filteredVehicles = vehicles.filter(v =>
        (v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
         v.make.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedStatus === 'ALL' || v.status === selectedStatus)
    );

    const handleSelectVehicle = (id) => {
        setSelectedVehicles(prev =>
            prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
        );
    };

    const handleBulkAction = (action) => {
        addToast({ message: `Bulk action: ${action} for ${selectedVehicles.length} vehicles (Simulated)`, type: 'info' });
        setSelectedVehicles([]);
    };

    const vehicleFormFields = [
        { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
        { name: 'make', label: 'Make', type: 'text', required: true },
        { name: 'model', label: 'Model', type: 'text', required: true },
        { name: 'owner', label: 'Owner Name', type: 'text', required: true },
        { name: 'lastServiceDate', label: 'Last Service Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: VEHICLE_STATUSES.map(s => ({ value: s, label: s })) },
        { name: 'engineType', label: 'Engine Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(s => ({ value: s, label: s })) },
        { name: 'mileage', label: 'Mileage (km)', type: 'number', min: 0 },
        { name: 'vin', label: 'VIN', type: 'text' },
    ];

    const handleCreateVehicle = (newVehicleData) => {
        const newVehicle = { id: generateId(), ...newVehicleData, status: newVehicleData.status || 'ACTIVE' };
        updateVehicle(newVehicle, true); // True indicates new record
        addToast({ message: `Vehicle ${newVehicle.registrationNumber} created successfully!`, type: 'success' });
        navigate('VehiclesList'); // Go back to list after creation
    };

    return (
        <div>
            <div className="flex-row justify-between align-center mb-lg">
                <h1>Vehicle Registry <FaCar /></h1>
                <div className="flex-row gap-md">
                    <button className="button" onClick={() => navigate('NewVehicleForm')}>
                        <FiPlus /> New Vehicle
                    </button>
                    <button className="button button-secondary" onClick={() => setShowFilters(true)}>
                        <FiFilter /> Filters
                    </button>
                    <button className="button button-secondary" onClick={() => addToast({message: 'Exporting vehicles...', type: 'info'})}>
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            <div className="flex-row gap-md mb-lg">
                <input
                    type="text"
                    placeholder="Search by Reg. No., Owner, Make..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="global-search-input"
                    style={{width: 'auto', flexGrow: 1}}
                />
                {selectedVehicles.length > 0 && (
                    <button className="button button-secondary" onClick={() => handleBulkAction('Update Status')}>
                        Bulk Update ({selectedVehicles.length})
                    </button>
                )}
            </div>

            {filteredVehicles.length === 0 ? (
                <div className="empty-state">
                    <FaCar className="empty-state-icon" />
                    <h3>No Vehicles Found</h3>
                    <p>It looks like there are no vehicles matching your criteria.</p>
                    <button className="button" onClick={() => navigate('NewVehicleForm')}>
                        <FiPlus /> Add New Vehicle
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {filteredVehicles.map(vehicle => (
                        <Card
                            key={vehicle.id}
                            title={vehicle.registrationNumber}
                            subtitle={vehicle.make + ' ' + vehicle.model}
                            type="vehicle"
                            onClick={() => navigate('VehicleDetail', vehicle.id)}
                            footerInfo={{ label: `Owner: ${vehicle.owner}` }}
                        >
                            <p><strong>Last Service:</strong> {vehicle.lastServiceDate}</p>
                            <p><strong>Status:</strong> <span className={`value-status status-${vehicle.status.toLowerCase()}`}>{vehicle.status}</span></p>
                        </Card>
                    ))}
                </div>
            )}

            {showFilters && (
                <div className="filters-panel-overlay" onClick={() => setShowFilters(false)}>
                    <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
                        <h2><FiFilter /> Filters</h2>
                        <div className="form-group">
                            <label htmlFor="statusFilter">Vehicle Status</label>
                            <select
                                id="statusFilter"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-actions">
                            <button className="button button-secondary" onClick={() => { setSelectedStatus('ALL'); setSearchTerm(''); setShowFilters(false); }}>Reset</button>
                            <button className="button" onClick={() => setShowFilters(false)}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form for New Vehicle (Full-screen) */}
            {currentScreen.name === 'NewVehicleForm' && (
                <FullScreenPage title="Create New Vehicle" onBack={() => navigate('VehiclesList')} breadcrumbs={['Vehicles', 'New']}>
                    <FormGenerator
                        title="New Vehicle Details"
                        fields={vehicleFormFields}
                        initialData={{ checkDate: new Date().toISOString().split('T')[0] }}
                        onSubmit={handleCreateVehicle}
                        onCancel={() => navigate('VehiclesList')}
                        buttonText="Create Vehicle"
                    />
                </FullScreenPage>
            )}
        </div>
    );
};

const PollutionChecksList = ({ navigate, pollutionChecks, vehicles, addToast, updatePollutionCheck }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    const getVehicleRegNo = (vehicleId) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';

    const filteredChecks = pollutionChecks.filter(pc =>
        (getVehicleRegNo(pc.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
         pc.inspector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         POLLUTION_CHECK_STATUSES[pc.status]?.label.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedStatus === 'ALL' || pc.status === selectedStatus)
    );

    const pollutionCheckFormFields = (initialStatus = 'DRAFT') => [
        { name: 'vehicleId', label: 'Vehicle', type: 'select', required: true, options: vehicles.map(v => ({ value: v.id, label: v.registrationNumber })) },
        { name: 'checkDate', label: 'Check Date', type: 'date', required: true, autoPopulated: true },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'inspector', label: 'Assigned Inspector', type: 'select', options: [{value: 'Inspector 1', label: 'Inspector 1'}, {value: 'Inspector 2', label: 'Inspector 2'}], readOnly: initialStatus === 'DRAFT' },
        { name: 'status', label: 'Status', type: 'select', options: Object.entries(POLLUTION_CHECK_STATUSES).map(([key, val]) => ({ value: key, label: val.label })), readOnly: true, initialValue: initialStatus },
        { name: 'resultPdf', label: 'Result Document', type: 'file', accept: 'application/pdf', readOnly: initialStatus !== 'IN_PROGRESS' },
        { name: 'certificateNumber', label: 'Certificate Number', type: 'text', readOnly: initialStatus !== 'COMPLIANT' },
    ];

    const handleCreatePollutionCheck = (newCheckData) => {
        const history = [{
            timestamp: new Date().toISOString(),
            status: newCheckData.status || 'DRAFT',
            actor: user.name,
            notes: 'Pollution check record initiated.'
        }];
        const newCheck = {
            id: generateId(),
            ...newCheckData,
            status: newCheckData.status || 'DRAFT',
            workflowHistory: history,
            slaStatus: calculateSLAStatus(history[0].timestamp, newCheckData.dueDate, newCheckData.status),
        };
        updatePollutionCheck(newCheck, true); // True indicates new record
        addToast({ message: `Pollution Check for ${getVehicleRegNo(newCheck.vehicleId)} created successfully!`, type: 'success' });
        navigate('PollutionChecksList');
    };

    return (
        <div>
            <div className="flex-row justify-between align-center mb-lg">
                <h1>Pollution Checks <FaSmog /></h1>
                <div className="flex-row gap-md">
                    <button className="button" onClick={() => navigate('NewPollutionCheckForm')}>
                        <FiPlus /> New Check
                    </button>
                    <button className="button button-secondary" onClick={() => setShowFilters(true)}>
                        <FiFilter /> Filters
                    </button>
                    <button className="button button-secondary" onClick={() => addToast({message: 'Exporting pollution checks...', type: 'info'})}>
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            <input
                type="text"
                placeholder="Search by Reg. No., Inspector, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="global-search-input mb-lg"
            />

            {filteredChecks.length === 0 ? (
                <div className="empty-state">
                    <FaSmog className="empty-state-icon" />
                    <h3>No Pollution Checks Found</h3>
                    <p>It looks like there are no pollution checks matching your criteria.</p>
                    <button className="button" onClick={() => navigate('NewPollutionCheckForm')}>
                        <FiPlus /> Add New Pollution Check
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {filteredChecks.map(check => (
                        <Card
                            key={check.id}
                            title={`Check ID: ${check.id.substring(0, 6).toUpperCase()}`}
                            subtitle={`Vehicle: ${getVehicleRegNo(check.vehicleId)}`}
                            status={check.status}
                            onClick={() => navigate('PollutionCheckDetail', check.id)}
                            footerInfo={{ label: `Inspector: ${check.inspector || 'N/A'}` }}
                            slaStatus={check.slaStatus}
                        >
                            <p><strong>Check Date:</strong> {check.checkDate}</p>
                            <p><strong>Due Date:</strong> {check.dueDate}</p>
                        </Card>
                    ))}
                </div>
            )}

            {showFilters && (
                <div className="filters-panel-overlay" onClick={() => setShowFilters(false)}>
                    <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
                        <h2><FiFilter /> Filters</h2>
                        <div className="form-group">
                            <label htmlFor="statusFilter">Check Status</label>
                            <select
                                id="statusFilter"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                {Object.keys(POLLUTION_CHECK_STATUSES).map(s => <option key={s} value={s}>{POLLUTION_CHECK_STATUSES[s].label}</option>)}
                            </select>
                        </div>
                        <div className="form-actions">
                            <button className="button button-secondary" onClick={() => { setSelectedStatus('ALL'); setSearchTerm(''); setShowFilters(false); }}>Reset</button>
                            <button className="button" onClick={() => setShowFilters(false)}>Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form for New Pollution Check (Full-screen) */}
            {currentScreen.name === 'NewPollutionCheckForm' && (
                <FullScreenPage title="Create New Pollution Check" onBack={() => navigate('PollutionChecksList')} breadcrumbs={['Pollution Checks', 'New']}>
                    <FormGenerator
                        title="New Pollution Check Details"
                        fields={pollutionCheckFormFields()}
                        initialData={{ checkDate: new Date().toISOString().split('T')[0], dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0], status: 'DRAFT' }}
                        onSubmit={handleCreatePollutionCheck}
                        onCancel={() => navigate('PollutionChecksList')}
                        buttonText="Create Check"
                    />
                </FullScreenPage>
            )}
        </div>
    );
};

const VehicleDetail = ({ navigate, vehicleId, vehicles, pollutionChecks, updateVehicle, addToast }) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const relatedChecks = pollutionChecks.filter(pc => pc.vehicleId === vehicleId);

    if (!vehicle) {
        addToast({ message: 'Vehicle not found.', type: 'error' });
        navigate('VehiclesList');
        return null;
    }

    const vehicleFormFields = [
        { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
        { name: 'make', label: 'Make', type: 'text', required: true },
        { name: 'model', label: 'Model', type: 'text', required: true },
        { name: 'owner', label: 'Owner Name', type: 'text', required: true },
        { name: 'lastServiceDate', label: 'Last Service Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: VEHICLE_STATUSES.map(s => ({ value: s, label: s })) },
        { name: 'engineType', label: 'Engine Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(s => ({ value: s, label: s })) },
        { name: 'mileage', label: 'Mileage (km)', type: 'number', min: 0 },
        { name: 'vin', label: 'VIN', type: 'text' },
    ];

    const handleUpdateVehicle = (updatedData) => {
        updateVehicle({ ...vehicle, ...updatedData });
        addToast({ message: `Vehicle ${vehicle.registrationNumber} updated successfully!`, type: 'success' });
        navigate('VehicleDetail', vehicle.id); // Stay on detail after update
    };

    return (
        <FullScreenPage title={`Vehicle: ${vehicle.registrationNumber}`} onBack={() => navigate('VehiclesList')} breadcrumbs={['Vehicles', vehicle.registrationNumber]}>
            <div className="detail-actions">
                <button className="button button-secondary" onClick={() => addToast({message: 'Exporting vehicle details...', type: 'info'})}>
                    <FiDownload /> Export PDF
                </button>
                <button className="button" onClick={() => navigate('EditVehicleForm', vehicle.id)}>
                    <FiEdit /> Edit Vehicle
                </button>
            </div>

            <div className="detail-section">
                <h2>General Information <FiTag /></h2>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Registration Number:</label>
                        <p>{vehicle.registrationNumber}</p>
                    </div>
                    <div className="detail-item">
                        <label>Make / Model:</label>
                        <p>{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div className="detail-item">
                        <label>Owner:</label>
                        <p>{vehicle.owner}</p>
                    </div>
                    <div className="detail-item">
                        <label>Engine Type:</label>
                        <p>{vehicle.engineType}</p>
                    </div>
                    <div className="detail-item">
                        <label>Mileage:</label>
                        <p>{vehicle.mileage} km</p>
                    </div>
                    <div className="detail-item">
                        <label>VIN:</label>
                        <p>{vehicle.vin}</p>
                    </div>
                    <div className="detail-item">
                        <label>Last Service Date:</label>
                        <p>{vehicle.lastServiceDate}</p>
                    </div>
                    <div className="detail-item">
                        <label>Status:</label>
                        <span className={`value-status status-${vehicle.status.toLowerCase()}`}>{vehicle.status}</span>
                    </div>
                </div>
            </div>

            <div className="detail-section">
                <h2>Pollution Check History <FaSmog /></h2>
                {relatedChecks.length === 0 ? (
                    <div className="empty-state" style={{margin: 0, padding: 'var(--spacing-md)'}}>
                        <FaSmog className="empty-state-icon" style={{fontSize: 'var(--font-size-xl)'}} />
                        <h3 style={{fontSize: 'var(--font-size-md)'}}>No Pollution Checks for this Vehicle</h3>
                        <button className="button" onClick={() => navigate('NewPollutionCheckForm', {vehicleId: vehicle.id})}>
                            <FiPlus /> Initiate New Check
                        </button>
                    </div>
                ) : (
                    <div className="card-grid">
                        {relatedChecks.map(check => (
                            <Card
                                key={check.id}
                                title={`Check ID: ${check.id.substring(0, 6).toUpperCase()}`}
                                subtitle={`Date: ${check.checkDate}`}
                                status={check.status}
                                onClick={() => navigate('PollutionCheckDetail', check.id)}
                                footerInfo={{ label: `Inspector: ${check.inspector || 'N/A'}` }}
                                slaStatus={check.slaStatus}
                            >
                                <p><strong>Status:</strong> <StatusBadge status={check.status} /></p>
                                <p><strong>Due Date:</strong> {check.dueDate}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Form (Full-screen) */}
            {currentScreen.name === 'EditVehicleForm' && (
                <FullScreenPage title={`Edit Vehicle: ${vehicle.registrationNumber}`} onBack={() => navigate('VehicleDetail', vehicle.id)} breadcrumbs={['Vehicles', vehicle.registrationNumber, 'Edit']}>
                    <FormGenerator
                        title="Edit Vehicle Details"
                        fields={vehicleFormFields}
                        initialData={vehicle}
                        onSubmit={handleUpdateVehicle}
                        onCancel={() => navigate('VehicleDetail', vehicle.id)}
                        buttonText="Save Changes"
                    />
                </FullScreenPage>
            )}
        </FullScreenPage>
    );
};

const PollutionCheckDetail = ({ navigate, checkId, pollutionChecks, vehicles, updatePollutionCheck, addToast, user }) => {
    const check = pollutionChecks.find(pc => pc.id === checkId);
    const vehicle = vehicles.find(v => v.id === check?.vehicleId);

    if (!check) {
        addToast({ message: 'Pollution Check not found.', type: 'error' });
        navigate('PollutionChecksList');
        return null;
    }

    const currentStepIndex = WORKFLOW_STEPS.findIndex(step => {
        if (step.key === 'COMPLETED') return check.status === 'COMPLIANT' || check.status === 'NON_COMPLIANT';
        return step.key === check.status;
    });

    const pollutionCheckFormFields = (isEdit = false, currentStatus) => [
        { name: 'vehicleId', label: 'Vehicle', type: 'select', required: true, options: vehicles.map(v => ({ value: v.id, label: v.registrationNumber })), readOnly: isEdit },
        { name: 'checkDate', label: 'Check Date', type: 'date', required: true, readOnly: isEdit },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true, readOnly: isEdit && currentStatus !== 'DRAFT' && currentStatus !== 'PENDING' },
        { name: 'inspector', label: 'Assigned Inspector', type: 'select', options: [{value: 'Inspector 1', label: 'Inspector 1'}, {value: 'Inspector 2', label: 'Inspector 2'}], required: check.status !== 'DRAFT', readOnly: currentStatus !== 'PENDING' && currentStatus !== 'ASSIGNED'},
        { name: 'status', label: 'Current Status', type: 'select', options: Object.entries(POLLUTION_CHECK_STATUSES).map(([key, val]) => ({ value: key, label: val.label })), readOnly: true },
        { name: 'resultPdf', label: 'Result Document', type: 'file', accept: 'application/pdf', readOnly: currentStatus !== 'IN_PROGRESS' && currentStatus !== 'NON_COMPLIANT' },
        { name: 'certificateNumber', label: 'Certificate Number', type: 'text', readOnly: currentStatus !== 'COMPLIANT' },
    ];

    const handleUpdatePollutionCheck = (updatedData) => {
        const prevStatus = check.status;
        const newStatus = updatedData.status;

        const newHistoryEntry = {
            timestamp: new Date().toISOString(),
            status: newStatus,
            actor: user.name,
            notes: `Status updated from ${POLLUTION_CHECK_STATUSES[prevStatus]?.label} to ${POLLUTION_CHECK_STATUSES[newStatus]?.label}.`
        };

        const updatedCheck = {
            ...check,
            ...updatedData,
            workflowHistory: [...check.workflowHistory, newHistoryEntry],
            slaStatus: calculateSLAStatus(newHistoryEntry.timestamp, updatedData.dueDate, newStatus)
        };
        updatePollutionCheck(updatedCheck);
        addToast({ message: `Pollution Check ${check.id.substring(0, 6).toUpperCase()} updated successfully!`, type: 'success' });
        navigate('PollutionCheckDetail', check.id);
    };

    const handleWorkflowAction = (actionType) => {
        let nextStatus;
        let actionMessage = '';

        switch (actionType) {
            case 'submit':
                nextStatus = 'PENDING';
                actionMessage = 'Submitted for approval/assignment.';
                break;
            case 'assign':
                nextStatus = 'ASSIGNED';
                actionMessage = `Assigned to ${check.inspector || 'Inspector'}.`;
                break;
            case 'startInspection':
                nextStatus = 'IN_PROGRESS';
                actionMessage = 'Inspection started.';
                break;
            case 'markCompliant':
                nextStatus = 'COMPLIANT';
                actionMessage = 'Marked as Compliant.';
                break;
            case 'markNonCompliant':
                nextStatus = 'NON_COMPLIANT';
                actionMessage = 'Marked as Non-Compliant.';
                break;
            case 'reject':
                nextStatus = 'REJECTED';
                actionMessage = 'Check rejected by Admin.';
                break;
            default:
                return;
        }

        const newHistoryEntry = {
            timestamp: new Date().toISOString(),
            status: nextStatus,
            actor: user.name,
            notes: actionMessage
        };

        const updatedCheck = {
            ...check,
            status: nextStatus,
            workflowHistory: [...check.workflowHistory, newHistoryEntry],
            slaStatus: calculateSLAStatus(newHistoryEntry.timestamp, check.dueDate, nextStatus)
        };
        updatePollutionCheck(updatedCheck);
        addToast({ message: `Pollution Check status updated to ${POLLUTION_CHECK_STATUSES[nextStatus]?.label}.`, type: 'success' });
        navigate('PollutionCheckDetail', check.id);
    };

    const getAvailableActions = (currentStatus) => {
        const actions = [];
        switch (currentStatus) {
            case 'DRAFT':
                actions.push({ label: 'Submit for Assignment', action: 'submit', buttonClass: 'button' });
                break;
            case 'PENDING':
                actions.push({ label: 'Assign Inspector', action: 'assign', buttonClass: 'button' });
                break;
            case 'ASSIGNED':
                actions.push({ label: 'Start Inspection', action: 'startInspection', buttonClass: 'button' });
                break;
            case 'IN_PROGRESS':
                actions.push({ label: 'Mark Compliant', action: 'markCompliant', buttonClass: 'button status-compliant' });
                actions.push({ label: 'Mark Non-Compliant', action: 'markNonCompliant', buttonClass: 'button status-non_compliant' });
                break;
            case 'NON_COMPLIANT':
                actions.push({ label: 'Reject Check', action: 'reject', buttonClass: 'button button-danger' });
                break;
            default:
                break;
        }
        return actions;
    };

    return (
        <FullScreenPage title={`Pollution Check: ${check.id.substring(0, 6).toUpperCase()}`} onBack={() => navigate('PollutionChecksList')} breadcrumbs={['Pollution Checks', check.id.substring(0, 6).toUpperCase()]}>
            <div className="detail-actions">
                <button className="button button-secondary" onClick={() => addToast({message: 'Exporting check details...', type: 'info'})}>
                    <FiDownload /> Export PDF
                </button>
                {(check.status === 'DRAFT' || check.status === 'PENDING') && (
                    <button className="button" onClick={() => navigate('EditPollutionCheckForm', check.id)}>
                        <FiEdit /> Edit Details
                    </button>
                )}
                {getAvailableActions(check.status).map((action, idx) => (
                    <button key={idx} className={action.buttonClass} onClick={() => handleWorkflowAction(action.action)}>
                        {action.label}
                    </button>
                ))}
            </div>

            <div className="detail-section">
                <h2>Workflow Status <FiTag /></h2>
                <div className="workflow-tracker">
                    {WORKFLOW_STEPS.map((step, idx) => {
                        let stepClass = '';
                        let stepIcon = step.icon;
                        if (check.workflowHistory.some(h => h.status === step.key || (step.key === 'COMPLETED' && (h.status === 'COMPLIANT' || h.status === 'NON_COMPLIANT')))) {
                            stepClass = 'completed';
                        }
                        if (currentStepIndex >= 0 && (idx === currentStepIndex || (step.key === 'COMPLETED' && (check.status === 'COMPLIANT' || check.status === 'NON_COMPLIANT')) && idx === WORKFLOW_STEPS.length - 1)) {
                            stepClass = 'current';
                        }
                        if (check.slaStatus === 'BREACHED' && stepClass === 'current') {
                            stepClass = 'breached';
                        }

                        // Special handling for COMPLETED to represent final state
                        let effectiveStatusForIcon = check.status;
                        if (step.key === 'COMPLETED') {
                            if (check.status === 'COMPLIANT') stepIcon = <FiCheckCircle />;
                            else if (check.status === 'NON_COMPLIANT') stepIcon = <FiAlertCircle />;
                            else if (check.status === 'REJECTED') stepIcon = <FiX />;
                            else stepIcon = step.icon;
                        } else {
                            effectiveStatusForIcon = step.key;
                        }

                        return (
                            <div key={step.key} className={`workflow-step ${stepClass}`}>
                                <div className="workflow-step-icon" style={{ backgroundColor: stepClass === 'completed' ? 'var(--color-success)' : stepClass === 'current' ? 'var(--color-info)' : stepClass === 'breached' ? 'var(--color-danger)' : undefined }}>
                                    {stepIcon}
                                </div>
                                <span className="workflow-step-label">{step.label}</span>
                                {stepClass === 'current' && check.slaStatus && check.slaStatus !== 'N/A' && (
                                    <p style={{fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)', color: check.slaStatus === 'BREACHED' ? 'var(--color-danger)' : 'var(--color-info)'}}>
                                        SLA: {check.slaStatus.replace('_', ' ')}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="detail-section">
                <h2>Check Details <FiFileText /></h2>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Vehicle:</label>
                        <p>
                            <a href="#" onClick={() => navigate('VehicleDetail', vehicle?.id)}>{vehicle?.registrationNumber || 'N/A'}</a>
                        </p>
                    </div>
                    <div className="detail-item">
                        <label>Current Status:</label>
                        <StatusBadge status={check.status} />
                    </div>
                    <div className="detail-item">
                        <label>Check Date:</label>
                        <p>{check.checkDate}</p>
                    </div>
                    <div className="detail-item">
                        <label>Due Date:</label>
                        <p>{check.dueDate}</p>
                    </div>
                    <div className="detail-item">
                        <label>Assigned Inspector:</label>
                        <p>{check.inspector || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                        <label>SLA Status:</label>
                        <StatusBadge status={check.status} slaStatus={check.slaStatus} />
                    </div>
                    <div className="detail-item">
                        <label>Result Document:</label>
                        {check.resultPdfUrl ? (
                            <a href={check.resultPdfUrl} target="_blank" rel="noopener noreferrer">View PDF <FiHardDrive /></a>
                        ) : (
                            <p>No document uploaded</p>
                        )}
                    </div>
                    <div className="detail-item">
                        <label>Certificate Number:</label>
                        <p>{check.certificateNumber || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="detail-section">
                <h2>Workflow History <FiBook /></h2>
                <div className="audit-log-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Status</th>
                                <th>Actor</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {check.workflowHistory.slice().reverse().map((entry, idx) => (
                                <tr key={idx}>
                                    <td className="timestamp">{new Date(entry.timestamp).toLocaleString()}</td>
                                    <td><StatusBadge status={entry.status} /></td>
                                    <td>{entry.actor}</td>
                                    <td>{entry.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Form (Full-screen) */}
            {currentScreen.name === 'EditPollutionCheckForm' && (
                <FullScreenPage title={`Edit Pollution Check: ${check.id.substring(0, 6).toUpperCase()}`} onBack={() => navigate('PollutionCheckDetail', check.id)} breadcrumbs={['Pollution Checks', check.id.substring(0, 6).toUpperCase(), 'Edit']}>
                    <FormGenerator
                        title="Edit Pollution Check Details"
                        fields={pollutionCheckFormFields(true, check.status)}
                        initialData={check}
                        onSubmit={handleUpdatePollutionCheck}
                        onCancel={() => navigate('PollutionCheckDetail', check.id)}
                        buttonText="Save Changes"
                    />
                </FullScreenPage>
            )}
        </FullScreenPage>
    );
};

const AuditLogs = ({ navigate }) => {
    return (
        <FullScreenPage title="Audit Logs" onBack={() => navigate('Dashboard')} breadcrumbs={['Dashboard', 'Audit Logs']}>
            <div className="detail-actions">
                <button className="button button-secondary" onClick={() => addToast({message: 'Exporting audit logs...', type: 'info'})}>
                    <FiDownload /> Export
                </button>
            </div>
            <div className="detail-section">
                <h2>System Activity Log <FiBook /></h2>
                <table className="audit-log-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity Type</th>
                            <th>Entity ID</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DUMMY_AUDIT_LOGS.map(log => (
                            <tr key={log.id}>
                                <td className="timestamp">{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.actor}</td>
                                <td>{log.action}</td>
                                <td>{log.entityType}</td>
                                <td>{log.entityId.substring(0, 6).toUpperCase()}</td>
                                <td>{log.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </FullScreenPage>
    );
};

const FullScreenPage = ({ title, onBack, breadcrumbs, children }) => {
    return (
        <div className="full-screen-page">
            <div className="full-screen-header">
                <button onClick={onBack} className="button-icon-only"><FiX size={24} /></button>
                <h1 style={{ marginBottom: '0' }}>{title}</h1>
                <div className="breadcrumb">
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <span>{crumb}</span>
                            {idx < breadcrumbs.length - 1 && <span>/</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [user, setUser] = useState({ name: 'Admin User', role: 'Admin' });
    const [currentScreen, setCurrentScreen] = useState({ name: 'Dashboard', id: null });
    const [screenHistory, setScreenHistory] = useState([{ name: 'Dashboard', id: null }]);
    const [notifications, setNotifications] = useState([]);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');

    // Centralized Data Stores
    const [vehicles, setVehicles] = useState(DUMMY_VEHICLES);
    const [pollutionChecks, setPollutionChecks] = useState(DUMMY_POLLUTION_CHECKS);

    // Update functions for data
    const updateVehicle = (updatedVehicle, isNew = false) => {
        if (isNew) {
            setVehicles(prev => [...prev, updatedVehicle]);
        } else {
            setVehicles(prev => prev.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v)));
        }
    };

    const updatePollutionCheck = (updatedCheck, isNew = false) => {
        if (isNew) {
            setPollutionChecks(prev => [...prev, updatedCheck]);
        } else {
            setPollutionChecks(prev => prev.map(pc => (pc.id === updatedCheck.id ? updatedCheck : pc)));
        }
    };

    // RBAC
    const canAccess = useCallback((feature, item = null) => {
        if (!user) return false;
        // For 'Admin' role, allow all features
        if (user.role === 'Admin') return true;
        // Add more granular logic here if other roles existed
        return false;
    }, [user]);

    // Navigation Handler
    const navigate = useCallback((screenName, id = null, data = null) => {
        const newScreen = { name: screenName, id, data };
        setScreenHistory(prev => {
            const lastScreen = prev[prev.length - 1];
            // Prevent adding duplicate screen if it's the same screen and ID
            if (lastScreen && lastScreen.name === screenName && lastScreen.id === id) {
                return prev;
            }
            return [...prev, newScreen];
        });
        setCurrentScreen(newScreen);
        setShowGlobalSearch(false); // Close search when navigating
        window.scrollTo(0, 0); // Scroll to top on navigation
    }, []);

    const goBack = useCallback(() => {
        setScreenHistory(prev => {
            if (prev.length > 1) {
                const newHistory = prev.slice(0, -1);
                setCurrentScreen(newHistory[newHistory.length - 1]);
                return newHistory;
            }
            return prev; // Stay on the current screen if only one in history
        });
        window.scrollTo(0, 0);
    }, []);

    // Notification Handler
    const addToast = useCallback((notification) => {
        const id = generateId();
        setNotifications(prev => [...prev, { ...notification, id }]);
    }, []);

    const dismissToast = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Global Search Logic
    const handleGlobalSearchChange = (e) => {
        setGlobalSearchTerm(e.target.value);
    };

    const globalSearchResults = globalSearchTerm.length > 2
        ? [
            ...vehicles.filter(v =>
                v.registrationNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                v.owner.toLowerCase().includes(globalSearchTerm.toLowerCase())
            ).map(v => ({
                id: v.id,
                type: 'Vehicle',
                label: v.registrationNumber,
                subtitle: v.owner,
                screen: 'VehicleDetail'
            })),
            ...pollutionChecks.filter(pc =>
                pc.id.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                vehicles.find(v => v.id === pc.vehicleId)?.registrationNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                POLLUTION_CHECK_STATUSES[pc.status].label.toLowerCase().includes(globalSearchTerm.toLowerCase())
            ).map(pc => ({
                id: pc.id,
                type: 'Pollution Check',
                label: `PC: ${pc.id.substring(0, 6).toUpperCase()}`,
                subtitle: `Vehicle: ${vehicles.find(v => v.id === pc.vehicleId)?.registrationNumber}`,
                screen: 'PollutionCheckDetail'
            }))
        ].slice(0, 10) // Limit results
        : [];

    const handleSearchResultClick = (result) => {
        navigate(result.screen, result.id);
        setShowGlobalSearch(false);
        setGlobalSearchTerm('');
    };

    useEffect(() => {
        // Handle browser back/forward buttons (basic implementation)
        const handlePopState = () => {
            setScreenHistory(prev => {
                if (prev.length > 1) {
                    const newHistory = prev.slice(0, -1);
                    setCurrentScreen(newHistory[newHistory.length - 1]);
                    return newHistory;
                }
                return prev;
            });
        };
        // window.addEventListener('popstate', handlePopState);
        // return () => window.removeEventListener('popstate', handlePopState);
        // Note: For a true SPA, client-side routing needs to manage browser history state carefully.
        // For this prototype, `navigate` and `goBack` handle internal history.
    }, []);

    const logout = () => {
        setUser(null);
        addToast({ message: 'Logged out successfully!', type: 'info' });
        // In a real app, redirect to login page
    };

    if (!user) {
        return <div className="app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 'var(--font-size-xxl)'}}>
            Please implement login logic.
            <button className="button" onClick={() => setUser({ name: 'Admin User', role: 'Admin' })}>Login as Admin</button>
        </div>;
    }

    const renderScreen = () => {
        // Full-screen pages are rendered on top, not replacing the main content entirely
        const isFullScreenMode = ['VehicleDetail', 'PollutionCheckDetail', 'AuditLogs', 'EditVehicleForm', 'EditPollutionCheckForm', 'NewVehicleForm', 'NewPollutionCheckForm'].includes(currentScreen.name);

        return (
            <>
                {/* Main Content (always visible under full-screen overlays) */}
                <div className="main-content">
                    {currentScreen.name === 'Dashboard' && canAccess('Dashboard') && (
                        <Dashboard navigate={navigate} addToast={addToast} user={user} vehicles={vehicles} pollutionChecks={pollutionChecks} />
                    )}
                    {currentScreen.name === 'VehiclesList' && canAccess('VehiclesList') && (
                        <VehiclesList navigate={navigate} vehicles={vehicles} addToast={addToast} updateVehicle={updateVehicle} />
                    )}
                    {currentScreen.name === 'PollutionChecksList' && canAccess('PollutionChecksList') && (
                        <PollutionChecksList navigate={navigate} pollutionChecks={pollutionChecks} vehicles={vehicles} addToast={addToast} updatePollutionCheck={updatePollutionCheck} />
                    )}
                </div>

                {/* Full-Screen Overlays */}
                {currentScreen.name === 'VehicleDetail' && canAccess('VehicleDetail', currentScreen.id) && (
                    <VehicleDetail navigate={navigate} vehicleId={currentScreen.id} vehicles={vehicles} pollutionChecks={pollutionChecks} updateVehicle={updateVehicle} addToast={addToast} />
                )}
                {currentScreen.name === 'PollutionCheckDetail' && canAccess('PollutionCheckDetail', currentScreen.id) && (
                    <PollutionCheckDetail navigate={navigate} checkId={currentScreen.id} pollutionChecks={pollutionChecks} vehicles={vehicles} updatePollutionCheck={updatePollutionCheck} addToast={addToast} user={user} />
                )}
                {currentScreen.name === 'AuditLogs' && canAccess('AuditLogs') && (
                    <AuditLogs navigate={navigate} addToast={addToast} />
                )}
                 {currentScreen.name === 'EditVehicleForm' && canAccess('EditVehicleForm', currentScreen.id) && (
                    // VehicleDetail already handles rendering this as a nested FullScreenPage
                    <VehicleDetail navigate={navigate} vehicleId={currentScreen.id} vehicles={vehicles} pollutionChecks={pollutionChecks} updateVehicle={updateVehicle} addToast={addToast} />
                )}
                {currentScreen.name === 'EditPollutionCheckForm' && canAccess('EditPollutionCheckForm', currentScreen.id) && (
                    // PollutionCheckDetail already handles rendering this as a nested FullScreenPage
                    <PollutionCheckDetail navigate={navigate} checkId={currentScreen.id} pollutionChecks={pollutionChecks} vehicles={vehicles} updatePollutionCheck={updatePollutionCheck} addToast={addToast} user={user} />
                )}
                {currentScreen.name === 'NewVehicleForm' && canAccess('NewVehicleForm') && (
                     // VehiclesList already handles rendering this as a nested FullScreenPage
                     <VehiclesList navigate={navigate} vehicles={vehicles} addToast={addToast} updateVehicle={updateVehicle} />
                )}
                {currentScreen.name === 'NewPollutionCheckForm' && canAccess('NewPollutionCheckForm') && (
                     // PollutionChecksList already handles rendering this as a nested FullScreenPage
                     <PollutionChecksList navigate={navigate} pollutionChecks={pollutionChecks} vehicles={vehicles} addToast={addToast} updatePollutionCheck={updatePollutionCheck} />
                )}
            </>
        );
    };

    return (
        <div className="app-container">
            <header className="header">
                <span className="header-title">Pollution Control System</span>
                <nav className="header-nav">
                    {canAccess('Dashboard') && (
                        <a href="#" className={`header-nav-item ${currentScreen.name === 'Dashboard' ? 'active' : ''}`} onClick={() => navigate('Dashboard')}>
                            <FiHome /> Dashboard
                        </a>
                    )}
                    {canAccess('VehiclesList') && (
                        <a href="#" className={`header-nav-item ${['VehiclesList', 'VehicleDetail', 'EditVehicleForm', 'NewVehicleForm'].includes(currentScreen.name) ? 'active' : ''}`} onClick={() => navigate('VehiclesList')}>
                            <FaCar /> Vehicles
                        </a>
                    )}
                    {canAccess('PollutionChecksList') && (
                        <a href="#" className={`header-nav-item ${['PollutionChecksList', 'PollutionCheckDetail', 'EditPollutionCheckForm', 'NewPollutionCheckForm'].includes(currentScreen.name) ? 'active' : ''}`} onClick={() => navigate('PollutionChecksList')}>
                            <FaSmog /> Pollution Checks
                        </a>
                    )}
                    {canAccess('AuditLogs') && (
                        <a href="#" className={`header-nav-item ${currentScreen.name === 'AuditLogs' ? 'active' : ''}`} onClick={() => navigate('AuditLogs')}>
                            <FiBook /> Audit Logs
                        </a>
                    )}
                    <button className="button-icon-only" style={{color: 'var(--color-text-light)'}} onClick={() => setShowGlobalSearch(true)} title="Global Search">
                        <FiSearch size={20} />
                    </button>
                    <button className="button-icon-only" style={{color: 'var(--color-text-light)'}} onClick={logout} title="Logout">
                        <FiLogOut size={20} />
                    </button>
                </nav>
            </header>

            {renderScreen()}

            <div className="toast-container">
                {notifications.map(n => (
                    <ToastNotification key={n.id} {...n} onDismiss={dismissToast} />
                ))}
            </div>

            {showGlobalSearch && (
                <div className="global-search-overlay" onClick={() => setShowGlobalSearch(false)}>
                    <div className="global-search-container" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder="Search vehicles, pollution checks, owners..."
                            className="global-search-input"
                            value={globalSearchTerm}
                            onChange={handleGlobalSearchChange}
                            autoFocus
                        />
                        {globalSearchTerm.length > 2 && globalSearchResults.length > 0 && (
                            <div className="global-search-results">
                                {globalSearchResults.map(result => (
                                    <div key={result.id} className="result-item" onClick={() => handleSearchResultClick(result)}>
                                        {result.type === 'Vehicle' ? <FaCar /> : <FaSmog />}
                                        <span>{result.label}</span> <small>({result.type})</small>
                                    </div>
                                ))}
                            </div>
                        )}
                         {globalSearchTerm.length > 2 && globalSearchResults.length === 0 && (
                            <div className="empty-state" style={{margin: 'var(--spacing-md) 0', padding: 'var(--spacing-md)'}}>
                                <FiSearch className="empty-state-icon" style={{fontSize: 'var(--font-size-xl)'}} />
                                <h3 style={{fontSize: 'var(--font-size-md)'}}>No Results Found</h3>
                                <p style={{marginBottom: '0'}}>Try a different search term.</p>
                            </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;