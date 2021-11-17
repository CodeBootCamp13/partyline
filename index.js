const e = require('express');
const express = require('express');
const mysql   = require('mysql2');

const app = new express();

const connection = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'partyline',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

// serve public files - static
app.use( express.static('public') );
app.use( express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

let myUserId = 1; // TODO: temporary user id until we get accounts configured

// middleware to set up our menus
app.use(function(req, res, next) {
	console.log('app.use is called');

	// TODO( actually check to see if we are logged in)
	if ( myUserId ) {
		// FOR LOGGED IN USERS
		connection.query(
			'SELECT p.id,p.name FROM parties AS p LEFT JOIN user_parties AS up ON p.id = up.party_id WHERE up.user_id = ?',
			[ myUserId ],
			(err, results) => {
				console.log(results);
				res.locals.partyMenu = results;
				res.locals.myParties = {};
				for ( let i = 0; i < results.length; i++ ) {
					res.locals.myParties[ results[i].id ] = results[i].name;
				}
				console.log(res.locals.myParties);
				next();
			}
		);
	} else { 
		// FOR GUESTS
		// grab a list of all our parties
		connection.query('SELECT id,name FROM parties ORDER BY name LIMIT 10', (err, results) => {
			console.log(results);
			res.locals.partyMenu = results;
			next();
		});
	}

	// if we are logged in, grab a list of the parties we are subscribed to
});

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

app.get('/login', (req, res) => {
	res.render('login');
});
app.post('/login', (req, res) => {
	// TODO(actually let us log in)
	res.render('login');
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
	let searchQuery = '%' + req.query.query + '%';

	// TODO: search for parties as well... 
	let templateObj = { messages: [], parties: [] };

	connection.query(
		'SELECT id,name FROM parties WHERE name LIKE ? OR description LIKE ?',
		[ searchQuery, searchQuery ],
		(err, results) => {

			templateObj.parties = results; 

			connection.query(
				'SELECT id,party_id,user_id,message,sent_on FROM messages WHERE message LIKE ?',
				[ searchQuery ],
				(err, results) => {
					templateObj.messages = results;
					res.render('search', templateObj);
				} 
			);

		}	
	);
	
});


// subscription to parties routes
app.post('/subscribe/:party_id', (req, res) => {
	// insert a record into the database for the party we are subscribing to
	let user_id = 1; // TODO: replace this when we get user accounts set up
	connection.query(
		'INSERT INTO user_parties (user_id, party_id) VALUES (?, ?)',
		[ user_id, req.params.party_id ],
		(err, results) => {
			res.redirect('back');
		}
	)
});

app.get('/account', (req, res) =>{
	res.render('account');
})

app.post('/account', (req, res) => {
	connection.query('INSERT INTO users (first_name, last_name, email, username, password) VALUES (?,?,?,?,?)', [req.body.first_name, req.body.last_name, req.body.email, req.body.username, req.body.password], (err, results) => {
		console.log(req.body);
		res.redirect('/search');
	});
})

app.listen(3000, () => console.log('Server is up on port 3000'))


