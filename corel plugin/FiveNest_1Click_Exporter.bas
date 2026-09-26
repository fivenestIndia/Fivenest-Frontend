Attribute VB_Name = "FiveNest_1Click_Exporter"
' ==============================================================================
' FIVENEST 1-CLICK COREL TO STUDIO EXPORTER (Option B)
' ==============================================================================
' Features:
' 1. Automatically renders all panels:
'    - Front Panel (22" x 30")  -> front.jpg
'    - Back Panel (22" x 30")   -> back.jpg
'    - Left Sleeve (19" x 11" or 19" x 25")  -> sleeve_left.jpg
'    - Right Sleeve (19" x 11" or 19" x 25") -> sleeve_right.jpg
'    - Collar Band (18" x 4.5") -> collar.jpg
' 2. Export Specs:
'    - Format: JPG (cdrJPEG)
'    - Color Profile: RGB (cdrRGBColorImage, sRGB Profile Embedded)
'    - Resolution: 300 DPI (ResolutionX=300, ResolutionY=300)
'    - High Quality Antialiasing
' 3. Packages into a pre-formatted .ZIP archive on the Desktop
' 4. Automatically launches FiveNest Design Studio in default browser
' 5. Highlights the exported .ZIP in Windows Explorer for instant Drag & Drop
' ==============================================================================

Option Explicit

Public Sub ExportToFiveNestStudio()
    Dim doc As Document
    Set doc = ActiveDocument
    
    If doc Is Nothing Then
        MsgBox "Please open an artwork document in CorelDRAW first.", vbExclamation, "FiveNest Studio Exporter"
        Exit Sub
    End If
    
    On Error GoTo ErrorHandler
    
    ' Ask user for Half or Full Sleeve
    Dim sleeveChoice As VbMsgBoxResult
    sleeveChoice = MsgBox("Do you want FULL SLEEVE (19"" x 25"")?" & vbCrLf & vbCrLf & _
                          "Click 'Yes' for Full Sleeve (19"" x 25"")" & vbCrLf & _
                          "Click 'No' for Half Sleeve (19"" x 11"")", _
                          vbYesNoCancel + vbQuestion, "FiveNest Studio - Sleeve Selection")
                          
    If sleeveChoice = vbCancel Then Exit Sub
    
    Dim isFullSleeve As Boolean
    isFullSleeve = (sleeveChoice = vbYes)
    
    ' Shell & FileSystem objects
    Dim fso As Object, sh As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set sh = CreateObject("WScript.Shell")
    
    ' Create Temp Export Directory
    Dim tempPath As String
    tempPath = fso.GetSpecialFolder(2) & "\FiveNest_Export_" & Format(Now, "yyyymmdd_hhnnss")
    If Not fso.FolderExists(tempPath) Then fso.CreateFolder tempPath
    
    ' Store original active units & layer visibilities
    Dim origUnits As cdrUnit
    origUnits = doc.Unit
    doc.Unit = cdrInch
    
    Dim p As Page
    Set p = doc.ActivePage
    
    Dim origVis As Object
    Set origVis = CreateObject("Scripting.Dictionary")
    
    Dim lyr As Layer
    For Each lyr In p.Layers
        origVis(lyr.Name) = lyr.Visible
    Next lyr
    
    ' Panel configurations
    Dim exportedCount As Long
    exportedCount = 0
    Dim exportedReport As String
    exportedReport = ""
    
    ' 1. FRONT PANEL (22 x 30)
    If ExportPanel(doc, p, "Front", Array("Front", "front", "FRONT", "Front Layer"), Array("FN_FRONT", "FRONT"), tempPath & "\front.jpg", 22, 30) Then
        exportedCount = exportedCount + 1
        exportedReport = exportedReport & vbCrLf & "  [x] Front Panel (22"" x 30"") -> front.jpg"
    End If
    
    ' 2. BACK PANEL (22 x 30)
    If ExportPanel(doc, p, "Back", Array("Back", "back", "BACK", "Back Layer"), Array("FN_BACK", "BACK"), tempPath & "\back.jpg", 22, 30) Then
        exportedCount = exportedCount + 1
        exportedReport = exportedReport & vbCrLf & "  [x] Back Panel (22"" x 30"") -> back.jpg"
    End If
    
    ' 3. LEFT SLEEVE (19 x 11 or 19 x 25)
    Dim sleeveH As Double
    sleeveH = IIf(isFullSleeve, 25#, 11#)
    
    Dim leftCandidates As Variant
    If isFullSleeve Then
        leftCandidates = Array("Full Left SL", "Left Sleeve", "Full Left Sleeve", "Sleeve Left", "FSL L", "Half Left SL")
    Else
        leftCandidates = Array("Half Left SL", "Left Sleeve", "Half Left Sleeve", "Sleeve Left", "HSL L", "Full Left SL")
    End If
    
    If ExportPanel(doc, p, "Left Sleeve", leftCandidates, Array("FN_SLEEVE_LEFT", "SLEEVE_LEFT", "LEFT_SLEEVE"), tempPath & "\sleeve_left.jpg", 19, sleeveH) Then
        exportedCount = exportedCount + 1
        exportedReport = exportedReport & vbCrLf & "  [x] Left Sleeve (19"" x " & sleeveH & """) -> sleeve_left.jpg"
    End If
    
    ' 4. RIGHT SLEEVE (19 x 11 or 19 x 25)
    Dim rightCandidates As Variant
    If isFullSleeve Then
        rightCandidates = Array("Full Right SL", "Right Sleeve", "Full Right Sleeve", "Sleeve Right", "FSL R", "Half Right SL")
    Else
        rightCandidates = Array("Half Right SL", "Right Sleeve", "Half Right Sleeve", "Sleeve Right", "HSL R", "Full Right SL")
    End If
    
    If ExportPanel(doc, p, "Right Sleeve", rightCandidates, Array("FN_SLEEVE_RIGHT", "SLEEVE_RIGHT", "RIGHT_SLEEVE"), tempPath & "\sleeve_right.jpg", 19, sleeveH) Then
        exportedCount = exportedCount + 1
        exportedReport = exportedReport & vbCrLf & "  [x] Right Sleeve (19"" x " & sleeveH & """) -> sleeve_right.jpg"
    End If
    
    ' 5. COLLAR (18 x 4.5)
    If ExportPanel(doc, p, "Collar", Array("Collar", "collar", "COLLAR", "Rib", "Neck", "Collar Band"), Array("FN_COLLAR", "COLLAR", "RIB"), tempPath & "\collar.jpg", 18, 4.5) Then
        exportedCount = exportedCount + 1
        exportedReport = exportedReport & vbCrLf & "  [x] Collar Band (18"" x 4.5"") -> collar.jpg"
    End If
    
    ' Restore original layer visibilities
    For Each lyr In p.Layers
        If origVis.Exists(lyr.Name) Then
            lyr.Visible = origVis(lyr.Name)
        End If
    Next lyr
    doc.Unit = origUnits
    
    If exportedCount = 0 Then
        MsgBox "No jersey panels could be detected or exported!" & vbCrLf & vbCrLf & _
               "Please ensure your CorelDRAW document has layers named:" & vbCrLf & _
               "- 'Front'" & vbCrLf & _
               "- 'Back'" & vbCrLf & _
               "- 'Half Left SL' (or 'Full Left SL')" & vbCrLf & _
               "- 'Half Right SL' (or 'Full Right SL')", vbExclamation, "FiveNest Export"
        Exit Sub
    End If
    
    ' Create Manifest JSON
    Dim manifestPath As String
    manifestPath = tempPath & "\manifest.json"
    Dim ts As Object
    Set ts = fso.CreateTextFile(manifestPath, True)
    ts.WriteLine "{"
    ts.WriteLine "  ""source"": ""CorelDRAW VBA Macro"","
    ts.WriteLine "  ""format"": ""JPG"","
    ts.WriteLine "  ""colorProfile"": ""RGB"","
    ts.WriteLine "  ""dpi"": 300,"
    ts.WriteLine "  ""sleeveType"": """ & IIf(isFullSleeve, "full", "half") & ""","
    ts.WriteLine "  ""exportedCount"": " & exportedCount & ","
    ts.WriteLine "  ""timestamp"": """ & Now & """"
    ts.WriteLine "}"
    ts.Close
    
    ' Build Destination ZIP on Desktop
    Dim desktopPath As String
    desktopPath = sh.SpecialFolders("Desktop")
    Dim docTitle As String
    docTitle = doc.FileName
    If Len(docTitle) > 0 Then
        If InStrRev(docTitle, ".") > 0 Then docTitle = Left(docTitle, InStrRev(docTitle, ".") - 1)
    Else
        docTitle = "FiveNest_Jersey"
    End If
    
    Dim zipFile As String
    zipFile = desktopPath & "\" & docTitle & "_FiveNest.zip"
    
    ' Compress via Windows PowerShell native Compress-Archive
    Dim psCmd As String
    psCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ""Compress-Archive -Path '" & tempPath & "\*' -DestinationPath '" & zipFile & "' -Force"""
    sh.Run psCmd, 0, True
    
    ' Open FiveNest Web Studio in default browser
    sh.Run "https://canvas.fivenest.com"
    
    ' Highlight ZIP in Windows File Explorer
    sh.Run "explorer.exe /select,""" & zipFile & """"
    
    ' Cleanup temp directory
    On Error Resume Next
    fso.DeleteFolder tempPath, True
    On Error GoTo 0
    
    MsgBox "FiveNest 1-Click Export Complete!" & vbCrLf & vbCrLf & _
           exportedCount & " panels exported in 300 DPI RGB JPG:" & exportedReport & vbCrLf & vbCrLf & _
           "Pre-formatted ZIP created on Desktop:" & vbCrLf & _
           zipFile & vbCrLf & vbCrLf & _
           "FiveNest Studio is open in your browser!" & vbCrLf & _
           "Simply DRAG & DROP the ZIP file into the studio canvas to view your 3D jersey model & print roll.", _
           vbInformation, "FiveNest Studio 1-Click Exporter"
    Exit Sub

ErrorHandler:
    MsgBox "An error occurred during export: " & Err.Description, vbCritical, "FiveNest Exporter Error"
End Sub

' Helper function to export single panel to 300 DPI RGB JPG
Private Function ExportPanel(doc As Document, p As Page, panelName As String, layerCandidates As Variant, tagCandidates As Variant, outFilePath As String, panelW As Double, panelH As Double) As Boolean
    ExportPanel = False
    On Error GoTo CatchErr
    
    ' Check for tagged shape first
    Dim shFound As Shape
    Dim tIdx As Long
    For tIdx = LBound(tagCandidates) To UBound(tagCandidates)
        Set shFound = FindShapeByName(p, CStr(tagCandidates(tIdx)))
        If Not shFound Is Nothing Then Exit For
    Next tIdx
    
    If Not shFound Is Nothing Then
        doc.ClearSelection
        shFound.Selected = True
        
        ' Export Selection: Filter 774 (cdrJPEG), Selection (1), RGB (4), 300 DPI
        doc.ExportBitmap outFilePath, 774, 1, 4, 0, 0, 300, 300, 1, False, False, True, False, 0
        ExportPanel = True
        Exit Function
    End If
    
    ' Check for Layer
    Dim targetLayer As Layer
    Set targetLayer = Nothing
    
    Dim lIdx As Long, lyr As Layer
    For lIdx = LBound(layerCandidates) To UBound(layerCandidates)
        For Each lyr In p.Layers
            If LCase(lyr.Name) = LCase(CStr(layerCandidates(lIdx))) Or InStr(1, LCase(lyr.Name), LCase(CStr(layerCandidates(lIdx)))) > 0 Then
                Set targetLayer = lyr
                Exit For
            End If
        Next lyr
        If Not targetLayer Is Nothing Then Exit For
    Next lIdx
    
    If Not targetLayer Is Nothing Then
        ' Isolate layer
        For Each lyr In p.Layers
            lyr.Visible = False
        Next lyr
        targetLayer.Visible = True
        
        p.SetSize panelW, panelH
        
        ' Export Page: Filter 774 (cdrJPEG), Page (0), RGB (4), 300 DPI
        doc.ExportBitmap outFilePath, 774, 0, 4, 0, 0, 300, 300, 1, False, False, True, False, 0
        ExportPanel = True
        Exit Function
    End If
    
    ' Check multi-page document
    Dim pg As Page
    For lIdx = LBound(layerCandidates) To UBound(layerCandidates)
        For Each pg In doc.Pages
            If InStr(1, LCase(pg.Name), LCase(CStr(layerCandidates(lIdx)))) > 0 Then
                Dim oldPage As Page
                Set oldPage = doc.ActivePage
                pg.Activate
                doc.ExportBitmap outFilePath, 774, 0, 4, 0, 0, 300, 300, 1, False, False, True, False, 0
                oldPage.Activate
                ExportPanel = True
                Exit Function
            End If
        Next pg
    Next lIdx

CatchErr:
    ExportPanel = False
End Function

Private Function FindShapeByName(p As Page, targetName As String) As Shape
    Set FindShapeByName = Nothing
    On Error Resume Next
    Dim sh As Shape
    For Each sh In p.FindShapes(targetName)
        Set FindShapeByName = sh
        Exit Function
    Next sh
End Function
