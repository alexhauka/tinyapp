const { generateRandomString, urlsForUser, getUserByEmail } = require('./helpers');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const express = require('express');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.set('view engine', 'ejs');


// examples for how the timestamps work (used in example accounts):
const testDate1 = new Date(Date.now());
const testDateFormatted1 = testDate1.toLocaleString('en-US');
const testDate2 = new Date(Date.now());
const testDateFormatted2 = testDate2.toLocaleString('en-US');


// example shortURL database with analytics (tied to example accounts):
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", dateFormatted: testDateFormatted1, totalVisits: 0, uniqueVisits: 0, visitors : {} },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", dateFormatted: testDateFormatted2, totalVisits: 0, uniqueVisits: 0, visitors : {} }
};




// for logging in with example accounts (use the string inside hashSync):
const testPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", 10);
const testPassword2 = bcrypt.hashSync("dishwasher-funk", 10);


// two example accounts:
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: testPassword1
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: testPassword2
  }
};

const uniqueUserDatabase = {}; // => object to track unique visitors for analytics (populates when a logged in user visits a shortURL)



app.get('/', (req, res) => { // => root path checks if user logged in and redirects appropriately
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    return res.redirect('/login');
  }
});
app.get('/urls', (req, res) => { // => urls page redirects to login page if no cookie, otherwise displays all of the users URLs
  if (!req.session.user_id) {
    return res.redirect('/login');
  } else {
    let userKey = req.session.user_id;
    let userID = users[userKey].id;
    let userURLS = urlsForUser(userID, urlDatabase); // => populates URLs if they belong to user
    const templateVars = {
      userID,
      urls: userURLS
    };
    return res.render('urls_index', templateVars);
  }
});
app.get('/urls/new', (req, res) => { // => page for creating new shortURLs; redirects to login page if no cookie
  let userKey = req.session.user_id;
  let userID = users[userKey];
  if (!userKey) {
    return res.redirect('/login');
  } else {
    const templateVars = {
      userID,
      urls: urlDatabase
    };
    return res.render('urls_new', templateVars);
  }
});
app.get('/urls/:shortURL', (req, res) => { // => page for viewing analytics and controlling a shortURL
  let userKey = req.session.user_id;
  if (!userKey) {
    res.redirect('/login');
  } else if (!urlDatabase[req.params.shortURL]) { // => if shortURL isn't in the database, sends 404
    return res.status(404).send('That URL is not in our database.');
  }  else {
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase);
    if (!userURLS[req.params.shortURL]) { // => if shortURL does not belong to current user, sends 403
      return res.status(403).send('You must be the owner of this URL to access it.');
    } else {
      const templateVars = { // => template info for shortURL, including analytics accessed from their respective global object
        visitors: urlDatabase[req.params.shortURL].visitors,
        userID : users[userKey],
        urls: userURLS,
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL],
        dateFormatted: urlDatabase[req.params.shortURL].dateFormatted
      };
      return res.render('urls_show', templateVars);
    }
  }
});
app.get("/u/:shortURL", (req, res) => { // => path for the shortURL; triggers relevant analytics (which populate in respective global object)
  if (!urlDatabase[req.params.shortURL]) { // => if shortURL is not in the database, sends 404
    return res.status(404).send('That URL is not in our database!');
  } else {
    const time = new Date(Date.now());
    const short = req.params.shortURL;
    let visitorID;
    if (!req.session.user_id) {
      visitorID = generateRandomString(); // => generates ID for non-users
    } else {
      visitorID = req.session.user_id; // => uses user ID if logged in
    }
    urlDatabase[short].visitors[visitorID] = time; // => user and timestamp for analytics
    urlDatabase[req.params.shortURL].totalVisits += 1;
    if (req.session.user_id) {
      const uniqueUser = req.session.user_id;
      if (!uniqueUserDatabase[uniqueUser]) { // => if logged in (and not yet used shortURL), unique visitors are counted for shortURL and entered into respective global object
        uniqueUserDatabase[uniqueUser] = uniqueUser;
        urlDatabase[req.params.shortURL].uniqueVisits += 1;
      }
    }
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }
});
app.post("/urls", (req, res) => { // => creates new shortURL
  if (!req.session.user_id) {
    return res.status(403).send('You must be logged in to add a URL.'); // => if not logged in, sends 403
  } else {
    let userKey = req.session.user_id;
    const short = generateRandomString();
    const dateStamp = new Date(Date.now());
    const dateFormatted = dateStamp.toLocaleString('en-US'); // => shortURLs creation timestamp
    urlDatabase[short] = { // => populates database with the new shortURL and pertinent info
      dateFormatted,
      userID : userKey,
      longURL : req.body.longURL,
      totalVisits: 0,
      uniqueVisits: 0,
      visitors : {}
    };
    res.redirect(`/urls/${short}`);
  }
});
app.put('/urls/:shortURL', (req, res) => { // owning account can edit the shortURLs destination
  if (!req.session.user_id) {
    return res.status(403).send('You must be logged in to edit the URL.'); // => sends 403 if not logged in
  } else {
    let userKey = req.session.user_id;
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase); // => urlsForUser (helper function) returns object containing the user's owned URLs
    if (!userURLS[req.params.shortURL]) { // => checks if user is the owner of the shortURL, if not sends 403
      return res.status(403).send('You must be logged in to the owner account to edit the URL.');
    } else {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      return res.redirect('/urls');
    }
  }
});
app.delete('/urls/:shortURL', (req, res) => { // => user-owned shortURLS can be deleted, otherwise sends 403 if not owned or logged in
  if (!req.session.user_id) {
    return res.status(403).send('You must be logged in to the owner account to delete this URL.');
  } else {
    let userKey = req.session.user_id;
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase); // => urlsForUser (helper function) returns object containing the user's owned URLs
    if (!userURLS[req.params.shortURL]) {
      return res.status(403).send('That URL is not in our database.');
    } else {
      delete urlDatabase[req.params.shortURL];
      return res.redirect('/urls');
    }
  }
});
app.get('/login', (req, res) => {  // => login page; sets template info depending on log-in state
  const templateVars = {
    userID: undefined,
    urls: urlDatabase
  };
  if (req.session.user_id) {
    templateVars.userID = users[req.session.user_id];// => sets the userID to matching cookie for session
    return res.redirect('/urls');
  } else {
    return res.render('urls_login', templateVars);
  }
});
app.get('/register', (req, res) => { // => registration page, redirects to owned URLs if logged in
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    const templateVars = {
      userID: undefined,
    };
    return res.render('urls_register', templateVars);
  }
});
app.post('/login', (req, res) => { // => when logging in, getUserByEmail is used to initiate login process and confirmation; sends 403's when met with failure
  const userInfo = getUserByEmail(req.body.email, users);
  if (!userInfo || users[userInfo].email !== req.body.email) {
    return res.status(403).send('Email does not match!');
  } else if (!bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    return res.status(403).send('Password does not match!');
  } else if (bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    req.session.user_id = users[userInfo].id; // => not camel case because cookie-session package and Compass said to do it this way (eslint gets angry though)
    return res.redirect('/urls');
  }
});
app.post('/register', (req, res) => { // => when registering a new user, checks that email is not already in database and input fields aren't empty
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send('That email is already registered!');
  } else if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send('Email & Password fields cannot be empty!');
  } else {
    const randomID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10); // => uses bcrypt to hash password
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = randomID; // => assigns cookie to user
    return res.redirect('/urls');
  }
});
app.post('/logout', (req, res) => { // logout clears cookies and redirects
  req.session = null;
  return res.redirect('/urls');
});
app.get('*', (req, res) => { // => catch-all that redirects to login
  return res.redirect('/login');
});
app.listen(PORT, () => {
  console.log(`TinyApp! listening on port ${PORT}!`);
});