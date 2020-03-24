
// Namespace
/////////////////////////////////////////////

this.montana = this.montana || { };


(function() {

  "use strict";



  // Constructor
  /////////////////////////////////////////////

  function Montana($) {

    // Imports
    /////////////////////////////////////////////

    var Range  = bwco.math.Range,
        Keys   = bwco.utils.Keys,
        Maths  = bwco.utils.Maths,
        Random = bwco.utils.Random;


    // Constants
    /////////////////////////////////////////////

    var SHUFFLE_SWAP_COUNT = 5000;

    var RESTART_INTERVAL_SECS = 0.05,
        ACES_TIMEOUT_SECS     = 0.75;

    var SPACING_X = 50,
        SPACING_Y = 68;


    // Elements
    /////////////////////////////////////////////

    var $doc  = $(document);
    var $win  = $(window);
    var $body = $("body");

    var $blanksList = $("ul#blanks");
    var $cardsList  = $("ul#cards");

    var $newGameBtn    = $("button#new-game-btn");
    var $restartBtn    = $("button#restart-btn");
    var $shuffleBtn    = $("button#shuffle-btn");
    var $undoBtn       = $("button#undo-btn");
    var $hintsCheckbox = $("input#hints-checkbox");

    var $boardBlock = $("#board-block")


    // Private properties
    /////////////////////////////////////////////

    var _rows      = [
      [
        { suit: 0, value: 1 },
        { suit: 0, value: 2 },
        { suit: 0, value: 3 },
        { suit: 0, value: 4 },
        { suit: 0, value: 5 },
        { suit: 0, value: 6 },
        { suit: 0, value: 7 },
        { suit: 0, value: 8 },
        { suit: 0, value: 9 },
        { suit: 0, value: 10 },
        { suit: 0, value: 11 },
        { suit: 0, value: 12 },
        { suit: 0, value: 13 }
      ],
      [
        { suit: 1, value: 1 },
        { suit: 1, value: 2 },
        { suit: 1, value: 3 },
        { suit: 1, value: 4 },
        { suit: 1, value: 5 },
        { suit: 1, value: 6 },
        { suit: 1, value: 7 },
        { suit: 1, value: 8 },
        { suit: 1, value: 9 },
        { suit: 1, value: 10 },
        { suit: 1, value: 11 },
        { suit: 1, value: 12 },
        { suit: 1, value: 13 }
      ],
      [
        { suit: 2, value: 1 },
        { suit: 2, value: 2 },
        { suit: 2, value: 3 },
        { suit: 2, value: 4 },
        { suit: 2, value: 5 },
        { suit: 2, value: 6 },
        { suit: 2, value: 7 },
        { suit: 2, value: 8 },
        { suit: 2, value: 9 },
        { suit: 2, value: 10 },
        { suit: 2, value: 11 },
        { suit: 2, value: 12 },
        { suit: 2, value: 13 }
      ],
      [
        { suit: 3, value: 1 },
        { suit: 3, value: 2 },
        { suit: 3, value: 3 },
        { suit: 3, value: 4 },
        { suit: 3, value: 5 },
        { suit: 3, value: 6 },
        { suit: 3, value: 7 },
        { suit: 3, value: 8 },
        { suit: 3, value: 9 },
        { suit: 3, value: 10 },
        { suit: 3, value: 11 },
        { suit: 3, value: 12 },
        { suit: 3, value: 13 }
      ]
    ];

    var _overCard    = null;

    var _totalShuffles,
      _history;

    var _acesTimeout;


    // Event handlers
    /////////////////////////////////////////////

    function onNewGameClick(e) {

      startNewGame();

    }
    function onRestartClick(e) {

      restartGame();

    }
    function onUndoBtnClick(e) {

      undoLastMove();

    }
    function onShuffleBtnClick(e) {

      reshuffle();

    }

    function onCardOver(e) {

      var $el    = $(this);
      var card  = getCardFromCardEl($el);

      if (card && card.placeable) {
        _overCard  = card;
        update();
      }

    }
    function onCardOut(e) {

      _overCard  = null;
      update();

    }
    function onCardClick(e) {

      var $el      = $(this);
      var card    = getCardFromCardEl($el);

      if (!card) return;

      var swapCard  = getMatchingAce(card);

      if (swapCard) {
        pushHistory();
        swapCards(card, swapCard);
      }

      _overCard    = null;

      update();

    }

    function onBlankOver(e) {

      var $el    = $(this);
      var card  = getCardFromBlankEl($el);

      if (card && !card.closed) {
        _overCard  = card;
        update();
      }

    }
    function onBlankOut(e) {

      _overCard  = null;
      update();

    }
    function onBlankClick(e) {

      var $el    = $(this);
      var card  = getCardFromBlankEl($el);

      if (!card) return;
      if (card.closed) return;

      var prevCard  = getPrevCard(card);

      while (prevCard && prevCard.value == 1) {
        card    = prevCard;
        prevCard  = getPrevCard(card);
      }

      var swapCard  = getMatchingCard(card);

      if (swapCard) {
        pushHistory();
        swapCards(card, swapCard);
      }

      _overCard    = null;

      update();


    }

    function onKeyDown(e) {

      switch(e.keyCode) {

        case Keys.keyCodeOf("n"):
          startNewGame();
          break;

        case Keys.keyCodeOf("r"):
          restartGame();
          break;

        case Keys.keyCodeOf("u"):
          undoLastMove();
          break;

        case Keys.keyCodeOf("s"):
          reshuffle();
          break;

       }

    }


    // Private methods
    /////////////////////////////////////////////

    function initView() {

      var templateBlank  = $.templates("#template-blank");
      var templateCard  = $.templates("#template-card");

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        for (var j = 0; j < row.length; j++) {
          var card    = row[j];

          // Blanks
          /////////////////////////////////////////////

          var htmlBlank  = templateBlank.render();
          var $blank    = $(htmlBlank);
            $blank.data({
              "row": i,
              "col": j
            })
            $blank.css({
              "left": j * SPACING_X,
              "top": i * SPACING_Y
            });
            $blank.hover(onBlankOver, onBlankOut);
            $blank.click(onBlankClick);

          $blanksList.append($blank)

          // Cards
          /////////////////////////////////////////////

          var htmlCard  = templateCard.render(card);
          var $card    = $(htmlCard);
            $card.hover(onCardOver, onCardOut);
            $card.click(onCardClick);

          card.$el    = $card
          $cardsList.append(card.$el);

        }
      }

    }
    function initEvents() {

      $newGameBtn.click(onNewGameClick);
      $restartBtn.click(onRestartClick);
      $undoBtn.click(onUndoBtnClick);
      $shuffleBtn.click(onShuffleBtnClick);

      $doc.keydown(onKeyDown);

    }

    function update() {

      updateValues();
      updateCards();
      updateBlanks();
      updateHints();
      updateBtns();

    }
    function updateValues() {

      for (var i = 0; i < _rows.length; i++) {
        var row      = _rows[i];
        var rowInOrder  = true;

        for (var j = 0; j < row.length; j++) {
          var card      = row[j];
            card.closed    = false;
            card.start    = false;
            card.placed    = false;
            card.placeable  = false;

          var prevCard    = row[j - 1];

          // Closed & start
          /////////////////////////////////////////////

          if (card.value == 1) {
            if (prevCard) {
              if (prevCard.closed || prevCard.value == 13) {
                card.closed  = true;
              }
            } else {
              card.start  = true;
            }
          }

          // Placed
          /////////////////////////////////////////////

          if (rowInOrder) {
            if (prevCard) {
              if (card.suit == prevCard.suit && card.value == j + 2) {
                card.placed  = true;
              }
            } else {
              if (card.value == 2) {
                card.placed  = true;
              }
            }
            rowInOrder  = card.placed;
          }

          // Placeable
          /////////////////////////////////////////////

          if (getMatchingAce(card)) {
            card.placeable  = true;
          }

        }
      }

    }
    function updateCards() {

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        for (var j = 0; j < row.length; j++) {
          var card  = row[j];

          var $card  = card.$el;
            $card.css({
              "left": j * SPACING_X,
              "top": i * SPACING_Y
            });

            $card.toggleClass("placed", card.placed);
            $card.toggleClass("placeable", card.placeable);

        }
      }

    }
    function updateBlanks() {

      $blanksList.find("li").each(function(index) {

        var $blank  = $(this);
        var card  = getCardFromBlankEl($blank);

        $blank.toggleClass("closed", card.closed);
        $blank.toggleClass("start", card.start);

      });

    }
    function updateHints() {

      var hintsOn  = $hintsCheckbox.prop("checked");

      if (!hintsOn || !_overCard) {
        unhighlight();
      } else {
        highlightMatching(_overCard);
      }

    }
    function updateBtns() {

      // Shuffle btn
      /////////////////////////////////////////////

      $shuffleBtn.text("Shuffle (" + _totalShuffles + " used)")

      $restartBtn.prop("disabled", !_history.length);
      $undoBtn.prop("disabled", !_history.length);

    }

    function startNewGame() {

      _totalShuffles = 0;
      _history       = [];

      clearTimeout(_acesTimeout);
      _acesTimeout  = setTimeout(fadeOutAces, ACES_TIMEOUT_SECS * 1000);

      fadeInAces();
      shuffleCards(getAllCards());
      update();

      setTimeout(function() {
        $cardsList.removeClass("unloaded");
      }, 100);

    }
    function restartGame() {
      disableBoard();
      stepRestart();

    }
    function reshuffle() {

      pushHistory();

      shuffleCards(getUnplacedCards());
      swapAcesToFront();

      _totalShuffles++;

      update();

    }

    function swapCards(cardA, cardB) {

      var locA          = findCard(cardA.suit, cardA.value);
      var locB          = findCard(cardB.suit, cardB.value);
      var tempA          = _rows[locA.row][locA.col];
      _rows[locA.row][locA.col]  = _rows[locB.row][locB.col];
      _rows[locB.row][locB.col]  = tempA;

    }

    function unhighlight() {

      $cardsList.find("li").removeClass("hint");
      $blanksList.find("li").removeClass("hint");

    }
    function highlightMatching(card) {

      if (!card) return;

      var matchCard  = null;

      if (card.value == 1) {
        var prevCard  = getPrevCard(card);

        while (prevCard && prevCard.value == 1) {
          card    = prevCard;
          prevCard  = getPrevCard(card);
        }

        matchCard  = getMatchingCard(card);

      } else {
        matchCard  = getMatchingAce(card);

      }

      if (card) {
        highlight(card);
      }

      if (matchCard) {
        highlight(matchCard);
      }

    }

    function highlight(card) {

      if (!card) return;

      if (card.value == 1) {
        $blanksList.find("li").each(function(index) {

          var $blank    = $(this);
          var testCard  = getCardFromBlankEl($blank);

          $blank.toggleClass("hint", testCard == card);

        });


      } else {
        var $card  = $cardsList.find("li.suit-" + card.suit + ".value-" + card.value)
          $card.addClass("hint");

      }

    }

    function disableBoard() {

      $boardBlock.show();

    }
    function enableBoard() {

      $boardBlock.hide();

    }

    function pushHistory() {

      _history.push({
        rows: makeRowsCopy()
      });

    }
    function undoLastMove() {

      if (!_history) return;
      if (!_history.length) return;

      var lastMove  = _history.pop();
      _rows      = lastMove.rows;

      update();

    }
    function stepRestart() {

      if (_history && _history.length) {
        undoLastMove();
        setTimeout(stepRestart, RESTART_INTERVAL_SECS * 1000);
      } else {
        enableBoard();
      }

    }

    function shuffleCards(cards) {

      for (var i = 0; i < SHUFFLE_SWAP_COUNT; i++) {

        var cardA  = Random.item(cards);
        var cardB  = Random.item(cards);

        if (cardA != cardB) {
          swapCards(cardA, cardB);
        }

      }

    }

    function fadeInAces() {

      var $aces  = $cardsList.find("li.value-1");
        $aces.stop(true).fadeIn(250);

    }
    function fadeOutAces() {

      clearTimeout(_acesTimeout);

      var $aces  = $cardsList.find("li.value-1");
        $aces.stop(true).fadeOut(250);

    }

    function swapAcesToFront() {

      var aces    = getAces();
      var frontCards  = getFirstUnplacedCardInRows();

      // remove duplicates
      for (var i = 0; i < aces.length; i++) {
        var dupeIndex  = frontCards.indexOf(aces[i]);
        if (dupeIndex != -1) {
          aces.splice(i, 1);
          frontCards.splice(dupeIndex, 1);
          console.log("Removing duplicate.");
        }
      }

      for (var i = 0; i < aces.length; i++) {
        swapCards(aces[i], frontCards[i]);
      }

    }

    // Helpers
    /////////////////////////////////////////////

    function getCard(suit, value) {

      var loc  = findCard(suit, value);

      if (loc) {
        return _rows[loc.row][loc.col];
      } else {
        return null;
      }

    }
    function findCard(suit, value) {

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        for (var j = 0; j < row.length; j++) {
          var card  = row[j];

          if (card.suit == suit && card.value == value) {
            return {
              row: i,
              col: j
            };

          }

        }
      }

      return null;

    }
    function getCardLoc(card) {

      if (!card) return null;

      return findCard(card.suit, card.value);

    }

    function getCardFromCardEl($el) {

      var el  = $el.get(0);

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        for (var j = 0; j < row.length; j++) {
          var card  = row[j];

          if (card.$el.get(0) == el) {
            return card;
          }

        }
      }

      return null;

    }
    function getCardFromBlankEl($el) {

      var row  = $el.data("row");
      var col  = $el.data("col");

      return _rows[row][col];

    }

    function getPrevCard(card) {

      var loc    = findCard(card.suit, card.value);

      return _rows[loc.row][loc.col - 1];

    }
    function getNextCard(card) {

      var loc    = findCard(card.suit, card.value);

      return _rows[loc.row][loc.col + 1];

    }

    function getLowerCard(card) {

      if (!card) return null;

      return getCard(card.suit, card.value - 1);

    }
    function getHigherCard(card) {

      if (!card) return null;

      return getCard(card.suit, card.value + 1);

    }

    function getNextStartCard() {

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        for (var j = 1; j < row.length; j++) {
          var card  = row[j];
          if (card.value == 2) {
            return card;
          }

        }
      }

      return null;

    }

    function getMatchingAce(card) {

      if (!card) return null;
      if (card.value == 1) return null;

      if (card.value == 2) {
        if (getCardLoc(card).col == 0) return null;
        for (var i = 0; i < _rows.length; i++) {
          if (_rows[i][0].value == 1) {
            return _rows[i][0];
          }
        }
        return null;
      }

      var lowerCard  = getLowerCard(card);

      if (!lowerCard) return null;

      var cardAfter  = getNextCard(lowerCard);

      if (cardAfter && cardAfter.value == 1) {
        return cardAfter;
      } else {
        return null;
      }

    }
    function getMatchingCard(card) {

      if (!card) return null;
      if (card.value != 1) return null;

      var prevCard  = getPrevCard(card);
      var newCard    = null;

      if (prevCard) {
        newCard    = getHigherCard(prevCard);
      } else {
        newCard    = getNextStartCard();
      }

      return newCard;

    }

    function getAllCards() {

      var cards  = [];

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];
        for (var j = 0; j < row.length; j++) {
          var card  = row[j];
          cards.push(card);
        }
      }

      return cards;

    }
    function getUnplacedCards() {

      var cards  = [];

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];
        for (var j = 0; j < row.length; j++) {
          var card    = row[j];
          if (!card.placed) {
            cards.push(card);
          }
        }
      }

      return cards;

    }
    function getAces() {

      var cards  = [];

      for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];
        for (var j = 0; j < row.length; j++) {
          var card  = row[j];
          if (card.value == 1) {
            cards.push(card);
          }
        }
      }

      return cards;

    }
    function getFirstUnplacedCardInRows() {

      var cards  = [];

      rowLoop: for (var i = 0; i < _rows.length; i++) {
        var row    = _rows[i];

        colLoop: for (var j = 0; j < row.length; j++) {
          var card    = row[j];
          if (!card.placed) {
            cards.push(card);
            continue rowLoop;
          }
        }
        cards.push(row[0]);

      }


      return cards;

    }

    function makeRowsCopy() {

      var copy  = [];

      for (var i = 0; i < _rows.length; i++) {
        copy[i]  = _rows[i].slice(0);
      }

      return copy;

    }

    function logRows() {

      var output  = "";

      for (var i = 0; i < _rows.length; i++) {
        var row  = _rows[i];
        for (var j = 0; j < row.length; j++) {
          var card  = row[j];
          var text  = getCardString(card.suit, card.value);

          output  += text + ", ";

        }
        output  += "\n";
      }

      console.log(output);

    }
    function getCardString(suit, value) {

      var textSuit  = "";
      var textValue  = "";

      switch (suit) {
        case 0:
          textSuit  = "D";
          break;
        case 1:
          textSuit  = "C";
          break;
        case 2:
          textSuit  = "H";
          break;
        case 3:
          textSuit  = "S";
          break;
      }

      if (value < 10) {
        textValue  = "0" + value;
      } else {
        textValue  = "" + value;
      }

      return textValue + textSuit;

    }


    // Init
    /////////////////////////////////////////////

    initView();
    initEvents();

    startNewGame();


  }

  // Add to namespace
  /////////////////////////////////////////////

  montana.Montana    = Montana;


}());

// Plug-ins
/////////////////////////////////////////////


// Init
/////////////////////////////////////////////

jQuery(montana.Montana);


