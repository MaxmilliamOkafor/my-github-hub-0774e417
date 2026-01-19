// content.js - AUTO-TAILOR + ATTACH v2.0 with DIRECT KIMI K2 API
// Direct Kimi K2 integration for 40-50s generation time

(function() {
  'use strict';

  console.log('[ATS Tailor] AUTO-TAILOR v2.0 with DIRECT KIMI K2 loaded on:', window.location.hostname);

  // ============ CONFIGURATION ============
  const SUPABASE_URL = 'https://wntpldomgjutwufphnpg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudHBsZG9tZ2p1dHd1ZnBobnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDY0NDAsImV4cCI6MjA4MjE4MjQ0MH0.vOXBQIg6jghsAby2MA1GfE-MNTRZ9Ny1W2kfUHGUzNM';
  
  // Kimi K2 API Configuration
  const KIMI_API_BASE = 'https://api.moonshot.cn';
  const KIMI_MODEL = 'kimi-k2-0711-preview'; // Latest K2 model for fastest generation
  
  // ============ PERFORMANCE TARGETS (40-50s TOTAL) ============
  const PERF_TARGETS = {
    EXTRACT_KEYWORDS: 3000,      // 3s - Kimi K2 keyword extraction
    TAILOR_CV: 15000,            // 15s - CV tailoring
    TAILOR_COVER: 10000,         // 10s - Cover letter generation
    GENERATE_PDF: 5000,          // 5s - PDF generation
    ATTACH_FILES: 2000,          // 2s - File attachment
    TOTAL: 45000                 // 45s total target
  };

  // ============ KIMI K2 API CLIENT ============
  class KimiAPI {
    constructor() {
      this.apiKey = null;
      this.baseURL = KIMI_API_BASE;
      this.model = KIMI_MODEL;
    }
    
    setApiKey(key) {
      this.apiKey = key;
    }
    
    async makeRequest(endpoint, data, stream = false) {
      if (!this.apiKey) {
        throw new Error('Kimi API key not set');
      }
      
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ATS-Tailor-Extension/2.0'
      };
      
      if (stream) {
        headers['Accept'] = 'text/plain';
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kimi API error: ${response.status} - ${error}`);
      }
      
      if (stream) {
        return response.text();
      }
      
      return response.json();
    }
    
    // Extract keywords from job description using Kimi K2
    async extractKeywords(jobDescription, jobTitle, company) {
      const prompt = `Extract the top 30 most important keywords and phrases from this job description for ATS optimization.

Job Title: ${jobTitle}
Company: ${company}

Job Description:
${jobDescription}

Return a JSON object with this structure:
{
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "technicalSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "experience": ["experience1", "experience2", ...],
  "education": ["education1", "education2", ...],
  "certifications": ["cert1", "cert2", ...]
}

Focus on technical skills, tools, programming languages, frameworks, and specific domain expertise.`;

      const response = await this.makeRequest('/v1/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS (Applicant Tracking System) optimization specialist. Extract keywords precisely and return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });
      
      const content = response.choices[0].message.content;
      
      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('[KimiAPI] Could not parse keyword JSON, falling back to text extraction');
      }
      
      // Fallback: extract keywords manually
      return this.fallbackKeywordExtraction(jobDescription);
    }
    
    // Tailor CV using Kimi K2
    async tailorCV(baseCV, jobDescription, jobTitle, company, keywords, candidateProfile) {
      const prompt = `You are an expert CV writer specializing in ATS optimization. Tailor this CV to match the job description.

=== CANDIDATE PROFILE ===
Name: ${candidateProfile.firstName} ${candidateProfile.lastName}
Email: ${candidateProfile.email}
Phone: ${candidateProfile.phone}
LinkedIn: ${candidateProfile.linkedin || 'N/A'}

=== BASE CV ===
${baseCV}

=== JOB DESCRIPTION ===
Job Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

=== KEYWORDS TO INJECT ===
${keywords.join(', ')}

=== INSTRUCTIONS ===
1. Rewrite the CV to be ATS-optimized for this specific job
2. Naturally incorporate as many keywords as possible
3. Keep the CV concise (1-2 pages)
4. Maintain UK English spelling (optimised, analysed, etc.)
5. Use proper bullet points (•) not hyphens
6. Format work experience as:
   Company Name
   Job Title – Start Date – End Date
   • Achievement/responsibility 1
   • Achievement/responsibility 2

7. Ensure the CV passes ATS parsing
8. Highlight relevant experience that matches the job requirements

Return only the tailored CV text, no explanations.`;

      const response = await this.makeRequest('/v1/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert CV writer. Generate ATS-optimized CVs with proper formatting. Return only the CV text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });
      
      return response.choices[0].message.content.trim();
    }
    
    // Generate cover letter using Kimi K2
    async generateCoverLetter(jobDescription, jobTitle, company, candidateProfile, tailoredCV) {
      const prompt = `Write a compelling cover letter for this job application.

=== CANDIDATE PROFILE ===
Name: ${candidateProfile.firstName} ${candidateProfile.lastName}
Email: ${candidateProfile.email}
Phone: ${candidateProfile.phone}

=== JOB DETAILS ===
Job Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

=== TAILORED CV SUMMARY ===
${tailoredCV.substring(0, 1000)}...

=== INSTRUCTIONS ===
1. Write a professional cover letter (3-4 paragraphs)
2. Address why you're interested in this role and company
3. Highlight 2-3 key qualifications that match the job
4. Show enthusiasm and cultural fit
5. Use UK English spelling
6. Keep it concise but impactful
7. End with a call to action

Return only the cover letter text, no explanations.`;

      const response = await this.makeRequest('/v1/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cover letter writer. Generate compelling, personalized cover letters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      });
      
      return response.choices[0].message.content.trim();
    }
    
    // Fallback keyword extraction
    fallbackKeywordExtraction(text) {
      const skills = [];
      const techTerms = /\b(?:JavaScript|Python|Java|C\+\+|C#|React|Angular|Vue|Node\.js|AWS|Azure|GCP|Docker|Kubernetes|SQL|NoSQL|MongoDB|PostgreSQL|Git|CI\/CD|Agile|Scrum|Machine Learning|AI|Data Science|Analytics|Cloud|Microservices|API|REST|GraphQL)\b/gi;
      let match;
      while ((match = techTerms.exec(text)) !== null) {
        skills.push(match[0]);
      }
      
      return {
        keywords: [...new Set(skills)].slice(0, 30),
        technicalSkills: [...new Set(skills)].slice(0, 15),
        softSkills: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork'],
        experience: [],
        education: [],
        certifications: []
      };
    }
  }

  // ============ TIER 1-2 TECH COMPANY DOMAINS (Exact Matching) ============
  const TIER1_COMPANY_DOMAINS = new Map([
    ['google.com', 'Google'], ['careers.google.com', 'Google'], ['about.google', 'Google'],
    ['meta.com', 'Meta'], ['metacareers.com', 'Meta'], ['facebook.com', 'Meta'],
    ['amazon.com', 'Amazon'], ['amazon.jobs', 'Amazon'], 
    ['microsoft.com', 'Microsoft'], ['careers.microsoft.com', 'Microsoft'],
    ['apple.com', 'Apple'], ['jobs.apple.com', 'Apple'],
    ['salesforce.com', 'Salesforce'], ['ibm.com', 'IBM'], ['oracle.com', 'Oracle'], 
    ['adobe.com', 'Adobe'], ['sap.com', 'SAP'], ['vmware.com', 'VMware'],
    ['servicenow.com', 'ServiceNow'], ['workday.com', 'Workday'],
    ['stripe.com', 'Stripe'], ['paypal.com', 'PayPal'], ['visa.com', 'Visa'],
    ['mastercard.com', 'Mastercard'], ['block.xyz', 'Block'], ['sq.com', 'Square'],
    ['hubspot.com', 'HubSpot'], ['intercom.com', 'Intercom'], ['zendesk.com', 'Zendesk'],
    ['docusign.com', 'DocuSign'], ['twilio.com', 'Twilio'], ['slack.com', 'Slack'],
    ['atlassian.com', 'Atlassian'], ['gitlab.com', 'GitLab'], ['circleci.com', 'CircleCI'],
    ['datadoghq.com', 'Datadog'], ['unity.com', 'Unity'], ['udemy.com', 'Udemy'],
    ['linkedin.com', 'LinkedIn'], ['tiktok.com', 'TikTok'], ['bytedance.com', 'ByteDance'],
    ['snap.com', 'Snapchat'], ['dropbox.com', 'Dropbox'], ['bloomberg.com', 'Bloomberg'],
    ['intel.com', 'Intel'], ['broadcom.com', 'Broadcom'], ['arm.com', 'Arm Holdings'],
    ['tsmc.com', 'TSMC'], ['appliedmaterials.com', 'Applied Materials'], ['cisco.com', 'Cisco'],
    ['fidelity.com', 'Fidelity'], ['morganstanley.com', 'Morgan Stanley'],
    ['jpmorgan.com', 'JP Morgan Chase'], ['blackrock.com', 'BlackRock'],
    ['capitalone.com', 'Capital One'], ['tdsecurities.com', 'TD Securities'],
    ['kpmg.com', 'KPMG'], ['deloitte.com', 'Deloitte'], ['accenture.com', 'Accenture'],
    ['pwc.com', 'PwC'], ['ey.com', 'EY'], ['mckinsey.com', 'McKinsey'], ['kkr.com', 'KKR'],
    ['fenergo.com', 'Fenergo'],
    ['citadel.com', 'Citadel'], ['janestreet.com', 'Jane Street'], ['sig.com', 'SIG'],
    ['twosigma.com', 'Two Sigma'], ['deshaw.com', 'DE Shaw'], ['rentec.com', 'Renaissance Technologies'],
    ['mlp.com', 'Millennium Management'], ['virtu.com', 'Virtu Financial'],
    ['hudsontrading.com', 'Hudson River Trading'], ['jumptrading.com', 'Jump Trading'],
    ['nvidia.com', 'Nvidia'], ['tesla.com', 'Tesla'], ['uber.com', 'Uber'],
    ['airbnb.com', 'Airbnb'], ['palantir.com', 'Palantir'], ['crowdstrike.com', 'CrowdStrike'],
    ['snowflake.com', 'Snowflake'], ['intuit.com', 'Intuit'], ['toasttab.com', 'Toast'],
    ['workhuman.com', 'Workhuman'], ['draftkings.com', 'DraftKings'],
    ['walmart.com', 'Walmart'], ['roblox.com', 'Roblox'], ['doordash.com', 'DoorDash'],
    ['instacart.com', 'Instacart'], ['rivian.com', 'Rivian'], ['chime.com', 'Chime'],
    ['wasabi.com', 'Wasabi Technologies'], ['samsara.com', 'Samsara'],
    ['blockchain.com', 'Blockchain.com'], ['similarweb.com', 'Similarweb'],
    ['deepmind.google', 'Google DeepMind'], ['netflix.com', 'Netflix'],
    ['amd.com', 'AMD'], ['qualcomm.com', 'Qualcomm']
  ]);

  // Normalize domain
  function normalizeDomain(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return domain.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  // Check if domain matches any Tier 1-2 company
  function matchTier1Domain(hostname) {
    const normalizedHost = hostname.replace(/^www\./, '').toLowerCase();
    
    if (TIER1_COMPANY_DOMAINS.has(normalizedHost)) {
      return { domain: normalizedHost, company: TIER1_COMPANY_DOMAINS.get(normalizedHost) };
    }
    
    for (const [domain, company] of TIER1_COMPANY_DOMAINS) {
      const baseDomain = domain.split('.').slice(-2).join('.');
      if (normalizedHost.includes(baseDomain.split('.')[0]) || normalizedHost.endsWith(baseDomain)) {
        return { domain, company };
      }
    }
    return null;
  }

  // ============ STATUS BANNER ============
  let bannerEl = null;
  let tailoringInProgress = false;

  function createStatusBanner() {
    if (bannerEl) return;
    
    bannerEl = document.createElement('div');
    bannerEl.id = 'ats-auto-banner';
    bannerEl.innerHTML = `
      <style>
        #ats-auto-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999999;
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          color: white;
          padding: 12px 20px;
          font: bold 14px system-ui, -apple-system, sans-serif;
          text-align: center;
          box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5);
          transition: all 0.3s ease;
        }
        #ats-auto-banner.success {
          background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
          color: #000;
        }
        #ats-auto-banner.error {
          background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        }
        #ats-auto-banner.working {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
        }
      </style>
      <span id="ats-banner-text">ATS Tailor ready</span>
    `;
    document.body.appendChild(bannerEl);
  }

  function updateBanner(text, type = 'working') {
    if (!bannerEl) createStatusBanner();
    const textEl = bannerEl.querySelector('#ats-banner-text');
    if (textEl) textEl.textContent = text;
    bannerEl.className = type;
  }

  // ============ JOB INFO EXTRACTION ============
  function extractJobInfo() {
    const hostname = window.location.hostname;
    const url = window.location.href;
    
    // Workday specific extraction
    if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) {
      return workdayUltraSnapshot();
    }
    
    // Generic extraction for other sites
    const titleSelectors = [
      'h1', 'h2', '[class*="title"]', '[class*="Title"]',
      '[data-automation-id*="title"]', '[data-automation-id*="Title"]'
    ];
    
    let title = '';
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        title = el.textContent.trim();
        break;
      }
    }
    
    const companySelectors = [
      '[class*="company"]', '[class*="Company"]', 
      '[data-automation-id*="company"]', '[data-automation-id*="Company"]'
    ];
    
    let company = '';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        company = el.textContent.trim();
        break;
      }
    }
    
    if (!company) {
      const tierMatch = matchTier1Domain(hostname);
      if (tierMatch) company = tierMatch.company;
    }
    
    const locationSelectors = [
      '[class*="location"]', '[class*="Location"]',
      '[data-automation-id*="location"]', '[data-automation-id*="Location"]'
    ];
    
    let location = '';
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        location = el.textContent.trim();
        break;
      }
    }
    
    const descSelectors = [
      '[class*="description"]', '[class*="Description"]',
      '[data-automation-id*="description"]', '[data-automation-id*="Description"]',
      '.job-description', '#job-description'
    ];
    
    let description = '';
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        description = el.textContent.trim().substring(0, 10000);
        break;
      }
    }
    
    return {
      title,
      company,
      location,
      description,
      url: window.location.href,
      platform: 'generic'
    };
  }

  // ============ WORKDAY SPECIFIC EXTRACTION ============
  async function workdayUltraSnapshot() {
    const start = performance.now();
    console.log('[ATS Workday] 📸 Capturing JD snapshot...');
    
    const jdSelectors = [
      '[data-automation-id="jobPostingDescription"]',
      '[data-automation-id="job-description"]',
      '.css-cygeeu',
      '[class*="jobDescription"]',
      '[class*="JobDescription"]',
      'article[role="article"]',
      '.job-description',
      '#job-description',
    ];
    
    let description = '';
    for (const sel of jdSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim().length > 200) {
        description = el.textContent.trim().substring(0, 10000);
        break;
      }
    }
    
    const titleSelectors = [
      '[data-automation-id="jobPostingHeader"] h2',
      '[data-automation-id="job-title"]',
      'h1[class*="title"]',
      'h2[class*="title"]',
      '.job-title',
      'header h1',
      'header h2',
    ];
    
    let title = '';
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        title = el.textContent.trim();
        break;
      }
    }
    
    const companySelectors = [
      '[data-automation-id="company"]',
      '[data-automation-id="job-company"]',
      '.company-name',
      '[class*="company"]',
    ];
    
    let company = '';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        company = el.textContent.trim();
        break;
      }
    }
    
    const locationSelectors = [
      '[data-automation-id="location"]',
      '[data-automation-id="locations"]',
      '[data-automation-id="jobPostingLocation"]',
      '.job-location',
      '[class*="location"]',
    ];
    
    let location = '';
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        location = el.textContent.trim();
        break;
      }
    }
    
    const elapsed = Math.round(performance.now() - start);
    console.log(`[ATS Workday] 📸 Snapshot captured in ${elapsed}ms:`, title);
    
    return {
      title,
      company,
      location,
      description,
      url: window.location.href,
      platform: 'workday'
    };
  }

  // ============ MAIN TAILORING FUNCTION WITH DIRECT KIMI K2 ============
  async function tailorWithKimi(jobInfo, session) {
    const startTime = performance.now();
    let kimiAPI = new KimiAPI();
    
    try {
      // Get Kimi API key from storage
      const storage = await new Promise(resolve => {
        chrome.storage.local.get(['kimi_api_key', 'ai_provider'], resolve);
      });
      
      if (!storage.kimi_api_key) {
        throw new Error('Kimi API key not found. Please add your API key in the extension popup.');
      }
      
      kimiAPI.setApiKey(storage.kimi_api_key);
      
      // Get user profile
      updateBanner('Loading profile...', 'working');
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${session.user.id}&select=first_name,last_name,email,phone,linkedin,github,portfolio,cover_letter,work_experience,education,skills,certifications,achievements,ats_strategy,city,country,address,state,zip_code`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!profileRes.ok) {
        throw new Error('Could not load profile');
      }

      const profileRows = await profileRes.json();
      const p = profileRows?.[0] || {};

      // Prepare candidate profile
      const candidateProfile = {
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email || session.user.email || '',
        phone: p.phone || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        portfolio: p.portfolio || '',
        workExperience: Array.isArray(p.work_experience) ? p.work_experience : [],
        education: Array.isArray(p.education) ? p.education : [],
        skills: Array.isArray(p.skills) ? p.skills : [],
        city: p.city || '',
        country: p.country || ''
      };

      // Get base CV
      updateBanner('Loading base CV...', 'working');
      let baseCV = '';
      
      if (p.cv_file_path) {
        // Download CV from Supabase storage
        try {
          const cvUrl = `${SUPABASE_URL}/storage/v1/object/public/cvs/${p.cv_file_path}`;
          const cvRes = await fetch(cvUrl);
          if (cvRes.ok) {
            baseCV = await cvRes.text();
          }
        } catch (e) {
          console.warn('[ATS Tailor] Could not load CV file, using profile data');
        }
      }
      
      // Fallback: generate base CV from profile
      if (!baseCV) {
        baseCV = generateBaseCVFromProfile(candidateProfile);
      }

      // PHASE 1: Extract keywords with Kimi K2
      updateBanner('Extracting keywords with Kimi K2...', 'working');
      const keywordStart = performance.now();
      
      const keywords = await kimiAPI.extractKeywords(
        jobInfo.description,
        jobInfo.title,
        jobInfo.company
      );
      
      const keywordTime = performance.now() - keywordStart;
      console.log(`[ATS Tailor] Keywords extracted in ${keywordTime.toFixed(0)}ms:`, keywords.keywords?.length || 0, 'keywords');

      // PHASE 2: Tailor CV with Kimi K2
      updateBanner('Tailoring CV with Kimi K2...', 'working');
      const cvStart = performance.now();
      
      const tailoredCV = await kimiAPI.tailorCV(
        baseCV,
        jobInfo.description,
        jobInfo.title,
        jobInfo.company,
        keywords.keywords || [],
        candidateProfile
      );
      
      const cvTime = performance.now() - cvStart;
      console.log(`[ATS Tailor] CV tailored in ${cvTime.toFixed(0)}ms`);

      // PHASE 3: Generate cover letter with Kimi K2
      updateBanner('Generating cover letter...', 'working');
      const coverStart = performance.now();
      
      const coverLetter = await kimiAPI.generateCoverLetter(
        jobInfo.description,
        jobInfo.title,
        jobInfo.company,
        candidateProfile,
        tailoredCV
      );
      
      const coverTime = performance.now() - coverStart;
      console.log(`[ATS Tailor] Cover letter generated in ${coverTime.toFixed(0)}ms`);

      // PHASE 4: Generate PDFs (placeholder - would integrate with PDF service)
      updateBanner('Generating PDFs...', 'working');
      
      // For now, return text content
      const result = {
        tailoredResume: tailoredCV,
        tailoredCoverLetter: coverLetter,
        keywords: keywords.keywords || [],
        matchScore: calculateMatchScore(tailoredCV, keywords.keywords || []),
        timings: {
          keywords: keywordTime,
          cv: cvTime,
          cover: coverTime,
          total: performance.now() - startTime
        }
      };

      return result;
      
    } catch (error) {
      console.error('[ATS Tailor] Kimi API error:', error);
      
      // Fallback to Supabase if Kimi fails
      if (error.message.includes('API key')) {
        throw error; // Re-throw API key errors
      }
      
      console.log('[ATS Tailor] Falling back to Supabase...');
      return await tailorWithSupabase(jobInfo, session);
    }
  }

  // Fallback: Original Supabase method
  async function tailorWithSupabase(jobInfo, session) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tailor-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        jobTitle: jobInfo.title,
        company: jobInfo.company,
        location: jobInfo.location,
        description: jobInfo.description,
        requirements: [],
        userProfile: {
          firstName: '',
          lastName: '',
          email: session.user.email || '',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Tailoring failed');
    }

    return await response.json();
  }

  // Calculate match score
  function calculateMatchScore(cv, keywords) {
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

  // Generate base CV from profile
  function generateBaseCVFromProfile(profile) {
    let cv = `${profile.firstName} ${profile.lastName}\n`;
    cv += `${profile.email} | ${profile.phone}`;
    if (profile.linkedin) cv += ` | ${profile.linkedin}`;
    cv += '\n\n';
    
    // Work experience
    if (profile.workExperience.length) {
      cv += 'WORK EXPERIENCE\n';
      for (const exp of profile.workExperience.slice(0, 5)) {
        cv += `${exp.company || 'Company'}\n`;
        cv += `${exp.title || 'Position'} – ${exp.startDate || 'Start'} – ${exp.endDate || 'Present'}\n`;
        if (exp.description) {
          const bullets = exp.description.split('\n').filter(b => b.trim());
          for (const bullet of bullets.slice(0, 3)) {
            cv += `• ${bullet.trim()}\n`;
          }
        }
        cv += '\n';
      }
    }
    
    // Education
    if (profile.education.length) {
      cv += 'EDUCATION\n';
      for (const edu of profile.education.slice(0, 3)) {
        cv += `${edu.institution || 'Institution'}\n`;
        cv += `${edu.degree || 'Degree'} – ${edu.graduationYear || 'Year'}\n\n`;
      }
    }
    
    // Skills
    if (profile.skills.length) {
      cv += 'SKILLS\n';
      cv += profile.skills.slice(0, 10).join(', ') + '\n';
    }
    
    return cv;
  }

  // ============ AUTO-TAILOR TRIGGER ============
  async function autoTailorDocuments() {
    if (tailoringInProgress) {
      console.log('[ATS Tailor] Tailoring already in progress');
      return;
    }
    
    tailoringInProgress = true;
    
    try {
      // Get session
      const sessionRes = await chrome.runtime.sendMessage({ action: 'getSession' });
      if (!sessionRes?.session?.access_token) {
        updateBanner('Please log in to use ATS Tailor', 'error');
        tailoringInProgress = false;
        return;
      }
      
      const session = sessionRes.session;
      
      // Extract job info
      const jobInfo = extractJobInfo();
      if (!jobInfo.title) {
        updateBanner('Could not detect job info', 'error');
        tailoringInProgress = false;
        return;
      }
      
      console.log('[ATS Tailor] Auto-tailoring for:', jobInfo.title, 'at', jobInfo.company);
      
      // Check if Kimi API key is available
      const storage = await new Promise(resolve => {
        chrome.storage.local.get(['kimi_api_key', 'ai_provider'], resolve);
      });
      
      let result;
      if (storage.kimi_api_key && (storage.ai_provider === 'kimi' || !storage.ai_provider)) {
        // Use direct Kimi K2 API
        updateBanner('🚀 Using Kimi K2 (Direct API)...', 'working');
        result = await tailorWithKimi(jobInfo, session);
      } else {
        // Fallback to Supabase
        updateBanner('🔄 Using Supabase (Fallback)...', 'working');
        result = await tailorWithSupabase(jobInfo, session);
      }
      
      // Store results
      const fallbackName = `${jobInfo.company || 'Application'}`.replace(/\s+/g, '_');
      
      await new Promise(resolve => {
        chrome.storage.local.set({
          cvText: result.tailoredResume,
          coverText: result.tailoredCoverLetter,
          keywords: result.keywords,
          matchScore: result.matchScore,
          cvFileName: `${fallbackName}_CV.pdf`,
          coverFileName: `${fallbackName}_Cover_Letter.pdf`,
          ats_lastGeneratedDocuments: {
            cv: result.tailoredResume,
            coverLetter: result.tailoredCoverLetter,
            keywords: result.keywords,
            matchScore: result.matchScore,
            jobInfo: jobInfo
          }
        }, resolve);
      });
      
      // Update banner with timing info
      const totalTime = result.timings?.total ? (result.timings.total / 1000).toFixed(1) : '?';
      updateBanner(`✅ Generated in ${totalTime}s! Match: ${result.matchScore}%`, 'success');
      
      console.log('[ATS Tailor] Auto-tailoring complete!', result);
      
    } catch (error) {
      console.error('[ATS Tailor] Auto-tailoring failed:', error);
      updateBanner(`❌ Error: ${error.message}`, 'error');
    } finally {
      tailoringInProgress = false;
    }
  }

  // ============ LISTEN FOR MESSAGES ============
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoTailor') {
      autoTailorDocuments().then(() => {
        sendResponse({ status: 'success' });
      }).catch(error => {
        sendResponse({ status: 'error', message: error.message });
      });
      return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getLastGenerated') {
      chrome.storage.local.get(['ats_lastGeneratedDocuments'], (result) => {
        sendResponse(result.ats_lastGeneratedDocuments || null);
      });
      return true;
    }
  });

  // ============ AUTO-DETECTION ============
  let lastUrl = '';
  
  function checkForJobPage() {
    const currentUrl = window.location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;
    
    // Check if we're on a job page
    const jobInfo = extractJobInfo();
    if (jobInfo.title) {
      console.log('[ATS Tailor] Job page detected:', jobInfo.title);
      
      // Auto-trigger if enabled
      chrome.storage.local.get(['ats_autoTailorEnabled'], (result) => {
        if (result.ats_autoTailorEnabled !== false) {
          setTimeout(() => {
            autoTailorDocuments();
          }, 1000);
        }
      });
    }
  }
  
  // Monitor URL changes
  setInterval(checkForJobPage, 2000);
  
  // Initial check
  setTimeout(checkForJobPage, 1000);

  console.log('[ATS Tailor] Content script initialized with Kimi K2 direct integration');

})();
