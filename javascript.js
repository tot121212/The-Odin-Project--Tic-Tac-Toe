// FOR USER DEFINITION
// Enum for symbols...
const Symbols = {
    EMPTY  : ' ',
    PLAYER1: 'X',
    PLAYER2: 'O'
}
const getAllSymbols = () => {
    return Object.values(Symbols).slice();
}
// for getting available symbols, excluding the empty one
const getPlayerSymbols = () => {
    return getAllSymbols.slice(1);
}

const boardSize = 3;
Object.defineProperty(Symbols, 'EMPTY', { writable: false, configurable: false }); // ensure empty is immutable
// FOR USER DEFINITION

const Player = (function(){
    let players = [];
    let currentPlayer = null;

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

    const getCurrentPlayer = () => {
        return currentPlayer;
    }

    const setCurrentPlayer = (whichPlayer) => {
        currentPlayer = players[whichPlayer];
    }

    return { newPlayer, getPlayer, getPlayers, getCurrentPlayer, setCurrentPlayer };
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
            if (!getAllSymbols().includes(symbol)){
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
    const startListeningForPlayerInput = () => {
        const tableElement = document.querySelector(".ttt-board");
        tableElement.addEventListener('click', function(e){
            playerInput = e.target.getAttribute('data-id');
            if (typeof playerInput !== 'string') return;
            Game.onPlayerInput(playerInput);
            Game.beforePlayerInput(); // for next player
        });
    };

    const initializeTable = (boardLength) => {
        const board = document.querySelector('.ttt-board');
        board.innerHTML = '';
        for (let i = 0; i < boardLength; i++){
            const row = document.createElement('tr');
            for (let j = 0; j < boardLength; j++){
                const cell = document.createElement('td');
                cell.setAttribute('data-id', `${i}, ${j}`);
                cell.innerHTML = Symbols.EMPTY;
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

    return { initializeTable, updateTableElementAtWith, startListeningForPlayerInput};
})();

const Game = (() => {
    let gameIsRunning = false;
    const setGameIsRunning = (b) => {
        if (typeof b !== 'boolean') return;
        gameIsRunning = b;
    }
    const getGameIsRunning = () => {
        return gameIsRunning;
    }

    // checks board for victories
    const checkForVictor = () => {
        let victor = null, whichSegment = null;
        // put all rows, columns, and diagonals into an array for iteration
        const allPossibleVictories = GameBoard.getRows().concat(GameBoard.getColumns()).concat(GameBoard.getDiagonals());
        // gets enums for each player, excluding empty
        const playerSymbols = getPlayerSymbols();
        // for each row, column, and diagonal of board
        for (const segment of allPossibleVictories){
            if (playerSymbols.includes(segment[0]) && segment.every(v => v === segment[0])){
                whichSegment = segment.slice(); // copy segment
                victorSymbol = whichSegment[0];
                break;
            }
        }
        if (!victorSymbol){
            return false;
        }
        console.log(`Victors Symbol: ${String(victorSymbol)}`);
        return { victorSymbol: victorSymbol };
    }

    const sanitizePlayerInput = (input) => {
        return input.replace(/[^0-9,]/g, "");
    }

    const parsePlayerInput = (input) => {
        return input.split(',').map(v => parseInt(v)); // parsed as array
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

    const beforePlayerInput = () => {
        console.log(`${String(Player.getCurrentPlayer().getSymbol())}'s turn`);
    }

    const initializeGame = () => {
        // intitialize new players
        let amtOfPlayers = getPlayerSymbols().length;
        for(let i = 0; i < amtOfPlayers; i++){
            Player.newPlayer(i);
        }

        // initialize game board
        GameBoard.resetBoard();

        // init first player
        Player.setCurrentPlayer(Math.floor(Math.random() * Player.getPlayers().length - 1));

        htmlHandler.initializeTable(GameBoard.getBoardLength());

        console.log("Game initialized");
        Game.beforePlayerInput(); // for performing stuff before/between turns
    }

    const onPlayerVictory = (victoryInfo) => {
        if (!(victoryInfo instanceof Object)) return;
        if (typeof victoryInfo.victorSymbol !== 'string') return;
        if (victoryInfo.victorSymbol === ''){
            console.log('No one won...');
        } else if (getPlayerSymbols().includes(victoryInfo.victorySymbol)){
            console.log(`${String(victoryInfo.victorSymbol)} won!`);
        }
    }

    const onPlayerInput = (playerInput) => {
        playerInput = processPlayerInput(playerInput);
        if (!playerInput) { 
            console.log("Invalid input format, please try again...");
            return;
        } // if player input is invalid, they need to try again
        console.log("Player input: " + String(playerInput));

        GameBoard.setBoardSlotValue(playerInput, Player.getCurrentPlayer().getSymbol()); // set board slot
        const boardSlotValue = GameBoard.getBoardSlotValue(playerInput);
        if (!boardSlotValue) {
            console.log("Already taken / Invalid board slot, please try again...");
            return;
        }
        htmlHandler.updateTableElementAtWith(playerInput, boardSlotValue);

        const victoryInfo = checkForVictor();
        if (victoryInfo instanceof Object){ 
            onPlayerVictory(victoryInfo); 
            return; 
        }
        else {
            Player.setCurrentPlayer((Player.getCurrentPlayer().getPlayerIndex() + 1) % Player.getPlayers().length);
        }
    }

    /*
    // function that is run once the game loop ends
    
    
    // start game loop
    const startGameLoop = () => {
        while (true){
            console.log(`${String(Player.getCurrentPlayer().getSymbol())}'s turn`);
            
            // ask for input
            let unprocessedInput = htmlHandler.createPlayerInputPromise();
            console.log("Unprocessed input: " + String(unprocessedInput));
            let playerInput = processPlayerInput(unprocessedInput);
            if (!playerInput) { continue; } // make sure to continue if player input is invalid, allow them to try again
            console.log("Player input: " + String(playerInput));

            GameBoard.setBoardSlotValue(playerInput, Player.getCurrentPlayer().getSymbol()); // set board slot
            (() => { // update html
                const boardSlotValue = GameBoard.getBoardSlotValue(playerInput);
                if (!boardSlotValue) { return null; }
                htmlHandler.updateTableElementAtWith(playerInput, boardSlotValue);
            })();

            const victoryInfo = checkForVictor();
            if (victoryInfo && victoryInfo.victor ){ return victoryInfo; }
            else {
                Player.setCurrentPlayer((Player.getCurrentPlayer().getPlayerIndex() + 1) % Player.getPlayers().length);
            }
        }
    }
    */

    return { setGameIsRunning, getGameIsRunning, initializeGame, beforePlayerInput, onPlayerInput, onPlayerVictory };
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    Game.initializeGame();
    htmlHandler.startListeningForPlayerInput();
});