const Symbols = {
    EMPTY : 'empty',
    PLAYER1: 'X',
    PLAYER2: 'O'
}
const boardSize = 3;

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

    const getBoardSlot = function(idxs){
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

    const setBoardSlot = function(idxs, symbol){
        const [row, column] = idxs;
        try {
            if (!Symbols.includes(symbol)){
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

    const getRows = function(board){
        return board.slice();
    }

    const getColumns = function(board){
        const columns = [];

        for (let col = 0; col < board.length; col++){
            // map col th element from the rows, and repeat
            const column = board.map(row => row[col]);
            columns.push(column);
        }

        return columns.slice();
    }

    const getDiagonals = function(board){
        const leftToRightDiagonal = [];
        const rightToLeftDiagonal = [];
        for (let i = 0; i < board.length; i++){
            leftToRightDiagonal.push(board[i][i]);
            rightToLeftDiagonal.push(board[i][boardSize - 1 - i]);
        }
        return [leftToRightDiagonal, rightToLeftDiagonal].slice();
    }

    return { resetBoard, getBoardLength, setBoardSlot, getBoardSlot, getRows, getColumns, getDiagonals };
})();

const htmlHandler = (function(){
    const updateBoard = function(){
        for (row of GameBoard.getRows()){
            // set table entire row
            continue;
        }
    }

    return { updateBoard };
});

const Game = (function(){
    // checks board for victories
    const checkForVictor = function(){
        let victor, whichSegment;
        // put all rows, columns, and diagonals into an array for iteration
        const allPossibleVictories = GameBoard.getRows().concat(GameBoard.getColumns()).concat(GameBoard.getDiagonals());
        // gets enums for each player, excluding empty
        const playerSymbols = Symbols.values.slice().splice(1)
        // for each row, column, and diagonal of board
        for (const segment in allPossibleVictories){
            /* 
            if
                first element is a player symbol (ensures that we dont misconstrude the empty as a victory),
                and every element is the same as said player symbol,
                then
                    that player has won
            */
            if (playerSymbols.contains(segment[0]) && segment.every(v => v === segment[0])){
                whichSegment = segment.slice();
                break;
            }
        }
        return { segment: whichSegment, victor: whichSegment[0] };
    }

    const parsePlayerInput = function(playerInput){
        return playerInput.split(',').map(v => parseInt(v)-1); // parsed as array
    }

    const validatePlayerInput = function(playerInput){
        try {
            switch (playerInput) {
                case playerInput.length === 2:
                    throw new error('Invalid input length');
                case playerInput.every(value => (typeof value) === "number" && isFinite(value) && Number.isInteger(value)):
                    throw new error('Player input is not a real integer');
                default:
                    break;
            }
        } catch (error) {
            console.log(error.message);
            return false;
        }
        return true;
    }

    const initializeGame = function(){
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

        console.log("Game initialized");

        return { boardLength, players, currentPlayer };
    }

    // function that is run once the game loop ends
    const endGameLoop = function(victoryInfo){
        victoryInfo ? console.log(`${String(victoryInfo.playerWhoWon)} won!`) : console.log('No one won...');
    }

    // start game loop
    const startGameLoop = function(){
        const { boardLength, players, currentPlayer } = initializeGame();

        while (true){
            alert(`${String(currentPlayer.getSymbol())}'s turn`);
            // ask for input, parse, validate
            let playerInput = parsePlayerInput(prompt(`Enter your move": ', 'row: 1/${boardLength}, column: 1/${boardLength}`));
            try {
                if (!validatePlayerInput(playerInput)){
                    throw new Error('Invalid player input');
                }
            } catch (error) {
                console.log(error.message);
                continue;
            }
            GameBoard.setBoardSlot(playerInput, currentPlayer.getSymbol());
            (async() => {
                htmlHandler.updateBoard();
            })();

            const victoryInfo = checkForVictor();
            // if there is a player who won
            if (victoryInfo.victor){
                // end game loop when a player has won
                return victoryInfo;
            }
            else{ // noone has won, so switch player to next
                currentPlayer = Player.getPlayer((currentPlayer.getPlayerIndex() + 1) % players.length);
            }
        }
    }
})();

Document.addEventListener('DOMContentLoaded', () => {
    Game.startGameLoop() ? Game.endGameLoop(victoryInfo) : Game.endGameLoop(false); // pass victor of game or false
});