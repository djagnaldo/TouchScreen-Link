# Script de compilação automatizada do TouchScreen Link Windows Server
param (
    [string]$Configuration = "Release"
)

Write-Host "=== Compilando TouchScreen Link Server (.NET 8 Windows x64) ===" -ForegroundColor Cyan

# 1. Limpeza e restauração de dependências
dotnet restore TouchScreenLink.sln

# 2. Publicação como executável autônomo e de arquivo único
dotnet publish TouchScreenLink.Server\TouchScreenLink.Server.csproj `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o .\publish

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha na compilação do executável .NET."
    exit 1
}

Write-Host "✓ Executável gerado com sucesso em: .\publish\TouchScreenLinkServer.exe" -ForegroundColor Green

# 3. Compilação do Instalador via Inno Setup (se instalado)
$isccPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (Test-Path $isccPath) {
    Write-Host "Criando instalador com Inno Setup 6..." -ForegroundColor Cyan
    & $isccPath TouchScreenLink.Server\Installer\TouchScreenLinkSetup.iss
    Write-Host "✓ Instalador criado na pasta Output\TouchScreenLink-Setup-x64.exe" -ForegroundColor Green
} else {
    Write-Warning "Inno Setup 6 não foi encontrado no caminho padrão. O instalador .exe pode ser compilado abrindo TouchScreenLinkSetup.iss no Inno Setup IDE."
}
