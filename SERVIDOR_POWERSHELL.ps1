# Servidor HTTP simple en PowerShell
# Para Coraline Aquariums

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVIDOR LOCAL - CORALINE ACUARIOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando servidor en http://localhost:8081" -ForegroundColor Green
Write-Host ""
Write-Host "Abre tu navegador y ve a:" -ForegroundColor Yellow
Write-Host "  http://localhost:8081/contacto.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para detener: Presiona Ctrl+C" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8081/")
$listener.Start()

Write-Host "[OK] Servidor corriendo..." -ForegroundColor Green
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif" = "image/gif"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf" = "font/ttf"
    ".otf" = "font/otf"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestUrl = $request.Url.LocalPath
        
        # Timestamp para el log
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        # Si pide /, servir index.html
        if ($requestUrl -eq "/") {
            $requestUrl = "/index.html"
        }
        
        # Construir ruta del archivo
        $filePath = Join-Path $PSScriptRoot $requestUrl.TrimStart('/')
        
        # Log de la solicitud
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
        Write-Host "$($request.HttpMethod) " -NoNewline -ForegroundColor Cyan
        Write-Host "$requestUrl" -NoNewline
        
        if (Test-Path $filePath) {
            # Obtener extensión y tipo MIME
            $extension = [System.IO.Path]::GetExtension($filePath)
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }
            
            # Leer y servir el archivo
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
            
            Write-Host " -> " -NoNewline -ForegroundColor DarkGray
            Write-Host "200 OK" -ForegroundColor Green
        }
        else {
            # Archivo no encontrado
            $response.StatusCode = 404
            $content = [System.Text.Encoding]::UTF8.GetBytes("404 - Archivo no encontrado")
            $response.OutputStream.Write($content, 0, $content.Length)
            
            Write-Host " -> " -NoNewline -ForegroundColor DarkGray
            Write-Host "404 Not Found" -ForegroundColor Red
        }
        
        $response.Close()
    }
}
catch {
    Write-Host ""
    Write-Host "Servidor detenido" -ForegroundColor Yellow
}
finally {
    $listener.Stop()
    $listener.Close()
}
