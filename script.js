const LAYOUT_CONFIG = {
    // Tamang dimensions: width x length (inches converted to pixels at 300 DPI)
    strip2x6: { width: 600, height: 1800, shots: 4 },    // 2x6 inches
    landscape4x6: { width: 1200, height: 1800, shots: 2 }, // 4x6 inches
    single5x7: { width: 1500, height: 2100, shots: 1 }    // 5x7 inches
};

const DOM_STICKER_SIZE = 30; 
const DOM_TEXT_SIZE = 24;

class CameraManager {
    constructor(videoElement) { this.video = videoElement; this.stream = null; }
    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
            this.video.srcObject = this.stream; return true;
        } catch (err) { alert('Camera access denied.'); return false; }
    }
    stop() { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; this.video.srcObject = null; } }
    capture() {
        if (!this.stream) return null;
        const c = document.createElement('canvas'); c.width = this.video.videoWidth; c.height = this.video.videoHeight;
        const ctx = c.getContext('2d'); ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(this.video, 0, 0); return c;
    }
}

class CanvasRenderer {
    constructor(canvasElement) { this.canvas = canvasElement; this.ctx = canvasElement.getContext('2d'); this.layout = null; this.color = '#ffffff'; this.filter = 'none'; }
    setupDimensions(layoutKey) { const config = LAYOUT_CONFIG[layoutKey]; this.layout = config; this.canvas.width = config.width; this.canvas.height = config.height; }
    
    getPhotoSlots() {
        const config = this.layout;
        const slots = [];
        
        // Minimal padding sa gilid para mag-fill ang photos
        const paddingX = config.width * 0.01; // 1% lang sa kaliwa at kanan
        const paddingY = config.height * 0.015;
        const gap = config.height * 0.01;

        if (config.shots === 4) {
            // 2x6 Strip: 4 photos, bawat isa ay 2 wide x 1.5 long
            const w = config.width - (paddingX * 2);
            const h = (config.height * 0.92 - (paddingY * 2) - (gap * 3)) / 4;
            for (let i = 0; i < 4; i++) {
                slots.push({ x: paddingX, y: paddingY + (i * (h + gap)), w, h });
            }
        } else if (config.shots === 2) {
            // 4x6: 2 photos, bawat isa ay 4 wide x 3 long
            const w = config.width - (paddingX * 2);
            const h = (config.height * 0.92 - (paddingY * 2) - gap) / 2;
            for (let i = 0; i < 2; i++) {
                slots.push({ x: paddingX, y: paddingY + (i * (h + gap)), w, h });
            }
        } else {
            // 5x7: 1 large photo, 5 wide x ~6.3 long
            const photoAreaHeight = config.height * 0.92;
            slots.push({ 
                x: paddingX, 
                y: paddingY, 
                w: config.width - (paddingX * 2), 
                h: photoAreaHeight - (paddingY * 2) 
            });
        }
        return slots;
    }

    drawBase(images) {
        const ctx = this.ctx; const config = this.layout;
        ctx.fillStyle = this.color; ctx.fillRect(0, 0, config.width, config.height);
        const slots = this.getPhotoSlots(); ctx.save(); ctx.filter = this.filter === 'none' ? 'none' : this.filter;
        
        images.forEach((img, index) => {
            if (slots[index]) {
                const slot = slots[index];
                
                const imgRatio = img.width / img.height;
                const slotRatio = slot.w / slot.h;
                let drawW, drawH, drawX, drawY;
                
                // "Cover" logic: Picture fills the entire slot width
                if (imgRatio > slotRatio) {
                    // Image is wider - fill width, crop top/bottom
                    drawW = slot.w;
                    drawH = drawW / imgRatio;
                    drawX = slot.x;
                    drawY = slot.y + (slot.h - drawH) / 2;
                } else {
                    // Image is taller - fill height, crop left/right
                    drawH = slot.h;
                    drawW = drawH * imgRatio;
                    drawX = slot.x + (slot.w - drawW) / 2;
                    drawY = slot.y;
                }
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
        });
        ctx.restore();
    }

    drawStickers(stickersData) {
        const ctx = this.ctx;
        const ratio = this.canvas.width / this.canvas.getBoundingClientRect().width;
        stickersData.forEach(s => {
            ctx.save();
            const x = s.xPercent * this.canvas.width;
            const y = s.yPercent * this.canvas.height;
            const size = DOM_STICKER_SIZE * ratio * s.scale;
            ctx.translate(x, y);
            ctx.rotate(s.rotation * Math.PI / 180);
            ctx.font = `${size}px Arial`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(s.emoji, 0, 0);
            ctx.restore();
        });
    }

    drawTexts(textsData) {
        const ctx = this.ctx;
        const ratio = this.canvas.width / this.canvas.getBoundingClientRect().width;
        textsData.forEach(t => {
            ctx.save();
            const x = t.xPercent * this.canvas.width;
            const y = t.yPercent * this.canvas.height;
            const size = DOM_TEXT_SIZE * ratio * t.scale;
            ctx.translate(x, y);
            ctx.rotate(t.rotation * Math.PI / 180);
            ctx.font = `${size}px ${t.fontFamily}`;
            ctx.fillStyle = t.color;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, 0, 0);
            ctx.restore();
        });
    }

    toDataURL() { return this.canvas.toDataURL('image/png'); }
}

class InteractiveElementManager {
    constructor(container, type, canvasElement) {
        this.container = container;
        this.type = type;
        this.canvasElement = canvasElement;
        this.items = [];
        this.highestZ = 10;
    }

    add(content, options = {}) {
        const el = document.createElement('div');
        el.className = `placed-${this.type}`;
        
        if (this.type === 'sticker') {
            el.innerHTML = `<span class="sticker-content">${content}</span>`;
        } else {
            el.textContent = content.text;
            el.style.color = content.color;
            el.style.fontFamily = content.fontFamily;
        }

        const data = { 
            element: el, 
            xPercent: 0.5, yPercent: 0.5, 
            rotation: 0, scale: 1,
            ...options
        };
        if (this.type === 'sticker') data.emoji = content;
        else { data.text = content.text; data.color = content.color; data.fontFamily = content.fontFamily; }

        this.items.push(data);
        
        const delBtn = this.createHandle('delete-handle', '×');
        const rotBtn = this.createHandle('rotate-handle', '↻');
        const resBtn = this.createHandle('resize-handle', '');

        delBtn.onclick = (e) => { e.stopPropagation(); this.deleteItem(el); };
        
        el.appendChild(delBtn);
        el.appendChild(rotBtn);
        el.appendChild(resBtn);
        this.container.appendChild(el);

        this.updateDOMPosition(el, data);
        this.attachEvents(el, data, rotBtn, resBtn);
    }

    createHandle(className, text) {
        const btn = document.createElement('div');
        btn.className = `handle ${className}`;
        btn.textContent = text;
        return btn;
    }

    deleteItem(el) {
        this.items = this.items.filter(i => i.element !== el);
        el.remove();
    }

    clear() {
        this.items.forEach(i => i.element.remove());
        this.items = [];
    }

    getData() { return this.items; }

    bringToFront(el) {
        this.highestZ++;
        el.style.zIndex = this.highestZ;
    }

    updateDOMPosition(el, data) {
        const canvasRect = this.canvasElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const xInCanvas = data.xPercent * canvasRect.width;
        const yInCanvas = data.yPercent * canvasRect.height;
        
        const xInContainer = xInCanvas + (canvasRect.left - containerRect.left);
        const yInContainer = yInCanvas + (canvasRect.top - containerRect.top);
        
        el.style.left = `${xInContainer}px`;
        el.style.top = `${yInContainer}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.scale})`;
    }

    attachEvents(el, data, rotBtn, resBtn) {
        el.onpointerdown = (e) => {
            if (e.target.classList.contains('handle')) return;
            this.bringToFront(el);
            this.startDrag(e, el, data);
        };

        rotBtn.onpointerdown = (e) => {
            e.preventDefault(); e.stopPropagation();
            this.bringToFront(el);
            this.startRotate(e, el, data);
        };

        resBtn.onpointerdown = (e) => {
            e.preventDefault(); e.stopPropagation();
            this.bringToFront(el);
            this.startResize(e, el, data);
        };
    }

    startDrag(e, el, data) {
        e.preventDefault();
        const canvasRect = this.canvasElement.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        
        const startCenterX = data.xPercent * canvasRect.width;
        const startCenterY = data.yPercent * canvasRect.height;

        const onMove = (ev) => {
            ev.preventDefault();
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            
            const newCenterX = startCenterX + dx;
            const newCenterY = startCenterY + dy;
            
            data.xPercent = newCenterX / canvasRect.width;
            data.yPercent = newCenterY / canvasRect.height;
            
            this.updateDOMPosition(el, data);
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    startRotate(e, el, data) {
        e.preventDefault();
        const canvasRect = this.canvasElement.getBoundingClientRect();
        const cx = canvasRect.left + (data.xPercent * canvasRect.width);
        const cy = canvasRect.top + (data.yPercent * canvasRect.height);
        
        const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const startRotation = data.rotation;

        const onMove = (ev) => {
            ev.preventDefault();
            const currentAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
            const deltaAngle = currentAngle - startAngle;
            data.rotation = startRotation + (deltaAngle * 180 / Math.PI);
            this.updateDOMPosition(el, data);
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    startResize(e, el, data) {
        e.preventDefault();
        const canvasRect = this.canvasElement.getBoundingClientRect();
        const cx = canvasRect.left + (data.xPercent * canvasRect.width);
        const cy = canvasRect.top + (data.yPercent * canvasRect.height);
        
        const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
        const startScale = data.scale;

        const onMove = (ev) => {
            ev.preventDefault();
            const currentDist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
            let newScale = startScale * (currentDist / startDist);
            newScale = Math.max(0.3, Math.min(4, newScale));
            data.scale = newScale;
            this.updateDOMPosition(el, data);
        };

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }
}

class PhotoBoothApp {
    constructor() {
        this.layoutKey = 'single5x7'; this.images = []; this.shots = 0; this.isProcessing = false;
        this.screens = { welcome: document.getElementById('screen-welcome'), frames: document.getElementById('screen-frames'), camera: document.getElementById('screen-camera'), edit: document.getElementById('screen-edit') };
        this.camera = new CameraManager(document.getElementById('video'));
        this.canvasElement = document.getElementById('canvas');
        this.renderer = new CanvasRenderer(this.canvasElement);
        
        this.stickerMgr = new InteractiveElementManager(document.getElementById('sticker-container'), 'sticker', this.canvasElement);
        this.textMgr = new InteractiveElementManager(document.getElementById('sticker-container'), 'text', this.canvasElement);
        
        this.currentTextColor = '#000000'; this.currentTextFont = 'Georgia, serif';
        this.init();
    }

    init() {
        document.getElementById('btn-welcome-next').addEventListener('click', () => this.showScreen('frames'));
        document.getElementById('btn-frame-back').addEventListener('click', () => this.showScreen('welcome'));
        document.querySelectorAll('.frame-card').forEach(card => { card.addEventListener('click', async () => { this.layoutKey = card.dataset.layout; this.images = []; this.shots = 0; const success = await this.camera.start(); if (success) { this.showScreen('camera'); this.updateStatus(); } }); });
        document.getElementById('btn-camera-back').addEventListener('click', () => { this.camera.stop(); this.showScreen('frames'); });
        document.getElementById('btn-take-photo').addEventListener('click', () => this.handleTakePhoto());
        document.getElementById('btn-edit-back').addEventListener('click', () => { this.camera.stop(); this.showScreen('frames'); });
        document.getElementById('btn-retake').addEventListener('click', () => this.handleRetake());
        document.getElementById('btn-download').addEventListener('click', () => this.handleDownload());

        document.querySelectorAll('.color-btn[data-color]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.color-btn[data-color]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.renderer.color = btn.dataset.color; this.renderer.drawBase(this.images); }); });
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.renderer.filter = btn.dataset.filter; this.renderer.drawBase(this.images); }); });
        document.querySelectorAll('.sticker-btn').forEach(btn => { btn.addEventListener('click', () => this.stickerMgr.add(btn.dataset.sticker)); });

        document.querySelectorAll('.color-btn[data-text-color]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.color-btn[data-text-color]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.currentTextColor = btn.dataset.textColor; }); });
        document.querySelectorAll('.filter-btn[data-text-font]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn[data-text-font]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.currentTextFont = btn.dataset.textFont; }); });
        document.getElementById('btn-add-text').addEventListener('click', () => {
            const input = document.getElementById('text-input');
            if (input.value.trim()) {
                this.textMgr.add({ text: input.value, color: this.currentTextColor, fontFamily: this.currentTextFont });
                input.value = '';
            }
        });
    }

    showScreen(name) { Object.values(this.screens).forEach(s => s.classList.remove('active')); this.screens[name].classList.add('active'); }
    updateStatus() {
        const total = LAYOUT_CONFIG[this.layoutKey].shots; const status = document.getElementById('camera-status'); const btn = document.getElementById('btn-take-photo');
        if (this.shots >= total) { status.textContent = 'Done! Going to Edit...'; btn.disabled = true; setTimeout(() => { this.camera.stop(); this.renderer.setupDimensions(this.layoutKey); this.renderer.drawBase(this.images); this.showScreen('edit'); btn.disabled = false; }, 1000); }
        else { status.textContent = `Shot ${this.shots + 1} / ${total}`; btn.disabled = false; }
    }
    async handleTakePhoto() {
        if (this.isProcessing) return; this.isProcessing = true; document.getElementById('btn-take-photo').disabled = true;
        const countdown = document.getElementById('countdown'); const flash = document.getElementById('flash');
        for (let i = 3; i > 0; i--) { countdown.textContent = i; countdown.classList.remove('hidden'); await new Promise(r => setTimeout(r, 800)); }
        countdown.classList.add('hidden'); flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 200);
        this.images.push(this.camera.capture()); this.shots++; this.isProcessing = false; this.updateStatus();
    }
    handleRetake() { this.stickerMgr.clear(); this.textMgr.clear(); this.images = []; this.shots = 0; this.camera.start().then(() => { this.showScreen('camera'); this.updateStatus(); }); }
    
    handleDownload() {
        try {
            this.renderer.drawBase(this.images);
            this.renderer.drawStickers(this.stickerMgr.getData());
            this.renderer.drawTexts(this.textMgr.getData());
            
            const dataURL = this.renderer.toDataURL();
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const fileName = `insta-pic_${this.layoutKey}_${dateStr}.png`;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.renderer.drawBase(this.images); 
            this.animatePhotoDrop(dataURL);
            
            setTimeout(() => { 
                this.stickerMgr.clear(); 
                this.textMgr.clear(); 
                this.images = []; 
                this.shots = 0; 
                this.showScreen('welcome'); 
            }, 3000);
            
        } catch (err) { 
            alert('Download failed: ' + err.message); 
            console.error(err); 
        }
    }

    animatePhotoDrop(dataURL) {
        const dropZone = document.getElementById('photo-drop-zone'); const img = document.createElement('img'); img.src = dataURL; img.className = 'dropping-photo';
        const slot = document.querySelector('.photo-slot'); const slotRect = slot.getBoundingClientRect(); const machineRect = document.querySelector('.photobooth-machine').getBoundingClientRect();
        img.style.left = `${slotRect.left - machineRect.left + (slotRect.width/2) - 50}px`; img.style.top = `${slotRect.top - machineRect.top}px`;
        dropZone.appendChild(img); setTimeout(() => img.remove(), 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => new PhotoBoothApp());