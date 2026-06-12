(function(){
  try {
    const code = window.__PSICOSAUDE_APP_CODE || "";
    window.__PSICOSAUDE_APP_CODE = "";
    (0, eval)(code);
  } catch (err) {
    document.getElementById("app").innerHTML = `<div style="padding:24px;font-family:Arial"><h1>Erro ao carregar o PsicoSaúde</h1><pre>${String(err.stack || err)}</pre></div>`;
    console.error(err);
  }
})();
