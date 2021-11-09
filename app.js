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

	//displays users parties by username (/username)
	app.get('/', (req, res) => {
	
	});

	//displays selected party messages (/username/party)
	app.get('/', (req, res) => {
	
	});

	//create a new party
	app.post('/newParty', (req, res) => {
	
	});

  	//create a new message
	app.post('/party/newMessage', (req, res) => {
	
});

	//deleting parties
	app.delete('/newParty', (req, res) => {
	
	});

	// create a route for part search function

app.listen(3000, () => console.log('Server is up on port 3000'))