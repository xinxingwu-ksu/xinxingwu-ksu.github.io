let displayValue = ''; // Holds the current input or result

// Update the display with the current value
function updateDisplay() {
    document.getElementById('display').innerText = displayValue || '0';
}

// Append a number to the display and read it aloud
function appendNumber(number) {
    displayValue += number;
    updateDisplay();
    speak(number);
}

// Append an operator to the display and read it aloud
function appendOperator(operator) {
    if (displayValue && !isNaN(displayValue.slice(-1))) {
        displayValue += operator;
        updateDisplay();
        speak(operatorToText(operator)); // Convert operator to a readable format
    }
}

// Clear the display and read "Cleared" aloud
function clearDisplay() {
    displayValue = '';
    updateDisplay();
    speak("Cleared");
}

// Calculate the result, update the display, and read the result aloud
function calculateResult() {
    try {
        displayValue = eval(displayValue).toString();
        speak("The result is " + displayValue);
    } catch (error) {
        displayValue = 'Error';
        speak("Error");
    }
    updateDisplay();
}

// Text-to-speech function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

// Convert operators to readable words for speech
function operatorToText(operator) {
    switch(operator) {
        case '/': return "divided by";
        case '*': return "multiplied by";
        case '-': return "minus";
        case '+': return "plus";
        default: return operator;
    }
}
