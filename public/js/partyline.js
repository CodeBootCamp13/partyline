function newMessages() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/party/' + party_id + '/' + newestMessage);
    xhr.onload = function() {
		// update our highest message id
		// display the new message or messages on the page
        console.log(this.responseText);
    }
    xhr.send();
};

setInterval(newMessages, 2000);