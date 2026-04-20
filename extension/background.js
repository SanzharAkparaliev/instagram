const CRM_URL = 'http://147.45.219.116';
const PARSER_SECRET = 'parser_internal_secret';

// Instagram cookie өзгөргөндө текшерүү
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (changeInfo.cookie.domain.includes('instagram.com') && changeInfo.cookie.name === 'sessionid' && !changeInfo.removed) {
    console.log('[CRM] sessionid cookie табылды!');

    // Бардык instagram cookie'лерди алуу
    const cookies = await chrome.cookies.getAll({ domain: '.instagram.com' });

    // localStorage'тон parserId алуу
    const tabs = await chrome.tabs.query({ url: 'https://*.instagram.com/*' });
    if (tabs.length === 0) return;

    // CRM'ден parserId алуу
    const crmTabs = await chrome.tabs.query({ url: CRM_URL + '/*' });

    // parserId storage'тон алуу
    const data = await chrome.storage.local.get('parserId');
    const parserId = data.parserId;

    if (!parserId) {
      console.log('[CRM] parserId табылган жок. CRM\'де "Войти" басыңыз.');
      return;
    }

    // Cookie'лерди CRM backend'ке жөнөтүү
    const cookieData = cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
    }));

    try {
      const res = await fetch(`${CRM_URL}/api/parser/parsers/${parserId}/cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parser-Token': PARSER_SECRET,
        },
        body: JSON.stringify({ cookies: cookieData }),
      });

      if (res.ok) {
        console.log('[CRM] Cookie сакталды!');

        // Parser статусун жаңыртуу
        await fetch(`${CRM_URL}/api/parser/parsers/${parserId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Parser-Token': PARSER_SECRET,
          },
          body: JSON.stringify({ status: 'idle' }),
        });

        // Билдирүү көрсөтүү
        chrome.tabs.sendMessage(tabs[0].id, { type: 'CRM_SUCCESS' }).catch(() => {});

        // parserId тазалоо
        await chrome.storage.local.remove('parserId');
      }
    } catch (err) {
      console.error('[CRM] Cookie жөнөтүүдө ката:', err);
    }
  }
});

// CRM'ден parserId кабыл алуу (message listener)
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_PARSER_ID') {
    chrome.storage.local.set({ parserId: msg.parserId });
    sendResponse({ ok: true });
  }
});

// CRM frontend'тен message алуу (window.postMessage аркылуу)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_PARSER_ID') {
    chrome.storage.local.set({ parserId: msg.parserId });
    console.log('[CRM] parserId сакталды:', msg.parserId);
    sendResponse({ ok: true });
  }
});
