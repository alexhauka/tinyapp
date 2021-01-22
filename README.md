# TinyApp Project

TinyApp! is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["screenshot of URLs page"](https://github.com/alexhauka/tinyapp/blob/master/docs/urls-page.png?raw=true)
!["screenshot of URL control page"](https://github.com/alexhauka/tinyapp/blob/master/docs/url-control-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Features

- Tracks unique visits and total visits for each shortURL, visible on the shortURLs control page.
- Uses method-override to keep it RESTful!