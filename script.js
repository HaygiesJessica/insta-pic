const LAYOUT_CONFIG = {
    strip2x6: { width: 600, height: 1800, shots: 4 },
    landscape4x6: { width: 1200, height: 1800, shots: 2 },
    single5x7: { width: 1500, height: 2100, shots: 1 }
};

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
        const config = this.layout; const padding = config.width * 0.03; const gap = config.width * 0.02; const slots = [];
        if (config.shots === 4) { const w = config.width - (padding * 2); const h = (config.height * 0.90 - (padding * 2) - (gap * 3)) / 4; for (let i = 0; i < 4; i++) slots.push({ x: padding, y: padding + (i * (h + gap)), w, h }); }
        else if (config.shots === 2) { const w = config.width - (padding * 2); const h = (config.height * 0.90 - (padding * 2) - gap) / 2; for (let i = 0; i < 2; i++) slots.push({ x: padding, y: padding + (i * (h + gap)), w, h }); }
        else { slots.push({ x: padding, y: padding, w: config.width - (padding * 2), h: config.height * 0.90 - (padding * 2) }); }
        return slots;
    }
    drawBase(images) {
        const ctx = this.ctx; const config = this.layout;
        ctx.fillStyle = this.color; ctx.fillRect(0, 0, config.width, config.height);
        const slots = this.getPhotoSlots(); ctx.save(); ctx.filter = this.filter === 'none' ? 'none' : this.filter;
        images.forEach((img, index) => {
            if (slots[index]) {
                const slot = slots[index]; const imgRatio = img.width / img.height; const slotRatio = slot.w / slot.h;
                let drawW, drawH, drawX, drawY;
                if (imgRatio > slotRatio) { drawH = slot.h; drawW = drawH * imgRatio; drawX = slot.x - (drawW - slot.w) / 2; drawY = slot.y; }
                else { drawW = slot.w; drawH = drawW / imgRatio; drawX = slot.x; drawY = slot.y - (drawH - slot.h) / 2; }
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
        });
        ctx.restore();
    }
    drawStickers(stickersData) {
        const ctx = this.ctx; const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.08;
        stickersData.forEach(s => {
            ctx.save(); const x = s.xPercent * this.canvas.width; const y = s.yPercent * this.canvas.height; const size = baseSize * s.scale;
            ctx.translate(x, y); ctx.rotate(s.rotation * Math.PI / 180); ctx.font = `${size}px Arial`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(s.emoji, 0, 0); ctx.restore();
        });
    }
    // NEW: Draw Texts on Canvas
    drawTexts(textsData) {
        const ctx = this.ctx; const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.05;
        textsData.forEach(t => {
            ctx.save();
            const x = t.xPercent * this.canvas.width; const y = t.yPercent * this.canvas.height; const size = baseSize * t.scale;
            ctx.translate(x, y); ctx.rotate(t.rotation * Math.PI / 180);
            ctx.font = `${size}px ${t.fontFamily}`; ctx.fillStyle = t.color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
            ctx.fillText(t.text, 0, 0); ctx.restore();
        });
    }
    toDataURL() { return this.canvas.toDataURL('image/png'); }
}

class StickerManager {
    constructor(container) { this.container = container; this.stickers = []; }
    add(emoji) {
        const el = document.createElement('div'); el.className = 'placed-sticker';
        el.innerHTML = `<span class="sticker-content">${emoji}</span><div class="handle delete-handle">×</div><div class="handle rotate-handle">↻</div><div class="handle resize-handle">⤡</div>`;
        const data = { element: el, emoji, xPercent: 0.5, yPercent: 0.4, rotation: 0, scale: 1 }; this.stickers.push(data);
        el.style.left = '50%'; el.style.top = '40%'; el.style.transform = 'translate(-50%, -50%)';
        el.querySelector('.delete-handle').onclick = (e) => { e.stopPropagation(); this.delete(el); };
        this.makeDraggable(el, data); this.makeRotatable(el, data); this.makeResizable(el, data); this.container.appendChild(el);
    }
    delete(el) { this.stickers = this.stickers.filter(s => s.element !== el); el.remove(); }
    clear() { this.stickers.forEach(s => s.element.remove()); this.stickers = []; }
    getData() { return this.stickers; }
    makeDraggable(el, data) {
        let ix = 0, iy = 0; el.onpointerdown = (e) => { if (e.target.classList.contains('handle')) return; e.preventDefault(); ix = e.clientX; iy = e.clientY;
            document.onpointermove = (ev) => { ev.preventDefault(); const rect = this.container.getBoundingClientRect(); el.style.left = `${parseFloat(el.style.left) + ((ev.clientX - ix) / rect.width) * 100}%`; el.style.top = `${parseFloat(el.style.top) + ((ev.clientY - iy) / rect.height) * 100}%`; ix = ev.clientX; iy = ev.clientY; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; data.xPercent = parseFloat(el.style.left) / 100; data.yPercent = parseFloat(el.style.top) / 100; }; };
    }
    makeRotatable(el, data) {
        const handle = el.querySelector('.rotate-handle'); handle.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const rect = el.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; const startRot = data.rotation;
            document.onpointermove = (ev) => { ev.preventDefault(); data.rotation = startRot + (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI - startAngle); el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.scale})`; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; }; };
    }
    makeResizable(el, data) {
        const handle = el.querySelector('.resize-handle'); handle.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const rect = el.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const startDist = Math.hypot(e.clientX - cx, e.clientY - cy); const startScale = data.scale;
            document.onpointermove = (ev) => { ev.preventDefault(); data.scale = Math.max(0.2, Math.min(3, startScale * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / startDist))); el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.scale})`; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; }; };
    }
}

// NEW: TextManager Class
class TextManager {
    constructor(container) { this.container = container; this.texts = []; }
    add(text, color, fontFamily) {
        if (!text.trim()) return;
        const el = document.createElement('div'); el.className = 'placed-text'; el.textContent = text;
        el.style.color = color; el.style.fontFamily = fontFamily;
        const data = { element: el, text, color, fontFamily, xPercent: 0.5, yPercent: 0.5, rotation: 0, scale: 1 }; this.texts.push(data);
        el.style.left = '50%'; el.style.top = '50%'; el.style.transform = 'translate(-50%, -50%)';
        const delBtn = document.createElement('div'); delBtn.className = 'handle delete-handle'; delBtn.textContent = '×';
        const rotBtn = document.createElement('div'); rotBtn.className = 'handle rotate-handle'; rotBtn.textContent = '↻';
        const resBtn = document.createElement('div'); resBtn.className = 'handle resize-handle'; resBtn.textContent = '';
        delBtn.onclick = (e) => { e.stopPropagation(); this.delete(el); };
        el.appendChild(delBtn); el.appendChild(rotBtn); el.appendChild(resBtn);
        this.container.appendChild(el);
        this.makeDraggable(el, data); this.makeRotatable(el, data); this.makeResizable(el, data);
    }
    delete(el) { this.texts = this.texts.filter(s => s.element !== el); el.remove(); }
    clear() { this.texts.forEach(s => s.element.remove()); this.texts = []; }
    getData() { return this.texts; }
    makeDraggable(el, data) {
        let ix = 0, iy = 0; el.onpointerdown = (e) => { if (e.target.classList.contains('handle')) return; e.preventDefault(); ix = e.clientX; iy = e.clientY;
            document.onpointermove = (ev) => { ev.preventDefault(); const rect = this.container.getBoundingClientRect(); el.style.left = `${parseFloat(el.style.left) + ((ev.clientX - ix) / rect.width) * 100}%`; el.style.top = `${parseFloat(el.style.top) + ((ev.clientY - iy) / rect.height) * 100}%`; ix = ev.clientX; iy = ev.clientY; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; data.xPercent = parseFloat(el.style.left) / 100; data.yPercent = parseFloat(el.style.top) / 100; }; };
    }
    makeRotatable(el, data) {
        const handle = el.querySelector('.rotate-handle'); handle.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const rect = el.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; const startRot = data.rotation;
            document.onpointermove = (ev) => { ev.preventDefault(); data.rotation = startRot + (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI - startAngle); el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.scale})`; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; }; };
    }
    makeResizable(el, data) {
        const handle = el.querySelector('.resize-handle'); handle.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const rect = el.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const startDist = Math.hypot(e.clientX - cx, e.clientY - cy); const startScale = data.scale;
            document.onpointermove = (ev) => { ev.preventDefault(); data.scale = Math.max(0.2, Math.min(3, startScale * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / startDist))); el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg) scale(${data.scale})`; };
            document.onpointerup = () => { document.onpointermove = null; document.onpointerup = null; }; };
    }
}

class PhotoBoothApp {
    constructor() {
        this.layoutKey = 'single5x7'; this.images = []; this.shots = 0; this.isProcessing = false;
        this.screens = { welcome: document.getElementById('screen-welcome'), frames: document.getElementById('screen-frames'), camera: document.getElementById('screen-camera'), edit: document.getElementById('screen-edit') };
        this.camera = new CameraManager(document.getElementById('video'));
        this.renderer = new CanvasRenderer(document.getElementById('canvas'));
        this.stickerMgr = new StickerManager(document.getElementById('sticker-container'));
        this.textMgr = new TextManager(document.getElementById('sticker-container')); // Share container
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

        // Text Controls
        document.querySelectorAll('.color-btn[data-text-color]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.color-btn[data-text-color]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.currentTextColor = btn.dataset.textColor; }); });
        document.querySelectorAll('.filter-btn[data-text-font]').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn[data-text-font]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); this.currentTextFont = btn.dataset.textFont; }); });
        document.getElementById('btn-add-text').addEventListener('click', () => {
            const input = document.getElementById('text-input');
            this.textMgr.add(input.value, this.currentTextColor, this.currentTextFont);
            input.value = '';
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
            this.renderer.drawTexts(this.textMgr.getData()); // Draw texts
            const dataURL = this.renderer.toDataURL();
            const link = document.createElement('a'); link.download = `mintsnap_${this.layoutKey}_${Date.now()}.png`; link.href = dataURL; document.body.appendChild(link); link.click(); document.body.removeChild(link);
            this.renderer.drawBase(this.images); this.animatePhotoDrop(dataURL);
            setTimeout(() => { this.stickerMgr.clear(); this.textMgr.clear(); this.images = []; this.shots = 0; this.showScreen('welcome'); }, 3000);
        } catch (err) { alert('Download failed: ' + err.message); console.error(err); }
    }
    animatePhotoDrop(dataURL) {
        const dropZone = document.getElementById('photo-drop-zone'); const img = document.createElement('img'); img.src = dataURL; img.className = 'dropping-photo';
        const slot = document.querySelector('.photo-slot'); const slotRect = slot.getBoundingClientRect(); const machineRect = document.querySelector('.photobooth-machine').getBoundingClientRect();
        img.style.left = `${slotRect.left - machineRect.left + (slotRect.width/2) - 50}px`; img.style.top = `${slotRect.top - machineRect.top}px`;
        dropZone.appendChild(img); setTimeout(() => img.remove(), 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => new PhotoBoothApp());