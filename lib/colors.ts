export const AMONG_US_COLORS = [
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Yellow', hex: '#CA8A04' },
  { name: 'Black', hex: '#0F172A' },
  { name: 'White', hex: '#8B9DAF' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Banana', hex: '#FACC15' },
  { name: 'Gray', hex: '#475569' },
  { name: 'Tan', hex: '#854D0E' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Crimson', hex: '#991B1B' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Olive', hex: '#4D7C0F' },
  { name: 'Magenta', hex: '#C026D3' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Silver', hex: '#A1A1AA' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Plum', hex: '#6B21A8' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Salmon', hex: '#FB923C' },
  { name: 'Mint', hex: '#10B981' },
  { name: 'Azure', hex: '#0284C7' }
];

export function getPlayerColor(playerToken: string | null) {
  if (!playerToken) return AMONG_US_COLORS[0];
  // token format: 00000000-0000-0000-0000-0000000000XX
  const badgeNumStr = playerToken.slice(-2);
  const badgeNum = parseInt(badgeNumStr, 10);
  
  if (isNaN(badgeNum) || badgeNum < 1) {
    return AMONG_US_COLORS[0];
  }
  
  // badge 1 is index 0
  const index = (badgeNum - 1) % AMONG_US_COLORS.length;
  return AMONG_US_COLORS[index];
}
