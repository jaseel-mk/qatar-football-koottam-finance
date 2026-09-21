(() => {
  const select = document.getElementById('themeSelect');
  select.value = QFKTheme.get();
  select.addEventListener('change', () => QFKTheme.set(select.value));
  document.getElementById('backupShortcut').addEventListener('click', () => {
    switchPage('reports');
    closeSidebar();
    const heading = document.getElementById('backupHeading');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
    heading.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  });
  const sidebar=document.getElementById('sidebar');
  const mobile=matchMedia('(max-width: 850px)');
  const update=()=>{sidebar.inert=mobile.matches&&!sidebar.classList.contains('is-open');};
  new MutationObserver(update).observe(sidebar,{attributes:true,attributeFilter:['class']});
  mobile.addEventListener('change',update);update();
  sidebar.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!mobile.matches||!sidebar.classList.contains('is-open'))return;
    const controls=[...sidebar.querySelectorAll('button,select,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
})();
