require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const adminSecretKey =process.env.ADMIN_SECRET_KEY;
const express = require('express')
const ejs = require('ejs');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const db = mongoose.connection;
const MongoStore = require('connect-mongo');
const secret = require('./config/secret');
const bodyParser = require("body-parser");
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const Auth = require('./config/auth');
const { ensureActive } = require('./config/auth');



console.log(secret.port);
console.log("Database URL:", secret.databaseURL);
if (!secret.databaseURL) {
    console.error("❌ Error: databaseURL is undefined. Check secret.js or .env file.");
    process.exit(1);
}
mongoose.connect(secret.databaseURL);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are already connected to the server database")
});


app.use(session({
  secret: process.env.SESSION_SECRET || 'f2a92c8d748fbf1ab63a7e1b5f95d9c4e63ad3d87f7c28f3048f204df9d292b3',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: secret.databaseURL,
    ttl: 24 * 60 * 60 // 1 day
}),
  cookie: {
      secure: process.env.NODE_ENV === 'development' ? false : true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(Auth.setAuthStatus);
app.use(express.json());
  
app.set('view engine', 'ejs');
//configure your middleware for body parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', express.static('public'));
app.use('/', express.static('views'));

const pageRoutes = require('./controllers/pageRoutes');
app.use('/', pageRoutes);
const postRoutes = require('./controllers/postRoutes');
app.use('/', postRoutes);
const userRoutes = require('./controllers/userRoutes');
app.use('/', userRoutes);
const adminRoutes = require( './controllers/adminRoute');
app.use('/', adminRoutes );
const cartRoutes = require('./controllers/cartRoutes');
app.use('/', cartRoutes);
const categoryRoutes = require('./controllers/categoryRoutes');
app.use('/', categoryRoutes);
const paymentRoutes = require('./controllers/paymentRoutes');
app.use('/', paymentRoutes);


app.post('/logout', ensureActive, (req, res) => {
  const redirectPath = req.user?.role === 'admin' ? '/admin' : '/';
  req.logout(() => {
      req.session.destroy((err) => {
          if (err) {
              console.error('Logout error:', err);
              return res.status(500).send('Logout failed');
          }
          res.redirect(redirectPath);
      });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Authentication required',
    isAuthenticated: req.isAuthenticated() 
  });
});

app.listen(port, function(){
    console.log("we are connected to port "  + port )
})