function ShipDesigner(instanceID,descr) {
    this.setup(instanceID,descr);
    this.local = this.getInstance().local;
};

ShipDesigner.prototype = new State();

ShipDesigner.prototype.init = function() {
    if(this.getInstance().local){
	var backItems = 
	     [
	    {
		"text" : "Back",
		"action" : function (state) {
		    state.getInstance().stateManager.switchState("menu");
		    }
		},
		    {
		    "text" : "Launch",
		    "action" : function(state) {
			state.launch();
		    }
		    },
	    ];
    } else {
	var backItems = [
		{
		"text" : "Share",
		"action" : function(state) {
		    state.shareShip();
		}
		}];
    }
    this.back = new Menu(this.instanceID,{
	"state" : this,
	"items" : backItems,
	"width" : 100,
	"height" : 100,
	"location" : [this.getInstance().canvas.width - 100, 0]
	});
     

    this.menu2 = new Menu(this.instanceID,{
	"state" : this,
	"items" : [
        {
	    "text" : "Echo Ship JSON",
	    "action" : function (state)
             {
                state.currentShip.assemble(state.grid);
                var oldCs = [state.currentShip.cx, state.currentShip.cy];
                state.currentShip.cx = 200;
                state.currentShip.cy = 145;
                util.echoJSON(state.currentShip);
                state.currentShip.cx = oldCs[0];
                state.currentShip.cy = oldCs[1];
                state.currentShip.disassemble(state.grid);
		    }
	    },
	    {
	        "text" : "Add Selected Part",
		"action" : function(state){
		    state.addPart($("#in7").val());
		}
	    }
        ],
	"width" : 200,
	"height" : 100,
	"location" : [ 260, 0]
	});

    this.menu = new Menu(this.instanceID,{
	    "state" : this,
	    "items" : [
		{
		"text": "New Ship",
		"action" : function (state){
		    state.newShip();
		    }
		},
		{
		"text": "Save Ship",
		"action" : function (state){
		    state.saveShip();
		    },
		},
		{
		"text": "Load Ship",
		"action" : function (state){
		    state.loadShip();
		    },
		},
		{
		"text": "Clear Storage",
		"action" : function (state){
		    util.storageSave("ships",undefined);
		    $("#in9").empty();
		    console.log("ship storage cleared");
		    },
		}
	    ],
	    "width" : 100,
	    "height" : this.getInstance().canvas.height*2,
	    "itemHeight" : 25,
		"location": [55,-this.getInstance().canvas.height+70]
    });

    
    this.grid = new Grid(this.instanceID,{
	    "dims" : [64,64],
        "width" : 525,
        "height" : 525,
        "location": [113,113]
	});

    };

ShipDesigner.prototype.launch = function(){
    this.currentShip.assemble(this.grid);
    var protoShip = new Ship(this.instanceID);
    this.currentShip.cx = protoShip.cx;
    this.currentShip.cy = protoShip.cy;
    this.getInstance().entityManager.clearShips();
    this.getInstance().ships.unshift(this.currentShip);
    //this.getInstance().entityManager.generateShip(this.currentShip);
    this.getInstance().entityManager.createInitialShips();
    this.getInstance().stateManager.switchState("simulation");
};

ShipDesigner.prototype.newShip = function ()
{
    this.currentShip = new Ship(this.instanceID,
            {
                "cx" : 200,
                "cy" : 200
            });
    this.addedParts = this.currentShip.parts;
};


ShipDesigner.prototype.addPart = function (part){
    if(!(part._id)){
	var partInd = part;
	var parts = util.storageLoad("parts");
	var part = new Part(this.instanceID, parts[partInd]);
    } else {
	var part = new Part(this.instanceID,part);
    }
    this.heldPart = part.toDesigner(this.grid);
    if(this.addedParts){
	this.indexOfHeldPart = this.addedParts.length;
	this.addedParts.push(this.heldPart);
    } else {
	this.addedParts = [this.heldPart];
	this.indexOfHeldPart = 0;
    }
    this.currentShip.parts = this.addedParts;
    console.log(part);
};



ShipDesigner.prototype.saveShip = function ()
{
    
    console.log(ships);
    var name = this.currentShip.name;
    this.currentShip = new Ship(this.instanceID,
				{"parts" : this.addedParts,
				 "name": name
				 }
			       );

    if(this.currentShip)
    {
        this.currentShip.assemble(this.grid);
        var ships = util.storageLoad("ships");
	console.log(ships);
        if (ships){
	    var name = this.currentShip.name;
	    var author = this.currentShip.author;
	    for(var i = 0; i < ships.length; i++){
		if(ships[i].name === name && author === ships[i].author) {
		    break;
		    }
	    }
	    ships[i] = this.currentShip;
        } else {
            ships = [this.currentShip];
            }
        util.storageSave("ships",ships);
        this.currentShip.disassemble(this.grid,this.instanceID);
        this.getInstance().ships = util.storageLoad("ships");
	var inst = this.instanceID;
	this.getInstance().ships = this.getInstance().ships.map(function(s) {
	    return new Ship(inst,s);
	});
        $("#in9").empty();
	var ships = util.storageLoad("ships");
	if(ships)
	{
	    $.each(ships, function (key,value) {
	    $("#in9").append('<option value="'+key+'">'+value.name+'</option>');});
	}
    }
};

ShipDesigner.prototype.shareShip = function (){
    var name = this.currentShip.name;
    this.currentShip = new Ship(this.instanceID,
				{"parts" : this.addedParts,
				 "name": name
				 }
			       );
    this.currentShip.assemble(this.grid);
    var uname = "local";
    var uid = "0";
    if (Meteor && Meteor.user()){
        uname = Meteor.user().username;
        uid = Meteor.user()._id; 
    }
    var aid = this.currentShip.authorID;
    if(this.currentShip._id && aid && uid === aid){
	    Ships.update(this.currentShip._id,{$set: this.currentShip});
	    Ships.update(this.currentShip._id,{$inc: {version: 1}});
    } else {
	    this.currentShip.version = 1;
	    this.currentShip.author = uname;
	    this.currentShip.authorID = uid;
	    var id = Ships.insert(this.currentShip);
	    this.currentShip._id = id;
    }
    Router.go("myShips",{_id: this.currentShip._id, page: 1});
    /*
    var ship = this.currentShip.disassemble(this.grid,this.instanceID);
    this.currentShip = ship;
    $('#in5').val(this.currentShip.name);
    var gri = this.grid;
    this.addedParts = ship.parts;
    */
};

ShipDesigner.prototype.loadShip = function (ship)
{
    if(!(ship)){
	var ships = util.storageLoad("ships");
	var selVal = $('#in9').val() || 0;
	var ship = new Ship(this.instanceID, ships[selVal]);
    } else {
	var ship = new Ship(this.instanceID, ship);
    }
    var ship = ship.disassemble(this.grid,this.instanceID);
    this.currentShip = ship;
    $('#in5').val(this.currentShip.name);
    var gri = this.grid;
    this.addedParts = ship.parts;
}

ShipDesigner.prototype.onActivation = function ()
{
    this.loadShip();
    $('#in9').show();
    $('#in5').show();
    $('#in7').show();
    var canvas_pos = util.findPosOnPage(this.getInstance().canvas);
    var offsetFromMenu = 150;
    $('#in9').offset({top:canvas_pos.y + offsetFromMenu    , left: canvas_pos.x+5});
    $('#in5').offset({top:canvas_pos.y + offsetFromMenu +100, left: canvas_pos.x+5});
    $('#in7').offset({top:canvas_pos.y + offsetFromMenu +50, left: canvas_pos.x+5});
    $('#in5').val("");
    $('#in5').attr("placeholder","Ship Name");
    var ships = util.storageLoad("ships");
    if(ships)
    {
        $.each(ships, function (key,value) {
        $("#in9").append('<option value="'+key+'">'+value.name+'</option>');});
    }
    var parts = util.storageLoad("parts");
    if(parts){
        $.each(parts, function(key,value){
	    $("#in7").append('<option value="'+key+'">'+value.name+'</option>');
	});
    }
};

ShipDesigner.prototype.onDeactivation = function()
{
	$('#in9').hide();
	$('#in5').hide();
	$('#in7').hide();
	$('#in9').empty();
	$('#in7').empty();
};

//RENDER
//=====


ShipDesigner.prototype.render = function(ctx) {
    this.menu.render(ctx);
    this.menu2.render(ctx);
    if(this.back) this.back.render(ctx);
    this.grid.render(ctx);
    if(this.addedParts){
        this.addedParts.map(function (part) {
	    part.render(ctx);
            part._renderAttachmentPoints(ctx);
	    });
        if(this.heldPart && !this.heldPart.attached){
            this.heldPart._renderHitbox(ctx);
        }
    }
    if (this.currentShip)
    {
        //this.currentShip.render(ctx);
    }
};

ShipDesigner.prototype.update = function (du) {
    var name = $('#in5').val()
    if(name.length === 0){
        $('#in5').addClass("invalid");
    } else {
        $('#in5').removeClass("invalid");
        this.currentShip.name   = name;
    }
};

ShipDesigner.prototype.handleMenus = function(evt,type){
    var pos = util.findPos(this.getInstance().canvas);
    var g_mouse = [evt.clientX - pos.x,evt.clientY - pos.y];
    if (this.menu.inMenu(g_mouse[0],g_mouse[1])){
        this.menu.handleMouse(evt,type);
        return true;
	}
    else if (this.back && this.back.inMenu(g_mouse[0],g_mouse[1])){
        this.back.handleMouse(evt,type);
        return true;
	    }
    else if (this.menu2.inMenu(g_mouse[0],g_mouse[1])){
        this.menu2.handleMouse(evt,type);
        return true;
	    }
    else {
        return false;
    }
}

ShipDesigner.prototype.handleDown = function(evt,type) {
        if(evt.button === 0) {
            if(this.addedParts)
            {
                var pos = util.findPos(this.getInstance().canvas);
                var g_mouse = [evt.clientX - pos.x,evt.clientY - pos.y];
				for(var i = 0; i < this.addedParts.length; i++){
				   var p = this.addedParts[i];
				   if(util.circInBox(g_mouse[0],g_mouse[1],
					  0, p.hitBox[0], p.hitBox[1])){
					  this.heldPart = p;
				      this.indexOfHeldPart = i;
					  break;
					  }
		}
                this.editing = true;
            }
        } else if (evt.button === 2) {
	    	if(this.heldPart && !(this.heldPart.attached || this.indexOfHeldPart === 0)){
				this.addedParts.splice(this.indexOfHeldPart,1);
				this.indexOfHeldPart = -1;
			}
			this.heldPart = undefined;
            if(this.editing){
                this.editing = false;
            }
        }
};

ShipDesigner.prototype.handleMouse = function (evt,type) {
    var pos = util.findPos(this.getInstance().canvas);
    var g_mouse = [evt.clientX - pos.x,evt.clientY - pos.y];
    if(this.handleMenus(evt,type)){
        return true;
    }
    this.closest = this.grid.findNearestPoint(g_mouse[0],g_mouse[1]);
    this.closestPoint = this.grid.points[this.closest[0]][this.closest[1]];
    if (type === "down") {
        this.handleDown(evt,type);
    } else if (type === "move") {
        if(this.heldPart){
	    	var newC = util.vecMinus(this.closestPoint, this.heldPart.gridCenterOffset);
	    	this.heldPart.updateCenter(newC);
			this.heldPart.attached = false;
			for(var i = 0; i < this.addedParts.length; i++){
				if (i === this.indexOfHeldPart)
					continue;
				if (this.heldPart.isAttachedTo(this.addedParts[i])){
					this.heldPart.attached = true;
				}
			}
			
        }
    } 
};
