class PixelConverter {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.uploadLabel = document.querySelector('.upload-label');
        this.previewSection = document.getElementById('preview-section');
        this.previewImage = document.getElementById('previewImage');
        this.originalInfo = document.getElementById('originalInfo');
        this.settingsSection = document.getElementById('settingsSection');
        this.actionsSection = document.getElementById('actionsSection');
        
        this.widthInput = document.getElementById('widthInput');
        this.heightInput = document.getElementById('heightInput');
        this.lockAspectRatio = document.getElementById('lockAspectRatio');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.formatSelect = document.getElementById('formatSelect');
        
        this.canvas = document.getElementById('conversionCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.convertedInfo = document.getElementById('convertedInfo');
        
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        this.currentImage = null;
        this.originalDimensions = { width: 0, height: 0 };
        this.aspectRatio = 1;
        
        this.init();
    }

    init() {
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        this.uploadLabel.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadLabel.addEventListener('dragleave', () => this.handleDragLeave());
        this.uploadLabel.addEventListener('drop', (e) => this.handleDrop(e));
        
        this.widthInput.addEventListener('input', () => this.handleDimensionChange('width'));
        this.heightInput.addEventListener('input', () => this.handleDimensionChange('height'));
        
        this.lockAspectRatio.addEventListener('change', () => this.updatePreview());
        
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
            this.updatePreview();
        });
        this.formatSelect.addEventListener('change', () => this.updatePreview());
        
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        console.log('🚀 Pixel Converter initialized');
    }

    handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        
        this.loadImage(file);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadLabel.classList.add('drag-active');
    }

    handleDragLeave() {
        this.uploadLabel.classList.remove('drag-active');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadLabel.classList.remove('drag-active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                this.currentImage = img;
                this.originalDimensions = {
                    width: img.width,
                    height: img.height
                };
                this.aspectRatio = img.width / img.height;
                
                this.previewImage.src = e.target.result;
                this.originalInfo.textContent = 
                    `Original: ${img.width} × ${img.height}px | ${(file.size / 1024 / 1024).toFixed(2)}MB`;
                
                this.widthInput.value = img.width;
                this.heightInput.value = img.height;
                
                this.previewSection.classList.remove('hidden');
                this.settingsSection.classList.remove('hidden');
                this.actionsSection.classList.remove('hidden');
                
                this.updatePreview();
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    handleDimensionChange(type) {
        if (!this.lockAspectRatio.checked) {
            this.updatePreview();
            return;
        }

        const width = parseInt(this.widthInput.value) || 0;
        const height = parseInt(this.heightInput.value) || 0;

        if (type === 'width' && width > 0) {
            const newHeight = Math.round(width / this.aspectRatio);
            this.heightInput.value = newHeight;
        } else if (type === 'height' && height > 0) {
            const newWidth = Math.round(height * this.aspectRatio);
            this.widthInput.value = newWidth;
        }

        this.updatePreview();
    }

    updatePreview() {
        if (!this.currentImage) return;

        const width = parseInt(this.widthInput.value) || this.originalDimensions.width;
        const height = parseInt(this.heightInput.value) || this.originalDimensions.height;
        const quality = parseInt(this.qualitySlider.value) / 100;
        const format = this.formatSelect.value;

        this.canvas.width = width;
        this.canvas.height = height;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);

        const scale = Math.min(width / this.currentImage.width, height / this.currentImage.height);
        const x = (width - this.currentImage.width * scale) / 2;
        const y = (height - this.currentImage.height * scale) / 2;

        this.ctx.drawImage(
            this.currentImage,
            x, y,
            this.currentImage.width * scale,
            this.currentImage.height * scale
        );

        const dataUrl = this.canvas.toDataURL(format, quality);
        const sizeInBytes = Math.round(dataUrl.length * 0.75);
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);

        const formatName = {
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'image/webp': 'WebP'
        }[format];

        this.convertedInfo.textContent = 
            `Converted: ${width} × ${height}px | ${formatName} @ ${this.qualitySlider.value}% | ${sizeInKB}KB`;
    }

    downloadImage() {
        if (!this.currentImage) return;

        const format = this.formatSelect.value;
        const quality = parseInt(this.qualitySlider.value) / 100;

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const formatExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp'
            }[format];

            a.href = url;
            a.download = `converted_${Date.now()}.${formatExt}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Image downloaded:', a.download);
        }, format, quality);
    }

    reset() {
        this.imageInput.value = '';
        this.currentImage = null;
        this.originalDimensions = { width: 0, height: 0 };
        this.aspectRatio = 1;

        this.previewSection.classList.add('hidden');
        this.settingsSection.classList.add('hidden');
        this.actionsSection.classList.add('hidden');
        this.uploadLabel.classList.remove('drag-active');

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        console.log('🔄 Reset complete');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelConverter();
});