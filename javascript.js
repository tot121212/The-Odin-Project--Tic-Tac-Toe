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
    return getAllSymbols().slice(1);
}

const boardSize = 3;
Object.defineProperty(Symbols, 'EMPTY', { writable: false, configurable: false }); // ensure empty is immutable
// FOR USER DEFINITION

const Player = (function(){
    const players = [];
    let currentPlayer = null;

    const resetPlayers = () => {
        players.length = 0;
        currentPlayer = null;
    }
    
    const newPlayer = (s) => {
        const index = players.length;
        const symbol = String(s);
    
        const getPlayerIndex = function(){
            return index;
        }
        const getSymbol = function(){
            return symbol;
        }
        
        players.push({ getPlayerIndex, getSymbol });
        return players[index];
    }

    const getPlayers = function(){
        return players;
    }

    const getPlayer = function(idx){
        return players[idx];
    }

    const getCurrentPlayer = () => {
        return currentPlayer;
    }

    const setCurrentPlayer = (player) => {
        currentPlayer = player;
    }

    const getNextPlayer = () => {
        return getPlayer((Player.getCurrentPlayer().getPlayerIndex() + 1) % Player.getPlayers().length);
    }

    return { resetPlayers, newPlayer, getPlayer, getPlayers, getCurrentPlayer, setCurrentPlayer, getNextPlayer };
})();

const GameBoard = (function(){
    let board = [];

    const getBoardVisual = () => {
        const boardVisual = board.map(row => row.join(' | ')).join('\n' + '-'.repeat(board.length * 4 - 3) + '\n');
        return boardVisual;
    }

    const boardExists = () => {
        if (board.length === 0){
            return false;
        } else {
            return true;
        }
    }

    const createBoard = function(n){
        // create square grid
        board = Array.from({ length: n }, () => Array(n).fill(Symbols.EMPTY));
    }

    const initializeBoard = function(){
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
            return false;
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

    return { boardExists, initializeBoard, getBoardVisual, getBoardLength, setBoardSlotValue, getBoardSlotValue, getRows, getColumns, getDiagonals };
})();

const htmlHandler = (function(){
    const startListeningForPlayerInput = () => {
        const tableElement = document.querySelector(".ttt-board");
        tableElement.addEventListener('click', function(e){
            playerInput = e.target.getAttribute('data-id');
            if (typeof playerInput !== 'string') return;
            if (!Game.getIsGameInProgress()) return; // check if game is running before player move
            Game.onPlayerInput(playerInput);
            if (Game.getIsGameInProgress()){ // check if player has won, if so we dont need to do any before operations bc game is over
                Game.beforePlayerInput();
            }
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

    const getElementAt = (at) => {
        [row, column] = at;
        const cell = document.querySelector(`td[data-id="${row}, ${column}"]`);
        if (!cell) throw new Error("HTML element does not exist");
        return cell;
    };

    const updateTableElementAtWith = (at, w) => {
        // query for specific element changes instead of updating the whole thing
        [row, column] = at; // destructure row and column
        const cell = document.querySelector(`td[data-id="${row}, ${column}"]`);
        cell.textContent = w;
        if (!cell.textContent === w) throw new Error("HTML element textContent was not updated");
        return true;
    };

    // TODO: function to add victor class to td
    const addVictorClassTo = (at) => {
        cell = getElementAt(at);
        cell.classList.add('victor');
        return true;
    }

    return { initializeTable, updateTableElementAtWith, startListeningForPlayerInput};
})();

const Game = (() => {
    let isGameInProgress = false;
    const setIsGameInProgress = (b) => {
        if (typeof b !== 'boolean') return;
        if (b === true){
            console.log("Game has begun");
        }
        else if (b === false){
            console.log("Game has ended");
        }
        isGameInProgress = b;
    }
    const getIsGameInProgress = () => {
        return isGameInProgress;
    }

    const checkForNoVictor = (rows) => {
        // check if no victor
        let fullRowCount = 0;
        for (const row of rows){
            if (row.every(v => v !== Symbols.EMPTY)){
                fullRowCount++;
            }
        }
        if (fullRowCount >= GameBoard.getBoardLength()){
            return true;
        }
        return false;
    }

    // checks board for victories
    const checkForVictor = () => {
        let victorSymbol = null;
        const getVictorySymbol = () => { return victorSymbol };
        // put all rows, columns, and diagonals into an array for iteration
        const rows = GameBoard.getRows();

        // check if victor
        const columns = GameBoard.getColumns();
        const diagonals = GameBoard.getDiagonals();
        const allPossibleVictories = rows.concat(columns).concat(diagonals);
        // gets enums for each player, excluding empty
        const playerSymbols = getPlayerSymbols();
        // for each row, column, and diagonal of board
        for (const segment of allPossibleVictories){
            if (playerSymbols.includes(segment[0]) && segment.slice(1).every(v => v === segment[0])){
                victorSymbol = segment[0];
                break;
            }
        }
        if (checkForNoVictor(rows)){
            victorSymbol = "No Victor";
        } 
        
        if (victorSymbol){
            
            return { getVictorySymbol };
        }
        return null;
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
        console.log(GameBoard.getBoardVisual());
        console.log(`${Player.getCurrentPlayer().getSymbol()}'s turn`);
    }

    const initializeGame = () => {
        Player.resetPlayers();
        
        // intitialize new players
        for(symbol of getPlayerSymbols()){
            let newPlayer = Player.newPlayer(symbol);
            console.log(newPlayer);
        }

        // initialize game board
        GameBoard.initializeBoard();

        // init first player
        Player.setCurrentPlayer(Player.getPlayers()[0]);
        console.log(`Current player: ${Player.getCurrentPlayer().getSymbol()}`);

        htmlHandler.initializeTable(GameBoard.getBoardLength());

        console.log("Game initialized");
        Game.setIsGameInProgress(true);
        Game.beforePlayerInput(); // for performing stuff before/between turns
    }

    const onPlayerVictory = (victoryInfo) => {
        const symbol = victoryInfo.getVictorySymbol();
        console.log(victoryInfo);
        setIsGameInProgress(false);
        if (symbol === "No Victor"){
            console.log('No one won...');
        } else if (getPlayerSymbols().includes(symbol)){
            console.log(`${String(symbol)} won!`);
        }
    }

    const onPlayerInput = (playerInput) => {
        playerInput = processPlayerInput(playerInput);
        if (!playerInput) { 
            console.log("Invalid input format, please try again...");
            return;
        } // if player input is invalid, they need to try again
        console.log("Player input: " + String(playerInput));

        let wasBoardSlotFilled, boardSlotValue;
        try {
            wasBoardSlotFilled = GameBoard.setBoardSlotValue(playerInput, Player.getCurrentPlayer().getSymbol()); // set board slot
            if (!wasBoardSlotFilled) {
                throw new Error("Already taken / Invalid board slot, please try again...");
            }
            boardSlotValue = GameBoard.getBoardSlotValue(playerInput);
            if (!boardSlotValue) {
                throw new Error("Already taken / Invalid board slot, please try again...");
            }
        } catch (error) {
            console.log(error.message);
            return;
        }
        htmlHandler.updateTableElementAtWith(playerInput, boardSlotValue);

        const victoryInfo = checkForVictor();
        if (victoryInfo){
            onPlayerVictory(victoryInfo);
            return;
        }
        Player.setCurrentPlayer(Player.getNextPlayer());
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

    return { getIsGameInProgress, setIsGameInProgress, initializeGame, beforePlayerInput, onPlayerInput, onPlayerVictory };
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    Game.initializeGame();
    htmlHandler.startListeningForPlayerInput();
});