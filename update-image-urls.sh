#!/bin/bash

# Script para actualizar URLs de imágenes en portfoliOS

# Mapeo de nombres antiguos a nuevos
declare -A url_mapping=(
    ["YrGrbT.png"]="Safari_App_Icon.png"
    ["YrG9y2.png"]="Spotify_App_Icon.png"
    ["YrGGNw.png"]="Notes_App_Icon.png"
    ["YrGAfy.png"]="Settings_App_Icon.png"
    ["YrGtNS.png"]="Calendar_App_Icon.png"
    ["YrGVXH.png"]="Weather_App_Icon.png"
    ["YrGSBt.png"]="Photos_App_Icon.png"
    ["YrG7Xa.png"]="Camera_App_Icon.png"
    ["YrcS09.webp"]="Businfy_Project_Image.webp"
    ["YrSPQH.png"]="Portfolio_V2_Project_Image.png"
    ["YrSTSS.png"]="Portfolio_V2_Gallery.png"
    ["YrcOJH.webp"]="Book_Manager_Project_Image.webp"
    ["YrcGCD.webp"]="Podgenius_Project_Image.webp"
    ["Yrc7FT.webp"]="Resuma_Project_Image.webp"
    ["Yrc2T2.png"]="Roblox_Project_Image.png"
    ["YrcARi.png"]="Roblox_Gallery_Image.png"
    ["Yrcr3y.png"]="Phanteum_Project_Image.png"
    ["Yrcxj8.png"]="Phanteum_Shop_Project_Image.png"
    ["Yrcy4v.png"]="Profile_Portrait.png"
    ["YrS4Sw.png"]="Default_Profile_Avatar.png"
)

# Función para hacer reemplazos en archivos
update_file() {
    local file="$1"
    echo "Actualizando $file"
    
    # Crear copia de seguridad
    cp "$file" "$file.bak"
    
    # Reemplazar dominio base
    sed -i 's|https://s6.imgcdn.dev/|https://cdn.danielcabrera.es/img/|g' "$file"
    
    # Reemplazar nombres de archivos específicos
    for old_name in "${!url_mapping[@]}"; do
        new_name="${url_mapping[$old_name]}"
        sed -i "s|$old_name|$new_name|g" "$file"
    done
    
    echo "✅ $file actualizado"
}

# Archivos a actualizar
files=(
    "src/app/api/appstore/admin/seed-native/route.ts"
    "src/lib/projects.json"
    "src/lib/about.json"
    "src/components/apps/AppStore.tsx"
    "src/components/apps/Settings.tsx"
    "src/components/ios/widgets/ProfileWidget.tsx"
)

# Actualizar cada archivo
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        update_file "$file"
    else
        echo "⚠️  Archivo no encontrado: $file"
    fi
done

echo ""
echo "🎉 Todos los archivos han sido actualizados"
echo ""
echo "📁 Archivos modificados:"
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   - $file"
    fi
done

echo ""
echo "📸 Nombres de archivos nuevos:"
for new_name in "${url_mapping[@]}"; do
    echo "   - $new_name"
done