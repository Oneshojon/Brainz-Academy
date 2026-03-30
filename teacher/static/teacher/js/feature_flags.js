const TOGGLE_URL = document.getElementById('page-data').dataset.toggleUrl;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function toggleFlag(flagId, checkbox) {
  const ind = document.getElementById('ind-' + flagId)
  const row = document.getElementById('flag-row-' + flagId)
  ind.className = 'save-indicator saving'
  ind.textContent = 'saving…'

  try {
    const res = await fetch(TOGGLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),   // ← from cookie, not template tag
      },
      body: JSON.stringify({ flag_id: flagId, enabled: checkbox.checked }),
    })
    const data = await res.json()

    if (data.success) {
      row.className = 'flag-row ' + (checkbox.checked ? 'enabled' : 'disabled')
      ind.className = 'save-indicator saved'
      ind.textContent = '✓ saved'
      setTimeout(() => { ind.className = 'save-indicator' }, 2000)
    } else {
      checkbox.checked = !checkbox.checked
      ind.className = 'save-indicator'
      alert('Failed to update flag.')
    }
  } catch (err) {
    checkbox.checked = !checkbox.checked
    ind.className = 'save-indicator'
    alert('Network error.')
  }
}