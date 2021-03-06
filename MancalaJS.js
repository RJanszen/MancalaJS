var board;
var p1turn;
var docElements;
var gameMode;

newGame(2);

// Start a new game, mode can be either 1 (vs. AI) or 2 (2 player mode)
function newGame(mode) {
	document.getElementById('turnAnnouncer').style.visibility='visible';
	document.getElementById('playerTurn').style.visibility='visible';
	document.getElementById('waiting').style.visibility='hidden';
	document.getElementById('player1Wins').style.visibility='hidden';
	document.getElementById('player2Wins').style.visibility='hidden';

	// Set the board, each pit gets 4 beads, kalaha's get none
	board = {
		p2board	: [ 4, 4, 4, 4, 4, 4 ],		// p2   :  	5 4 3 2 1 0 
		p1board	: [ 4, 4, 4, 4, 4, 4 ],		// base : p2 		    p1
		p1base	: 0,						// p1   : 	0 1 2 3 4 5
		p2base	: 0
	};
	// Player one starts
	p1turn = true;
	gameMode = mode; // 1 - 2 //

	updateBoard();
}

// Read the current state of board objects (p1board and p2board), update elements in the HTML file
function updateBoard() {
	docElements = {
		pit1_1t : board.p1board[0],
		pit1_2t : board.p1board[1],
		pit1_3t : board.p1board[2],
		pit1_4t : board.p1board[3],
		pit1_5t : board.p1board[4],
		pit1_6t : board.p1board[5],
		pit2_1t : board.p2board[0],
		pit2_2t : board.p2board[1],
		pit2_3t : board.p2board[2],
		pit2_4t : board.p2board[3],
		pit2_5t : board.p2board[4],
		pit2_6t : board.p2board[5],
		kalaha1t: board.p1base,
		kalaha2t: board.p2base
	}

	// Find each HTML element
	for (var pit in docElements) {
		document.getElementById(pit).innerHTML = docElements[pit];
	}

	// Update them, and give it a color depending on the player's turn (Green for turn==true, white for turn==false)
	for (var pit in docElements) {
		if (p1turn === true && pit.includes('pit1')) document.getElementById(pit.slice(0, -1)).style.backgroundColor = 'Green';
		else if (p1turn === false && pit.includes('pit2')) document.getElementById(pit.slice(0, -1)).style.backgroundColor = 'Green';
		else document.getElementById(pit.slice(0, -1)).style.backgroundColor = 'White';
	}

	// Update the element which states whose turn is true
	if (p1turn === true) document.getElementById('playerTurn').innerHTML = ' Player 1';
	else document.getElementById('playerTurn').innerHTML = ' Player 2';
}

// Make a new turn, which takes the index of the pit, and the player who makes the move
function newTurn(index, player) {
	if (board.p1board[index] > 0 && p1turn === true && player === 1) {
		startTurnP1(index);
	} else if (board.p2board[index] > 0 && p1turn === false && player === 2 && gameMode === 2) {
		startTurnP2(index);
	} // If a player didn't make a new turn on his/her own pit, nothing happens (not allowed)
}

// Start a player 1 turn, which takes the pit number, this functions is called after the 'new turn' function, and is thus verified as allowed
function startTurnP1(socket) {
	var hand = board.p1board[socket];
	board.p1board[socket] = 0;
	passBeadsP1(++socket, hand);
}

// Same but for player 2
function startTurnP2(socket) {
	var hand = board.p2board[socket];
	board.p2board[socket] = 0;
	passBeadsP2(++socket, hand);
}

// Pass a number of beads to a given socket owned by player 1, this iterates until the hand is empty
function passBeadsP1(socket, hand) {
	hand--;
	if (socket === 6 && p1turn === true) { // Passed to own kalaha
		board.p1base++;
		if (hand > 0) passBeadsP2(0, hand); // Pass on to opposite side of the board
		else if (!containsHigherThanNull(board.p1board)) endTurn();
	} else if (socket === 6 && p1turn === false) passBeadsP2(0, ++hand); // Opponent's kalaha, pass to next
	else if (hand > 0) { // Pass to own pit
		board.p1board[socket]++;
		passBeadsP1(++socket, hand);
	} else if (hand === 0 && p1turn === true && board.p1board[socket] === 0 && board.p2board[oppositeOf(socket)] > 0) { // Time to steal some beads?
		board.p1board[socket]++;
		stealBeadsP1(oppositeOf(socket), socket);
		endTurn();
	} else { // No beads to steal, end the turn
		board.p1board[socket]++;
		endTurn();
	}
	updateBoard();
}

// Same but for player 2
function passBeadsP2(socket, hand) {
	hand--;
	if (socket === 6 && p1turn === false) {
		board.p2base++;
		if (hand > 0) passBeadsP1(0, hand);
		else if (!containsHigherThanNull(board.p2board)) endTurn();
		else if (gameMode === 1) {
			document.getElementById('waiting').style.visibility='visible';
			newComputerTurn();
		}
	} else if (socket === 6 && p1turn === true) passBeadsP1(0, ++hand);
	else if (hand > 0) {
		board.p2board[socket]++;
		passBeadsP2(++socket, hand);
	} else if (hand === 0 && p1turn === false && board.p2board[socket] === 0 && board.p1board[oppositeOf(socket)] > 0) {
		board.p2board[socket]++;
		stealBeadsP2(oppositeOf(socket), socket);
		endTurn();
	} else {
		board.p2board[socket]++;
		endTurn();
	}
	updateBoard();
}

// Steal beads from player 2
function stealBeadsP1(index2, index1) {
	board.p1base += (1 + board.p2board[index2] + board.p1board[index1]);
	board.p2board[index2] = 0;
	board.p1board[index1] = 0;
}

// Steal beads from player 1
function stealBeadsP2(index1, index2) {
	board.p2base += (1 + board.p1board[index1] + board.p2board[index2]);
	board.p1board[index1] = 0;
	board.p2board[index2] = 0;
}

// Find the opposite socket of a given pit number
function oppositeOf(socket) {
	return 5 - socket;
}

// Check if there are more than zero beads left on a player's side (takes the p1 or p2 board)
function containsHigherThanNull(array) {
	var higherThanNull = false;
	for(var i = 0; i < array.length; i++) {
		if (array[i] > 0) higherThanNull = true;
	}
	return higherThanNull;
}

// End of turn function, which checks if the game has ended yet (beads left to play?)
function endTurn() {
	p1turn = !p1turn;
	if (gameMode === 1 && p1turn === false) { // AI takes a turn if game mode is single player
		if (containsHigherThanNull(board.p2board) == false) endGame();
		else setTimeout(newComputerTurn(), 3000);
	} else {
		if (p1turn === true && containsHigherThanNull(board.p1board) == false)  {
			endGame();
		} else if (p1turn === false && containsHigherThanNull(board.p2board) == false) {
			endGame();
		}
	}
}

// End of game, hide/show different HTML elements
function endGame() {
	p1turn = null;
	document.getElementById('turnAnnouncer').style.visibility='hidden';
	document.getElementById('playerTurn').style.visibility='hidden';
	if (board.p1base > board.p2base) document.getElementById('player1Wins').style.visibility='visible';
	else if (board.p2base > board.p1base) document.getElementById('player2Wins').style.visibility='visible';
	else newGame(2);
}



// AI //

// Computer's turn, find the best option (highest score)
function newComputerTurn() {
	document.getElementById('waiting').style.visibility='visible';
	setTimeout( function() {
		if (containsHigherThanNull(board.p2board) === false) endTurn();

		var index = 0;
		var score = 0; // Higher score means better option
		for (var i = 0; i < board.p2board.length; i++){ // For each pit, find out of a move is possible, and what the eventual result will be
			if (board.p2board[i] > 0) {
				var turnScore = 0;
				if (canKalaha(i) && score < 3) turnScore += 3; // Score 3 points if the turn will result in ending in own kalaha (extra turn)
				turnScore += canProtect(i) + canSteal(i); // If a pit can be protected from stealing, or if a steal can be made, add the points (protected or stolen) to the score

				if (turnScore > score) { // If protecting/stealing is a better option than ending in own kalaha, do it!
					score = turnScore;
					index = i;
				}
			}
		}
		startTurnP2(index);
		document.getElementById('waiting').style.visibility='hidden';
	}, 2000)
}

// Check if starting a move on a pit will result in stealing opponent's beads
function canSteal(index) {
	var score = 0;
	var endIndex = (board.p2board[index] + index) % 13; // What will the last pit be to drop a bead in

	if (endIndex < 6 && board.p2board[endIndex] === 0 && board.p1board[oppositeOf(endIndex)] > 0) // How much can be stolen here
		score = board.p1board[oppositeOf(endIndex)] + 1;
	return score;
}

// Check if starting a move on a pit will result in ending in own kalaha
function canKalaha(index) {
	var can = false
	var endIndex = (board.p2board[index] + index) % 13;

	if (endIndex === 6) can = true;
	return can;
}

// Check if the opponent can potentially steal from this pit on the next turn
function canProtect(index) {
	var score = 0;
	if (board.p1board[oppositeOf(index)] === 0) score = board.p2board[index];
	else score = board.p2board[index] / 3;

	return score;
}