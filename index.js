const express = require("express");
const app = express();
const mysql = require("mysql");
const PORT = process.env.port || 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
/*const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
});*/

app.use(express.static(path.resolve(__dirname, "./client/build")));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME,
});

console.log(process.env.DB_HOST);

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
app.post("/insert", (req, res) => {
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

app.get("/getnovels", (req, res) => {
  const sql = "select * from novels";
  db.query(sql, (err, result) => {
    res.send(result);
  });
});

app.post("/create", (req, res) => {
  const title = req.body.title;
  const plot = req.body.plot;
  const id = req.body.id;
  const displayName = req.body.displayName;
  let disName;
  var image;
  if (req.body.image) {
    image = req.body.image;
  } else {
    image = "";
  }
  const createsql =
    "create table `?` (idx int auto_increment primary key, id varchar(50), subtitle varchar(50), content TEXT, dateOfUpdate varchar(200))";
  db.query(
    "select * from novels where title = ?",
    [title],
    (err, selresult) => {
      if (selresult.length < 1) {
        db.query(
          "select displayName from user where id = ?",
          [id],
          (err, result) => {
            disName = result[0].displayName;
            console.log(disName);
            db.query(
              "insert into novels (title, plot, id , displayName, image) values (?,?,?,?,?)",
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
});

app.get("/novelabout", (req, res) => {
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
  let today = new Date();
  let year = String(today.getFullYear());
  let month = String(today.getMonth() + 1).padStart(2, 0);
  let date = String(today.getDate()).padStart(2, 0);
  let hours = String(today.getHours()).padStart(2, 0);
  let minutes = String(today.getMinutes()).padStart(2, 0);
  let sec = String(today.getSeconds()).padStart(2, 0);
  let millisec = String(today.getMilliseconds()).padStart(3, 0);
  const day = year + month + date + hours + minutes + sec + millisec;
  const dateOfUpdate = Number(day);
  const sql =
    "insert into `?` (id,subtitle,content,dateOfUpdate) values (?,?,?,?)";
  db.query(sql, [title, id, subtitle, content, dateOfUpdate], (err, result) => {
    db.query(
      "update novels set recentupdate = ? where title = ?",
      [dateOfUpdate, title],
      (err, result2) => {
        res.send(true);
      }
    );
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

app.get("/novelupdate", (req, res) => {
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

app.get("/novelshowcontent", (req, res) => {
  const title = req.query[0];
  const dateOfUpdate = req.query[1];
  const sql = "select idx,content from `?` where dateOfUpdate = ?";
  const sql2 = "select idx from `?` order by idx desc limit 1";
  db.query(sql, [title, dateOfUpdate], (err, result) => {
    db.query(sql2, [title], (err, result2) => {
      const data = [result, result2];
      res.send(data);
    });
  });
});

app.get("/userinfo", (req, res) => {
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

app.get("/recentlynovels", (req, res) => {
  const sql =
    "select title,plot,image from novels where recentupdate is not null order by recentupdate desc limit 5;";
  db.query(sql, (err, result) => {
    res.send(result);
  });
});

app.post("/prev", (req, res) => {
  const idx = req.body.SendData[1] - 1;
  const title = req.body.SendData[0];
  const sql = "select dateOfUpdate from `?` where idx = ?";
  db.query(sql, [title, idx], (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(false);
    }
  });
});

app.post("/next", (req, res) => {
  const title = req.body.SendData[0];
  const idx = req.body.SendData[1] + 1;
  const sql = "select dateOfUpdate from `?` where idx = ?";
  db.query(sql, [title, idx], (err, result) => {
    res.send(result);
  });
});
