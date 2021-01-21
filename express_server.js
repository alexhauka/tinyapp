const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, urlsForUser, getUserByEmail } = require('./helpers');
const app = express();
const PORT = 8080;
// const dateOptions = {day: 'numeric', month: 'numeric', year: 'numeric'};

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


const testPassword1 = bcrypt.hashSync("purple-monkey-dinosaur", 10)
const testPassword2 = bcrypt.hashSync("dishwasher-funk", 10)
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
    return res.redirect('/login')
  }
});


// THIS ONE IS BEST, USE AS MODEL FOR REST
app.get('/login', (req, res) => {  // => template vars defaults to undefined if server is reset
  const templateVars = {
    userID: undefined,
    urls: urlDatabase
  };
  if (req.session.user_id) {
    templateVars.userID = users[req.session.user_id] // => sets the userID to matching cookie for session
    return res.render('urls_login', templateVars);
  } else {
    return res.render('urls_login', templateVars)
  }
});

app.post('/login', (req, res) => {
  const userInfo = getUserByEmail(req.body.email, users);
  if (users[userInfo].email !== req.body.email) {
    return res.sendStatus(403);
  } else if (!bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    return res.sendStatus(403);
  } else if (bcrypt.compareSync(req.body.password, users[userInfo].password)) {
    req.session.user_id = users[userInfo].id;
    return res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
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
    res.sendStatus(400);
  } else if (req.body.email === "" || req.body.password === "") {
    res.sendStatus(400);
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
  const short = generateRandomString();
  const dateStamp = new Date(Date.now())
  const dateFormatted = dateStamp.toLocaleString('en-US');
  urlDatabase[short] = {
    userID : userKey,
    longURL : req.body.longURL,
    dateFormatted,
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


app.get('*', (req, res) => {
  return res.redirect('/login')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//---------------TO DO:---------------
// change page templates to hide or show pertinent info depending on session status