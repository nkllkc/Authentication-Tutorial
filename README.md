[Link to medium article](https://medium.com/@evangow/server-authentication-basics-express-sessions-passport-and-curl-359b7456003d)

# Notes

You’ll notice in the above that when we configure our app to use the body-parser middleware, bodyParser.json() and bodyParser.urlencoded(). While we our sending our data directly to the server in JSON format, if we ever added and actual frontend to our application, the data in the POST request Content-Type would come through as a ‘application/x-www-form-urlencoded’. Here, we’re including it just in case you ever want to use this file as boilerplate for a new project.


## Auth with Passport

Before we get into the code, let’s talk about the authentication flow.
The user is going to POST their login information to the /login route
We need to do something with that data. This is where passport comes in. We can call passport.authenticate(‘login strategy’, callback(err, user, info) ). This method takes 2 parameters. Our ‘login strategy’ which is ‘local’ in this case, since we will be authenticating with email and password (you can find a list of other login strategies using passport though. These include Facebook, Twitter, etc.) and a callback function giving us access to the user object if authentication is successful and an error object if not.
passport.authenticate() will call our ‘local’ auth strategy, so we need to configure passport to use that strategy. We can configure passport with passport.use(new strategyClass). Here we tell passport how the local strategy can be used to authenticate the user.
Inside the strategyClass declaration, we will take in the data from our POST request, use that to find the matching user in the database and check that the credentials match. If they do match, passport will add a login() method to our request object, and we return to our passport.authenticate() callback function.
Inside the passport.authenticate() callback function, we now call the req.login() method.
The req.login(user, callback()) method takes in the user object we just returned from our local strategy and calls passport.serializeUser(callback()). It takes that user object and 1) saves the user id to the session file store 2) saves the user id in the request object as request.session.passport and 3) adds the user object to the request object as request.user. Now, on subsequent requests to authorized routes, we can retrieve the user object without requiring the user to login again (by getting the id from the session file store and using that to get the user object from the database and adding it to our request object).