export const semanticColours = [
  { name: "Canvas", token: "--color-bg-canvas", value: "#F1F5F9", foreground: "#0F172A" },
  { name: "Raised", token: "--color-bg-raised", value: "#FFFFFF", foreground: "#0F172A" },
  { name: "Primary action", token: "--color-action-primary", value: "#2563EB", foreground: "#FFFFFF" },
  { name: "Success", token: "--color-feedback-success", value: "#15803D", foreground: "#FFFFFF" },
  { name: "Warning", token: "--color-feedback-warning", value: "#C2410C", foreground: "#FFFFFF" },
  { name: "Error", token: "--color-feedback-error", value: "#B91C1C", foreground: "#FFFFFF" }
] as const;

export const typographyTokens = [
  ["Display", "36px", "44px", "700"],
  ["Heading 1", "30px", "38px", "700"],
  ["Heading 2", "24px", "32px", "700"],
  ["Heading 3", "20px", "28px", "650"],
  ["Body large", "18px", "28px", "400"],
  ["Body", "16px", "25px", "400"],
  ["Body small", "14px", "21px", "400"],
  ["Label", "14px", "20px", "600"],
  ["Caption", "13px", "18px", "500"]
] as const;

export const spacingTokens = [
  ["0", "0"],
  ["1", "4px"],
  ["2", "8px"],
  ["3", "12px"],
  ["4", "16px"],
  ["5", "20px"],
  ["6", "24px"],
  ["8", "32px"],
  ["10", "40px"],
  ["12", "48px"],
  ["16", "64px"],
  ["20", "80px"]
] as const;

export const radiusTokens = [
  ["sm", "8px"],
  ["md", "12px"],
  ["lg", "16px"],
  ["xl", "20px"],
  ["2xl", "24px"],
  ["pill", "9999px"]
] as const;

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function passesAaForNormalText(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}
