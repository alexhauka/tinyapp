const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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

// ----------------Helpers-----------------:

const generateRandomString = function() { // => used for generating 6 char random string to assign as user id in database
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};

const urlsForUser = function(id) {
  let output = {}
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      output[url] = urlDatabase[url]
    }
  }
  return output;
}


const getUserByEmail = function(email) { // => returns user object with related info
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

// ----------------------------------------:



app.get('/', (req, res) => { // => registers handler on root path ('/')
  res.send('Tiny URL Project root page!');
});

app.get('/login', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user];
  const templateVars = {
    userID,
    urls: urlDatabase
  };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const userInfo = getUserByEmail(req.body.email);
  if (!getUserByEmail(req.body.email)) {
    res.status(403).send('that email is not in our database.');
  } else if (userInfo.password !== req.body.password) {
    res.status(403).send('password does not match!');
  } else if (userInfo.password === req.body.password) {
    res.cookie('user_id', userInfo.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.cookies);
  res.redirect('/urls');
});



app.get('/urls', (req, res) => { // => page displaying urls
  let user = req.cookies['user_id'];
  if (!user) {
    res.redirect('/login')
  } else {
    let userID = users[user].id;
    let userURLS = urlsForUser(userID)
    const templateVars = {
      userID,
      urls: userURLS
    };
    res.render('urls_index', templateVars);
  }
});

app.get('/register', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user];
  const templateVars = {
    userID,
    urls: urlDatabase
  };
  res.render('urls_register', templateVars);
});



app.post('/register', (req, res) => {
  if (getUserByEmail(req.body.email)) {
    res.status(400).send('that email already exists!');
  } else if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('email or password cannot be empty!');
  } else {
    const randomID = generateRandomString();
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: hashedPassword
    };
    res.cookie('user_id', randomID);
    // console.log(users)
    res.redirect('/urls');
  }
});


app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

app.get('/urls/new', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user];
  if (!userID) {
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
  let user = req.cookies['user_id'];
  if (!user) {
    res.redirect('/login');
  } else {
    let userID = users[user].id;
    let userURLS = urlsForUser(userID);
    const templateVars = {
      userID,
      urls: userURLS,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
    };
    res.render('urls_show', templateVars);
  }
});


app.post('/urls/:shortURL/delete', (req, res) => {
  let user = req.cookies['user_id'];
  let userID = users[user].id;
  let userURLS = urlsForUser(userID);
  if (userID === userURLS[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.send('not the owner: cannot delete.')
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//---------------TO DO:---------------
// RENAME VARIABLES THAT OVERLAP (userID in cookie handling 'laps with userID key in user object) THIS WILL BREAK EVERTHIIIIIIIING