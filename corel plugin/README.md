# 🚀 FiveNest CorelDRAW 1-Click Studio Exporter (Option B)

Export your CorelDRAW jersey designs directly into **FiveNest Web Studio** in 1 click!

---

## 🎯 What it Does
1. **Auto-Detects All Panels**:
   - **Front Panel** (22" × 30") &rarr; `front.jpg`
   - **Back Panel** (22" × 30") &rarr; `back.jpg`
   - **Left Sleeve** (19" × 11" Half / 19" × 25" Full) &rarr; `sleeve_left.jpg`
   - **Right Sleeve** (19" × 11" Half / 19" × 25" Full) &rarr; `sleeve_right.jpg`
   - **Collar Band** (18" × 4.5") &rarr; `collar.jpg`

2. **Strict Production Export Specifications**:
   - **Format**: High Quality **JPG** (`cdrJPEG` / `774`)
   - **Color Profile**: **RGB** (`cdrRGBColorImage` / `4`, sRGB Profile Embedded)
   - **Resolution**: **300 DPI** (`300, 300`)
   - **Antialiasing**: Smooth normal antialiasing (`cdrNormalAntiAliasing`)

3. **1-Click Packaging & Studio Launch**:
   - Automatically packages all exported JPG files into `<YourDocumentName>_FiveNest.zip` directly on your **Desktop**.
   - Automatically opens **FiveNest Production Studio** (`https://www.fivenest.in/production`) in your browser.
   - Highlights the `.zip` file in Windows Explorer so you can immediately **Drag & Drop** it onto the studio canvas!

---

## 🛠️ Installation & Usage (2 Methods)

### Method 1: Using the FiveNest Docker Addon (Recommended)
1. Run `Install_FiveNest_Macro.bat` (or manually copy the `4 Enterprise` folder to `%APPDATA%\Corel\CorelDRAW Graphics Suite <version>\Draw\Addons\`).
2. Open CorelDRAW.
3. Open menu: **Window > Dockers > FN Enterprise**.
4. Inside the docker:
   - Select Sleeve style: **Half Sleeve (19"×11")** or **Full Sleeve (19"×25")**.
   - (Optional) If your layers have custom names, select any shape and click **Tag Front**, **Tag Back**, etc.
   - Click the big orange button: **`🚀 EXPORT & SEND TO FIVENEST`**.
5. Your browser opens with FiveNest Studio. Simply drag & drop the Desktop `.zip` file into the studio!

---

### Method 2: Using the CorelDRAW VBA Macro (`FiveNest_1Click_Exporter.bas`)
1. In CorelDRAW, press `Alt + F11` to open the Visual Basic for Applications (VBA) editor.
2. In the Project Explorer on the left, right-click `GlobalMacros (VGCore)` or `GlobalMacros.gms`.
3. Choose **Import File...** and select `FiveNest_1Click_Exporter.bas`.
4. Close VBA.
5. In CorelDRAW:
   - Go to **Tools > Options > Customization > Commands**.
   - Choose **Macros** from the drop-down.
   - Find `FiveNest_1Click_Exporter.ExportToFiveNestStudio`.
   - Drag it to any toolbar in CorelDRAW to create a permanent 1-click **"Send to FiveNest"** button!
