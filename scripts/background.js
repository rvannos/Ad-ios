/**
 * Ad-ios - Background Service Worker (Manifest V3)
 * Handles lifecycle, dynamic DNR rules, category toggles, custom filters, and badges.
 */

const STORAGE_KEYS = {
  GLOBAL_ENABLED: 'adios_global_enabled',
  BLOCKED_COUNT: 'adios_blocked_count',
  CUSTOM_RULES: 'adios_custom_rules',
  WHITELISTED_DOMAINS: 'adios_whitelisted_domains',
  CATEGORIES: 'adios_categories'
};

const DEFAULT_CATEGORIES = {
  ads: true,         // Contextual ads & popups (DoubleClick, Criteo, etc.)
  analytics: true,   // Google Analytics, Hotjar, Metrica
  images: false,     // Banner GIFs & ad images (allowed by default per user preference)
  monitoring: true   // Sentry, Bugsnag, error loggers
};

const DYNAMIC_RULE_OFFSET = 100000;

// Initialize defaults on install / update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[Ad-ios] Installed/Updated event: ${details.reason}`);

  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.GLOBAL_ENABLED,
    STORAGE_KEYS.BLOCKED_COUNT,
    STORAGE_KEYS.CUSTOM_RULES,
    STORAGE_KEYS.WHITELISTED_DOMAINS,
    STORAGE_KEYS.CATEGORIES
  ]);

  const toInit = {};
  if (stored[STORAGE_KEYS.GLOBAL_ENABLED] === undefined) toInit[STORAGE_KEYS.GLOBAL_ENABLED] = true;
  if (stored[STORAGE_KEYS.BLOCKED_COUNT] === undefined) toInit[STORAGE_KEYS.BLOCKED_COUNT] = 0;
  if (stored[STORAGE_KEYS.CUSTOM_RULES] === undefined) toInit[STORAGE_KEYS.CUSTOM_RULES] = [];
  if (stored[STORAGE_KEYS.WHITELISTED_DOMAINS] === undefined) toInit[STORAGE_KEYS.WHITELISTED_DOMAINS] = [];
  if (stored[STORAGE_KEYS.CATEGORIES] === undefined) toInit[STORAGE_KEYS.CATEGORIES] = DEFAULT_CATEGORIES;

  if (Object.keys(toInit).length > 0) {
    await chrome.storage.local.set(toInit);
  }

  await syncRulesetsAndDynamicRules();
  await updateBadge();
});

// Synchronize enabled DNR rulesets based on category flags and global switch
async function syncRulesetsAndDynamicRules() {
  try {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.GLOBAL_ENABLED,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.CUSTOM_RULES,
      STORAGE_KEYS.WHITELISTED_DOMAINS
    ]);

    const isGlobalEnabled = data[STORAGE_KEYS.GLOBAL_ENABLED] !== false;
    const categories = { ...DEFAULT_CATEGORIES, ...(data[STORAGE_KEYS.CATEGORIES] || {}) };
    const customRules = data[STORAGE_KEYS.CUSTOM_RULES] || [];
    const whitelistedDomains = data[STORAGE_KEYS.WHITELISTED_DOMAINS] || [];

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);

    if (!isGlobalEnabled) {
      // Disable all rulesets
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ['ruleset_ads', 'ruleset_analytics', 'ruleset_images', 'ruleset_monitoring']
      });
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: removeRuleIds,
        addRules: []
      });
      console.log('[Ad-ios] Protection paused globally.');
      return;
    }

    // Configure static rulesets
    const enableRulesetIds = [];
    const disableRulesetIds = [];

    if (categories.ads) enableRulesetIds.push('ruleset_ads');
    else disableRulesetIds.push('ruleset_ads');

    if (categories.analytics) enableRulesetIds.push('ruleset_analytics');
    else disableRulesetIds.push('ruleset_analytics');

    if (categories.images) enableRulesetIds.push('ruleset_images');
    else disableRulesetIds.push('ruleset_images');

    if (categories.monitoring) enableRulesetIds.push('ruleset_monitoring');
    else disableRulesetIds.push('ruleset_monitoring');

    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds,
      disableRulesetIds
    });

    // Configure dynamic rules (whitelists + user custom rules)
    const addRules = [];
    let currentId = DYNAMIC_RULE_OFFSET;

    // High priority allowlist for whitelisted domains
    for (const domain of whitelistedDomains) {
      if (domain && domain.trim()) {
        const cleanDomain = domain.trim().toLowerCase();
        addRules.push({
          id: currentId++,
          priority: 100,
          action: { type: 'allow' },
          condition: {
            urlFilter: `||${cleanDomain}^`,
            resourceTypes: [
              'main_frame',
              'sub_frame',
              'stylesheet',
              'script',
              'image',
              'font',
              'object',
              'xmlhttprequest',
              'ping',
              'media',
              'websocket',
              'other'
            ]
          }
        });
      }
    }

    // Custom user block patterns
    for (const rulePattern of customRules) {
      if (rulePattern && rulePattern.trim()) {
        const cleanPattern = rulePattern.trim();
        addRules.push({
          id: currentId++,
          priority: 2,
          action: { type: 'block' },
          condition: {
            urlFilter: cleanPattern.startsWith('||') ? cleanPattern : `||${cleanPattern}^`,
            resourceTypes: [
              'sub_frame',
              'script',
              'xmlhttprequest',
              'image',
              'media',
              'ping',
              'websocket',
              'other'
            ]
          }
        });
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds,
      addRules: addRules
    });

    console.log(`[Ad-ios] Rulesets synced. Active: ${enableRulesetIds.join(', ')}. Dynamic rules: ${addRules.length}`);
  } catch (err) {
    console.error('[Ad-ios] Error syncing rulesets:', err);
  }
}

// Update Action badge counter
async function updateBadge() {
  const { [STORAGE_KEYS.GLOBAL_ENABLED]: isEnabled, [STORAGE_KEYS.BLOCKED_COUNT]: count } =
    await chrome.storage.local.get([STORAGE_KEYS.GLOBAL_ENABLED, STORAGE_KEYS.BLOCKED_COUNT]);

  if (isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#8E8E93' });
    return;
  }

  if (count > 0) {
    const displayCount = count > 999 ? `${(count / 1000).toFixed(1)}k` : `${count}`;
    chrome.action.setBadgeText({ text: displayCount });
    chrome.action.setBadgeBackgroundColor({ color: '#E03131' }); // Vibrant red badge
  } else {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#2F9E44' });
  }
}

// Debug API for tracking blocked counts
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async () => {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_COUNT);
      const current = (data[STORAGE_KEYS.BLOCKED_COUNT] || 0) + 1;
      await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_COUNT]: current });
      await updateBadge();
    } catch (e) {
      // Ignored
    }
  });
}

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'GET_STATUS': {
          const data = await chrome.storage.local.get([
            STORAGE_KEYS.GLOBAL_ENABLED,
            STORAGE_KEYS.BLOCKED_COUNT,
            STORAGE_KEYS.CUSTOM_RULES,
            STORAGE_KEYS.WHITELISTED_DOMAINS,
            STORAGE_KEYS.CATEGORIES
          ]);
          sendResponse({
            success: true,
            enabled: data[STORAGE_KEYS.GLOBAL_ENABLED] !== false,
            blockedCount: data[STORAGE_KEYS.BLOCKED_COUNT] || 0,
            customRules: data[STORAGE_KEYS.CUSTOM_RULES] || [],
            whitelistedDomains: data[STORAGE_KEYS.WHITELISTED_DOMAINS] || [],
            categories: { ...DEFAULT_CATEGORIES, ...(data[STORAGE_KEYS.CATEGORIES] || {}) }
          });
          break;
        }

        case 'TOGGLE_SHIELD': {
          const { [STORAGE_KEYS.GLOBAL_ENABLED]: current } = await chrome.storage.local.get(STORAGE_KEYS.GLOBAL_ENABLED);
          const nextState = current === false ? true : false;
          await chrome.storage.local.set({ [STORAGE_KEYS.GLOBAL_ENABLED]: nextState });
          await syncRulesetsAndDynamicRules();
          await updateBadge();
          sendResponse({ success: true, enabled: nextState });
          break;
        }

        case 'SET_CATEGORY': {
          const { category, enabled } = message;
          const { [STORAGE_KEYS.CATEGORIES]: currentCats = DEFAULT_CATEGORIES } = await chrome.storage.local.get(STORAGE_KEYS.CATEGORIES);
          const updated = { ...currentCats, [category]: !!enabled };
          await chrome.storage.local.set({ [STORAGE_KEYS.CATEGORIES]: updated });
          await syncRulesetsAndDynamicRules();
          sendResponse({ success: true, categories: updated });
          break;
        }

        case 'ADD_CUSTOM_RULE': {
          const rule = (message.rule || '').trim().toLowerCase();
          if (!rule) {
            sendResponse({ success: false, error: 'Empty rule' });
            return;
          }
          const { [STORAGE_KEYS.CUSTOM_RULES]: rules = [] } = await chrome.storage.local.get(STORAGE_KEYS.CUSTOM_RULES);
          if (!rules.includes(rule)) {
            rules.push(rule);
            await chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_RULES]: rules });
            await syncRulesetsAndDynamicRules();
          }
          sendResponse({ success: true, customRules: rules });
          break;
        }

        case 'REMOVE_CUSTOM_RULE': {
          const rule = (message.rule || '').trim().toLowerCase();
          const { [STORAGE_KEYS.CUSTOM_RULES]: rules = [] } = await chrome.storage.local.get(STORAGE_KEYS.CUSTOM_RULES);
          const updated = rules.filter(r => r !== rule);
          await chrome.storage.local.set({ [STORAGE_KEYS.CUSTOM_RULES]: updated });
          await syncRulesetsAndDynamicRules();
          sendResponse({ success: true, customRules: updated });
          break;
        }

        case 'TOGGLE_WHITELIST_DOMAIN': {
          const domain = (message.domain || '').trim().toLowerCase();
          if (!domain) {
            sendResponse({ success: false, error: 'Empty domain' });
            return;
          }
          const { [STORAGE_KEYS.WHITELISTED_DOMAINS]: domains = [] } = await chrome.storage.local.get(STORAGE_KEYS.WHITELISTED_DOMAINS);
          let updated;
          if (domains.includes(domain)) {
            updated = domains.filter(d => d !== domain);
          } else {
            updated = [...domains, domain];
          }
          await chrome.storage.local.set({ [STORAGE_KEYS.WHITELISTED_DOMAINS]: updated });
          await syncRulesetsAndDynamicRules();
          sendResponse({ success: true, whitelistedDomains: updated, isWhitelisted: updated.includes(domain) });
          break;
        }

        case 'RESET_STATS': {
          await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_COUNT]: 0 });
          await updateBadge();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('[Ad-ios] Message processing error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true;
});
