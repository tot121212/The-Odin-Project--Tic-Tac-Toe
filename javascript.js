const Symbols = {
    EMPTY : '!',
    PLAYER1: 'X',
    PLAYER2: 'O'
}
const boardSize = 3;
Object.defineProperty(Symbols, 'EMPTY', { writable: false, configurable: false }); // ensure empty is immutable

const Player = (function(){
    let players = []

    const newPlayer = function(whichPlayer){
        if (whichPlayer > 1 || whichPlayer < 0){
            throw new Error('Cannot have more than two players');
        }
        const player = whichPlayer;
        const symbol = player === 0 ? Symbols.PLAYER1 : Symbols.PLAYER2;
    
        const getPlayerIndex = function(){
            return player;
        }
        const getSymbol = function(){
            return symbol;
        }
        
        players.push({ getPlayerIndex, getSymbol });
    }

    const getPlayers = function(){
        return players;
    }

    const getPlayer = function(whichPlayer){
        return players[whichPlayer];
    }

    return { newPlayer, getPlayer, getPlayers };
})();

const GameBoard = (function(){
    let board = [];

    const createBoard = function(n){
        // create square grid
        board = Array.from({ length: n }, () => Array(n).fill(Symbols.EMPTY));
    }

    const resetBoard = function(){
        createBoard(boardSize);
    }

    const getBoardLength = function(){
        return board.length;
    }

    const isLocationValid = function(idxs){
        const [row, column] = idxs;
        return row >= 0 && row < board.length && column >= 0 && column < board[row].length;
    }

    const getBoardSlotValue = function(idxs){
        if (!idxs) return null;

        const [row, column] = idxs;
        try {
            if (!isLocationValid(idxs)){
                throw new Error('Invalid board slot');
            }
        } catch (error) {
            console.log(error.message);
            return null;
        }
        
        return board[row][column];
    }

    const setBoardSlotValue = function(idxs, symbol){
        if (!idxs || !symbol) return null;
        const [row, column] = idxs;
        try {
            if (!Object.values(Symbols).includes(symbol)){
                throw new Error('Invalid symbol');
            }
            if (board[row][column] !== Symbols.EMPTY){
                throw new Error('Cannot overwrite existing symbol');
            }
        } catch (error) {
            console.log(error.message);
            return null;
        }
        
        board[row][column] = symbol;
        return true;
    }

    const getRows = function(){
        return board.slice();
    }

    const getColumns = function(){
        const columns = [];

        for (let col = 0; col < board.length; col++){
            // map col th element from the rows, and repeat
            const column = board.map(row => row[col]);
            columns.push(column);
        }

        return columns.slice();
    }

    const getDiagonals = function(){
        const leftToRightDiagonal = [];
        const rightToLeftDiagonal = [];
        for (let i = 0; i < board.length; i++){
            leftToRightDiagonal.push(board[i][i]);
            rightToLeftDiagonal.push(board[i][boardSize - 1 - i]);
        }
        return [leftToRightDiagonal, rightToLeftDiagonal].slice();
    }

    return { resetBoard, getBoardLength, setBoardSlotValue, getBoardSlotValue, getRows, getColumns, getDiagonals };
})();

const htmlHandler = (function(){
    let playerInput = null;

    const startListeningForPlayerInput = () => {
        const tableElement = document.querySelector(".ttt-board");
        tableElement.addEventListener('click', function(e){
            playerInput = e.target.getAttribute('data-id');
        });
    };

    const createPlayerInputPromise = () => {
        // returns new promise that either the player took too long or the player used an input
        return new Promise((resolve, reject) => {
            const timerHandle = setTimeout(() => {
                clearInterval(interval);
                reject("You took too long. Next players turn!");
            }, 10000);

            const interval = setInterval(() => {
                console.log("Awaiting player input");
                if (playerInput !== null){
                    clearTimeout(timerHandle);
                    clearInterval(interval);
                    const input = playerInput;
                    playerInput = null;
                    console.log(`Input recieved: ${String(input)}`);
                    resolve(input);
                }
            }, 250);
        });
    };

    const getPlayerInput = async () => {
        const input = await createPlayerInputPromise();
        try {
            if (input instanceof Error) throw new Error(input.message);
        } catch (error) {
            console.log(error.message);
            return null;
        }
        return input;
    }

    const initializeTable = (boardLength) => {
        const board = document.querySelector('.ttt-board');
        board.innerHTML = '';
        for (let i = 0; i < boardLength; i++){
            const row = document.createElement('tr');
            for (let j = 0; j < boardLength; j++){
                const cell = document.createElement('td');
                cell.setAttribute('data-id', `${i}, ${j}`);
                cell.innerHTML='0'
                row.appendChild(cell);
            }
            board.appendChild(row);
        }
    };

    const updateTableElementAtWith = (at, w) => {
        // query for specific element changes instead of updating the whole thing
        [row, column] = at; // destructure row and column
        try {
            const cell = document.querySelector(`td[data-id="${row}, ${column}"]`);
            if (!cell) throw new Error("HTML element does not exist");
            cell.textContent = w;
            if (!cell.textContent) throw new Error("HTML element textContent was not updated");
        } catch (error) {
            console.log(error.message);
            return null;
        }
        return true;
    };

    return { initializeTable, updateTableElementAtWith, getPlayerInput, startListeningForPlayerInput};
})();

const Game = (() => {
    // checks board for victories
    const checkForVictor = () => {
        let victor = null, whichSegment = null;
        // put all rows, columns, and diagonals into an array for iteration
        const allPossibleVictories = GameBoard.getRows().concat(GameBoard.getColumns()).concat(GameBoard.getDiagonals());
        // gets enums for each player, excluding empty
        const playerSymbols = Object.values(Symbols).slice().splice(1);
        // for each row, column, and diagonal of board
        for (const segment of allPossibleVictories){
            if (playerSymbols.includes(segment[0]) && segment.every(v => v === segment[0])){
                whichSegment = segment.slice(); // copy segment
                victor = whichSegment[0];
                break;
            }
        }
        if (!victor){
            return false;
        }
        console.log(`Victor: ${String(victor)}`);
        return { victor: victor };
    }

    const sanitizePlayerInput = (input) => {
        return input.replace(/[^0-9,]/g, "");
    }

    const parsePlayerInput = (input) => {
        return input.split(',').map(v => parseInt(v)-1); // parsed as array
    }
    
    const validatePlayerInput = (input) => {
        try {
            if (input.length !== 2){ 
                throw new Error('Invalid input length'); 
            }
            if (!(input.every(
                (value) => (
                    typeof(value) === "number"
                    && isFinite(value)
                    && Number.isInteger(value)
                )
            ))){ 
                throw new Error('Player input is not a real integer');
            }
            return input;
        } catch (error) {
            console.log(error.message);
            return null;
        }
    }

    const processPlayerInput = (input) => {
        if (!input) return null;
        const sanitizedInput = sanitizePlayerInput(input);
        const parsedInput = parsePlayerInput(sanitizedInput);
        const validatedInput = validatePlayerInput(parsedInput);
        return validatedInput;
    }

    const initializeGame = () => {
        // intitialize two new players
        for(let i = 0; i < 2; i++){
            Player.newPlayer(i);
        }

        // initialize game board
        GameBoard.resetBoard();
        const boardLength = GameBoard.getBoardLength();
        
        // init players
        const players = Player.getPlayers()

        // init first player
        let currentPlayer = Player.getPlayer(0);

        htmlHandler.initializeTable(boardLength);

        console.log("Game initialized");

        return { boardLength, players, currentPlayer };
    }

    // function that is run once the game loop ends
    const endGameLoop = (victoryInfo) => {
        if (!victoryInfo) return;
        victoryInfo.victor ? console.log(`${String(victoryInfo.victor)} won!`) : console.log('No one won...');
    }

    // start game loop
    const startGameLoop = async () => {
        const initGame = initializeGame();
        const { boardLength, players } = initGame;
        let { currentPlayer } = initGame;
        

        while (true){
            console.log(`${String(currentPlayer.getSymbol())}'s turn`);
            
            // ask for input
            let unprocessedInput = await htmlHandler.getPlayerInput();
            console.log("Unprocessed input: " + String(unprocessedInput));
            let playerInput = processPlayerInput(unprocessedInput);
            if (!playerInput) { continue; } // make sure to continue if player input is invalid, allow them to try again
            console.log("Player input: " + String(playerInput));

            GameBoard.setBoardSlotValue(playerInput, currentPlayer.getSymbol()); // set board slot
            (() => { // update html
                const boardSlotValue = GameBoard.getBoardSlotValue(playerInput);
                if (!boardSlotValue) { return null; }
                htmlHandler.updateTableElementAtWith(playerInput, boardSlotValue);
            })();

            const victoryInfo = checkForVictor();
            if (victoryInfo && victoryInfo.victor ){ return victoryInfo; }
            else { currentPlayer = Player.getPlayer((currentPlayer.getPlayerIndex() + 1) % players.length); }
        }
    }

    return { startGameLoop, endGameLoop };
})();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    htmlHandler.startListeningForPlayerInput();
    const victoryInfo = Game.startGameLoop();
    Game.endGameLoop(victoryInfo || null);
});