// Test function to verify date formatting
function testDateFormat(dateString: string | undefined): string {
  console.log('=== testDateFormat called with:', dateString, '===');
  
  if (!dateString) {
    console.log('Date string is empty, returning "Não informado"');
    return 'Não informado';
  }
  
  try {
    console.log('Formatting date:', dateString);
    
    // Handle the specific format: "2025,9,11,3,0" (year,month,day,hour,minute)
    if (dateString.includes(',')) {
      const parts = dateString.split(',');
      console.log('Comma-separated date parts:', parts);
      if (parts.length >= 3) {
        const year = parts[0];
        // Use a more compatible approach for padding
        const month = parts[1].length === 1 ? '0' + parts[1] : parts[1];
        const day = parts[2].length === 1 ? '0' + parts[2] : parts[2];
        const result = `${day}/${month}/${year}`;
        console.log('Formatted comma-separated date:', result);
        return result;
      }
    }
    
    // Handle ISO date format (YYYY-MM-DD)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      const result = `${day}/${month}/${year}`;
      console.log('Formatted ISO date:', result);
      return result;
    }
    
    // Handle Brazilian date format (DD/MM/YYYY)
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      console.log('Date is already in Brazilian format:', dateString);
      return dateString;
    }
    
    // Handle other common formats
    // Try to parse the date string
    const date = new Date(dateString);
    console.log('Parsed date object:', date);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      // If not a valid date, return the original string
      console.log('Invalid date, returning original string:', dateString);
      return dateString;
    }
    
    // Format as DD/MM/YYYY using a more compatible approach
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const dayStr = day < 10 ? '0' + day : day.toString();
    const monthStr = month < 10 ? '0' + month : month.toString();
    
    const result = `${dayStr}/${monthStr}/${year}`;
    console.log('Formatted parsed date:', result);
    return result;
  } catch (error) {
    // If there's an error parsing, return the original string
    console.error('Error formatting date:', error);
    return dateString;
  }
}

// Run tests
console.log('=== Running date format tests ===');

// Test the specific format mentioned
const testDate1 = '2025,9,11,3,0';
console.log('Test 1 - Input:', testDate1, 'Output:', testDateFormat(testDate1));

// Test standard ISO format
const testDate2 = '2025-09-11';
console.log('Test 2 - Input:', testDate2, 'Output:', testDateFormat(testDate2));

// Test Brazilian format
const testDate3 = '11/09/2025';
console.log('Test 3 - Input:', testDate3, 'Output:', testDateFormat(testDate3));

// Test another comma-separated format
const testDate4 = '2025,12,3,15,30';
console.log('Test 4 - Input:', testDate4, 'Output:', testDateFormat(testDate4));

console.log('=== End of date format tests ===');