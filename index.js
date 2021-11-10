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
	res.render('index');
});

//displays users parties by username (/username)
app.get('/user/:username', (req, res) => {
	console.log('user page');
	res.render('index');
});

//displays selected party messages (/username/party)
app.get('/user/:username/party', (req, res) => {
	console.log('user party messages');
	res.render('index');
});

//create a new party
app.post('/party', (req, res) => {
	console.log('create a party');
	res.render('index');
});

//create a new message
app.post('/party/:party_id', (req, res) => {
	console.log('post new message to a party');
	res.render('index');
});

//deleting parties
app.delete('/party/:party_id', (req, res) => {
	res.render('index');
});

// create a route for part search function



app.listen(3000, () => console.log('Server is up on port 3000'))