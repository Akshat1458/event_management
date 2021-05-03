const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var currentUser = "";
var loggedIn = false;
var userid = -1;

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

const mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Maths@321",
  database: "eventManagement",
  multipleStatements: true
});

mysqlConnection.connect(function(err) {
  if (!err) {
    console.log("connected");
  } else {
    console.log(err);
  }
});

app.get("/", function(req, res) {
  res.render("login",{showAlert:"0"});
});


app.post("/", function(req, res) {
  let user = req.body.flexRadioDefault;
  let id = req.body.id;
  let password = req.body.password;

  if (user === "participant") {
    mysqlConnection.query("SELECT password from participants where p_id= ? ", id, function(err, result) {
      if (err)
        console.log(err);
      if (result.length === 0){
        res.render("login",{showAlert: "1"});
      }

      else if (result[0].password != password){
        res.render("login",{showAlert:"2"});
      }
      else {
        loggedIn = true;
        userid = id;
        currentUser = "participant";
        res.redirect("/home");
      }

    });
  } else if (user === "organiser") {
    mysqlConnection.query("SELECT password from organisers where o_id= ? ", id, function(err, result) {
      if (err)
        console.log(err);
      if (result.length === 0)
        res.render("login",{showAlert: "1"});
      else if (result[0].password != password)
        res.render("login",{showAlert:"2"});
      else {
        loggedIn = true;
        userid = id;
        currentUser = "organiser";
        res.redirect("/home");
      }

    });
  }

});

app.get("/newuser", function(req, res) {
  res.render("newUser", {
    showAlert: "0",
    id: 0
  });
});

app.post("/newuser", function(req, res) {
  let user = req.body.flexRadioDefault;
  let data = {
    name: req.body.personName,
    gender: req.body.gender,
    email: req.body.email,
    mobile: req.body.mobile,
    age: req.body.age,
    address: req.body.address,
    country: req.body.country,
    state: req.body.state,
    pin: req.body.pin,
    password: req.body.password
  };

  if (user === "organiser") {
    mysqlConnection.query("INSERT INTO organisers SET ? ", data, function(err, result) {
      if (err)
        console.log(err);
    });
    mysqlConnection.query("SELECT max(o_id) as maxm from organisers ", function(err, result) {
      if (err)
        console.log(err);
      res.render("newUser", {
        showAlert: "1",
        id: result[0].maxm
      });
    });
  } else if (user === "participant") {
    mysqlConnection.query("INSERT INTO participants SET ? ", data, function(err, result) {
      if (err)
        console.log(err);
    });
    mysqlConnection.query("SELECT max(p_id) as maxm from participants ", function(err, result) {
      if (err)
        console.log(err);
      res.render("newUser", {
        showAlert: "1",
        id: result[0].maxm
      });
    });
  }
});


app.get("/home", function(req, res) {
  if (!loggedIn)
    res.redirect("/");
  res.render("home", {
    user: currentUser
  });
});


app.get("/newevent", function(req, res) {
  if(!loggedIn)
    res.redirect("/");
  else
    res.render("newevent",{user:currentUser});
});

app.post("/newevent", function(req, res) {

  let data = {
    name: req.body.name,
    org_id: userid,
    date: req.body.date,
    time: req.body.time,
    venue: req.body.venue,
    descrip: req.body.desc
  };
  mysqlConnection.query("INSERT INTO events SET ? ", data, function(err, result) {
    if (err)
      console.log(err);
  });
  res.redirect("/home");
});

app.get("/myeventsorganiser",function(req,res){
  if(!loggedIn)
    res.redirect("/");
  else{
    mysqlConnection.query("SELECT *from events where org_id=?", userid, function(err, result) {
      if (err)
        console.log(err);
      else{
      res.render("myevents", {
        user: currentUser,
        data: result
      });
      }
    });
  }
});

app.get("/myeventsparticipant",function(req,res){
  if (!loggedIn)
    res.redirect("/");
  else{
    mysqlConnection.query("SELECT *from events,registration where registration.e_id=events.e_id and registration.p_id=?", userid, function(err, result) {
      if (err)
        console.log(err);
      else{
      res.render("myevents", {
        user: currentUser,
        data: result
      });
      }
    });
  }
});

app.get("/cancelregistration/:id",function(req,res){
  mysqlConnection.query("DELETE FROM registration WHERE e_id = ? and p_id=?", [req.params.id,userid], function(err, result) {
    if (err)
      console.log(err);
    res.redirect("/myeventsparticipant");
  });

});

app.get("/events", function(req, res) {
  if (!loggedIn)
    res.redirect("/");
  else {
    mysqlConnection.query("SELECT * FROM events", function(err, result) {
      if (err) {
        console.log(err);
        return;
      }

      res.render("event", {
        user: currentUser,
        data: result
      });
    });
  }
});


app.get("/register/:id", function(req, res) {

  let data = {
    e_id: req.params.id,
    p_id: userid
  };

  mysqlConnection.query("INSERT into registration SET ? ", data, function(err, result) {
    if (err)
      console.log(err);
    res.redirect("/events");
  });
});

app.get("/participants/:id", function(req, res) {

  mysqlConnection.query("SELECT name from participants,registration where registration.p_id=participants.p_id and registration.e_id=?", req.params.id, function(err, result) {
    if (err)
      console.log(err);
    res.render("displayParticipants", {
      user: currentUser,
      data: result
    });
  });
});

app.get("/delete/:id", function(req, res) {
  mysqlConnection.query("DELETE FROM events WHERE e_id = ? ", req.params.id, function(err, result) {
    if (err)
      console.log(err);
    res.redirect("/myeventsorganiser");
  });

});

app.get("/update/:id", function(req, res) {
  mysqlConnection.query("SELECT * FROM events where e_id= ? ", req.params.id, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    res.render("update", {
      data: result,
      user:currentUser
    });
  });
});

app.post("/update/:id",function(req,res){

  mysqlConnection.query("UPDATE events SET name=?,  date=?, time=?, venue=?, descrip=? where e_id=?",
    [req.body.name, req.body.date, req.body.time, req.body.venue, req.body.desc, req.params.id],
    function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      res.redirect("/myeventsorganiser");
    });


});

app.get("/dashboard", function(req, res) {
  if (!loggedIn)
    res.redirect("/");
  var data = {};
  if (currentUser === "organiser") {
    mysqlConnection.query("SELECT * FROM organisers where o_id= ? ", userid, function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      res.render("dashboard", {
        user: currentUser,
        data: result
      });

    });
  } else if (currentUser === "participant") {
    mysqlConnection.query("SELECT * FROM participants where p_id= ? ", userid, function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      res.render("dashboard", {
        user: currentUser,
        data: result
      });

    });
  }
});

app.get("/updateinfo", function(req, res) {
  if (currentUser === "participant") {
    mysqlConnection.query("SELECT * FROM participants where p_id= ? ", userid, function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      res.render("updateinfo", {
        user: currentUser,
        data: result
      });
    });
  } else if (currentUser === "organiser") {
    mysqlConnection.query("SELECT * FROM organisers where o_id= ? ", userid, function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      res.render("updateinfo", {
        user: currentUser,
        data: result
      });
    });
  }
});

app.post("/updateinfo", function(req, res) {
  if (currentUser === "participant") {
    mysqlConnection.query("UPDATE participants SET name=?,  email=?, mobile=?, age=?, address=? ,country=?, state=?, pin=? where p_id=?",
      [req.body.name, req.body.email, req.body.mobile, req.body.age, req.body.address, req.body.country, req.body.state, req.body.pin, userid],
      function(err, result) {
        if (err) {
          console.log(err);
          return;
        }

      });
  } else if (currentUser === "organiser") {
    mysqlConnection.query("UPDATE organisers SET name=?,  email=?, mobile=?, age=?, address=? ,country=?, state=?, pin=? where o_id=?",
      [req.body.name, req.body.email, req.body.mobile, req.body.age, req.body.address, req.body.country, req.body.state, req.body.pin, userid],
      function(err, result) {
        if (err) {
          console.log(err);
          return;
        }
      });
  }
  res.redirect("/dashboard");

});



app.get("/logout", function(req, res) {
  userid = -1;
  currentUser = "";
  loggedIn = false;
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
