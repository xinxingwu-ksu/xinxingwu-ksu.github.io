// Define the main function for counter functionality
function setupCounter() {
  // Select all buttons with the class 'counterBtn'
  const buttons = document.querySelectorAll('.counterBtn');
  
  // Initialize the counter variable
  let count = 0;

  // Add event listeners to each button
  for (let i = 0; i < buttons.length; i++) {
    // Each button will get a click event listener
    buttons[i].addEventListener('click', function() {
      
      // Check if the button clicked is 'prevBtn' (decrease the count) or 'nextBtn' (increase the count)
      if (buttons[i].classList.contains('prevBtn')) {
        count=count-1; // Decrease the counter
      } else if (buttons[i].classList.contains('nextBtn')) {
        count=count+1; // Increase the counter
      }

      // Select the counter text (where the count will be displayed)
      const counter = document.querySelector('#counter');
      counter.textContent = count; // Update the counter text with the current count

      // Change the color of the counter based on the value of count
      if (count < 0) {
        counter.style.color = 'red'; // If negative, make the counter text red
      } else if (count > 0) {
        counter.style.color = 'green'; // If positive, make the counter text green
      } else {
        counter.style.color = '#333333'; // If count is 0, set color to default grey
      }
    });
  }
}

// Call the function to set up the counter
setupCounter();
