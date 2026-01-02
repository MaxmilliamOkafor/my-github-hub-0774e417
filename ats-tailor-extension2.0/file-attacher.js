// file-attacher.js - Ultra-fast File Attachment (≤50ms) - GREENHOUSE FIXED
// CRITICAL: Platform-specific selectors for × button removal + correct CV/Cover field detection
// FIXES: Greenhouse × button not clicking, files not replacing, CV going to cover field

(function() {
  'use strict';

  const FileAttacher = {
    // ============ TIMING TARGET (FASTER) ============
    TIMING_TARGET: 50, // Target 50ms for 350ms total pipeline

    // ============ PIPELINE STATE ============
    pipelineState: {
      cvAttached: false,
      coverAttached: false,
      lastAttachedFiles: null,
      jobGenieReady: false
    },

    // ============ GREENHOUSE-SPECIFIC SELECTORS (CRITICAL FIX) ============
    GREENHOUSE_REMOVE_SELECTORS: [
      // Greenhouse attachment remove buttons - HIGH PRIORITY
      'button.remove-attachment',
      'button[data-action="remove-attachment"]',
      '[data-provides="fileupload"] button.close',
      '.attachment-remove',
      '.file-remove',
      '.attachment button[aria-label*="remove" i]',
      '.attachment button[aria-label*="delete" i]',
      '.attachment button[aria-label*="clear" i]',
      // Greenhouse file preview close
      '.file-preview .close',
      '.file-preview button',
      '.uploaded-file-close',
      '.uploaded-file button',
      // Generic × buttons with specific Greenhouse parent containers
      '.s-input-group button',
      '.field-select button.close',
      '.file-attachment button',
      // Data attribute selectors
      '[data-field-type="file"] button',
      '[data-qa="file-remove"]',
      '[data-qa-remove]',
      '[data-qa*="remove"]',
      '[data-qa*="delete"]',
    ],

    // ============ GENERIC REMOVE SELECTORS ============
    GENERIC_REMOVE_SELECTORS: [
      'button[aria-label*="remove" i]',
      'button[aria-label*="delete" i]',
      'button[aria-label*="clear" i]',
      '.remove-file',
      '.file-upload-remove',
      '.attachment-remove',
    ],

    // ============ CV FIELD DETECTION (IMPROVED) ============
    isCVField(input) {
      const text = (
        (input.labels?.[0]?.textContent || '') +
        (input.name || '') +
        (input.id || '') +
        (input.getAttribute('aria-label') || '') +
        (input.getAttribute('data-qa') || '') +
        (input.closest('label')?.textContent || '')
      ).toLowerCase();
      
      // Check parent elements for context (up to 5 levels)
      let parent = input.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const parentText = (parent.textContent || '').toLowerCase().substring(0, 300);
        // CV/Resume field: has resume/cv text but NOT cover letter
        if ((parentText.includes('resume') || parentText.includes('cv')) && !parentText.includes('cover')) {
          return true;
        }
        // Check for Greenhouse-specific data attributes
        const dataQa = parent.getAttribute('data-qa') || '';
        if (dataQa.includes('resume') || dataQa.includes('cv')) {
          return true;
        }
        parent = parent.parentElement;
      }
      
      return /(resume|cv|curriculum)/i.test(text) && !/cover/i.test(text);
    },

    // ============ COVER LETTER FIELD DETECTION (IMPROVED) ============
    isCoverField(input) {
      const text = (
        (input.labels?.[0]?.textContent || '') +
        (input.name || '') +
        (input.id || '') +
        (input.getAttribute('aria-label') || '') +
        (input.getAttribute('data-qa') || '') +
        (input.closest('label')?.textContent || '')
      ).toLowerCase();
      
      // Check parent elements for context
      let parent = input.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const parentText = (parent.textContent || '').toLowerCase().substring(0, 300);
        if (parentText.includes('cover')) {
          return true;
        }
        // Greenhouse data attributes
        const dataQa = parent.getAttribute('data-qa') || '';
        if (dataQa.includes('cover')) {
          return true;
        }
        parent = parent.parentElement;
      }
      
      return /cover/i.test(text);
    },

    // ============ GREENHOUSE-SPECIFIC × BUTTON KILLER ============
    killGreenhouseXButtons() {
      let removed = 0;
      const isGreenhouse = window.location.hostname.includes('greenhouse');
      
      console.log('[FileAttacher] 🎯 Platform:', isGreenhouse ? 'Greenhouse' : 'Generic ATS');

      // STEP 1: Greenhouse-specific removal (if on Greenhouse)
      if (isGreenhouse) {
        this.GREENHOUSE_REMOVE_SELECTORS.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(btn => {
              // Click the button
              btn.click();
              console.log('[FileAttacher] 🗑️ Greenhouse: Clicked', selector);
              removed++;
            });
          } catch (e) {
            // Selector may be invalid, skip
          }
        });
      }

      // STEP 2: Generic remove buttons (all platforms)
      this.GENERIC_REMOVE_SELECTORS.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(btn => {
            if (this.isNearFileInput(btn)) {
              btn.click();
              console.log('[FileAttacher] 🗑️ Clicked remove button:', selector);
              removed++;
            }
          });
        } catch (e) {}
      });

      // STEP 3: Click × / x / X / ✕ text buttons near file inputs
      document.querySelectorAll('button, [role="button"], span.close, a.close').forEach(btn => {
        const text = btn.textContent?.trim();
        if (text === '×' || text === 'x' || text === 'X' || text === '✕' || text === '✖') {
          if (this.isNearFileInput(btn)) {
            try {
              // Multiple click methods for robustness
              btn.focus();
              btn.click();
              btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
              console.log('[FileAttacher] 🗑️ Clicked × button');
              removed++;
            } catch (e) {}
          }
        }
      });

      // STEP 4: Clear file inputs directly (DataTransfer method)
      document.querySelectorAll('input[type="file"]').forEach(input => {
        if (input.files && input.files.length > 0) {
          try {
            const dt = new DataTransfer();
            input.files = dt.files;
            this.fireEvents(input);
            console.log('[FileAttacher] 🗑️ Cleared file input directly');
            removed++;
          } catch (e) {}
        }
      });

      // STEP 5: Greenhouse - Click "Remove" text links
      if (isGreenhouse) {
        document.querySelectorAll('a, span, div').forEach(el => {
          const text = el.textContent?.trim().toLowerCase();
          if (text === 'remove' || text === 'delete' || text === 'clear') {
            if (this.isNearFileInput(el)) {
              try {
                el.click();
                console.log('[FileAttacher] 🗑️ Clicked "Remove" text link');
                removed++;
              } catch (e) {}
            }
          }
        });
      }

      console.log(`[FileAttacher] 🗑️ Total removed: ${removed} existing files`);
      return removed;
    },

    // ============ CHECK IF ELEMENT IS NEAR A FILE INPUT ============
    isNearFileInput(el) {
      const root = el.closest('form') || document.body;
      const candidates = [
        el.closest('[data-qa-upload]'),
        el.closest('[data-qa="upload"]'),
        el.closest('[data-qa="attach"]'),
        el.closest('.field'),
        el.closest('[class*="upload" i]'),
        el.closest('[class*="attachment" i]'),
        el.closest('[class*="file" i]'),
        el.closest('.s-input-group'),
      ].filter(Boolean);

      for (const c of candidates) {
        if (c.querySelector('input[type="file"]')) return true;
        const t = (c.textContent || '').toLowerCase();
        if (t.includes('resume') || t.includes('cv') || t.includes('cover')) return true;
      }

      // Fallback: within same form, are there any file inputs?
      return !!root.querySelector('input[type="file"]');
    },

    // ============ REVEAL HIDDEN FILE INPUTS (GREENHOUSE) ============
    revealHiddenInputs() {
      // Greenhouse: Click "attach" buttons to reveal hidden file inputs
      document.querySelectorAll('[data-qa-upload], [data-qa="upload"], [data-qa="attach"], .attach-or-paste').forEach(btn => {
        const parent = btn.closest('.field') || btn.closest('[class*="upload"]') || btn.parentElement;
        const existingInput = parent?.querySelector('input[type="file"]');
        if (!existingInput || existingInput.offsetParent === null) {
          try { btn.click(); } catch {}
        }
      });
      
      // Make hidden file inputs visible
      document.querySelectorAll('input[type="file"]').forEach(input => {
        if (input.offsetParent === null) {
          input.style.cssText = 'display:block !important; visibility:visible !important; opacity:1 !important; position:relative !important;';
        }
      });
    },

    // ============ ATTACH FILES TO FORM (≤50ms) ============
    async attachFilesToForm(cvFile, coverFile, options = {}) {
      const startTime = performance.now();
      console.log('[FileAttacher] 🔗 Starting GREENHOUSE-FIXED file attachment...');
      
      const results = {
        cvAttached: false,
        coverAttached: false,
        existingFilesRemoved: 0,
        errors: [],
        jobGenieSynced: false
      };

      // STEP 1: Kill all existing × buttons (GREENHOUSE-SPECIFIC)
      results.existingFilesRemoved = this.killGreenhouseXButtons();
      
      // Small delay to let Greenhouse DOM update after removal
      await new Promise(r => setTimeout(r, 50));
      
      // STEP 2: Reveal hidden inputs
      this.revealHiddenInputs();

      // STEP 3: Attach CV to CV field ONLY
      if (cvFile) {
        const attached = this.forceCVReplace(cvFile);
        if (attached) {
          results.cvAttached = true;
          console.log(`[FileAttacher] ✅ CV attached: ${cvFile.name} (${cvFile.size} bytes)`);
          this.pipelineState.cvAttached = true;
        } else {
          results.errors.push('CV field not found');
        }
      }

      // STEP 4: Attach Cover Letter to Cover field ONLY
      if (coverFile) {
        const attached = this.forceCoverReplace(coverFile);
        if (attached) {
          results.coverAttached = true;
          console.log(`[FileAttacher] ✅ Cover Letter attached: ${coverFile.name} (${coverFile.size} bytes)`);
          this.pipelineState.coverAttached = true;
        } else {
          results.errors.push('Cover Letter field not found');
        }
      }

      // ASYNC: Job-Genie Pipeline Sync (non-blocking)
      if (options.syncJobGenie !== false) {
        this.syncWithJobGeniePipeline(cvFile, coverFile).then(synced => {
          results.jobGenieSynced = synced;
        }).catch(() => {});
      }

      // Store state
      this.pipelineState.lastAttachedFiles = { cvFile, coverFile };
      this.pipelineState.jobGenieReady = results.cvAttached || results.coverAttached;

      const timing = performance.now() - startTime;
      console.log(`[FileAttacher] ✅ Attachment complete in ${timing.toFixed(0)}ms (target: ${this.TIMING_TARGET}ms)`);
      
      return { ...results, timing };
    },

    // ============ FORCE CV REPLACE ============
    forceCVReplace(cvFile) {
      if (!cvFile) return false;
      let attached = false;

      document.querySelectorAll('input[type="file"]').forEach((input) => {
        if (!this.isCVField(input)) return;
        if (attached) return; // Only attach to first matching field

        const dt = new DataTransfer();
        dt.items.add(cvFile);
        input.files = dt.files;
        this.fireEvents(input);
        attached = true;
        console.log('[FileAttacher] ✅ CV attached to CV field:', cvFile.name);
      });

      return attached;
    },

    // ============ FORCE COVER REPLACE ============
    forceCoverReplace(coverFile) {
      if (!coverFile) return false;
      let attached = false;

      document.querySelectorAll('input[type="file"]').forEach((input) => {
        if (!this.isCoverField(input)) return;
        if (attached) return; // Only attach to first matching field

        const dt = new DataTransfer();
        dt.items.add(coverFile);
        input.files = dt.files;
        this.fireEvents(input);
        attached = true;
        console.log('[FileAttacher] ✅ Cover Letter attached to Cover field:', coverFile.name);
      });

      return attached;
    },

    // ============ FIRE INPUT EVENTS (COMPREHENSIVE) ============
    fireEvents(input) {
      // Fire all relevant events for maximum compatibility
      ['change', 'input', 'blur'].forEach(type => {
        input.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      });
      
      // Also fire custom events that some frameworks use
      try {
        input.dispatchEvent(new CustomEvent('file-selected', { bubbles: true, detail: { files: input.files } }));
      } catch (e) {}
    },

    // ============ JOB-GENIE PIPELINE SYNC (ASYNC) ============
    async syncWithJobGeniePipeline(cvFile, coverFile) {
      try {
        const storageData = {
          jobGenie_lastSync: Date.now(),
          jobGenie_pipelineReady: true
        };
        
        // PARALLEL: Convert both files to base64 simultaneously
        const [cvBase64, coverBase64] = await Promise.all([
          cvFile ? this.fileToBase64(cvFile) : Promise.resolve(null),
          coverFile ? this.fileToBase64(coverFile) : Promise.resolve(null)
        ]);

        if (cvBase64) {
          storageData.jobGenie_cvFile = {
            name: cvFile.name,
            size: cvFile.size,
            type: cvFile.type,
            base64: cvBase64,
            timestamp: Date.now()
          };
        }

        if (coverBase64) {
          storageData.jobGenie_coverFile = {
            name: coverFile.name,
            size: coverFile.size,
            type: coverFile.type,
            base64: coverBase64,
            timestamp: Date.now()
          };
        }

        await new Promise(resolve => {
          chrome.storage.local.set(storageData, resolve);
        });

        console.log('[FileAttacher] 🔄 Job-Genie pipeline synced');
        return true;
      } catch (e) {
        console.error('[FileAttacher] Job-Genie sync failed:', e);
        return false;
      }
    },

    // ============ FILE TO BASE64 ============
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    // ============ CREATE PDF FILE FROM BASE64 ============
    createPDFFile(base64, fileName) {
      try {
        if (!base64) return null;
        
        let data = base64;
        if (base64.includes(',')) {
          data = base64.split(',')[1];
        }
        
        const byteString = atob(data);
        const buffer = new ArrayBuffer(byteString.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < byteString.length; i++) {
          view[i] = byteString.charCodeAt(i);
        }
        
        const file = new File([buffer], fileName, { type: 'application/pdf' });
        console.log(`[FileAttacher] 📄 Created PDF: ${fileName} (${file.size} bytes)`);
        return file;
      } catch (e) {
        console.error('[FileAttacher] PDF creation failed:', e);
        return null;
      }
    },

    // ============ FILL COVER LETTER TEXTAREA ============
    async fillCoverLetterTextarea(coverLetterText) {
      if (!coverLetterText) return false;
      
      // Replace greetings with "Dear Hiring Manager,"
      let formattedText = coverLetterText
        .replace(/Dear\s+Hiring\s+Committee,?/gi, 'Dear Hiring Manager,')
        .replace(/Dear\s+Sir\/Madam,?/gi, 'Dear Hiring Manager,')
        .replace(/To\s+Whom\s+It\s+May\s+Concern,?/gi, 'Dear Hiring Manager,');
      
      const textareas = document.querySelectorAll('textarea');
      
      for (const textarea of textareas) {
        const label = (textarea.labels?.[0]?.textContent || textarea.name || textarea.id || '').toLowerCase();
        const parent = textarea.closest('.field')?.textContent?.toLowerCase() || '';
        
        if (/cover/i.test(label) || /cover/i.test(parent)) {
          textarea.value = formattedText;
          this.fireEvents(textarea);
          console.log('[FileAttacher] ✅ Cover Letter textarea filled');
          return true;
        }
      }
      
      return false;
    },

    // ============ MONITOR FOR DYNAMIC FORMS ============
    startAttachmentMonitor(cvFile, coverFile, maxDuration = 3000) {
      const startTime = Date.now();
      let attached = { cv: false, cover: false };
      
      const checkAndAttach = () => {
        if (Date.now() - startTime > maxDuration) return;
        
        if (cvFile && !attached.cv) {
          if (this.forceCVReplace(cvFile)) attached.cv = true;
        }
        
        if (coverFile && !attached.cover) {
          if (this.forceCoverReplace(coverFile)) attached.cover = true;
        }
        
        if (!attached.cv || !attached.cover) {
          requestAnimationFrame(checkAndAttach);
        }
      };
      
      checkAndAttach();
      
      // Mutation observer for dynamic forms
      const observer = new MutationObserver(() => {
        if (!attached.cv || !attached.cover) checkAndAttach();
        else observer.disconnect();
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), maxDuration);
    },

    // ============ GET JOB-GENIE PIPELINE FILES ============
    async getJobGeniePipelineFiles() {
      return new Promise(resolve => {
        chrome.storage.local.get([
          'jobGenie_cvFile', 
          'jobGenie_coverFile', 
          'jobGenie_pipelineReady'
        ], result => {
          if (!result.jobGenie_pipelineReady) {
            resolve(null);
            return;
          }

          const files = {};
          
          if (result.jobGenie_cvFile?.base64) {
            files.cvFile = this.createPDFFile(
              result.jobGenie_cvFile.base64,
              result.jobGenie_cvFile.name
            );
          }

          if (result.jobGenie_coverFile?.base64) {
            files.coverFile = this.createPDFFile(
              result.jobGenie_coverFile.base64,
              result.jobGenie_coverFile.name
            );
          }

          resolve(files);
        });
      });
    },

    // ============ CLEAR JOB-GENIE PIPELINE ============
    async clearJobGeniePipeline() {
      await new Promise(resolve => {
        chrome.storage.local.remove([
          'jobGenie_cvFile',
          'jobGenie_coverFile',
          'jobGenie_pipelineReady',
          'jobGenie_lastSync'
        ], resolve);
      });
      
      this.pipelineState = {
        cvAttached: false,
        coverAttached: false,
        lastAttachedFiles: null,
        jobGenieReady: false
      };
      
      console.log('[FileAttacher] 🗑️ Job-Genie pipeline cleared');
    }
  };

  window.FileAttacher = FileAttacher;
})();
