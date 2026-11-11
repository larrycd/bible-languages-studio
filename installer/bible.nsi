; Bible Languages Studio - Windows setup (per-user, no administrator rights)
Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "x64.nsh"
!include "LogicLib.nsh"
!define APPNAME "Bible Languages Studio"
!define VERSION "1.0.0"
!define PUBLISHER "Larry Dalton"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleLanguagesStudio"
Name "${APPNAME}"
OutFile "BibleLanguagesStudio-Setup.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\BibleLanguagesStudio-Setup"
BrandingText "Bible Languages Studio - by Larry Dalton"
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "Bible Languages Studio setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Bible Languages Studio by Larry Dalton"
!define MUI_ICON "bible.ico"
!define MUI_UNICON "bible.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Bible Languages Studio ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "Biblical Hebrew, Paleo-Hebrew and Koine Greek: read, write and study the Bible languages - by Larry Dalton.$\r$\n$\r$\nThis will:$\r$\n  - install Bible Languages Studio for your Windows account (no administrator rights needed)$\r$\n  - start it at sign-in and open it at http://localhost:8769/$\r$\n  - place the Bible Languages Studio infographic on your Desktop$\r$\n$\r$\nA PowerShell window shows the install checks. If any check fails, your previous version is restored automatically."
!define MUI_FINISHPAGE_TITLE "Bible Languages Studio is installed"
!define MUI_FINISHPAGE_TEXT "Bible Languages Studio is running at http://localhost:8769/ and starts automatically when you sign in.$\r$\n$\r$\nThe infographic is on your Desktop:$\r$\n  Bible Languages Studio - How It Works.png"
!define MUI_FINISHPAGE_LINK "Open Bible Languages Studio"
!define MUI_FINISHPAGE_LINK_LOCATION "http://localhost:8769/"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Var PS
Var RES
Function .onInit
  SetShellVarContext current
FunctionEnd
Function un.onInit
  SetShellVarContext current
FunctionEnd
Section "Install"
  SetShellVarContext current
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
  ${EndIf}
  StrCpy $PS "$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
  IfFileExists "$PS" +3 0
    MessageBox MB_ICONSTOP "Windows PowerShell was not found ($PS). Bible Languages Studio needs Windows PowerShell 5.1."
    Abort "Windows PowerShell not found."
  SetOutPath "$INSTDIR"
  File "Install.ps1"
  File "Uninstall.ps1"
  File "bible.ico"
  RMDir /r "$INSTDIR\payload"
  SetOutPath "$INSTDIR\payload"
  File /r "payload\*"
  DetailPrint "Placing the infographic on your Desktop..."
  SetOutPath "$DESKTOP"
  File "Bible Languages Studio - How It Works.png"
  SetOutPath "$INSTDIR"
  DetailPrint "Installing and verifying Bible Languages Studio (see the PowerShell window)..."
  Delete "$TEMP\BibleLanguagesStudio-install-result.txt"
  ExecWait '"$PS" -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\Install.ps1" -Source "$INSTDIR\payload"'
  StrCpy $RES ""
  ClearErrors
  FileOpen $0 "$TEMP\BibleLanguagesStudio-install-result.txt" r
  ${IfNot} ${Errors}
    FileRead $0 $RES
    FileClose $0
  ${EndIf}
  StrCpy $1 $RES 2
  ${If} $1 != "OK"
    ${If} $RES == ""
      StrCpy $RES "The PowerShell install did not report a result."
    ${EndIf}
    DetailPrint "Install failed: $RES"
    MessageBox MB_ICONSTOP "Bible Languages Studio was not installed.$\r$\n$\r$\n$RES$\r$\n$\r$\nYour previous version (if any) has been restored."
    Abort "Bible Languages Studio was not installed."
  ${EndIf}
  RMDir /r "$INSTDIR\payload"
  DetailPrint "Install verified."
  WriteINIStr "$SMPROGRAMS\Bible Languages Studio.url" "InternetShortcut" "URL" "http://localhost:8769/"
  WriteINIStr "$SMPROGRAMS\Bible Languages Studio.url" "InternetShortcut" "IconFile" "$INSTDIR\bible.ico"
  WriteINIStr "$SMPROGRAMS\Bible Languages Studio.url" "InternetShortcut" "IconIndex" "0"
  WriteINIStr "$DESKTOP\Bible Languages Studio.url" "InternetShortcut" "URL" "http://localhost:8769/"
  WriteINIStr "$DESKTOP\Bible Languages Studio.url" "InternetShortcut" "IconFile" "$INSTDIR\bible.ico"
  WriteINIStr "$DESKTOP\Bible Languages Studio.url" "InternetShortcut" "IconIndex" "0"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\bible.ico"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$LOCALAPPDATA\BibleLanguagesStudio"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "${UNINSTKEY}" "URLInfoAbout" "http://localhost:8769/"
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
  ${EndIf}
  ExecWait '"$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\Uninstall.ps1"'
  Delete "$SMPROGRAMS\Bible Languages Studio.url"
  Delete "$DESKTOP\Bible Languages Studio.url"
  DeleteRegKey HKCU "${UNINSTKEY}"
  Delete "$INSTDIR\Install.ps1"
  Delete "$INSTDIR\Uninstall.ps1"
  Delete "$INSTDIR\bible.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  MessageBox MB_ICONINFORMATION "Bible Languages Studio has been removed.$\r$\nThe infographic on your Desktop and earlier backups (BibleLanguagesStudio-backup-*) were left in place."
SectionEnd
