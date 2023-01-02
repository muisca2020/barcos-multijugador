document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector(".grid-user");
    const cpuGrid = document.querySelector(".grid-cpu");
    const displayGrid = document.querySelector(".grid-display");

    const ships = document.querySelectorAll(".ship");
    const destroyer = document.querySelector(".destroyer-container");
    const submarine = document.querySelector(".submarine-container");
    const cruiser = document.querySelector(".cruiser-container");
    const battleship = document.querySelector(".battleship-container");
    const carrier = document.querySelector(".carrier-container");

    const startButton = document.querySelector("#start");
    const rotateButton = document.querySelector("#rotate");
    const turnDisplay = document.querySelector("#turn");
    const infoDisplay = document.querySelector("#info");
    
    const setupButtons = document.querySelector("#setup-buttons");
    const width = 10;
    const userSquares = [];
    const cpuSquares = [];

    let isGameOver = false;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = true;
    let playerNum = 0;
    let shotsFired = -1;
    let currentPlayer = 'user';
    let isHorizonal = true;

    const shipsArray = [
        {
            name: destroyer,
            directions: [
                [0, 1],
                [0, width]
            ]
        },
        {
            name: submarine,
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: cruiser,
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: battleship,
            directions: [
                [0, 1, 2, 3],
                [0, width, width * 2, width * 3]
            ]
        },
        {
            name: carrier,
            directions: [
                [0, 1, 2, 3, 4],
                [0, width, width * 2, width * 3, width * 4]
            ]
        }
    ];

    createBoard(userGrid, userSquares);
    createBoard(cpuGrid, cpuSquares);

    if (gameMode === 'singlePlayer') {
        startSinglePlayer();
    } else {
        startMultiPlayer();
    }

    function startMultiPlayer() {
        const socket = io();

        socket.on('player-number', num => {
            if ( num === -1 ) {
                infoDisplay.innerHTML = "El servidor está lleno";
            } else {
                playerNum = parseInt(num);
                if (playerNum === 1) currentPlayer = "enemy";

                console.log(playerNum);

                socket.emit('check-players');
            }
        });

        socket.on('player-connection', num => {
            console.log(`Jugador ${num} se fue`);
            playerConnectedOrDisconnected(num);
        });

        socket.on('enemy-ready', num => {
            enemyReady = true;
            playerReady(num);
            if ( ready ) {
                playGameMulti( socket );
                setupButtons.style.display = 'none';
            }
        });

        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if ( p.connected ) playerConnectedOrDisconnected ( i );
                if ( p.ready ) {
                    playerReady( i );
                    if ( i !== playerReady ) enemyReady = true;
                }
            })
        });

        socket.on('timeout', () => {
            infoDisplay.innerHTML = "¿Sigues ahí? Se te acabo el tiempo";
        });

        startButton.addEventListener('click', () => {
            if ( allShipsPlaced ) playGameMulti( socket );
            else infoDisplay.innerHTML = "Debes poner todos los barcos primero";
        });

        cpuSquares.forEach( square => {
            square.addEventListener('click', () => {
                if ( currentPlayer === 'user' && ready && enemyReady ) {
                    shotsFired = square.dataset.id;
                    socket.emit('fire', shotsFired);
                }
            });
        });

        socket.on('fire', id => {
            enemyGo(id);
            const square = userSquares[id];
            socket.emit('fire-reply', square.classList);
            playGameMulti(socket);
        });

        socket.on('file-reply', classList => {
            revealSquare(classList);
            playGameMulti(socket);
        });

        function playerConnectedOrDisconnected( num ) {
            let player = `.p${parseInt(num) + 1}`;
            document.querySelector(`${player} .connected`).classList.toggle('active');
            if ( parseInt( num ) === playerNum ) document.querySelector(player).style.fontWeight = 'bold';
        }
    }

    function startSinglePlayer() {
        generar(shipsArray[0]);
        generar(shipsArray[1]);
        generar(shipsArray[2]);
        generar(shipsArray[3]);
        generar(shipsArray[4]);

        startButton.addEventListener('click', () => {
            setupButtons.style.display = 'none';
            playGameSingle();
        });
    }

    function createBoard(grid, squares) {
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.dataset.id = i;
            grid.appendChild(square);
            squares.push(square);
        }
    }

    function generar(ship) {
        let randomDirection = Math.floor(Math.random() * ship.directions.length);
        let current = ship.directions[randomDirection];
        if (randomDirection === 0) directions = 1;
        if (randomDirection === 1) directions = 10;
        let randomStart = Math.abs(Math.floor(Math.random() * cpuSquares.length - (ship.directions[0].length * directions)));

        const isTaken = current.some(index => cpuSquares[randomStart + index].classList.contains('taken'));
        const isAtRigthEdge = current.some(index => (randomStart + index) % width === width - 1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === width - 0);

        if (!isTaken && !isAtRigthEdge && !isAtLeftEdge) current.forEach(index => cpuSquares[randomStart + index].classList.add('taken', ship.name))
        else generar(ship);
    }

    function rotate() {
        if ( isHorizonal ) {
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical');
            isHorizonal = false;
            return;
        }
        if ( !isHorizonal ) {
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical');
            isHorizonal = true;
            return;
        }
    }

    rotateButton.addEventListener('click', rotate);

    ships.forEach( ship => ship.addEventListener('dragstart', dragStart));
    userSquares.forEach( square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach( square => square.addEventListener('dragover', dragOver));
    userSquares.forEach( square => square.addEventListener('dragenter', dragEnter));
    userSquares.forEach( square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach( square => square.addEventListener('drop', dragDrop));
    userSquares.forEach( square => square.addEventListener('dragend', dragEnd));

    let selectedShipNameWithIndex;
    let draggedShip;
    let draggedShipLength;

    ships.forEach( ship => ship.addEventListener('mousedown', e => {
        selectedShipNameWithIndex = e.target.id;
    }));

    function dragStart () {
        draggedShip = this;
        draggedShipLength = this.childNodes.length;
    }

    function dragOver ( e ) {
        e.preventDefault();
    }

    function dragEnter ( e ) {
        e.preventDefault();
    }

    function dragLeave () {

    }

    function dragDrop () {
        let shipNameWithLastId = draggedShip.lastChild.id;
        let shipClass = shipNameWithLastId.slice(0, -2);
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
        let shipLastId = lastShipIndex + parseInt(this.dataset.id);

        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93];
        const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60];

        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

        shipLastId = shipLastId - selectedShipIndex;

        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                let directionClass;
                if (i === 0) directionClass = 'start';
                if (i === draggedShipLength - 1) directionClass = 'end';
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass);
            }
            // Siempre que el índice de la nave que está arrastrando no esté en la matriz newNotAllowedVertical. Esto significa que a veces si arrastras el barco por su index-1 , index-2 y así sucesivamente, el barco regresará a displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                let directionClass;
                if (i === 0) directionClass = 'start';
                if (i === draggedShipLength - 1) directionClass = 'end';
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i].classList.add('taken', 'vertical', directionClass, shipClass);
            }
        } else return;

        displayGrid.removeChild(draggedShip)
        if (!displayGrid.querySelector('.ship')) allShipsPlaced = true
    }

    function dragEnd() {

    }

    // Logica para el Multijugador
    function playGameMulti(socket) {
        setupButtons.style.display = 'none';
        if (isGameOver) return;
        if (!ready) {
            socket.emit('player-ready');
            ready = true;
            playerReady(playerNum);
        }

        if (enemyReady) {
            if (currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Tu turno';
            }
            if (currentPlayer === 'enemy') {
                turnDisplay.innerHTML = "Turno enemigo";
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .ready`).classList.toggle('active');
    }

    // Game Logic for Single Player
    function playGameSingle() {
        if (isGameOver) return;
        if (currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Tu turno';
            cpuSquares.forEach(square => square.addEventListener('click', function (e) {
                shotFired = square.dataset.id;
                revealSquare(square.classList);
            }))
        }
        if (currentPlayer === 'enemy') {
            turnDisplay.innerHTML = 'Computers Go';
            setTimeout(enemyGo, 1000);
        }
    }

    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    function revealSquare(classList) {
        const enemySquare = cpuGrid.querySelector(`div[data-id='${shotFired}']`);
        const obj = Object.values(classList);
        if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
            if (obj.includes('destroyer')) destroyerCount++;
            if (obj.includes('submarine')) submarineCount++;
            if (obj.includes('cruiser')) cruiserCount++;
            if (obj.includes('battleship')) battleshipCount++;
            if (obj.includes('carrier')) carrierCount++;
        }
        if (obj.includes('taken')) {
            enemySquare.classList.add('boom');
        } else {
            enemySquare.classList.add('miss');
        }
        checkForWins();
        currentPlayer = 'enemy';
        if (gameMode === 'singlePlayer') playGameSingle();
    }

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    function enemyGo(square) {
        if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length);
        if (!userSquares[square].classList.contains('boom')) {
            const hit = userSquares[square].classList.contains('taken');
            userSquares[square].classList.add(hit ? 'boom' : 'miss');
            if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
            if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++;
            if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
            if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
            if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++;
            checkForWins();
        } else if (gameMode === 'singlePlayer') enemyGo();
        currentPlayer = 'user';
        turnDisplay.innerHTML = 'Tu turno';
    }

    function checkForWins() {
        let enemy = 'computer';
        if (gameMode === 'multiPlayer') enemy = 'enemy';
        if (destroyerCount === 2) {
            infoDisplay.innerHTML = `Hundiste el destructor de ${enemy}`;
            destroyerCount = 10;
        }
        if (submarineCount === 3) {
            infoDisplay.innerHTML = `Hundiste el submarino de ${enemy}`;
            submarineCount = 10;
        }
        if (cruiserCount === 3) {
            infoDisplay.innerHTML = `Hundiste el bote de${enemy}`;
            cruiserCount = 10;
        }
        if (battleshipCount === 4) {
            infoDisplay.innerHTML = `Hundiste el barco de ${enemy}`;
            battleshipCount = 10;
        }
        if (carrierCount === 5) {
            infoDisplay.innerHTML = `Hundiste el carguero de${enemy}`;
            carrierCount = 10;
        }
        if (cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = `${enemy} hundio tu destructor`;
            cpuDestroyerCount = 10;
        }
        if (cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = `${enemy} hundio tu submarino`;
            cpuSubmarineCount = 10;
        }
        if (cpuCruiserCount === 3) {
            infoDisplay.innerHTML = `${enemy} hundio tu bote`;
            cpuCruiserCount = 10;
        }
        if (cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = `${enemy} hundio tu barco`;
            cpuBattleshipCount = 10;
        }
        if (cpuCarrierCount === 5) {
            infoDisplay.innerHTML = `${enemy} hundio tu carguero`;
            cpuCarrierCount = 10;
        }

        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
            infoDisplay.innerHTML = "GANASTE";
            gameOver();
        }
        if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
            infoDisplay.innerHTML = `${enemy.toUpperCase()} GANA`;
            gameOver();
        }
    }

    function gameOver() {
        isGameOver = true;
        startButton.removeEventListener('click', playGameSingle);
    }
});