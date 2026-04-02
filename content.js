(function() {
  const telPrefixRegex = /tel:\s*([\s.\-()]*\+?[0-9][0-9\s.\-()]{4,25})/g;
  const phoneOnlyRegex = /(?:\+|0|\()[0-9][0-9\s.\-()]{6,25}/;
  const phoneKeywords = ['phone', 'mobile', 'tel', 'call', 'téléphone', 'portable', 'whatsapp'];
  const exclusionKeywords = ['id', 'ref', 's/n', 'sku', 'ean', 'vin', 'order', 'commande', 'invoice', 'facture', 'tracking', 'quantité', 'quantity', 'batch', 'lot'];
  const DEFAULT_COUNTRY_CODE = '+33'; // Default to France, can be changed here

  function isValidPhoneNumber(text, element) {
    const cleanText = text.trim();
    const digitsOnly = cleanText.replace(/[^\d]/g, '');
    if (/^\d{13,}$/.test(cleanText)) return false;
    if (digitsOnly.length < 5) return false;
    const contextText = (element.parentElement?.textContent || '').toLowerCase();
    if (exclusionKeywords.some(kw => contextText.includes(kw))) {
      if (!phoneKeywords.some(kw => contextText.includes(kw))) {
        return false;
      }
    }
    return true;
  }

  function getGoogleVoiceUrl(number) {
    let sanitizedNumber = number.replace(/[^\d+]/g, '');
    if (sanitizedNumber.startsWith('0') && !sanitizedNumber.startsWith('+')) {
      sanitizedNumber = DEFAULT_COUNTRY_CODE + sanitizedNumber.substring(1);
    }
    const encodedNumber = sanitizedNumber.replace('+', '%2B');
    return `https://voice.google.com/u/0/calls?a=nc,${encodedNumber}`;
  }

  // --- 1. Détournement du bouton "Call" (Panneau latéral & Records) ---
  function handleHubSpotCallButton() {
    const selectors = [
      '[data-test-id="create-engagement-call-button"]',
      '[data-unit-test="create-engagement-call-button"]',
      'button i18n-string[data-key="communications.communicator.tabs.CALL"]',
      '.uiList [role="button"]',
      'button span'
    ];
    const callTextFr = "Appeler";
    const callTextEn = "Call";
    const callTextEs = "Llamar";
    const allButtons = document.querySelectorAll(selectors.join(', '));
    allButtons.forEach(btn => {
      const text = btn.textContent.trim();
      const isCallButton = btn.matches('[data-test-id*="call"]') || 
                           [callTextFr, callTextEn, callTextEs].includes(text) ||
                           btn.closest('[data-test-id="create-engagement-call-button"]');
      if (isCallButton && !btn.dataset.intercepted) {
        btn.dataset.intercepted = "true";
        btn.addEventListener('click', function(e) {
          if (!window.location.hostname.includes('hubspot')) return;
          e.preventDefault(); e.stopPropagation();
          try {
            let targetUrl = window.location.href;
            const panel = btn.closest('.ui-drawer, .floating-panel, [data-test-id*="paged-view"], [data-test-id*="panel"]');
            let contactLink = null;
            if (panel) {
              const allLinks = Array.from(panel.querySelectorAll('a[href*="/record/"], a[href*="/contact/"]'));
              contactLink = allLinks.find(a => {
                const href = a.href;
                return !href.includes('/views/') && !href.includes('/all/') && /\/\d{8,}(\?|$)/.test(href);
              });
            }
            if (!contactLink) {
              const activeRow = document.querySelector('tr[data-test-id*="row"], tr[class*="selected"], tr:hover');
              if (activeRow) {
                const rowLinks = Array.from(activeRow.querySelectorAll('a[href*="/record/"], a[href*="/contact/"]'));
                contactLink = rowLinks.find(a => /\/\d{8,}(\?|$)/.test(a.href));
              }
            }
            if (contactLink) {
              targetUrl = contactLink.href;
            } else {
              const idElement = panel?.querySelector('[data-record-id], [data-id]');
              if (idElement) {
                const id = idElement.dataset.recordId || idElement.dataset.id;
                if (id && id.length >= 8) {
                  const baseUrl = window.location.href.split('/contacts/')[0];
                  const portalId = window.location.href.match(/\/contacts\/(\d+)/)?.[1];
                  if (portalId) {
                    targetUrl = `${baseUrl}/contacts/${portalId}/record/0-1/${id}`;
                  }
                }
              }
            }
            const url = new URL(targetUrl);
            url.searchParams.set('interaction', 'logged-call');
            window.location.href = url.toString();
          } catch (err) { console.error(err); }
        }, true);
      }
    });
  }

  // --- 2. Transformation des liens dans les tableaux (All Contacts) ---
  function handleHubSpotTableLinks() {
    const cells = document.querySelectorAll('td[data-table-external-id*="phone"], td[data-table-external-id*="mobile"], td[data-field*="phone"], td[data-field*="mobile"]');
    cells.forEach(cell => {
      const potentialTargets = cell.querySelectorAll('a, span, div, [role="button"]');
      potentialTargets.forEach(target => {
        const text = target.textContent.trim();
        if (phoneOnlyRegex.test(text) && text.length < 25 && !target.dataset.telProcessed) {
          target.dataset.telProcessed = "true";
          const gVoiceUrl = getGoogleVoiceUrl(text);
          const applyCallStyle = (element) => {
            element.style.setProperty('cursor', 'pointer', 'important');
            element.style.setProperty('text-decoration', 'underline', 'important');
            element.style.setProperty('color', '#0b8043', 'important');
          };
          if (target.tagName === 'A') {
            target.href = gVoiceUrl;
            target.target = "_blank";
            applyCallStyle(target);
            target.addEventListener('click', (e) => {
              e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
              window.open(gVoiceUrl, '_blank');
            }, true);
          } else if (target.children.length === 0 || (target.children.length === 1 && target.firstElementChild.tagName === 'SPAN')) {
            applyCallStyle(target);
            target.addEventListener('click', function(e) {
              e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
              window.open(gVoiceUrl, '_blank');
            }, true);
          }
        }
      });
    });
  }

  // --- 3. Fonctions utilitaires ---
  function isForbidden(node) {
    const forbiddenTags = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON'];
    let parent = node.parentElement;
    while (parent) {
      if (forbiddenTags.includes(parent.tagName)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function hasPhoneContext(el) {
    const attrString = (el.id + ' ' + (el.name || '') + ' ' + (el.getAttribute('data-selenium-test') || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase();
    if (phoneKeywords.some(kw => attrString.includes(kw))) return true;
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label && phoneKeywords.some(kw => label.textContent.toLowerCase().includes(kw))) return true;
    }
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      if (phoneKeywords.some(kw => parent.textContent.toLowerCase().includes(kw))) return true;
      parent = parent.parentElement;
      depth++;
    }
    return false;
  }

  function linkify(node) {
    const text = node.textContent;
    let match;
    let lastIndex = 0;
    const fragments = document.createDocumentFragment();
    let hasMatch = false;
    telPrefixRegex.lastIndex = 0;
    while ((match = telPrefixRegex.exec(text)) !== null) {
      hasMatch = true;
      fragments.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      const a = document.createElement('a');
      const number = match[1];
      a.textContent = match[0]; 
      a.href = getGoogleVoiceUrl(number);
      a.target = "_blank";
      a.style.textDecoration = 'underline';
      a.style.color = 'inherit';
      a.classList.add('tel-linkified');
      fragments.appendChild(a);
      lastIndex = telPrefixRegex.lastIndex;
    }
    if (hasMatch) {
      fragments.appendChild(document.createTextNode(text.substring(lastIndex)));
      node.replaceWith(fragments);
    }
  }

  function handleInputFields(field) {
    if (field.getAttribute('data-selenium-test') === 'property-input-call_dev') return;
    const val = (field.value || '').trim();
    if (!val) return;
    let targetNumber = null;
    telPrefixRegex.lastIndex = 0;
    let match = telPrefixRegex.exec(val);
    if (match) targetNumber = match[1];
    else if (phoneOnlyRegex.test(val) && hasPhoneContext(field)) {
      if (val.length < 30) targetNumber = val;
    }
    if (targetNumber) {
      if (field.nextElementSibling && field.nextElementSibling.classList.contains('tel-btn-added')) return;
      const btn = document.createElement('a');
      btn.href = getGoogleVoiceUrl(targetNumber);
      btn.target = "_blank";
      btn.textContent = chrome.i18n.getMessage("call_button_text") || '📞 Call';
      btn.className = 'tel-btn-added';
      Object.assign(btn.style, {
        display: 'inline-block', marginLeft: '2px', marginTop: '5px',
        padding: '2px 10px', backgroundColor: '#0b8043', color: 'white', 
        borderRadius: '4px', textDecoration: 'none', fontSize: '12px', 
        fontWeight: '600', verticalAlign: 'middle', cursor: 'pointer', transition: 'background-color 0.2s'
      });
      btn.onmouseenter = () => btn.style.backgroundColor = '#096d39';
      btn.onmouseleave = () => btn.style.backgroundColor = '#0b8043';
      if (!field.parentNode) return;
      field.parentNode.insertBefore(btn, field.nextSibling);
    }
  }

  function walk(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (isForbidden(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let i = nodes.length - 1; i >= 0; i--) linkify(nodes[i]);
    const inputs = root.querySelectorAll ? root.querySelectorAll('textarea, input') : [];
    inputs.forEach(handleInputFields);
    handleHubSpotCallButton();
    handleHubSpotTableLinks();
  }

  walk(document.body);

  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      walk(document.body);
    }, 50);
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
})();
