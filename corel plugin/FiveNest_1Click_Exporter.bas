Attribute VB_Name = "FiveNest_1Click_Exporter"
' ==============================================================================
' FIVENEST 1-CLICK COREL TO STUDIO EXPORTER
' 7-BUTTON ASSIGNMENT SYSTEM (LIKE ILLUSTRATOR ASSET EXPORT)
' ==============================================================================
' 1. Select Front artwork on screen  -> Run 'Assign_1_Front'
' 2. Select Back artwork on screen   -> Run 'Assign_2_Back'
' 3. Select Left sleeve on screen    -> Run 'Assign_3_Left_Half_SL' (or 'Assign_5_Left_Full_SL')
' 4. Select Right sleeve on screen   -> Run 'Assign_4_Right_Half_SL' (or 'Assign_6_Right_Full_SL')
' 5. Select Collar strip on screen   -> Run 'Assign_7_Collar'
' 6. Run 'Assign_8_RUN_Send_To_FiveNest' -> Exports 300 DPI RGB JPG to Desktop ZIP & opens Studio!
' ==============================================================================

Option Explicit

' -------------------------------------------------------------
' BUTTON 1: ASSIGN FRONT PANEL (22" x 30")
' -------------------------------------------------------------
Public Sub Assign_1_Front()
    TagSelection "FN_FRONT", "Front Panel", 22#, 30#
End Sub

' -------------------------------------------------------------
' BUTTON 2: ASSIGN BACK PANEL (22" x 30")
' -------------------------------------------------------------
Public Sub Assign_2_Back()
    TagSelection "FN_BACK", "Back Panel", 22#, 30#
End Sub

' -------------------------------------------------------------
' BUTTON 3: ASSIGN LEFT HALF SLEEVE (19" x 11")
' -------------------------------------------------------------
Public Sub Assign_3_Left_Half_SL()
    TagSelection "FN_SLEEVE_LEFT_HALF", "Left Half Sleeve", 19#, 11#
End Sub

' -------------------------------------------------------------
' BUTTON 4: ASSIGN RIGHT HALF SLEEVE (19" x 11")
' -------------------------------------------------------------
Public Sub Assign_4_Right_Half_SL()
    TagSelection "FN_SLEEVE_RIGHT_HALF", "Right Half Sleeve", 19#, 11#
End Sub

' -------------------------------------------------------------
' BUTTON 5: ASSIGN LEFT FULL SLEEVE (19" x 25")
' -------------------------------------------------------------
Public Sub Assign_5_Left_Full_SL()
    TagSelection "FN_SLEEVE_LEFT_FULL", "Left Full Sleeve", 19#, 25#
End Sub

' -------------------------------------------------------------
' BUTTON 6: ASSIGN RIGHT FULL SLEEVE (19" x 25")
' -------------------------------------------------------------
Public Sub Assign_6_Right_Full_SL()
    TagSelection "FN_SLEEVE_RIGHT_FULL", "Right Full Sleeve", 19#, 25#
End Sub

' -------------------------------------------------------------
' BUTTON 7: ASSIGN COLLAR BAND (18" x 4.5")
' -------------------------------------------------------------
Public Sub Assign_7_Collar()
    TagSelection "FN_COLLAR", "Collar Band", 18#, 4.5
End Sub

' -------------------------------------------------------------
' BUTTON 8: RUN - EXPORT ALL ASSIGNED PANELS & SEND TO FIVENEST
' -------------------------------------------------------------
Public Sub Assign_8_RUN_Send_To_FiveNest()
    Dim doc As Document
    Set doc = ActiveDocument
    
    If doc Is Nothing Then
        MsgBox "Please open a jersey artwork document in CorelDRAW first.", vbExclamation, "FiveNest Exporter"
        Exit Sub
    End If
    
    Dim p As Page
    Set p = doc.ActivePage
    
    ' 1. Find assigned shapes or fallback to smart detection
    Dim shFront As Shape, shBack As Shape
    Dim shLeftSleeve As Shape, shRightSleeve As Shape
    Dim shCollar As Shape
    Dim isFullSleeve As Boolean
    isFullSleeve = False
    
    ' Front
    Set shFront = FindShapeByTag(p, "FN_FRONT")
    If shFront Is Nothing Then Set shFront = FindShapeByFuzzyName(p, Array("front", "frnt", "fnt"))
    If shFront Is Nothing Then
        If MsgBox("Front panel is not assigned yet." & vbCrLf & vbCrLf & _
                  "Please SELECT your Front graphic on screen, then click OK." & vbCrLf & _
                  "(Or Cancel to skip Front)", vbOKCancel + vbQuestion, "Select Front Panel") = vbOK Then
            If ActiveSelectionRange.Count > 0 Then
                Set shFront = TagActiveSelection("FN_FRONT")
            End If
        End If
    End If
    
    ' Back
    Set shBack = FindShapeByTag(p, "FN_BACK")
    If shBack Is Nothing Then Set shBack = FindShapeByFuzzyName(p, Array("back", "bck", "rear"))
    If shBack Is Nothing Then
        If MsgBox("Back panel is not assigned yet." & vbCrLf & vbCrLf & _
                  "Please SELECT your Back graphic on screen, then click OK." & vbCrLf & _
                  "(Or Cancel to skip Back)", vbOKCancel + vbQuestion, "Select Back Panel") = vbOK Then
            If ActiveSelectionRange.Count > 0 Then
                Set shBack = TagActiveSelection("FN_BACK")
            End If
        End If
    End If
    
    ' Sleeves (Check Full Sleeve first, then Half Sleeve)
    Set shLeftSleeve = FindShapeByTag(p, "FN_SLEEVE_LEFT_FULL")
    If Not shLeftSleeve Is Nothing Then
        isFullSleeve = True
        Set shRightSleeve = FindShapeByTag(p, "FN_SLEEVE_RIGHT_FULL")
    Else
        Set shLeftSleeve = FindShapeByTag(p, "FN_SLEEVE_LEFT_HALF")
        If Not shLeftSleeve Is Nothing Then
            isFullSleeve = False
            Set shRightSleeve = FindShapeByTag(p, "FN_SLEEVE_RIGHT_HALF")
        End If
    End If
    
    ' If not tagged yet, check fuzzy names
    If shLeftSleeve Is Nothing Then
        Set shLeftSleeve = FindShapeByFuzzyName(p, Array("left sleeve", "sleeve left", "sleeve l", "l sleeve", "hsl l", "fsl l"))
    End If
    If shRightSleeve Is Nothing Then
        Set shRightSleeve = FindShapeByFuzzyName(p, Array("right sleeve", "sleeve right", "sleeve r", "r sleeve", "hsl r", "fsl r"))
    End If
    
    ' If still not found, prompt for sleeve
    If shLeftSleeve Is Nothing Then
        Dim slvTypeResp As VbMsgBoxResult
        slvTypeResp = MsgBox("Are you creating FULL SLEEVES (19"" x 25"")?" & vbCrLf & vbCrLf & _
                             "Click 'Yes' for Full Sleeve" & vbCrLf & _
                             "Click 'No' for Half Sleeve (19"" x 11"")", vbYesNo + vbQuestion, "Sleeve Type")
        isFullSleeve = (slvTypeResp = vbYes)
        
        Dim tagL As String, tagR As String
        tagL = IIf(isFullSleeve, "FN_SLEEVE_LEFT_FULL", "FN_SLEEVE_LEFT_HALF")
        tagR = IIf(isFullSleeve, "FN_SLEEVE_RIGHT_FULL", "FN_SLEEVE_RIGHT_HALF")
        
        If MsgBox("Please SELECT your Left Sleeve graphic on screen, then click OK.", vbOKCancel + vbInformation, "Select Left Sleeve") = vbOK Then
            If ActiveSelectionRange.Count > 0 Then
                Set shLeftSleeve = TagActiveSelection(tagL)
            End If
        End If
        
        If Not shLeftSleeve Is Nothing And shRightSleeve Is Nothing Then
            If MsgBox("Is the Right Sleeve DIFFERENT from Left Sleeve?" & vbCrLf & vbCrLf & _
                      "Click 'Yes' to select a separate Right Sleeve." & vbCrLf & _
                      "Click 'No' to use same graphic for both sleeves.", vbYesNo + vbQuestion, "Right Sleeve") = vbYes Then
                If MsgBox("Please SELECT your Right Sleeve graphic on screen, then click OK.", vbOKCancel + vbInformation, "Select Right Sleeve") = vbOK Then
                    If ActiveSelectionRange.Count > 0 Then
                        Set shRightSleeve = TagActiveSelection(tagR)
                    End If
                End If
            Else
                Set shRightSleeve = shLeftSleeve
            End If
        End If
    End If
    
    ' Collar (Optional)
    Set shCollar = FindShapeByTag(p, "FN_COLLAR")
    If shCollar Is Nothing Then Set shCollar = FindShapeByFuzzyName(p, Array("collar", "rib", "neck"))
    
    ' Prepare Temp Export Directory
    Dim fso As Object, wShell As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set wShell = CreateObject("WScript.Shell")
    
    Dim tempPath As String
    tempPath = fso.GetSpecialFolder(2) & "\FiveNest_Export_" & Format(Now, "yyyymmdd_hhnnss")
    If Not fso.FolderExists(tempPath) Then fso.CreateFolder tempPath
    
    Dim exportedCount As Long
    exportedCount = 0
    Dim report As String
    report = ""
    
    ' Export Front (22 x 30 @ 300 DPI RGB JPG)
    If Not shFront Is Nothing Then
        If ExportSingleShape(doc, shFront, tempPath & "\front.jpg") Then
            exportedCount = exportedCount + 1
            report = report & vbCrLf & "  ✔ Front Panel (22"" x 30"") -> front.jpg"
        End If
    End If
    
    ' Export Back (22 x 30 @ 300 DPI RGB JPG)
    If Not shBack Is Nothing Then
        If ExportSingleShape(doc, shBack, tempPath & "\back.jpg") Then
            exportedCount = exportedCount + 1
            report = report & vbCrLf & "  ✔ Back Panel (22"" x 30"") -> back.jpg"
        End If
    End If
    
    ' Export Left Sleeve (19 x 11 or 19 x 25 @ 300 DPI RGB JPG)
    If Not shLeftSleeve Is Nothing Then
        If ExportSingleShape(doc, shLeftSleeve, tempPath & "\sleeve_left.jpg") Then
            exportedCount = exportedCount + 1
            report = report & vbCrLf & "  ✔ Left Sleeve (" & IIf(isFullSleeve, "19"" x 25""", "19"" x 11""") & ") -> sleeve_left.jpg"
        End If
    End If
    
    ' Export Right Sleeve (19 x 11 or 19 x 25 @ 300 DPI RGB JPG)
    If Not shRightSleeve Is Nothing Then
        If ExportSingleShape(doc, shRightSleeve, tempPath & "\sleeve_right.jpg") Then
            exportedCount = exportedCount + 1
            report = report & vbCrLf & "  ✔ Right Sleeve (" & IIf(isFullSleeve, "19"" x 25""", "19"" x 11""") & ") -> sleeve_right.jpg"
        End If
    End If
    
    ' Export Collar (18 x 4.5 @ 300 DPI RGB JPG)
    If Not shCollar Is Nothing Then
        If ExportSingleShape(doc, shCollar, tempPath & "\collar.jpg") Then
            exportedCount = exportedCount + 1
            report = report & vbCrLf & "  ✔ Collar Band (18"" x 4.5"") -> collar.jpg"
        End If
    End If
    
    doc.ClearSelection
    
    If exportedCount = 0 Then
        MsgBox "No panels were exported." & vbCrLf & vbCrLf & _
               "Please select your panels on screen and use the Assign buttons (1 to 7) first.", vbExclamation, "FiveNest Export"
        Exit Sub
    End If
    
    ' Create Manifest JSON
    Dim manifestPath As String
    manifestPath = tempPath & "\manifest.json"
    Dim ts As Object
    Set ts = fso.CreateTextFile(manifestPath, True)
    ts.WriteLine "{"
    ts.WriteLine "  ""source"": ""CorelDRAW 7-Button Exporter"","
    ts.WriteLine "  ""format"": ""JPG"","
    ts.WriteLine "  ""colorProfile"": ""RGB"","
    ts.WriteLine "  ""dpi"": 300,"
    ts.WriteLine "  ""sleeveType"": """ & IIf(isFullSleeve, "full", "half") & ""","
    ts.WriteLine "  ""exportedCount"": " & exportedCount & ","
    ts.WriteLine "  ""timestamp"": """ & Now & """"
    ts.WriteLine "}"
    ts.Close
    
    ' Destination ZIP on Desktop
    Dim desktopPath As String
    desktopPath = wShell.SpecialFolders("Desktop")
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
    wShell.Run psCmd, 0, True
    
    ' Launch FiveNest Studio in default browser
    wShell.Run "https://canvas.fivenest.com"
    
    ' Highlight ZIP in Windows File Explorer
    wShell.Run "explorer.exe /select,""" & zipFile & """"
    
    ' Cleanup temp folder
    On Error Resume Next
    fso.DeleteFolder tempPath, True
    On Error GoTo 0
    
    MsgBox "🚀 FiveNest Export Successful!" & vbCrLf & vbCrLf & _
           exportedCount & " panels exported in 300 DPI RGB JPG:" & report & vbCrLf & vbCrLf & _
           "Desktop ZIP Ready:" & vbCrLf & _
           zipFile & vbCrLf & vbCrLf & _
           "FiveNest Studio is open in your browser!" & vbCrLf & _
           "Simply DRAG & DROP the ZIP file into the 3D studio canvas.", _
           vbInformation, "FiveNest Exporter"
End Sub

' -------------------------------------------------------------
' HELPER: TAG CURRENT SELECTION AS A PANEL
' -------------------------------------------------------------
Private Sub TagSelection(panelTag As String, panelLabel As String, dimW As Double, dimH As Double)
    If ActiveSelectionRange.Count = 0 Then
        MsgBox "Please SELECT your " & panelLabel & " graphic on screen first," & vbCrLf & _
               "then click this button to assign it.", vbExclamation, "No Selection Found"
        Exit Sub
    End If
    
    Dim sh As Shape
    Set sh = TagActiveSelection(panelTag)
    
    MsgBox "✔ " & panelLabel & " Assigned!" & vbCrLf & vbCrLf & _
           "Panel: " & panelLabel & vbCrLf & _
           "Tagged Name: " & sh.Name & vbCrLf & _
           "Selected Dimensions: " & Round(sh.SizeWidth, 2) & """ x " & Round(sh.SizeHeight, 2) & """" & vbCrLf & _
           "Standard Target Size: " & dimW & """ x " & dimH & """", _
           vbInformation, "FiveNest Panel Assigned"
End Sub

Private Function TagActiveSelection(panelTag As String) As Shape
    Dim sh As Shape
    If ActiveSelectionRange.Count = 1 Then
        Set sh = ActiveSelectionRange(1)
    Else
        ' If multiple shapes selected (artwork + logos + layers), group them
        Set sh = ActiveSelectionRange.Group
    End If
    sh.Name = panelTag
    Set TagActiveSelection = sh
End Function

' -------------------------------------------------------------
' HELPER: FIND SHAPE BY ITS FIVENEST TAG
' -------------------------------------------------------------
Private Function FindShapeByTag(p As Page, tag As String) As Shape
    Set FindShapeByTag = Nothing
    On Error Resume Next
    
    Dim sh As Shape
    For Each sh In p.Shapes.All
        If StrComp(sh.Name, tag, vbTextCompare) = 0 Then
            Set FindShapeByTag = sh
            Exit Function
        End If
    Next sh
End Function

' -------------------------------------------------------------
' HELPER: FUZZY SEARCH (Front, 2 Front, Back, 2 Back, etc.)
' -------------------------------------------------------------
Private Function FindShapeByFuzzyName(p As Page, keywords As Variant) As Shape
    Set FindShapeByFuzzyName = Nothing
    On Error Resume Next
    
    Dim sh As Shape
    Dim sName As String
    Dim k As Long
    
    For Each sh In p.Shapes.All
        sName = LCase(Trim(sh.Name))
        If Len(sName) > 0 Then
            For k = LBound(keywords) To UBound(keywords)
                If InStr(1, sName, LCase(CStr(keywords(k)))) > 0 Then
                    Set FindShapeByFuzzyName = sh
                    Exit Function
                End If
            Next k
        End If
    Next sh
End Function

' -------------------------------------------------------------
' HELPER: EXPORT SINGLE SHAPE AS 300 DPI RGB JPG
' -------------------------------------------------------------
Private Function ExportSingleShape(doc As Document, sh As Shape, outPath As String) As Boolean
    ExportSingleShape = False
    On Error GoTo CatchErr
    
    doc.ClearSelection
    sh.Selected = True
    
    Dim expFltr As ExportFilter
    ' 774 = cdrJPEG, 1 = cdrSelection, 4 = cdrRGBColorImage, 300 DPI, EmbedProfile = True
    Set expFltr = doc.ExportBitmap(outPath, 774, 1, 4, 0, 0, 300, 300, 1, False, False, True, False, 0)
    If Not expFltr Is Nothing Then
        expFltr.Finish
    End If
    
    doc.ClearSelection
    ExportSingleShape = True
    Exit Function
    
CatchErr:
    ExportSingleShape = False
End Function
