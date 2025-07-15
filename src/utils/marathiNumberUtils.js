// Marathi number conversion utilities
// This file contains functions to handle Marathi number conversion for PDF generation

const marathiToEnglish = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

const englishToMarathi = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

// Check if a string contains Marathi numbers
export function containsMarathiNumbers(str) {
  if (!str || typeof str !== 'string') return false;
  return /[०-९]/.test(str);
}

// Convert Marathi numbers to English numbers
export function convertMarathiToEnglish(str) {
  if (!str || typeof str !== 'string') return str;
  if (!containsMarathiNumbers(str)) return str;
  
  return str.split('').map(char => marathiToEnglish[char] || char).join('');
}

// Convert English numbers to Marathi numbers
export function convertEnglishToMarathi(str) {
  if (!str || typeof str !== 'string') return str;
  
  return str.split('').map(char => englishToMarathi[char] || char).join('');
}

// Extract numeric value from string (handles both English and Marathi numbers)
export function extractNumericValue(str) {
  if (!str) return 0;
  
  const strValue = String(str);
  let processedStr = strValue;
  
  // Convert Marathi numbers to English if present
  if (containsMarathiNumbers(strValue)) {
    processedStr = convertMarathiToEnglish(strValue);
  }
  
  // Extract numbers and decimal points
  const numericStr = processedStr.replace(/[^\d.]/g, '');
  return Number(numericStr) || 0;
}

// Convert final result to Marathi if any input was in Marathi
export function convertToMarathiIfNeeded(value, items, fieldsToCheck = []) {
  const strValue = String(value);
  
  // Check if any of the input values were in Marathi to determine output format
  const hasMarathiInput = items.some(item => 
    fieldsToCheck.some(field => containsMarathiNumbers(item[field]))
  );
  
  return hasMarathiInput ? convertEnglishToMarathi(strValue) : strValue;
}

// Parse float with Marathi number support
export function parseFloatWithMarathi(value) {
  if (!value) return 0;
  return extractNumericValue(value);
} 