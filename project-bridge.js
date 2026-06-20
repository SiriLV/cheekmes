(()=>{
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  if(document.querySelector('.slv-bridge'))return;
  const nav=document.createElement('nav');
  nav.className='slv-bridge';
  nav.setAttribute('aria-label','SiriLV projects');
  nav.innerHTML='<a href="https://sirilv.github.io/">SiriLV OS</a><a href="https://sirilv.github.io/web/">Web IDE</a><a class="active" href="./">CheekMes</a>';
  document.body.append(nav);
});
})();
