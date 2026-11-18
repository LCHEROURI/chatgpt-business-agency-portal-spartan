export const WORKFLOW_STEPS = [
  {
    id: 1,
    key: 'eligibility',
    title: 'Check ChatGPT Business Hub Eligibility',
    shortTitle: 'Eligibility',
    subtitle: 'Hub rules check — confirm listing claim path, country & Business Agent availability',
    checklist: [
      'Confirm business category & operating country',
      'Check presence in chatgpt.com/business-hub search',
      'Verify ChatGPT Team/Ads workspace ownership & Business Agent eligibility'
    ]
  },
  {
    id: 2,
    key: 'prep_claim',
    title: 'Prep & Claim (Steps 1–3 Assets)',
    shortTitle: 'Prep & Claim',
    subtitle: 'Prepare business details, hours, policies, and initiate Business Hub claim',
    checklist: [
      'Confirm client-owned ChatGPT admin email',
      'Prepare official business name, address, phone, website & hours',
      'Select matching listing or create online profile in Business Hub'
    ]
  },
  {
    id: 3,
    key: 'verify_domain',
    title: 'Verify Domain & Ownership',
    shortTitle: 'Verify Domain',
    subtitle: 'Phone, email, DNS TXT record, or Shopify store ownership verification',
    checklist: [
      'Select primary verification path (DNS TXT, Email, Phone, or Shopify)',
      'Publish OpenAI verification TXT record in client DNS zone',
      'Confirm propagation and complete ownership verification'
    ]
  },
  {
    id: 4,
    key: 'persona_kyc',
    title: 'Persona Identity & LLC Verification',
    shortTitle: 'Persona KYC',
    subtitle: 'Identity & LLC — government ID, EIN/Tax ID, and Agency LOA documentation',
    checklist: [
      'Verify signatory government-issued photo ID via Persona',
      'Match legal entity name, address & EIN/Tax ID with official filings',
      'Attach signed Agency Letter of Authorization (LOA)'
    ]
  },
  {
    id: 5,
    key: 'optimize_profile',
    title: 'Optimize Profile (Copy & Links Audit)',
    shortTitle: 'Optimize Profile',
    subtitle: 'Audit profile copy, delivery/return links, category, logo & product feed',
    checklist: [
      'Write factual, neutral business description & verify NAP consistency',
      'Audit website, delivery policy, return policy & operating hours',
      'Connect product feed (Shopify, CSV, or hosted feed URL)'
    ]
  },
  {
    id: 6,
    key: 'track_test',
    title: 'Track & Test (28-Day Insights)',
    shortTitle: 'Track & Test',
    subtitle: 'Log 28-day visibility insights, mentions, clicks & test Business Agent',
    checklist: [
      'Confirm Blue Verified Check is live on ChatGPT profile',
      'Log initial 28-day AI mentions, website clicks & discovery topics',
      'Test and publish Business Agent (if eligible)'
    ]
  }
];

export const BUSINESS_CATEGORIES = [
  'Local Restaurant / Hospitality',
  'Local Retail Store',
  'Online Ecommerce / Shopify Store',
  'Online Service Business'
];

export const ELIGIBILITY_PRESETS = [
  {
    id: 'established_us_restaurant',
    label: 'Established U.S. Restaurant',
    values: {
      category: 'Local Restaurant / Hospitality',
      operatingCountry: 'United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'No — free / standard ChatGPT account only'
    }
  },
  {
    id: 'newly_opened_local',
    label: 'Newly Opened Local Spot',
    values: {
      category: 'Local Retail Store',
      operatingCountry: 'United States',
      hubPresence: 'Not listed (missing from Hub search)',
      paidWorkspace: 'No — free / standard ChatGPT account only'
    }
  },
  {
    id: 'us_shopify_store',
    label: 'U.S. Shopify Store',
    values: {
      category: 'Online Ecommerce / Shopify Store',
      operatingCountry: 'United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'Yes — existing paid workspace'
    }
  }
];

export function evaluateEligibility(eligibility = {}) {
  const { category, operatingCountry, hubPresence, confirmed } = eligibility;
  if (!confirmed && !hubPresence) {
    return {
      verdict: 'Check Needed',
      tone: 'neutral',
      summary: 'Complete Stage 1 assessment to evaluate your listing path.',
      agentAvailability: 'Pending assessment'
    };
  }

  const isLocal =
    category === 'Local Restaurant / Hospitality' || category === 'Local Retail Store';
  const isUS = operatingCountry === 'United States';
  const isOnline =
    category === 'Online Ecommerce / Shopify Store' || category === 'Online Service Business';

  if (isLocal && !isUS) {
    return {
      verdict: 'Beta Limited (Non-US Local)',
      tone: 'warning',
      summary: 'Local physical businesses currently require an existing U.S. listing during beta.',
      agentAvailability: 'Not eligible outside U.S.'
    };
  }

  if (isLocal && hubPresence === 'Not listed (missing from Hub search)') {
    return {
      verdict: 'Waitlist / Directory Sync Needed',
      tone: 'warning',
      summary: 'Local businesses cannot create net-new listings directly; sync Google/Bing directories first.',
      agentAvailability: 'Requires claimed U.S. listing'
    };
  }

  if (isOnline && isUS) {
    return {
      verdict: 'Eligible — Full Hub & Agent',
      tone: 'success',
      summary: 'Eligible to claim or create an online profile, verify via DNS/Shopify, and launch a Business Agent.',
      agentAvailability: 'Eligible (U.S. Online / Ecommerce)'
    };
  }

  return {
    verdict: 'Eligible — Claim Existing',
    tone: 'success',
    summary: 'Eligible to claim your Business Hub listing and complete Persona KYC verification.',
    agentAvailability: isUS ? 'Check in Hub after Persona' : 'U.S. only during beta'
  };
}

export const DNS_PROVIDERS = [
  'Cloudflare',
  'AWS Route 53',
  'GoDaddy',
  'Namecheap',
  'Google Cloud DNS',
  'Hostinger',
  'Squarespace Domains',
  'Other / Custom'
];

export const VERIFICATION_METHODS = [
  { value: 'dns_txt', label: 'DNS TXT' },
  { value: 'business_email', label: 'Business Email' },
  { value: 'business_phone', label: 'Business Phone' },
  { value: 'shopify', label: 'Shopify Store' }
];

export function generateOpenAITxtValue(domain = 'example.com') {
  const slug =
    domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10) || 'client';
  return `openai-domain-verification=${slug}-9f4c2a8e1b7d4032`;
}

export function createBlankClient(agencyId) {
  const id = `client-${Date.now()}`;
  return {
    id,
    agencyId,
    currentStep: 1,
    stepStatuses: {
      1: 'in_progress',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
      6: 'pending'
    },
    checklistProgress: {},
    eligibility: {
      category: 'Online Ecommerce / Shopify Store',
      operatingCountry: 'United States',
      hubPresence: 'Haven’t checked chatgpt.com/business-hub yet',
      paidWorkspace: 'No — free / standard ChatGPT account only',
      confirmed: false
    },
    business: {
      legalName: '',
      dbaName: '',
      websiteUrl: '',
      category: 'Online Ecommerce / Shopify Store',
      address: '',
      businessEmail: '',
      businessPhone: '',
      hours: 'Mon–Fri 9:00 AM – 6:00 PM',
      managingChatGPTAccount: '',
      description: '',
      deliveryPolicyUrl: '',
      returnPolicyUrl: '',
      productFeedUrl: ''
    },
    domain: {
      primaryDomain: '',
      dnsProvider: 'Cloudflare',
      verificationMethod: 'dns_txt',
      txtHost: '@',
      txtValue: generateOpenAITxtValue('newclient.com'),
      spfStatus: 'configured',
      dmarcPolicy: 'p=quarantine',
      propagationStatus: 'pending',
      verifiedAt: ''
    },
    verificationDocs: {
      signatoryName: '',
      signatoryRole: '',
      einTaxId: '',
      govIdType: 'Passport',
      personaStatus: 'pending',
      agencyLoaSigned: false,
      documents: []
    },
    insights: {
      blueCheckActive: false,
      loggedPeriodsCount: 0,
      monthlyMentions: 0,
      websiteClicks: 0,
      topDiscoveryTopic: '',
      businessAgentStatus: 'not_eligible'
    },
    updatedAt: new Date().toISOString()
  };
}

export const INITIAL_AGENCIES = [
  {
    id: 'apex-digital',
    name: 'Apex Digital Partners',
    slug: 'apex-digital',
    plan: 'Enterprise Multi-Tenant',
    region: 'us-central1',
    leadAdmin: 'maya.chen@apexdigital.io'
  },
  {
    id: 'northstar-commerce',
    name: 'Northstar Commerce Agency',
    slug: 'northstar-commerce',
    plan: 'Growth Agency',
    region: 'us-east1',
    leadAdmin: 'liam.brooks@northstar.co'
  },
  {
    id: 'vanguard-seo',
    name: 'Vanguard AI Visibility Group',
    slug: 'vanguard-seo',
    plan: 'Enterprise Multi-Tenant',
    region: 'europe-west1',
    leadAdmin: 'elena.rostova@vanguardseo.eu'
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 'client-solstice-roasters',
    agencyId: 'apex-digital',
    currentStep: 6,
    stepStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'completed',
      5: 'completed',
      6: 'completed'
    },
    checklistProgress: {
      '1_0': true, '1_1': true, '1_2': true,
      '2_0': true, '2_1': true, '2_2': true,
      '3_0': true, '3_1': true, '3_2': true,
      '4_0': true, '4_1': true, '4_2': true,
      '5_0': true, '5_1': true, '5_2': true,
      '6_0': true, '6_1': true, '6_2': true
    },
    eligibility: {
      category: 'Online Ecommerce / Shopify Store',
      operatingCountry: 'United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'Yes — existing paid workspace',
      confirmed: true
    },
    business: {
      legalName: 'Solstice Specialty Coffee Roasters LLC',
      dbaName: 'Solstice Roasters',
      websiteUrl: 'https://solsticeroasters.com',
      category: 'Online Ecommerce / Shopify Store',
      address: '418 NW Flanders St, Portland, OR 97209',
      businessEmail: 'ops@solsticeroasters.com',
      businessPhone: '+1 (503) 555-0148',
      hours: 'Daily 7:00 AM – 5:00 PM PST',
      managingChatGPTAccount: 'admin@solsticeroasters.com',
      description: 'Small-batch single-origin coffee roaster offering direct-to-consumer subscriptions and wholesale espresso blends.',
      deliveryPolicyUrl: 'https://solsticeroasters.com/shipping',
      returnPolicyUrl: 'https://solsticeroasters.com/returns',
      productFeedUrl: 'https://solsticeroasters.com/feeds/openai-catalog.json'
    },
    domain: {
      primaryDomain: 'solsticeroasters.com',
      dnsProvider: 'Cloudflare',
      verificationMethod: 'dns_txt',
      txtHost: '@',
      txtValue: 'openai-domain-verification=solsticero-9f4c2a8e1b7d4032',
      spfStatus: 'configured',
      dmarcPolicy: 'p=reject',
      propagationStatus: 'verified',
      verifiedAt: '2026-11-12T16:20:00Z'
    },
    verificationDocs: {
      signatoryName: 'Marcus Vance',
      signatoryRole: 'Founder & Managing Member',
      einTaxId: '84-3920145',
      govIdType: 'Passport',
      personaStatus: 'approved',
      agencyLoaSigned: true,
      documents: [
        { id: 'doc-1', name: 'Articles_of_Organization_OR.pdf', type: 'Business Registration', size: '420 KB', status: 'verified' },
        { id: 'doc-2', name: 'Agency_LOA_Apex_Solstice_Signed.pdf', type: 'Agency Authorization', size: '185 KB', status: 'verified' },
        { id: 'doc-3', name: 'IRS_CP575_EIN_Confirmation.pdf', type: 'Tax ID Record', size: '310 KB', status: 'verified' }
      ]
    },
    insights: {
      blueCheckActive: true,
      loggedPeriodsCount: 1,
      monthlyMentions: 1420,
      websiteClicks: 386,
      topDiscoveryTopic: 'single origin espresso subscription',
      businessAgentStatus: 'published'
    },
    updatedAt: '2026-11-17T18:10:00Z'
  },
  {
    id: 'client-lumina-medtech',
    agencyId: 'apex-digital',
    currentStep: 4,
    stepStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'in_progress',
      5: 'pending',
      6: 'pending'
    },
    checklistProgress: {
      '1_0': true, '1_1': true, '1_2': true,
      '2_0': true, '2_1': true, '2_2': true,
      '3_0': true, '3_1': true, '3_2': true,
      '4_0': true, '4_1': true, '4_2': false
    },
    eligibility: {
      category: 'Online Service Business',
      operatingCountry: 'United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'Yes — existing paid workspace',
      confirmed: true
    },
    business: {
      legalName: 'Lumina Clinical Diagnostics Inc.',
      dbaName: 'Lumina Health',
      websiteUrl: 'https://luminahealth.io',
      category: 'Online Service Business',
      address: '200 Clarendon St, Suite 1400, Boston, MA 02116',
      businessEmail: 'compliance@luminahealth.io',
      businessPhone: '+1 (617) 555-0193',
      hours: 'Mon–Fri 8:00 AM – 7:00 PM EST',
      managingChatGPTAccount: 'it-admin@luminahealth.io',
      description: 'At-home preventive biomarker testing kits and clinician-reviewed metabolic wellness reports.',
      deliveryPolicyUrl: 'https://luminahealth.io/kit-delivery',
      returnPolicyUrl: 'https://luminahealth.io/refund-policy',
      productFeedUrl: ''
    },
    domain: {
      primaryDomain: 'luminahealth.io',
      dnsProvider: 'AWS Route 53',
      verificationMethod: 'dns_txt',
      txtHost: '@',
      txtValue: 'openai-domain-verification=luminaheal-7c2e19b04a6d8110',
      spfStatus: 'configured',
      dmarcPolicy: 'p=quarantine',
      propagationStatus: 'verified',
      verifiedAt: '2026-11-15T11:05:00Z'
    },
    verificationDocs: {
      signatoryName: 'Dr. Priya Nair',
      signatoryRole: 'Chief Operating Officer',
      einTaxId: '92-1184730',
      govIdType: 'Driver License',
      personaStatus: 'pending_review',
      agencyLoaSigned: false,
      documents: [
        { id: 'doc-4', name: 'DE_Certificate_of_Good_Standing.pdf', type: 'Business Registration', size: '512 KB', status: 'verified' },
        { id: 'doc-5', name: 'Lumina_LOA_Draft.pdf', type: 'Agency Authorization', size: '140 KB', status: 'pending' }
      ]
    },
    insights: {
      blueCheckActive: false,
      loggedPeriodsCount: 0,
      monthlyMentions: 0,
      websiteClicks: 0,
      topDiscoveryTopic: '',
      businessAgentStatus: 'not_eligible'
    },
    updatedAt: '2026-11-18T09:42:00Z'
  },
  {
    id: 'client-kestrel-outdoor',
    agencyId: 'apex-digital',
    currentStep: 3,
    stepStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'action_required',
      4: 'pending',
      5: 'pending',
      6: 'pending'
    },
    checklistProgress: {
      '1_0': true, '1_1': true, '1_2': true,
      '2_0': true, '2_1': true, '2_2': true,
      '3_0': true, '3_1': false, '3_2': false
    },
    eligibility: {
      category: 'Online Ecommerce / Shopify Store',
      operatingCountry: 'United States',
      hubPresence: 'Not listed (missing from Hub search)',
      paidWorkspace: 'No — free / standard ChatGPT account only',
      confirmed: true
    },
    business: {
      legalName: 'Kestrel Alpine Equipment Corp.',
      dbaName: 'Kestrel Gear',
      websiteUrl: 'https://kestrelgear.com',
      category: 'Online Ecommerce / Shopify Store',
      address: '1540 Pearl St, Boulder, CO 80302',
      businessEmail: 'hello@kestrelgear.com',
      businessPhone: '+1 (303) 555-0172',
      hours: 'Mon–Sat 9:00 AM – 6:00 PM MST',
      managingChatGPTAccount: 'founder@kestrelgear.com',
      description: 'Ultralight backcountry tents, technical shells, and modular alpine packs engineered in Colorado.',
      deliveryPolicyUrl: 'https://kestrelgear.com/pages/shipping',
      returnPolicyUrl: 'https://kestrelgear.com/pages/warranty-returns',
      productFeedUrl: 'https://kestrelgear.com/apps/chatgpt-feed'
    },
    domain: {
      primaryDomain: 'kestrelgear.com',
      dnsProvider: 'GoDaddy',
      verificationMethod: 'dns_txt',
      txtHost: '@',
      txtValue: 'openai-domain-verification=kestrelgea-3d8a44f21c09e512',
      spfStatus: 'missing',
      dmarcPolicy: 'p=none',
      propagationStatus: 'propagating',
      verifiedAt: ''
    },
    verificationDocs: {
      signatoryName: 'Hannah Lindqvist',
      signatoryRole: 'VP of E-Commerce',
      einTaxId: '47-8832910',
      govIdType: 'Passport',
      personaStatus: 'pending',
      agencyLoaSigned: true,
      documents: [
        { id: 'doc-6', name: 'Agency_LOA_Kestrel_Signed.pdf', type: 'Agency Authorization', size: '198 KB', status: 'verified' }
      ]
    },
    insights: {
      blueCheckActive: false,
      loggedPeriodsCount: 0,
      monthlyMentions: 0,
      websiteClicks: 0,
      topDiscoveryTopic: '',
      businessAgentStatus: 'not_eligible'
    },
    updatedAt: '2026-11-18T11:15:00Z'
  },
  {
    id: 'client-nordic-home',
    agencyId: 'northstar-commerce',
    currentStep: 5,
    stepStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'completed',
      5: 'in_progress',
      6: 'pending'
    },
    checklistProgress: {
      '1_0': true, '1_1': true, '1_2': true,
      '2_0': true, '2_1': true, '2_2': true,
      '3_0': true, '3_1': true, '3_2': true,
      '4_0': true, '4_1': true, '4_2': true,
      '5_0': true, '5_1': true, '5_2': false
    },
    eligibility: {
      category: 'Online Ecommerce / Shopify Store',
      operatingCountry: 'United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'Yes — existing paid workspace',
      confirmed: true
    },
    business: {
      legalName: 'Nordic Timber & Living LLC',
      dbaName: 'Nordic Home Studio',
      websiteUrl: 'https://nordichomestudio.com',
      category: 'Online Ecommerce / Shopify Store',
      address: '712 E Pike St, Seattle, WA 98122',
      businessEmail: 'support@nordichomestudio.com',
      businessPhone: '+1 (206) 555-0164',
      hours: 'Tue–Sun 10:00 AM – 6:00 PM PST',
      managingChatGPTAccount: 'owner@nordichomestudio.com',
      description: 'FSC-certified solid ash and oak furniture crafted for minimalist residential and studio spaces.',
      deliveryPolicyUrl: 'https://nordichomestudio.com/freight-delivery',
      returnPolicyUrl: 'https://nordichomestudio.com/30-day-returns',
      productFeedUrl: 'https://nordichomestudio.com/shopify-openai-feed.xml'
    },
    domain: {
      primaryDomain: 'nordichomestudio.com',
      dnsProvider: 'Namecheap',
      verificationMethod: 'shopify',
      txtHost: '@',
      txtValue: 'openai-domain-verification=nordichome-6e1b90c42a77d301',
      spfStatus: 'configured',
      dmarcPolicy: 'p=quarantine',
      propagationStatus: 'verified',
      verifiedAt: '2026-11-14T08:40:00Z'
    },
    verificationDocs: {
      signatoryName: 'Soren Halvorsen',
      signatoryRole: 'Managing Director',
      einTaxId: '81-5520934',
      govIdType: 'Passport',
      personaStatus: 'approved',
      agencyLoaSigned: true,
      documents: [
        { id: 'doc-7', name: 'WA_Business_License_Nordic.pdf', type: 'Business Registration', size: '295 KB', status: 'verified' },
        { id: 'doc-8', name: 'Agency_LOA_Northstar_Nordic.pdf', type: 'Agency Authorization', size: '172 KB', status: 'verified' }
      ]
    },
    insights: {
      blueCheckActive: true,
      loggedPeriodsCount: 1,
      monthlyMentions: 612,
      websiteClicks: 149,
      topDiscoveryTopic: 'solid oak minimalist dining table',
      businessAgentStatus: 'draft'
    },
    updatedAt: '2026-11-18T07:55:00Z'
  },
  {
    id: 'client-atelier-forma',
    agencyId: 'vanguard-seo',
    currentStep: 1,
    stepStatuses: {
      1: 'in_progress',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
      6: 'pending'
    },
    checklistProgress: {
      '1_0': true, '1_1': false, '1_2': false
    },
    eligibility: {
      category: 'Online Service Business',
      operatingCountry: 'Outside United States',
      hubPresence: 'Already listed (appears in Hub search)',
      paidWorkspace: 'No — free / standard ChatGPT account only',
      confirmed: true
    },
    business: {
      legalName: 'Atelier Forma Architectural Lighting GmbH',
      dbaName: 'Atelier Forma',
      websiteUrl: 'https://atelierforma.eu',
      category: 'Online Service Business',
      address: 'Torstraße 112, 10119 Berlin, Germany',
      businessEmail: 'studio@atelierforma.eu',
      businessPhone: '+49 30 555 0189',
      hours: 'Mon–Fri 9:00 AM – 6:00 PM CET',
      managingChatGPTAccount: 'admin@atelierforma.eu',
      description: 'Bespoke architectural lighting design and commercial luminaire fabrication across Europe.',
      deliveryPolicyUrl: 'https://atelierforma.eu/logistics',
      returnPolicyUrl: 'https://atelierforma.eu/terms',
      productFeedUrl: ''
    },
    domain: {
      primaryDomain: 'atelierforma.eu',
      dnsProvider: 'Cloudflare',
      verificationMethod: 'dns_txt',
      txtHost: '@',
      txtValue: 'openai-domain-verification=atelierfor-5b9c01e83d22a740',
      spfStatus: 'configured',
      dmarcPolicy: 'p=reject',
      propagationStatus: 'verified',
      verifiedAt: '2026-11-16T14:12:00Z'
    },
    verificationDocs: {
      signatoryName: 'Lukas Weber',
      signatoryRole: 'Geschäftsführer',
      einTaxId: 'DE318492014',
      govIdType: 'National ID',
      personaStatus: 'pending',
      agencyLoaSigned: true,
      documents: [
        { id: 'doc-9', name: 'Handelsregister_Auszug_Berlin.pdf', type: 'Business Registration', size: '640 KB', status: 'verified' }
      ]
    },
    insights: {
      blueCheckActive: false,
      loggedPeriodsCount: 0,
      monthlyMentions: 0,
      websiteClicks: 0,
      topDiscoveryTopic: '',
      businessAgentStatus: 'not_eligible'
    },
    updatedAt: '2026-11-17T22:30:00Z'
  }
];
