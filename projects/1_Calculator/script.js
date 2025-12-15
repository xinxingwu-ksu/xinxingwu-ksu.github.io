let displayValue = ''; // Holds the current input or result

// Update the display with the current value
function updateDisplay() {
    document.getElementById('display').innerText = displayValue || '0';
}

// Append a number to the display
function appendNumber(number) {
    displayValue += number;
    updateDisplay();
}

// Append an operator to the display
function appendOperator(operator) {
    // Prevent multiple operators in a row
    if (displayValue && !isNaN(displayValue.slice(-1))) {
        displayValue += operator;
        updateDisplay();
    }
}

// Clear the display
function clearDisplay() {
    displayValue = '';
    updateDisplay();
}

// Calculate the result of the expression
function calculateResult() {
    try {
        displayValue = eval(displayValue).toString();
    } catch (error) {
        displayValue = 'Error';
    }
    updateDisplay();
}
