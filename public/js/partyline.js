function newMessages() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/party' + party_id + '/' + newestMessage);
    xhr.onload = function() {
        console.log(this.responseText);
    }
    xhr.send();
};

setInterval(newMessages, 2000);