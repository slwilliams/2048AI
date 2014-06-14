// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var gm = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  var im = gm.inputManager;
  
  window.setInterval(function () {
  	var currentBoard = gm.grid.cells;
		var currentScore = gm.score;

  	var possibleMoves = [];
  	for(var i = 0; i < 4; i ++) {
  		possibleMoves.push(rank(tryMove(gm, currentBoard, i)));
  	}

  	var direction = getBestMove(possibleMoves);
    im.emit("move", direction);
  }, 50);
  
  // 0, Up
  // 1, Right
  // 2, Down
  // 3, Left
});

function getBestMove(moves) {
	var output = -1;
	var max = -1;
	for(var i = 0; i < moves.length; i ++) {
		if(moves[i] > max) {
			max = moves[i];
			output = i;
		}
	}
  if(moves.join(',').split(moves[0]).length == moves.length + 1) {
    output = Math.floor(Math.random()*4);
  }
  return output;
}

function tryMove(gm, board, direction) {
	var grid = new Grid(4, null);
	grid.cells = board;
  var cell, tile;
  var score = gm.score;

  var vector     = gm.getVector(direction);
  var traversals = gm.buildTraversals(vector);
  var moved      = false;

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = grid.cellContent(cell);

      if (tile) {
        var positions = findFarthestPosition(grid, cell, vector);
        var next      = grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          grid.insertTile(merged);
          grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          score += merged.value;

        } else {
        	grid.cells[tile.x][tile.y] = null;
  			  grid.cells[positions.farthest.x][positions.farthest.y] = tile;
          tile.updatePosition(positions.farthest);
        }       
      }
    });
  });

  return {board: grid.cells, score: score}; 
}

function rank(output) {
	return output.score;
}

function findFarthestPosition(grid, cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (grid.withinBounds(cell) &&
           grid.cellAvailable(cell));
  //console.dir(next);
  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};