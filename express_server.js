const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, urlsForUser, getUserByEmail } = require('./helpers');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.set('view engine', 'ejs');


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};



app.get('/', (req, res) => { // => registers handler on root path ('/')
  res.send('Tiny URL Project root page!');
});

app.get('/login', (req, res) => {
  let userKey = req.session.user_id;
  let userID = users[userKey];
  const templateVars = {
    userID,
    urls: urlDatabase
  };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const userInfo = getUserByEmail(req.body.email, users);
  // console.log(userInfo)
  if (userInfo.email !== req.body.email) {
    res.status(403).send('that email is not in our database.');
  } else if (!bcrypt.compareSync(req.body.password, userInfo.password)) {
    res.status(403).send('password does not match!');
  } else if (bcrypt.compareSync(req.body.password, userInfo.password)) {
    req.session.user_id = userInfo.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});



app.get('/urls', (req, res) => { // => page displaying urls
  let userKey = req.session.user_id;
  if (!userKey) {
    res.redirect('/login');
  } else {
    let userID = users[userKey].id;
    let userURLS = urlsForUser(userID, urlDatabase);
    const templateVars = {
      userID,
      urls: userURLS
    };
    res.render('urls_index', templateVars);
  }
});

app.get('/register', (req, res) => {
  let userKey = req.session.user_id;
  let userID = users[userKey];
  const templateVars = {
    userID,
    // urls: urlDatabase
  };
  res.render('urls_register', templateVars);
});



app.post('/register', (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('that email already exists!');
  } else if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('email and password cannot be empty!');
  } else {
    const randomID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = randomID;
    res.redirect('/urls');
  }
});


app.post("/urls", (req, res) => {
  let userKey = req.session.user_id;
  let short = generateRandomString();
  urlDatabase[short] = {
    userID : userKey,
    longURL : req.body.longURL,
  };
  res.redirect(`/urls/${short}`);
});

app.get('/urls/new', (req, res) => {
  let userKey = req.session.user_id;
  let userID = users[userKey];
  if (!userKey) {
    res.redirect('/login');
  } else {
    const templateVars = {
      userID,
      urls: urlDatabase
    };
    res.render('urls_new', templateVars);
  }
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let userKey = req.session.user_id;
  if (!userKey) {
    res.redirect('/login');
  } else {
    let searchID = users[userKey].id;
    let userURLS = urlsForUser(searchID, urlDatabase);
    const templateVars = {
      userID : users[userKey],
      urls: userURLS,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
    };
    res.render('urls_show', templateVars);
  }
});


app.post('/urls/:shortURL/delete', (req, res) => {
  let user = req.session.user_id;
  let searchID = users[user].id;
  let userURLS = urlsForUser(searchID, urlDatabase);
  if (user === userURLS[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.send('not the owner: cannot delete.');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//---------------TO DO:---------------
// change page templates to hide or show pertinent info depending on session status