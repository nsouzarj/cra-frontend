import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor() { }

  // Custom validators
  static cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const cpf = control.value.replace(/\D/g, '');
      if (cpf.length !== 11) return { cpfInvalid: true };
      
      // Check for known invalid patterns
      if (/^(\d)\1{10}$/.test(cpf)) return { cpfInvalid: true };
      
      // Validate CPF algorithm
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      
      let digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cpf.charAt(9))) return { cpfInvalid: true };
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      
      digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cpf.charAt(10))) return { cpfInvalid: true };
      
      return null;
    };
  }

  static cnpjValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const cnpj = control.value.replace(/\D/g, '');
      if (cnpj.length !== 14) return { cnpjInvalid: true };
      
      // Check for known invalid patterns
      if (/^(\d)\1{13}$/.test(cnpj)) return { cnpjInvalid: true };
      
      // Validate CNPJ algorithm
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights1[i];
      }
      
      let digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cnpj.charAt(12))) return { cnpjInvalid: true };
      
      sum = 0;
      for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights2[i];
      }
      
      digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cnpj.charAt(13))) return { cnpjInvalid: true };
      
      return null;
    };
  }

  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phone = control.value.replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 11) {
        return { phoneInvalid: true };
      }
      
      return null;
    };
  }

  static passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const password = control.value;
      const errors: any = {};
      
      if (password.length < 8) {
        errors.minLength = true;
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.requiresUppercase = true;
      }
      
      if (!/[a-z]/.test(password)) {
        errors.requiresLowercase = true;
      }
      
      if (!/\d/.test(password)) {
        errors.requiresNumber = true;
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.requiresSpecial = true;
      }
      
      return Object.keys(errors).length ? { passwordStrength: errors } : null;
    };
  }

  static processNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const processNumber = control.value.replace(/\D/g, '');
      
      // Basic validation for Brazilian process number format
      // Should have 20 digits in format: NNNNNNN-DD.AAAA.J.TR.OOOO
      if (processNumber.length !== 20) {
        return { processNumberInvalid: true };
      }
      
      return null;
    };
  }

  static dateRangeValidator(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;
      
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return { dateRangeInvalid: true };
      }
      
      return null;
    };
  }

  // Error message helpers
  getErrorMessage(fieldName: string, control: AbstractControl): string {
    if (control.hasError('required')) {
      return `${fieldName} é obrigatório`;
    }
    
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    
    if (control.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `${fieldName} deve ter pelo menos ${requiredLength} caracteres`;
    }
    
    if (control.hasError('maxlength')) {
      const requiredLength = control.getError('maxlength').requiredLength;
      return `${fieldName} deve ter no máximo ${requiredLength} caracteres`;
    }
    
    if (control.hasError('min')) {
      const min = control.getError('min').min;
      return `Valor mínimo é ${min}`;
    }
    
    if (control.hasError('max')) {
      const max = control.getError('max').max;
      return `Valor máximo é ${max}`;
    }
    
    if (control.hasError('cpfInvalid')) {
      return 'CPF inválido';
    }
    
    if (control.hasError('cnpjInvalid')) {
      return 'CNPJ inválido';
    }
    
    if (control.hasError('phoneInvalid')) {
      return 'Telefone inválido';
    }
    
    if (control.hasError('processNumberInvalid')) {
      return 'Número do processo inválido';
    }
    
    if (control.hasError('passwordStrength')) {
      const errors = control.getError('passwordStrength');
      const messages = [];
      
      if (errors.minLength) messages.push('mínimo 8 caracteres');
      if (errors.requiresUppercase) messages.push('letra maiúscula');
      if (errors.requiresLowercase) messages.push('letra minúscula');
      if (errors.requiresNumber) messages.push('número');
      if (errors.requiresSpecial) messages.push('caractere especial');
      
      return `Senha deve conter: ${messages.join(', ')}`;
    }
    
    if (control.hasError('dateRangeInvalid')) {
      return 'Data inicial não pode ser posterior à data final';
    }
    
    return 'Campo inválido';
  }

  // Form validation helper
  markFormGroupTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control && typeof control === 'object' && control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Check if form has any errors
  hasFormErrors(formGroup: any): boolean {
    return formGroup.invalid && formGroup.touched;
  }

  // Get all form errors
  getFormErrors(formGroup: any): string[] {
    const errors: string[] = [];
    
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control && control.errors && control.touched) {
        errors.push(this.getErrorMessage(key, control));
      }
    });
    
    return errors;
  }

  // Format helpers for Brazilian standards
  formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }

  formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}