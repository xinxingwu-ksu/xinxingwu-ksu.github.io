function handleCreateClick(event) {
  event.preventDefault();
  
  // Update business card with input values
  document.getElementById("name").textContent = document.getElementById("InputName").value;
  //document.getElementById("name").innerHTML = document.getElementById("InputName").value;
  document.getElementById("job-title").textContent = document.getElementById("InputJob").value;
  document.getElementById("phone").textContent = document.getElementById("InputPhone").value;
  document.getElementById("email").textContent = document.getElementById("InputMail").value;
  
  // Update mailto link Not work
  //document.getElementById("email-link").setAttribute("href", "mailto:" + document.getElementById("InputMail").value);
    // Update both the text and href of the email link, work
  //const emailValue = document.getElementById("InputMail").value;
  //const emailLink = document.getElementById("email-link");

  //emailLink.textContent = emailValue; // Update the displayed email text
  //emailLink.setAttribute("href", "mailto:" + emailValue); // Set mailto href attribute
}

function handleBlueClick(event) {
  event.preventDefault();
  const bizCard = document.querySelector(".biz-card");
  bizCard.classList.toggle("blue");
  bizCard.classList.remove("yellow");
}

function handleYellowClick(event) {
  event.preventDefault();
  const bizCard = document.querySelector(".biz-card");
  bizCard.classList.toggle("yellow");
  bizCard.classList.remove("blue");
}

function handleFormEvents() {
  // Event listener for the Create button
  document.getElementById("submitCreate").addEventListener("click", handleCreateClick);

  // Event listener for the Blue button
  document.querySelector("button.blue").addEventListener("click", handleBlueClick);

  // Event listener for the Yellow button
  document.querySelector("button.yellow").addEventListener("click", handleYellowClick);
}

// Call the function to handle form events
handleFormEvents();
