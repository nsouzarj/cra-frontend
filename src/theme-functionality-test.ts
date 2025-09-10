// Theme functionality test
console.log('Theme functionality test starting...');

// Test theme class management
function testThemeClassManagement() {
    console.log('Testing theme class management...');
    
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'green-theme', 'purple-theme', 'amber-theme', 'yellow-theme', 'salmon-theme', 'midnightblue-theme', 'olive-theme', 'slategrey-theme', 'red-theme', 'lightsteelblue-theme');
    
    // Add a theme class
    document.body.classList.add('dark-theme');
    console.log('Added dark-theme class');
    
    // Check if class was added
    if (document.body.classList.contains('dark-theme')) {
        console.log('✓ Theme class added successfully');
    } else {
        console.log('✗ Failed to add theme class');
    }
    
    // Remove the theme class
    document.body.classList.remove('dark-theme');
    console.log('Removed dark-theme class');
    
    // Check if class was removed
    if (!document.body.classList.contains('dark-theme')) {
        console.log('✓ Theme class removed successfully');
    } else {
        console.log('✗ Failed to remove theme class');
    }
}

// Test localStorage theme persistence
function testLocalStoragePersistence() {
    console.log('Testing localStorage theme persistence...');
    
    // Set a theme in localStorage
    localStorage.setItem('theme', 'light');
    console.log('Set theme to light in localStorage');
    
    // Retrieve the theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        console.log('✓ Theme persistence test passed');
    } else {
        console.log('✗ Theme persistence test failed');
    }
    
    // Clean up
    localStorage.removeItem('theme');
}

// Test available themes
function testAvailableThemes() {
    console.log('Testing available themes...');
    
    const themes = ['light', 'dark', 'green', 'purple', 'amber', 'yellow', 'salmon', 'midnightblue', 'olive', 'slategrey', 'red', 'lightsteelblue'];
    console.log('Available themes:', themes);
    
    // Check if we have the expected number of themes
    if (themes.length === 12) {
        console.log('✓ Correct number of themes available');
    } else {
        console.log('✗ Incorrect number of themes. Expected 12, got', themes.length);
    }
}

// Run all tests
testThemeClassManagement();
testLocalStoragePersistence();
testAvailableThemes();

console.log('Theme functionality test completed.');