# PWA Icon Generator - Detailed Guide

## Overview

This script automatically generates all required PWA icon sizes from a single source image. It uses the `sharp` library for high-quality image resizing.

## Requirements

- **Source Image**: 512x512 PNG file (recommended) with transparent background
- **Node.js**: Already installed
- **sharp**: Automatically installed by script if not present

## Generated Icon Sizes

The script generates 8 icon sizes required for PWA compliance:

| Size | Purpose | Devices |
|------|---------|---------|
| 72×72 | Small icon | Low-res devices, notifications |
| 96×96 | Small icon | Standard mobile |
| 128×128 | Medium icon | Tablets |
| 144×144 | Medium icon | High-res mobile |
| 152×152 | iOS icon | iPad |
| 192×192 | Large icon | Android home screen |
| 384×384 | Extra large | High-res displays |
| 512×512 | Splash screen | PWA splash, app stores |

## Usage

### Basic Usage

```powershell
# Generate icons from default source (public/icon-512.png)
.\scripts\generate-pwa-icons.ps1
```

### Custom Source Image

```powershell
# Generate icons from custom source
.\scripts\generate-pwa-icons.ps1 -SourceImage "path\to\your\icon.png"
```

### Custom Output Directory

```powershell
# Generate icons to custom directory
.\scripts\generate-pwa-icons.ps1 -SourceImage "source.png" -OutputDir "public\pwa-icons"
```

## Step-by-Step Guide

### 1. Prepare Source Image

Create a high-quality source image:

- **Size**: 512×512 pixels (minimum)
- **Format**: PNG with transparency
- **Content**: Your app logo/icon centered
- **Padding**: Leave ~10% padding around edges
- **Background**: Transparent (for best results)

**Recommended tools:**
- Figma
- Adobe Illustrator
- Canva
- GIMP (free)

### 2. Place Source Image

Save your source image as:
```
public/icon-512.png
```

Or use any path and specify with `-SourceImage` parameter.

### 3. Run Script

Open PowerShell in project root:

```powershell
# Run with default settings
.\scripts\generate-pwa-icons.ps1
```

### 4. Verify Output

Check generated icons in `public/icons/` directory:

```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

### 5. Test PWA Installation

1. Deploy to Vercel
2. Open on mobile device
3. Look for "Add to Home Screen" prompt
4. Verify icon appears correctly after installation

## What the Script Does

1. ✅ **Checks for source image** - Validates source file exists
2. ✅ **Installs sharp** - Automatically installs if not present
3. ✅ **Creates output directory** - Creates `public/icons/` if needed
4. ✅ **Generates 8 icon sizes** - Resizes source to all required dimensions
5. ✅ **Updates manifest.json** - Automatically adds icon entries
6. ✅ **Preserves transparency** - Maintains transparent backgrounds
7. ✅ **Optimizes quality** - Uses high-quality PNG compression

## Manifest.json Integration

The script automatically updates `public/manifest.json` with icon entries:

```json
{
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    }
    // ... all other sizes
  ]
}
```

### Purpose Attribute

- **`any`**: Standard icons displayed in normal contexts
- **`maskable`**: Icons that can be masked to different shapes (circles, rounded squares) on Android

## Design Best Practices

### Icon Design Tips

1. **Simple & Bold**: Icons should be recognizable at small sizes
2. **High Contrast**: Ensure visibility on various backgrounds
3. **Centered**: Leave padding around edges (safe zone)
4. **No Text**: Avoid small text (becomes unreadable at small sizes)
5. **Consistent Branding**: Use your brand colors

### Safe Zone

Leave padding around your icon content:
- **10-15% padding** recommended
- Example: For 512×512 icon, keep important content within 410×410 center area

### Color Considerations

- **Light Mode**: Icon should work on white backgrounds
- **Dark Mode**: Icon should work on dark backgrounds
- **Transparency**: Use transparent background for flexibility

## Troubleshooting

### Error: Source image not found

```
❌ Source image not found: public\icon-512.png
```

**Solution**: Create or specify correct source image path:
```powershell
.\scripts\generate-pwa-icons.ps1 -SourceImage "path\to\icon.png"
```

### Error: Failed to install sharp

```
❌ Failed to install sharp
```

**Solution**: Install manually:
```powershell
npm install --save-dev sharp
```

### Error: Icon generation failed

**Possible causes:**
- Source image is corrupted
- Insufficient disk space
- File permissions issue

**Solution**: Verify source image opens correctly, check disk space, run PowerShell as administrator.

### Icons look blurry

**Solution**: Use higher resolution source image (1024×1024 recommended for best quality)

### Transparent background becomes white

**Solution**: Ensure source image has true transparency (alpha channel). Re-export from design tool with transparency enabled.

## Advanced Usage

### Batch Processing

Generate icons for multiple projects:

```powershell
# Loop through projects
$projects = @("app1", "app2", "app3")
foreach ($project in $projects) {
    .\scripts\generate-pwa-icons.ps1 `
        -SourceImage "sources\$project-icon.png" `
        -OutputDir "public\$project\icons"
}
```

### Custom Sizes

Modify `$sizes` array in script for custom dimensions:

```powershell
# Edit generate-pwa-icons.ps1
$sizes = @(72, 96, 128, 144, 152, 192, 256, 384, 512, 1024)
```

### Different Formats

Modify Node.js script section to generate WebP or AVIF:

```javascript
await sharp(sourceImage)
    .resize(size, size)
    .webp({ quality: 90 })
    .toFile(outputPath.replace('.png', '.webp'));
```

## Performance Considerations

### Sharp vs ImageMagick

- ✅ **Sharp**: Faster, better quality, Node.js native
- ⚠️ **ImageMagick**: Slower, requires separate installation

This script uses **sharp** for best results.

### Generation Time

- **8 icons**: ~2-5 seconds
- **Depends on**: Source image size, CPU speed

## Integration with CI/CD

### GitHub Actions

```yaml
name: Generate PWA Icons
on:
  push:
    paths:
      - 'public/icon-512.png'

jobs:
  generate-icons:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install sharp
      - run: pwsh ./scripts/generate-pwa-icons.ps1
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: regenerate PWA icons"
```

### Vercel Build

Add to `package.json`:

```json
{
  "scripts": {
    "build": "pwsh ./scripts/generate-pwa-icons.ps1 && next build"
  }
}
```

## Testing Checklist

After generating icons:

- [ ] **Visual Inspection**: Open each icon file, verify quality
- [ ] **Manifest Validation**: Check manifest.json has all icon entries
- [ ] **PWA Lighthouse Test**: Run Lighthouse audit, check PWA score
- [ ] **Mobile Testing**: Install PWA on Android device, check home screen icon
- [ ] **iOS Testing**: Install PWA on iPhone, check home screen icon
- [ ] **Different Screens**: Test on various screen densities (1x, 2x, 3x)
- [ ] **Background Colors**: Test icon on light and dark backgrounds
- [ ] **Shape Masking**: On Android, verify icon masks correctly (circle, rounded square)

## Example Output

```
🎨 Swaply PWA Icon Generator
==================================================
📁 Source image: public\icon-512.png
✅ Sharp is already installed

🖼️  Generating icons...
Processing public\icon-512.png...
✅ Generated: public\icons\icon-72x72.png
✅ Generated: public\icons\icon-96x96.png
✅ Generated: public\icons\icon-128x128.png
✅ Generated: public\icons\icon-144x144.png
✅ Generated: public\icons\icon-152x152.png
✅ Generated: public\icons\icon-192x192.png
✅ Generated: public\icons\icon-384x384.png
✅ Generated: public\icons\icon-512x512.png

✅ All icons generated successfully!

📱 Updating manifest.json...
✅ Manifest.json updated with 8 icon sizes

==================================================
🎉 PWA Icon Generation Complete!

Generated icons:
  • public\icons\icon-72x72.png
  • public\icons\icon-96x96.png
  • public\icons\icon-128x128.png
  • public\icons\icon-144x144.png
  • public\icons\icon-152x152.png
  • public\icons\icon-192x192.png
  • public\icons\icon-384x384.png
  • public\icons\icon-512x512.png

📋 Next steps:
  1. Verify icons in public\icons directory
  2. Test PWA installation on mobile devices
  3. Check manifest.json for correct icon paths
```

## Resources

- [PWA Icon Requirements](https://web.dev/add-manifest/#icons)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Maskable Icon Editor](https://maskable.app/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) (alternative tool)

---

**Status**: ✅ Ready to use
**Estimated Run Time**: 2-5 seconds
**Maintenance**: Re-run when icon design changes
