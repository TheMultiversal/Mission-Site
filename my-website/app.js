async function fetchChecklist(){
  try{
    const res = await fetch('/data/checklist.json');
    if(!res.ok) throw new Error('Not found');
    return await res.json();
  }catch(e){
    return [];
  }
}

function render(items){
  const ul = document.getElementById('checklist');
  ul.innerHTML = '';
  const showComplete = document.getElementById('show-complete')?.checked;
  items.forEach(it=>{
    if(!showComplete && it.done) return;
    const li = document.createElement('li');
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!it.done; cb.dataset.id = it.id;
    cb.addEventListener('change', e => {
      // local toggle only
      const id = e.target.dataset.id;
      const key = `check_${id}`;
      localStorage.setItem(key, e.target.checked?'1':'0');
    });
    const span = document.createElement('span'); span.innerText = `${it.id}. ${it.text}`;
    li.appendChild(cb);
    li.appendChild(span);
    ul.appendChild(li);

    // restore local state
    const saved = localStorage.getItem(`check_${it.id}`);
    if(saved !== null){ cb.checked = saved === '1'; }
  });
}

async function init(){
  const items = await fetchChecklist();
  render(items);
  document.getElementById('show-complete').addEventListener('change', ()=>render(items));
  document.getElementById('refresh').addEventListener('click', ()=>{
    alert('Regenerate the snapshot with: node ./scripts/export-checklist-json.js');
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
