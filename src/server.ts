import express from "express";
import cors from "cors";
import { getScoresByLevel, getLevels, saveLevel, getUnplayedLevel, generateLevel } from "./airtable.js";
import passport from "passport"
import { BasicStrategy } from "passport-http"
import { SINERIDER_API_SECRET } from "./config.js";

const app = express();

// setup json
app.use(express.json());
// should fix cors issues
app.use(cors());

passport.use(new BasicStrategy(
  function (username, password, done) {
    if (username == "hackclub" && password == SINERIDER_API_SECRET) {
      return done(null, "hackclub");
    } else {
      // Error
      return done(null, false);
    }
  }
));

const port = process.env.PORT ?? 3000;

app.get(
  "/",
  (req, res) => {
    res.send("I am alive");
  });

app.get("/level/:name/:highscoreType", (req, res) => {
  const levelName = req.params.name;
  const highscoreType = req.params.highscoreType;
  getScoresByLevel(levelName, highscoreType)
    .then((scores) => res.json({ success: true, scores }))
    .catch((err) => res.json({ success: false, reason: err }));
});

app.get("/levels", (req, res) => {
  getLevels()
  .then((levels) => {
    return res.json({ success: true, levels: Array.from(levels) })
  })
  .catch((err) => res.json({ success: false, reason: err }));

})

// NOTE: Authentication required!
app.get("/daily",
  passport.authenticate('basic', { session: false }),
  (_, res) => {
    getUnplayedLevel()
      .then(level => res.json({ level, success: true }))
      .catch((err) => res.json({ success: false }));
  });

// NOTE: Authentication required!
app.get("/generate",
  passport.authenticate('basic', { session: false }),
  async (req, res) => {
    const newLevel = await generateLevel();
    saveLevel(newLevel)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  });

app.listen(port, () =>
  console.log(`Doing some black magic on port ${port}...`)
);