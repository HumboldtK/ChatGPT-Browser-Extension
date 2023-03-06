var submitButton = document.getElementById("submit");

if (submitButton) {
  let questionInput = document.getElementById("question");
  let answerTextarea = document.getElementById("answer");

  submitButton.addEventListener("click", function() {
    let question = questionInput.value.trim();
    if (question.length === 0) {
      return;
    }

    // Disable the submit button
    submitButton.disabled = true;
    answerTextarea.classList.add("loading");


    fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer API_KEY"
        },
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [ 
            {
              "role": "user",
              "content": question
            }
          ],
          "temperature": 0.5,
          "max_tokens": 100
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
        } else {
          answerTextarea.value = "Sorry, I could not generate a response.";
        }
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        // Re-enable the submit button
        submitButton.disabled = false;
      });
  });

  questionInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      submitButton.click();
    }
  });
}
