const express = require('express');

const app = new express();

const mysql = require('mysql2');
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'partyline',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

// serve public files - static
app.use( express.static('public') );
app.use( express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//displays main screen
app.get('/', (req, res) => {
	res.render('home')
    
});

//displays users parties by username (/username)
app.get('/:username', (req, res) => {
	res.render('users')
    
	
});

//displays selected party messages (/username/party)
app.get('/:username/party', (req, res) => {
	res.render('party')
    
});

//create a new party
app.post('/:newParty', (req, res) => {
	res.render('newParty')
    
});

//create a new message
app.post('/:party/partyId', (req, res) => {
	res.render('newMessage')
    
});

//deleting parties
app.delete('/:party/partyId', (req, res) => {
	res.render('deleteParty')
    
});

// create a route for part search function



app.listen(3000, () => console.log('Server is up on port 3000'))