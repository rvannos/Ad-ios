/**
 * Ad-ios! - Early Cosmetic Filter & Scriptlet Suppressor (Manifest V3)
 * Injected at document_start. Operates efficiently without layout thrashing.
 */

(function () {
  'use strict';

  if (window.__adios_cosmetic_initialized) return;
  window.__adios_cosmetic_initialized = true;

  const currentHost = window.location.hostname.toLowerCase();

  chrome.storage.local.get(['adios_global_enabled', 'adios_whitelisted_domains', 'adios_categories'], (result) => {
    if (result.adios_global_enabled === false) return;

    const whitelist = result.adios_whitelisted_domains || [];
    if (whitelist.some(domain => currentHost === domain || currentHost.endsWith('.' + domain))) {
      return; // Whitelisted, bypass cosmetic filtering
    }

    const categories = result.adios_categories || { ads: true, analytics: true, images: false, monitoring: true };
    startCosmeticFiltering(categories);
  });

  // Early Scriptlet Defuser & Stubbing (Prevents anti-adblock and interstitial popups)
  try {
    if (!window.adsbygoogle) {
      const mockAds = [];
      mockAds.loaded = true;
      mockAds.push = function () { return 0; };
      Object.defineProperty(window, 'adsbygoogle', {
        get: () => mockAds,
        set: () => {},
        configurable: true
      });
    }

    // Defuse interstitial-ads WordPress plugin
    Object.defineProperty(window, 'interAds', {
      get: () => null,
      set: () => {},
      configurable: true
    });
    window.interads_close = function () {};

    // Defuse AdBlock Notify / Themeisle anti-adblock modal
    Object.defineProperty(window, 'anOptions', {
      get: () => ({ anOptionChoice: '0', anOptionStats: '0' }),
      set: () => {},
      configurable: true
    });
  } catch (e) {
    // Continue
  }

  function startCosmeticFiltering(categories) {
    // Selectors for elements to collapse
    const baseSelectors = [
      'ins.adsbygoogle',
      '[id^="google_ads_iframe"]',
      '[id^="div-gpt-ad"]',
      '[id^="aswift_"]',
      '[data-ad-unit]',
      '[data-ad-client]',
      '[data-ad-slot]',
      '[data-google-query-id]',
      'iframe[src*="doubleclick.net"]',
      'iframe[src*="googlesyndication.com"]',
      'iframe[src*="adnxs.com"]',
      'iframe[src*="criteo"]',
      '[id^="taboola-"]',
      '[id^="outbrain_"]',
      '.trc_rbox_div',
      '.ytp-ad-overlay-container',
      '.video-ads.ytp-ad-module',
      '#interads',
      '#interads-bar',
      '#interads-cnt',
      '.interads',
      '.interads-close',
      '.interstitial-ad',
      '[id*="interads"]',
      '[class*="interads"]',
      '.rIdHlTQAtJaQ',
      '.rIdHlTQAtJaQ-default',
      '[class*="rIdHlTQAtJaQ"]',
      '.adblock-notice',
      '.adblock-warning',
      '.adblock-detected',
      '.an-sponsored'
    ];

    // Only collapse banner image containers if image blocking is explicitly enabled
    if (categories.images) {
      baseSelectors.push('.ad-banner', '.ad-slot img', '[id*="banner"] img');
    }

    const TARGET_SELECTORS = baseSelectors.join(',');

    function collapseElement(el) {
      if (!el || el.dataset?.adiosHidden === 'true') return;
      try {
        el.dataset.adiosHidden = 'true';
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('height', '0px', 'important');
        el.style.setProperty('min-height', '0px', 'important');
        el.style.setProperty('max-height', '0px', 'important');
        el.style.setProperty('margin', '0px', 'important');
        el.style.setProperty('padding', '0px', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');

        if (el.id?.includes('interads') || (typeof el.className === 'string' && el.className.includes('rIdHlTQAtJaQ'))) {
          document.body?.style.setProperty('overflow', 'auto', 'important');
          document.documentElement?.style.setProperty('overflow', 'auto', 'important');
        }

        // Check if parent wrapper is now empty
        const parent = el.parentElement;
        if (parent && parent.children.length === 1 && (
            parent.id.toLowerCase().includes('ad-') ||
            parent.className.toLowerCase().includes('ad-')
        )) {
          collapseElement(parent);
        }
      } catch (err) {
        // Ignored
      }
    }

    function handleVideoSkip() {
      const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern');
      if (skipBtn) skipBtn.click();

      const closeOverlay = document.querySelector('.ytp-ad-overlay-close-button');
      if (closeOverlay) closeOverlay.click();
    }

    let scheduledQueue = [];
    let isScheduled = false;

    function processQueue() {
      isScheduled = false;
      const elementsToProcess = scheduledQueue;
      scheduledQueue = [];

      for (let i = 0; i < elementsToProcess.length; i++) {
        const node = elementsToProcess[i];
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches && node.matches(TARGET_SELECTORS)) {
            collapseElement(node);
          }
          const matchedChildren = node.querySelectorAll(TARGET_SELECTORS);
          for (let j = 0; j < matchedChildren.length; j++) {
            collapseElement(matchedChildren[j]);
          }
        }
      }
      handleVideoSkip();
    }

    function scheduleNodes(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        scheduledQueue.push(nodes[i]);
      }
      if (!isScheduled) {
        isScheduled = true;
        window.requestAnimationFrame(processQueue);
      }
    }

    function scanFullDOM() {
      const allFound = document.querySelectorAll(TARGET_SELECTORS);
      for (let i = 0; i < allFound.length; i++) {
        collapseElement(allFound[i]);
      }
      handleVideoSkip();
    }

    const observer = new MutationObserver((mutations) => {
      const addedNodes = [];
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            const added = m.addedNodes[j];
            if (added.nodeType === Node.ELEMENT_NODE) {
              addedNodes.push(added);
            }
          }
        } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          addedNodes.push(m.target);
        }
      }
      if (addedNodes.length > 0) {
        scheduleNodes(addedNodes);
      }
    });

    const rootTarget = document.documentElement || document;
    observer.observe(rootTarget, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-ad-unit', 'data-ad-slot', 'style']
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanFullDOM, { once: true });
    } else {
      scanFullDOM();
    }

    window.addEventListener('load', scanFullDOM, { once: true });
  }
})();
