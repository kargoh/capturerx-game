(function (window) {
    //private functions
    function Game(){  //constructor
        Game.prototype.init();
    }
    function tick(event) {
        this.delta = event.delta; //elapsedTimeInMS / 1000msPerSecond
        window.Game.cards.tick(delta);
        window.Game.setCurrentTime();
        window.Game.stage.update();
    }

    //public functions
    Game.prototype.init = function() {
        // setup everything yo
        this.canvas = document.getElementById("gameCanvas");
        this.stage = new createjs.Stage(this.canvas);
        this.stage.enableMouseOver(60);
        createjs.Touch.enable(this.stage);
        this.box = (this.canvas.width / 16); //16 = 1em

        this.assetManager = new AssetManager(this.canvas.width, this.canvas.height, this.box);
        this.assetManager.init();
        this.stage.addChild(this.assetManager);
        this.stage.on("stagemousedown", function(event){ Game.prototype.stageMouseDown(event); });
        this.stage.on("stagemousemove", function(event){ Game.prototype.stageMouseMove(event); });
        this.stage.on("stagemouseup", function(event){ Game.prototype.stageMouseUp(event); });
        this.assetManager.preload.on("complete", function(){ Game.prototype.setStage(); });
        this.assetManager.preload.on("progress", function(){ Game.prototype.assetManager.updateLoading(); window.Game.stage.update(); });

        this.initFirebase();
    }
    Game.prototype.setStage = function() {
        //clean up stage
        this.stage.removeAllChildren();

        //initialize game objects
        if (this.cards == null) this.cards = new Cards();
        if (this.endGraphics == null) this.endGraphics = new EndGraphics();

        //ensure stage is blank and add the player
        this.stage.clear();

        //draw according to game view
        this.stage.addChild(this.endGraphics, this.cards); //loading

        //start game timer
        if (!createjs.Ticker.hasEventListener("tick")) {
            createjs.Ticker.addEventListener("tick", tick);
            createjs.Ticker.timingMode = createjs.Ticker.RAF;
            //createjs.Ticker.setFPS(24);
        }
    }
    Game.prototype.stageMouseDown = function(event){}
    Game.prototype.stageMouseMove = function(event){}
    Game.prototype.stageMouseUp = function(event){}
    Game.prototype.getWidth = function(){ return this.canvas.width; }
    Game.prototype.getHeight = function(){ return this.canvas.height; }
    Game.prototype.retry = function(){
        window.timer.stop();
        this.toggleRetryButton(false);
        this.setCurrentTime(0);
        this.endGraphics.fadeOut();
        this.cards.removeAllCards();
        this.cards.setupCards(4, 4, 12);
    }
    Game.prototype.initFirebase = function(){
        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyAMjfMoIorZmQhmM4g0N-yWbWRz0Bh7bwo",
            authDomain: "christmas-cards-66f71.firebaseapp.com",
            databaseURL: "https://christmas-cards-66f71.firebaseio.com",
            storageBucket: "christmas-cards-66f71.appspot.com",
            messagingSenderId: "532421049479"
        };
        firebase.initializeApp(config);
        this.db = firebase.database();
        this.populateDatabase();
        this.updateHighScoreText();
    }
    Game.prototype.checkHighScore = function(newTime){
        //update session best score
        var yourBest = parseInt((document.getElementById('your-best').innerHTML).replace(".",""));
        if ((newTime / 10) < yourBest || yourBest == 0){ //divide by 10 to compare with 4 digits
            document.getElementById('your-best').innerHTML = window.timer.toString(newTime);
        }

        //pull top 10 and check for new high score
        var ref = this.db.ref('leaderboard');
        ref.orderByChild('time').limitToFirst(10).once('value', function(snapshot){
            var isTopScore = false;
            var key = null;
            snapshot.forEach(function(childSnapshot){ //check if within top 10 scores
                if (newTime < parseInt(childSnapshot.val().time)){
                    key = childSnapshot.key;
                    return true; //break loop
                }
            });
            if (key != null){ //a key without a value will not make top 10
                alertify.defaultValue("name")
                .okBtn("Submit high score")
                .cancelBtn("Cancel")
                .prompt("" +
                    "<div class='row'>"+
                        "<div class='col-xs-6'>"+
                            "<img src='img/top-ten-graphic.jpg'>"+
                        "</div>"+
                        "<div class='col-xs-6'>"+
                            "<h3>New High Score!</h3>" +
                            "<h1>"+window.timer.toString(newTime)+"</h1>"+
                        "</div>"+
                    "</div>",
                    function (val, ev) {
                        ev.preventDefault();
                        ref.push({ "name": val, "time": newTime });
                        window.Game.setCurrentTime(0);
                        window.Game.updateHighScoreText();
                        window.Game.toggleRetryButton(true);
                    }, function(ev){
                        ev.preventDefault();
                        window.Game.setCurrentTime(0);
                        window.Game.updateHighScoreText();
                        window.Game.toggleRetryButton(true);
                    }
                );
            }
            else window.Game.toggleRetryButton(true);
        });
    }
    Game.prototype.setCurrentTime = function(forceTime){
        if (window.timer.play == true || forceTime != null){
            document.getElementById('currentTime').innerHTML = window.timer.toString(forceTime != null ? forceTime : null);
        }
    }
    Game.prototype.populateDatabase = function(){
        //insure top 10 exists
        var ref = this.db.ref('leaderboard');
        ref.orderByChild('time').limitToFirst(10).once('value', function(snapshot){
            if (snapshot.numChildren() < 10){
                ref.push({ "name": "Yano", "time": 99999 });
                window.Game.populateDatabase(); //recursion
            }
        });
    }
    Game.prototype.updateHighScoreText = function(){
        var ref = this.db.ref('leaderboard');
        ref.orderByChild('time').limitToFirst(1).once('value', function(snapshot){
            snapshot.forEach(function(childSnapshot){
                document.getElementById('highScore').innerHTML = window.timer.toString(childSnapshot.val().time);
                document.getElementById('highScoreName').innerHTML = childSnapshot.val().name;
            });
        });
    }
    Game.prototype.getBestScore = function(){
        var bestScore = 99999;
        var ref = this.db.ref('leaderboard');
        ref.orderByChild('time').limitToFirst(1).once('value', function(snapshot){
            snapshot.forEach(function(childSnapshot){
                bestScore = childSnapshot.val().time;
            });
        });
    }
    Game.prototype.toggleRetryButton = function(version){
        if (version == true){
            document.getElementById('retry').style.backgroundColor = "#e67c49";
            document.getElementById('retry').style.color = "#ffffff";
        }
        else {
            document.getElementById('retry').style.backgroundColor = "#f3f3f3";
            document.getElementById('retry').style.color = "#666666";
        }
    }
    Game.prototype.showTopTen = function(){
        var htmlElem = "<h3>Top 10 Scores</h3>";
        var rank = 0; //rank
        var ref = this.db.ref('leaderboard');
        ref.orderByChild('time').limitToFirst(10).once('value', function(snapshot){
            snapshot.forEach(function(childSnapshot){
                rank++; //increment rank
                htmlElem += "<div class='row'>"+
                "<div class='col-xs-6'>"+rank+") "+childSnapshot.val().name+"</div>"+
                "<div class='col-xs-6'>"+window.timer.toString(childSnapshot.val().time)+"</div>";
                htmlElem += "</div>";
            });
        }).then(function(){ alertify.okBtn('Close').confirm(htmlElem); });
    }
    //create prototype of self
    window.Game = new Game();
}(window));