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


// test date stamps for test account URLS:
const testDate1 = new Date(Date.now());
const testDateFormatted1 = testDate1.toLocaleString('en-US');
const testDate2 = new Date(Date.now());
const testDateFormatted2 = testDate2.toLocaleString('en-US');


// test database tied to test accounts:
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", dateFormatted: testDateFormatted1},
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", dateFormatted: testDateFormatted2}
};


// for logging in with test accounts:
const testPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", 10);
const testPassword2 = bcrypt.hashSync("dishwasher-funk", 10);


// two test accounts:
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



app.get('/', (req, res) => { // => registers handler on root path ('/')
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    return res.redirect('/login');
  }
});
app.get('/urls', (req, res) => { // => page displaying urls
  let userKey = req.session.user_id;
  if (!userKey) {
    return res.redirect('/login');
  } else {
    let userID = users[userKey].id;
    let userURLS = urlsForUser(userID, urlDatabase);
    const templateVars = {
      userID,
      urls: userURLS
    };
    return res.render('urls_index', templateVars);
  }
});
app.get('/urls/new', (req, res) => {
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
app.get('/urls/:shortURL', (req, res) => {
  let userKey = req.session.user_id;
  if (!userKey) {
    res.redirect('/login');
  } else if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  }  else {
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase);
    if (!userURLS[req.params.shortURL]) {
      return res.sendStatus(403);
    } else {
      const templateVars = {
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
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.sendStatus(404);
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }
});
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.sendStatus(403);
  } else {
    let userKey = req.session.user_id;
    const short = generateRandomString();
    const dateStamp = new Date(Date.now());
    const dateFormatted = dateStamp.toLocaleString('en-US');
    urlDatabase[short] = {
      userID : userKey,
      longURL : req.body.longURL,
      dateFormatted,
    };
    res.redirect(`/urls/${short}`);
  }
});
app.put('/urls/:shortURL', (req, res) => { // edits the short url's long url
  if (!req.session.user_id) {
    return res.sendStatus(403);
  } else {
    let userKey = req.session.user_id;
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase);
    if (!userURLS[req.params.shortURL]) {
      return res.sendStatus(403);
    } else {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      return res.redirect('/urls');
    }
  }
});
app.delete('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    return res.sendStatus(403);
  } else {
    let userKey = req.session.user_id;
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase);
    if (!userURLS[req.params.shortURL]) {
      return res.sendStatus(403);
    } else {
      delete urlDatabase[req.params.shortURL];
      return res.redirect('/urls');
    }
  }
});
app.get('/login', (req, res) => {  // => template vars defaults to undefined if server is reset
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
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    const templateVars = {
      userID: undefined,
    };
    return res.render('urls_register', templateVars);
  }
});
app.post('/login', (req, res) => {
  const userInfo = getUserByEmail(req.body.email, users);
  if (!userInfo || users[userInfo].email !== req.body.email) {
    return res.sendStatus(403);
  } else if (!bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    return res.sendStatus(403);
  } else if (bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    req.session.user_id = users[userInfo].id; // => not camel case because cookie-session package and Compass said to do it this way.
    return res.redirect('/urls');
  }
});
app.post('/register', (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    return res.sendStatus(400);
  } else if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  } else {
    const randomID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = randomID; // => not camel case because cookie-session package and Compass said to do it this way.
    return res.redirect('/urls');
  }
});
app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('*', (req, res) => {
  return res.redirect('/login');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//---------------TO DO:---------------

// redesign header end views (make em pretty!)
// lint all js files