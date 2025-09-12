import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {

  /**
   * Format dates for display in Brazilian format (DD/MM/YYYY)
   * Handles various date formats including:
   * - Comma-separated format: "2025,9,11,3,0" (year,month,day,hour,minute)
   * - ISO format: "2025-09-11"
   * - Brazilian format: "11/09/2025"
   * - Date objects
   * - Other string formats
   * 
   * @param date - Date object, string or undefined
   * @returns Formatted date string in DD/MM/YYYY format or 'Não informado' if invalid
   */
  formatDate(date: Date | string | undefined): string {
    console.log('=== formatDate called with:', date, '===');
    
    if (!date) {
      console.log('Date is empty, returning "Não informado"');
      return 'Não informado';
    }
    
    try {
      let dateObj: Date;
      
      // If it's already a Date object, use it directly
      if (date instanceof Date) {
        dateObj = date;
      } 
      // If it's a string, try to parse it
      else if (typeof date === 'string') {
        console.log('Formatting string date:', date);
        
        // Handle the specific format: "2025,9,11,3,0" (year,month,day,hour,minute)
        if (date.includes(',')) {
          const parts = date.split(',');
          console.log('Comma-separated date parts:', parts);
          if (parts.length >= 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const day = parseInt(parts[2], 10);
            dateObj = new Date(year, month, day);
            console.log('Parsed comma-separated date:', dateObj);
          } else {
            // Fallback to regular parsing
            dateObj = new Date(date);
          }
        }
        // Handle ISO date format (YYYY-MM-DD)
        else if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
          dateObj = new Date(date);
          console.log('Parsed ISO date:', dateObj);
        }
        // Handle Brazilian date format (DD/MM/YYYY)
        else if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const parts = date.split('/');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
          console.log('Parsed Brazilian format date:', dateObj);
        }
        // Handle other formats
        else {
          dateObj = new Date(date);
          console.log('Parsed other format date:', dateObj);
        }
      } 
      // Fallback
      else {
        dateObj = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.log('Invalid date, returning "Não informado"');
        return 'Não informado';
      }
      
      // Format as DD/MM/YYYY
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1; // getMonth() is 0-indexed
      const year = dateObj.getFullYear();
      
      const dayStr = day < 10 ? '0' + day : day.toString();
      const monthStr = month < 10 ? '0' + month : month.toString();
      
      const result = `${dayStr}/${monthStr}/${year}`;
      console.log('Formatted date:', result);
      return result;
    } catch (error) {
      // If there's an error parsing, return "Não informado"
      console.error('Error formatting date:', error);
      return 'Não informado';
    }
  }
}