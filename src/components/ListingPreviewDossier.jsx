import React from 'react';
import {
  BadgeCheck,
  Download,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { evaluateEligibility } from '../data/workflowBlueprint';

export default function ListingPreviewDossier({ client }) {
  const eligibilityEval = evaluateEligibility(client.eligibility);
  const business = client.business || {};
  const domain = client.domain || {};
  const docs = client.verificationDocs || {};
  const insights = client.insights || {};

  // Readiness calculations matching the portal dossier
  const step1PrepFields = [
    business.legalName,
    business.websiteUrl,
    business.address,
    business.managingChatGPTAccount
  ].filter(Boolean).length;

  const step23ClaimDone = [
    client.stepStatuses?.[1] === 'completed',
    client.stepStatuses?.[2] === 'completed',
    client.stepStatuses?.[3] === 'completed'
  ].filter(Boolean).length;

  const profileAuditItems = [
    business.description,
    business.websiteUrl,
    business.address,
    business.businessPhone,
    business.deliveryPolicyUrl,
    business.returnPolicyUrl
  ].filter(Boolean).length;

  const ownershipLabel =
    domain.propagationStatus === 'verified'
      ? 'Verified'
      : domain.propagationStatus === 'propagating'
      ? 'Propagating'
      : 'Not Started';

  const personaLabel =
    docs.personaStatus === 'approved'
      ? 'Approved'
      : docs.personaStatus === 'pending_review'
      ? 'In Review'
      : docs.personaStatus === 'action_needed'
      ? 'Action Needed'
      : 'Pending';

  const handleExportDossier = () => {
    const lines = [
      'CHATGPT BUSINESS HUB — SETUP READINESS DOSSIER',
      `Generated: ${new Date().toISOString()}`,
      `Client ID: ${client.id}`,
      '====================================================',
      '',
      '1. ELIGIBILITY VERDICT',
      `   Verdict: ${eligibilityEval.verdict}`,
      `   Category: ${client.eligibility?.category || business.category}`,
      `   Country: ${client.eligibility?.operatingCountry || 'United States'}`,
      `   Hub Search Presence: ${client.eligibility?.hubPresence || 'Not checked'}`,
      `   Business Agent Availability: ${eligibilityEval.agentAvailability}`,
      '',
      '2. BUSINESS PROFILE & PREP ASSETS',
      `   Legal Name: ${business.legalName || '—'}`,
      `   DBA / Brand Name: ${business.dbaName || '—'}`,
      `   Website: ${business.websiteUrl || '—'}`,
      `   Address: ${business.address || '—'}`,
      `   Phone: ${business.businessPhone || '—'}`,
      `   Hours: ${business.hours || '—'}`,
      `   Managing ChatGPT Account: ${business.managingChatGPTAccount || '—'}`,
      `   Description: ${business.description || '—'}`,
      `   Delivery Policy: ${business.deliveryPolicyUrl || '—'}`,
      `   Return Policy: ${business.returnPolicyUrl || '—'}`,
      `   Product Feed: ${business.productFeedUrl || '—'}`,
      '',
      '3. DOMAIN & OWNERSHIP VERIFICATION',
      `   Primary Domain: ${domain.primaryDomain || '—'}`,
      `   DNS Provider: ${domain.dnsProvider || '—'}`,
      `   Verification Path: ${domain.verificationMethod || 'dns_txt'}`,
      `   TXT Host: ${domain.txtHost || '@'}`,
      `   TXT Value: ${domain.txtValue || '—'}`,
      `   Propagation Status: ${ownershipLabel}`,
      '',
      '4. PERSONA KYC & AUTHORIZATION',
      `   Signatory: ${docs.signatoryName || '—'} (${docs.signatoryRole || '—'})`,
      `   EIN / Tax ID: ${docs.einTaxId || '—'}`,
      `   Persona Status: ${personaLabel}`,
      `   Agency LOA Signed: ${docs.agencyLoaSigned ? 'Yes' : 'No'}`,
      `   Attached Documents: ${(docs.documents || []).map((d) => d.name).join(', ') || 'None'}`,
      '',
      '5. 28-DAY INSIGHTS',
      `   Logged Periods: ${insights.loggedPeriodsCount || 0}`,
      `   Monthly Mentions: ${insights.monthlyMentions || 0}`,
      `   Website Clicks: ${insights.websiteClicks || 0}`,
      `   Top Discovery Topic: ${insights.topDiscoveryTopic || '—'}`,
      `   Business Agent Status: ${insights.businessAgentStatus || 'not_eligible'}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(business.dbaName || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-setup-dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="right-rail" aria-label="Live listing preview and setup readiness dossier">
      {/* Live Listing Preview */}
      <section className="card preview-card">
        <div className="preview-eyebrow">LIVE LISTING PREVIEW</div>
        <div className="preview-title-row">
          <h3>{business.dbaName || 'Your Business Name'}</h3>
          {insights.blueCheckActive && (
            <BadgeCheck size={17} className="verified-icon" title="Blue Verified Check" />
          )}
        </div>
        <div className="preview-category-pill">
          {business.category ? business.category.toUpperCase() : 'CATEGORY NOT SET'}
        </div>

        <p className="preview-description">
          {business.description ||
            'Draft your profile description in Stage 5 (or Business Details) to preview how your offering, location, and distinctive features read.'}
        </p>

        <dl className="preview-meta-list">
          <div className="preview-meta-row">
            <dt>
              <Globe size={13} />
              <span>Website</span>
            </dt>
            <dd>{business.websiteUrl || '—'}</dd>
          </div>
          <div className="preview-meta-row">
            <dt>
              <MapPin size={13} />
              <span>Address</span>
            </dt>
            <dd>{business.address || '—'}</dd>
          </div>
          <div className="preview-meta-row">
            <dt>
              <Phone size={13} />
              <span>Phone</span>
            </dt>
            <dd>{business.businessPhone || '—'}</dd>
          </div>
          <div className="preview-meta-row">
            <dt>
              <Clock size={13} />
              <span>Hours</span>
            </dt>
            <dd>{business.hours || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Setup Readiness Dossier */}
      <section className="card dossier-card">
        <div className="dossier-header">
          <h3>Setup Readiness Dossier</h3>
        </div>

        <ul className="dossier-list">
          <li>
            <span>Step 1 Prep Assets</span>
            <strong className={step1PrepFields === 4 ? 'text-emerald' : ''}>
              {step1PrepFields} / 4 ready
            </strong>
          </li>
          <li>
            <span>Steps 2–3 Hub Claim</span>
            <strong className={step23ClaimDone === 3 ? 'text-emerald' : ''}>
              {step23ClaimDone} / 3 done
            </strong>
          </li>
          <li>
            <span>Step 4 Ownership</span>
            <strong className={ownershipLabel === 'Verified' ? 'text-emerald' : ''}>
              {ownershipLabel}
            </strong>
          </li>
          <li>
            <span>Step 5 Persona KYC</span>
            <strong className={personaLabel === 'Approved' ? 'text-emerald' : ''}>
              {personaLabel}
            </strong>
          </li>
          <li>
            <span>Step 6 Profile &amp; Audit</span>
            <strong className={profileAuditItems === 6 ? 'text-emerald' : ''}>
              {profileAuditItems} / 6 items
            </strong>
          </li>
        </ul>

        <button
          type="button"
          className="btn btn-secondary dossier-export-btn"
          onClick={handleExportDossier}
        >
          <Download size={15} />
          <span>Export Setup Dossier (.txt)</span>
        </button>

        <div className="official-note">
          <div className="official-note-title">
            {eligibilityEval.tone === 'success' ? (
              <CheckCircle2 size={14} className="text-emerald" />
            ) : (
              <AlertCircle size={14} className="text-amber" />
            )}
            <span>Official Reference Note</span>
          </div>
          <p>
            To submit your actual claim, visit{' '}
            <a href="https://chatgpt.com/business-hub" target="_blank" rel="noreferrer">
              chatgpt.com/business-hub <ExternalLink size={11} />
            </a>
            . Verification and publication depend on OpenAI review.
          </p>
        </div>
      </section>
    </aside>
  );
}
