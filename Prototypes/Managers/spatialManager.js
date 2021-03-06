/*

spatialManager.js

A module which handles spatial lookup, as required for...
e.g. general collision detection.

*/

"use strict";

/* jshint browser: true, devel: true, globalstrict: true */

/*
0        1         2         3         4         5         6         7         8
12345678901234567890123456789012345678901234567890123456789012345678901234567890
*/

function SpatialManager(instanceID,descr){
    this.setup(instanceID,descr);
}

SpatialManager.prototype = new Manager();

SpatialManager.prototype.setup = function (instanceID,descr) {
    if(!(descr)){
	descr = {
	    _nextSpatialID : 1,
	    _entities : []
	};
    };
    this.instanceID = instanceID;
    for (var property in descr) {
        this[property] = descr[property];
    }
};



SpatialManager.prototype._inBox = function (entity, topLeftCorner, bottomRightCorner) {
    if (!(entity)) return undefined;
    var ePos = entity.getPos();
    return util.circInBox(ePos["posX"],ePos["posY"],entity.getRadius(), topLeftCorner,bottomRightCorner);
};


// PUBLIC METHODS

SpatialManager.prototype.getNewSpatialID = function() {

    return this._nextSpatialID++;


};

SpatialManager.prototype.register = function(entity) {
    var pos = entity.getPos();
    var spatialID = entity.getSpatialID();

    this._entities[spatialID] = entity;

};

SpatialManager.prototype.unregisterAll = function (){
    this._entities= [];
};

SpatialManager.prototype.unregister = function(entity) {
    var spatialID = entity.getSpatialID();

    delete this._entities[spatialID];

};

SpatialManager.prototype.isRegistered = function(entity){
    var spatialID = entity.getSpatialID();
    return (spatialID in this._entities);
};

SpatialManager.prototype.findEntityInRange = function(posX, posY, radius) {
    for ( var ID in this._entities) {
        var e = this._entities[ID];
        if(e) {
            var pos = e.getPos();
            if (util.wrappedDistSq(pos.posX, pos.posY, posX, posY)
            <= util.square(e.getRadius() + radius))
            return e;
            }
	}
    return undefined;
};

SpatialManager.prototype.render = function(ctx) {
    ctx.save();
    ctx.strokeStyle = "red";
    this.getInstance().entityManager.setUpCamera(ctx);
    
    for (var ID in this._entities) {
        var e = this._entities[ID];
	if (e) {
	    var pos = e.getPos();
        if (this.getInstance().settings.hitBox){
            ctx.save();
	        e.renderHitBox(ctx);
            ctx.stroke();
            ctx.restore();
        } else {
            util.strokeCircle(ctx, pos.posX, pos.posY, e.getRadius()*this.getInstance().entityManager.cameraZoom);
        }
	    }
    }
    ctx.restore();
};
