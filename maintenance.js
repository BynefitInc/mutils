    import CONFIG from 'https://bynefit.org/includes/js/shared/maint-config.js';
    const $ = (id) => document.getElementById(id);

    function formatETA(iso) {
      if (!iso) return '—';
      try {
        const d = new Date(iso);
        const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit', timeZoneName: 'short' });
        return fmt.format(d);
      } catch { return '—'; }
    }
    function setProgress(n) {
      const clamped = Math.max(0, Math.min(100, Number(n || 0)));
      $('progressBar').style.width = clamped + '%';
      $('progressLabel').textContent = clamped + '%';
    }
    
    function setStatusBadge(status) {
      const chip = $('statusChip');
      const strong = $('statusStrong');
      let label = 'Patching';
      let color = 'bg-indigo-400';
      if (status === 'degraded') { label = 'Degraded Services'; color = 'bg-amber-400'; }
      if (status === 'operational') { label = 'Limited Services'; color = 'bg-amber-400'; }
      chip.querySelector('span.relative.inline-flex').className = `relative inline-flex rounded-full h-2 w-2 ${color}`;
      strong.textContent = label;
      $('statusLabel').textContent = label;
      $('aria-live').textContent = `Status updated: ${label}`;
    }

    function rotateTips() {
      let i = 0; const el = $('tipRotator');
      const run = () => { el.textContent = CONFIG.tips[i % CONFIG.tips.length]; i++; };
      run(); setInterval(run, 7000);
    }

    async function fetchJSON(url) {
      const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
      if (!res.ok) throw new Error('Network');
      return await res.json();
    }

    async function poll() {
      const nowFmt = new Intl.DateTimeFormat(undefined, { hour:'numeric', minute:'2-digit' }).format(new Date());
      $('lastPolled').textContent = `polled ${nowFmt}`;
    
      try {
        const data = await fetchJSON(CONFIG.statusEndpoint);
        setStatusBadge(data.status);
        $('leadCopy').textContent = data.message || '';
        if (data.progress != null) setProgress(data.progress);
        if (data.eta) {
          $('etaText').textContent = formatETA(data.eta);
          
        } else {
          $('etaText').textContent = 'TBD';
         
        }
      } catch (e) {
        // do nothing — keep UI as last known state
      }
    
      try {
        const updates = await fetchJSON(CONFIG.updatesEndpoint);
        renderUpdates(updates);
      } catch {}
    }


    function renderUpdates(items) {
      const list = $('updatesList');
      if (!Array.isArray(items) || items.length === 0) {
        list.innerHTML = `<li class="p-6 text-white/60">No updates yet. We’ll post milestones here.</li>`;
        return;
      }
      list.innerHTML = items.map(it => {
        const time = new Date(it.time);
        const tfmt = new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }).format(time);
        return `<li class="p-6 hover:bg-white/5 transition">
          <p class="text-sm text-white/60">${tfmt}</p>
          <p class="mt-1">${escapeHtml(it.text || '')}</p>
        </li>`;
      }).join('');
    }

    function escapeHtml(str){
      const div = document.createElement('div');
      div.innerText = str; return div.innerHTML;
    }

    function init() {
  $('serviceName').textContent = CONFIG.serviceName;
  $('incidentId').textContent = CONFIG.incidentId;
  $('contactLink').href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Maintenance ' + CONFIG.incidentId)}`;
  $('statusPageLink').href = CONFIG.statusPageURL;
  $('twitterLink').href = CONFIG.twitterURL;
  $('refreshEvery').textContent = CONFIG.refreshEvery;
  $('year').textContent = new Date().getFullYear();
  try { $('localTz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}

  rotateTips();
  poll();
  setInterval(poll, (CONFIG.refreshEvery || 30) * 1000);

  $('notifyForm').addEventListener('submit', () => {
    const email = $('notifyEmail').value.trim();
    const result = $('notifyResult');
    if (!email) return;
    result.classList.remove('sr-only');
    result.textContent = 'Thanks! You will be notified.';
    $('notifyBtn').disabled = true;
    $('notifyBtn').textContent = 'Subscribed';
  });
}


    window.addEventListener('load', init);
