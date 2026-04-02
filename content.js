(function() {
  function isContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }
  if (!isContextValid()) return;

  const CALL_BUTTON_TEXT = chrome.i18n.getMessage("call_button_text") || '📞 Call';
  const telPrefixRegex = /tel:\s*([\s.\-()]*\+?[0-9][0-9\s.\-()]{4,25})/g;
  const phoneOnlyRegex = /(?:\+|0|\()[0-9][0-9\s.\-()]{6,25}/g;
  const phoneKeywords = ['phone', 'mobile', 'tel', 'call', 'téléphone', 'portable', 'whatsapp'];
  const exclusionKeywords = ['id', 'ref', 's/n', 'sku', 'ean', 'vin', 'order', 'commande', 'invoice', 'facture', 'tracking', 'quantité', 'quantity', 'batch', 'lot'];
  const DEFAULT_COUNTRY_CODE = '+33';

  function getGoogleVoiceUrl(number) {
    let sanitizedNumber = number.replace(/[^\d+]/g, '');
    if (sanitizedNumber.startsWith('0') && !sanitizedNumber.startsWith('+')) {
      sanitizedNumber = DEFAULT_COUNTRY_CODE + sanitizedNumber.substring(1);
    }
    const encodedNumber = sanitizedNumber.replace('+', '%2B');
    return `https://voice.google.com/u/0/calls?a=nc,${encodedNumber}`;
  }

  function isValidPhoneNumber(text, element) {
    const cleanText = text.trim();
    const digitsOnly = cleanText.replace(/[^\d]/g, '');
    if (/^\d{13,}$/.test(cleanText)) return false;
    if (digitsOnly.length < 5) return false;
    const contextText = (element?.parentElement?.textContent || '').toLowerCase();
    if (exclusionKeywords.some(kw => contextText.includes(kw))) {
      if (!phoneKeywords.some(kw => contextText.includes(kw))) return false;
    }
    return true;
  }

  // --- 1. Détournement du bouton "Call" (HubSpot) ---
  function handleHubSpotCallButton() {
    const selectors = [
      '[data-test-id="create-engagement-call-button"]',
      '[data-unit-test="create-engagement-call-button"]',
      'button i18n-string[data-key*="CALL"]',
      '.uiList [role="button"]',
      'button span'
    ];
    const callTexts = ["Appeler", "Call", "Llamar"];
    const allButtons = document.querySelectorAll(selectors.join(', '));
    
    allButtons.forEach(btn => {
      const text = btn.textContent.trim();
      const isCallButton = btn.matches('[data-test-id*="call"]') || 
                           callTexts.includes(text) ||
                           btn.closest('[data-test-id="create-engagement-call-button"]');
      
      if (isCallButton && !btn.dataset.intercepted) {
        btn.dataset.intercepted = "true";
        
        const performRedirection = function(e) {
          if (!window.location.hostname.includes('hubspot')) return;
          
          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
          
          try {
            let targetUrl = window.location.href;
            
            // MÉTHODE DE PROXIMITÉ : On cherche le lien record le plus proche dans le DOM
            // On remonte les parents jusqu'à trouver un conteneur de panneau ou de ligne
            let current = btn;
            let foundLink = null;
            let depth = 0;
            
            while (current && depth < 15) {
              // On cherche un lien record dans les descendants de ce parent
              const links = Array.from(current.querySelectorAll('a[href*="/record/0-1/"], a[href*="/contact/"]'));
              const specificLink = links.find(a => {
                const href = a.href;
                return !href.includes('/views/') && !href.includes('/all/') && /\/\d{8,}(\?|$)/.test(href);
              });
              
              if (specificLink) {
                foundLink = specificLink.href;
                break;
              }
              current = current.parentElement;
              depth++;
            }

            if (foundLink) {
              targetUrl = foundLink;
            }

            const url = new URL(targetUrl);
            url.searchParams.set('interaction', 'logged-call');
            
            // On force la redirection vers la fiche contact
            window.location.assign(url.toString());
          } catch (err) { console.error(err); }
          return false;
        };

        btn.addEventListener('mousedown', performRedirection, true);
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
      }
    });
  }

  // --- 2. Transformation des tableaux HubSpot ---
  function handleHubSpotTableLinks() {
    const cells = document.querySelectorAll('td[data-table-external-id*="phone"], td[data-table-external-id*="mobile"], td[data-field*="phone"], td[data-field*="mobile"]');
    
    cells.forEach(cell => {
      try {
        const text = cell.textContent.trim();
        phoneOnlyRegex.lastIndex = 0;
        if (!phoneOnlyRegex.test(text) || text.length >= 25) return;

        let btn = cell.querySelector('.tel-btn-added');
        const gVoiceUrl = getGoogleVoiceUrl(text);

        if (!btn) {
          btn = document.createElement('a');
          btn.className = 'tel-btn-added';
          btn.target = "_blank";
          Object.assign(btn.style, {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: '8px', padding: '1px 8px',
            backgroundColor: '#0b8043', color: 'white', borderRadius: '4px',
            textDecoration: 'none', fontSize: '11px', fontWeight: '600',
            cursor: 'pointer', transition: 'background-color 0.2s',
            whiteSpace: 'nowrap', flexShrink: '0'
          });
          btn.onmouseenter = () => btn.style.backgroundColor = '#096d39';
          btn.onmouseleave = () => btn.style.backgroundColor = '#0b8043';
          btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            window.open(gVoiceUrl, '_blank');
          }, true);
          cell.appendChild(btn);
        }

        btn.href = gVoiceUrl;
        btn.textContent = CALL_BUTTON_TEXT;

        cell.style.setProperty('display', 'flex', 'important');
        cell.style.setProperty('align-items', 'center', 'important');
        cell.style.setProperty('flex-direction', 'row', 'important');
        
        const textElement = cell.querySelector('a, span[data-test-id="truncated-object-label"], span') || cell;
        if (textElement) {
          textElement.style.setProperty('color', '#0b8043', 'important');
          textElement.style.setProperty('text-decoration', 'none', 'important');
          if (!textElement.dataset.intercepted) {
            textElement.dataset.intercepted = "true";
            textElement.addEventListener('click', (e) => {
              e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
              window.open(gVoiceUrl, '_blank');
            }, true);
          }
        }
      } catch (e) {}
    });
  }

  // --- 3. Détection de texte brut ---
  function linkify(node) {
    if (!node.parentElement || node.parentElement.closest('.tel-btn-added, a')) return;
    const text = node.textContent;
    let match;
    let lastIndex = 0;
    const fragments = document.createDocumentFragment();
    let hasMatch = false;
    const combinedRegex = /(?:tel:\s*)?((?:\+|0|\()[0-9][0-9\s.\-()]{6,25})/g;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      const number = match[1];
      if (!isValidPhoneNumber(number, node)) continue;
      hasMatch = true;
      fragments.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      const gVoiceUrl = getGoogleVoiceUrl(number);
      const a = document.createElement('a');
      a.textContent = match[0]; 
      a.href = gVoiceUrl;
      a.target = "_blank";
      a.style.color = '#0b8043';
      a.style.textDecoration = 'underline';
      const btn = document.createElement('a');
      btn.className = 'tel-btn-added';
      btn.textContent = ' 📞';
      btn.href = gVoiceUrl;
      btn.target = "_blank";
      btn.style.textDecoration = 'none';
      fragments.appendChild(a);
      fragments.appendChild(btn);
      lastIndex = combinedRegex.lastIndex;
    }
    if (hasMatch) {
      fragments.appendChild(document.createTextNode(text.substring(lastIndex)));
      node.replaceWith(fragments);
    }
  }

  function handleInputFields(field) {
    if (field.getAttribute('data-selenium-test') === 'property-input-call_dev') return;
    if (window.location.hostname.includes('hubspot') && field.closest('td')) return;
    const val = (field.value || '').trim();
    if (!val) return;
    phoneOnlyRegex.lastIndex = 0;
    if (phoneOnlyRegex.test(val)) {
      if (field.nextElementSibling?.classList.contains('tel-btn-added')) return;
      const btn = document.createElement('a');
      btn.href = getGoogleVoiceUrl(val);
      btn.target = "_blank";
      btn.textContent = CALL_BUTTON_TEXT;
      btn.className = 'tel-btn-added';
      Object.assign(btn.style, {
        display: 'inline-block', marginLeft: '2px', marginTop: '5px',
        padding: '2px 10px', backgroundColor: '#0b8043', color: 'white', 
        borderRadius: '4px', textDecoration: 'none', fontSize: '12px', 
        fontWeight: '600', verticalAlign: 'middle', cursor: 'pointer'
      });
      field.parentNode?.insertBefore(btn, field.nextSibling);
    }
  }

  function walk(root) {
    if (!root || !isContextValid()) return;
    const isHubSpot = window.location.hostname.includes('hubspot');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        const forbiddenTags = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON'];
        let p = node.parentElement;
        while (p && p !== root) {
          if (forbiddenTags.includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (isHubSpot && p.tagName === 'TD') return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
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
  const observer = new MutationObserver(() => {
    if (!isContextValid()) { observer.disconnect(); return; }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try { walk(document.body); } catch(e) {}
    }, 50);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
})();
