import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ExternalLink,
  Trash2,
  Menu,
  X,
  BadgeCheck,
  Layers
} from 'lucide-react';
import {
  createBlankClient,
  evaluateEligibility,
  VERIFICATION_METHODS,
  WORKFLOW_STEPS
} from './data/workflowBlueprint';
import {
  getActiveFirebaseConfig,
  initFirestoreFromConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  getDbInstance,
  subscribeToAgencies,
  subscribeToAgencyClients,
  upsertAgencyRecord,
  upsertClientRecord,
  deleteClientRecord,
  seedDemoDataToFirestore
} from './lib/firestoreService';
import WorkflowTracker from './components/WorkflowTracker';
import ClientIntakeForm from './components/ClientIntakeForm';
import ListingPreviewDossier from './components/ListingPreviewDossier';
import FirestoreModal from './components/FirestoreModal';
import NewAgencyModal from './components/NewAgencyModal';

export default function App() {
  const [agencies, setAgencies] = useState([]);
  const [activeAgencyId, setActiveAgencyId] = useState('apex-digital');
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stepFilter, setStepFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [firebaseConfig, setFirebaseConfig] = useState(() => getActiveFirebaseConfig());
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [firestoreModalOpen, setFirestoreModalOpen] = useState(false);
  const [newAgencyModalOpen, setNewAgencyModalOpen] = useState(false);

  // Initialize Firestore if config exists
  useEffect(() => {
    let mounted = true;
    async function boot() {
      const cfg = getActiveFirebaseConfig();
      if (cfg) {
        try {
          const db = await initFirestoreFromConfig(cfg);
          if (mounted) {
            setFirestoreConnected(Boolean(db));
          }
        } catch {
          if (mounted) setFirestoreConnected(false);
        }
      } else {
        setFirestoreConnected(false);
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to multi-tenant agencies
  useEffect(() => {
    const unsub = subscribeToAgencies((list) => {
      setAgencies(list);
      if (list.length > 0 && !list.some((a) => a.id === activeAgencyId)) {
        setActiveAgencyId(list[0].id);
      }
    });
    return () => unsub && unsub();
  }, [firestoreConnected, activeAgencyId]);

  // Subscribe to clients for active agency tenant
  useEffect(() => {
    if (!activeAgencyId) return;
    const unsub = subscribeToAgencyClients(activeAgencyId, (list) => {
      setClients(list);
      setActiveClientId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id || '';
      });
    });
    return () => unsub && unsub();
  }, [activeAgencyId, firestoreConnected]);

  const activeAgency = useMemo(
    () => agencies.find((a) => a.id === activeAgencyId) || agencies[0] || null,
    [agencies, activeAgencyId]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.business?.dbaName?.toLowerCase().includes(q) ||
        c.business?.legalName?.toLowerCase().includes(q) ||
        c.domain?.primaryDomain?.toLowerCase().includes(q);

      const matchesStep =
        stepFilter === 'all' ||
        (stepFilter === 'verified' && c.insights?.blueCheckActive) ||
        (stepFilter === 'action' &&
          Object.values(c.stepStatuses || {}).includes('action_required')) ||
        (stepFilter === 'in_progress' && !c.insights?.blueCheckActive);

      return matchesQuery && matchesStep;
    });
  }, [clients, searchQuery, stepFilter]);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || null,
    [clients, activeClientId]
  );

  // Blueprint KPI metrics for active client
  const clientKpis = useMemo(() => {
    if (!activeClient) {
      return {
        completedSteps: 0,
        progressLabel: 'NO CLIENT',
        verdict: 'Check Needed',
        verdictSub: 'Select or create a client',
        verificationPath: 'DNS TXT',
        personaSub: 'Persona KYC: Pending',
        insightsCount: 0,
        insightsSub: 'Awaiting first period entry'
      };
    }

    const completedSteps = WORKFLOW_STEPS.filter(
      (s) => activeClient.stepStatuses?.[s.id] === 'completed'
    ).length;

    const elig = evaluateEligibility(activeClient.eligibility);
    const methodLabel =
      VERIFICATION_METHODS.find(
        (m) => m.value === activeClient.domain?.verificationMethod
      )?.label || 'DNS TXT';

    const personaRaw = activeClient.verificationDocs?.personaStatus || 'pending';
    const personaLabel =
      personaRaw === 'approved'
        ? 'Approved'
        : personaRaw === 'pending_review'
        ? 'In Review'
        : personaRaw === 'action_needed'
        ? 'Action Needed'
        : 'Pending';

    const logged = activeClient.insights?.loggedPeriodsCount || 0;

    return {
      completedSteps,
      progressLabel: completedSteps === 6 ? 'COMPLETE' : 'IN PROGRESS',
      verdict: elig.verdict,
      verdictSub: elig.agentAvailability,
      verificationPath: methodLabel,
      personaSub: `Persona KYC: ${personaLabel}`,
      insightsCount: logged,
      insightsSub:
        logged > 0
          ? `${activeClient.insights?.monthlyMentions || 0} mentions logged`
          : 'Awaiting first period entry'
    };
  }, [activeClient]);

  const handleCreateClient = async () => {
    if (!activeAgencyId) return;
    const blank = createBlankClient(activeAgencyId);
    blank.business.dbaName = 'New Client Business';
    blank.business.legalName = 'New Client Business LLC';
    const localUpdated = await upsertClientRecord(activeAgencyId, blank);
    if (localUpdated) {
      setClients(localUpdated);
    }
    setActiveClientId(blank.id);
    setMobileNavOpen(false);
  };

  const handleSaveClient = async (updatedClient) => {
    setIsSaving(true);
    try {
      const localUpdated = await upsertClientRecord(activeAgencyId, updatedClient);
      if (localUpdated) {
        setClients(localUpdated);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    const localUpdated = await deleteClientRecord(activeAgencyId, clientId);
    if (localUpdated) {
      setClients(localUpdated);
      setActiveClientId(localUpdated[0]?.id || '');
    }
  };

  const handleCreateAgency = async (newAgency) => {
    const localUpdated = await upsertAgencyRecord(newAgency);
    if (localUpdated) {
      setAgencies(localUpdated);
    }
    setActiveAgencyId(newAgency.id);
  };

  const handleConnectFirestore = async (cfg) => {
    await saveFirebaseConfig(cfg);
    setFirebaseConfig(cfg);
    setFirestoreConnected(Boolean(getDbInstance()));
  };

  const handleDisconnectFirestore = async () => {
    await clearFirebaseConfig();
    setFirebaseConfig(null);
    setFirestoreConnected(false);
  };

  const handleSeedDemoData = async () => {
    await seedDemoDataToFirestore();
  };

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Multi-Tenant Sidebar */}
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Layers size={18} />
          </div>
          <div className="brand-text">
            <span className="brand-title">ChatGPT Business Hub</span>
            <span className="brand-sub">Setup &amp; Verification Portal</span>
          </div>
          <button
            type="button"
            className="icon-btn mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Multi-Tenant Agency Switcher */}
        <div className="tenant-switcher-box">
          <div className="tenant-label-row">
            <span className="section-label">Agency Tenant</span>
            <button
              type="button"
              className="text-action-btn"
              onClick={() => setNewAgencyModalOpen(true)}
            >
              + New Tenant
            </button>
          </div>
          <select
            aria-label="Select Agency Tenant"
            className="tenant-select"
            value={activeAgencyId}
            onChange={(e) => {
              setActiveAgencyId(e.target.value);
              setActiveClientId('');
            }}
          >
            {agencies.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>
          {activeAgency && (
            <div className="tenant-meta">
              <span>{activeAgency.plan}</span>
              <span>&bull;</span>
              <span className="mono-text">{activeAgency.region}</span>
            </div>
          )}
        </div>

        {/* Client Roster Controls */}
        <div className="roster-controls">
          <div className="roster-header">
            <span className="section-label">Client Roster ({clients.length})</span>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={handleCreateClient}
            >
              <Plus size={14} />
              <span>New Client</span>
            </button>
          </div>

          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="search"
              placeholder="Search client or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {[
              { id: 'all', label: 'All' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'action', label: 'Action' },
              { id: 'verified', label: 'Verified' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-pill ${stepFilter === f.id ? 'is-active' : ''}`}
                onClick={() => setStepFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Client List */}
        <nav className="client-list" aria-label="Agency clients">
          {filteredClients.length === 0 ? (
            <div className="empty-roster">No matching clients in this tenant.</div>
          ) : (
            filteredClients.map((c) => {
              const isSelected = c.id === activeClientId;
              const hasAction = Object.values(c.stepStatuses || {}).includes('action_required');
              const isVerified = c.insights?.blueCheckActive;
              const currentStepDef = WORKFLOW_STEPS.find((s) => s.id === c.currentStep);

              return (
                <button
                  key={c.id}
                  type="button"
                  className={`client-list-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setActiveClientId(c.id);
                    setMobileNavOpen(false);
                  }}
                >
                  <div className="client-item-top">
                    <span className="client-item-name">
                      {c.business?.dbaName || c.business?.legalName || 'Untitled Client'}
                    </span>
                    {isVerified ? (
                      <BadgeCheck size={16} className="verified-icon" />
                    ) : hasAction ? (
                      <AlertTriangle size={15} className="warning-icon" />
                    ) : (
                      <Clock size={14} className="pending-icon" />
                    )}
                  </div>
                  <div className="client-item-domain">
                    {c.domain?.primaryDomain || 'No domain configured'}
                  </div>
                  <div className="client-item-step">
                    Step {c.currentStep}/6 &bull; {currentStepDef?.shortTitle || 'Eligibility'}
                  </div>
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="beta-eyebrow">
                CHATGPT BUSINESS HUB &middot; BETA WORKFLOW &middot; LAUNCHED NOV 10, 2026
              </div>
              <h1 className="page-heading">
                {activeAgency?.name || 'Agency Dashboard'}
              </h1>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className={`firestore-pill ${firestoreConnected ? 'is-live' : 'is-sandbox'}`}
              onClick={() => setFirestoreModalOpen(true)}
            >
              <Database size={15} />
              <span>
                {firestoreConnected
                  ? `Firestore: ${firebaseConfig?.projectId}`
                  : 'Firestore: Local Sandbox'}
              </span>
            </button>
          </div>
        </header>

        {/* Blueprint 4-Card KPI Strip */}
        <section className="kpi-grid" aria-label="Portal setup metrics">
          <div className="kpi-card">
            <div className="kpi-label">SETUP PROGRESS</div>
            <div className="kpi-value">{clientKpis.completedSteps} / 6</div>
            <div className="kpi-foot kpi-emerald">{clientKpis.progressLabel}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ELIGIBILITY VERDICT</div>
            <div className="kpi-value kpi-value-sm">{clientKpis.verdict}</div>
            <div className="kpi-foot">{clientKpis.verdictSub}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">VERIFICATION PATH</div>
            <div className="kpi-value kpi-value-sm">{clientKpis.verificationPath}</div>
            <div className="kpi-foot">{clientKpis.personaSub}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">28-DAY INSIGHTS</div>
            <div className="kpi-value kpi-value-sm">{clientKpis.insightsCount} Logged</div>
            <div className="kpi-foot">{clientKpis.insightsSub}</div>
          </div>
        </section>

        {/* Active Client Workspace */}
        {activeClient ? (
          <div className="client-workspace">
            <div className="client-banner card">
              <div className="client-banner-info">
                <div className="client-banner-title-row">
                  <Building2 size={20} className="client-banner-icon" />
                  <h2>{activeClient.business?.dbaName || 'Untitled Client'}</h2>
                  {activeClient.insights?.blueCheckActive && (
                    <span className="blue-check-badge">
                      <BadgeCheck size={14} />
                      <span>Verified Business</span>
                    </span>
                  )}
                </div>
                <div className="client-banner-meta">
                  <span>{activeClient.business?.legalName || 'Legal entity pending'}</span>
                  {activeClient.business?.websiteUrl && (
                    <>
                      <span>&bull;</span>
                      <a
                        href={activeClient.business.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-link"
                      >
                        <span>{activeClient.domain?.primaryDomain || activeClient.business.websiteUrl}</span>
                        <ExternalLink size={12} />
                      </a>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="mono-text">ID: {activeClient.id}</span>
                </div>
              </div>

              <div className="client-banner-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger-text"
                  onClick={() => handleDeleteClient(activeClient.id)}
                >
                  <Trash2 size={15} />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>

            <WorkflowTracker
              client={activeClient}
              onUpdateClient={handleSaveClient}
            />

            <div className="workspace-split">
              <ClientIntakeForm
                client={activeClient}
                onSaveClient={handleSaveClient}
                isSaving={isSaving}
                firestoreConnected={firestoreConnected}
              />
              <ListingPreviewDossier client={activeClient} />
            </div>
          </div>
        ) : (
          <div className="empty-workspace card">
            <CheckCircle2 size={32} className="empty-icon" />
            <h2>No Client Selected</h2>
            <p>
              Create a new client intake record for <strong>{activeAgency?.name}</strong> to begin the six-step ChatGPT Business Hub setup &amp; verification workflow.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleCreateClient}>
              <Plus size={16} />
              <span>Start First Client Intake</span>
            </button>
          </div>
        )}
      </main>

      <FirestoreModal
        isOpen={firestoreModalOpen}
        onClose={() => setFirestoreModalOpen(false)}
        activeConfig={firebaseConfig}
        isConnected={firestoreConnected}
        activeAgencyId={activeAgencyId}
        activeClientId={activeClientId}
        onConnect={handleConnectFirestore}
        onDisconnect={handleDisconnectFirestore}
        onSeedDemoData={handleSeedDemoData}
      />

      <NewAgencyModal
        isOpen={newAgencyModalOpen}
        onClose={() => setNewAgencyModalOpen(false)}
        onCreateAgency={handleCreateAgency}
      />
    </div>
  );
}
