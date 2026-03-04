# Script para copiar fotos de la galeria
# Coraline Acuarios

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  COPIADOR DE FOTOS DE GALERIA" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Rutas
$origenBase = "C:\Users\Sergio\OneDrive\Presupuestos local\Fotos acuarios completados\para la web"
$destinoBase = "$PSScriptRoot\images\proyectos"

# Crear carpeta de destino si no existe
if (!(Test-Path $destinoBase)) {
    New-Item -ItemType Directory -Path $destinoBase | Out-Null
    Write-Host "Carpeta images/proyectos creada" -ForegroundColor Green
}
else {
    Write-Host "Carpeta images/proyectos ya existe" -ForegroundColor Yellow
}

# Contador de fotos copiadas
$totalFotos = 0
$fotosCopiadas = 0

# Extensiones de imagen validas
$extensiones = @('*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp')

Write-Host ""
Write-Host "Buscando fotos en carpetas numeradas (1-17)..." -ForegroundColor Cyan
Write-Host ""

# Recorrer carpetas numeradas del 1 al 17
for ($i = 1; $i -le 17; $i++) {
    $carpeta = Join-Path $origenBase $i.ToString()
    
    if (Test-Path $carpeta) {
        Write-Host "Procesando carpeta: $i" -ForegroundColor Yellow
        
        # Obtener todas las fotos de esta carpeta
        $fotos = Get-ChildItem -Path $carpeta -Include $extensiones -File -Recurse
        
        if ($fotos.Count -eq 0) {
            Write-Host "   No se encontraron fotos" -ForegroundColor Gray
            continue
        }
        
        # Contador para esta carpeta
        $contador = 1
        
        foreach ($foto in $fotos) {
            $totalFotos++
            
            # Crear nombre nuevo: proyecto_X_001.jpg
            $extension = $foto.Extension.ToLower()
            $nuevoNombre = "proyecto_$($i.ToString().PadLeft(2, '0'))_$($contador.ToString().PadLeft(3, '0'))$extension"
            $destino = Join-Path $destinoBase $nuevoNombre
            
            # Copiar archivo
            try {
                Copy-Item -Path $foto.FullName -Destination $destino -Force
                $fotosCopiadas++
                Write-Host "   Copiado: $nuevoNombre" -ForegroundColor Green
            }
            catch {
                Write-Host "   Error al copiar: $($foto.Name)" -ForegroundColor Red
            }
            
            $contador++
        }
        
        Write-Host "   Total carpeta $i : $($fotos.Count) foto(s)" -ForegroundColor Cyan
        Write-Host ""
    }
    else {
        Write-Host "Carpeta $i no existe" -ForegroundColor Gray
    }
}

# Tambien copiar fotos sueltas en la raiz
Write-Host "Buscando fotos sueltas en la carpeta raiz..." -ForegroundColor Cyan
$fotosSueltas = Get-ChildItem -Path $origenBase -Include $extensiones -File

if ($fotosSueltas.Count -gt 0) {
    Write-Host "Copiando fotos sueltas" -ForegroundColor Yellow
    
    $contador = 1
    foreach ($foto in $fotosSueltas) {
        $totalFotos++
        
        $extension = $foto.Extension.ToLower()
        $nuevoNombre = "proyecto_00_$($contador.ToString().PadLeft(3, '0'))$extension"
        $destino = Join-Path $destinoBase $nuevoNombre
        
        try {
            Copy-Item -Path $foto.FullName -Destination $destino -Force
            $fotosCopiadas++
            Write-Host "   Copiado: $nuevoNombre" -ForegroundColor Green
        }
        catch {
            Write-Host "   Error al copiar: $($foto.Name)" -ForegroundColor Red
        }
        
        $contador++
    }
    
    Write-Host "   Total sueltas: $($fotosSueltas.Count) foto(s)" -ForegroundColor Cyan
}

# Resumen final
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Total fotos encontradas: $totalFotos" -ForegroundColor White
Write-Host "Fotos copiadas: $fotosCopiadas" -ForegroundColor Green
Write-Host "Destino: images/proyectos/" -ForegroundColor White
Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Green
Write-Host ""

Read-Host "Presiona Enter para cerrar"
