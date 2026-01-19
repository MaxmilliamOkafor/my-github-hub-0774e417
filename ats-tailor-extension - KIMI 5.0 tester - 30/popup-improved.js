// ATS Tailored CV & Cover Letter - Popup Script (Improved with Kimi K2 Direct)
// Uses CVFormatterPerfect for guaranteed consistent formatting
// Direct Kimi K2 API integration for 40-50s generation

const SUPABASE_URL = 'https://wntpldomgjutwufphnpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudHBsZG9tZ2p1dHd1ZnBobnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDY0NDAsImV4cCI6MjA4MjE4MjQ0MH0.vOXBQIg6jghsAby2MA1GfE-MNTRZ9Ny1W2kfUHGUzNM';

// ============ TIER 1-2 TECH COMPANY DETECTION (70+ companies) ============
const TIER1_TECH_COMPANIES = {
  faang: new Set(['google','meta','amazon','microsoft','apple','facebook']),
  enterprise: new Set(['salesforce','ibm','oracle','adobe','sap','vmware','servicenow','workday']),
  fintech: new Set(['stripe','paypal','visa','mastercard','block','square']),
  saas: new Set(['hubspot','intercom','zendesk','docusign','twilio','slack','atlassian','gitlab','circleci','datadog','datadoghq','unity','udemy']),
  social: new Set(['linkedin','tiktok','bytedance','snap','snapchat','dropbox','bloomberg']),
  hardware: new Set(['intel','broadcom','arm','armholdings','tsmc','appliedmaterials','cisco','nvidia','amd','qualcomm']),
  finance: new Set(['fidelity','morganstanley','jpmorgan','jpmorganchase','blackrock','capitalone','tdsecurities','kpmg','deloitte','accenture','pwc','ey','mckinsey','kkr','fenergo']),
  quant: new Set(['citadel','janestreet','sig','twosigma','deshaw','rentec','renaissancetechnologies','mlp','millennium','virtu','virtufinancial','hudsontrading','hrt','jumptrading']),
  other: new Set(['netflix','tesla','uber','airbnb','palantir','crowdstrike','snowflake','intuit','toast','toasttab','workhuman','draftkings','walmart','roblox','doordash','instacart','rivian','chime','wasabi','wasabitechnologies','samsara','blockchain','similarweb','deepmind','googledeepmind'])
};

const SUPPORTED_HOSTS = [
  'greenhouse.io', 'job-boards.greenhouse.io', 'boards.greenhouse.io',
  'workday.com', 'myworkdayjobs.com', 'smartrecruiters.com',
  'bullhornstaffing.com', 'bullhorn.com', 'teamtailor.com',
  'workable.com', 'apply.workable.com', 'icims.com',
  'oracle.com', 'oraclecloud.com', 'taleo.net',
  'google.com', 'meta.com', 'amazon.com', 'microsoft.com', 'apple.com',
  'salesforce.com', 'ibm.com', 'adobe.com', 'stripe.com', 'hubspot.com',
  'intel.com', 'servicenow.com', 'workhuman.com', 'intercom.com', 'paypal.com',
  'tiktok.com', 'linkedin.com', 'dropbox.com', 'twilio.com', 'datadoghq.com',
  'toasttab.com', 'zendesk.com', 'docusign.com', 'fidelity.com', 'sap.com',
  'morganstanley.com', 'kpmg.com', 'deloitte.com', 'accenture.com', 'pwc.com',
  'ey.com', 'citadel.com', 'janestreet.com', 'sig.com', 'twosigma.com',
  'deshaw.com', 'rentec.com', 'mlp.com', 'virtu.com', 'hudsontrading.com',
  'jumptrading.com', 'broadcom.com', 'slack.com', 'circleci.com', 'unity.com',
  'bloomberg.com', 'vmware.com', 'mckinsey.com', 'udemy.com', 'draftkings.com',
  'walmart.com', 'mastercard.com', 'visa.com', 'blackrock.com', 'tdsecurities.com',
  'kkr.com', 'fenergo.com', 'appliedmaterials.com', 'tsmc.com', 'arm.com',
  'deepmind.google', 'cisco.com', 'jpmorgan.com', 'gitlab.com', 'atlassian.com',
  'snap.com', 'capitalone.com', 'wasabi.com', 'samsara.com', 'blockchain.com',
  'similarweb.com', 'nvidia.com', 'tesla.com', 'uber.com', 'airbnb.com',
  'palantir.com', 'crowdstrike.com', 'snowflake.com', 'netflix.com', 'amd.com'
];

const MAX_JD_LENGTH = 10000;
const CACHE_EXPIRY_MS = 30 * 60 * 1000;

class ATSTailorImproved {
  constructor() {
    this.session = null;
    this.currentJob = null;
    this.generatedDocuments = { 
      cv: null, 
      coverLetter: null, 
      cvPdf: null, 
      coverPdf: null, 
      cvFileName: null, 
      coverFileName: null,
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      keywords: null
    };
    this.stats = { today: 0, total: 0, avgTime: 0, times: [] };
    this.currentPreviewTab = 'cv';
    this.autoTailorEnabled = true;
    this.aiProvider = 'kimi';
    this.kimiAPIKey = null;
    this.workdayState = {
      currentStep: 0,
      totalSteps: 0,
      formData: {},
      jobId: null,
      startedAt: null,
      lastUpdated: null
    };
    this.baseCVContent = null;
    this.baseCVSource = null;
    this.jdCache = new Map();
    this.keywordCache = new Map();
    this._coverageOriginalCV = '';
    this._defaultLocation = 'Dublin, IE';
    this._domRefs = {};

    this.init();
  }

  getDomRef(id) {
    if (!this._domRefs[id]) {
      this._domRefs[id] = document.getElementById(id);
    }
    return this._domRefs[id];
  }

  async init() {
    await this.loadSession();
    await this.loadAIProviderSettings();
    await this.loadWorkdayState();
    await this.loadBaseCVFromProfile();
    this.bindEvents();
    this.updateUI();
    this.updateAIProviderUI();

    if (this.session) {
      await this.refreshSessionIfNeeded();
      await this.detectCurrentJob();
    }
  }

  async loadAIProviderSettings() {
    return new Promise(async (resolve) => {
      // Load Kimi API key
      const storage = await new Promise(resolve => {
        chrome.storage.local.get(['kimi_api_key', 'ai_provider', 'ai_settings'], resolve);
      });
      
      this.kimiAPIKey = storage.kimi_api_key || null;
      this.aiProvider = storage.ai_provider || storage.ai_settings?.provider || 'kimi';
      
      console.log('[ATS Tailor] AI Provider loaded:', this.aiProvider, 'Kimi API Key:', this.kimiAPIKey ? 'Set' : 'Not set');
      
      // If we have a session, try to load from profile
      if (this.session?.access_token && this.session?.user?.id) {
        try {
          const profileRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${this.session.user.id}&select=preferred_ai_provider,openai_enabled,kimi_enabled,openai_api_key,kimi_api_key`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${this.session.access_token}`,
              },
            }
          );
          
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            const profile = profiles?.[0];
            
            if (profile) {
              const preferredProvider = profile.preferred_ai_provider || 'kimi';
              const kimiEnabled = profile.kimi_enabled ?? true;
              const openaiEnabled = profile.openai_enabled ?? true;
              const hasKimiKey = !!profile.kimi_api_key;
              const hasOpenAIKey = !!profile.openai_api_key;
              
              // Update Kimi API key if available
              if (profile.kimi_api_key) {
                this.kimiAPIKey = profile.kimi_api_key;
                await chrome.storage.local.set({ kimi_api_key: profile.kimi_api_key });
              }
              
              if (preferredProvider === 'kimi' && kimiEnabled && (hasKimiKey || this.kimiAPIKey)) {
                this.aiProvider = 'kimi';
              } else if (preferredProvider === 'openai' && openaiEnabled && hasOpenAIKey) {
                this.aiProvider = 'openai';
              } else if (kimiEnabled && (hasKimiKey || this.kimiAPIKey)) {
                this.aiProvider = 'kimi';
              } else if (openaiEnabled && hasOpenAIKey) {
                this.aiProvider = 'openai';
              } else {
                this.aiProvider = 'kimi';
              }
              
              console.log('[ATS Tailor] AI Provider loaded from profile:', this.aiProvider);
            }
          }
        } catch (e) {
          console.warn('[ATS Tailor] Could not load AI provider from profile:', e);
        }
      }
      
      resolve();
    });
  }

  async saveAIProviderSettings() {
    // Save to local storage
    await chrome.storage.local.set({ 
      ai_provider: this.aiProvider,
      ai_settings: { provider: this.aiProvider, savedAt: Date.now() }
    });
    
    // Also save Kimi API key if set
    if (this.kimiAPIKey) {
      await chrome.storage.local.set({ kimi_api_key: this.kimiAPIKey });
    }
    
    if (this.session?.access_token && this.session?.user?.id) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${this.session.user.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${this.session.access_token}`,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              preferred_ai_provider: this.aiProvider
            })
          }
        );
        console.log('[ATS Tailor] AI Provider saved to profile:', this.aiProvider);
      } catch (e) {
        console.warn('[ATS Tailor] Could not save AI provider to profile:', e);
      }
    }
    
    console.log('[ATS Tailor] AI Provider saved:', this.aiProvider);
  }

  selectAIProvider(provider) {
    this.aiProvider = provider;
    this.saveAIProviderSettings();
    this.updateAIProviderUI();
    this.showToast(`AI Provider set to ${provider === 'kimi' ? 'Kimi K2' : 'OpenAI'}`, 'success');
  }

  updateAIProviderUI() {
    const btnKimi = this.getDomRef('btnKimi');
    const btnOpenAI = this.getDomRef('btnOpenAI');
    const modelLabel = this.getDomRef('aiModelLabel');
    const badgeDot = activeLabel?.querySelector('.badge-dot');
    const badgeText = activeLabel?.querySelector('.badge-text');
    
    if (btnKimi) {
      btnKimi.classList.toggle('selected', this.aiProvider === 'kimi');
    }
    if (btnOpenAI) {
      btnOpenAI.classList.toggle('selected', this.aiProvider === 'openai');
    }
    
    if (badgeDot) {
      badgeDot.classList.remove('kimi', 'openai');
      badgeDot.classList.add(this.aiProvider);
    }
    if (badgeText) {
      badgeText.textContent = this.aiProvider === 'kimi' ? 'Kimi K2' : 'OpenAI';
    }
    if (modelLabel) {
      modelLabel.textContent = this.aiProvider === 'kimi' ? 'kimi-k2-0711-preview' : 'gpt-4o-mini';
    }
    
    // Update Kimi API key status
    const kimiKeyStatus = this.getDomRef('kimiKeyStatus');
    if (kimiKeyStatus) {
      if (this.kimiAPIKey) {
        kimiKeyStatus.textContent = '✅ API Key Set';
        kimiKeyStatus.className = 'api-status set';
      } else {
        kimiKeyStatus.textContent = '⚠️ API Key Required';
        kimiKeyStatus.className = 'api-status missing';
      }
    }
  }

  // ============ KIMI API KEY MANAGEMENT ============
  async saveKimiAPIKey(apiKey) {
    this.kimiAPIKey = apiKey;
    await chrome.storage.local.set({ kimi_api_key: apiKey });
    
    // Also save to profile if logged in
    if (this.session?.access_token && this.session?.user?.id) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${this.session.user.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${this.session.access_token}`,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              kimi_api_key: apiKey
            })
          }
        );
        console.log('[ATS Tailor] Kimi API key saved to profile');
      } catch (e) {
        console.warn('[ATS Tailor] Could not save Kimi API key to profile:', e);
      }
    }
    
    this.updateAIProviderUI();
    this.showToast('Kimi API Key saved successfully', 'success');
  }

  // ============ TAILORING WITH DIRECT KIMI K2 ============
  async tailorWithKimiDirect(jobInfo, candidateData, baseCV) {
    const startTime = performance.now();
    
    if (!this.kimiAPIKey) {
      throw new Error('Kimi API key not set. Please add your API key in the extension settings.');
    }
    
    updateProgress(25, 'Step 1/3: Extracting keywords with Kimi K2...');
    
    // Extract keywords
    const keywords = await this.callKimiAPI(
      `Extract the top 30 most important keywords from this job description for ATS optimization:\n\nJob: ${jobInfo.title} at ${jobInfo.company}\n\n${jobInfo.description}`,
      'Return a JSON array of keywords'
    );
    
    const keywordList = this.parseKeywords(keywords);
    
    updateProgress(50, 'Step 2/3: Tailoring CV with Kimi K2 (15-20s)...');
    
    // Tailor CV
    const tailoredCV = await this.callKimiAPI(
      `Tailor this CV for the job. Incorporate these keywords naturally: ${keywordList.join(', ')}\n\n=== JOB ===\n${jobInfo.title} at ${jobInfo.company}\n${jobInfo.description}\n\n=== CV ===\n${baseCV}`,
      'Return only the tailored CV text'
    );
    
    updateProgress(75, 'Step 3/3: Generating cover letter with Kimi K2 (10-15s)...');
    
    // Generate cover letter
    const coverLetter = await this.callKimiAPI(
      `Write a compelling cover letter for ${jobInfo.title} at ${jobInfo.company}.\n\nJob Description:\n${jobInfo.description}\n\nCandidate: ${candidateData.firstName || ''} ${candidateData.lastName || ''}\n${candidateData.email || ''}`,
      'Return only the cover letter text'
    );
    
    const totalTime = (performance.now() - startTime) / 1000;
    console.log(`[ATS Tailor] ✅ Kimi K2 tailoring complete in ${totalTime.toFixed(1)}s`);
    
    return {
      tailoredResume: tailoredCV,
      tailoredCoverLetter: coverLetter,
      keywords: keywordList,
      matchScore: this.calculateMatchScore(tailoredCV, keywordList),
      totalTime
    };
  }
  
  async callKimiAPI(prompt, instruction) {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.kimiAPIKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-0711-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS optimization specialist. ${instruction}. Use UK English spelling.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  parseKeywords(text) {
    try {
      // Try to parse as JSON array
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      // Fallback: extract comma-separated values
    }
    
    // Fallback: split by common delimiters
    return text.split(/[,\n]/).map(k => k.trim()).filter(k => k.length > 2);
  }
  
  calculateMatchScore(cv, keywords) {
    if (!keywords.length) return 0;
    
    const cvLower = cv.toLowerCase();
    let matched = 0;
    
    for (const keyword of keywords) {
      if (cvLower.includes(keyword.toLowerCase())) {
        matched++;
      }
    }
    
    return Math.round((matched / keywords.length) * 100);
  }

  // ============ MAIN TAILOR FUNCTION ============
  async tailorDocuments() {
    if (this.tailoringInProgress) {
      this.showToast('Tailoring already in progress', 'warning');
      return;
    }
    
    this.tailoringInProgress = true;
    this.getDomRef('tailorBtn').disabled = true;
    this.getDomRef('tailorBtn').textContent = 'Tailoring...';
    
    try {
      const startTime = Date.now();
      
      // Get job info
      const jobInfo = await this.getCurrentJobInfo();
      if (!jobInfo?.title) {
        throw new Error('No job information available');
      }
      
      // Get base CV
      const baseCV = await this.getBaseCV();
      if (!baseCV) {
        throw new Error('No base CV available');
      }
      
      // Get candidate data
      const candidateData = await this.getCandidateData();
      
      let result;
      
      // Use direct Kimi K2 if API key is available
      if (this.kimiAPIKey && this.aiProvider === 'kimi') {
        console.log('[ATS Tailor] 🚀 Using DIRECT Kimi K2 API for 40-50s generation');
        result = await this.tailorWithKimiDirect(jobInfo, candidateData, baseCV);
      } else {
        // Fallback to Supabase function
        console.log('[ATS Tailor] 🔄 Using Supabase function (fallback)');
        result = await this.tailorWithSupabase(jobInfo, candidateData, baseCV);
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      // Store results
      this.generatedDocuments = {
        cv: result.tailoredResume,
        coverLetter: result.tailoredCoverLetter,
        cvPdf: result.resumePdf || null,
        coverPdf: result.coverLetterPdf || null,
        cvFileName: result.cvFileName || `CV_${jobInfo.company || 'Application'}.pdf`,
        coverFileName: result.coverLetterFileName || `Cover_Letter_${jobInfo.company || 'Application'}.pdf`,
        matchScore: result.matchScore || 0,
        keywords: result.keywords || []
      };
      
      // Update UI
      this.displayResults();
      this.updateStats(totalTime);
      
      this.showToast(`✅ Generated in ${totalTime.toFixed(1)}s! Match: ${result.matchScore || 0}%`, 'success');
      
      // Auto-download if enabled
      const settings = await new Promise(resolve => {
        chrome.storage.local.get(['autoDownload'], resolve);
      });
      
      if (settings.autoDownload) {
        this.downloadCV();
        this.downloadCoverLetter();
      }
      
    } catch (error) {
      console.error('[ATS Tailor] Tailoring failed:', error);
      this.showToast(`❌ Error: ${error.message}`, 'error');
    } finally {
      this.tailoringInProgress = false;
      this.getDomRef('tailorBtn').disabled = false;
      this.getDomRef('tailorBtn').textContent = 'Tailor CV & Cover Letter';
    }
  }

  // ============ UI BINDINGS ============
  bindEvents() {
    // AI Provider selection
    document.getElementById('btnKimi')?.addEventListener('click', () => this.selectAIProvider('kimi'));
    document.getElementById('btnOpenAI')?.addEventListener('click', () => this.selectAIProvider('openai'));
    
    // Kimi API Key save
    document.getElementById('saveKimiKey')?.addEventListener('click', () => {
      const key = document.getElementById('kimiAPIKeyInput')?.value?.trim();
      if (key) {
        this.saveKimiAPIKey(key);
        document.getElementById('kimiAPIKeyInput').value = '';
      } else {
        this.showToast('Please enter a Kimi API key', 'error');
      }
    });
    
    // Tailor button
    document.getElementById('tailorBtn')?.addEventListener('click', () => this.tailorDocuments());
    
    // Download buttons
    document.getElementById('downloadCv')?.addEventListener('click', () => this.downloadCV());
    document.getElementById('downloadCover')?.addEventListener('click', () => this.downloadCoverLetter());
    
    // Text download buttons
    document.getElementById('downloadCvText')?.addEventListener('click', () => this.downloadTextVersion('cv'));
    document.getElementById('downloadCoverText')?.addEventListener('click', () => this.downloadTextVersion('cover'));
    
    // Bulk Apply Dashboard
    document.getElementById('openBulkApply')?.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('bulk-apply.html') });
    });
    
    // Auto Tailor toggle
    document.getElementById('autoTailorToggle')?.addEventListener('change', (e) => {
      const enabled = !!e.target?.checked;
      this.autoTailorEnabled = enabled;
      chrome.storage.local.set({ ats_autoTailorEnabled: enabled });
      this.showToast(`Auto-tailor ${enabled ? 'enabled' : 'disabled'}`, 'success');
    });
    
    // Settings toggle
    document.getElementById('settingsToggle')?.addEventListener('click', () => {
      const settings = document.getElementById('settingsPanel');
      settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
    });
  }

  // ============ HELPER METHODS ============
  showToast(message, type = 'info') {
    // Implementation depends on your UI framework
    console.log(`[ATS Tailor] ${type}: ${message}`);
  }
  
  updateProgress(percent, text) {
    // Implementation depends on your UI
    console.log(`[ATS Tailor] Progress: ${percent}% - ${text}`);
  }
  
  displayResults() {
    // Implementation depends on your UI
    console.log('[ATS Tailor] Displaying results...');
  }
  
  updateStats(time) {
    this.stats.times.push(time);
    this.stats.total++;
    this.stats.today++;
    this.stats.avgTime = this.stats.times.reduce((a, b) => a + b, 0) / this.stats.times.length;
  }

  // ============ DOWNLOAD METHODS ============
  downloadCV() {
    if (this.generatedDocuments.cv) {
      this.downloadTextFile(this.generatedDocuments.cv, this.generatedDocuments.cvFileName.replace('.pdf', '.txt'));
    }
  }
  
  downloadCoverLetter() {
    if (this.generatedDocuments.coverLetter) {
      this.downloadTextFile(this.generatedDocuments.coverLetter, this.generatedDocuments.coverFileName.replace('.pdf', '.txt'));
    }
  }
  
  downloadTextVersion(type) {
    const content = type === 'cv' ? this.generatedDocuments.cv : this.generatedDocuments.coverLetter;
    const filename = type === 'cv' ? this.generatedDocuments.cvFileName : this.generatedDocuments.coverFileName;
    if (content) {
      this.downloadTextFile(content, filename.replace('.pdf', '_formatted.txt'));
    }
  }
  
  downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ATSTailorImproved();
});
