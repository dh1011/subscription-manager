const iconColors = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Medium Turquoise
  '#45B7D1', // Bright Cerulean
  '#FFA07A', // Light Salmon
  '#98D8C8', // Pale Robin Egg Blue
  '#F7DC6F', // Mellow Yellow
  '#82E0AA', // Light Green
  '#D7BDE2', // Lavender
  '#F9E79F', // Pale Goldenrod
  '#F1948A', // Light Coral
];

export function getRandomColor() {
  return iconColors[Math.floor(Math.random() * iconColors.length)];
}
