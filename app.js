const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server is Running at http://localhost:5000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertMatchObjectToResponseObject = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

const convertPlayerMatchScoreObjectToResponseObject = (object) => {
  return {
    playerMatchId: object.player_match_id,
    playerId: object.player_id,
    matchId: object.match_id,
    score: object.score,
    fours: object.fours,
    sixes: object.sixes,
  };
};

///1.get players

app.get("/players/", async (request, response) => {
  const allPlayersQuery = `
    SELECT * 
    FROM 
    player_details`;
  const playerArray = await db.all(allPlayersQuery);
  response.send(
    playerArray.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

//2. get specified player_id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
  SELECT * 
  FROM
  player_details
  WHERE 
  player_id = ${playerId}`;
  const player = await db.get(getPlayer);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//3. put put = Update the details

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
  UPDATE 
  player_details
  SET 
  player_name = '${playerName}'
  WHERE 
  player_id = ${playerId}`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

//4. get details using joins

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    * 
    FROM 
    match_details
    WHERE 
    match_id = ${matchId}`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(match));
});

//5. get players using join
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
    * 
    FROM 
    match_details 
     NATURAL JOIN 
    player_match_score 
    WHERE 
    player_id = ${playerId}`;

  const playerArray = await db.all(getPlayerMatchQuery);
  response.send(
    playerArray.map((each) => convertMatchObjectToResponseObject(each))
  );
});

//6. get matches id Api using natural join

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchesQuery = `
    SELECT 
    * 
    FROM 
    player_match_score
    NATURAL JOIN 
    player_details
    WHERE
    match_id =${matchId}`;
  const matchArray = await db.all(getMatchesQuery);
  response.send(
    matchArray.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

///7. specified player

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playersQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score)AS totalScore,
    SUM(fours)AS totalFours,
    SUM(sixes)AS totalSixes
    FROM 
    player_match_score
    NATURAL JOIN 
    player_details
    WHERE 
    player_id = ${playerId}`;
  const player = await db.get(playersQuery);
  response.send(player);
});

module.exports = app;
