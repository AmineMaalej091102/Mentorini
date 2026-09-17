/**
 * Utilities for YouTube embedding, WhatsApp deep-linking, and Bio link parsing
 */

/**
 * Extracts a standard YouTube video ID from various formats
 * (watch?v=, youtu.be/, shorts/, embed/)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  
  // Direct ID check (if user just pasted an 11-char ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube regex patterns
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    /^([\w-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Cleans Tunisian and international phone numbers into wa.me format
 * Ensures default +216 prefix if user entered 8 digits like 98123456 or 55123456
 */
export function cleanWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // If user entered 8 digits (typical Tunisian mobile number e.g. 98123456, 22123456)
  if (cleaned.length === 8) {
    cleaned = '216' + cleaned;
  }
  
  // If user entered 00216...
  if (cleaned.startsWith('00216')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Builds a direct native WhatsApp deep-link with a pre-filled Arabizi greeting
 */
export function buildWhatsAppLink(
  phoneNumber: string,
  mentorName: string,
  topic: string
): string {
  const cleanPhone = cleanWhatsAppNumber(phoneNumber);
  const message = `3aslema ${mentorName}! 👋 Choft l-video mte3ek 3la Mentorini mta3 "${topic}". 3andi sou2el w 7abit nestachirek ken ma y9al9ekch!`;
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Detects URLs inside freeform bio text and renders them safely
 */
export function parseBioWithLinks(text: string): Array<{ type: 'text' | 'link'; content: string; url?: string }> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
  
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const url = match[0];

    if (start > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, start),
      });
    }

    parts.push({
      type: 'link',
      content: url,
      url: url,
    });

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts;
}
