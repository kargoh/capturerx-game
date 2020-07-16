(function (window) {

	//constructor
    function AssetManager(width, height, box) {
        this.Container_constructor();
        this.width = width;
        this.height = height;
        this.box = box;
    }

	//instance of class
	var container = createjs.extend(AssetManager, createjs.Container);

    container.init = function(){
        //load game assets
        this.preload = new createjs.LoadQueue(true);
        this.preload.installPlugin(createjs.Sound);
        this.preload.loadManifest({ id: "manifest", src:"manifest.json" });

        //draw background of progress bar
        this.barX = this.width / 2;
        this.barY = this.height / 2;
        this.barWidth = this.width * 0.75;
        this.barHeight = this.box / 2;
        this.bar1 = new createjs.Shape();
        this.bar1.graphics.beginFill("#bed62f").drawRect(
            this.barX - (this.barWidth/2) - (this.box * 0.25),
            this.barY - (this.barHeight/2) - (this.box * 0.25),
            this.barWidth + this.box * 0.5,
            this.barHeight + this.box * 0.5);

        //draw progress bar
        this.bar2 = new createjs.Shape();

        //add to containger -> stage
        this.addChild(this.bar1, this.bar2);
    }

    //update
    container.updateLoading = function() {
        this.bar2.graphics.beginFill("#ffffff").drawRect(
            this.barX - (this.barWidth/2),
            this.barY - (this.barHeight/2),
            this.preload.progress * this.barWidth,
            this.barHeight);
    }
    container.getManifest = function(){ return this.preload._loadedResults.manifest.manifest; }

	window.AssetManager = createjs.promote(AssetManager, "Container");
}(window));
