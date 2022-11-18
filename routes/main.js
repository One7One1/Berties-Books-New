module.exports = function (app, shopData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login')
        } else { next(); }
    }

    const { check, validationResult } = require('express-validator');

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search',
        [check('keyword').notEmpty()],
        function (req, res) {
            res.render("search.ejs", shopData);
        });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });
    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);
    });
    app.post('/registered',
        //Form validation being done
        [check('email').isEmail(),
        check('pass').isLength({ min: 8 }),
        check('pass').isStrongPassword([{
            minLength: 8, minLowercase: 1, minUppercase: 1,
            minNumbers: 1, minSymbols: 1, returnScore: false,
            pointsPerUnique: 1, pointsPerRepeat: 0.5, pointsForContainingLower: 10,
            pointsForContainingUpper: 10, pointsForContainingNumber: 10,
            pointsForContainingSymbol: 10
        }]),
        check('last').notEmpty(),
        check('last').isAlpha('en-US', { ignore: '\s' }),
        check('first').notEmpty(),
        check('first').isAlpha('en-US', { ignore: '\s' }),
        check('user').notEmpty()],
        function (req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./register');
            }
            else {
                // saving data in database
                const bcrypt = require('bcrypt');
                const saltRounds = 10;
                const plainPassword = req.body.pass;
                bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
                    // Store hashed password in your database.
                    let sqlquery = "INSERT INTO myuser (email, hashed, last, first, username) VALUES (?,?,?,?,?);";
                    let myList = [req.sanitize(req.body.email),
                        hashedPassword,
                    req.sanitize(req.body.last),
                    req.sanitize(req.body.first),
                    req.sanitize(req.body.user),
                    req.sanitize(req.body.pass)];
                    db.query(sqlquery, myList, (err, result) => {
                        if (err) {
                            res.redirect('./');
                        }
                        else {
                            result = 'Hello ' + req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) + ' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email);
                            result += 'Your password is: ' + req.sanitize(req.body.pass) + ' and your hashed password is: ' + hashedPassword + '<a href=' + './' + '>Home</a>';
                            res.send(result);
                        }
                    });
                })
            }
                                                                                          
        });
    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }

            let newData = Object.assign({}, shopData, { availableBooks: result });
            res.render("list.ejs", newData);
        });
    });

    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
    });

    app.post('/bookadded',
        [check('name').notEmpty(),
        check('price').isNumeric()],
        function (req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./addbook');
            }
            else {
            // saving data in database
            let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
            // execute sql query
            let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                else
                    res.send(' This book is added to database, Name: ' + req.sanitize(req.body.name) + 'Price: ' + req.sanitize(req.body.price) + '<a href=' + './' + '>Home</a>');
            });
        } 
    });

    app.get('/bargainbooks', function (req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("bargains.ejs", newData)
        });
    });

    app.get('/listusers', function (req, res) {
        //Obtaining all the user details from the database
        let sqlquery = "SELECT * FROM myuser";
        // Execute SQL Query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }

            let userData = Object.assign({}, shopData, { availabledata: result });
            res.render("listusers.ejs", userData);

        });
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', shopData);
    });

    app.post('/loggedin',
        //Check Validation
        check('pass').isLength({ min: 8 }),
        check('pass').isStrongPassword([{
            minLength: 8, minLowercase: 1, minUppercase: 1,
            minNumbers: 1, minSymbols: 1, returnScore: false,
            pointsPerUnique: 1, pointsPerRepeat: 0.5, pointsForContainingLower: 10,
            pointsForContainingUpper: 10, pointsForContainingNumber: 10,
            pointsForContainingSymbol: 10
        }]),
        check('user').notEmpty(),
        check('user').isAlphanumeric('en-US', { ignore: '\s' }),
        function (req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./login');
            }
            else {
            let bcrypt = require('bcrypt');
            let sqlquery = 'SELECT hashed FROM myuser WHERE username = ?';
            let data_passed = req.sanitize([req.body.user]);
            console.log(req.body.user);
            db.query(sqlquery, data_passed, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(result);
                    bcrypt.compare(req.sanitize(req.body.pass), result[0].hashed, function (err, second_r) {
                        if (err) {
                            //checking error
                            console.log(err);
                        }
                        else if (second_r == true) {

                            req.session.userId = req.sanitize(req.body.user);
                            //displaying message
                            res.send('Password Correct! <a href=' + './' + '>Home</a>');
                        }
                        else {
                            // Displaying message
                            res.send('Password Incorrect! <a href=' + './' + '>Home</a>');
                        }
                    });
                }
            });
        } 
    });

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
        })
    })
}
