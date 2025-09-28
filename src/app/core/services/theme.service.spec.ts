import { ThemeService, Theme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    // Mock localStorage
    spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'setItem');
    
    // Mock document.body.classList
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');
    
    service = new ThemeService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get theme correctly', () => {
    const theme: Theme = 'green';
    service.setTheme(theme);
    expect(service.getCurrentTheme()).toBe(theme);
  });

  it('should get available themes', () => {
    const themes = service.getAvailableThemes();
    expect(themes.length).toBe(12); // Updated to 12 themes
    expect(themes[0].value).toBe('light');
    expect(themes[1].value).toBe('dark');
    expect(themes[2].value).toBe('green');
    expect(themes[3].value).toBe('purple');
  });

  it('should apply theme correctly', () => {
    service.setTheme('green');
    expect(document.body.classList.remove).toHaveBeenCalledWith('light-theme', 'dark-theme', 'green-theme', 'purple-theme', 'amber-theme', 'yellow-theme', 'salmon-theme', 'midnightblue-theme', 'olive-theme', 'slategrey-theme', 'red-theme', 'lightsteelblue-theme');
    expect(document.body.classList.add).toHaveBeenCalledWith('green-theme');
  });
});