var isUpdating = false;
var currentPlayers = {};
var scheduledPlayers = {};
var lastUpdated = 0;
var timeout = 20000;
function updatePlayerState(state){
    if (!(Meteor && Players)){
	return;
    }
    var now = Date.now();
    if(this.isUpdating || (now - lastUpdated) <= 1000){
        return;
    }
    isUpdating = true;
    lastUpdated = now;
    var id = Meteor.userId();
    if(id){
        state.time = lastUpdated;
        Players.upsert(id,{$set: state},{},updatePlayers);
    }
};

function updatePlayers(){
    if(!(Meteor && Meteor.userId())){
        isUpdating = false;
        return;
    }
    var id = Meteor.userId();
    //var now = Date.now();
    var sinceTimeout = lastUpdated - timeout;
    var oPs = Players.find({_id: {$ne: id}, time: {$gt: sinceTimeout}},{limit:5}).fetch();
    var ps = {};
    for(var i =0; i< oPs.length; i++){
        var player = oPs[i];
        var name = player.username;
        loadShip(player.shipId);
        ps[name] = player;
    }
    currentPlayers = ps;
    isUpdating = false;
};

var loadedShips = {};

function loadShip(id){
    if(id in loadedShips){
	return;
    } else {
	var ship = Ships.findOne(id);
	this.loadedShips[id] = ship;
    }
}



