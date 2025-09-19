# Weather Assets

This folder contains weather-related images used by the weather API system.

## Weather Images

### Clear Sky
- `sunny.png` - Clear sky (weather code 0)

### Cloudy Conditions
- `pcloudy.png` - Partly cloudy (weather codes 1, 2, 3)
- `mcloudy.png` - Mostly cloudy (default fallback)

### Fog
- `Foggy.png` - Fog conditions (weather codes 45, 48)

### Rain
- `Lrain.png` - Light rain/drizzle (weather codes 51, 53, 55)
- `Rain.png` - Rain (weather codes 61, 63, 65, 80, 81, 82)

### Freezing Conditions
- `Sleet.png` - Freezing drizzle/rain (weather codes 56, 57, 66, 67)

### Snow
- `Snow.png` - Snow (weather codes 71, 73, 75, 77, 85, 86)

### Thunderstorm
- `TStorm.png` - Thunderstorm (weather codes 95, 96, 99)

## Usage

These images are automatically selected based on the weather code returned by the Open-Meteo API. The weather system maps weather codes to appropriate images and returns the full path (e.g., `assets/sunny.png`).

## Image Requirements

- Format: PNG
- Recommended size: 64x64 pixels or 128x128 pixels
- Transparent background preferred
- Clear, recognizable weather icons

## Adding Images

To add actual weather images:

1. Replace the placeholder files with actual PNG images
2. Ensure filenames match exactly (case-sensitive)
3. Test the weather API to verify images are returned correctly

## Weather Code Mapping

| Weather Code | Condition | Image |
|-------------|-----------|-------|
| 0 | Clear sky | sunny.png |
| 1, 2, 3 | Cloudy | pcloudy.png |
| 45, 48 | Fog | Foggy.png |
| 51, 53, 55 | Drizzle | Lrain.png |
| 56, 57 | Freezing drizzle | Sleet.png |
| 61, 63, 65 | Rain | Rain.png |
| 66, 67 | Freezing rain | Sleet.png |
| 71, 73, 75, 77 | Snow | Snow.png |
| 80, 81, 82 | Rain showers | Rain.png |
| 85, 86 | Snow showers | Snow.png |
| 95, 96, 99 | Thunderstorm | TStorm.png |
| Unknown | Default | mcloudy.png |
