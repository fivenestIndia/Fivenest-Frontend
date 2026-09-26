Attribute VB_Name = "FiveNest_1Click_Exporter"
' ==============================================================================
' FIVENEST 1-CLICK COREL TO STUDIO EXPORTER
' POPUP FLOATING PANEL WITH 8 BUTTONS
' ==============================================================================
Option Explicit

' ONE SINGLE MACRO TO RUN:
Public Sub ExportToFiveNest()
    On Error Resume Next
    UserForm1.Show vbModeless
    If Err.Number <> 0 Then
        ' Fallback if UserForm not created yet
        UserForm1.Show
    End If
End Sub
