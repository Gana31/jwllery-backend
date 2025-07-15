// Test file for Marathi number conversion
// This file tests the Marathi number conversion functionality

import { extractNumericValue, convertToMarathiIfNeeded, containsMarathiNumbers, convertMarathiToEnglish, convertEnglishToMarathi } from './src/utils/marathiNumberUtils.js';

// Test data with Marathi numbers
const testItems = [
  {
    count: '२',
    totalWeight: '१०.५',
    pureWeight: '८.३',
    estimatedValue: '१५०००',
    sanctionedValue: '१२०००'
  },
  {
    count: '१',
    totalWeight: '५.२',
    pureWeight: '४.१',
    estimatedValue: '८०००',
    sanctionedValue: '६५००'
  }
];

const testItemsEnglish = [
  {
    count: '2',
    totalWeight: '10.5',
    pureWeight: '8.3',
    estimatedValue: '15000',
    sanctionedValue: '12000'
  },
  {
    count: '1',
    totalWeight: '5.2',
    pureWeight: '4.1',
    estimatedValue: '8000',
    sanctionedValue: '6500'
  }
];

// Test functions
function testMarathiNumberConversion() {
  console.log('=== Testing Marathi Number Conversion ===\n');

  // Test 1: Check if Marathi numbers are detected
  console.log('Test 1: Marathi number detection');
  console.log('Contains Marathi numbers:', containsMarathiNumbers('१२३'));
  console.log('Contains Marathi numbers:', containsMarathiNumbers('123'));
  console.log('Contains Marathi numbers:', containsMarathiNumbers('abc'));
  console.log('');

  // Test 2: Convert Marathi to English
  console.log('Test 2: Marathi to English conversion');
  console.log('१२३ ->', convertMarathiToEnglish('१२३'));
  console.log('१०.५ ->', convertMarathiToEnglish('१०.५'));
  console.log('');

  // Test 3: Convert English to Marathi
  console.log('Test 3: English to Marathi conversion');
  console.log('123 ->', convertEnglishToMarathi('123'));
  console.log('10.5 ->', convertEnglishToMarathi('10.5'));
  console.log('');

  // Test 4: Extract numeric values
  console.log('Test 4: Extract numeric values');
  console.log('१२३ ->', extractNumericValue('१२३'));
  console.log('१०.५ ->', extractNumericValue('१०.५'));
  console.log('123 ->', extractNumericValue('123'));
  console.log('10.5 ->', extractNumericValue('10.5'));
  console.log('');

  // Test 5: Calculate totals with Marathi numbers
  console.log('Test 5: Calculate totals with Marathi numbers');
  const totalCount = testItems.reduce((sum, item) => sum + extractNumericValue(item.count), 0);
  const totalWeight = testItems.reduce((sum, item) => sum + extractNumericValue(item.totalWeight), 0);
  const totalEstimated = testItems.reduce((sum, item) => sum + extractNumericValue(item.estimatedValue), 0);
  
  console.log('Total count (raw):', totalCount);
  console.log('Total weight (raw):', totalWeight);
  console.log('Total estimated (raw):', totalEstimated);
  console.log('');

  // Test 6: Convert results to Marathi
  console.log('Test 6: Convert results to Marathi');
  const fieldsToCheck = ['count', 'totalWeight', 'pureWeight', 'estimatedValue', 'sanctionedValue'];
  
  console.log('Total count (Marathi):', convertToMarathiIfNeeded(totalCount, testItems, fieldsToCheck));
  console.log('Total weight (Marathi):', convertToMarathiIfNeeded(totalWeight, testItems, fieldsToCheck));
  console.log('Total estimated (Marathi):', convertToMarathiIfNeeded(totalEstimated, testItems, fieldsToCheck));
  console.log('');

  // Test 7: Test with English numbers (should stay English)
  console.log('Test 7: Test with English numbers (should stay English)');
  const totalCountEnglish = testItemsEnglish.reduce((sum, item) => sum + extractNumericValue(item.count), 0);
  const totalWeightEnglish = testItemsEnglish.reduce((sum, item) => sum + extractNumericValue(item.totalWeight), 0);
  
  console.log('Total count (English):', convertToMarathiIfNeeded(totalCountEnglish, testItemsEnglish, fieldsToCheck));
  console.log('Total weight (English):', convertToMarathiIfNeeded(totalWeightEnglish, testItemsEnglish, fieldsToCheck));
  console.log('');

  console.log('=== All tests completed ===');
}

// Run the test
testMarathiNumberConversion(); 