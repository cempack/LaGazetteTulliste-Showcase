// Newsletter

document
  .querySelector(".newsletter-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    let email = document.getElementById("email").value;
    const url = `https://journal.elliotmoreau.fr/account.php?newsletter=true&email=${email}`;
    // Call the API
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message)
        console.log(data.message == "success")
        if (data.message == "success") {
          showMessage("Vous êtes inscrit à la newsletter.", "success");
        } else {
          showMessage(data.message, "error");
        }
      });
  });

function showMessage(message, type) {
  document.querySelector(".message").innerHTML = message;
  document.querySelector(".message").style.display = "block";
  if (type === "success") {
    document.querySelector(".message").style.backgroundColor = "#4CAF50";
  } else {
    document.querySelector(".message").style.backgroundColor = "#f44336";
  }
  setTimeout(() => {
    document.querySelector(".message").style.display = "none";
  }, 3000);
}
