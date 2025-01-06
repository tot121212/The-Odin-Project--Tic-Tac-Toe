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
    
    const createBoard = function(n, fillValue = 0){
        // create square grid
        board = Array.from({ length: n }, () => Array(n).fill(fillValue));
    }

    const resetBoard = function(){
        createBoard(boardSize);
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

    return { setBoardSlot, resetBoard, getRows, getColumns, getDiagonals };
})();

const Game = (function(){
    for(let i = 0; i < 2; i++){
        Player.newPlayer(i);
    }
    // initialize game board
    GameBoard.resetBoard();

    let updateHtml = function(){
        // update html
        for (let row = 0; row < 3; row++){
            for (let column = 0; column < 3; column++){
                // update html of element
            }
        }
    }

    // if we have an amount of values that adds up to the boardSize and all symbols are the same, we have a winner
    let checkForVictor = function(){
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

    let endGame = function(victoryInfo){
        console.log(`${String(victoryInfo.playerWhoWon)} won!`);
    }

    // start game loop of asking for input from each player
    let startGameLoop = function(){
        // init game board
        GameBoard.resetBoard();
        // init players
        const players = Player.getPlayers()
        // get first player
        let currentPlayer = Player.getPlayer(0);
        while (true){
            alert(`${String(currentPlayer.getSymbol())}'s turn`);
            // ask for input
            let playerInput = prompt('Enter your move": ', 'row, column');
            // parse player input
            playerInput = playerInput.split(',').map(v => parseInt(v+1));
            // check for victory
            if (playerInput.length !== 2 && playerInput.filter(/* instance of int*/)){
                console.log('Invalid player input');
                continue; // force player to enter valid input
            }
            // check input location for existing move
            if (GameBoard.getBoard()[playerInput[0]][playerInput[1]] !== Symbols.EMPTY){
                console.log('Board location is already taken');
                continue; // force player to enter valid input
            }
            // player input is valid
            // apply player input to board
            
            GameBoard.setBoardSlot(playerInput, currentPlayer.getSymbol());


            const victoryInfo = checkForVictor();
            // if there is a player who won
            if (victoryInfo.victor){
                break;
            }
            else{ // switch player to next
                currentPlayer = Player.getPlayer((currentPlayer.getPlayerIndex() + 1) % players.length);
            }
        }
        endGame(victoryInfo);
    }

    // end game loop when a player has one
})();

Document.addEventListener('DOMContentLoaded', () => {
    Game.startGameLoop();
});