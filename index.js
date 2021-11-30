const express = require('express');
const session = require('express-session');
const mysql   = require('mysql2');
require('dotenv').config();

const app = new express();

const connection = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: process.env.DB_PASS,
	database: 'partyline',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});



// serve public files - static
app.use( express.static('public') );
app.use( express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// session setup stuff for express session
app.use(session({ 
	secret: 'partyline_session',
	resave: true,
	saveUninitialized: true
}));

app.use((req, res, next) => {
	res.locals.user_id = req.session.user_id;
	res.locals.username = req.session.username;
	next();
});

// middleware to set up our menus
app.use(function(req, res, next) {
	console.log('app.use is called');

	// TODO( actually check to see if we are logged in)
	if ( res.locals.user_id ) {
		// FOR LOGGED IN USERS
		connection.query(
			'SELECT p.id,p.name FROM parties AS p LEFT JOIN user_parties AS up ON p.id = up.party_id WHERE up.user_id = ?',
			[ res.locals.user_id ],
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
	res.render('createParty', { parent_id: null });
});
app.post('/party', (req, res) => {
	// todo (this will be where we handle this)
	var user_id = res.locals.user_id;
	connection.query('INSERT INTO parties (user_id, name, description) VALUES (?,?,?)', [user_id, req.body.name, req.body.description], (err, results) =>{
		console.log(results.insertId);
		res.redirect('/party/'+ results.insertId);
	});
});

// create a sub party
app.get('/party/:party_id/new', (req, res) => {
	res.render('createParty', { parent_id: req.params.party_id });
});
app.post('/party/:party_id/new', (req, res) => {
	// todo (this will be where we handle this)
	var user_id = res.locals.user_id;
	connection.query('INSERT INTO parties (parent_id, user_id, name, description) VALUES (?,?,?,?)', [req.params.party_id, user_id, req.body.name, req.body.description], (err, results) =>{
		console.log(results.insertId);
		res.redirect('/party/'+ req.params.party_id);
	});
});



app.get('/login', (req, res) => {
	res.render('login');
});
app.post('/login', (req, res) => {
	// TODO(actually let us log in)
	
	// the user has posted `username` and `password`
	let username = req.body.username;
	let password = req.body.password;

	// we want to look up the user from the database, and check to see if their password matches
	let query = `
		SELECT id,first_name,last_name,username,password FROM users WHERE username = ?
	`;
	connection.query(query, [ username ], (err,results) => {

		
		if ( results.length ) {
			let dbpass = results[0].password;
			// if the password matches, log them in
			console.log(dbpass + ' - ' + password);
			if ( dbpass == password ) {
				// we are logged in correctly

				req.session.user_id = results[0].id;
				req.session.username = results[0].username;

				return res.redirect('/user/' + results[0].id);
			} 
		} 
	
		return res.redirect('/login?invalid');
	
		// otherwise, return them to the login page 
		// todo(think about an error message)

	});

});
app.get('/logout', (req, res) => {
	if ( req.session ) {
		req.session.destroy(err => {
			if ( err ) {
				res.status(400).send('Unable to logout');
			} else {
				res.redirect('/');
			}
		});
	} else {
		res.redirect('/');
	}
});

// route to load/display a chat room party
app.get('/party/:party_id', (req, res) => {
	console.log(req.params);
	// query the database to fetch the name/description of the party
	// requested in the URL
	connection.query(
		'SELECT name,description FROM parties JOIN mainpartyName.party_id = parties.id WHERE id = ?', 
		[ req.params.party_id ], 
		(err, results) => {

		if ( results.length ) { 

			console.log(results[0]);

			let templateArgs = { 
				partyId: req.params.party_id,
				partyName: results[0].name, 
				partyDescription: results[0].description,
				messages: [],
				subParties: req.params.party_id,
			};

			connection.query('SELECT id,user_id,message,sent_on FROM messages WHERE party_id = ?', [ req.params.party_id ], (err, results) => {
				templateArgs.messages = results;

				connection.query(
					'SELECT id,name FROM parties WHERE parent_id = ?', 
					[req.params.party_id],
					(err, results) => {
						if ( results.length ) {
							templateArgs.subParties = results;
						}
						console.log(templateArgs);
						res.render('party', templateArgs);
					}
				
				);

				
			});
		} else {
			res.render('404');
		}
	});
});

app.post('/party/:party_id', (req, res) => {
	// write the code to store a new message to the messages table.
	let user_id = res.locals.user_id; 
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
	let user_id = res.locals.user_id; 
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

app.get('/user/:user_id', (req, res) => {
	
	connection.query('SELECT * FROM `users` WHERE `id` = ?', [ req.params.user_id ], (err, results) => {
		if ( results.length ) {
			let userProfile = {
				firstName: results[0].first_name,
				lastName: results[0].last_name,
				email: results[0].email,
				username: results[0].username,
				password: results[0].password,
				Subs: []
				
			};

			connection.query('SELECT up.id, up.party_id, up.user_id, parties.name FROM partyline.user_parties AS up LEFT JOIN parties ON up.party_id = parties.id WHERE up.user_id = ?', [req.params.user_id],(err, results) => {
				userProfile.Subs = results;

				res.render('user', userProfile);
			})
		
		} else {
			res.render('404');
		}
		
	});
});

app.get('/api/party/:party_id/:message_id' ,(req,res) => {
	// TODO - send back the timestamp and user id
	connection.query('SELECT id, user_id, sent_on, party_id, message FROM messages WHERE party_id = ? AND id > ?', [ req.params.party_id, req.params.message_id ], (err, results) => {
		res.json(results);
	});
});

app.listen(3000, () => console.log('Server is up on port 3000'))