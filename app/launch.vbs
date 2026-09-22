' Databricks Study Lab: levanta el servidor local y abre la app en su propia ventana.
Option Explicit
Dim sh, fso, carpeta, chrome, puerto, url, pythonw
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

carpeta = fso.GetParentFolderName(WScript.ScriptFullName)
puerto = "8765"
url = "http://127.0.0.1:" & puerto & "/app/index.html"

pythonw = "pythonw"
If fso.FileExists(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python312\pythonw.exe") Then
  pythonw = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python312\pythonw.exe"
ElseIf fso.FileExists(sh.ExpandEnvironmentStrings("%USERPROFILE%") & "\anaconda3\pythonw.exe") Then
  pythonw = sh.ExpandEnvironmentStrings("%USERPROFILE%") & "\anaconda3\pythonw.exe"
End If

' Arranca el servidor en segundo plano. Si el puerto ya esta ocupado, el proceso termina solo.
sh.CurrentDirectory = carpeta
sh.Run """" & pythonw & """ """ & carpeta & "\server.py""", 0, False
WScript.Sleep 900

chrome = sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"
If Not fso.FileExists(chrome) Then
  chrome = sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe"
End If

If fso.FileExists(chrome) Then
  sh.Run """" & chrome & """ --app=" & url & " --window-size=1400,900", 1, False
Else
  sh.Run url, 1, False
End If
