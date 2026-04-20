// CRM бетинен parserId алып, расширенге жөнөтөт
setInterval(() => {
  const parserId = localStorage.getItem('crm_parserId');
  if (parserId) {
    chrome.runtime.sendMessage({ type: 'SET_PARSER_ID', parserId });
  }
}, 2000);
