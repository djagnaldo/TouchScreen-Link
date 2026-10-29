; Script do Instalador Oficial Inno Setup 6 para TouchScreen Link PC Windows v1.1
#define MyAppName "TouchScreen Link"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "TouchScreen Link Team"
#define MyAppExeName "TouchScreenLinkServer.exe"

[Setup]
AppId={{5E98B48D-81F1-4F23-9366-D0A6A7C15421}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\Output
OutputBaseFilename=TouchScreenLink-Setup-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startupicon"; Description: "Iniciar automaticamente com o Windows (Recomendado)"; GroupDescription: "Inicialização:"

[Files]
Source: "..\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--silent"; Tasks: startupicon

[Run]
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""TouchScreen Link Server (TCP)"" dir=in action=allow protocol=TCP localport=45820 program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""TouchScreen Link Discovery (UDP)"" dir=in action=allow protocol=UDP localport=45824 program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""TouchScreen Link Server (TCP)"""; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""TouchScreen Link Discovery (UDP)"""; Flags: runhidden
