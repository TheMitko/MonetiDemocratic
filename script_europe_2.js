const playersCountries = JSON.parse(localStorage.getItem("playersCountries")) || { 1: [], 2: [] };
const gameData = JSON.parse(localStorage.getItem("gameData")) || { pawnsCount: 3, playerNames: [] };
const playerNames = gameData.playerNames;
const SkipPawns = gameData.skipPawns;

// Променлива за следене на броя пулове на всеки играч
const maxPawnsPerPlayer = gameData.pawnsCount;
const playerPawnsCount = { 1: maxPawnsPerPlayer, 2: maxPawnsPerPlayer };

let selectedStartPoint = null;
let isMovingPhase = false; // Следене на фазата на преместване
let currentPlayer = 1; // Следене на текущия играч
let captureOptions = []; // Опции за кацане при улавяне
let dinamicCaptureOptions = []; // Опции за кацане при улавяне, когато SkipPawns е true
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
let skippingEnded=false;
let startingPointId = null;
let yellowPoints = [];
let oldPawnIds = [];
let movingHasStarted = false;
let DemocraticSending = false;
let DemocraticSendingAmmount = 0;
let DemocraticallySentPawns = 0;
let DemocraticReciever = 0;
let ignoreFirst = false;

const players = {
  1: { color: "blue", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[1], capitalsNum: 4 },
  2: { color: "green", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[2], capitalsNum: 4 }
};

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
  const opponentId = playerId === 1 ? 2 : 1;
  const capitals = pointsData.filter(point => point.capital && point.OriginalOwner === playerId);

  for (const capital of capitals) {
    if (pawnsOnPoints[capital.id].owner === opponentId) {
      return { underAttack: true, capital: capital }; // Има противникови пулове на първоначално ваша столица
    }
  }
  return { underAttack: false, capital: null }; // Няма противникови пулове на първоначално ваша столица
}

function changeCountryOwnership(country, newOwner) {
  pointsData.forEach(point => {
    if (point.country === country) {
      const circle = document.getElementById(point.id);
      if (circle) {
        circle.setAttribute("fill", newOwner === 1 ? players[1].color : players[2].color);
      }
      if(defender !== 0)players[defender].countries = players[defender].countries.filter(c => c !== country);
      point.OriginalOwner = newOwner; // Update the original owner for future reference
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
}

// Обновяване на текста в таблото с имената на играчите
function updatePlayerInfoDisplay() {
  document.getElementById("player1-name").textContent = playerNames[0] || 'Играч 1';
  document.getElementById("player2-name").textContent = playerNames[1] || 'Играч 2';
  document.getElementById("player1-capitals-info").innerHTML = `столици: <span id="player1-capitals" class="player1-capitals">${players[1].capitalsNum}</span>`;
  document.getElementById("player1-info").innerHTML = `пулове: <span id="player1-pawns" class="player1-пawns">${playerPawnsCount[1]}</span>`;
  document.getElementById("player2-capitals-info").innerHTML = `столици: <span id="player2-capitals" class="player2-capitals">${players[2].capitalsNum}</span>`;
  document.getElementById("player2-info").innerHTML = `пулове: <span id="player2-pawns" class="player2-пawns">${playerPawnsCount[2]}</span>`;
}

updatePlayerInfoDisplay(); // Извикване на функцията за първоначално обновяване на дисплея
updateCapitalsCount(); // Initial update of the capitals count

function getCurrentPlayerName() {
  return playerNames[currentPlayer - 1] || `Играч ${currentPlayer}`;
}

// Стартиране на функцията за осигуряване на двупосочни връзки
makeConnectionsBidirectional(pointsData);

// Инициализиране на предупреждение за уведомяване на играчите за старта на разпределянето на пуловете
alert("Започва разполагането на пулове за двама играчи!");

// Създаване на карта за следене на пуловете на всяка точка
const pawnsOnPoints = {};
const pointNames = {}; // Създаване на обект за имена на точките
// Helper function to check country ownership
function checkCountryOwnership(point) {
  const country = point.country;
  if (country) {
    if (players[1].countries.includes(country)) {
      return 1; // Player 1 owns this country
    } else if (players[2].countries.includes(country)) {
      return 2; // Player 2 owns this country
    }
  }
  return null; // No player owns this point's country
}

function QuestionThePlayer() {
  return confirm("Искате ли да прескочите пул, в съседство на избраната точка за кацане?");
}

function highlightPointsForCapture(pointId)
{
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

function unhighlightPointsForCapture()
{
  for (const pointId in pawnsInfoBeforeHighlight) {
    pawnsOnPoints[pointId].owner = pawnsInfoBeforeHighlight[pointId].owner;
   if(skippingEnded) {
    Y=false;
    console.log("A point has been unhighlighted " + pointId);
    updatePointDisplay(pointId);

    skippingEnded=false;
   }
  }
  yellowPoints = [];
}

// Обработчик на събития за избиране на точка
function selectPoint(pointId) {
  if(DemocraticSending)
  {
    ignoreFirst = true;
    console.log("DemocraticSending is true");
      if (pawnsOnPoints[pointId].owner === currentPlayer && pawnsOnPoints[pointId].pawns !== 0) { // Дали сме избрали точка с наши пулове
        console.log("Selected point has current player's pawns");
        DemocraticallySentPawns += 1; ///Изпращаме първи пул
        console.log(`Sending pawn ${DemocraticallySentPawns}/${DemocraticSendingAmmount}`);
        pawnsOnPoints[pointId].owner = DemocraticReciever; ///Пулът променя собственика си
        console.log(`Point ${pointId} owner changed to ${DemocraticReciever}`);
        updatePointDisplay(pointId); //Обновяваме визуализацията на точката
        console.log(`Point ${pointId} display updated`);
        if (DemocraticallySentPawns === DemocraticSendingAmmount) { //Дали сме изпратили необходимото количество пулове
          console.log("All pawns democratically sent");
          DemocraticReciever = null; //Нулираме получателя
          DemocraticSendingAmmount = 0; //Нулираме необходимото количество пулове
          DemocraticSending = false; //Спираме изпращането на пулове
          DemocraticallySentPawns = 0; //Нулираме изпратените пулове
          ignoreFirst = true; //Игнорираме първото кликване, защото то е фиктивно
          console.log("DemocraticReciever set to null, DemocraticSendingAmmount set to 0, DemocraticSending set to false, ignoreFirst set to true");
          alert("Можете да продължите с хода си.");
        }
      }
      else if (pawnsOnPoints[pointId].pawns < 1) { // Проверка дали точката има пулове
        console.log("Selected point has no pawns");
        alert("Изберете точка, на която има пулове");
        pointId = null;
        return;
      }
      else if (pawnsOnPoints[pointId].owner !== currentPlayer) { // Проверка дали точката e с наши пулове
        console.log("Selected point does not have current player's pawns");
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

        playerPawnsCount[pawnsOnPoints[pointId].owner] -= pawnsOnPoints[pointId].pawns;
        updatePlayerPawnsCount();
        pawnsOnPoints[pointId].pawns = 0;
        pawnsOnPoints[pointId].owner = null;
        updatePointDisplay(pointId);

        alert("Изберете точка за кацане");

        captureIsHappening = true;
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[validChoice].pawns += numPawns;
        if (pawnsOnPoints[validChoice].pawns === 1) {
          pawnsOnPoints[validChoice].owner = currentPlayer;
        }
        X = false;
        return;
      }

    
    pawnsChoiceStarted = false;
  }
  if (captureIsHappening) {
    const validChoice = dinamicCaptureOptions.find(option => option === pointId);
    ValidChoice=validChoice;
    if (!validChoice || yellowPoints.includes(validChoice)===false) {
      return;
    }
    if(pawnsOnPoints[validChoice].owner !== currentPlayer && pawnsOnPoints[validChoice].pawns !== 0) {
      alert("Не можете да кацате върху противникови пулове");
      return;
    }

    oldPawnIds=[];

    dinamicCaptureOptions.forEach(option => {
      const circle = document.getElementById(option);
      const point = pointsData.find(p => p.id === option);
      if (circle && point) {
        if(pawnsOnPoints[option].pawns !== 0) {
        circle.setAttribute("r", point.capital ? 22 : 10);
        } 
        else {circle.setAttribute("r", point.capital ? 22 : 7);}
        circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) : "gray");
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

    if (doubleSkipPossibility === true && QuestionThePlayer() === true) {
      Y=false;
      
      highlightPointsForCapture(pointId);

      pawnsOnPoints[pointId].pawns = 0;
      pawnsOnPoints[pointId].owner = null;
      updatePointDisplay(pointId);
      

      alert("Изберете противникови пулове за прескачане");
      doupleSkipPossibility = false;
      captureIsHappening = true;
      Y=false;
    }
    else {
      
      captureIsHappening = false;
      dinamicCaptureOptions = [];
      console.log(`verka`);
      skippingEnded=true;
      unhighlightPointsForCapture();
      Y=true;
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
        if (atacker === 1) {
          console.log("player2 has " + playerPawnsCount[1] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
          if (playerPawnsCount[2] <= pawnsToBePlaced) {

            window.location.href = "player2_win.html";
            return;
          }
        }
        else if (atacker === 2) {
          console.log("player1 has " + playerPawnsCount[2] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
          if (playerPawnsCount[1] <= pawnsToBePlaced) {
            window.location.href = "player1_win.html";
            return;
          }
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
  else if(ignoreFirst === false){
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
        const destinationPoint = pointId;
        if (selectedStartPoint === destinationPoint) {
          alert("Избрахте една и съща точка. Изберете друга точка за дестинация");
          selectedStartPoint = null;
          return;
        }
        console.log(`Преместване от ${selectedStartPoint} до ${destinationPoint}. Данни на началната точкя:`, pawnsOnPoints[selectedStartPoint], `Данни на дестинацията:`, pawnsOnPoints[destinationPoint]);
        movePawns(selectedStartPoint, destinationPoint);
        selectedStartPoint = null;
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
  } else {
    alert("Тази точка не принадлежи на никого.");
    return;
  }

  const playerName = playerNames[player === players[1] ? 0 : 1] || `Играч ${player === players[1] ? 1 : 2}`;


  const maxPawnsToPlace = player.remainingPawns;
  const numPawns = parseInt(prompt(`Колко пулове искате да поставите? (Max: ${maxPawnsToPlace})
За да препоставите пул, въведете отрицателно число`), 10);

if (player.remainingPawns <=  0 && numPawns > 0) {
  alert(`${playerName} няма оставащи пулове.`);
  return;
}

if (isNaN(numPawns)  || numPawns > maxPawnsToPlace || numPawns < -pawnsOnPoints[pointId].pawns) {
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
  pawnsOnPoints[pointId].owner = player === players[1] ? 1 : 2;

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

  movingHasStarted=true;

  const numPawns = 1; // Може да се премести само един пул наведнъж

  // Актуализиране на броя пулове за преместването
  pawnsOnPoints[startPointId].pawns -= numPawns;
  if (pawnsOnPoints[startPointId].pawns === 0) {
    pawnsOnPoints[startPointId].owner = null;
    console.log(`Пулове на точка ${startPointId} бяха преместени.`);
  }

  if (pawnsOnPoints[destinationPointId] === 0) {
    pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
  }

  if (SkipPawns) {
    if (pawnsOnPoints[destinationPointId].owner && pawnsOnPoints[destinationPointId].owner !== currentPlayer  && pawnsOnPoints[destinationPointId].pawns !== 0) {
      X = true; // Поставяне на X на true при прескачане

      dinamicCaptureOptions = [];
      destinationPoint.connections.forEach(connectionId => {
        if (pawnsOnPoints[connectionId].pawns === 0 && connectionId !== startPointId && connectionId !== destinationPointId) {
          dinamicCaptureOptions.push(connectionId);
        }
      });

      if (dinamicCaptureOptions.length > 0) {
        oldPawnIds.push(startPointId);
        oldPawnIds.push(destinationPointId);
        highlightConnections(destinationPointId); // Highlight connections for SkipPawns logic

        playerPawnsCount[pawnsOnPoints[destinationPointId].owner] -= pawnsOnPoints[destinationPointId].pawns;
        updatePlayerPawnsCount();
        pawnsOnPoints[destinationPointId].pawns = 0;
        pawnsOnPoints[destinationPointId].owner = null;
        updatePointDisplay(destinationPointId);

        alert("Изберете точка за кацане");
        console.log(dinamicCaptureOptions);

        captureIsHappening = true;
      }
      else {
        alert("Няма празни точки за кацане.");
        pawnsOnPoints[startPointId].pawns += numPawns;
        if (pawnsOnPoints[startPointId].pawns === 1) {
          pawnsOnPoints[startPointId].owner = currentPlayer;
        }
        X=false;
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

      if (atacker === 1) {
        console.log("player2 has " + playerPawnsCount[1] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[2] <= pawnsToBePlaced) {

          window.location.href = "player2_win.html";
          return;
        }
      }
      else if (atacker === 2) {
        console.log("player1 has " + playerPawnsCount[2] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[1] <= pawnsToBePlaced) {
          window.location.href = "player1_win.html";
          return;
        }
      }

      console.log("Trqbva da se postavqt" + pawnsToBePlaced);
      console.log("atacker sega ima" + playerPawnsCount[atacker]);

      let AddittionalSumThing = parseInt(playerPawnsCount[atacker]) + parseInt(pawnsToBePlaced);
      console.log("sumata" + parseInt(AddittionalSumThing));
      playerPawnsCount[atacker] = parseInt(AddittionalSumThing);

      console.log("veche ima" + playerPawnsCount[atacker]);
      updatePlayerPawnsCount();
      updatePointDisplay(ConqueredCapital.id);

      if (atacker === 1) {
        console.log("player2 has " + playerPawnsCount[1] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[2] <= pawnsToBePlaced) {

          window.location.href = "player2_win.html";
          return;
        }
      }
      else if (atacker === 2) {
        console.log("player1 has " + playerPawnsCount[2] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[1] <= pawnsToBePlaced) {
          window.location.href = "player1_win.html";
          return;
        }
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
      circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) : "gray");
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
      if (atacker === 1) {
        console.log("player2 has " + playerPawnsCount[1] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[2] <= pawnsToBePlaced) {

          window.location.href = "player2_win.html";
          return;
        }
      }
      else if (atacker === 2) {
        console.log("player1 has " + playerPawnsCount[2] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[1] <= pawnsToBePlaced) {
          window.location.href = "player1_win.html";
          return;
        }
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
      textColor = originalOwner === 1 ? players[1].color : players[2].color;
      fontSize = "18"; // Increased font size from 14 to 18
      fontWeight = "bold"; // Added bold font weight
    } else {
      fillColor = pawnsOnPoints[pointId].owner === 1 ? players[1].color : players[2].color;
      textColor = "white"; // Use white text color for player colors
      fontSize = "14"; // Default font size
      fontWeight = "normal"; // Default font weight
    }
    circle.setAttribute("fill", fillColor);
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
      circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) : "gray"); console.log(checkCountryOwnership(point)); // Установяване на цвета на кръга
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
    circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) : "gray");
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
  movingHasStarted = false;
  // Check if any player has 0 pawns and open the corresponding win page
  if (playerPawnsCount[1] === 0) {
    window.location.href = "player2_win.html";
    return;
  }
  if (playerPawnsCount[2] === 0) {
    window.location.href = "player1_win.html";
    return;
  }

  resetHighlights();
  unhighlightPointsForCapture();
  pawnsInfoBeforeHighlight = {};
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  alert(`Сега е ред на ${getCurrentPlayerName()} да мести пуловете си.`);

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

  if (checkCapitalsOwnership(currentPlayer).underAttack && isACapitalBeingAttacked === false && defenderMoveMade === false) {
    alert("Има противникови пулове на ваша столица, защитете я!");
    isACapitalBeingAttacked = true;
    if (currentPlayer === 1) { atacker = 2; defender = 1; console.log('atacker=2,defender=1 ') }
    if (currentPlayer === 2) { atacker = 1; defender = 2; console.log('atacker=1,defender=2 ') }
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
          (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) :
        "gray"
      );
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

      if (atacker === 1) {
        console.log("player2 has " + playerPawnsCount[1] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[2] <= pawnsToBePlaced) {

          window.location.href = "player2_win.html";
          return;
        }
      }
      else if (atacker === 2) {
        console.log("player1 has " + playerPawnsCount[2] + " pawns. Need to place " + pawnsToBePlaced + " pawns.");
        if (playerPawnsCount[1] <= pawnsToBePlaced) {
          window.location.href = "player1_win.html";
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

document.getElementById('endPlacingButton').addEventListener('click', function() {
  if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0) {
    alert("Разполагането на пулове приключи! Вече можете да ги местите!");
    isMovingPhase = true;
    this.style.display = 'none'; // Hide the button
    this.disabled = true; // Disable the button
  }
  else if(players[1].remainingPawns === 0 && players[2].remainingPawns !== 0) {
    alert(`${playerNames[1] || 'Играч 2'}, разположете оставащите пулове!`);
  }
  else if(players[1].remainingPawns !== 0 && players[2].remainingPawns === 0) {
    alert(`${playerNames[0] || 'Играч 1'}, разположете оставащите пулове!`);
  }
  else {
    alert(`${playerNames[0] || 'Играч 1'} и ${playerNames[1] || 'Играч 2'}, разположете оставащите пулове!`);
  }
});

document.querySelector('.dropbtn').addEventListener('click',function(){
  console.log("CLICKED!");
  const sendPawnsElement = document.querySelector('.send-pawns');
  if (sendPawnsElement) {
    console.log("There is such an element");
    sendPawnsElement.style.display = 'block'; ///It still doesn't get displayed
  }
})

document.querySelector('.send-pawns').addEventListener('click', function(e) {
  document.querySelector('.send-pawns').style.display = 'none';
    e.preventDefault(); // Prevent default link behavior
    if(movingHasStarted) {
        alert("Не можете да пращате пулове, след като вече сте започнали хода си.");
        return;
    }
    if(!isMovingPhase) {
        alert("Не можете да пращате пулове преди да приключи разполагането на пулове.");
        return;
    }
    const SendPawnsPanel=document.querySelector('.pawn-sender');
    SendPawnsPanel.style.display = 'block';
    selectedStartPoint = null; 
});

function handlePawnSend() {
  const input = document.getElementById('pawnAmount');
  const amount = parseInt(input.value);
  const SendPawnsPanel = document.querySelector('.pawn-sender');
  console.log("")
  if (isNaN(amount) || amount <= 0) {  //Дали е число и дали е неотрицанелно
    alert("Моля въведете валиден брой пулове.");
    input.value = '';
    return;
  }
  
  if (parseInt(amount) > parseInt(playerPawnsCount[currentPlayer])) { // Дали играчът не се опитва да изпрати повече пулове от наличните
    alert("Нямате достатъчно пулове за изпращане.");
    input.value = '';
    return;
  }

  if (parseInt(amount) === parseInt(playerPawnsCount[currentPlayer])) { // Дали играчът не се опитва да изпрати всичките си пулове
    const confirmLose = confirm("Ако изпратите всички пулове, ще загубите играта. Сигурни ли сте?");
    if (confirmLose) {
      window.location.href = currentPlayer === 1 ? "player2_win.html" : "player1_win.html";
      return;
    } else {
      input.value = '';
      SendPawnsPanel.style.display = 'none';
      return;
    }
  }

  playerPawnsCount[currentPlayer] -= parseInt(amount); // Намаляване на пуловете на текущия играч
  let opponent;
  if (currentPlayer === 1) {
    opponent = 2;
  } else {
    opponent = 1;
  }
  playerPawnsCount[opponent] = parseInt(amount) + parseInt(playerPawnsCount[opponent]); // Увеличаване на пуловете на противника
  updatePlayerInfoDisplay(); // Актуализиране на информацията за броя пулове на играчите
  DemocraticSending = true; // Поставяне на флага за изпращане на пулове, следва да се избере точка чрез SelectPoint
  DemocraticSendingAmmount = amount; // Запазване на количеството пулове, които ще бъдат изпратени
  DemocraticReciever = opponent;
  const NameCurrent=getCurrentPlayerName();
  alert(NameCurrent + " трябва да избере " + amount + " пула, които да предаде");
  SendPawnsPanel.style.display = 'none';
}



