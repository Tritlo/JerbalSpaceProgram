/*

ntityManager.js

A module which handles arbitrary entity-management for "Asteroids"


We create this module as a single global object, and initialise it
with suitable 'data' and 'methods'.

"Private" properties are denoted by an underscore prefix convention.

*/


"use strict";


// Tell jslint not to complain about my use of underscore prefixes (nomen),
// my flattening of some indentation (white), or my use of incr/decr ops 
// (plusplus).
//
/*jslint nomen: true, white: true, plusplus: true*/

function EntityManager(instanceID,descr){
    this.setup(instanceID,descr);
}

EntityManager.prototype = new Manager();

EntityManager.prototype.setup = function (instanceID,descr) {
    if(!(descr)){
	descr = {
	_ships   : [],
	_terrain : [],
	cameraOffset: [0,0],
	trueOffset: [100,100],
	mouseOffset: [0,0],
	cameraRotation: 0,
	cameraZoom: 1,
	KILL_ME_NOW: -1,
	lockCamera: false
	};
    };
    for (var property in descr) {
        this[property] = descr[property];
    }
    this.instanceID = instanceID;
};



// "PRIVATE" METHODS

EntityManager.prototype._generateTerrain = function() {
    var sL = this.getInstance().settings.seaLevel;
    var minangl = Math.PI/30;
    var maxangl = Math.PI/2.2;
    var terr = new Terrain(this.instanceID,{
    "name" : "Jerbin",
	"minX":-10000,
	"maxX": 10000,
	"minY": 3200,
	"maxY": 3500,
	"minLength": 32,
	"maxLength": 256,
	"minAngle": minangl,
	"maxAngle": maxangl,
	"center" : [0,3600],
	"seaLevel": 3350,
	"mass" : 5.0e15,
    "color": "green",
    "oceanColor": "rgba(0,100,255,0.3)",
    //"waterColor": "blue",
    //"numOceans" : 3,
    //"hasOceans" : true
	});
    var joon = new Terrain(this.instanceID,{
    "name" : "Joon",
	"minX":-5000,
	"maxX": 5000,
	"minY": 1600,
	"maxY": 1750,
	"minLength": 16,
	"maxLength": 128,
	"minAngle": minangl,
	"maxAngle": maxangl,
	"center" : [2000,-20000],
	"mass" : 1.0e15,
    "color": "#282828",
    //"waterColor": "#101010",
    //"hasOceans" : true,
    //"numOceans" : 3
	});
    this._terrain.push(terr);
    this._terrain.push(joon);
};

EntityManager.prototype.getTerrain = function (x,y) {
    var max = Number.MIN_VALUE;
    var maxTerr;
    for(var i = 0; i < this._terrain.length; i++){
        var terr = this._terrain[i];
	    var g = this.gravityFrom(terr,x,y);
        if(g>max){
            max = g;
            maxTerr = terr;
        }
    }
    return maxTerr;
};


EntityManager.prototype.gravityFrom = function (terr,x,y){
    return util.lengthOfVector(this.gravityAt(x,y,terr));
};

EntityManager.prototype.gravityAt = function (x,y,terr) {
    if (terr === undefined) var terr=this.getTerrain(x,y);
    var distance=Math.sqrt(util.distSq(x,y,terr.center[0],terr.center[1]));
    var force=consts.G*terr.mass/(distance*distance);
	return util.mulVecByScalar(force/distance ,util.vecMinus(terr.center,[x,y]));
};

EntityManager.prototype.createInitialShips =  function(){
    var ship = this.getInstance().ships[0];
    ship.cx = 0;
    ship.cy = 0;
    this.generateShip(ship);
};

EntityManager.prototype._findNearestShip = function(posX, posY) {
    var closestShip = null,
        closestIndex = -1,
        closestSq = 1000 * 1000;

    for (var i = 0; i < this._ships.length; ++i) {

        var thisShip = this._ships[i];
        var shipPos = thisShip.getPos();
        var distSq = util.wrappedDistSq(
            shipPos.posX, shipPos.posY, 
            posX, posY,
            this.getInstance().canvas.width, this.getInstance().canvas.height);

        if (distSq < closestSq) {
            closestShip = thisShip;
            closestIndex = i;
            closestSq = distSq;
        }
    }
    return {
        theShip : closestShip,
        theIndex: closestIndex
    };
};

EntityManager.prototype._forEachOf = function(aCategory, fn) {
    for (var i = 0; i < aCategory.length; ++i) {
        fn.call(aCategory[i]);
    }
};

// PUBLIC METHODS

// A special return value, used by other objects,
// to request the blessed release of death!
//

// Some things must be deferred until after initial construction
// i.e. thing which need `this` to be defined.
//
EntityManager.prototype.deferredSetup = function () {
    this._categories = [this._ships,this._terrain];
};

EntityManager.prototype.init = function() {
    this.deferredSetup();
    this._generateTerrain();
};

EntityManager.prototype.deInit =  function() {
    this._terrain = [];
    this._ships   = [];
    this._categories = [];
    this.getInstance().spatialManager.unregisterAll();
    this.resetCamera();
};

EntityManager.prototype.generateShip = function(descr) {
    	//descr.cx=0;
	//descr.cy=0;
        var inst = this.instanceID;
	this._ships.push(new Ship(inst,descr));
};

EntityManager.prototype.killNearestShip = function(xPos, yPos) {
    var theShip = this._findNearestShip(xPos, yPos).theShip;
    if (theShip) {
        theShip.kill();
    }
};

EntityManager.prototype.yoinkNearestShip = function(xPos, yPos) {
    var theShip = this._findNearestShip(xPos, yPos).theShip;
    if (theShip) {
        theShip.setPos(xPos, yPos);
    }
};

EntityManager.prototype.resetShips = function() {
    this._forEachOf(this._ships, Ship.prototype.reset);
};

EntityManager.prototype.haltShips = function() {
    this._forEachOf(this._ships, Ship.prototype.halt);
};

EntityManager.prototype.clearShips = function() {
    this._ships.map(function(x){ if(x){ x.kill();}});
};

EntityManager.prototype.resetCamera = function() {
        this.cameraOffset = [0,0];
        this.cameraRotation = 0;
        this.cameraZoom = 1;
        this.lockCamera = false;
};
    
EntityManager.prototype.updateCamera = function () {
    
    if (eatKey(this.getInstance().settings.keys.KEY_CAMERA_LOCK)) {
        this.lockCamera = !this.lockCamera;
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_ZOOMIN]) {
        this.cameraZoom *= this.getInstance().settings.cameraZoomRate;
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_ZOOMOUT]) {
        this.cameraZoom /= this.getInstance().settings.cameraZoomRate;
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_ROTATE_CLOCKWISE]) {
        this.cameraRotation += this.getInstance().settings.cameraRotateRate;
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_ROTATE_COUNTERCLOCKWISE]) {
        this.cameraRotation -= this.getInstance().settings.cameraRotateRate;
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_UP]) {
        this.cameraOffset = util.vecPlus(this.cameraOffset,util.mulVecByScalar(this.getInstance().settings.cameraMoveRate/this.cameraZoom,util.rotateVector([0,1], -this.cameraRotation)));
    }										     
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_DOWN]) {				     
        this.cameraOffset = util.vecPlus(this.cameraOffset,util.mulVecByScalar(this.getInstance().settings.cameraMoveRate/this.cameraZoom,util.rotateVector([0,-1], -this.cameraRotation)));
    }										     
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_LEFT]) {				     
        this.cameraOffset = util.vecPlus(this.cameraOffset,util.mulVecByScalar(this.getInstance().settings.cameraMoveRate/this.cameraZoom,util.rotateVector([1,0], -this.cameraRotation)));
    }										     
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_RIGHT]) {				     
        this.cameraOffset = util.vecPlus(this.cameraOffset,util.mulVecByScalar(this.getInstance().settings.cameraMoveRate/this.cameraZoom,util.rotateVector([-1,0], -this.cameraRotation)));
    }
    if (keys[this.getInstance().settings.keys.KEY_CAMERA_RESET]) {
	this.resetCamera();
    }
    
    if (eatKey(this.getInstance().settings.keys.KEY_RENDER_ORBIT)) {
	this.getInstance().settings.renderOrbit = !this.getInstance().settings.renderOrbit;
    }

    if(this._ships.length > 0){
        var s = this.getMainShip();
    if(!this.lockCamera){    
        this.offset = [-s.cx + this.getInstance().canvas.width/2,-s.cy + this.getInstance().canvas.height/2];
    }
	this.trueOffset = util.vecPlus(this.offset,this.cameraOffset);
	this.trueOffset = util.vecPlus(this.trueOffset,util.rotateVector(util.mulVecByScalar(1/this.cameraZoom,this.mouseOffset),-this.cameraRotation));
    }
    
};

EntityManager.prototype.update = function(du) {


    for (var c = 0; c < this._categories.length; ++c) {

        var aCategory = this._categories[c];
	if(aCategory === this._terrain) continue;
        var i = 0;

        while (i < aCategory.length) {

            var status = aCategory[i].update(du);

            if (status === this.KILL_ME_NOW) {
                // remove the dead guy, and shuffle the others down to
                // prevent a confusing gap from appearing in the array
		this.getInstance().spatialManager.unregister(aCategory[i]);
                aCategory.splice(i,1);
		
            }
            else {
                ++i;
            }
        }
	this.updateOtherPlayersShips(du);
    }

    if (this.getInstance().multi && Meteor && Meteor.userId()){
        var ship = this.getMainShip();
        var state = {
	    vel: [ship.velX,ship.velY],
	    angularVel: ship.angularVel,
	    thrust: ship.thrust,
	    throttle: ship.throttle,
	    fuel: ship.fuel,
	    shipId: ship._id,
	    center: ship.center,
	    rotation: ship.rotation,
        username: Meteor.user().username
		    };
	updatePlayerState(state);
	this.getInstance().currentPlayers = currentPlayers;
	
	var oPs = this.getInstance().currentPlayers;
	if(oPs){
	    for(var player in oPs){
		var state = oPs[player];
		this.setOtherPlayerShip(player,state);
		}
	    }
    }
    
};

EntityManager.prototype.getMainShip = function() {
    for(var i = 0; i < this._ships.length; i++){
	if (this._ships[i].isMain){
	    return this._ships[i];
	    }
	}
    return this._ships[0];
};
    
EntityManager.prototype.setUpCamera = function (ctx){
    // NOTE: ALWAYS save and restore when using this function
    ctx.translate(this.getInstance().canvas.width/2,this.getInstance().canvas.height/2);
    ctx.rotate(this.cameraRotation);
    ctx.scale(this.cameraZoom,this.cameraZoom);
    ctx.translate(-this.getInstance().canvas.width/2,-this.getInstance().canvas.height/2);
    ctx.translate(this.trueOffset[0],this.trueOffset[1]);
};


EntityManager.prototype.render = function(ctx) {
    var debugX = 10, debugY = 100;
    ctx.save();
    this.setUpCamera(ctx);
    if(this.getInstance().settings.graphicsLevel >= 1){
        this.getInstance().Stars.render(ctx);
        }
    for (var c = 0; c < this._categories.length; ++c) {

        var aCategory = this._categories[c];

        for (var i = 0; i < aCategory.length; ++i) {

            aCategory[i].render(ctx);
            //debug.text(".", debugX + i * 10, debugY);

        }
        debugY += 10;
    }
    if(this.getInstance().settings.enableDebug){
	var oPs = this.getInstance().currentPlayers;
	if(oPs){
	    for(var player in oPs){
		var state = oPs[player];
		ctx.save();
		ctx.fillStyle = "red";
		ctx.textAlign ="center";
		var fs = 14;
		if(this.cameraZoom < 1) fs = (14/this.cameraZoom);
		ctx.font = fs + "px " +this.getInstance().settings.font;
		ctx.fillText(player,state.center[0],state.center[1]-64);
		ctx.restore();
		}
	    }
    }
    this.renderOtherPlayersShips(ctx);
    ctx.restore();
};

EntityManager.prototype.otherPlayersShips = undefined;

EntityManager.prototype.setOtherPlayerShip = function(player,state){
    if(!(this.otherPlayersShips)) this.otherPlayersShips = {};
    if(player in this.otherPlayersShips){
	//var now = Date.now();
	var lastSet = this.otherPlayersShips[player].lastSet;
	if((state.time - lastSet) >= 1000){
	    this.otherPlayersShips[player].lastSet = state.time;
	    this.otherPlayersShips[player].setState(state);
	    }
    } else {
	console.log(player + " joined the game!");
	var inst = this.instanceID;
	var shipType = this.getInstance().loadShip(state.shipId);
	var ship = new Ship(inst,shipType);
	ship.unregister();
	ship.isMain = false;
	ship.isOtherPlayer = true;
	ship.player = player;
	ship.setState(state);
	ship.lastSet = Date.now();
	this.otherPlayersShips[player] = ship;
    }
};

EntityManager.prototype.updateOtherPlayersShips = function(du){
    var oPs = this.getInstance().currentPlayers;
    if(this.otherPlayersShips){
	for(var ID in this.otherPlayersShips){
	    if( !(ID in oPs )){
		console.log(ID + " left the game!");
		delete this.otherPlayersShips[ID];
	    } else{
		var status = this.otherPlayersShips[ID].update(du);
		if (status === this.KILL_ME_NOW) {
		    delete this.otherPlayersShips[ID];
		}
	    }
	}
    }
};

EntityManager.prototype.renderOtherPlayersShips = function(ctx){
    if(this.otherPlayersShips){
	for(var ID in this.otherPlayersShips){
	    var ship = this.otherPlayersShips[ID];
	    ctx.save();
	    ctx.fillStyle = this.getInstance().settings.hudColor;
	    ctx.strokeStyle = this.getInstance().settings.hudColor;
	    ctx.textAlign ="center";
	    ctx.font = (10/this.cameraZoom) + "px " +this.getInstance().settings.font;
	    ctx.fillText(ship.player,ship.center[0],ship.center[1]-64);
	    ctx.restore();
	    ship.render(ctx);
	}
    }
};

