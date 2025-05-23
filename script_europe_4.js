const playersCountries = JSON.parse(localStorage.getItem("playersCountries")) || { 1: [], 2: [], 3: [], 4: [] };
const gameData = JSON.parse(localStorage.getItem("gameData")) || { pawnsCount: 3, playerNames: [] };
const playerNames = gameData.playerNames;
const SkipPawns = gameData.skipPawns;

// Променлива за следене на броя пулове на всеки играч
const maxPawnsPerPlayer = gameData.pawnsCount;
const playerPawnsCount = { 1: maxPawnsPerPlayer, 2: maxPawnsPerPlayer, 3: maxPawnsPerPlayer, 4: maxPawnsPerPlayer };

let selectedStartPoint = null;
let isMovingPhase = false; // Следене на фазата на преместване
let currentPlayer = 1; // Следене на текущия играч
let captureOptions = []; // Опции за кацане при улавяне
let dinamicCaptureOptions = []; // Опции за кацане при улавяне, когато SkipPawns е true
let oldPawnIds = [];
let X = false; // Променлива, указваща дали е необходимо прескачане
let Y = false; // Променлива, указваща дали е направен изборът за кацане
let isACapitalBeingAttacked = false;
let atacker = 0;
let defender = 0;
let defenderMoveMade = false;
let pawnsHaveBeenSentOver = false;
let startSentOver = false;
let pawnsSentOver = 0;
let pawnsGrrr = 0;
let captureIsHappening = false;
let startingPoint = null;
let DestinationPoint = null;
let dontAddMorePawns = false;
let doubleSkipPossibility = false;
let pawnsInfoBeforeHighlight = {};
let pawnsChoiceStarted = false;
let ValidChoice = null;
let skippingEnded = false;
let endPlacing = false;
let startingPointId = null;
let yellowPoints = [];
let PunishRemove = false;
let PunishToRemove = false;
let TheIdOfThePreviosPoint = null;
let PointWithAlreadyAttackedPawns=null;
let DemocraticSending = false;
let DemocraticSendingAmmount = 0;
let DemocraticallySentPawns = 0;
let DemocraticReciever = 0;
let ignoreFirst = false;
let movingHasStarted=false;

const players = {
  1: { color: "blue", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[1], capitalsNum: 2 },
  2: { color: "green", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[2], capitalsNum: 2 },
  3: { color: "red", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[3], capitalsNum: 2 },
  4: { color: "orange", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[4], capitalsNum: 2 }
};

let beingAttacked = [false, false, false, false];
let punishPoints = [0, 0, 0, 0];
let bannedPlayers = [false, false, false, false];
let TheAttacker = [0, 0, 0, 0]; // New array to store who's attacking each player

function highlightConnections(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    console.error(`Точка с id ${pointId} не е намерена`);
    return;
  }

  dinamicCaptureOptions = [] // Empty the array;
  point.connections.forEach(connectionId => {
    const connectedPoint = pointsData.find(p => p.id === connectionId);
    if (connectedPoint && connectionId !== pointId && !oldPawnIds.includes(connectionId) && pawnsOnPoints[connectionId].pawns === 0) {
      dinamicCaptureOptions.push(connectionId);
      const circle = document.getElementById(connectionId);
      if (circle) {
        circle.setAttribute("fill", "yellow");
        console.log(`Point ${connectionId} colored yellow`);
        yellowPoints.push(connectionId);
        circle.setAttribute("r", connectedPoint.capital ? 22 : 10);
      }

    }
  });
}

// Прави връзките двупосочни
function makeConnectionsBidirectional(points) {
  const pointMap = {}; // Карта на точките по ID за лесно намиране
  points.forEach(point => pointMap[point.id] = point);
  points.forEach(point => {
    point.connections.forEach(connectionId => {
      const connectedPoint = pointMap[connectionId];
      // Ако свързаната точка няма тази точка в своите връзки, добавете я
      if (connectedPoint && !connectedPoint.connections.includes(point.id)) {
        connectedPoint.connections.push(point.id);
      }
    });
    // Определяне на оригиналния собственик на точката
    if (point.country) {
      if (players[1].countries.includes(point.country)) {
        point.OriginalOwner = 1; // Player 1 is the original owner
      } else if (players[2].countries.includes(point.country)) {
        point.OriginalOwner = 2; // Player 2 is the original owner
      } else if (players[3].countries.includes(point.country)) {
        point.OriginalOwner = 3; // Player 3 is the original owner
      } else if (players[4].countries.includes(point.country)) {
        point.OriginalOwner = 4; // Player 3 is the original owner
      } else {
        point.OriginalOwner = 0; // No original owner
      }
    }
  });
}
function logPointsData() {
  console.log("Points Data for Debugging:");
  pointsData.forEach(point => {
    console.log(point);
  });
}

function checkCapitalsOwnership(playerId) {
  // Log the start of the ownership check for the player
  console.log(`Checking capitals ownership for player ${playerId}`);
  
  // Filter capitals originally owned by the player and log the count
  const capitals = pointsData.filter(point => point.capital && point.OriginalOwner === playerId);
  console.log(`Found ${capitals.length} capitals originally owned by player ${playerId}`);

  // Iterate through each capital
  for (const capital of capitals) {
    // Log the capital being checked and its country
    console.log(`Checking capital: ${capital.id}, country: ${capital.country}`);
    
    // Check if there are pawns on the capital and log the details
    if (pawnsOnPoints[capital.id].owner) {
      console.log(`Capital ${capital.id} has pawns owned by player ${pawnsOnPoints[capital.id].owner}`);
      
      // Check if the pawns belong to an opponent and log if under attack
      if (pawnsOnPoints[capital.id].owner !== capital.OriginalOwner) {
        console.log(`Capital ${capital.id} is under attack by player ${pawnsOnPoints[capital.id].owner}`);
        return { underAttack: true, capital: capital };
      }
    } else {
      console.log(`Capital ${capital.id} has no pawns on it`);
    }
  }
  
  // Log if no capitals are under attack
  console.log(`No capitals under attack for player ${playerId}`);
  return { underAttack: false, capital: null };
}

function changeCountryOwnership(country, newOwner) {
  pointsData.forEach(point => {
    if (point.country === country) {
      const circle = document.getElementById(point.id);
      if (circle) {
        circle.setAttribute("fill", newOwner === 1 ? players[1].color : (newOwner === 2 ? players[2].color : (newOwner === 3 ? players[3].color : players[4].color)));
        console.log(`Point ${point.id} colored ${circle.getAttribute("fill")}`);
      }
      point.OriginalOwner = newOwner; // Update the original owner for future reference
      if(defender !== 0) players[defender].countries = players[defender].countries.filter(c => c !== country);
      players[newOwner].countries.push(country);
      console.log(`Играч ${newOwner} взе контрол над ${country}`);
    }
  });

  // Update the number of capitals owned
  players[newOwner].capitalsNum += 1;
  if(defender !== 0) {players[defender].capitalsNum -= 1;}
  updateCapitalsCount();
}

function updateCapitalsCount() {
  document.getElementById("player1-capitals-info").innerHTML = `столици: <span id="player1-capitals" class="player1-capitals">${players[1].capitalsNum}</span>`;
  document.getElementById("player2-capitals-info").innerHTML = `столици: <span id="player2-capitals" class="player2-capitals">${players[2].capitalsNum}</span>`;
  document.getElementById("player3-capitals-info").innerHTML = `столици: <span id="player3-capitals" class="player3-capitals">${players[3].capitalsNum}</span>`;
  document.getElementById("player4-capitals-info").innerHTML = `столици: <span id="player4-capitals" class="player4-capitals">${players[4].capitalsNum}</span>`;
}

function getPointCountry(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (point) {
    return point.country;
  }
  return null; // В случай, че точката не съществува
}

function updatePlayerPawnsCount() {
  document.getElementById("player1-pawns").textContent = playerPawnsCount[1];
  document.getElementById("player2-pawns").textContent = playerPawnsCount[2];
  document.getElementById("player3-pawns").textContent = playerPawnsCount[3];
  document.getElementById("player4-pawns").textContent = playerPawnsCount[4];
}

// Обновяване на текста в таблото с имената на играчите
function updatePlayerInfoDisplay() {
  document.getElementById("player1-name").textContent = playerNames[0] || 'Играч 1';
  document.getElementById("player2-name").textContent = playerNames[1] || 'Играч 2';
  document.getElementById("player3-name").textContent = playerNames[2] || 'Играч 3';
  document.getElementById("player4-name").textContent = playerNames[3] || 'Играч 4';
  document.getElementById("player1-capitals-info").innerHTML = `столици: <span id="player1-capitals" class="player1-capitals">${players[1].capitalsNum}</span>`;
  document.getElementById("player1-info").innerHTML = `пулове: <span id="player1-pawns" class="player1-пawns">${playerPawnsCount[1]}</span>`;
  document.getElementById("player2-capitals-info").innerHTML = `столици: <span id="player2-capitals" class="player2-capitals">${players[2].capitalsNum}</span>`;
  document.getElementById("player2-info").innerHTML = `пулове: <span id="player2-pawns" class="player2-пawns">${playerPawnsCount[2]}</span>`;
  document.getElementById("player3-capitals-info").innerHTML = `столици: <span id="player3-capitals" class="player3-capitals">${players[3].capitalsNum}</span>`;
  document.getElementById("player3-info").innerHTML = `пулове: <span id="player3-pawns" class="player3-пawns">${playerPawnsCount[3]}</span>`;
  document.getElementById("player4-capitals-info").innerHTML = `столици: <span id="player4-capitals" class="player4-capitals">${players[4].capitalsNum}</span>`;
  document.getElementById("player4-info").innerHTML = `пулове: <span id="player4-pawns" class="player4-пawns">${playerPawnsCount[4]}</span>`;
}

updatePlayerInfoDisplay(); // Извикване на функцията за първоначално обновяване на дисплея
updateCapitalsCount(); // Initial update of the capitals count

function getCurrentPlayerName() {
  return playerNames[currentPlayer - 1] || `играч ${currentPlayer}`;
}

// Стартиране на функцията за осигуряване на двупосочни връзки
makeConnectionsBidirectional(pointsData);

// Инициализиране на предупреждение за уведомяване на играчите за старта на разпределянето на пуловете
alert("Започва разполагането на пулове за четирима играчи!");

// Създаване на карта за следене на пуловете на всяка точка
const pawnsOnPoints = {};
const pointNames = {}; // Създаване на обект за имена на точките
// Helper function to check country ownership
function checkCountryOwnership(point) {
  const country = point.country;
  if (country) {
    if (players[1].countries.includes(country)&& playerPawnsCount[1]>0) {
      return 1; // Player 1 owns this country
    } else if (players[2].countries.includes(country)&& playerPawnsCount[2]>0) {
      return 2; // Player 2 owns this country
    } else if (players[3].countries.includes(country)&& playerPawnsCount[3]>0) {
      return 3; // Player 3 owns this country
    } else if (players[4].countries.includes(country)&& playerPawnsCount[4]>0) {
      return 4; // Player 4 owns this country
    }
  }
  return null; // No player owns this point's country
}

// Modify the function to first check if there are any pawns that can be skipped
function QuestionThePlayer(pointId) {
  // First check if there are any capturable pawns
  const point = pointsData.find(p => p.id === ValidChoice);
  if (!point) return false;

  let hasSkippableOptions = false;
  point.connections.forEach(connectionId => {
    const connectedPoint = pointsData.find(p => p.id === connectionId);
    if (connectedPoint) {
      if (pawnsOnPoints[connectionId].pawns !== 0 && pawnsOnPoints[connectionId].owner !== currentPlayer &&
        connectionId !== pointId &&
        connectionId !== DestinationPoint &&
        !oldPawnIds.includes(connectionId)) {

        // Check if this pawn has any empty landing spots
        const hasEmptyLanding = connectedPoint.connections.some(landingId => {
          return landingId !== ValidChoice &&
            !oldPawnIds.includes(landingId) &&
            (!pawnsOnPoints[landingId] || pawnsOnPoints[landingId].pawns === 0);
        });

        if (hasEmptyLanding) {
          hasSkippableOptions = true;
        }
      }
    }
  });

  // Only ask if there are actually pawns that can be skipped
  return hasSkippableOptions ? confirm("Искате ли да прескочите пул, в съседство на избраната точка за кацане?") : false;
}

function highlightPointsForCapture(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    console.error(`Точка с id ${pointId} не е намерена`);
    return;
  }

  oldPawnIds.push(pointId);

  point.connections.forEach(connectionId => {
    const connectedPoint = pointsData.find(p => p.id === connectionId);
    if (connectedPoint && connectionId !== pointId && !oldPawnIds.includes(connectionId)) {
      if (pawnsOnPoints[connectionId].pawns !== 0 &&
        pawnsOnPoints[connectionId].owner !== currentPlayer &&
        !oldPawnIds.includes(connectionId)) {

        // Check if this pawn has any empty landing spots before highlighting
        const hasEmptyLandingSpot = connectedPoint.connections.some(landingId => {
          return landingId !== pointId &&
            !oldPawnIds.includes(landingId) &&
            pawnsOnPoints[landingId].pawns === 0;
        });

        if (hasEmptyLandingSpot) {
          pawnsInfoBeforeHighlight[connectionId] = {
            pawns: pawnsOnPoints[connectionId].pawns,
            owner: pawnsOnPoints[connectionId].owner
          };
          pawnsOnPoints[connectionId].owner = "highlight";
          updatePointDisplay(connectionId);
          pawnsChoiceStarted = true;
        }
      }
    }
  });

}

function unhighlightPointsForCapture() {
  for (const pointId in pawnsInfoBeforeHighlight) {
    pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[pointId].owner;
    if (skippingEnded) {
      Y = false;
      console.log("A point has been unhighlighted " + pointId);
      updatePointDisplay(pointId);

      skippingEnded = false;
    }
  }
  yellowPoints = [];

}

// Обработчик на събития за избиране на точка
function selectPoint(pointId) {
  if(DemocraticSending)
    {
        ignoreFirst = true;
        if (pawnsOnPoints[pointId].owner === currentPlayer && pawnsOnPoints[pointId].pawns !== 0) {
          DemocraticallySentPawns += 1;
          pawnsOnPoints[pointId].owner = DemocraticReciever;
          updatePointDisplay(pointId);
          if (DemocraticallySentPawns === DemocraticSendingAmmount) {
            DemocraticReciever = null;
            DemocraticSendingAmmount = 0;
            DemocraticSending = false;
            DemocraticallySentPawns = 0;
            ignoreFirst = true;
            alert("Можете да продължите с хода си.");
          }
        }
        else if (pawnsOnPoints[pointId].pawns < 1) {
          alert("Изберете точка, на която има пулове");
          pointId = null;
          return;
        }
        else if (pawnsOnPoints[pointId].owner !== defender) {
          alert("Изберете точка с ваши пулове");
          pointId = null;
          return;
        }
      }
  if (PunishRemove) {
    if (pawnsOnPoints[pointId].owner === currentPlayer && pawnsOnPoints[pointId].pawns !== 0) {
      pawnsOnPoints[pointId].pawns -= 1;
      playerPawnsCount[currentPlayer] -= 1;
      updatePlayerPawnsCount();
      updatePlayerInfoDisplay();
      updatePointDisplay(pointId);
      PunishRemove = false;
      movePawns(selectedStartPoint, DestinationPoint);
    }
    else if (pawnsOnPoints[pointId].pawns < 1) {
      alert("Изберете точка, на която има пулове");
      pointId = null;
      return;
    }
    else if (pawnsOnPoints[pointId].owner !== currentPlayer) {
      alert("Изберете точка с ваши пулове");
      pointId = null;
      return;


    }
  }

  if(PunishToRemove)
  {
      if (pawnsOnPoints[pointId].owner === currentPlayer && pawnsOnPoints[pointId].pawns !== 0) {
        pawnsOnPoints[pointId].pawns -= 1;
        playerPawnsCount[currentPlayer] -= 1;
        updatePlayerPawnsCount();
        updatePlayerInfoDisplay();
        updatePointDisplay(pointId);
        PunishToRemove = false;
        ///Сега тук трябва да преценим как да продължим двойното прескачане
        dinamicCaptureOptions = [] // Empty the array;

      X = true; // Поставяне на X на true при прескачане

      const point = pointsData.find(p => p.id === PointWithAlreadyAttackedPawns);
      dinamicCaptureOptions = point.connections.filter(PointWithAlreadyAttackedPawns => {
        const point = pointsData.find(p => p.id === PointWithAlreadyAttackedPawns);
        return point && (!pawnsOnPoints[PointWithAlreadyAttackedPawns] || pawnsOnPoints[PointWithAlreadyAttackedPawns].pawns === 0);
      });

      if (dinamicCaptureOptions.length > 0) {

        unhighlightPointsForCapture();
        oldPawnIds.push(ValidChoice);
        highlightConnections(PointWithAlreadyAttackedPawns); // Highlight connections for SkipPawns logic
        beingAttacked[pawnsOnPoints[PointWithAlreadyAttackedPawns].owner] = true;
        if (dinamicCaptureOptions.length > 0) {
          playerPawnsCount[pawnsOnPoints[PointWithAlreadyAttackedPawns].owner] -= pawnsOnPoints[PointWithAlreadyAttackedPawns].pawns;
          updatePlayerPawnsCount();
          pawnsOnPoints[PointWithAlreadyAttackedPawns].pawns = 0;
          pawnsOnPoints[PointWithAlreadyAttackedPawns].owner = null;
          updatePointDisplay(PointWithAlreadyAttackedPawns);

          alert("Изберете точка за кацане");
          console.log(`Опции за кацане: ${dinamicCaptureOptions}`);
          captureIsHappening = true;
        }
        else {
          alert("Няма празни точки за кацане.");
          pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[PointWithAlreadyAttackedPawns].owner;
          updatePointDisplay(PointWithAlreadyAttackedPawns);
          pawnsOnPoints[ValidChoice].pawns += 1;
          updatePointDisplay(ValidChoice);
          if (pawnsOnPoints[ValidChoice].pawns === 1) {
            pawnsOnPoints[ValidChoice].owner = currentPlayer;
          }
          X = false;
          return;
        }
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[validChoice].pawns += numPawns;
        if (pawnsOnPoints[validChoice].pawns === 1) {
          pawnsOnPoints[validChoice].owner = currentPlayer;
          updatePointDisplay(validChoice);
        }
        X = false;
        return;
      }


      pawnsChoiceStarted = false;
      }
      else if (pawnsOnPoints[pointId].pawns < 1) {
        alert("Изберете точка, на която има пулове");
        pointId = null;
        return;
      }
      else if (pawnsOnPoints[pointId].owner !== currentPlayer) {
        alert("Изберете точка с ваши пулове");
        pointId = null;
        return;
  
  
      }
    
  }

  if (startSentOver) {
    console.log(`startSentOver`);
    if (pawnsSentOver <= pawnsGrrr) {

      if (pawnsOnPoints[pointId].owner === defender && pawnsOnPoints[pointId].pawns !== 0) {
        pawnsSentOver += 1;
        pawnsOnPoints[pointId].pawns -= 1;
        playerPawnsCount[defender] -= 1;
        updatePlayerPawnsCount();
        if (pawnsOnPoints[pointId].pawns === 0) { pawnsOnPoints[pointId].owner = null; }
        updatePointDisplay(pointId);
        if (pawnsSentOver === pawnsGrrr) {
          pawnsSentOver = 0;
          startSentOver = false;
          isACapitalBeingAttacked = false;
          switchTurn();
        }
      }
      else if (pawnsOnPoints[pointId].pawns < 1) {
        alert("Изберете точка, на която има пулове");
        pointId = null;
        return;
      }
      else if (pawnsOnPoints[pointId].owner !== defender) {
        alert("Изберете точка с ваши пулове");
        pointId = null;
        return;
      }

    }
    else {
      pawnsSentOver = 0;
      startSentOver = false;
      isACapitalBeingAttacked = false;
      switchTurn();
    }
  }
  if (pawnsChoiceStarted) {
    console.log("Играч"+pawnsInfoBeforeHighlight[pointId].owner+"явно не е атакуван")
    if (beingAttacked[pawnsInfoBeforeHighlight[pointId].owner] === true && TheAttacker[pawnsInfoBeforeHighlight[pointId].owner] !== currentPlayer) {
      PointWithAlreadyAttackedPawns = pointId;
      if (!confirmAttackOnAlreadyAttackedPlayer()) {
        ///Ако играчът се откаже от хода, да се върне пулът на точка TheIdOfThePreviosPoint

        pawnsOnPoints[TheIdOfThePreviosPoint].pawns = 1;
        pawnsOnPoints[TheIdOfThePreviosPoint].owner = currentPlayer;
        updatePointDisplay(TheIdOfThePreviosPoint);

        captureIsHappening = false;
        dinamicCaptureOptions = [];
        console.log(`verka`);
        skippingEnded = true;
        unhighlightPointsForCapture();
        Y = true;

        if (X && Y) {
          if (isACapitalBeingAttacked && checkCapitalsOwnership(currentPlayer).underAttack) {
            alert("Поздравления! Успешно изгубихте столица и войска!");
            let ConqueredCapital = checkCapitalsOwnership(defender).capital;
            let CountryOfTheCapital = ConqueredCapital.country;
            changeCountryOwnership(CountryOfTheCapital, atacker);
            let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
            pawnsGrrr = pawnsToBePlaced;
            // Check if defender has enough pawns to pay
            if (playerPawnsCount[defender] <= pawnsToBePlaced) {
              alert(`${playerNames[defender - 1] || 'Играч ' + defender} губи играта поради недостатъчно пулове!`);
              playerPawnsCount[defender] = 0; // Set pawns to 0
    
              // Remove all pawns of the losing player from the board
              Object.keys(pawnsOnPoints).forEach(pointId => {
                if (pawnsOnPoints[pointId].owner === defender) {
                  pawnsOnPoints[pointId].pawns = 0;
                  pawnsOnPoints[pointId].owner = null;
                  updatePointDisplay(pointId);
                }
              });
    
              let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
              updatePointDisplay(ConqueredCapital.id);
              playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
              updatePlayerPawnsCount();
              updatePlayerInfoDisplay();
              updatePlayerPawnsCount();
              startSentOver = false;
              isACapitalBeingAttacked = false;
              switchTurn();
              return;
            }
    
            pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
            console.log("Trqbva da se postavqt" + pawnsToBePlaced);
            console.log("atacker sega ima" + playerPawnsCount[atacker]);
    
            let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
            console.log("sumata" + parseInt(AddittionalSumThing));
            playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
    
            console.log("veche ima" + playerPawnsCount[atacker]);
            updatePlayerPawnsCount();
            updatePointDisplay(ConqueredCapital.id);
            alert("Изберете " + pawnsGrrr + " пула, които да предадете!");
            startSentOver = true;
          }
          else if (isACapitalBeingAttacked) {
            alert("Поздравления! Успешно защитихте столицата си")
            startSentOver = false;
            isACapitalBeingAttacked = false;
            captureIsHappening = false;
            switchTurn();
          }
          else {
            captureIsHappening = false;
            switchTurn();
          }
        }

      }
      else{
        punishPoints[currentPlayer] += 1;
        bannedPlayers[currentPlayer] = true;
        TheAttacker[pawnsOnPoints[pointId].owner]=currentPlayer;
        if(punishPoints[currentPlayer] % 2 === 0 && punishPoints[currentPlayer] > 0){
          bannedPlayers[currentPlayer] = true; ///Играчът не може да прескача двойно
          ///Тук трябва да накараме играча да предаде 1 пул.
          alert(`Наказанието е, че играч ${playerNames[currentPlayer - 1] || 'Играч ' + currentPlayer} не може да прескача двойно. Трябва да предаде 1 пул.`);
          PunishToRemove = true;
          pawnsChoiceStarted = false;
          return;
        }
        else{ ///Живота продължава, ако има дамо за си получи наказателната точка
          dinamicCaptureOptions = [] // Empty the array;

      X = true; // Поставяне на X на true при прескачане

      const point = pointsData.find(p => p.id === pointId);
      dinamicCaptureOptions = point.connections.filter(pointId => {
        const point = pointsData.find(p => p.id === pointId);
        return point && (!pawnsOnPoints[pointId] || pawnsOnPoints[pointId].pawns === 0);
      });

      if (dinamicCaptureOptions.length > 0) {

        unhighlightPointsForCapture();
        oldPawnIds.push(ValidChoice);
        highlightConnections(pointId); // Highlight connections for SkipPawns logic
        beingAttacked[pawnsOnPoints[pointId].owner] = true;
        if (dinamicCaptureOptions.length > 0) {
          playerPawnsCount[pawnsOnPoints[pointId].owner] -= pawnsOnPoints[pointId].pawns;
          updatePlayerPawnsCount();
          pawnsOnPoints[pointId].pawns = 0;
          pawnsOnPoints[pointId].owner = null;
          updatePointDisplay(pointId);

          alert("Изберете точка за кацане");
          console.log(`Опции за кацане: ${dinamicCaptureOptions}`);
          captureIsHappening = true;
        }
        else {
          alert("Няма празни точки за кацане.");
          pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[pointId].owner;
          updatePointDisplay(pointId);
          pawnsOnPoints[ValidChoice].pawns += 1;
          updatePointDisplay(ValidChoice);
          if (pawnsOnPoints[ValidChoice].pawns === 1) {
            pawnsOnPoints[ValidChoice].owner = currentPlayer;
          }
          X = false;
          return;
        }
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[validChoice].pawns += numPawns;
        if (pawnsOnPoints[validChoice].pawns === 1) {
          pawnsOnPoints[validChoice].owner = currentPlayer;
          updatePointDisplay(validChoice);
        }
        X = false;
        return;
      }

      beingAttacked[pawnsOnPoints[pointId].owner] = true;
      pawnsChoiceStarted = false;
        }
      }
    }
    else {
      dinamicCaptureOptions = [] // Empty the array;

      X = true; // Поставяне на X на true при прескачане

      const point = pointsData.find(p => p.id === pointId);
      dinamicCaptureOptions = point.connections.filter(pointId => {
        const point = pointsData.find(p => p.id === pointId);
        return point && (!pawnsOnPoints[pointId] || pawnsOnPoints[pointId].pawns === 0);
      });

      if (dinamicCaptureOptions.length > 0) {

        unhighlightPointsForCapture();
        oldPawnIds.push(ValidChoice);
        highlightConnections(pointId); // Highlight connections for SkipPawns logic
        beingAttacked[pawnsOnPoints[pointId].owner] = true;
        if (dinamicCaptureOptions.length > 0) {
          playerPawnsCount[pawnsOnPoints[pointId].owner] -= pawnsOnPoints[pointId].pawns;
          updatePlayerPawnsCount();
          pawnsOnPoints[pointId].pawns = 0;
          pawnsOnPoints[pointId].owner = null;
          updatePointDisplay(pointId);

          alert("Изберете точка за кацане");
          console.log(`Опции за кацане: ${dinamicCaptureOptions}`);
          captureIsHappening = true;
        }
        else {
          alert("Няма празни точки за кацане.");
          pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[pointId].owner;
          updatePointDisplay(pointId);
          pawnsOnPoints[ValidChoice].pawns += 1;
          updatePointDisplay(ValidChoice);
          if (pawnsOnPoints[ValidChoice].pawns === 1) {
            pawnsOnPoints[ValidChoice].owner = currentPlayer;
          }
          X = false;
          return;
        }
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[validChoice].pawns += numPawns;
        if (pawnsOnPoints[validChoice].pawns === 1) {
          pawnsOnPoints[validChoice].owner = currentPlayer;
          updatePointDisplay(validChoice);
        }
        X = false;
        return;
      }


      pawnsChoiceStarted = false;
    }
  }
  if (captureIsHappening) {
    const validChoice = dinamicCaptureOptions.find(option => option === pointId);
    ValidChoice = validChoice;
    if (!validChoice || yellowPoints.includes(validChoice) === false) {
      return;
    }
    if (pawnsOnPoints[validChoice].owner !== currentPlayer && pawnsOnPoints[validChoice].pawns !== 0) {
      alert("Не можете да кацате върху противникови пулове");
      return;
    }

    oldPawnIds = [];

    dinamicCaptureOptions.forEach(option => {
      const circle = document.getElementById(option);
      const point = pointsData.find(p => p.id === option);
      if (circle && point) {
        if (pawnsOnPoints[option].pawns !== 0) {
          circle.setAttribute("r", point.capital ? 22 : 10);
        }
        else { circle.setAttribute("r", point.capital ? 22 : 7); }
        circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : (checkCountryOwnership(point) === 3 ? players[3].color : players[4].color))) : "gray");
        console.log(`Point ${point.id} colored ${circle.getAttribute("fill")}`);
        console.log(checkCountryOwnership(point));
      }
    });

    pawnsOnPoints[validChoice] = { pawns: 1, owner: currentPlayer };
    oldPawnIds.push(validChoice);
    updatePointDisplay(validChoice);


    const point = pointsData.find(p => p.id === pointId);
    if (!point) {
      console.error(`Точка с id ${pointId} не е намерена`);
      return;
    }

    Y = true; // Поставяне на Y на true след избора

    doubleSkipPossibility = false;

    point.connections.forEach(connectionId => {
      const connectedPoint = pointsData.find(p => p.id === connectionId);
      if (connectedPoint) {
        let options =0;
        connectedPoint.connections.forEach(conectionId => { ///Дали е възможно да се кацне от тази точка
          const connection = pointsData.find(p => p.id === conectionId);
          if (connection && pawnsOnPoints[conectionId].pawns === 0 && conectionId !==connectionId && conectionId !== pointId && !oldPawnIds.includes(conectionId)) {
            options = options + 1;
          }
        });
        if (pawnsOnPoints[connectionId].pawns !== 0 && pawnsOnPoints[connectionId].owner !== currentPlayer && connectionId!==pointId && connectionId !== DestinationPoint && !oldPawnIds.includes(connectionId) && options > 0) {
          doubleSkipPossibility = true;
          
          console.log(connectionId + "e опция за прескачане");
        }
        options = 0;
      }
    });

    if (doubleSkipPossibility === true && QuestionThePlayer(pointId) === true) {
      Y = false;

      highlightPointsForCapture(pointId);

      pawnsOnPoints[pointId].pawns = 0;
      pawnsOnPoints[pointId].owner = null;
      updatePointDisplay(pointId);
      TheIdOfThePreviosPoint=pointId;


      alert("Изберете противникови пулове за прескачане");
      doupleSkipPossibility = false;
      captureIsHappening = true;
      Y = false;
    }
    else {

      captureIsHappening = false;
      dinamicCaptureOptions = [];
      console.log(`verka`);
      skippingEnded = true;
      unhighlightPointsForCapture();
      Y = true;
    }

    console.log("X=" + X + " and Y=" + Y);

    if (X && Y) {
      if (isACapitalBeingAttacked && checkCapitalsOwnership(currentPlayer).underAttack) {
        alert("Поздравления! Успешно изгубихте столица и войска!");
        let ConqueredCapital = checkCapitalsOwnership(defender).capital;
        let CountryOfTheCapital = ConqueredCapital.country;
        changeCountryOwnership(CountryOfTheCapital, atacker);
        let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
        pawnsGrrr = pawnsToBePlaced;
        // Check if defender has enough pawns to pay
        if (playerPawnsCount[defender] <= pawnsToBePlaced) {
          alert(`${playerNames[defender - 1] || 'Играч ' + defender} губи играта поради недостатъчно пулове!`);
          playerPawnsCount[defender] = 0; // Set pawns to 0

          // Remove all pawns of the losing player from the board
          Object.keys(pawnsOnPoints).forEach(pointId => {
            if (pawnsOnPoints[pointId].owner === defender) {
              pawnsOnPoints[pointId].pawns = 0;
              pawnsOnPoints[pointId].owner = null;
              updatePointDisplay(pointId);
            }
          });

          let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
          updatePointDisplay(ConqueredCapital.id);
          playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
          updatePlayerPawnsCount();
          updatePlayerInfoDisplay();
          updatePlayerPawnsCount();
          startSentOver = false;
          isACapitalBeingAttacked = false;
          switchTurn();
          return;
        }

        pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
        console.log("Trqbva da se postavqt" + pawnsToBePlaced);
        console.log("atacker sega ima" + playerPawnsCount[atacker]);

        let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
        console.log("sumata" + parseInt(AddittionalSumThing));
        playerPawnsCount[atacker] = parseInt(AddittionalSumThing);

        console.log("veche ima" + playerPawnsCount[atacker]);
        updatePlayerPawnsCount();
        updatePointDisplay(ConqueredCapital.id);
        alert("Изберете " + pawnsGrrr + " пула, които да предадете!");
        startSentOver = true;
      }
      else if (isACapitalBeingAttacked) {
        alert("Поздравления! Успешно защитихте столицата си")
        startSentOver = false;
        isACapitalBeingAttacked = false;
        captureIsHappening = false;
        switchTurn();
      }
      else {
        captureIsHappening = false;
        switchTurn();
      }
    }
  }
  else if(ignoreFirst === false) {
    console.log(`else`);
    if (captureOptions.length > 0) {
      handleCaptureChoice(pointId);
      return;
    }

    console.log(`Точка избрана: ${pointId}`);
    if (!isMovingPhase) {
      placePawns(pointId);
    } else {
      if (!selectedStartPoint) {
        selectedStartPoint = pointId;
        alert(`Сега изберете дестинацията.`);
      } else {
        let destinationPoint = pointId;
        if (selectedStartPoint === destinationPoint) {
          alert("Избрахте една и съща точка. Изберете друга точка за дестинация");
          selectedStartPoint = null;
          return;
        }
        const point = pointsData.find(p => p.id === destinationPoint);
        if (((pawnsOnPoints[destinationPoint].pawns !== 0) && beingAttacked[pawnsOnPoints[destinationPoint].owner] === true && pawnsOnPoints[destinationPoint].owner !== currentPlayer) || (point.capital===true && point.OriginalOwner!=currentPlayer && beingAttacked[point.OriginalOwner] === true)) {
          if (!confirmAttackOnAlreadyAttackedPlayer()) {
            selectedStartPoint = null;
            destinationPoint = null;
            return;
          }
          else {
            punishPoints[currentPlayer] += 1;
            if (punishPoints[currentPlayer] % 2 === 0 && punishPoints[currentPlayer] > 0) {
              bannedPlayers[currentPlayer] = true; ///Играчът не може да прескача двойно
              ///Тук трябва да накараме играча да предаде 1 пул.
              alert(`Наказанието е, че играч ${playerNames[currentPlayer - 1] || 'Играч ' + currentPlayer} не може да прескача двойно. Трябва да предаде 1 пул.`);
              PunishRemove = true;
              DestinationPoint = destinationPoint;
            }
            else {
              movePawns(selectedStartPoint, destinationPoint);
              selectedStartPoint = null;
            }
          }
        }
        else {
          movePawns(selectedStartPoint, destinationPoint);
          selectedStartPoint = null;
        }
      }
    }
  }
  else{
    ignoreFirst=false;
    selectedStartPoint = null;
  }
}

// Функция за разпределяне на пуловете върху кликната точка
function placePawns(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    alert("Невалидна точка.");
    return;
  }

  const pointColor = document.getElementById(pointId)?.getAttribute("fill"); // Вземане на цвета на точката
  let player = null;

  // Определяне на играча на базата на цвета
  if (pointColor === "blue") {
    player = players[1];
  } else if (pointColor === "green") {
    player = players[2];
  } else if (pointColor === "red") {
    player = players[3];
  } else if (pointColor === "orange") {
    player = players[4];
  } else {
    alert("Тази точка не принадлежи на никого.");
    return;
  }

  const playerName = playerNames[player === players[1] ? 0 : (player === players[2] ? 1 : (player === players[3] ? 2 : 3))] || `Играч ${player === players[1] ? 1 : (player === players[2] ? 2 : (player === players[3] ? 3 : 4))}`;

  const maxPawnsToPlace = player.remainingPawns;
  const numPawns = parseInt(prompt(`Колко пулове искате да поставите? (Max: ${maxPawnsToPlace})
За да препоставите пул, въведете отрицателно число`), 10);

  if (player.remainingPawns <= 0 && numPawns > 0) {
    alert(`${playerName} няма оставащи пулове.`);
    return;
  }

  if (isNaN(numPawns) || numPawns > maxPawnsToPlace || numPawns < -pawnsOnPoints[pointId].pawns) {
    alert("Невалиден брой пулове. Опитайте отново.");
    return;
  }

  // Инициализиране на точката, ако за първи път се поставят пулове там
  if (!pawnsOnPoints[pointId]) {
    pawnsOnPoints[pointId] = { pawns: 0, owner: null };
  }

  pawnsOnPoints[pointId].pawns += numPawns;
  player.remainingPawns -= numPawns;
  updatePlayerPawnsCount();
  pawnsOnPoints[pointId].owner = player === players[1] ? 1 : (player === players[2] ? 2 : (player === players[3] ? 3 : 4));

  updatePointDisplay(pointId);


}
// Функция за преместване на пулове между точки
function movePawns(startPointId, destinationPointId) {
  const startPoint = pointsData.find(p => p.id === startPointId);
  startingPoint = startPointId;
  const destinationPoint = pointsData.find(p => p.id === destinationPointId);
  DestinationPoint = destinationPointId;

  if (pawnsOnPoints[startPointId].pawns <= 0) {
    alert("Няма достатъчно пулове.");
    return;
  }

  if (!startPoint || !destinationPoint) {
    alert("Избрана е невалидна точка.");
    return;
  }
  if (!startPoint.connections.includes(destinationPointId)) {
    alert("Тези точки не са свързани. Изберете свързана точка");
    return;
  }

  if (pawnsOnPoints[startPointId].owner !== currentPlayer) {
    alert("Можете да местите само своите пулове.");
    return;
  }

  movingHasStarted = true;

  const numPawns = 1; // Може да се премести само един пул наведнъж

  // Here's where pawns are removed from the starting point
  startingPointId = startPointId;
  pawnsOnPoints[startPointId].pawns -= numPawns;
  if (pawnsOnPoints[startPointId].pawns === 0) {
    pawnsOnPoints[startPointId].owner = null;
    console.log(`Пулове на точка ${startPointId} бяха преместени.`);
  }

  if (!pawnsOnPoints[destinationPointId]) {
    pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
  }

  if (SkipPawns && !bannedPlayers[currentPlayer]) {
    if (pawnsOnPoints[destinationPointId].owner && pawnsOnPoints[destinationPointId].owner !== currentPlayer && pawnsOnPoints[destinationPointId].pawns !== 0) {
      X=true;
      
      dinamicCaptureOptions = [];
      destinationPoint.connections.forEach(connectionId => {
        if (pawnsOnPoints[connectionId].pawns === 0 && connectionId !== startPointId && connectionId !== destinationPointId) {
          dinamicCaptureOptions.push(connectionId);
        }
      });

      if (dinamicCaptureOptions.length > 0) {
        oldPawnIds.push(startPointId);
        highlightConnections(destinationPointId); // Highlight connections for SkipPawns logic
        beingAttacked[pawnsOnPoints[destinationPointId].owner] = true;
        TheAttacker[pawnsOnPoints[destinationPointId].owner] = currentPlayer; 
        playerPawnsCount[pawnsOnPoints[destinationPointId].owner] -= pawnsOnPoints[destinationPointId].pawns;
        updatePlayerPawnsCount();
        pawnsOnPoints[destinationPointId].pawns = 0;
        pawnsOnPoints[destinationPointId].owner = null;
        updatePointDisplay(destinationPointId);

        alert("Изберете точка за кацане");

        captureIsHappening = true;
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[startPointId].pawns += numPawns;
        if (pawnsOnPoints[startPointId].pawns === 1) {
          pawnsOnPoints[startPointId].owner = currentPlayer;
        }
        X = false;
        return;
      }
    } else {
      pawnsOnPoints[destinationPointId].pawns += numPawns;
      pawnsOnPoints[destinationPointId].owner = currentPlayer;
    }



  } else {
    // Old capturing logic
    if (pawnsOnPoints[destinationPointId].owner && pawnsOnPoints[destinationPointId].owner !== currentPlayer) {
      X = true; // Поставяне на X на true при прескачане

       // Логика за прескачане и улавяне
       captureOptions = [];
       destinationPoint.connections.forEach(connectionId => {
         if (pawnsOnPoints[connectionId].pawns === 0 && connectionId !== startPointId && connectionId !== destinationPointId) {
           captureOptions.push(connectionId);
         }
       });

      if (captureOptions.length > 0) {
        captureOptions = captureOptions.map(pointId => pointId);
        captureOptions.forEach(option => {
          highlightCaptureOption(option);
        });

        // Премахване на противниковите пулове и актуализиране на броя пулове на опонента
        const opponent = pawnsOnPoints[destinationPointId].owner;
        playerPawnsCount[opponent] -= pawnsOnPoints[destinationPointId].pawns;
        updatePlayerPawnsCount();
        pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
        console.log(`Пулове на точка ${destinationPointId} бяха изтрити, защото бяха прескочени.`);
        updatePointDisplay(destinationPointId);

        alert("Изберете точка за кацане");

        captureOptions.forEach(option => {
          document.getElementById(option).addEventListener("click", () => {
            handleCaptureChoice(option);
          });
        });
      } else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[startPointId].pawns += numPawns;
        if (pawnsOnPoints[startPointId].pawns === 1) {
          pawnsOnPoints[startPointId].owner = currentPlayer;
        }
        X = false;
        return;
      }
    } else {
      pawnsOnPoints[destinationPointId].pawns += numPawns;
      pawnsOnPoints[destinationPointId].owner = currentPlayer;
    }
  }

  updatePointDisplay(startPointId);
  updatePointDisplay(destinationPointId);

  // Превключване на редовете между играчите
  if (!X || (X && Y)) {
    if (isACapitalBeingAttacked && checkCapitalsOwnership(currentPlayer).underAttack) {
      alert("Поздравления! Успешно изгубихте столица и войска!");
      let ConqueredCapital = checkCapitalsOwnership(defender).capital;
      let CountryOfTheCapital = ConqueredCapital.country;
      changeCountryOwnership(CountryOfTheCapital, atacker);
      let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
      pawnsGrrr = pawnsToBePlaced;
      pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
      updatePointDisplay(ConqueredCapital.id);

      if (playerPawnsCount[defender] <= pawnsToBePlaced) {
        alert(`${playerNames[defender - 1] || 'Играч ' + defender} губи играта поради недостатъчно пулове!`);
        playerPawnsCount[defender] = 0; // Set pawns to 0

        // Remove all pawns of the losing player from the board
        Object.keys(pawnsOnPoints).forEach(pointId => {
          if (pawnsOnPoints[pointId].owner === defender) {
            pawnsOnPoints[pointId].pawns = 0;
            pawnsOnPoints[pointId].owner = null;
            updatePointDisplay(pointId);
          }
        });

        let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
        updatePointDisplay(ConqueredCapital.id);
        playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
        updatePlayerPawnsCount();
        updatePlayerInfoDisplay();
        updatePlayerPawnsCount();
        startSentOver = false;
        isACapitalBeingAttacked = false;
        switchTurn();
        return;
      }

      console.log("Trqbva da se postavqt" + pawnsToBePlaced);
      console.log("atacker sega ima" + playerPawnsCount[atacker]);

      let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
      console.log("sumata" + parseInt(AddittionalSumThing));
      playerPawnsCount[atacker] = parseInt(AddittionalSumThing);

      console.log("veche ima" + playerPawnsCount[atacker]);
      updatePlayerPawnsCount();
      updatePointDisplay(ConqueredCapital.id);

      if (playerPawnsCount[defender] <= pawnsToBePlaced) {
        alert(`${playerNames[defender - 1] || 'Играч ' + defender} губи играта поради недостатъчно пулове!`);
        playerPawnsCount[defender] = 0; // Set pawns to 0

        // Remove all pawns of the losing player from the board
        Object.keys(pawnsOnPoints).forEach(pointId => {
          if (pawnsOnPoints[pointId].owner === defender) {
            pawnsOnPoints[pointId].pawns = 0;
            pawnsOnPoints[pointId].owner = null;
            updatePointDisplay(pointId);
          }
        });

        let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
        updatePointDisplay(ConqueredCapital.id);
        playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
        updatePlayerPawnsCount();
        updatePlayerInfoDisplay();
        updatePlayerPawnsCount();
        startSentOver = false;
        isACapitalBeingAttacked = false;
        switchTurn();
        return;
      }

      alert("Изберете " + pawnsGrrr + " пула, които да предадете!");
      startSentOver = true;

    }
    else if (isACapitalBeingAttacked) {
      alert("Поздравления! Успешно защитихте столицата си")
      startSentOver = false;
      isACapitalBeingAttacked = false;
      switchTurn();
    }
    else {
      switchTurn();
    }
  }
}


// Функция за обработка на избора на точка за кацане при улавяне
function handleCaptureChoice(pointId) {
  const validChoice = captureOptions.find(option => option === pointId);
  if (!validChoice) {
    return;
  }

  captureOptions.forEach(option => {
    const circle = document.getElementById(option);
    const point = pointsData.find(p => p.id === option);
    if (circle && point) {
      circle.setAttribute("r", 7); // Връщане към нормален радиус
      circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : (checkCountryOwnership(point) === 3 ? players[3].color : players[4].color))) : "gray");
      console.log(`Point ${point.id} colored ${circle.getAttribute("fill")}`);
      console.log(checkCountryOwnership(point));
    }
  });

  pawnsOnPoints[validChoice] = { pawns: 1, owner: currentPlayer };
  updatePointDisplay(validChoice);
  captureOptions = [];

  Y = true; // Поставяне на Y на true след избора

  if (X && Y) {
    if (isACapitalBeingAttacked && checkCapitalsOwnership(currentPlayer).underAttack) {
      alert("Поздравления! Успешно изгубихте столица и войска!");
      let ConqueredCapital = checkCapitalsOwnership(defender).capital;
      let CountryOfTheCapital = ConqueredCapital.country;
      changeCountryOwnership(CountryOfTheCapital, atacker);
      let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
      pawnsGrrr = pawnsToBePlaced;
      if (playerPawnsCount[defender] <= pawnsToBePlaced) {
        alert(`${playerNames[defender - 1] || 'Играч ' + defender} губи играта поради недостатъчно пулове!`);
        playerPawnsCount[defender] = 0; // Set pawns to 0

        // Remove all pawns of the losing player from the board
        Object.keys(pawnsOnPoints).forEach(pointId => {
          if (pawnsOnPoints[pointId].owner === defender) {
            pawnsOnPoints[pointId].pawns = 0;
            pawnsOnPoints[pointId].owner = null;
            updatePointDisplay(pointId);
          }
        });

        let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
        updatePointDisplay(ConqueredCapital.id);
        playerPawnsCount[atacker] = parseInt(AddittionalSumThing);
        updatePlayerPawnsCount();
        updatePlayerInfoDisplay();
        updatePlayerPawnsCount();
        startSentOver = false;
        isACapitalBeingAttacked = false;
        switchTurn();
        return;
      }

      pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
      console.log("Trqbva da se postavqt" + pawnsToBePlaced);
      console.log("atacker sega ima" + playerPawnsCount[atacker]);

      let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
      console.log("sumata" + parseInt(AddittionalSumThing));
      playerPawnsCount[atacker] = parseInt(AddittionalSumThing);

      console.log("veche ima" + playerPawnsCount[atacker]);
      updatePlayerPawnsCount();
      updatePointDisplay(ConqueredCapital.id);
      alert("Изберете " + pawnsGrrr + " пула, които да предадете!");
      startSentOver = true;
    }
    else if (isACapitalBeingAttacked) {
      alert("Поздравления! Успешно защитихте столицата си")
      startSentOver = false;
      isACapitalBeingAttacked = false;
      switchTurn();
    }
    else {
      switchTurn();
    }
  }
}

// Функция за подчертаване на опция за кацане при улавяне
function highlightCaptureOption(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (point) {
    const circle = document.getElementById(point.id);
    circle.setAttribute("fill", "yellow");
    console.log(`Point ${point.id} colored yellow`);
    circle.setAttribute("r", point.capital ? 22 : 10); // Увеличаване на радиуса на точката
  }
}

// Функция за актуализиране на визуализацията на точка според броя пулове
function updatePointDisplay(pointId) {
  const pawnsGroup = document.getElementById("pawns");
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    console.error(`Точка с id ${pointId} не е намерена`);
    return;
  }

  // Премахване на съществуващото изображение
  const existingDisplay = pawnsGroup.querySelector(`[data-point-id="${pointId}"]`);
  if (existingDisplay) {
    pawnsGroup.removeChild(existingDisplay);
  }

  const pawnCount = pawnsOnPoints[pointId].pawns;

  if (pawnCount > 0) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-point-id", pointId);
    group.addEventListener("click", () => selectPoint(pointId)); // Добавяне на клик събитие към групата

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", point.capital ? 22 : 16); // Увеличаване на радиуса на кръга

    // Set color based on owner, including highlight state
    let fillColor;
    let textColor = "white"; // Default text color
    let fontSize = "14"; // Default font size
    let fontWeight = "normal"; // Default font weight
    if (pawnsOnPoints[pointId].owner === 'highlight') {
      fillColor = "yellow";
      // Use the original owner's color for text
      const originalOwner = pawnsInfoBeforeHighlight[pointId]?.owner;
      textColor = originalOwner === 1 ? players[1].color : originalOwner === 2 ? players[2].color : (originalOwner === 3 ? players[3].color : players[4].color);
      fontSize = "18"; // Increased font size from 14 to 18
      fontWeight = "bold"; // Added bold font weight
    } else {
      fillColor = pawnsOnPoints[pointId].owner === 1 ? players[1].color : (pawnsOnPoints[pointId].owner === 2 ? players[2].color : (pawnsOnPoints[pointId].owner === 3 ? players[3].color : players[4].color));
      textColor = "white"; // Use white text color for player colors
      fontSize = "14"; // Default font size
      fontWeight = "normal"; // Default font weight
    }
    circle.setAttribute("fill", fillColor);
    console.log(`Point ${point.id} colored ${circle.getAttribute("fill")}`);
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer

    group.appendChild(circle);


    if (!Y) { // Премахване на текста, ако Y е true
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", point.x);
      text.setAttribute("y", point.y + 5); // Настройка за центриране на текста
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", textColor); // Use the determined text color
      text.setAttribute("font-size", fontSize); // Увеличаване на размера на шрифта
      text.setAttribute("font-weight", fontWeight); // Увеличаване на размера на шрифта


      // Use saved pawn count for highlighted points
      const displayCount = pawnsOnPoints[pointId].owner === 'highlight' && pawnsInfoBeforeHighlight[pointId] ?
        pawnsInfoBeforeHighlight[pointId].pawns :
        pawnCount;
      console.log(`pawnCount: ${pawnCount} on point ${pointId}`);
      text.textContent = displayCount;
      group.appendChild(text);
    }

    pawnsGroup.appendChild(group);
  } else {
    const circle = document.getElementById(point.id);
    if (circle) {
      circle.setAttribute("r", point.capital ? 22 : 7); // Начален радиус
      if (point.country) {
        const ownership = checkCountryOwnership(point);
        if (ownership === 1) {
          circle.setAttribute("fill", players[1].color);
        } else if (ownership === 2) {
          circle.setAttribute("fill", players[2].color);
        } else if (ownership === 3){
          circle.setAttribute("fill", players[3].color);
        }else if (ownership === 4){
          circle.setAttribute("fill", players[4].color);
        }

      } else {
        circle.setAttribute("fill", "gray");
      }
    }
    console.log(`Точката ${pointId} е скрита, защото няма пулове.`);
  }
}

// Add this function to reset highlights when needed (call it in switchTurn or when canceling moves)
function resetHighlights() {
  Object.keys(pawnsInfoBeforeHighlight).forEach(pointId => {
    if (pawnsOnPoints[pointId].owner === 'highlight') {
      pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[pointId].owner;
      pawnsOnPoints[pointId].pawns = pawnsInfoBeforeHighlight[pointId].pawns;
      updatePointDisplay(pointId);
    }
  });

}

// Функция за рендиране на точки, връзки и добавяне на пулове
function renderMapElements() {
  const pointsGroup = document.getElementById("points");
  const connectionsGroup = document.getElementById("connections");
  const pointMap = {};
  pointsData.forEach(point => {
    pointMap[point.id] = point;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", point.capital ? 22 : 7); // Начален радиус
    if (point.country) {
      let countryOwner = checkCountryOwnership(point);
      if (countryOwner === 1) {
      circle.setAttribute("fill", players[1].color);
      } else if (countryOwner === 2) {
      circle.setAttribute("fill", players[2].color); 
      } else if (countryOwner === 3) {
      circle.setAttribute("fill", players[3].color);
      } else if (countryOwner === 4) {
      circle.setAttribute("fill", players[4].color);
      } else {
        circle.setAttribute("fill", "gray");
      }
    } else {
      circle.setAttribute("fill", "gray");
    }
    circle.setAttribute("id", point.id);
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer
    circle.addEventListener("click", () => selectPoint(point.id)); // Добавяне на клик събитие към точката
    pointsGroup.appendChild(circle);

    pawnsOnPoints[point.id] = { pawns: 0, owner: null };
  });

  pointsData.forEach(point => {
    point.connections.forEach(connectionId => {
      const targetPoint = pointMap[connectionId];
      if (targetPoint) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", point.x);
        line.setAttribute("y1", point.y);
        line.setAttribute("x2", targetPoint.x);
        line.setAttribute("y2", targetPoint.y);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", 2);
        connectionsGroup.appendChild(line);
      }
    });
  });
}

// Превключване на редовете между играчите
function switchTurn() {
  // Count players with zero pawns
  let playersWithZeroPawns = 0;
  let winningPlayer = 0;

  for (let i = 1; i <= 4; i++) {
    if (playerPawnsCount[i] === 0) {
      playersWithZeroPawns++;
    } else {
      winningPlayer = i;
    }
  }

  // If two players have lost all pawns, the remaining player wins
  if (playersWithZeroPawns >= 3) {
    switch (winningPlayer) {
      case 1:
        window.location.href = "player1_win.html";
        break;
      case 2:
        window.location.href = "player2_win.html";
        break;
      case 3:
        window.location.href = "player3_win.html";
        break;
      case 4:
        window.location.href = "player4_win.html";
        break;
    }
    return;
  }

  // Nullify countries of players who have lost
  for (let i = 1; i <= 4; i++) {
    if (playerPawnsCount[i] === 0) {
      nullifyPlayerCountries(i);
    }
  }

  resetHighlights();
  unhighlightPointsForCapture();
  pawnsInfoBeforeHighlight = {};


  // Find next player that still has pawns
  do {
    currentPlayer = currentPlayer === 4 ? 1 : currentPlayer + 1;
  } while (playerPawnsCount[currentPlayer] === 0);

  if (currentPlayer === 1) { 
    beingAttacked = [false, false, false, false];
    TheAttacker = [0, 0, 0, 0]; // Reset attackers at the start of round
  }

  alert(`Сега е ред на ${getCurrentPlayerName()} да мести пуловете си.`);

  movingHasStarted = false;

  // Премахване на текста от всички точки
  Object.keys(pawnsOnPoints).forEach(pointId => {
    const point = document.getElementById(pointId);
    if (point) {
      const textElement = point.querySelector('text');
      if (textElement) {
        point.removeChild(textElement);
        console.log(`Точката ${pointId} е скрита по време на преминаване на хода.`);
      }
    }
  });

  const capitals = pointsData.filter(point => point.capital && point.OriginalOwner === 0);
  for (const capital of capitals) {
    const country = capital.country;
    if (pawnsOnPoints[capital.id].pawns > 0) {
      const conqueror = pawnsOnPoints[capital.id].owner;
      changeCountryOwnership(country, conqueror); // Промяна на собствеността на страната
      //players[conqueror].capitalsNum += 1; // Увеличаване на броя на столиците на завоевателя
      players[conqueror].countries.push(country); // Добавяне на страната към завоевателя
      capital.OriginalOwner = conqueror; // Промяна на оригиналния собственик на столицата
      updatePlayerInfoDisplay(); // Актуализиране на информацията за играча
    }
  }

  console.log(`Проверката не се състоя, защото ${checkCapitalsOwnership(currentPlayer).underAttack} и ${isACapitalBeingAttacked} не са .`);
  if (checkCapitalsOwnership(currentPlayer).underAttack && isACapitalBeingAttacked === false) {
    alert("Има противникови пулове на ваша столица, защитете я!");
    isACapitalBeingAttacked = true;
    let theCapital = checkCapitalsOwnership(currentPlayer).capital;
    if (currentPlayer === 1) { atacker = pawnsOnPoints[theCapital.id].owner; defender = 1; }
    if (currentPlayer === 2) { atacker = pawnsOnPoints[theCapital.id].owner; defender = 2; }
    if (currentPlayer === 3) { atacker = pawnsOnPoints[theCapital.id].owner; defender = 3; }
    if (currentPlayer === 4) { atacker = pawnsOnPoints[theCapital.id].owner; defender = 4; }
    beingAttacked[defender]=true; TheAttacker[defender]=atacker;
  }

  X = false;
  Y = false;
}

// Инициализиране на играта
logPointsData();
renderMapElements();
updatePlayerPawnsCount();

function handleSkipCaptureOption(pointId) {
  const validChoice = dinamicCaptureOptions.find(option => option === pointId);
  if (!validChoice) {
    return;
  }

  // Reset all highlighted points
  dinamicCaptureOptions.forEach(option => {
    const circle = document.getElementById(option);
    const point = pointsData.find(p => p.id === option);
    if (circle && point) {
      circle.setAttribute("r", point.capital ? 22 : 7);
      circle.setAttribute("fill", point.country ?
        (checkCountryOwnership(point) === 1 ? players[1].color :
          (checkCountryOwnership(point) === 2 ? players[2].color : (checkCountryOwnership(point) === 3 ? players[3].color : players[4].color))) :
        "gray"
      );
      console.log(`Point ${point.id} colored ${circle.getAttribute("fill")}`);
    }
  });

  resetHighlights(); // Reset any highlighted states
  pawnsOnPoints[validChoice] = { pawns: 1, owner: currentPlayer };
  updatePointDisplay(validChoice);
  dinamicCaptureOptions = [];

  Y = true; // Mark the landing choice as made

  if (X && Y) {
    // Same win/lose logic as handleCaptureChoice
    if (isACapitalBeingAttacked && checkCapitalsOwnership(currentPlayer).underAttack) {
      // Existing capital capture logic
      alert("Поздравления! Успешно изгубихте столица и войска!");
      let ConqueredCapital = checkCapitalsOwnership(defender).capital;
      let CountryOfTheCapital = ConqueredCapital.country;
      changeCountryOwnership(CountryOfTheCapital, atacker);
      let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum);
      pawnsGrrr = pawnsToBePlaced;

      if (playerPawnsCount[defender] <= pawnsToBePlaced) {
        // Handle game ending if defender can't pay required pawns
        let playersWithPawns = 0;
        let lastPlayerWithPawns = 0;

        for (let i = 1; i <= 4; i++) {
          if (i !== defender && playerPawnsCount[i] > 0) {
            playersWithPawns++;
            lastPlayerWithPawns = i;
          }
        }

        if (playersWithPawns === 1) {
          window.location.href = `player${lastPlayerWithPawns}_win.html`;
          return;
        }
      }

      pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
      let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
      playerPawnsCount[atacker] = parseInt(AddittionalSumThing);

      updatePlayerPawnsCount();
      updatePointDisplay(ConqueredCapital.id);
      alert("Изберете " + pawnsGrrr + " пула, които да предадете!");
      startSentOver = true;
    }
    else if (isACapitalBeingAttacked) {
      alert("Поздравления! Успешно защитихте столицата си");
      startSentOver = false;
      isACapitalBeingAttacked = false;
      switchTurn();
    }
    else {
      switchTurn();
    }
  }
}

// Add event listener for the end placing button
document.getElementById('endPlacingButton').addEventListener('click', function () {
  if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0 && players[3].remainingPawns === 0 && players[4].remainingPawns === 0) {
    alert("Разполагането на пулове приключи! Вече можете да ги местите!");
    isMovingPhase = true;
    this.style.display = 'none'; // Hide the button
    this.disabled = true; // Disable the button
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[2] || 'Играч 3'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns === 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[1] || 'Играч 2'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns === 0 && players[3].remainingPawns === 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[0] || 'Играч 1'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[1] || 'Играч 2'} и ${playerNames[2] || 'Играч 3'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns === 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[0] || 'Играч 1'} и ${playerNames[2] || 'Играч 3'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns === 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[0] || 'Играч 1'} и ${playerNames[1] || 'Играч 2'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0 && players[3].remainingPawns === 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[2] || 'Играч 3'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns === 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns === 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[1] || 'Играч 2'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns === 0 && players[3].remainingPawns === 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[0] || 'Играч 1'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns === 0) {
    alert(`${playerNames[0] || 'Играч 1'}, ${playerNames[1] || 'Играч 2'} и ${playerNames[2] || 'Играч 3'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns !== 0 && players[3].remainingPawns === 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[0] || 'Играч 1'}, ${playerNames[1] || 'Играч 2'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else if (players[1].remainingPawns !== 0 && players[2].remainingPawns === 0 && players[3].remainingPawns !== 0 && players[4].remainingPawns !== 0) {
    alert(`${playerNames[0] || 'Играч 1'}, ${playerNames[2] || 'Играч 3'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
  else {
    alert(`${playerNames[0] || 'Играч 1'}, ${playerNames[1] || 'Играч 2'}, ${playerNames[2] || 'Играч 3'} и ${playerNames[3] || 'Играч 4'}, разположете оставащите пулове!`);
  }
});

function confirmAttackOnAlreadyAttackedPlayer() {
  return confirm("Играчът вече e атакуван от друг играч. Да го атакувате и вие би било нечестно. Ако изберете да продължите със своя ход, ще получите 1 наказателна точка.");
}

function nullifyPlayerCountries(playerId) {
  players[playerId].countries.forEach(country => {
    pointsData.forEach(point => {
      if (point.country === country) {
        const circle = document.getElementById(point.id);
        if (circle) {
          circle.setAttribute("fill", "gray"); // Set to neutral color
        }
        point.OriginalOwner = 0; // No original owner
      }
    });
  });
  players[playerId].countries = [];
}

// Event listener for dropdown button
document.querySelector('.dropbtn').addEventListener('click', function() {
  console.log(`Diplomacy button clicked by Player ${currentPlayer}`);
  const sendPawnsElement = document.querySelector('.send-pawns');
  if (sendPawnsElement) {
      sendPawnsElement.style.display = 'block';
  }
});

// Event listener for send pawns option
document.querySelector('.send-pawns').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default link behavior
  document.querySelector('.send-pawns').style.display = 'none';
  if (movingHasStarted) {
      alert("Не можете да пращате пулове, след като вече сте започнали хода си.");
      return;
  }
  if (!isMovingPhase) {
      alert("Не можете да пращате пулове преди да приключи разполагането на пулове.");
      return;
  }
  const SendPawnsPanel = document.querySelector('.pawn-sender');
  populateReceiverDropdown(currentPlayer);
  SendPawnsPanel.style.display = 'block';
  selectedStartPoint = null;
});

// Populate receiver dropdown with organized logs
function populateReceiverDropdown(currentPlayerIndex) {
  console.log(`--- Populating Receiver Dropdown for Player ${currentPlayerIndex} ---`);
  const receiverSelect = document.getElementById('receiverSelect');
  if (!receiverSelect) {
      console.error('Error: receiverSelect element not found');
      return;
  }
  receiverSelect.innerHTML = ''; // Clear existing options
  console.log(`Player Names: ${JSON.stringify(playerNames)}`);

  playerNames.forEach((name, index) => {
      if (index + 1 === currentPlayerIndex || parseInt(playerPawnsCount[index + 1]) === 0) {
          console.log(`Skipping current player: Player ${index + 1} (${name || `Играч ${index + 1}`})`);
          return;
      }
      const option = document.createElement('option');
      option.value = index + 1;
      option.textContent = name || `Играч ${index + 1}`;
      const colors = ["blue", "green", "red", "orange"];
      option.style.color = colors[index] || "black";
      receiverSelect.appendChild(option);
      console.log(`Added receiver option: Player ${index + 1} (${option.textContent})`);
  });
  console.log(`--- Dropdown Population Complete ---`);
}

// Handle pawn sending with organized logs
function handlePawnSend() {
  console.log(`--- Handling Pawn Send for Player ${currentPlayer} ---`);
  const input = document.getElementById('pawnAmount');
  const amount = parseInt(input.value);
  const SendPawnsPanel = document.querySelector('.pawn-sender');
  const receiverSelect = document.getElementById('receiverSelect');
  const selectedReceiver = receiverSelect.value;
  const receiverIndex = parseInt(selectedReceiver); // Adjusted to directly parse the value

  console.log(`Selected Receiver: Player ${receiverIndex}`);
  console.log(`Amount Entered: ${amount}`);

  if (isNaN(amount) || amount <= 0) {
      alert("Моля въведете валиден брой пулове.");
      console.log(`Invalid amount entered: ${amount}`);
      input.value = '';
      return;
  }

  if (amount > playerPawnsCount[currentPlayer]) {
      alert("Нямате достатъчно пулове за изпращане.");
      console.log(`Insufficient pawns: Player ${currentPlayer} has ${playerPawnsCount[currentPlayer]}, tried to send ${amount}`);
      input.value = '';
      return;
  }

  if (receiverIndex === currentPlayer) {
      alert("Не можете да изпратите пулове на себе си.");
      console.log(`Attempted to send to self: Player ${currentPlayer}`);
      return;
  }

  if (parseInt(amount) === parseInt(playerPawnsCount[currentPlayer])) {
      const confirmLose = confirm("Ако изпратите всички пулове, ще загубите играта. Сигурни ли сте?");
      if (confirmLose) {
        console.log(`Player ${currentPlayer} chose to lose by sending all pawns (${amount}) to Player ${receiverIndex}`);
        playerPawnsCount[currentPlayer]=0;
        players[currentPlayer].capitalsNum = 0;
        ///here run a cycle that transfers all of his pawns to the reciever.
        Object.keys(pawnsOnPoints).forEach(pointId => {
            if (pawnsOnPoints[pointId].owner === currentPlayer) {
                pawnsOnPoints[pointId].owner = receiverIndex;
                updatePointDisplay(pointId);
            }
        });
        SendPawnsPanel.style.display = 'none';
        updatePlayerInfoDisplay();
        switchTurn();
        return;
      } else {
          console.log(`Player ${currentPlayer} canceled sending all pawns`);
          input.value = '';
          SendPawnsPanel.style.display = 'none';
          return;
      }
  }

  // Update pawn counts
  playerPawnsCount[currentPlayer] = parseInt(playerPawnsCount[currentPlayer]) - amount;
  playerPawnsCount[receiverIndex] = parseInt(playerPawnsCount[receiverIndex]) + amount;
  updatePlayerInfoDisplay();
  DemocraticSending = true;
  DemocraticSendingAmmount = amount;
  DemocraticReciever = receiverIndex;
  const NameCurrent = getCurrentPlayerName();
  alert(`${NameCurrent} трябва да избере ${amount} пула, които да предаде`);
  SendPawnsPanel.style.display = 'none';
  console.log(`Pawn send completed: Player ${currentPlayer} sent ${amount} pawns to Player ${receiverIndex}`);
  console.log(`--- Pawn Send Complete ---`);
}
