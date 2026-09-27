# 🚀 FiveNest CorelDRAW 1-Click Studio Exporter Macro

Export your CorelDRAW jersey designs directly into **FiveNest Production Studio** in 1 click!

---

## 🎯 Features
1. **Vertical Dock-Friendly UI**:
   - Sleek 300px vertical panel designed to stay docked beside your CorelDRAW workspace.
   - Live visual thumbnail preview for every assigned panel.
2. **Auto-Detected Job Name**:
   - Automatically names each job: `<CDR_Filename>_<YYYY-MM-DD_HH-mm>` (e.g., `Mumbai_Indians_2026-09-27_19-00`).
   - You can also edit the Job Name directly in the text box.
3. **Flexible Export Folder & Default Memory**:
   - Choose any folder with the **Browse...** button.
   - Remembers your default folder across CorelDRAW restarts (default: `C:\Fivenest_Export`).
   - Checkbox option to prompt for folder on each export.
4. **7 Visual Panel Assignment Buttons**:
   - **1. Front Panel** (22" × 30") &rarr; `front.jpg`
   - **2. Back Panel** (22" × 30") &rarr; `back.jpg`
   - **3. Left Half Sleeve** (19" × 11") &rarr; `half_left_sleeve.jpg`
   - **4. Right Half Sleeve** (19" × 11") &rarr; `half_right_sleeve.jpg`
   - **5. Left Full Sleeve** (19" × 25") &rarr; `full_left_sleeve.jpg`
   - **6. Right Full Sleeve** (19" × 25") &rarr; `full_right_sleeve.jpg`
   - **7. Collar Band** (18" × 4.5") &rarr; `collar.jpg`
5. **Strict Production Export Specifications**:
   - **Format**: High Quality **JPG** (`cdrJPEG` / `774`)
   - **Crop**: Individual shape bounding box cropped (`Range = 2` / `cdrSelection`)
   - **Color Profile**: **RGB** (`cdrRGBColorImage` / `4`, sRGB Profile Embedded)
   - **Resolution**: **300 DPI**
6. **Clean ZIP Package Output & Studio Launch**:
   - Uses Windows system `%TEMP%` for intermediate files, then deletes them immediately.
   - Saves **ONLY** `<ExportFolder>\<JobName>.zip` (no loose folder of JPGs cluttering your folder!).
   - Copies the ZIP package to the Windows clipboard (`Set-Clipboard`).
   - Automatically opens **FiveNest Production Studio** (`https://www.fivenest.in/production?corel_export=ready`).
   - Highlights the `.zip` file in Windows Explorer so you can drag-and-drop or press **Ctrl+V** to paste.

---

## 🛠️ Step-by-Step Setup in CorelDRAW VBA

### Step 1: Open the VBA Editor
1. In CorelDRAW, press `Alt + F11` (or menu: **Tools > Scripts / Macros > Script Editor**).
2. In the Project Explorer on the left, expand **`GlobalMacros`** (or your document).

### Step 2: Add Class Module `clsBtn`
1. Right-click `GlobalMacros` &rarr; **Insert &rarr; Class Module**.
2. In the Properties window (press `F4` if hidden), rename it from `Class1` to **`clsBtn`**.
3. Paste the contents of [`clsBtn_Code.txt`](clsBtn_Code.txt):
   ```vba
   Option Explicit

   Public WithEvents btn As MSForms.CommandButton
   Public panelKey As String

   Private Sub btn_Click()
       UserForm1.HandleButtonClick panelKey
   End Sub
   ```

### Step 3: Add UserForm `UserForm1`
1. Right-click `GlobalMacros` &rarr; **Insert &rarr; UserForm**.
2. Ensure its name in Properties is **`UserForm1`**.
3. Right-click the form &rarr; **View Code** (or press `F7`).
4. Select all and paste the entire contents of [`UserForm1_Code.txt`](UserForm1_Code.txt).

### Step 4: Add Standard Module
1. Right-click `GlobalMacros` &rarr; **Insert &rarr; Module**.
2. Paste the contents of [`FiveNest_1Click_Exporter.bas`](FiveNest_1Click_Exporter.bas):
   ```vba
   Option Explicit

   Public Sub ExportToFiveNest()
       On Error Resume Next
       UserForm1.Show vbModeless
       If Err.Number <> 0 Then
           UserForm1.Show
       End If
   End Sub
   ```
3. Save changes in VBA (`Ctrl + S`).

---

## 🚀 How to Use

1. Open your jersey artwork file in CorelDRAW.
2. Run macro **`ExportToFiveNest`** (press `Alt + F8` &rarr; select `ExportToFiveNest` &rarr; click **Run**).
   *(Tip: Add it to your toolbar via **Tools > Options > Customization > Commands > Macros** for 1-click access!)*
3. Select your artwork for each panel on the Corel canvas:
   - Select Front graphic &rarr; click **1. Assign Front** (thumbnail appears and button turns green).
   - Select Back graphic &rarr; click **2. Assign Back**.
   - Select Left & Right Sleeves &rarr; click Half or Full sleeve buttons.
   - Select Collar &rarr; click **7. Assign Collar**.
4. Confirm or adjust the **Job Name** and **Export Folder**.
5. Click **EXPORT & OPEN PRODUCTION STUDIO**.
6. When the browser opens at `https://www.fivenest.in/production`:
   - Simply press **`Ctrl + V`** to paste the package, or
   - Drag & drop the selected `.zip` file right into the browser!
