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
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('urls_index', templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('urls_register', templateVars);
})

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
  // console.log(urlDatabase)
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('urls_new', templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.redirect(longURL);
  res.render('/u/:shortURL', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
  };
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