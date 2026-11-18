import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Building2,
  Globe,
  FileCheck2,
  BarChart3,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Trash2,
  Save,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  ELIGIBILITY_PRESETS,
  DNS_PROVIDERS,
  VERIFICATION_METHODS,
  evaluateEligibility,
  generateOpenAITxtValue
} from '../data/workflowBlueprint';

export default function ClientIntakeForm({
  client,
  onSaveClient,
  isSaving,
  firestoreConnected
}) {
  const [activeTab, setActiveTab] = useState('eligibility');
  const [draft, setDraft] = useState(client);
  const [isDirty, setIsDirty] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [dnsChecking, setDnsChecking] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  useEffect(() => {
    setDraft(client);
    setIsDirty(false);
    setSaveFeedback('');
  }, [client.id]);

  // Keep workflow tracker updates in sync
  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      currentStep: client.currentStep,
      stepStatuses: client.stepStatuses,
      checklistProgress: client.checklistProgress,
      insights: client.insights
    }));
  }, [client.currentStep, client.stepStatuses, client.checklistProgress, client.insights]);

  const updateEligibility = (field, value) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      eligibility: { ...(prev.eligibility || {}), [field]: value },
      business:
        field === 'category'
          ? { ...prev.business, category: value }
          : prev.business
    }));
  };

  const applyPreset = (preset) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      eligibility: {
        ...(prev.eligibility || {}),
        ...preset.values,
        confirmed: true
      },
      business: {
        ...prev.business,
        category: preset.values.category
      }
    }));
  };

  const handleConfirmEligibility = async () => {
    const nextDraft = {
      ...draft,
      currentStep: Math.max(draft.currentStep || 1, 2),
      stepStatuses: {
        ...(draft.stepStatuses || {}),
        1: 'completed',
        2: draft.stepStatuses?.[2] === 'completed' ? 'completed' : 'in_progress'
      },
      eligibility: {
        ...(draft.eligibility || {}),
        confirmed: true
      }
    };
    setDraft(nextDraft);
    await onSaveClient(nextDraft);
    setIsDirty(false);
    setActiveTab('business');
  };

  const updateBusiness = (field, value) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      business: { ...prev.business, [field]: value }
    }));
  };

  const updateDomain = (field, value) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      domain: { ...prev.domain, [field]: value }
    }));
  };

  const updateDocs = (field, value) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      verificationDocs: { ...prev.verificationDocs, [field]: value }
    }));
  };

  const updateInsights = (field, value) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      insights: { ...(prev.insights || {}), [field]: value }
    }));
  };

  const handleCopy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(''), 1800);
    } catch {
      // clipboard fallback ignored
    }
  };

  const handleRegenerateTxt = () => {
    const newVal = generateOpenAITxtValue(draft.domain.primaryDomain || draft.business.dbaName);
    updateDomain('txtValue', newVal);
    updateDomain('propagationStatus', 'pending');
  };

  const handleRunDnsCheck = () => {
    setDnsChecking(true);
    setTimeout(() => {
      setDnsChecking(false);
      setIsDirty(true);
      setDraft((prev) => ({
        ...prev,
        domain: {
          ...prev.domain,
          propagationStatus: 'verified',
          verifiedAt: new Date().toISOString()
        }
      }));
    }, 850);
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newDocs = files.map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.toLowerCase().includes('loa')
        ? 'Agency Authorization'
        : file.name.toLowerCase().includes('ein') || file.name.toLowerCase().includes('tax')
        ? 'Tax ID Record'
        : 'Business Registration',
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      status: 'pending'
    }));

    updateDocs('documents', [...(draft.verificationDocs.documents || []), ...newDocs]);
    e.target.value = '';
  };

  const handleToggleDocStatus = (docId) => {
    const nextDocs = (draft.verificationDocs.documents || []).map((d) =>
      d.id === docId ? { ...d, status: d.status === 'verified' ? 'pending' : 'verified' } : d
    );
    updateDocs('documents', nextDocs);
  };

  const handleRemoveDoc = (docId) => {
    const nextDocs = (draft.verificationDocs.documents || []).filter((d) => d.id !== docId);
    updateDocs('documents', nextDocs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveClient(draft);
    setIsDirty(false);
    setSaveFeedback(
      firestoreConnected ? 'Saved to Cloud Firestore' : 'Saved to Local Sandbox'
    );
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  const eligibilityEval = evaluateEligibility(draft.eligibility);

  return (
    <form className="card intake-card" onSubmit={handleSubmit}>
      <div className="intake-header">
        <div>
          <h2 className="intake-title">Client Intake &amp; Verification Record</h2>
          <p className="intake-subtitle">
            Eligibility check, business profile, DNS domain records, Persona KYC, and 28-day insights
          </p>
        </div>
        <div className="intake-save-group">
          {saveFeedback && (
            <span className="save-feedback">
              <CheckCircle2 size={15} />
              <span>{saveFeedback}</span>
            </span>
          )}
          {isDirty && !saveFeedback && (
            <span className="unsaved-pill">Unsaved changes</span>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            <Save size={16} />
            <span>{isSaving ? 'Syncing...' : firestoreConnected ? 'Save to Firestore' : 'Save Record'}</span>
          </button>
        </div>
      </div>

      {/* Intake Navigation Tabs */}
      <div className="intake-tabs" role="tablist" aria-label="Client intake sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'eligibility'}
          className={`intake-tab ${activeTab === 'eligibility' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('eligibility')}
        >
          <ClipboardCheck size={16} />
          <span>1. Eligibility</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'business'}
          className={`intake-tab ${activeTab === 'business' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          <Building2 size={16} />
          <span>2. Business Details</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'domain'}
          className={`intake-tab ${activeTab === 'domain' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('domain')}
        >
          <Globe size={16} />
          <span>3. Domain Records</span>
          <span
            className={`tab-dot ${
              draft.domain.propagationStatus === 'verified'
                ? 'dot-success'
                : draft.domain.propagationStatus === 'propagating'
                ? 'dot-warning'
                : 'dot-neutral'
            }`}
          />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docs'}
          className={`intake-tab ${activeTab === 'docs' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <FileCheck2 size={16} />
          <span>4. Verification Docs</span>
          <span className="tab-count">{(draft.verificationDocs.documents || []).length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'insights'}
          className={`intake-tab ${activeTab === 'insights' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <BarChart3 size={16} />
          <span>5. 28-Day Insights</span>
        </button>
      </div>

      {/* TAB 1: ELIGIBILITY CHECK */}
      {activeTab === 'eligibility' && (
        <div className="intake-panel" role="tabpanel">
          <div className="presets-bar">
            <span className="section-label">Presets:</span>
            <div className="presets-list">
              {ELIGIBILITY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="preset-chip"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="eligCategory">Business Category</label>
              <select
                id="eligCategory"
                value={draft.eligibility?.category || BUSINESS_CATEGORIES[2]}
                onChange={(e) => updateEligibility('category', e.target.value)}
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="eligCountry">Operating Country</label>
              <select
                id="eligCountry"
                value={draft.eligibility?.operatingCountry || 'United States'}
                onChange={(e) => updateEligibility('operatingCountry', e.target.value)}
              >
                <option value="United States">United States</option>
                <option value="Outside United States">Outside United States</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="eligHubPresence">Presence in Business Hub Search</label>
              <select
                id="eligHubPresence"
                value={
                  draft.eligibility?.hubPresence ||
                  'Haven’t checked chatgpt.com/business-hub yet'
                }
                onChange={(e) => updateEligibility('hubPresence', e.target.value)}
              >
                <option value="Already listed (appears in Hub search)">
                  Already listed (appears in Hub search)
                </option>
                <option value="Not listed (missing from Hub search)">
                  Not listed (missing from Hub search)
                </option>
                <option value="Haven’t checked chatgpt.com/business-hub yet">
                  Haven’t checked chatgpt.com/business-hub yet
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="eligPaidWorkspace">Paid ChatGPT Team or Ads Account?</label>
              <select
                id="eligPaidWorkspace"
                value={
                  draft.eligibility?.paidWorkspace ||
                  'No — free / standard ChatGPT account only'
                }
                onChange={(e) => updateEligibility('paidWorkspace', e.target.value)}
              >
                <option value="No — free / standard ChatGPT account only">
                  No — free / standard ChatGPT account only
                </option>
                <option value="Yes — existing paid workspace">
                  Yes — existing paid workspace
                </option>
              </select>
            </div>
          </div>

          <div className={`assessment-box tone-${eligibilityEval.tone}`}>
            <div className="assessment-header">
              <div>
                <span className="section-label">ASSESSMENT</span>
                <h4>{eligibilityEval.verdict}</h4>
              </div>
              <span className="agent-pill">
                Business Agent: {eligibilityEval.agentAvailability}
              </span>
            </div>
            <p>{eligibilityEval.summary}</p>
            <div className="assessment-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmEligibility}
              >
                <span>Confirm Eligibility &amp; Continue to Step 2</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS DETAILS */}
      {activeTab === 'business' && (
        <div className="intake-panel" role="tabpanel">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="legalName">Official Legal Business Name *</label>
              <input
                id="legalName"
                type="text"
                required
                placeholder="e.g., Solstice Specialty Coffee Roasters LLC"
                value={draft.business.legalName}
                onChange={(e) => updateBusiness('legalName', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="dbaName">Public Brand / DBA Name *</label>
              <input
                id="dbaName"
                type="text"
                required
                placeholder="e.g., Solstice Roasters"
                value={draft.business.dbaName}
                onChange={(e) => updateBusiness('dbaName', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="websiteUrl">Primary Website URL *</label>
              <input
                id="websiteUrl"
                type="url"
                required
                placeholder="https://example.com"
                value={draft.business.websiteUrl}
                onChange={(e) => updateBusiness('websiteUrl', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">Business Category</label>
              <select
                id="category"
                value={draft.business.category}
                onChange={(e) => updateBusiness('category', e.target.value)}
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="address">Registered Street Address / Service Area</label>
              <input
                id="address"
                type="text"
                placeholder="Street, City, State/Province, Postal Code, Country"
                value={draft.business.address}
                onChange={(e) => updateBusiness('address', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="businessEmail">Official Business Email</label>
              <input
                id="businessEmail"
                type="email"
                placeholder="ops@company.com"
                value={draft.business.businessEmail}
                onChange={(e) => updateBusiness('businessEmail', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="businessPhone">Business Verification Phone</label>
              <input
                id="businessPhone"
                type="tel"
                placeholder="+1 (555) 010-2000"
                value={draft.business.businessPhone}
                onChange={(e) => updateBusiness('businessPhone', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="businessHours">Operating Hours</label>
              <input
                id="businessHours"
                type="text"
                placeholder="Mon–Fri 9:00 AM – 6:00 PM"
                value={draft.business.hours || ''}
                onChange={(e) => updateBusiness('hours', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="managingAccount">Client-Owned ChatGPT Admin Email</label>
              <input
                id="managingAccount"
                type="email"
                placeholder="admin@company.com"
                value={draft.business.managingChatGPTAccount}
                onChange={(e) => updateBusiness('managingChatGPTAccount', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="deliveryPolicyUrl">Delivery / Shipping Policy URL</label>
              <input
                id="deliveryPolicyUrl"
                type="url"
                placeholder="https://company.com/shipping"
                value={draft.business.deliveryPolicyUrl}
                onChange={(e) => updateBusiness('deliveryPolicyUrl', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="returnPolicyUrl">Return / Refund Policy URL</label>
              <input
                id="returnPolicyUrl"
                type="url"
                placeholder="https://company.com/returns"
                value={draft.business.returnPolicyUrl}
                onChange={(e) => updateBusiness('returnPolicyUrl', e.target.value)}
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="productFeedUrl">Product Feed URL (Shopify / CSV / Hosted JSON)</label>
              <input
                id="productFeedUrl"
                type="url"
                placeholder="https://company.com/feeds/openai-catalog.json"
                value={draft.business.productFeedUrl}
                onChange={(e) => updateBusiness('productFeedUrl', e.target.value)}
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="description">Factual Business Description (for ChatGPT Profile)</label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe products, services, and target market in neutral, factual terms..."
                value={draft.business.description}
                onChange={(e) => updateBusiness('description', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOMAIN RECORDS */}
      {activeTab === 'domain' && (
        <div className="intake-panel" role="tabpanel">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="primaryDomain">Primary Domain *</label>
              <input
                id="primaryDomain"
                type="text"
                placeholder="company.com"
                value={draft.domain.primaryDomain}
                onChange={(e) => updateDomain('primaryDomain', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="dnsProvider">DNS Registrar / Provider</label>
              <select
                id="dnsProvider"
                value={draft.domain.dnsProvider}
                onChange={(e) => updateDomain('dnsProvider', e.target.value)}
              >
                {DNS_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="verificationMethod">Claim Verification Path</label>
              <select
                id="verificationMethod"
                value={draft.domain.verificationMethod}
                onChange={(e) => updateDomain('verificationMethod', e.target.value)}
              >
                {VERIFICATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="propagationStatus">DNS Propagation Status</label>
              <select
                id="propagationStatus"
                value={draft.domain.propagationStatus}
                onChange={(e) => updateDomain('propagationStatus', e.target.value)}
              >
                <option value="pending">Pending Record</option>
                <option value="propagating">Propagating (Up to 24h)</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>

          <div className="dns-record-box">
            <div className="dns-record-header">
              <div>
                <h4>OpenAI Domain Verification TXT Record</h4>
                <p>Add this exact TXT record in {draft.domain.dnsProvider || 'your DNS zone'} to verify domain ownership.</p>
              </div>
              <div className="dns-record-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleRegenerateTxt}
                >
                  <RefreshCw size={14} />
                  <span>Regenerate Token</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRunDnsCheck}
                  disabled={dnsChecking}
                >
                  <Sparkles size={14} />
                  <span>{dnsChecking ? 'Checking DNS...' : 'Verify DNS Propagation'}</span>
                </button>
              </div>
            </div>

            <div className="dns-table">
              <div className="dns-row dns-row-head">
                <span>Type</span>
                <span>Host / Name</span>
                <span>TXT Value</span>
                <span>Action</span>
              </div>
              <div className="dns-row">
                <span className="mono-badge">TXT</span>
                <span className="mono-text">{draft.domain.txtHost || '@'}</span>
                <span className="mono-text dns-value-cell">{draft.domain.txtValue}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleCopy('txt', draft.domain.txtValue)}
                >
                  {copiedField === 'txt' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'txt' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="dns-subgrid">
              <div className="form-field">
                <label htmlFor="spfStatus">SPF Record Health</label>
                <select
                  id="spfStatus"
                  value={draft.domain.spfStatus}
                  onChange={(e) => updateDomain('spfStatus', e.target.value)}
                >
                  <option value="configured">Configured (Valid)</option>
                  <option value="missing">Missing / Needs Update</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="dmarcPolicy">DMARC Policy</label>
                <select
                  id="dmarcPolicy"
                  value={draft.domain.dmarcPolicy}
                  onChange={(e) => updateDomain('dmarcPolicy', e.target.value)}
                >
                  <option value="p=none">p=none (Monitor)</option>
                  <option value="p=quarantine">p=quarantine (Recommended)</option>
                  <option value="p=reject">p=reject (Strict)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION DOCS */}
      {activeTab === 'docs' && (
        <div className="intake-panel" role="tabpanel">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="signatoryName">Authorized Signatory Full Name</label>
              <input
                id="signatoryName"
                type="text"
                placeholder="Full legal name matching Gov ID"
                value={draft.verificationDocs.signatoryName}
                onChange={(e) => updateDocs('signatoryName', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="signatoryRole">Signatory Title / Role</label>
              <input
                id="signatoryRole"
                type="text"
                placeholder="e.g., Founder, CEO, Managing Member"
                value={draft.verificationDocs.signatoryRole}
                onChange={(e) => updateDocs('signatoryRole', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="einTaxId">EIN / LLC Registration Number</label>
              <input
                id="einTaxId"
                type="text"
                className="mono-input"
                placeholder="XX-XXXXXXX"
                value={draft.verificationDocs.einTaxId}
                onChange={(e) => updateDocs('einTaxId', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="govIdType">Persona Government ID Type</label>
              <select
                id="govIdType"
                value={draft.verificationDocs.govIdType}
                onChange={(e) => updateDocs('govIdType', e.target.value)}
              >
                <option value="Passport">Passport</option>
                <option value="Driver License">Driver&apos;s License</option>
                <option value="National ID">National ID Card</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="personaStatus">Persona KYC Status</label>
              <select
                id="personaStatus"
                value={draft.verificationDocs.personaStatus}
                onChange={(e) => updateDocs('personaStatus', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="pending_review">In Review</option>
                <option value="approved">Approved (Blue Check Eligible)</option>
                <option value="action_needed">Action Needed (Mismatch)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Agency Representation Authorization</label>
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={Boolean(draft.verificationDocs.agencyLoaSigned)}
                  onChange={(e) => updateDocs('agencyLoaSigned', e.target.checked)}
                />
                <span>Client signed Agency Letter of Authorization (LOA)</span>
              </label>
            </div>
          </div>

          <div className="docs-upload-section">
            <div className="docs-upload-header">
              <div>
                <h4>Verification &amp; Compliance Documents</h4>
                <p>Attach Articles of Incorporation, IRS CP-575 / Tax ID, and Signed Agency LOA metadata.</p>
              </div>
              <label className="btn btn-secondary btn-sm upload-btn">
                <Upload size={15} />
                <span>Attach Document</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileAttach}
                  hidden
                />
              </label>
            </div>

            {(draft.verificationDocs.documents || []).length === 0 ? (
              <div className="empty-docs">
                <ShieldAlert size={20} />
                <span>No verification documents attached yet. Attach business registration or LOA files above.</span>
              </div>
            ) : (
              <ul className="docs-list">
                {draft.verificationDocs.documents.map((docItem) => (
                  <li key={docItem.id} className="doc-row">
                    <div className="doc-info">
                      <FileCheck2 size={18} className="doc-icon" />
                      <div>
                        <div className="doc-name">{docItem.name}</div>
                        <div className="doc-meta">
                          <span>{docItem.type}</span>
                          <span>&bull;</span>
                          <span>{docItem.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="doc-actions">
                      <button
                        type="button"
                        className={`status-pill clickable ${
                          docItem.status === 'verified' ? 'badge-success' : 'badge-warning'
                        }`}
                        onClick={() => handleToggleDocStatus(docItem.id)}
                        title="Click to toggle verification status"
                      >
                        {docItem.status === 'verified' ? 'Verified' : 'Pending Review'}
                      </button>
                      <button
                        type="button"
                        className="icon-btn-danger"
                        onClick={() => handleRemoveDoc(docItem.id)}
                        aria-label={`Remove ${docItem.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: 28-DAY INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="intake-panel" role="tabpanel">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="loggedPeriods">28-Day Periods Logged</label>
              <input
                id="loggedPeriods"
                type="number"
                min={0}
                value={draft.insights?.loggedPeriodsCount || 0}
                onChange={(e) => updateInsights('loggedPeriodsCount', Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="monthlyMentions">28-Day ChatGPT Mentions</label>
              <input
                id="monthlyMentions"
                type="number"
                min={0}
                value={draft.insights?.monthlyMentions || 0}
                onChange={(e) => updateInsights('monthlyMentions', Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="websiteClicks">28-Day Website Clicks</label>
              <input
                id="websiteClicks"
                type="number"
                min={0}
                value={draft.insights?.websiteClicks || 0}
                onChange={(e) => updateInsights('websiteClicks', Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="agentStatus">Business Agent Status</label>
              <select
                id="agentStatus"
                value={draft.insights?.businessAgentStatus || 'not_eligible'}
                onChange={(e) => updateInsights('businessAgentStatus', e.target.value)}
              >
                <option value="not_eligible">Not Eligible / Pending</option>
                <option value="draft">Draft Testing</option>
                <option value="published">Published &amp; Live</option>
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="topDiscoveryTopic">Top Discovery Topic</label>
              <input
                id="topDiscoveryTopic"
                type="text"
                placeholder="e.g., single origin espresso subscription"
                value={draft.insights?.topDiscoveryTopic || ''}
                onChange={(e) => updateInsights('topDiscoveryTopic', e.target.value)}
              />
            </div>

            <div className="form-field form-field-full">
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={Boolean(draft.insights?.blueCheckActive)}
                  onChange={(e) => updateInsights('blueCheckActive', e.target.checked)}
                />
                <span>Blue Verified Check is active on ChatGPT Business Hub</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
