/* 
------------------------------
------- INPUT SECTION -------- 
------------------------------
*/

/**
 * This class binds key listeners to the window and updates the controller in attached player body.
 * 
 * @typedef InputHandler
 */
class InputHandler {
	key_code_mappings = {
		button: {
			32: {key: 'space', state: 'action_1'}
		},
		axis: {
			68: {key: 'right', state: 'move_x', mod: 1},
			65: {key: 'left', state: 'move_x', mod: -1},
			87: {key: 'up', state: 'move_y', mod: -1},
			83: {key: 'down', state: 'move_y', mod: 1}
		}
	};
	player = null;

	constructor(player) {
		this.player = player;

		// bind event listeners
		window.addEventListener("keydown", (event) => this.keydown(event), false);
		window.addEventListener("keyup", (event) => this.keyup(event), false);
	}

	/**
	 * This is called every time a keydown event is thrown on the window.
	 * 
	 * @param {Object} event The keydown event
	 */
	keydown(event) {
		// ignore event handling if they are holding down the button
		if (event.repeat || event.isComposing || event.keyCode === 229)
			return;
	
		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] += mapping.mod;
			console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	
		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = true;
			console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}

	/**
	 * This is called every time a keyup event is thrown on the window.
	 * 
	 * @param {Object} event The keyup event
	 */
	keyup(event) {
		if (event.isComposing || event.keyCode === 229)
			return;

		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] -= mapping.mod;
			console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	
		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = false;
			console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}
}
/* 
------------------------------
------- BODY SECTION  -------- 
------------------------------
*/

/**
 * Represents a basic physics body in the world. It has all of the necessary information to be
 * rendered, checked for collision, updated, and removed.
 * 
 * @typedef Body
 */
class Body {
	position = {x: 0, y: 0};
	velocity = {x: 0, y: 0};
	size = {width: 20, height: 20};
	health = 100;

	/**
	 * Creates a new body with all of the default attributes
	 */
	constructor() {
		// generate and assign the next body id
		this.id = running_id++;
		// add to the entity map
		entities[this.id] = this;
	}

	/**
	 * @type {Object} An object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}

	/**
	 * @returns {Boolean} true if health is less than or equal to zero, false otherwise.
	 */
	isDead() {
		return this.health <= 0;
	}

	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		// move body
		this.position.x += delta_time * this.velocity.x;
		this.position.y += delta_time * this.velocity.y;
	}

	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#00FF00';
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x + this.velocity.x / 10, this.position.y + this.velocity.y / 10);
		graphics.stroke();
	}

	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_entities_for_removal.push(this.id);
	}
}

/**
 * Represents an player body. Extends a Body by handling input binding and controller management.
 * 
 * @typedef Player
 */
class Player extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: 0,
		action_1: false
	};
	speed = 100;
	input_handler = null;

	/**
	 * Creates a new player with the default attributes.
	 */
	constructor() {
		super();

		// bind the input handler to this object
		this.input_handler = new InputHandler(this);

		// we always want our new players to be at this location
		this.position = {
			x: config.canvas_size.width / 2,
			y: config.canvas_size.height - 100
		};
		
	}

	/**
	 * Draws the player as a triangle centered on the player's location.
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();

		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the player given the state of the player's controller.
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		 //Moving Right
		 if(this.controller.move_x == 1 && this.controller.move_y == 0){
			this.position.x = this.position.x + 8;
		 }
		 //Moving Diagonal bottom right
		 if(this.controller.move_x == 1 && this.controller.move_y == 1){
			 this.position.x = this.position.x + 6;
			 this.position.y = this.position.y + 6;
		 }
		 //Moving Diagonal top right
		 if(this.controller.move_x == 1 && this.controller.move_y == -1){
			 this.position.x = this.position.x + 6;
			 this.position.y = this.position.y - 6;
		 }
		 //Moving Left
		 if(this.controller.move_x == -1 && this.controller.move_y == 0){
			 this.position.x = this.position.x - 8;
		 }
		 //Moving Diagonal bottom left
		 if(this.controller.move_x == -1 && this.controller.move_y == 1){
			 this.position.x = this.position.x - 6;
			 this.position.y = this.position.y + 6;
		 }
		 //Moving Diagonal top left
		 if(this.controller.move_x == -1 && this.controller.move_y == -1){
			 this.position.x = this.position.x - 6;
			 this.position.y = this.position.y - 6;
		 }
		 //Moving Up
		 if(this.controller.move_x == 0 && this.controller.move_y == -1){
			 this.position.y = this.position.y - 8;
		 }
		 //Moving Down
		 if(this.controller.move_x == 0 && this.controller.move_y == 1){
			 this.position.y = this.position.y + 8;
		 }
		 //Shooting Projectile !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 if(this.controller.action_1 == true && Number.isInteger(loop_count / 10) == true){
			new projectile(this)
		 }
		 //console.log(this.controller);

		// update position
		super.update(delta_time);

		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}


/**
 * This class defines the projectile creation of the player
 * 
 * @typedef projectile
 */
class projectile extends Body{
	//Constructor
	/**
	 * 
	 * @param {Object} player 
	 */
	constructor(player){
		super();
		//Default position of projectile (based on player movement)
		this.position = {
			x: player.position.x,
			y: player.position.y - (player.position.y * .05)
		}
	}
	
	/**
	 * Draws the projectile (line)
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics){
		graphics.strokeStyle = "#000000";
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + 10
		);
		graphics.stroke();
		//draw lines
		super.draw(graphics);
	}

	/**
	 * Updates the projectile location
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time){
		this.position.y = this.position.y - 10
		super.update(delta_time);
		if(this.position.y < 0) this.remove();
	}
	
	/**
	 * Remove Projectile from the screen
	 */
	remove(){
		queued_entities_for_removal.push(this.id);
	}
}


/**
 * Class defining the creation of an enemy
 * 
 * @typedef enemy
 */
class enemy extends Body{
	//Creates Enemy with default attributes
	constructor(){
		super();
		//Default location of enemy
		this.position = {
			x: Math.floor(Math.random() * config.canvas_size.width),
			y: config.canvas_size.height - 800
		}
	}


	/**
	 * Draws an enemy at the Default location
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#ff0000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y + this.half_size.height
			);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.stroke();
	
		//draw velocity lines
		super.draw(graphics);
		
	}

	/**
	 * Updates the enemy location
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time){
		this.position.y = this.position.y + 5;
		super.update(delta_time); //Updating position
		if(this.position.y > config.canvas_size.height) this.remove();
	}

	/**
	 * Remove enemy from the screen
	 */
	remove(){
		queued_entities_for_removal.push(this.id);
	}

}

/**
 * Class defining the Enemy spawning
 * 
 * @typedef SpawnEnemy
 */
class SpawnEnemy{
	/**
	 * Updates the spawning of enemies
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time){
		new enemy();
		NumEnemies = NumEnemies + 1;
	}
}

/**
 * Collision Checking
 * Case 1: Player Collides with Enemy
 * Case 2: Projectile Collides with Enemy
 * 
 * @param {Number} PlayerMinX min x coordinate bounds of player
 * @param {Number} PlayerMaxX max x coordinate bounds of player
 * @param {Number} PlayerMinY min x coordinate bounds of player
 * @param {Number} PlayerMaxY min x coordinate bounds of player
 * 
 * @param {Number} EnemyMinX min x coordinate bounds of a enemy
 * @param {Number} EnemyMaxX max x coordinate bounds of a enemy
 * @param {Number} EnemyMinY min x coordinate bounds of a enemy
 * @param {Number} EnemyMaxY max x coordinate bounds of a enemy
 * 
 * 
 * @typedef collision
 */
class collision{
	//Constructor - Grabs entities as input argument
	constructor(entities){
		
	}

	/**
	 * Updates the collisions
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time){
		//For Every Entity
		for(let i = 0; i < entities.length; i++){
			//For every entity ... again
			for(let j = 0; j < entities.length; j++){
				//if i and j are not empty
				if(entities[i] != null && entities[j] != null){
					//CASE 1------------------------------------------------------
					//if entities[i] is a player
					if(entities[i].constructor.name == 'Player'){
						//If entities[j] is an enemy
						if(entities[j].constructor.name == 'enemy'){
							//Getting x and y coordinate bounds of player 
							let PlayerMinX = (entities[i].position.x) - (entities[i].size.width / 2);
							let PlayerMaxX = (entities[i].position.x) + (entities[i].size.width / 2);
							let PlayerMinY = (entities[i].position.y) - (entities[i].size.height / 2);
							let PlayerMaxY = (entities[i].position.y) + (entities[i].size.height / 2);
							//Getting x and coordinate bounds of enemy
							let EnemyMinX = (entities[j].position.x) - (entities[j].size.width / 2);
							let EnemyMaxX = (entities[j].position.x) + (entities[j].size.width / 2);
							let EnemyMinY = (entities[j].position.y) - (entities[j].size.height / 2);
							let EnemyMaxY = (entities[j].position.y) + (entities[j].size.height / 2);
							//If Player and Enemy Collide
							if((Math.abs(PlayerMaxX - EnemyMaxX) + Math.abs(PlayerMinX - EnemyMinX)) <= entities[j].size.width + 5){
								if((Math.abs(PlayerMaxY - EnemyMaxY) + Math.abs(PlayerMinY - EnemyMinY)) <= entities[j].size.height + 5){
									//Make Enemy Disappear
									entities[j].remove();
									//Make Player Lose 25 health
									hits = hits - 25; //Used to output health
									entities[i].health = entities[i].health - 25;
								}
							}
							
						}
					}
					//-----------------------------------------------------------

					//CASE 2-----------------------------------------------------
					//if entities[i] is a projectile
					if(entities[i].constructor.name == 'projectile'){
						//If entitis[j] is an enemy
						if(entities[j].constructor.name == 'enemy'){
							//Getting X and Y coordinates of enemy
							let EnemyMinX = (entities[j].position.x) - (entities[j].size.width / 2);
							let EnemyMaxX = (entities[j].position.x) + (entities[j].size.width / 2);
							let EnemyMinY = (entities[j].position.y) + (entities[j].size.height / 2);
							let EnemyMaxY = (entities[j].position.y) - (entities[j].size.height / 2);
							//Getting X and Y coordinates of projectile
							let ProjectileMinX = (entities[i].position.x) - (entities[i].size.width / 2);
							let ProjectileMaxX = (entities[i].position.x) + (entities[i].size.width / 2);
							let ProjectileMinY = (entities[i].position.y) + (entities[i].size.height / 2);
							let ProjectileMaxY = (entities[i].position.y) + (entities[i].size.height / 2);
							//If Projectile and Enemy Collide
							if((Math.abs(ProjectileMaxX - EnemyMaxX) + Math.abs(ProjectileMinX - EnemyMinX)) <= entities[j].size.width){
								if((Math.abs(ProjectileMaxY - EnemyMaxY) + Math.abs(ProjectileMinY - EnemyMinY)) <= entities[j].size.height){
									//Make enemy disappear
									entities[j].remove();
									//Make projectile disappear
									entities[i].remove();
									kills = kills + 1;
								}
							}
							
						}
					}
					//-----------------------------------------------------------
				}
			}
		}
	}

}

/* 
------------------------------
------ CONFIG SECTION -------- 
------------------------------
*/

const config = {
	graphics: {
		// set to false if you are not using a high resolution monitor
		is_hi_dpi: true
	},
	canvas_size: {
		width: 400,
		height: 500
	},
	update_rate: {
		fps: 60,
		seconds: null
	}
};

config.update_rate.seconds = 1 / config.update_rate.fps;

// grab the html span
const game_state = document.getElementById('game_state');
const killing = document.getElementById('killing');

// grab the html canvas
const game_canvas = document.getElementById('game_canvas');
game_canvas.style.width = `${config.canvas_size.width}px`;
game_canvas.style.height = `${config.canvas_size.height}px`;

const graphics = game_canvas.getContext('2d');

// for monitors with a higher dpi
if (config.graphics.is_hi_dpi) {
	game_canvas.width = 2 * config.canvas_size.width;
	game_canvas.height = 2 * config.canvas_size.height;
	graphics.scale(2, 2);
} else {
	game_canvas.width = config.canvas_size.width;
	game_canvas.height = config.canvas_size.height;
	graphics.scale(1, 1);
}

/* 
------------------------------
------- MAIN SECTION  -------- 
------------------------------
*/

/** @type {Number} last frame time in seconds */
var last_time = null;

/** @type {Number} A counter representing the number of update calls */
var loop_count = 0;

/** @type {Number} A counter that is used to assign bodies a unique identifier */
var running_id = 0;

/** @type {Object<Number, Body>} This is a map of body ids to body instances */
var entities = null;

/** @type {Array<Number>} This is an array of body ids to remove at the end of the update */
var queued_entities_for_removal = null;

/** @type {Player} The active player */
var player = null;

/* You must implement this, assign it a value in the start() function */
var enemy_spawner = null;
var NumEnemies = 0;

/* You must implement this, assign it a value in the start() function */
var collision_handler = null;

//Number of Enemies hit
var kills = 0;
//Player Health Output
var hits = 100;

/**
 * This function updates the state of the world given a delta time.
 * 
 * @param {Number} delta_time Time since last update in seconds.
 */
function update(delta_time) {
	//Updating player and enemies as long as player is alive
	if(!player.isDead()){
		// move entities
		Object.values(entities).forEach(entity => {
			entity.update(delta_time);
		});

		// detect and handle collision events
		if (collision_handler != null) {
			collision_handler.update(delta_time);
		}
		console.log(entities);
		// remove enemies
		queued_entities_for_removal.forEach(id => {
			delete entities[id];
		})
		queued_entities_for_removal = [];

		// spawn enemies
		if (enemy_spawner != null) {
			//Spawning enemies based on loop_count
			if(Number.isInteger(loop_count/25) == true){
				enemy_spawner.update(delta_time);
			}
			
		}
	}
	// allow the player to restart when dead
	if (player.isDead() && player.controller.action_1) {
		start();
	}
}

/**
 * This function draws the state of the world to the canvas.
 * 
 * @param {CanvasRenderingContext2D} graphics The current graphics context.
 */
function draw(graphics) {
	// default font config
	graphics.font = "10px Arial";
	graphics.textAlign = "left";

	// draw background (this clears the screen for the next frame)
	graphics.fillStyle = '#FFFFFF';
	graphics.fillRect(0, 0, config.canvas_size.width, config.canvas_size.height);

	// for loop over every eneity and draw them
	Object.values(entities).forEach(entity => {
		entity.draw(graphics);
	});

	// game over screen
	if (player.isDead()) {
		

		graphics.font = "30px Arial";
		graphics.fillStyle = "#000000";
		graphics.textAlign = "center";
		graphics.fillText('Game Over', config.canvas_size.width / 2, config.canvas_size.height / 2);

		graphics.font = "12px Arial";
		graphics.textAlign = "center";
		graphics.fillText('press space to restart', config.canvas_size.width / 2, 18 + config.canvas_size.height / 2);
	}
}

/**
 * This is the main driver of the game. This is called by the window requestAnimationFrame event.
 * This function calls the update and draw methods at static intervals. That means regardless of
 * how much time passed since the last time this function was called by the w indow the delta time
 * passed to the draw and update functions will be stable.
 * 
 * @param {Number} curr_time Current time in milliseconds
 */
function loop(curr_time) {
	// convert time to seconds
	curr_time /= 1000;
	// edge case on first loop
	if (last_time == null) {
		last_time = curr_time;
	}

	var delta_time = curr_time - last_time;

	// this allows us to make stable steps in our update functions
	while (delta_time > config.update_rate.seconds) {
		
		update(config.update_rate.seconds);
		draw(graphics);

		delta_time -= config.update_rate.seconds;
		last_time = curr_time;
		loop_count++;

		//Calculating score and time in seconds as long as player is alive
		if(!player.isDead()){
			curr_time_output = Math.round(loop_count / config.update_rate.fps);
			score = Math.floor(30 * kills + (curr_time_output));
			//Outputting Score Information to HTML page
			game_state.innerHTML = `loop count ${loop_count}`;
			document.getElementById("seconds").innerHTML = `Seconds Alive: ${curr_time_output}`;
			document.getElementById("hits").innerHTML = `Hits:  ${kills}`;
			document.getElementById("spawn").innerHTML = `Enemies Spawned:  ${NumEnemies}`;
			document.getElementById("score").innerHTML = `Score:  ${score}`;
			document.getElementById("health").innerHTML = `Health:  ${hits}%`;
		}
		//Printing when player has no health - this value wouldn't update to 0 otherwise
		else{
			document.getElementById("health").innerHTML = `Health:  ${0}%`;
		}
	}

	window.requestAnimationFrame(loop);
}


/**
 * Starting game function
 */
function start() {
	//Resetting score/counter variables
	kills = 0;
	hits = 100;
	NumEnemies = 0;
	loop_count = 0;
	clock = 0;
	//Loading in player and enemies and checking collision
	entities = [];
	queued_entities_for_removal = [];
	player = new Player();
	enemy_spawner = new SpawnEnemy();
	collision_handler = new collision(entities);
}

// start the game
start();

// start the loop
window.requestAnimationFrame(loop);