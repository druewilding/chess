// Chess UI - renders the board, handles piece selection and move highlights

export class ChessUI {
  constructor(boardElement, engine, options = {}) {
    this.boardEl = boardElement;
    this.engine = engine;
    this.flipped = options.flipped || false;
    this.interactive = options.interactive !== undefined ? options.interactive : true;
    this.onMove = options.onMove || null;
    this.onPromotionChoice = options.onPromotionChoice || null;

    this.selectedSquare = null;
    this.legalMoves = [];
    this.lastMove = null;
    this.pendingPromotion = null;

    this.pieceSymbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
    };

    this.buildBoard();
  }

  buildBoard() {
    this.boardEl.innerHTML = '';
    this.boardEl.classList.add('chess-board');

    this.squares = [];

    for (let displayRank = 0; displayRank < 8; displayRank++) {
      const row = [];
      for (let displayFile = 0; displayFile < 8; displayFile++) {
        const rank = this.flipped ? 7 - displayRank : displayRank;
        const file = this.flipped ? 7 - displayFile : displayFile;

        const square = document.createElement('div');
        square.className = 'square';
        square.classList.add((rank + file) % 2 === 0 ? 'light' : 'dark');
        square.dataset.rank = rank;
        square.dataset.file = file;

        // Coordinate labels
        if (displayFile === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord coord-rank';
          rankLabel.textContent = 8 - rank;
          square.appendChild(rankLabel);
        }
        if (displayRank === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord coord-file';
          fileLabel.textContent = 'abcdefgh'[file];
          square.appendChild(fileLabel);
        }

        square.addEventListener('click', () => this.handleSquareClick(rank, file));

        this.boardEl.appendChild(square);
        row.push(square);
      }
      this.squares.push(row);
    }

    this.render();
  }

  setFlipped(flipped) {
    this.flipped = flipped;
    this.buildBoard();
  }

  render() {
    for (let displayRank = 0; displayRank < 8; displayRank++) {
      for (let displayFile = 0; displayFile < 8; displayFile++) {
        const rank = this.flipped ? 7 - displayRank : displayRank;
        const file = this.flipped ? 7 - displayFile : displayFile;
        const square = this.squares[displayRank][displayFile];
        const piece = this.engine.getPiece(rank, file);

        // Remove old piece
        const oldPiece = square.querySelector('.piece');
        if (oldPiece) oldPiece.remove();

        // Remove state classes
        square.classList.remove('selected', 'legal-move', 'legal-capture', 'last-move', 'in-check');

        if (piece) {
          const pieceEl = document.createElement('span');
          pieceEl.className = `piece piece-${piece.color}`;
          pieceEl.textContent = this.pieceSymbols[piece.color][piece.type];
          square.appendChild(pieceEl);
        }

        // Highlight last move
        if (this.lastMove) {
          if ((rank === this.lastMove.from.rank && file === this.lastMove.from.file) ||
              (rank === this.lastMove.to.rank && file === this.lastMove.to.file)) {
            square.classList.add('last-move');
          }
        }

        // Highlight selected square
        if (this.selectedSquare && rank === this.selectedSquare.rank && file === this.selectedSquare.file) {
          square.classList.add('selected');
        }

        // Highlight legal moves
        const isLegalTarget = this.legalMoves.some(m => m.rank === rank && m.file === file);
        if (isLegalTarget) {
          const targetPiece = this.engine.getPiece(rank, file);
          // Also check en passant
          const isEnPassant = this.legalMoves.some(m => m.rank === rank && m.file === file && m.enPassant);
          if (targetPiece || isEnPassant) {
            square.classList.add('legal-capture');
          } else {
            square.classList.add('legal-move');
          }
        }

        // Highlight king in check
        if (piece && piece.type === 'king' && piece.color === this.engine.turn && this.engine.isInCheck(this.engine.turn)) {
          square.classList.add('in-check');
        }
      }
    }
  }

  handleSquareClick(rank, file) {
    if (!this.interactive || this.engine.gameOver) return;

    // If we have a pending promotion, ignore board clicks
    if (this.pendingPromotion) return;

    const piece = this.engine.getPiece(rank, file);

    // If a piece is selected and we clicked on a legal target
    if (this.selectedSquare) {
      const isLegalTarget = this.legalMoves.some(m => m.rank === rank && m.file === file);

      if (isLegalTarget) {
        // Check if this is a promotion move
        const promotionMove = this.legalMoves.find(m => m.rank === rank && m.file === file && m.promotion);
        if (promotionMove) {
          this.showPromotionDialog(rank, file);
          return;
        }

        this.executeMove(this.selectedSquare.rank, this.selectedSquare.file, rank, file);
        return;
      }

      // Clicked on own piece - reselect
      if (piece && piece.color === this.engine.turn) {
        this.selectPiece(rank, file);
        return;
      }

      // Clicked elsewhere - deselect
      this.clearSelection();
      return;
    }

    // No piece selected - select if it's the current player's piece
    if (piece && piece.color === this.engine.turn) {
      this.selectPiece(rank, file);
    }
  }

  selectPiece(rank, file) {
    this.selectedSquare = { rank, file };
    this.legalMoves = this.engine.getLegalMoves(rank, file);
    this.render();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.legalMoves = [];
    this.render();
  }

  executeMove(fromRank, fromFile, toRank, toFile, promotion = null) {
    const moveData = this.engine.makeMove(fromRank, fromFile, toRank, toFile, promotion);
    if (!moveData) return;

    this.lastMove = moveData;
    this.clearSelection();

    if (this.onMove) {
      this.onMove(moveData);
    }
  }

  showPromotionDialog(toRank, toFile) {
    const fromRank = this.selectedSquare.rank;
    const fromFile = this.selectedSquare.file;
    const color = this.engine.turn;

    this.pendingPromotion = { fromRank, fromFile, toRank, toFile };

    // Create promotion overlay
    const overlay = document.createElement('div');
    overlay.className = 'promotion-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';

    const pieces = ['queen', 'rook', 'bishop', 'knight'];
    for (const pieceType of pieces) {
      const btn = document.createElement('button');
      btn.className = 'promotion-choice';
      btn.textContent = this.pieceSymbols[color][pieceType];
      btn.addEventListener('click', () => {
        overlay.remove();
        this.executeMove(fromRank, fromFile, toRank, toFile, pieceType);
        this.pendingPromotion = null;
      });
      dialog.appendChild(btn);
    }

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.pendingPromotion = null;
      }
    });

    this.boardEl.parentElement.appendChild(overlay);
  }

  // Apply a move from remote (already validated)
  applyRemoteMove(moveData) {
    this.lastMove = moveData;
    this.clearSelection();
  }

  // Set the last move highlight without clearing selection
  setLastMove(moveData) {
    this.lastMove = moveData;
  }

  updateCapturedPieces(capturedDisplayWhite, capturedDisplayBlack) {
    if (capturedDisplayWhite) {
      capturedDisplayWhite.innerHTML = '';
      for (const type of this.engine.capturedPieces.white) {
        const span = document.createElement('span');
        span.className = 'captured-piece';
        span.textContent = this.pieceSymbols.black[type];
        capturedDisplayWhite.appendChild(span);
      }
    }
    if (capturedDisplayBlack) {
      capturedDisplayBlack.innerHTML = '';
      for (const type of this.engine.capturedPieces.black) {
        const span = document.createElement('span');
        span.className = 'captured-piece';
        span.textContent = this.pieceSymbols.white[type];
        capturedDisplayBlack.appendChild(span);
      }
    }
  }
}
