# 📸 Mint Snap Photobooth

**Mint Snap** is a fun, interactive, and aesthetic web-based virtual photobooth application. Designed to mimic a real physical photobooth machine, it allows users to capture photos, customize them with cute frames, filters, stickers, and text, and download their creations in standard high-resolution print sizes.

## ✨ Features

### 🎥 Camera & Capture
- **Real-time Webcam Integration:** Smooth video feed with a mirrored preview.
- **Classic Photobooth Experience:** 3-2-1 countdown timer and realistic flash effects.
- **Auto-Capture Sequence:** Automatically takes multiple shots based on the selected layout.

### 🖼️ Standard Print Layouts (300 DPI)
Choose from three classic, high-resolution photobooth formats:
- **2x6 in (Photo Strip):** 4 vertical shots.
- **4x6 in (Wide):** 2 vertical shots.
- **5x7 in (Single):** 1 large portrait shot.

### 🎨 Customization & Editing
- **Pastel Frame Colors:** Choose from White, Mint, Peach, Pink, **Pastel Blue**, **Pastel Purple**, and Black.
- **Photo Filters:** Normal, Black & White, Sepia, and Vivid.
- **Interactive Stickers:** Add cute emojis. Fully **draggable, resizable, and rotatable**.
- **Custom Text:** Type your own captions. Choose between Black/White text and 3 font styles (Serif, Sans-Serif, Cursive). Text is also **draggable, resizable, and rotatable**.

### 🖱️ Realistic UI/UX
- **Physical Machine Design:** A cute, mint-green kiosk interface with a camera lens, flash, and a photo slot.
- **Photo Drop Animation:** A fun animation where the final printed photo "drops" out of the machine slot upon downloading.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic structure and Canvas API for image rendering.
- **CSS3:** Custom animations, flexbox/grid layouts, and realistic 3D UI styling.
- **JavaScript (ES6+):** Object-Oriented Programming (OOP) architecture using Classes (`CameraManager`, `CanvasRenderer`, `StickerManager`, `TextManager`, `PhotoBoothApp`).

---

## 🚀 How to Run

This project runs entirely on the client side. No backend or database is required.

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari).
- A webcam (built-in or external).
- [Visual Studio Code](https://code.visualstudio.com/) (Recommended).

### Installation & Setup
1. Clone or download this repository to your local machine.
2. Open the project folder in **VS Code**.
3. Ensure you have the following three files in the root directory:
   - `index.html`
   - `style.css`
   - `script.js`
4. Install the **Live Server** extension in VS Code.
5. Right-click on `index.html` and select **"Open with Live Server"**.
6. Allow camera permissions when prompted by your browser.

---

## 📖 How to Use

1. **Start:** Click the "Next" button on the Welcome screen.
2. **Choose Frame:** Select your desired layout (2x6, 4x6, or 5x7).
3. **Capture:** Click "Take Photo". Pose for the 3-second countdown. Repeat until all shots for your layout are taken.
4. **Edit:** 
   - Change the **Frame Color** or apply a **Filter**.
   - Click on **Stickers** or type in the **Text** box and click "Add Text" to add elements.
   - **Drag** elements to move them.
   - Use the **Yellow handle (↻)** to rotate.
   - Use the **Green handle (⤡)** to resize.
   - Use the **Red handle (×)** to delete.
5. **Download:** Click the "Download" button. The image will save to your device, and a cute animation will play on the screen!

---

## 📁 Project Structure

```text
mint-snap-photobooth/
│
├── index.html      # Main HTML structure and UI layout
├── style.css       # Styling, animations, and physical machine design
├── script.js       # Core logic, OOP classes, and canvas rendering
── README.md       # Project documentation