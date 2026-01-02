// turbo-pipeline.js - Ultra-fast ATS Tailoring Pipeline (≤350ms total)
// Optimized for LazyApply rapid-fire job applications
// FEATURES: URL-based caching, parallel processing, High Priority keyword distribution

(function(global) {
  'use strict';

  // ============ TIMING TARGETS (350ms TOTAL) ============
  const TIMING_TARGETS = {
    EXTRACT_KEYWORDS: 50,     // 50ms (cached: instant)
    TAILOR_CV: 100,           // 100ms
    GENERATE_PDF: 100,        // 100ms
    ATTACH_FILES: 50,         // 50ms
    TOTAL: 350                // 350ms total
  };

  // ============ FAST KEYWORD CACHE (URL-BASED) ============
  const keywordCache = new Map();
  const MAX_CACHE_SIZE = 100;
  const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  function getCacheKey(jobUrl, text) {
    // Primary: Use job URL for instant cache hits
    if (jobUrl) return jobUrl;
    // Fallback: Hash of first 200 chars + length
    return text.substring(0, 200) + '_' + text.length;
  }

  function getCachedKeywords(jobUrl, text) {
    const key = getCacheKey(jobUrl, text);
    const cached = keywordCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
      console.log('[TurboPipeline] ⚡ Cache HIT for:', key.substring(0, 50));
      return cached.keywords;
    }
    return null;
  }

  function setCachedKeywords(jobUrl, text, keywords) {
    const key = getCacheKey(jobUrl, text);
    if (keywordCache.size >= MAX_CACHE_SIZE) {
      const firstKey = keywordCache.keys().next().value;
      keywordCache.delete(firstKey);
    }
    keywordCache.set(key, { keywords, timestamp: Date.now() });
  }

  // ============ TURBO KEYWORD EXTRACTION (≤50ms, instant if cached) ============
  async function turboExtractKeywords(jobDescription, options = {}) {
    const startTime = performance.now();
    const { jobUrl = '', maxKeywords = 35 } = options;
    
    if (!jobDescription || jobDescription.length < 50) {
      return { all: [], highPriority: [], mediumPriority: [], lowPriority: [], workExperience: [], total: 0, timing: 0 };
    }

    // CHECK CACHE FIRST (instant return)
    const cached = getCachedKeywords(jobUrl, jobDescription);
    if (cached) {
      return { ...cached, timing: performance.now() - startTime, fromCache: true };
    }

    // Ultra-fast synchronous extraction
    const result = ultraFastExtraction(jobDescription, maxKeywords);

    // Cache result
    setCachedKeywords(jobUrl, jobDescription, result);

    const timing = performance.now() - startTime;
    console.log(`[TurboPipeline] Keywords extracted in ${timing.toFixed(0)}ms (target: ${TIMING_TARGETS.EXTRACT_KEYWORDS}ms)`);
    
    return { ...result, timing, fromCache: false };
  }

  // ============ ULTRA-FAST EXTRACTION (TECHNICAL KEYWORDS ONLY) ============
  function ultraFastExtraction(text, maxKeywords) {
    const stopWords = new Set([
      'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
      'as','is','was','are','were','been','be','have','has','had','do','does','did',
      'will','would','could','should','may','might','must','can','need','this','that',
      'you','your','we','our','they','their','work','working','job','position','role',
      'team','company','opportunity','looking','seeking','required','requirements',
      'preferred','ability','able','experience','years','year','including','new',
      'strong','excellent','highly','etc','also','via','across','ensure','join'
    ]);

    // EXCLUDE soft skills - these look unprofessional when injected
    const softSkillsToExclude = new Set([
      'collaboration','communication','teamwork','leadership','initiative','proactive',
      'ownership','responsibility','commitment','passion','dedication','motivation',
      'self-starter','detail-oriented','problem-solving','critical thinking',
      'time management','adaptability','flexibility','creativity','innovation',
      'interpersonal','organizational','multitasking','prioritization','reliability',
      'accountability','integrity','professionalism','work ethic','positive attitude',
      'enthusiasm','driven','dynamic','results-oriented','goal-oriented','mission',
      'continuous learning','debugging','testing','documentation','system integration',
      'goodjob','sidekiq','canvas','salesforce'
    ]);

    // Technical/hard skills patterns (boosted)
    const technicalPatterns = new Set([
      'python','java','javascript','typescript','ruby','rails','react','node','nodejs',
      'aws','azure','gcp','google cloud','kubernetes','docker','terraform','ansible',
      'postgresql','postgres','mysql','mongodb','redis','elasticsearch','bigquery',
      'spark','airflow','kafka','dbt','snowflake','databricks','mlops','devops',
      'ci/cd','github','gitlab','jenkins','circleci','agile','scrum','jira','confluence',
      'pytorch','tensorflow','scikit-learn','pandas','numpy','sql','nosql','graphql',
      'rest','api','microservices','serverless','lambda','ecs','eks','s3','rds',
      'machine learning','data science','data engineering','deep learning','nlp','llm',
      'genai','ai','ml','computer vision','data pipelines','etl','data modeling',
      'tableau','power bi','looker','heroku','vercel','netlify','linux','unix','bash',
      'git','svn','html','css','sass','webpack','vite','nextjs','vue','angular',
      'swift','kotlin','flutter','react native','ios','android','mobile','frontend',
      'backend','fullstack','full-stack','sre','infrastructure','networking','security',
      'oauth','jwt','encryption','compliance','gdpr','hipaa','soc2','pci','prince2',
      'cbap','pmp','certified','certification','.net','c#','go','scala'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s\-\/\.#\+]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w) && !softSkillsToExclude.has(w));

    // Single-pass frequency count with tech boost
    const freq = new Map();
    words.forEach(word => {
      if (technicalPatterns.has(word) || word.length > 4) {
        const count = (freq.get(word) || 0) + 1;
        const boost = technicalPatterns.has(word) ? 5 : 1;
        freq.set(word, count * boost);
      }
    });

    // Multi-word technical phrases
    const multiWordPatterns = [
      'project management', 'data science', 'machine learning', 'deep learning',
      'data engineering', 'cloud platform', 'google cloud platform', 'agile/scrum',
      'a/b testing', 'ci/cd', 'real-time', 'data pipelines', 'ruby on rails',
      'node.js', 'react.js', 'vue.js', 'next.js', 'full stack', 'full-stack',
      'natural language processing', 'computer vision', 'artificial intelligence',
      '.net core', 'software development', 'full-stack development'
    ];
    
    const textLower = text.toLowerCase();
    multiWordPatterns.forEach(phrase => {
      if (textLower.includes(phrase)) {
        freq.set(phrase, (freq.get(phrase) || 0) + 10);
      }
    });

    // Sort and split into priority buckets
    const sorted = [...freq.entries()]
      .filter(([word]) => !softSkillsToExclude.has(word))
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, maxKeywords);

    const highCount = Math.min(15, Math.ceil(sorted.length * 0.45));
    const medCount = Math.min(10, Math.ceil(sorted.length * 0.35));

    return {
      all: sorted,
      highPriority: sorted.slice(0, highCount),
      mediumPriority: sorted.slice(highCount, highCount + medCount),
      lowPriority: sorted.slice(highCount + medCount),
      workExperience: sorted.slice(0, 15), // Top 15 for WE injection
      total: sorted.length
    };
  }

  // ============ HIGH PRIORITY KEYWORD DISTRIBUTION (3-5x mentions) ============
  // Distributes high priority keywords across Work Experience bullets naturally
  function distributeHighPriorityKeywords(cvText, highPriorityKeywords, options = {}) {
    const { maxBulletsPerRole = 8, targetMentions = 4 } = options;
    
    if (!cvText || !highPriorityKeywords?.length) {
      return { tailoredCV: cvText, distributionStats: {} };
    }

    let tailoredCV = cvText;
    const stats = {};
    
    // Initialize stats for each high priority keyword
    highPriorityKeywords.forEach(kw => {
      stats[kw] = { mentions: 0, roles: [] };
    });

    // Find Work Experience section
    const expMatch = /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE)[\s:]*$/im.exec(tailoredCV);
    if (!expMatch) return { tailoredCV, distributionStats: stats };

    const expStart = expMatch.index + expMatch[0].length;
    const nextSectionMatch = /^(SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS|TECHNICAL\s*PROFICIENCIES)[\s:]*$/im.exec(tailoredCV.substring(expStart));
    const expEnd = nextSectionMatch ? expStart + nextSectionMatch.index : tailoredCV.length;
    
    let experienceSection = tailoredCV.substring(expStart, expEnd);
    
    // Split into roles (detect role headers: Company | Title | Date patterns)
    const rolePattern = /^([A-Z][A-Za-z\s&.,]+\s*\|.+)$/gm;
    const roles = experienceSection.split(rolePattern).filter(s => s.trim());
    
    // Natural injection phrases
    const phrases = [
      'leveraging', 'utilizing', 'implementing', 'applying', 'with expertise in',
      'through', 'incorporating', 'employing'
    ];
    const getPhrase = () => phrases[Math.floor(Math.random() * phrases.length)];

    // Process each role
    let modifiedExperience = '';
    let roleIndex = 0;
    const roleNames = ['Primary Role', 'Secondary Role', 'Third Role', 'Fourth Role'];

    roles.forEach((section, idx) => {
      // Check if this is a role header
      if (rolePattern.test(section)) {
        modifiedExperience += section;
        roleIndex++;
        return;
      }

      // Process bullets in this role section
      const lines = section.split('\n');
      let bulletCount = 0;
      
      const modifiedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!(trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
          return line;
        }
        
        bulletCount++;
        if (bulletCount > maxBulletsPerRole) return line;

        // Find high priority keywords that need more mentions
        const needsMoreMentions = highPriorityKeywords.filter(kw => {
          const current = stats[kw].mentions;
          const inLine = line.toLowerCase().includes(kw.toLowerCase());
          return current < targetMentions && !inLine;
        });

        if (needsMoreMentions.length === 0) return line;

        // Inject 1-2 keywords per bullet
        const toInject = needsMoreMentions.slice(0, 2);
        let enhanced = line;
        
        toInject.forEach(kw => {
          const phrase = getPhrase();
          if (enhanced.endsWith('.')) {
            enhanced = enhanced.slice(0, -1) + `, ${phrase} ${kw}.`;
          } else {
            enhanced = enhanced + ` ${phrase} ${kw}`;
          }
          stats[kw].mentions++;
          stats[kw].roles.push(roleNames[roleIndex] || `Role ${roleIndex + 1}`);
        });

        return enhanced;
      });

      modifiedExperience += modifiedLines.join('\n');
    });

    tailoredCV = tailoredCV.substring(0, expStart) + modifiedExperience + tailoredCV.substring(expEnd);

    console.log('[TurboPipeline] High Priority keyword distribution:', stats);
    return { tailoredCV, distributionStats: stats };
  }

  // ============ TURBO CV TAILORING (≤100ms) ============
  async function turboTailorCV(cvText, keywords, options = {}) {
    const startTime = performance.now();
    
    if (!cvText || !keywords?.all?.length) {
      return { tailoredCV: cvText, injectedKeywords: [], timing: 0, stats: {} };
    }

    // STEP 1: Basic keyword injection (Work Experience focus)
    const cvLower = cvText.toLowerCase();
    const missing = (keywords.workExperience || keywords.all.slice(0, 15))
      .filter(kw => !cvLower.includes(kw.toLowerCase()));
    
    let tailoredCV = cvText;
    let injected = [];

    if (missing.length > 0) {
      const result = fastTailorWorkExperience(cvText, missing);
      tailoredCV = result.tailoredCV;
      injected = result.injectedKeywords;
    }

    // STEP 2: HIGH PRIORITY DISTRIBUTION (3-5x mentions)
    if (keywords.highPriority?.length > 0) {
      const distResult = distributeHighPriorityKeywords(tailoredCV, keywords.highPriority, {
        maxBulletsPerRole: 8,
        targetMentions: 4 // Aim for 4 mentions (between 3-5)
      });
      tailoredCV = distResult.tailoredCV;
    }

    const timing = performance.now() - startTime;
    console.log(`[TurboPipeline] CV tailored in ${timing.toFixed(0)}ms (target: ${TIMING_TARGETS.TAILOR_CV}ms)`);
    
    return { 
      tailoredCV, 
      originalCV: cvText,
      injectedKeywords: injected,
      stats: { total: injected.length, workExperience: injected.length, skills: 0 },
      timing 
    };
  }

  // ============ FAST WORK EXPERIENCE TAILORING ============
  function fastTailorWorkExperience(cvText, missingKeywords) {
    let tailoredCV = cvText;
    const injected = [];

    const expMatch = /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE)[\s:]*$/im.exec(tailoredCV);
    if (!expMatch) return { tailoredCV, injectedKeywords: [] };

    const expStart = expMatch.index + expMatch[0].length;
    const nextSectionMatch = /^(SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS)[\s:]*$/im.exec(tailoredCV.substring(expStart));
    const expEnd = nextSectionMatch ? expStart + nextSectionMatch.index : tailoredCV.length;
    
    let experienceSection = tailoredCV.substring(expStart, expEnd);
    const lines = experienceSection.split('\n');
    let keywordIndex = 0;
    
    const patterns = [
      ', incorporating {} principles',
      ' with focus on {}',
      ', leveraging {}',
      ' utilizing {} methodologies',
      ' through {} implementation'
    ];

    const modifiedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!(trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
        return line;
      }
      if (keywordIndex >= missingKeywords.length) return line;

      // Inject 2-3 keywords per bullet
      const toInject = [];
      while (toInject.length < 3 && keywordIndex < missingKeywords.length) {
        const kw = missingKeywords[keywordIndex];
        if (!line.toLowerCase().includes(kw.toLowerCase())) {
          toInject.push(kw);
        }
        keywordIndex++;
      }
      
      if (toInject.length === 0) return line;

      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let bulletContent = trimmed.replace(/^[-•*]\s*/, '');
      
      const injection = toInject.length === 1 
        ? pattern.replace('{}', toInject[0])
        : pattern.replace('{}', toInject.slice(0, -1).join(', ') + ' and ' + toInject.slice(-1));
      
      if (bulletContent.endsWith('.')) {
        bulletContent = bulletContent.slice(0, -1) + injection + '.';
      } else {
        bulletContent = bulletContent + injection;
      }
      
      injected.push(...toInject);
      return `- ${bulletContent}`;
    });

    const modifiedExperience = modifiedLines.join('\n');
    tailoredCV = tailoredCV.substring(0, expStart) + modifiedExperience + tailoredCV.substring(expEnd);

    return { tailoredCV, injectedKeywords: injected };
  }

  // ============ COMPLETE TURBO PIPELINE (≤350ms total) ============
  async function executeTurboPipeline(jobInfo, candidateData, baseCV, options = {}) {
    const pipelineStart = performance.now();
    const timings = {};
    
    console.log('[TurboPipeline] 🚀 Starting 350ms turbo pipeline for:', jobInfo?.title || 'Unknown Job');
    
    // PHASE 1: Extract keywords (≤50ms, instant if cached)
    const jdText = jobInfo?.description || '';
    const keywordsResult = await turboExtractKeywords(jdText, {
      jobUrl: jobInfo?.url || '',
      maxKeywords: options.maxKeywords || 35
    });
    timings.extraction = keywordsResult.timing;

    if (!keywordsResult.all?.length) {
      console.warn('[TurboPipeline] No keywords extracted');
      return { success: false, error: 'No keywords extracted', timings };
    }

    // PHASE 2: Tailor CV with High Priority distribution (≤100ms)
    const tailorResult = await turboTailorCV(baseCV, keywordsResult, { 
      targetScore: options.targetScore || 95 
    });
    timings.tailoring = tailorResult.timing;

    // PHASE 3: PDF + Attach handled by pdf-ats-turbo.js and file-attacher.js

    const totalTime = performance.now() - pipelineStart;
    timings.total = totalTime;

    console.log(`[TurboPipeline] ✅ Pipeline complete in ${totalTime.toFixed(0)}ms (target: ${TIMING_TARGETS.TOTAL}ms)`);
    console.log('[TurboPipeline] Timings:', timings);

    return {
      success: true,
      keywords: keywordsResult,
      workExperienceKeywords: keywordsResult.workExperience,
      tailoredCV: tailorResult.tailoredCV,
      injectedKeywords: tailorResult.injectedKeywords,
      stats: tailorResult.stats,
      timings,
      fromCache: keywordsResult.fromCache,
      meetsTarget: totalTime <= TIMING_TARGETS.TOTAL
    };
  }

  // ============ EXPORTS ============
  global.TurboPipeline = {
    executeTurboPipeline,
    turboExtractKeywords,
    turboTailorCV,
    distributeHighPriorityKeywords,
    TIMING_TARGETS,
    clearCache: () => keywordCache.clear(),
    getCacheSize: () => keywordCache.size
  };

})(typeof window !== 'undefined' ? window : global);
