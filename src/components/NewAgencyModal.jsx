import React, { useState } from 'react';
import { X, Building } from 'lucide-react';

export default function NewAgencyModal({ isOpen, onClose, onCreateAgency }) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Enterprise Multi-Tenant');
  const [region, setRegion] = useState('us-central1');
  const [leadAdmin, setLeadAdmin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    await onCreateAgency({
      id: `${slug || 'agency'}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      slug,
      plan,
      region,
      leadAdmin: leadAdmin.trim() || `admin@${slug || 'agency'}.com`
    });
    setName('');
    setLeadAdmin('');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-agency-title">
      <div className="modal-panel modal-panel-sm">
        <div className="modal-header">
          <div className="modal-title-group">
            <Building size={20} />
            <div>
              <h2 id="new-agency-title">Create Agency Tenant</h2>
              <p>Provision an isolated Firestore workspace for a new agency</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body modal-form">
          <div className="form-field">
            <label htmlFor="agencyName">Agency Name *</label>
            <input
              id="agencyName"
              type="text"
              required
              placeholder="e.g., Horizon AI Growth Partners"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="agencyAdmin">Lead Administrator Email</label>
            <input
              id="agencyAdmin"
              type="email"
              placeholder="lead@agency.com"
              value={leadAdmin}
              onChange={(e) => setLeadAdmin(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="agencyPlan">Workspace Tier</label>
              <select id="agencyPlan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="Enterprise Multi-Tenant">Enterprise Multi-Tenant</option>
                <option value="Growth Agency">Growth Agency</option>
                <option value="Partner Sandbox">Partner Sandbox</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="agencyRegion">Firestore Region</label>
              <select id="agencyRegion" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="us-central1">us-central1 (Iowa)</option>
                <option value="us-east1">us-east1 (S. Carolina)</option>
                <option value="europe-west1">europe-west1 (Belgium)</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
