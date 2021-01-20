const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username', req.cookies);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => { // => page displaying urls
  let user = req.cookies['user_id'];
  let userID = users[user]
  const templateVars = {
    userID,
    urls: urlDatabase
  }
  res.render('urls_index', templateVars);
});

app.get('/register', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user]
  const templateVars = {
    userID,
    urls: urlDatabase
  }
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const randomID = generateRandomString();
  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', randomID);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
  // console.log(urlDatabase)
});

app.get('/urls/new', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user]
  const templateVars = {
    userID,
    urls: urlDatabase
  }
  res.render('urls_new', templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  let user = req.cookies['user_id'];
  let userID = users[user]
  const templateVars = {
    userID,
    urls: urlDatabase
  }
  res.redirect(longURL);
  res.render('/u/:shortURL', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user]
  const templateVars = {
    userID,
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  }
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});