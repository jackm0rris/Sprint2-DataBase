const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres', //This _should_ be your username, as it's the default one Postgres uses
  host: 'localhost',
  database: 'postgres', //This should be changed to reflect your actual database
  password: 'hockey91', //This should be changed to reflect the password you used when setting up Postgres
  port: 5432,
});

/**
 * Creates the database tables, if they do not already exist.
 */

async function createTable() {
  const createMoviesTableQuery = `
    CREATE TABLE IF NOT EXISTS movies (
      movie_id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      release_year INT NOT NULL,
      genre TEXT NOT NULL,
      director TEXT NOT NULL
    );
  `;
  
  const createCustomersTableQuery = `
    CREATE TABLE IF NOT EXISTS customers (
      customer_id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone_number TEXT NOT NULL
    );
  `;
  
  const createRentalsTableQuery = `
    CREATE TABLE IF NOT EXISTS rentals (
      rental_id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
      movie_id INT REFERENCES movies(movie_id),
      rental_date DATE NOT NULL,
      return_date DATE
    );
  `;
  
  await pool.query(createMoviesTableQuery);
  await pool.query(createCustomersTableQuery);
  await pool.query(createRentalsTableQuery);
}



/**
 * Inserts a new movie into the Movies table.
 * 
 * @param {string} title Title of the movie
 * @param {number} year Year the movie was released
 * @param {string} genre Genre of the movie
 * @param {string} director Director of the movie
 */
async function insertMovie(title, year, genre, director) {
  const query = `
    INSERT INTO movies (title, release_year, genre, director)
    VALUES ($1, $2, $3, $4);
  `;
  await pool.query(query, [title, year, genre, director]);
  console.log(`Movie "${title}" inserted successfully.`);
}


/**
 * Prints all movies in the database to the console
 */
async function displayMovies() {
  const result = await pool.query('SELECT * FROM movies');
  console.log('Movies:');
  result.rows.forEach(movie => {
    console.log(`${movie.movie_id}. ${movie.title} (${movie.release_year}) - ${movie.genre}, Directed by ${movie.director}`);
  });
}

/**
 * Updates a customer's email address.
 * 
 * @param {number} customerId ID of the customer
 * @param {string} newEmail New email address of the customer
 */
async function updateCustomerEmail(customerId, newEmail) {
  const query = `
    UPDATE customers
    SET email = $1
    WHERE customer_id = $2;
  `;
  await pool.query(query, [newEmail, customerId]);
  console.log(`Customer ${customerId}'s email updated to ${newEmail}.`);
}


/**
 * Removes a customer from the database along with their rental history.
 * 
 * @param {number} customerId ID of the customer to remove
 */
async function removeCustomer(customerId) {
  const query = `
    DELETE FROM customers
    WHERE customer_id = $1;
  `;
  await pool.query(query, [customerId]);
  console.log(`Customer ${customerId} and their rental history have been removed.`);
}

/**
 * Prints a help message to the console
 */
function printHelp() {
  console.log('Usage:');
  console.log('  insert <title> <year> <genre> <director> - Insert a movie');
  console.log('  show - Show all movies');
  console.log('  update <customer_id> <new_email> - Update a customer\'s email');
  console.log('  remove <customer_id> - Remove a customer from the database');
}

/**
 * Runs our CLI app to manage the movie rentals database
 */
async function runCLI() {
  await createTable();

  const args = process.argv.slice(2);
  switch (args[0]) {
    case 'insert':
      if (args.length !== 5) {
        printHelp();
        return;
      }
      await insertMovie(args[1], parseInt(args[2]), args[3], args[4]);
      break;
    case 'show':
      await displayMovies();
      break;
    case 'update':
      if (args.length !== 3) {
        printHelp();
        return;
      }
      await updateCustomerEmail(parseInt(args[1]), args[2]);
      break;
    case 'remove':
      if (args.length !== 2) {
        printHelp();
        return;
      }
      await removeCustomer(parseInt(args[1]));
      break;
    default:
      printHelp();
      break;
  }
};

runCLI();
