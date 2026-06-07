// =============================================
// SARKARI PHOTO CONVERTER — JavaScript
// =============================================

let currentExam = null;
let currentTargetW = 0;
let currentTargetH = 0;
let currentMaxKB = 0;
let currentFormat = 'image/jpeg';

// ---- Search Filter ----
function filterExams() {
    const q = document.getElementById('examSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.exam-card');
    cards.forEach(card => {
        const text = (card.dataset.exam || '') + ' ' + card.innerText.toLowerCase();
        card.classList.toggle('hidden', q.length > 0 && !text.includes(q));
    });
}

// ---- Open Converter Modal ----
function openConverter(examName, targetW, targetH, maxKB, format, sizeLabel) {
    currentExam = examName;
    currentTargetW = targetW;
    currentTargetH = targetH;
    currentMaxKB = maxKB;
    currentFormat = format;

    document.getElementById('modalExamName').textContent = examName;
    document.getElementById('modalSpecText').textContent = 'Official Photo Specifications';
    document.getElementById('specSize').textContent = sizeLabel;
    document.getElementById('specFileSize').textContent = 'Max ' + maxKB + ' KB';
    document.getElementById('specFormat').textContent = format === 'image/jpeg' ? 'JPEG (.jpg)' : format === 'image/png' ? 'PNG (.png)' : 'WebP (.webp)';

    // Reset UI
    document.getElementById('previewArea').classList.add('hidden');
    document.getElementById('uploadZone').style.display = '';
    document.getElementById('photoInput').value = '';

    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ---- Close Modal ----
function closeConverterModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function closeModal(e) {
    if (e.target === document.getElementById('modalOverlay')) {
        closeConverterModal();
    }
}

// ---- Handle Photo Upload ----
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            processImage(img, file);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processImage(img, file) {
    // Show original info
    document.getElementById('origMeta').textContent =
        img.width + ' × ' + img.height + ' px | ' + formatBytes(file.size);
    document.getElementById('originalImg').src = img.src;

    // Draw to canvas at target size
    const canvas = document.getElementById('outputCanvas');
    canvas.width = currentTargetW;
    canvas.height = currentTargetH;
    const ctx = canvas.getContext('2d');

    // Fill white background (important for JPEG)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, currentTargetW, currentTargetH);

    // Smart crop: center-crop to fill target aspect ratio
    const targetAspect = currentTargetW / currentTargetH;
    const srcAspect = img.width / img.height;

    let sx, sy, sw, sh;
    if (srcAspect > targetAspect) {
        // Source is wider — crop sides
        sh = img.height;
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
        sy = 0;
    } else {
        // Source is taller — crop top/bottom
        sw = img.width;
        sh = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, currentTargetW, currentTargetH);

    // Get output size estimate
    let quality = 0.92;
    let dataUrl = canvas.toDataURL(currentFormat, quality);

    // Auto-compress to fit within maxKB
    let attempts = 0;
    while (dataUrlToBytes(dataUrl) > currentMaxKB * 1024 && quality > 0.2 && attempts < 15) {
        quality -= 0.05;
        dataUrl = canvas.toDataURL(currentFormat, quality);
        attempts++;
    }

    const finalBytes = dataUrlToBytes(dataUrl);
    document.getElementById('convertedMeta').textContent =
        currentTargetW + ' × ' + currentTargetH + ' px | ' + formatBytes(finalBytes);

    // Show preview
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('previewArea').classList.remove('hidden');
}

function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    return Math.round((base64.length * 3) / 4);
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
}

// ---- Download ----
function downloadPhoto() {
    const canvas = document.getElementById('outputCanvas');
    let quality = 0.92;
    let dataUrl = canvas.toDataURL(currentFormat, quality);

    // Compress if needed
    while (dataUrlToBytes(dataUrl) > currentMaxKB * 1024 && quality > 0.2) {
        quality -= 0.05;
        dataUrl = canvas.toDataURL(currentFormat, quality);
    }

    const ext = currentFormat === 'image/jpeg' ? '.jpg' :
                currentFormat === 'image/png' ? '.png' : '.webp';
    const safeName = currentExam.replace(/[\s/]+/g, '_');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'Photo_' + safeName + ext;
    link.click();
}

// ---- Drag & Drop on Upload Zone ----
document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('uploadZone');
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#2563c7';
        zone.style.background = '#f0f4ff';
    });
    zone.addEventListener('dragleave', () => {
        zone.style.borderColor = '';
        zone.style.background = '';
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        zone.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            // Simulate file input
            const dt = new DataTransfer();
            dt.items.add(file);
            document.getElementById('photoInput').files = dt.files;
            handlePhotoUpload({ target: { files: dt.files } });
        }
    });

    // Keyboard close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeConverterModal();
    });
});
                          
