const generateRandomString = function() { // => used for generating 6 char random string to assign as user id in database
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
};

const urlsForUser = function(id, db) {
  let output = {};
  for (const url in db) {
    if (db[url].userID === id) {
      output[url] = db[url];
    }
  }
  return output;
};


const getUserByEmail = function(searchEmail, db) { // => returns user object with related info
  for (const user in db) {
    if (db[user].email === searchEmail) {
      return user;
    }
  }
};

module.exports = { generateRandomString, urlsForUser, getUserByEmail };