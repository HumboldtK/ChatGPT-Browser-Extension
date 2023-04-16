// Get the current timestamp in milliseconds
var now = Date.now();
var clearChatButton = document.getElementById("clearChat");
var submitButton = document.getElementById("submit");
var questionInput = document.getElementById("question");
var answerTextarea = document.getElementById("answer");
var clearHistoryButton = document.getElementById("clearHistory");


var port = chrome.runtime.connect({name: "popup"});

port.postMessage({action: "getQuestion"});

port.onMessage.addListener(function(msg) {
  if (msg.action === "setQuestion" && msg.question) {
    document.getElementById("question").value = msg.question;
    
    // Simulate a click event on submit button
    document.getElementById("submit").click();
    chrome.storage.local.remove("question");
  }
});


if (submitButton) {
  submitButton.addEventListener("click", function() {
    let question = questionInput.value.trim();
    if (question.length === 0) {
      return;
    }
    // Disable the submit button
    submitButton.disabled = true;
    questionInput.value = '';
    answerTextarea.classList.add("loading");

    fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ENTER_API_KEY_HERE"
        },
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [ 
            {
              "role": "user",
              "content": question
            }
          ],
          "temperature": 0.3,
          "max_tokens": 2000
        })
      })
      
      .then(response => {
        answerTextarea.classList.remove("loading");
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.status);
        }
      })
      .then(data => {
        console.log(data);
        if (data.choices && data.choices.length > 0) {
          let answer = data.choices[0].message.content.trim();

          // Hide the loading animation and display the answer
          answerTextarea.value = answer;

          // Save the question and answer in localStorage with a timestamp
          let prompt = {
            answer: answer,
            timestamp: Date.now()
          };
          localStorage.setItem("prompt", JSON.stringify(prompt));
        } else {
          answerTextarea.value = "Sorry, I could not generate a response.";
        }
      })
      .catch(error => {
        console.error(`Error ${error.status}: ${error.message}`);
      })
      
      .finally(() => {
        // Re-enable the submit button
        submitButton.disabled = false;
      });
  });

  questionInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      if (!event.shiftKey) {
        event.preventDefault();
        submitButton.click();
      }
    }
  });
  
  // Check if there is a saved prompt in localStorage
  let prompt = localStorage.getItem("prompt");
  if (prompt) {
    prompt = JSON.parse(prompt);

    // Check if the prompt is less than 1 hour old
    if (Date.now() - prompt.timestamp < 3600000) {
      // Display the question and answer in the input fields
      answerTextarea.value = prompt.answer;
    } else {
      // Remove the prompt from localStorage if it is older than 1 hour
      localStorage.removeItem("prompt");
    }
  }

  // Retrieve the last answer from localStorage and display it
  let lastAnswer = localStorage.getItem("lastAnswer");
  if (lastAnswer) {
  answerTextarea.value = lastAnswer;
  }
  }
  
  // clear prompt memory / local storage
  if (clearChatButton) {
  let questionInput = document.getElementById("question");
  let answerTextarea = document.getElementById("answer");
  clearChatButton.addEventListener("click", function() {
  questionInput.value = "";
  answerTextarea.value = "";
  localStorage.removeItem("prompt");
  localStorage.removeItem("lastAnswer"); // Remove the last answer from localStorage
  });
  }


function appendToHistory(question, answer, timestamp) {
  const historyList = document.querySelector(".history-list");
  let historyItemDiv = document.createElement("div");
  historyItemDiv.className = "history-item";
  
  let historyQuestion = document.createElement("div");
  historyQuestion.className = "history-question";
  historyQuestion.innerHTML = `Q: ${question}`;
  historyItemDiv.appendChild(historyQuestion);

  let historyAnswer = document.createElement("div");
  historyAnswer.className = "history-answer";
  historyAnswer.innerHTML = `A: ${answer}`;
  historyItemDiv.appendChild(historyAnswer);

  historyList.insertBefore(historyItemDiv, historyList.firstChild);
}



function clearHistory() {
  let confirmClear = confirm("Are you sure you want to clear the chat history?");
  if (confirmClear) {
    localStorage.removeItem("history"); // Remove chat history from local storage
    document.querySelector(".history-list").innerHTML = ""; // Clear chat history display
  }
}

if (clearHistoryButton) {
  clearHistoryButton.addEventListener("click", clearHistory);
}




// Check if a preference for light/dark mode exists in localStorage
var modePreference = localStorage.getItem('modePreference');
// If there is a preference saved, use it to set the mode
if (modePreference === 'dark') {
  document.body.classList.add('dark-mode');
  document.getElementById('lightdark').textContent = 'Light Mode';
} else {
  document.body.classList.remove('dark-mode');
}
// Add event listener for the light/dark mode button
document.getElementById('lightdark').addEventListener('click', function() {
  // Toggle the class on the body element
  document.body.classList.toggle('dark-mode');
  
  // Change the button text
  if (document.getElementById('lightdark').textContent === 'Dark Mode') {
    document.getElementById('lightdark').textContent = 'Light Mode';
    // Save the preference in localStorage
    localStorage.setItem('modePreference', 'dark');
  } else {
    document.getElementById('lightdark').textContent = 'Dark Mode';
    // Save the preference in localStorage
    localStorage.setItem('modePreference', 'light');
  }
});



// Call the updateStyles function when the light/dark mode is toggled
document.body.addEventListener('click', function() {
  updateStyles();
});
document.addEventListener('DOMContentLoaded', function () {
  var links = document.getElementsByTagName("a");
  for (var i = 0; i < links.length; i++) {
      (function () {
          var ln = links[i];
          var location = ln.href;
          ln.onclick = function () {
              chrome.tabs.create({active: true, url: location});
          };
      })();
  }
});


function loadHistory() {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  let currentTime = Date.now();
  let historyFiltered = [];

  history.forEach(item => {
    if (currentTime - item.timestamp <= 30 * 24 * 60 * 60 * 1000) { // Check if the item is not older than 30 days
      appendToHistory(item.question, item.answer, item.timestamp);
      historyFiltered.push(item);
    }
  });

  localStorage.setItem("history", JSON.stringify(historyFiltered)); // Update the localStorage with filtered history
}
loadHistory();


// Get the history modal and close button
var historyModal = document.getElementById("historyModal");
var closeHistory = document.getElementsByClassName("closeHistory")[0];

// When the user clicks the "View History" button, open the history modal
document.getElementById("viewHistoryBtn").onclick = function() {
  historyModal.style.display = "block";
};

// When the user clicks the close button (x), close the history modal
closeHistory.onclick = function() {
  historyModal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
document.addEventListener('click', function(event) {
  if (event.target == historyModal) {
    historyModal.style.display = "none";
  }
});

var modal = document.getElementById("controlsmodal");

var btn = document.getElementById("settingsBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Update the CSS styles based on the light/dark mode
function updateStyles() {
  let wrapper = document.querySelector('.wrapper');
  let question = document.getElementById('question');
  let answer = document.getElementById('answer');
  let logo = document.querySelector('.logo');
  let modal = document.querySelector('.modal-content');
  let settings = document.getElementById('settingsheader');
  let closesettings = document.querySelector('.close');

  if (document.body.classList.contains('dark-mode')) {
    wrapper.style.backgroundColor = '#292929';
    modal.style.backgroundColor = '#585757';
    question.style.backgroundColor = '#292929';
    answer.style.backgroundColor = '#292929';
    answer.style.borderColor = '#585757';
    question.style.borderColor = '#585757';
    logo.style.backgroundImage = "url('/styles/logo1.svg')";
    question.style.color = '#ffffff';
    answer.style.color = '#ffffff';
    settings.style.color = '#c8c8c8';
    closesettings.style.color = '#ffffff';
    // Change text color of all history items to white
    let historyItems = document.querySelectorAll('.history-item');
    for (let i = 0; i < historyItems.length; i++) {
      historyItems[i].style.color = '#ffffff';
    }
  } else {
    wrapper.style.backgroundColor = '#dddddd';
    modal.style.backgroundColor = '#dddddd';
    question.style.backgroundColor = '#f5f5f5';
    answer.style.backgroundColor = '#f5f5f5';
    answer.style.borderColor = '#bebbbb';
    question.style.borderColor = '#bebbbb';
    question.style.color = '#000000';
    answer.style.color = '#000000';
    settings.style.color = '#000000';
    closesettings.style.color = '#000000';

    // Change text color of all history items to default color
    let historyItems = document.querySelectorAll('.history-item');
    for (let i = 0; i < historyItems.length; i++) {
      historyItems[i].style.color = '';
    }
    
    logo.style.backgroundImage = "url('/styles/logo.svg')";
  }
}


// hide donate buttonn 
function hideDonateButton() {
  let button = document.getElementById('hidedonate');
  let donateButton = document.querySelector('.donatebutton');

  // Retrieve the preference from local storage
  let isDonateHidden = localStorage.getItem('isDonateHidden');

  if (isDonateHidden === 'true') {
    donateButton.style.display = 'none';
    button.textContent = 'Show Donate';
  }

  button.addEventListener('click', function() {
    if (donateButton.style.display === 'none') {
      donateButton.style.display = 'block';
      button.textContent = 'Hide Donate';

      // Store the preference in local storage
      localStorage.setItem('isDonateHidden', 'false');
    } else {
      donateButton.style.display = 'none';
      button.textContent = 'Show Donate';

      // Store the preference in local storage
      localStorage.setItem('isDonateHidden', 'true');
    }
  });
}

// Call the updateStyles function when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  updateStyles();
  hideDonateButton();
});
