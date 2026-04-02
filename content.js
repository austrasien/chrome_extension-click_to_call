(function() {
  const telPrefixRegex = /tel:\s*([\s.\-()]*\+?[0-9][0-9\s.\-()]{4,25})/g;
  const phoneOnlyRegex = /(?:\+|0)[0-9][0-9\s.\-()]{7,20}/;
  const phoneKeywords = ['phone', 'mobile', 'tel', 'call', 'téléphone', 'portable', 'whatsapp'];

  function getGoogleVoiceUrl(number) {
    const sanitizedNumber = number.replace(/[^\d+]/g, '');
    const encodedNumber = sanitizedNumber.replace('+', '%2B');
    return `https://voice.google.com/u/0/calls?a=nc,${encodedNumber}`;
  }

  // --- 1. Détournement du bouton "Call" (Header) ---
  function handleHubSpotCallButton() {
    const callButton = document.querySelector('[data-test-id="create-engagement-call-button"]');
    if (callButton && !callButton.dataset.intercepted) {
      callButton.dataset.intercepted = "true";
      callButton.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.get('interaction') !== 'logged-call') {
            url.searchParams.set('interaction', 'logged-call');
            window.location.href = url.toString();
          }
        } catch (err) { console.error(err); }
      }, true);
    }
  }

  // --- 2. Transformation des liens dans les tableaux (All Contacts) ---
  function handleHubSpotTableLinks() {
    // HubSpot utilise souvent des boutons ou des spans cliquables pour les numéros dans les listes
    // On cherche les éléments qui ressemblent à des numéros de téléphone dans les cellules de tableau
    const potentialLinks = document.querySelectorAll('td [role="button"], td a, [data-field="phone"] span, [data-field="mobilephone"] span');
    
    potentialLinks.forEach(el => {
      const text = el.textContent.trim();
      // Si le texte ressemble à un numéro de téléphone et n'a pas encore été traité
      if (phoneOnlyRegex.test(text) && text.length < 25 && !el.dataset.telProcessed) {
        el.dataset.telProcessed = "true";
        
        const gVoiceUrl = getGoogleVoiceUrl(text);
        
        // Si c'est déjà un lien, on change son href
        if (el.tagName === 'A') {
          el.href = gVoiceUrl;
          el.target = "_blank";
          el.onclick = (e) => e.stopPropagation(); // Évite de déclencher les scripts HubSpot
        } else {
          // Sinon on entoure le texte d'un lien tel: ou on change son style pour montrer qu'il est cliquable
          el.style.cursor = 'pointer';
          el.style.textDecoration = 'underline';
          el.style.color = '#007bff';
          el.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            window.open(gVoiceUrl, '_blank');
          }, true);
        }
      }
    });
  }

  // --- 3. Fonctions utilitaires et détection ---
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
    if (match) {
      targetNumber = match[1];
    } else if (phoneOnlyRegex.test(val) && hasPhoneContext(field)) {
      if (val.length < 30) targetNumber = val;
    }
    if (targetNumber) {
      if (field.nextElementSibling && field.nextElementSibling.classList.contains('tel-btn-added')) return;
      
      const btn = document.createElement('a');
      btn.href = getGoogleVoiceUrl(targetNumber);
      btn.target = "_blank";
      
      btn.textContent = '📞 Appeler';
      btn.className = 'tel-btn-added';
      Object.assign(btn.style, {
        display: 'inline-block', marginLeft: '8px', padding: '2px 10px',
        backgroundColor: '#007bff', color: 'white', borderRadius: '4px',
        textDecoration: 'none', fontSize: '12px', fontWeight: '600',
        verticalAlign: 'middle', cursor: 'pointer', transition: 'background-color 0.2s'
      });
      btn.onmouseenter = () => btn.style.backgroundColor = '#0056b3';
      btn.onmouseleave = () => btn.style.backgroundColor = '#007bff';
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

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) walk(node);
        else if (node.nodeType === Node.TEXT_NODE && !isForbidden(node)) linkify(node);
      });
      if (mutation.type === 'attributes' && (mutation.target.tagName === 'TEXTAREA' || mutation.target.tagName === 'INPUT')) {
          handleInputFields(mutation.target);
      }
      handleHubSpotCallButton();
      handleHubSpotTableLinks();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
})();
