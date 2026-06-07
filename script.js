/* ============================
   SARKARI PHOTO CONVERTER — JS
   ============================ */

// Current exam state
var exam = {
  name: '', org: '', w: 0, h: 0, maxKB: 0, fmt: 'jpeg', size: ''
};
var currentStep = 0;  // 0=upload, 1=preview, 2=download
var loadedImage = null;
var currentQuality = 0.90;

// =====================
// OPEN MODAL
// =====================
function openExam(name, w, h, maxKB, fmt, sizeLabel, org) {
  exam.name   = name;
  exam.org    = org;
  exam.w      = w;
  exam.h      = h;
  exam.maxKB  = maxKB;
  exam.fmt    = fmt;   // 'jpeg' | 'png'
  exam.size   = sizeLabel;

  // Fill header
  document.getElementById('mExamName').textContent  = name;
  document.getElementById('mOrg').textContent        = org;
  document.getElementById('mBadge').textContent      = name.split(' ')[0].toUpperCase();

  // Fill spec bar
  document.getElementById('mSize').textContent   = sizeLabel;
  document.getElementById('mMaxKB').textContent  = 'Max ' + maxKB + ' KB';
  document.getElementById('mFmt').textContent    = fmt.toUpperCase() + ' (.'+fmt+')';
  document.getElementById('mDims').textContent   = w + ' × ' + h + ' px';

  // Reset to step 0
  resetModal();

  // Show modal
  document.getElementById('cvModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// =====================
// RESET MODAL TO STEP 0
// =====================
function resetModal() {
  currentStep   = 0;
  loadedImage   = null;
  currentQuality = 0.90;

  // Reset file input
  document.getElementById('fileIn').value = '';

  // Reset quality slider
  document.getElementById('qSlider').value = 90;
  document.getElementById('qLabel').textContent = '90';

  // Show/hide panels
  showPanel(0);

  // Buttons
  document.getElementById('btnNext').textContent  = 'Upload Photo First';
  document.getElementById('btnNext').disabled      = true;
  document.getElementById('btnBack').classList.add('hidden');
  document.getElementById('btnDl').classList.add('hidden');
  document.getElementById('btnNext').classList.remove('hidden');

  // Steps
  setStepUI(0);
}

// =====================
// CLOSE MODAL
// =====================
function closeModal() {
  document.getElementById('cvModal').style.display = 'none';
  document.body.style.overflow = '';
  loadedImage = null;
}

// Close on overlay click
document.getElementById('cvModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// =====================
// FILE LOADING
// =====================
function loadFile(input) {
  var file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (JPG, PNG, WebP etc.)');
    return;
  }
  readAndShow(file);
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag-over');
  var file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Please drop a valid image file.');
    return;
  }
  readAndShow(file);
}

function readAndShow(file) {
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      loadedImage = img;
      // Show original info
      document.getElementById('origImg').src = ev.target.result;
      document.getElementById('origMeta').innerHTML =
        '<b>' + img.width + ' × ' + img.height + ' px</b><br>' + fmtBytes(file.size);

      // Draw converted preview
      drawCanvas();

      // Enable next button
      document.getElementById('btnNext').textContent = 'Preview Converted Photo →';
      document.getElementById('btnNext').disabled = false;
    };
    img.onerror = function() { alert('Could not load image. Please try another file.'); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// =====================
// DRAW CANVAS
// =====================
function drawCanvas() {
  if (!loadedImage) return;

  var canvas = document.getElementById('cvCanvas');
  canvas.width  = exam.w;
  canvas.height = exam.h;
  var ctx = canvas.getContext('2d');

  // White background (needed for JPEG transparency)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exam.w, exam.h);

  // Center-crop to fill target aspect ratio
  var tAR = exam.w / exam.h;
  var sAR = loadedImage.width / loadedImage.height;
  var sx, sy, sw, sh;
  if (sAR > tAR) {
    // Source wider → crop left/right
    sh = loadedImage.height;
    sw = loadedImage.height * tAR;
    sy = 0;
    sx = (loadedImage.width - sw) / 2;
  } else {
    // Source taller → crop top/bottom
    sw = loadedImage.width;
    sh = loadedImage.width / tAR;
    sx = 0;
    sy = (loadedImage.height - sh) / 2;
  }

  ctx.drawImage(loadedImage, sx, sy, sw, sh, 0, 0, exam.w, exam.h);

  // Estimate size
  var mime = exam.fmt === 'png' ? 'image/png' : 'image/jpeg';
  var dataUrl = canvas.toDataURL(mime, currentQuality);
  var bytes = dataUrlBytes(dataUrl);

  document.getElementById('cvMeta').innerHTML =
    '<b>' + exam.w + ' × ' + exam.h + ' px</b><br>' +
    fmtBytes(bytes) + (bytes > exam.maxKB * 1024 ? ' ⚠️ Over limit' : ' ✅ OK');

  // Also update download specs
  document.getElementById('dlInfo').textContent = 'Converted to ' + exam.name + ' specifications';
  document.getElementById('dlSpecs').textContent =
    exam.w + ' × ' + exam.h + ' px  •  ' + fmtBytes(bytes) + '  •  ' + exam.fmt.toUpperCase();
}

// =====================
// QUALITY SLIDER
// =====================
function updateQuality(val) {
  currentQuality = parseInt(val) / 100;
  document.getElementById('qLabel').textContent = val;
  drawCanvas();
}

// =====================
// STEP NAVIGATION
// =====================
function nextStep() {
  if (currentStep === 0 && loadedImage) {
    // Go to preview
    currentStep = 1;
    showPanel(1);
    setStepUI(1);
    document.getElementById('btnBack').classList.remove('hidden');
    document.getElementById('btnNext').textContent = 'Looks Good — Download →';
    drawCanvas();
  } else if (currentStep === 1) {
    // Go to download
    currentStep = 2;
    showPanel(2);
    setStepUI(2);
    document.getElementById('btnNext').classList.add('hidden');
    document.getElementById('btnDl').classList.remove('hidden');
  }
}

function goBack() {
  if (currentStep === 1) {
    currentStep = 0;
    showPanel(0);
    setStepUI(0);
    document.getElementById('btnBack').classList.add('hidden');
    document.getElementById('btnNext').classList.remove('hidden');
    document.getElementById('btnDl').classList.add('hidden');
    document.getElementById('btnNext').textContent = loadedImage ? 'Preview Converted Photo →' : 'Upload Photo First';
    document.getElementById('btnNext').disabled = !loadedImage;
  } else if (currentStep === 2) {
    currentStep = 1;
    showPanel(1);
    setStepUI(1);
    document.getElementById('btnNext').classList.remove('hidden');
    document.getElementById('btnDl').classList.add('hidden');
    document.getElementById('btnNext').textContent = 'Looks Good — Download →';
    document.getElementById('btnNext').disabled = false;
  }
}

function showPanel(step) {
  document.getElementById('panelUpload').classList.toggle('hidden',   step !== 0);
  document.getElementById('panelPreview').classList.toggle('hidden',  step !== 1);
  document.getElementById('panelDownload').classList.toggle('hidden', step !== 2);
}

function setStepUI(active) {
  var nums = ['stepNum1','stepNum2','stepNum3'];
  // stepNum1 is inside step1 div
  var el1 = document.querySelector('#step1 .step-num');
  var el2 = document.getElementById('stepNum2');
  var el3 = document.getElementById('stepNum3');
  var els = [el1, el2, el3];
  els.forEach(function(el, i) {
    if (!el) return;
    el.classList.remove('active-step','done-step');
    if (i < active) el.classList.add('done-step');
    else if (i === active) el.classList.add('active-step');
  });
}

// =====================
// DOWNLOAD
// =====================
function downloadPhoto() {
  if (!loadedImage) return;

  var canvas = document.getElementById('cvCanvas');
  var mime = exam.fmt === 'png' ? 'image/png' : 'image/jpeg';

  // Auto-compress: reduce quality until under maxKB
  var q = currentQuality;
  var dataUrl = canvas.toDataURL(mime, q);
  var iterations = 0;
  while (dataUrlBytes(dataUrl) > exam.maxKB * 1024 && q > 0.15 && iterations < 20) {
    q -= 0.05;
    dataUrl = canvas.toDataURL(mime, q);
    iterations++;
  }

  var ext = exam.fmt === 'png' ? '.png' : '.jpg';
  var safeName = exam.name.replace(/[^a-zA-Z0-9]+/g, '_');
  var filename = 'Photo_' + safeName + ext;

  var a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Show success feedback
  document.getElementById('btnDl').textContent = '✅ Downloaded!';
  setTimeout(function() {
    document.getElementById('btnDl').textContent = '⬇ Download Photo';
  }, 3000);
}

// =====================
// EXAM SEARCH FILTER
// =====================
function filterExams(query) {
  query = query.toLowerCase().trim();
  var cards = document.querySelectorAll('.exam-card');
  var anyVisible = false;

  cards.forEach(function(card) {
    var tags = (card.dataset.tags || '').toLowerCase();
    var text = card.innerText.toLowerCase();
    var match = !query || tags.includes(query) || text.includes(query);
    card.classList.toggle('hidden', !match);
    if (match) anyVisible = true;
  });

  document.getElementById('noResults').classList.toggle('hidden', anyVisible);
}

// =====================
// HELPERS
// =====================
function dataUrlBytes(dataUrl) {
  var base64 = dataUrl.split(',')[1] || '';
  return Math.round(base64.length * 3 / 4);
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}
