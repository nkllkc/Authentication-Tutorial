const chalk = require('chalk');

//npm modules for auth
const express = require('express');
const uuid = require('uuid').v4
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Used for fetching data.
const axios = require('axios');

// Encrypt passwords
const bcrypt = require('bcrypt-nodejs');

const users = [
    {id: '2f24vvg', email: 'test@test.com', password: 'password'}
]


/**
 * START - Configure Passportjs.
 */

// configure passport.js to use the local strategy
// Other types of strategies can be found on passport documentation website (for Facebook, Twitter, etc.)
passport.use(new LocalStrategy(
    /** The local strategy uses a username and password to authenticate a user; 
     *  however, our application uses an email address instead of a username, 
     *  so we just alias the username field as ‘email’. 
     **/
    { usernameField: 'email' /* Aliasing usernameField as email for callback, and fatched from body. */ },
    (email, password, done) => {
        /** Then we tell the local strategy how to find the user in the database. 
         *  Here, you would normally see something like ‘DB.findById()’ 
         *  but for now we’re just going to ignore that and assume the correct 
         *  user is returned to us by calling our users array containing 
         *  our single user object. */

        axios.get(`http://localhost:5000/users?email=${email}`)
        .then(res => {
            const user = res.data[0]
            if (!user) {
                return done(null, false, { message: 'Invalid credentials. No email address.\n' });
            }
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, { message: 'Invalid credentials. Wrong Password.\n' });
            }
            return done(null, user);
        })
        .catch(error => done(error));


        // console.log(chalk.red('Inside local strategy callback'))
        // // here is where you make a call to the database
        // // to find the user based on their username or email address
        // // for now, we'll just pretend we found that it was users[0]
        // const user = users[0] 
        // if(email === user.email && password === user.password) {
        //     console.log(chalk.red('Local strategy returned true'))
        //     /** If the data we receive from the POST request matches 
        //      *  the data we find in our database, we call the 
        //      *  done(error object, user object) method and pass in 
        //      *  null and the user object returned from the database. 
        //      **/
        //     return done(null, user)
        // }
    }
));
  
// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    /** It takes that user object and:
     *  1) saves the user id to the session file store 
     *  2) saves the user id in the request object as request.session.passport
     *  3) adds the user object to the request object as request.user.  
     **/
    console.log('Inside serializeUser callback. User id is save to the session file store here')
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log(chalk.redBright("From deserializeUser."))
    axios.get(`http://localhost:5000/users/${id}`)
    .then(res => done(null, res.data) )
    .catch(error => done(error, false))
});

/**
 * END - Configure Passportjs.
 */

// create the server
const app = express();

/**
 * START - Add & Configure Middleware
 */

// Add & configure middleware.
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(session({
    genid: (req) => {
        console.log(chalk.green('Inside the session middleware'))
        console.log(req.sessionID)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
/** We configure our application to use passport 
 *  as a middleware with the calls. 
 *  
 *  Note, that we call this after we configure our app 
 *  to use *express-session* and the *session-file-store*. 
 *  This is because passport rides on top of these.
 **/
app.use(passport.initialize());
app.use(passport.session());

/**
 * END - Add & Configure Middleware
 */


/**
 * START - Specificate APIs Endpoints
 */

// create the homepage route at '/'
app.get('/', (req, res) => {
    console.log('Inside the homepage callback function')
    console.log(req.sessionID)
    res.send(`You got home page!\n`)
})
  
// create the login get and post routes
app.get('/login', (req, res) => {
    console.log('Inside GET /login callback function')
    console.log(req.sessionID)
    res.send(`You got the login page!\n`)
})
  
app.post('/login', (req, res, next) => {
    console.log(chalk.yellow('Inside POST /login callback'))
    passport.authenticate('local', (err, user, info) => {
        if (info) { 
            return res.send(info.message)
        }
        if (err) { 
            return next(err); 
        }
        if (!user) { 
            return res.redirect('/login'); 
        }
        req.login(user, (err) => {
          if (err) { return next(err); }
          return res.redirect('/authrequired');
        })
    })(req, res, next);
})
  
app.get('/authrequired', (req, res) => {
    console.log('Inside GET /authrequired callback')
    console.log(`User authenticated? ${req.isAuthenticated()}`)
    if(req.isAuthenticated()) {
        res.send('you hit the authentication endpoint\n')
    } else {
        res.redirect('/')
    }
})

/**
 * END - Specificate APIs Endpoints
 */


/**
 * START - start the server.
 */

// tell the server what port to listen on
app.listen(3000, () => {
    console.log('Listening on localhost:3000')
})