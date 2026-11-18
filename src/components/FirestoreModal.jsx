import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  UploadCloud,
  Unplug
} from 'lucide-react';

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agencies/{agencyId} {
      allow read, write: if request.auth != null;
      match /clients/{clientId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}`;

export default function FirestoreModal({
  isOpen,
  onClose,
  activeConfig,
  isConnected,
  activeAgencyId,
  activeClientId,
  onConnect,
  onDisconnect,
  onSeedDemoData
}) {
  const [apiKey, setApiKey] = useState(activeConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(activeConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(activeConfig?.authDomain || '');
  const [appId, setAppId] = useState(activeConfig?.appId || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    if (!apiKey.trim() || !projectId.trim()) {
      setError('Both Firebase API Key and Project ID are required.');
      return;
    }
    setBusy(true);
    try {
      await onConnect({
        apiKey: apiKey.trim(),
        projectId: projectId.trim(),
        authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
        appId: appId.trim()
      });
    } catch (err) {
      setError(err.message || 'Unable to connect to Cloud Firestore.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    setError('');
    setBusy(true);
    try {
      await onSeedDemoData();
      setSeedDone(true);
      setTimeout(() => setSeedDone(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to seed Firestore.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="firestore-modal-title">
      <div className="modal-panel">
        <div className="modal-header">
          <div className="modal-title-group">
            <Database size={20} className="google-blue-icon" />
            <div>
              <h2 id="firestore-modal-title">Google Cloud Firestore Integration</h2>
              <p>Persist multi-tenant agency &amp; client records in your Google Cloud project</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className={`connection-banner ${isConnected ? 'is-connected' : 'is-sandbox'}`}>
            <div className="connection-banner-left">
              <CheckCircle2 size={18} />
              <div>
                <strong>
                  {isConnected
                    ? `Connected to Firestore (${activeConfig?.projectId})`
                    : 'Running in Local Sandbox Mode'}
                </strong>
                <div className="mono-path">
                  Path: agencies/{activeAgencyId || '{agencyId}'}/clients/{activeClientId || '{clientId}'}
                </div>
              </div>
            </div>
            {isConnected && (
              <div className="connection-banner-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSeed}
                  disabled={busy}
                >
                  <UploadCloud size={14} />
                  <span>{seedDone ? 'Seeded!' : 'Seed Sample Tenants'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onDisconnect}
                  disabled={busy}
                >
                  <Unplug size={14} />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleConnect} className="modal-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="fbProjectId">Firebase Project ID *</label>
                <input
                  id="fbProjectId"
                  type="text"
                  placeholder="my-agency-portal-prod"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="fbApiKey">Web API Key *</label>
                <input
                  id="fbApiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="fbAuthDomain">Auth Domain</label>
                <input
                  id="fbAuthDomain"
                  type="text"
                  placeholder="my-agency-portal-prod.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="fbAppId">App ID (Optional)</label>
                <input
                  id="fbAppId"
                  type="text"
                  placeholder="1:1234567890:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <Database size={15} />
                <span>{busy ? 'Connecting...' : isConnected ? 'Update Connection' : 'Connect Cloud Firestore'}</span>
              </button>
            </div>
          </form>

          <div className="rules-preview">
            <div className="rules-header">
              <span>Multi-Tenant Firestore Security Rules</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={handleCopyRules}>
                {copiedRules ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedRules ? 'Copied' : 'Copy Rules'}</span>
              </button>
            </div>
            <pre><code>{FIRESTORE_RULES_SNIPPET}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}
