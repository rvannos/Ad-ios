/**
 * Ad-ios! - Popup Controller Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('globalToggle');
  const blockedCountEl = document.getElementById('blockedCount');
  const resetStatsBtn = document.getElementById('resetStatsBtn');
  const currentDomainEl = document.getElementById('currentDomain');
  const whitelistBtn = document.getElementById('whitelistBtn');
  const customRuleInput = document.getElementById('customRuleInput');
  const addRuleBtn = document.getElementById('addRuleBtn');
  const customRuleList = document.getElementById('customRuleList');

  // Category checkboxes
  const catAds = document.getElementById('catAds');
  const catAnalytics = document.getElementById('catAnalytics');
  const catImages = document.getElementById('catImages');
  const catMonitoring = document.getElementById('catMonitoring');

  let currentHost = '';

  // Get active tab URL
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.url) {
    try {
      const url = new URL(activeTab.url);
      if (url.protocol.startsWith('http')) {
        currentHost = url.hostname.toLowerCase();
        currentDomainEl.textContent = currentHost;
      } else {
        currentDomainEl.textContent = 'System Page';
        whitelistBtn.disabled = true;
      }
    } catch {
      currentDomainEl.textContent = 'Unavailable';
      whitelistBtn.disabled = true;
    }
  }

  function refreshStatus() {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
      if (!response || !response.success) return;

      globalToggle.checked = response.enabled;
      blockedCountEl.textContent = (response.blockedCount || 0).toLocaleString();

      // Category states
      const cats = response.categories || {};
      catAds.checked = cats.ads !== false;
      catAnalytics.checked = cats.analytics !== false;
      catImages.checked = !!cats.images; // False by default (images allowed)
      catMonitoring.checked = cats.monitoring !== false;

      // Whitelist state
      const isWhitelisted = (response.whitelistedDomains || []).includes(currentHost);
      updateWhitelistButtonState(isWhitelisted);

      // Custom rules
      renderCustomRules(response.customRules || []);
    });
  }

  function updateWhitelistButtonState(isWhitelisted) {
    if (!currentHost || whitelistBtn.disabled) return;
    if (isWhitelisted) {
      whitelistBtn.textContent = 'Enable on This Site';
      whitelistBtn.classList.add('whitelisted');
    } else {
      whitelistBtn.textContent = 'Whitelist Site';
      whitelistBtn.classList.remove('whitelisted');
    }
  }

  function renderCustomRules(rules) {
    customRuleList.innerHTML = '';
    if (rules.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.fontSize = '10px';
      emptyMsg.style.color = 'var(--text-secondary)';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '4px';
      emptyMsg.textContent = 'No custom rules added.';
      customRuleList.appendChild(emptyMsg);
      return;
    }

    rules.forEach((rule) => {
      const item = document.createElement('div');
      item.className = 'rule-item';

      const text = document.createElement('span');
      text.textContent = rule;
      text.title = rule;

      const delBtn = document.createElement('button');
      delBtn.className = 'rule-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove rule';
      delBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'REMOVE_CUSTOM_RULE', rule }, () => {
          refreshStatus();
        });
      });

      item.appendChild(text);
      item.appendChild(delBtn);
      customRuleList.appendChild(item);
    });
  }

  // Bind category toggles
  function bindCategoryToggle(el, categoryKey) {
    el.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'SET_CATEGORY',
        category: categoryKey,
        enabled: el.checked
      }, () => {
        refreshStatus();
      });
    });
  }

  bindCategoryToggle(catAds, 'ads');
  bindCategoryToggle(catAnalytics, 'analytics');
  bindCategoryToggle(catImages, 'images');
  bindCategoryToggle(catMonitoring, 'monitoring');

  // Global toggle
  globalToggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ action: 'TOGGLE_SHIELD' }, () => {
      refreshStatus();
    });
  });

  // Reset counter
  resetStatsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'RESET_STATS' }, () => {
      refreshStatus();
    });
  });

  // Whitelist toggle
  whitelistBtn.addEventListener('click', () => {
    if (!currentHost) return;
    chrome.runtime.sendMessage({ action: 'TOGGLE_WHITELIST_DOMAIN', domain: currentHost }, (res) => {
      if (res && res.success) {
        updateWhitelistButtonState(res.isWhitelisted);
        if (activeTab && activeTab.id) {
          chrome.tabs.reload(activeTab.id);
        }
      }
    });
  });

  // Add custom rule
  function handleAddRule() {
    const val = customRuleInput.value.trim();
    if (!val) return;
    chrome.runtime.sendMessage({ action: 'ADD_CUSTOM_RULE', rule: val }, () => {
      customRuleInput.value = '';
      refreshStatus();
    });
  }

  addRuleBtn.addEventListener('click', handleAddRule);
  customRuleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddRule();
  });

  refreshStatus();
});
