const express = require("express");
const app = express();
const mysql = require("mysql");
const PORT = process.env.port || 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const router = express.Router();
const path = require("path");

/*const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
});*/

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "cherrys6s~",
  database: "example2",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
//**************** */
app.use(express.static("public"));
const storage = multer.diskStorage({
  destination: "../client/public/img/",
  filename: function (req, file, cb) {
    cb(null, "imgfile" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
});

app.listen(PORT, () => {
  console.log(`running on port ${PORT}`);
});

app.post("/upload", upload.single("img"), function (req, res, next) {
  //const sql = "insert into novels (image) values (?)";
  //const filename = req.file.filename;
  //console.log(filename);
  res.send({
    fileName: req.file.filename,
  });
});
//************** */
app.post("/api/insert", (req, res) => {
  const id = req.body.id;
  const disN = req.body.displayName;
  const sq = "insert into user (id,displayName) values (?,?)";
  db.query("select * from user where id = ?", [id], (err, result) => {
    if (result.length < 1) {
      db.query(sq, [id, disN], (err, result2) => {
        res.send(true);
      });
    } else {
      res.send(false);
    }
  });
});

app.get("/api/getnovels", (req, res) => {
  const sql = "select * from novels";
  db.query(sql, (err, result) => {
    res.send(result);
  });
});

app.post("/api/create", (req, res) => {
  const title = req.body.title;
  const plot = req.body.plot;
  const id = req.body.id;
  const displayName = req.body.displayName;
  var image;
  if (req.body.image) {
    image = req.body.image;
  } else {
    image = "";
  }
  const createsql =
    "create table `?` (idx int auto_increment primary key, id varchar(50), subtitle varchar(50), content TEXT, dateOfUpdate varchar(200))";
  /*
  db.query("select displayName from user where id = ?", [id], (err, result) => {
    const disName = result[0].displayName;
  });*/

  db.query(
    "select * from novels where title = ?",
    [title],
    (err, selresult) => {
      if (selresult.length < 1) {
        db.query(
          "select displayName from user where id = ?",
          [id],
          (err, result) => {
            const disName = result[0].displayName;
            db.query(
              "insert into novels (title, plot, id, displayName,image) values (?,?,?, ?,?)",
              [title, plot, id, disName, image],
              (err, insresult) => {
                db.query(createsql, [title], (err, createresult) => {
                  res.send(false);
                });
              }
            );
          }
        );
      } else {
        res.send(true);
      }
    }
  );

  /*db.query(
    "select * from novels where title = ?",
    [title],
    (err, selresult) => {
      if (selresult.length < 1) {
        db.query(
          "insert into novels (title, plot, id, displayName,image) values (?,?,?, ?,?)",
          [title, plot, id, displayName, image],
          (err, insresult) => {
            db.query(createsql, [title], (err, createresult) => {
              res.send(false);
            });
          }
        );
      } else {
        res.send(true);
      }
    }
  );*/
});

app.get("/api/novelabout", (req, res) => {
  const title = req.query[0];
  db.query("select subtitle,dateOfUpdate from `?`", [title], (err, result1) => {
    db.query(
      "select title,plot,id,displayName, image from novels where title = ?",
      [title],
      (err, result2) => {
        res.send([result1, result2]);
      }
    );
  });
});

app.get("/api/novelphoto", (req, res) => {
  const title = req.query[0];
  const sql = "select image from novels where title = ?";
  db.query(sql, [title], (err, result) => {
    res.send(result);
  });
});

app.post("/noveladd", (req, res) => {
  const subtitle = req.body.subtitle;
  const content = req.body.content;
  const title = req.body.title;
  const id = req.body.id;
  const dateOfUpdate = Date.now();
  const sql =
    "insert into `?` (id,subtitle,content,dateOfUpdate) values (?,?,?,?)";
  db.query(sql, [title, id, subtitle, content, dateOfUpdate], (err, result) => {
    res.send(true);
  });
});

app.post("/api/deletenovelsub", (req, res) => {
  const dateOfUpdate = req.body.dateOfUpdate;
  const title = req.body.title;
  const sql = "delete from `?` where dateOfUpdate = ?";
  db.query(sql, [title, dateOfUpdate], (err, result) => {
    res.send(result);
  });
});

app.get("/api/novelupdate", (req, res) => {
  const title = req.query[0];
  const dateOfUpdate = req.query[1];
  const sql = "select subtitle,content from `?` where dateOfUpdate = ?";
  db.query(sql, [title, dateOfUpdate], (err, result) => {
    res.send(result);
  });
});

app.post("/novelupdate", (req, res) => {
  const title = req.body.title;
  const dateOfUpdate = req.body.dateOfUpdate;
  const subtitle = req.body.getValue.title;
  const content = req.body.getValue.content;
  const originContent = req.body.originContent;
  const sql =
    "update `?` set subtitle = ?, content = replace(content, ?, ?) where dateOfUpdate = ?";
  db.query(
    sql,
    [title, subtitle, originContent, content, dateOfUpdate],
    (err, result) => {
      if (result) {
        res.send(true);
      }
    }
  );
});

app.get("/api/novelshowcontent", (req, res) => {
  const title = req.query[0];
  const dateOfUpdate = req.query[1];
  const sql = "select content from `?` where dateOfUpdate = ?";
  db.query(sql, [title, dateOfUpdate], (err, result) => {
    res.send(result);
  });
});

app.get("/api/userinfo", (req, res) => {
  const id = req.query[0];
  const sql = "select displayName from user where id = ?";
  db.query(sql, [id], (err, result) => {
    res.send(result);
  });
});

app.post("/userinfoupdate", (req, res) => {
  const id = req.body.uidAndDisplayName[0];
  const displayName = req.body.uidAndDisplayName[1];
  const sql = "update user set displayName = ? where id =?";
  db.query(sql, [displayName, id], (err, result) => {
    if (result) {
      db.query(
        "update novels set displayName = ? where id = ?",
        [displayName, id],
        (err, result2) => {
          if (result2) {
            res.send(true);
          }
        }
      );
    } else {
      res.send(false);
    }
  });
});
