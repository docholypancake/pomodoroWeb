# Font Assets

This folder is designated for custom font files that may be used in the Pomodoro Timer application.

## Current Font Usage

The application currently uses system fonts via the CSS font stack:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

This ensures optimal performance and native appearance across different operating systems.

## Adding Custom Fonts

If you want to add custom web fonts:

### Option 1: Google Fonts (Recommended)
Add to your HTML `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Then update CSS:
```css
--font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Option 2: Self-Hosted Fonts
1. Add font files (`.woff2`, `.woff`, `.ttf`) to this folder
2. Define @font-face in CSS:

```css
@font-face {
    font-family: 'CustomFont';
    src: url('../fonts/CustomFont.woff2') format('woff2'),
         url('../fonts/CustomFont.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

## Supported Font Formats

- **WOFF2** (recommended) - Best compression, modern browser support
- **WOFF** - Good fallback for older browsers
- **TTF/OTF** - Original formats, larger file size

## Best Practices

1. Use `font-display: swap` to prevent invisible text during font loading
2. Include only the font weights you actually use
3. Prefer WOFF2 format for smaller file sizes
4. Consider subsetting fonts to include only needed characters
5. Keep total font file size under 200KB when possible
