/**
 * Color conversion utilities for HSV, RGB, and Hex color spaces
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/**
 * Convert RGB to Hex
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Convert Hex to RGB
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const v = max;

  if (diff !== 0) {
    s = diff / max;

    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0;
  let g = 0;
  let b = 0;

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert Hex to HSV
 */
export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex));
}

/**
 * Convert HSV to Hex
 */
export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

/**
 * Get pure hue color (saturation=100, value=100) as RGB for a given hue
 */
export function getHueColor(hue: number): string {
  const rgb = hsvToRgb({ h: hue, s: 100, v: 100 });
  return rgbToHex(rgb);
}

/**
 * Calculate relative luminance of a color (0-1)
 * Uses the WCAG formula for relative luminance
 * @param color - Hex color code
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function calculateLuminance(color: string): number {
  // Parse hex color
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Get appropriate text color (black or white) based on background color
 * @param backgroundColor - Hex color code of the background
 * @returns '#000000' for dark text or '#ffffff' for light text
 */
export function getContrastTextColor(backgroundColor: string): string {
  const luminance = calculateLuminance(backgroundColor);
  // Threshold of 0.5 works well for most cases
  // Light backgrounds get dark text, dark backgrounds get light text
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

