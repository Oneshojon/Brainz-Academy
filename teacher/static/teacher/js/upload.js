 function showFile(input) {
    const name = input.files[0]?.name || '';
    document.getElementById('fileChosen').textContent = name ? `✓ ${name}` : '';
  }

  const drop = document.getElementById('dropZone');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('fileInput').files = dt.files;
      showFile(document.getElementById('fileInput'));
    }
  });