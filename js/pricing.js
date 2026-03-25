(function initPricing() {
  const totalEl = document.getElementById('pricingTotal');
  const savingEl = document.getElementById('pricingSaving');
  const requestBtn = document.getElementById('requestBtn');
  const configuratorEl = document.getElementById('preis-konfigurator');

  if (!totalEl || !savingEl) return; // Pricing page not present

  const packages = {
    starter: {
      key: 'starter',
      price: 179,
      pages: '99',
      revision: '49',
      support: '0',
      coreExtras: ['kontaktformular', 'maps'],
    },
    business: {
      key: 'business',
      price: 349,
      pages: '149',
      revision: '99',
      support: '39',
      coreExtras: ['kontaktformular', 'maps', 'seo-grund'],
    },
    premium: {
      key: 'premium',
      price: 649,
      pages: '249',
      revision: '149',
      support: '99',
      coreExtras: ['kontaktformular', 'maps', 'seo-grund', 'analytics', 'seo-texte'],
    },
  };

  function formatEuro(amount) {
    const n = Math.round(Number(amount) || 0);
    return `${n} €`;
  }

  function getCheckedRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function getSelectedExtras() {
    return Array.from(document.querySelectorAll('input[name="extra"]:checked'));
  }

  function setRadioChecked(name, value) {
    const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  }

  function setExtrasForCore(coreExtras) {
    const extraInputs = Array.from(document.querySelectorAll('input[name="extra"]'));
    extraInputs.forEach(i => {
      const key = i.dataset.extra;
      i.checked = coreExtras.includes(key);
    });
  }

  function matchPackageByCore(selected) {
    const { pagesVal, revisionVal, supportVal, selectedExtraKeys } = selected;

    const order = ['starter', 'business', 'premium'];
    for (const k of order) {
      const pkg = packages[k];
      const coreMatches =
        pagesVal === pkg.pages &&
        revisionVal === pkg.revision &&
        supportVal === pkg.support &&
        pkg.coreExtras.every(key => selectedExtraKeys.includes(key));

      if (coreMatches) return pkg;
    }
    return null;
  }

  function computeTotals() {
    const pagesRadio = document.querySelector('input[name="pages"]:checked');
    const revisionRadio = document.querySelector('input[name="revision"]:checked');
    const supportRadio = document.querySelector('input[name="support"]:checked');

    const pagesVal = pagesRadio ? pagesRadio.value : '0';
    const revisionVal = revisionRadio ? revisionRadio.value : '0';
    const supportVal = supportRadio ? supportRadio.value : '0';

    const selectedExtraInputs = getSelectedExtras();
    const selectedExtraKeys = selectedExtraInputs.map(i => i.dataset.extra);

    // Raw totals = simple sum of all selected option prices.
    let rawTotal = 0;
    let oldTotal = 0;

    function addRadio(radio) {
      if (!radio) return;
      rawTotal += Number(radio.value || 0);
      oldTotal += Number(radio.dataset.oldPrice || radio.value || 0);
    }

    addRadio(pagesRadio);
    addRadio(revisionRadio);
    addRadio(supportRadio);

    selectedExtraInputs.forEach(i => {
      rawTotal += Number(i.value || 0);
      oldTotal += Number(i.dataset.oldPrice || i.value || 0);
    });

    const selected = { pagesVal, revisionVal, supportVal, selectedExtraKeys };
    const matchedPkg = matchPackageByCore(selected);

    // If the selection matches a predefined package core, we replace the core cost
    // with the package price (leaving extra/non-core add-ons on top).
    let effectiveTotal = rawTotal;
    if (matchedPkg) {
      const coreSet = new Set(matchedPkg.coreExtras);
      const nonCoreExtrasTotal = selectedExtraInputs
        .filter(i => !coreSet.has(i.dataset.extra))
        .reduce((sum, i) => sum + Number(i.value || 0), 0);

      effectiveTotal = matchedPkg.price + nonCoreExtrasTotal;
    }

    const savings = Math.max(oldTotal - effectiveTotal, 0);
    return { rawTotal, oldTotal, effectiveTotal, savings, selectedExtrasCount: selectedExtraInputs.length };
  }

  function updateUI() {
    const { effectiveTotal, savings, selectedExtrasCount } = computeTotals();

    totalEl.textContent = formatEuro(effectiveTotal);
    savingEl.textContent = `Du sparst ${formatEuro(savings)}`;

    if (requestBtn) {
      requestBtn.href = `index.html#contact?preis=${Math.round(effectiveTotal)}&extras=${selectedExtrasCount}`;
    }
  }

  function applyPackage(pkgKey) {
    const pkg = packages[pkgKey];
    if (!pkg) return;

    setRadioChecked('pages', pkg.pages);
    setRadioChecked('revision', pkg.revision);
    setRadioChecked('support', pkg.support);
    setExtrasForCore(pkg.coreExtras);

    updateUI();
  }

  // Wire input updates
  const inputs = Array.from(
    document.querySelectorAll(
      '#preis-konfigurator input[name="pages"], #preis-konfigurator input[name="revision"], #preis-konfigurator input[name="support"], #preis-konfigurator input[name="extra"]'
    )
  );
  inputs.forEach(i => {
    i.addEventListener('change', updateUI);
    i.addEventListener('input', updateUI);
  });

  // Package buttons prefill calculator + scroll into view
  Array.from(document.querySelectorAll('.pricing-package-btn, .pricing-advice-btn')).forEach(btn => {
    btn.addEventListener('click', e => {
      const pkgKey = btn.dataset.package;
      if (!pkgKey) return;

      e.preventDefault();
      applyPackage(pkgKey);

      if (configuratorEl) {
        configuratorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Initial calculation
  updateUI();
})();

