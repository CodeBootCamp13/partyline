function newMessages() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/party/' + party_id + '/' + newestMessage);
    xhr.onload = function() {
		// update our highest message id
		// display the new message or messages on the page
        console.log(this.responseText);
        var results = JSON.parse(this.responseText);
        if(results.length) {
            for (let i = 0; i < results.length; i++){
                var newDate = new Date(results[i].sent_on);
                var messageDiv = 
                `<div class="message"> 
                    <div class="username">User ${results[i].user_id} </div>
                    <div class="timestamp"> ${newDate} </div>
                    <div class="messageText"> ${results[i].message} </div>
                </div>`;
                document.getElementById('newMessages').innerHTML = document.getElementById('newMessages').innerHTML + messageDiv;
                newestMessage = results[i].id;
                

                console.log(newestMessage)
                let audio = new Audio('/sounds/alert.wav');
                audio.play();
            }
        }
    };
    xhr.send();
};

setInterval(newMessages, 2000);