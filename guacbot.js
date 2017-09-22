'use strict';

const config = require('./config.js');
const mysql = require('mysql');
const yargs = require('yargs');

/**
 * This function is used to detect an empty object
 * @param  {Object}  obj 
 * @return {Boolean}     True if empty; false otherwise
 */
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

// Config is now into a file called "config.js". 
const connection = mysql.createConnection({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

const argv = yargs.options({
  s: {
    demand: true,
    alias: 'server',
    describe: 'Server Name',
    string: true,
  },
}).help().alias('help', 'h').argv;

// Connect to the database
connection.connect();

// Selects the connection ID from the database.
let serverName = connection.escape(argv.server);
let queryString = `
  SELECT connection_id 
  FROM guacamole_connection 
  WHERE connection_name = ${serverName}`;

connection.query(queryString, function(err, rows) {
  if (err) {
    throw err;
  }

  if (isEmptyObject(rows)) {
    return console.log(`I can't find a server with the name: ${serverName}`);
  }

  for (let i = 0, l = rows.length; i < l; i++) {
    let cid = (rows[i].connection_id);

    // This converts the necessary information to base64.
    // The Nullstrings are the separators used. They look like "." in plaintext.
    let conString = (new Buffer(`${cid}\u0000c\u0000mysql`).toString('base64'));

    // This is the URL output for the connection.
    console.log(`The URL to access the ${serverName} server is:`);
    console.log(`${config.client_domain}${conString}`);
  }
});

connection.end();
