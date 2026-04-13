export function getSubjectColorCode(subject) {
  if (!subject) return { bg: 'white', border: '#e0e0e0' }; // fallback

  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  
  return {
    bg: `hsl(${hue}, 85%, 97%)`,
    border: `hsl(${hue}, 70%, 50%)`
  };
}
