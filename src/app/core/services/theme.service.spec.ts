import { ThemeService, Theme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageMock: any;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: jasmine.createSpy('getItem'),
      setItem: jasmine.createSpy('setItem')
    };
    
    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageMock.getItem(key));
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => localStorageMock.setItem(key, value));
    
    // Mock document.body.classList
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');
    
    service = new ThemeService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get theme correctly', () => {
    const theme: Theme = 'blue';
    service.setTheme(theme);
    expect(service.getCurrentTheme()).toBe(theme);
  });

  it('should get available themes', () => {
    const themes = service.getAvailableThemes();
    expect(themes.length).toBe(5);
    expect(themes[0].value).toBe('light');
    expect(themes[1].value).toBe('dark');
    expect(themes[2].value).toBe('blue');
    expect(themes[3].value).toBe('green');
    expect(themes[4].value).toBe('purple');
  });

  it('should apply theme correctly', () => {
    service.setTheme('blue');
    expect(document.body.classList.remove).toHaveBeenCalledWith('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme');
    expect(document.body.classList.add).toHaveBeenCalledWith('blue-theme');
  });
});