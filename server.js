const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3030;
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer');
const peer = ExpressPeerServer(server, {
  debug: true
});
const mysql = require("mysql")
const dotenv = require('dotenv');

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')
const cookieParser = require('cookie-parser');



// Authentication packages
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MYSQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');


dotenv.config({ path: './.env' })

const options = {
  host: process.env.DATABASE_HOST,    
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
};


const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,    // or add ip address
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("MYSQL connected...")
  }
});

const bodyParser = require('body-parser');
// body-parser middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/peerjs', peer);

// to access for frontend view
app.set('view engine', 'hbs');

// set static folder 
app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }))  // parsing url
app.use(express.json());
app.use(cookieParser());
const sessionStore = new MYSQLStore(options);
app.use(session({
  secret: 'ffkjjlreofw',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  // cookie: { secure: true }
}))
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
})




app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'))

passport.use(new LocalStrategy(
  function (username, password, done) {
    console.log(username)
    console.log(password);

    db.query('SELECT id, password FROM users WHERE name = ?', [username],
      function (err, result, fields) {
        if (err) { done(err) }

        if (result.length === 0) {
          done(null, false);
        }
        else {
          const hash = result[0].password.toString();
          bcrypt.compare(password, hash, function (err, response) {
            if (response === true) {
              return done(null, { user_id: result[0].id });
            } else {
              return done(null, false);
            }
          });
          // return done(null,true);
        }
      });
  }
));



app.get('/room', (req, res) => {
  res.redirect(uuidv4());
});
app.get('/:room', (req, res) => {
  res.render('room', { RoomId: req.params.room });
});


const botName = 'VChat Bot';


io.on("connection", (socket) => {
  // console.log('User connected');
  socket.on('newUser', (id, room, username) => {
    socket.join(room);
    socket.to(room).emit('userJoined', id);
    socket.on('message', message => {
      io.to(room).emit('createMessage', message, username)
    });
    socket.on('disconnect', () => {
      socket.to(room).emit('userDisconnect', id);
    });
  });


  socket.on('joinRoom', ({ username, room }) => {

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // welcome to current users
    socket.emit('message', formatMessage(botName, 'Welcome to VChat!'));
    // user when connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    //send user and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });


  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client  disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`));
      //send user and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

});
server.listen(port, () => {
  console.log("Server running on port : " + port);
})