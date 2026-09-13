# Insta-Pic Web Photobooth

Insta-Pic is a web-based virtual photobooth application designed to look and feel like a real physical photobooth machine. Users can take photos using their webcam, choose from classic photo layouts, customize their pictures with colors, filters, stickers, and text, and then download the quality image.

## Features

- **Realistic Machine Interface:** The application features a cute, mint-green kiosk design complete with a working camera lens, flash, and a photo slot where finished images drop out.
- **Classic Frame Layouts:** Users can choose between three standard print sizes: 2x6 inch (4-photo strip), 4x6 inch (2-photo wide), or 5x7 inch (single large photo).
- **High-Resolution Output:** All downloads are rendered at 300 DPI, matching exact real-world print dimensions for professional quality.
- **Customization Tools:** Users can change frame colors, apply photo filters (Normal, Black & White, Sepia, Vivid), and add custom text.
- **Interactive Elements:** Stickers and text can be dragged, resized, rotated, and deleted directly on the canvas.
- **Exact Preview:** What you see on the screen is exactly what you get in the downloaded image. Positions, sizes, and rotations are perfectly synchronized.
- **Photo Drop Animation:** A fun animation plays where the finished photo drops out of the machine slot upon downloading.
- **Custom File Naming:** Downloads are automatically named with the layout size and the current date (e.g., insta-pic_2x6_2026-09-14.png).
- **Mobile and Tablet Friendly:** The design is fully responsive and works smoothly on smaller screens.

## Technologies Used

- **HTML5:** Used for the structure and the Canvas API, which handles the high-resolution image rendering.
- **CSS3:** Used for styling, animations, and creating the realistic 3D physical machine look.
- **JavaScript (ES6+):** Handles the core logic, webcam integration, and interactive features. The code is organized using Object-Oriented Programming (Classes) to keep it clean, modular, and easy to maintain.
- **Google Fonts:** Uses Courier New and Quicksand fonts for clean, modern typography.

## Deployment

The application is currently deployed and can be accessed online at the following link:
https://insta-pic-photobooth.vercel.app/

## How to Run Locally

1. Download the project files to your computer.
2. Open the project folder in Visual Studio Code.
3. Install the "Live Server" extension if you have not already done so.
4. Right-click on `index.html` and select "Open with Live Server".
5. Note: You must use a local server or a secure HTTPS link (such as Vercel or GitHub Pages) for the webcam to work, as modern browsers block camera access on standard file paths.
