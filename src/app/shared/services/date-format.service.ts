import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {

  /**
   * Format dates for display in Brazilian format (DD/MM/YYYY)
   * Handles various date formats including:
   * - Comma-separated format: "2025,9,11,3,0" (year,month,day,hour,minute)
   * - ISO format with time: "2025-09-11T03:00:00.000+00:00"
   * - ISO format: "2025-09-11"
   * - Brazilian format: "11/09/2025"
   * - Date objects
   * - Other string formats
   * 
   * @param date - Date object, string or undefined
   * @returns Formatted date string in DD/MM/YYYY format or 'Não informado' if invalid
   */
  formatDate(date: Date | string | undefined): string {
    // Debug log removed
    
    if (!date) {
      // Debug log removed
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
        // Debug log removed
        
        // Handle the specific format: "2025,9,11,3,0" (year,month,day,hour,minute)
        if (date.includes(',')) {
          const parts = date.split(',');
          // Debug log removed
          if (parts.length >= 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const day = parseInt(parts[2], 10);
            dateObj = new Date(year, month, day);
            // Debug log removed
          } else {
            // Fallback to regular parsing
            dateObj = new Date(date);
          }
        }
        // Handle ISO date format with time (2025-09-11T03:00:00.000+00:00)
        else if (date.includes('T') && date.includes(':')) {
          dateObj = new Date(date);
          // Debug log removed
        }
        // Handle ISO date format (YYYY-MM-DD)
        else if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
          dateObj = new Date(date);
          // Debug log removed
        }
        // Handle Brazilian date format (DD/MM/YYYY)
        else if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const parts = date.split('/');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
          // Debug log removed
        }
        // Handle other formats
        else {
          dateObj = new Date(date);
          // Debug log removed
        }
      } 
      // Fallback
      else {
        dateObj = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        // Debug log removed
        return 'Não informado';
      }
      
      // Format as DD/MM/YYYY
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1; // getMonth() is 0-indexed
      const year = dateObj.getFullYear();
      
      const dayStr = day < 10 ? '0' + day : day.toString();
      const monthStr = month < 10 ? '0' + month : month.toString();
      
      const result = `${dayStr}/${monthStr}/${year}`;
      // Debug log removed
      return result;
    } catch (error) {
      // If there's an error parsing, return "Não informado"
      console.error('Error formatting date:', error);
      return 'Não informado';
    }
  }

  /**
   * Format dates with time for display in Brazilian format (DD/MM/YYYY HH:mm)
   * This is specifically for file upload timestamps
   * 
   * @param date - Date object, string or undefined
   * @returns Formatted date string in DD/MM/YYYY HH:mm format or 'Não informado' if invalid
   */
  formatDateTime(date: Date | string | undefined): string {
    // Debug log removed
    
    if (!date) {
      // Debug log removed
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
        // Debug log removed
        
        // Handle ISO date format with time (2025-09-11T03:00:00.000+00:00 or 2025-09-11T03:00:00)
        if (date.includes('T') && date.includes(':')) {
          dateObj = new Date(date);
          // Debug log removed
        }
        // Handle other formats by falling back to regular date parsing
        else {
          dateObj = new Date(date);
          // Debug log removed
        }
      } 
      // Fallback
      else {
        dateObj = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        // Debug log removed
        return 'Não informado';
      }
      
      // Format as DD/MM/YYYY HH:mm
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1; // getMonth() is 0-indexed
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      
      const dayStr = day < 10 ? '0' + day : day.toString();
      const monthStr = month < 10 ? '0' + month : month.toString();
      const hoursStr = hours < 10 ? '0' + hours : hours.toString();
      const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
      
      const result = `${dayStr}/${monthStr}/${year} ${hoursStr}:${minutesStr}`;
      // Debug log removed
      return result;
    } catch (error) {
      // If there's an error parsing, return "Não informado"
      console.error('Error formatting datetime:', error);
      return 'Não informado';
    }
  }
}