function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");
  const spinner = document.getElementById("spinner");

  spinner.style.display = "block";

  setTimeout(() => {
    if (username === "Mobile Computing" && password === "cse410") {
      window.location.href = "home.html";
    } else {
      spinner.style.display = "none";
      errorMessage.textContent = "Invalid username or password.";
      errorMessage.style.display = "block";
    }
  }, 5000);
}

document
  .getElementById("loginForm")
  .addEventListener("submit", handleLogin);
