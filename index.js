const express = require('express');
const mysql   = require('mysql2');

const app = new express();

const connection = mysql.createPool({
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

// create a party page
app.get('/party', (req, res) => {
	res.render('createParty');
});
app.post('/party', (req, res) => {
	// todo (this will be where we handle this)
	var user_id = 1;
	connection.query('INSERT INTO parties (user_id, name, description) VALUES (?,?,?)', [user_id, req.body.name, req.body.description], (err, results) =>{
		console.log(results.insertId);
		res.redirect('/party/'+ results.insertId);
	});
});

// route to load/display a chat room party
app.get('/party/:party_id', (req, res) => {
	console.log(req.params);
	// query the database to fetch the name/description of the party
	// requested in the URL
	connection.query(
		'SELECT name,description FROM parties WHERE id = ?', 
		[ req.params.party_id ], 
		(err, results) => {
		console.log(results[0]);

		let templateArgs = { 
			partyId: req.params.party_id,
			partyName: results[0].name, 
			partyDescription: results[0].description,
			messages: []
		};

		connection.query('SELECT id,user_id,message,sent_on FROM messages WHERE party_id = ?', [ req.params.party_id ], (err, results) => {
			templateArgs.messages = results;
			res.render('party', templateArgs);
		});
		
	});
});

app.post('/party/:party_id', (req, res) => {
	// write the code to store a new message to the messages table.
	let user_id = 1; // TODO(erh): fix this when we implement user accounts.
    connection.query('INSERT INTO messages (party_id, user_id, message) VALUES (?,?,?)', [req.params.party_id, user_id, req.body.newMessage], (err, results) => {
		res.redirect('/party/' + req.params.party_id);
    });
});

app.get('/search', (req, res) => {

	// TODO: need a search.ejs template to display our search results
	// TODO: to actually process the query in our database and render those results on our template.
	// connection.query 
	// var id = req.param('search');
	let searchQuery = req.query.query;
	console.log(searchQuery);
	searchQuery = '%' + searchQuery + '%';

	// TODO: search for parties as well... 
	let templateObj = { messages: [searchQuery], parties: [searchQuery] };
	connection.query(
		'SELECT id,party_id,user_id,message,sent_on FROM messages WHERE message LIKE ?',
		[ searchQuery ],
		(err, results) => {
			templateObj.messages = results;
			res.render('search', templateObj);
		} 
	);

	// connection.query(
	// 	'SELECT id,party_id,user_id,message, sent_on FROM partyline.messages WHERE id = ?', 
	// 	[ req.params.search ], 
	// 	(err, results) => {
	// // SELECT id,party_id,user_id,message,sent_on FROM partyline.messages WHERE message LIKE '%test%';
	
});

app.listen(3000, () => console.log('Server is up on port 3000'))