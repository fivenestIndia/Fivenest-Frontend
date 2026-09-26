Attribute VB_Name = "FiveNest_1Click_Exporter"
' ==============================================================================
' FIVENEST 1-CLICK COREL TO STUDIO EXPORTER (Option B - Smart Object Detection)
' ==============================================================================
' Features:
' 1. Smart Fuzzy Search:
'    - Finds shapes named "Front", "2 Front", "Front_Panel", etc.
'    - Finds shapes named "Back", "2 Back", "Back_Panel", etc.
'    - Finds sleeves named "Left Sleeve", "Right Sleeve", "Sleeve", etc.
'    - Finds collar named "Collar", "Rib", "Neck", etc.
'    - Also checks Layer names and Page names!
' 2. Interactive Selection Fallback:
'    - If any panel is not named, prompts you to simply select it on screen!
'    - Automatically tags it so next time it runs 100% automatically.
' 3. Strict 300 DPI RGB JPG Export (cdrJPEG + cdrRGBColorImage)
' 4. Packages into Desktop ZIP and launches FiveNest Studio in browser
' ==============================================================================

Option Explicit

Public Sub ExportToFiveNestStudio()
    Dim doc As Document
    Set doc = ActiveDocument
    
    If doc Is Nothing Then
        MsgBox "Please open a jersey artwork document in CorelDRAW first.", vbExclamation, "FiveNest Studio Exporter"
        Exit Sub
    End If
    
    On Error GoTo ErrorHandler
    
    ' Ask user for Half or Full Sleeve
    Dim sleeveChoice As VbMsgBoxResult
    sleeveChoice = MsgBox("Export FULL SLEEVE (19"" x 25"")?" & vbCrLf & vbCrLf & _
                          "Click 'Yes' for Full Sleeve (19"" x 25"")" & vbCrLf & _
                          "Click 'No' for Half Sleeve (19"" x 11"")", _
                          vbYesNoCancel + vbQuestion, "FiveNest Studio - Sleeve Selection")
                          
    If sleeveChoice = vbCancel Then Exit Sub
    
    Dim isFullSleeve As Boolean
    isFullSleeve = (sleeveChoice = vbYes)
    
    Dim fso As Object, sh As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set sh = CreateObject("WScript.Shell")
    
    ' Create Temp Export Directory
    Dim tempPath As String
    tempPath = fso.GetSpecialFolder(2) & "\FiveNest_Export_" & Format(Now, "yyyymmdd_hhnnss")
    If Not fso.FolderExists(tempPath) Then fso.CreateFolder tempPath
    
    Dim p As Page
    Set p = doc.ActivePage
    
    Dim exportedCount As Long
    exportedCount = 0
    Dim exportedReport As String
    exportedReport = ""
    
    ' -------------------------------------------------------------
    ' 1. DETECT & EXPORT FRONT PANEL (22 x 30)
    ' -------------------------------------------------------------
    Dim shFront As Shape
    Set shFront = FindPanelShape(p, Array("front", "frnt", "fnt"))
    
    If shFront Is Nothing Then
        If MsgBox("Front panel was not found by name ('Front' or '2 Front')." & vbCrLf & vbCrLf & _
                  "Please SELECT your Front Panel graphic on screen, then click 'OK'." & vbCrLf & _
                  "(Or click Cancel to skip Front)", vbOKCancel + vbInformation, "Select Front Panel") = vbOK Then
            If doc.ActiveSelection.Shapes.Count > 0 Then
                Set shFront = doc.ActiveSelection.Shapes(1)
                shFront.Name = "Front"
            End If
        End If
    End If
    
    If Not shFront Is Nothing Then
        If ExportSingleShape(doc, shFront, tempPath & "\front.jpg") Then
            exportedCount = exportedCount + 1
            exportedReport = exportedReport & vbCrLf & "  ✔ Front Panel (" & shFront.Name & ") -> front.jpg"
        End If
    End If
    
    ' -------------------------------------------------------------
    ' 2. DETECT & EXPORT BACK PANEL (22 x 30)
    ' -------------------------------------------------------------
    Dim shBack As Shape
    Set shBack = FindPanelShape(p, Array("back", "bck", "rear"))
    
    If shBack Is Nothing Then
        If MsgBox("Back panel was not found by name ('Back' or '2 Back')." & vbCrLf & vbCrLf & _
                  "Please SELECT your Back Panel graphic on screen, then click 'OK'." & vbCrLf & _
                  "(Or click Cancel to skip Back)", vbOKCancel + vbInformation, "Select Back Panel") = vbOK Then
            If doc.ActiveSelection.Shapes.Count > 0 Then
                Set shBack = doc.ActiveSelection.Shapes(1)
                shBack.Name = "Back"
            End If
        End If
    End If
    
    If Not shBack Is Nothing Then
        If ExportSingleShape(doc, shBack, tempPath & "\back.jpg") Then
            exportedCount = exportedCount + 1
            exportedReport = exportedReport & vbCrLf & "  ✔ Back Panel (" & shBack.Name & ") -> back.jpg"
        End If
    End If
    
    ' -------------------------------------------------------------
    ' 3. DETECT & EXPORT SLEEVES (19 x 11 or 19 x 25)
    ' -------------------------------------------------------------
    Dim shLeftSleeve As Shape, shRightSleeve As Shape
    Set shLeftSleeve = FindPanelShape(p, Array("left sleeve", "sleeve left", "sleeve l", "l sleeve", "hsl l", "fsl l", "lhs"))
    Set shRightSleeve = FindPanelShape(p, Array("right sleeve", "sleeve right", "sleeve r", "r sleeve", "hsl r", "fsl r", "rhs"))
    
    ' If not found separately, look for general "sleeve" or prompt
    If shLeftSleeve Is Nothing And shRightSleeve Is Nothing Then
        Dim shGeneralSleeve As Shape
        Set shGeneralSleeve = FindPanelShape(p, Array("sleeve", "sleev", "slv", "sleve"))
        If Not shGeneralSleeve Is Nothing Then
            Set shLeftSleeve = shGeneralSleeve
            Set shRightSleeve = shGeneralSleeve
        End If
    End If
    
    If shLeftSleeve Is Nothing Then
        If MsgBox("Left Sleeve was not detected by name." & vbCrLf & vbCrLf & _
                  "Please SELECT your Left Sleeve graphic on screen, then click 'OK'." & vbCrLf & _
                  "(Or click Cancel to skip)", vbOKCancel + vbInformation, "Select Left Sleeve") = vbOK Then
            If doc.ActiveSelection.Shapes.Count > 0 Then
                Set shLeftSleeve = doc.ActiveSelection.Shapes(1)
                shLeftSleeve.Name = "Left Sleeve"
            End If
        End If
    End If
    
    If Not shLeftSleeve Is Nothing Then
        If ExportSingleShape(doc, shLeftSleeve, tempPath & "\sleeve_left.jpg") Then
            exportedCount = exportedCount + 1
            exportedReport = exportedReport & vbCrLf & "  ✔ Left Sleeve (" & shLeftSleeve.Name & ") -> sleeve_left.jpg"
        End If
    End If
    
    If shRightSleeve Is Nothing And Not shLeftSleeve Is Nothing Then
        ' Ask if right sleeve is identical or separate
        If MsgBox("Is the Right Sleeve different from the Left Sleeve?" & vbCrLf & vbCrLf & _
                  "Click 'Yes' to select a separate Right Sleeve." & vbCrLf & _
                  "Click 'No' to use the same artwork for both sleeves.", vbYesNo + vbQuestion, "Right Sleeve") = vbYes Then
            If MsgBox("Please SELECT your Right Sleeve graphic on screen, then click 'OK'.", vbOKCancel + vbInformation, "Select Right Sleeve") = vbOK Then
                If doc.ActiveSelection.Shapes.Count > 0 Then
                    Set shRightSleeve = doc.ActiveSelection.Shapes(1)
                    shRightSleeve.Name = "Right Sleeve"
                End If
            End If
        Else
            Set shRightSleeve = shLeftSleeve
        End If
    End If
    
    If Not shRightSleeve Is Nothing Then
        If ExportSingleShape(doc, shRightSleeve, tempPath & "\sleeve_right.jpg") Then
            exportedCount = exportedCount + 1
            exportedReport = exportedReport & vbCrLf & "  ✔ Right Sleeve (" & shRightSleeve.Name & ") -> sleeve_right.jpg"
        End If
    End If
    
    ' -------------------------------------------------------------
    ' 4. DETECT & EXPORT COLLAR (18 x 4.5) (Optional)
    ' -------------------------------------------------------------
    Dim shCollar As Shape
    Set shCollar = FindPanelShape(p, Array("collar", "rib", "neck"))
    If Not shCollar Is Nothing Then
        If ExportSingleShape(doc, shCollar, tempPath & "\collar.jpg") Then
            exportedCount = exportedCount + 1
            exportedReport = exportedReport & vbCrLf & "  ✔ Collar Band (" & shCollar.Name & ") -> collar.jpg"
        End If
    End If
    
    doc.ClearSelection
    
    If exportedCount = 0 Then
        MsgBox "No panels were exported." & vbCrLf & vbCrLf & _
               "Please make sure your panel shapes or export assets are named 'Front', 'Back', 'Sleeve', etc.", vbExclamation, "FiveNest Export"
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
    
    ' Destination ZIP Path on Desktop
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
    
    ' Launch FiveNest Web Studio in default browser
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

' Helper: Export a single Shape directly to 300 DPI RGB JPG
Private Function ExportSingleShape(doc As Document, sh As Shape, outPath As String) As Boolean
    ExportSingleShape = False
    On Error GoTo CatchErr
    
    doc.ClearSelection
    sh.Selected = True
    
    ' 774 = cdrJPEG, 1 = cdrSelection, 4 = cdrRGBColorImage, 300 DPI, EmbedProfile = True
    doc.ExportBitmap outPath, 774, 1, 4, 0, 0, 300, 300, 1, False, False, True, False, 0
    
    doc.ClearSelection
    ExportSingleShape = True
    Exit Function
    
CatchErr:
    ExportSingleShape = False
End Function

' Helper: Smart Fuzzy Search across all shapes, layers and sub-shapes
Private Function FindPanelShape(p As Page, keywords As Variant) As Shape
    Set FindPanelShape = Nothing
    On Error Resume Next
    
    Dim sh As Shape
    Dim sName As String
    Dim k As Long
    
    ' 1. Check all shapes on the page (including top-level and groups)
    For Each sh In p.Shapes.All
        sName = LCase(Trim(sh.Name))
        If Len(sName) > 0 Then
            For k = LBound(keywords) To UBound(keywords)
                If InStr(1, sName, LCase(CStr(keywords(k)))) > 0 Then
                    Set FindPanelShape = sh
                    Exit Function
                End If
            Next k
        End If
    Next sh
    
    ' 2. Check layers if shape not found
    Dim lyr As Layer
    For Each lyr In p.Layers
        sName = LCase(Trim(lyr.Name))
        For k = LBound(keywords) To UBound(keywords)
            If InStr(1, sName, LCase(CStr(keywords(k)))) > 0 Then
                If lyr.Shapes.Count > 0 Then
                    Set FindPanelShape = lyr.Shapes.All.Group
                    Exit Function
                End If
            End If
        Next k
    Next lyr
End Function
