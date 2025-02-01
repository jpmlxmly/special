window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;

    const GAME_CONFIG = {
        companionGap: 300,  
        companionStartX: 1000,
        endThreshold: 0.8 
    };

    class InputHandler {
        constructor(){
            this.keys = [];
            window.addEventListener('keydown', e => {
                if ((   e.key === 'ArrowDown' || 
                        e.key === 'ArrowUp' ||  
                        e.key === 'ArrowLeft' || 
                        e.key === 'ArrowRight')
                        && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);
                }
            });
            window.addEventListener('keyup', e =>{
                if (   e.key === 'ArrowDown' || 
                        e.key === 'ArrowUp' ||  
                        e.key === 'ArrowLeft' || 
                        e.key === 'ArrowRight'){
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    class Background {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('bg-img');
            this.width = 5575;
            this.height = 720;
            this.x = 0;
            this.speed = 0;
            this.minX = 0;
            this.endReached = false;
            this.triggerPoint = this.width * GAME_CONFIG.endThreshold;
        }
        draw(context){
            for(let i = 0; i < 3; i++) {
                context.drawImage(
                    this.image, 
                    this.x + (i * this.width), 
                    0, 
                    this.width, 
                    this.height
                );
            }

            if(this.x < -this.width) {
                this.x += this.width;
            }
            if(this.x > 0) {
                this.x -= this.width;
            }
        }
        update(playerSpeed){
            if (!(this.x >= this.minX && playerSpeed < 0)) {
                this.x -= playerSpeed;
                if (Math.abs(this.x) >= this.triggerPoint) {
                    this.endReached = true;
                }
            }
        }
        isAtStart() {
            return this.x >= this.minX;
        }
        hasReachedEnd() {
            return this.endReached;
        }
    }

    class Character {
        constructor(gameWidth, gameHeight, isCompanion = false){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = isCompanion ? gameWidth + GAME_CONFIG.companionStartX : 100;
            this.y = 200;
            this.groundY = this.gameHeight - this.height - 100;
            // Use different images for player and companion
            this.image = isCompanion ? 
                document.getElementById('companion-img') : 
                document.getElementById('player-img');
            this.frameX = 0;
            this.frameY = 1;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
            this.maxFrame = 5;
            this.fps = 15;
            this.frameInterval = 1000/this.fps;
            this.frameTimer = 0;
            this.lastTime = 0;
            this.moving = false;
            this.canJump = true;
            this.maxSpeed = 2;
            this.isCompanion = isCompanion;
            this.hasArrived = false;
            
            this.y = this.groundY;
        }
        draw(context){
            context.save();
            if (this.isCompanion) {
                context.scale(-1, 1);
                context.drawImage(this.image, 
                    this.frameX * this.width, this.frameY * this.height,
                    this.width, this.height, 
                    -this.x - this.width, this.y, 
                    this.width, this.height);
            } else {
                context.drawImage(this.image, 
                    this.frameX * this.width, this.frameY * this.height,
                    this.width, this.height, 
                    this.x, this.y, 
                    this.width, this.height);
            }
            context.restore();
        }
        update(input, currentTime, background, player){
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            if(this.moving){
                if(this.frameTimer > this.frameInterval){
                    if(this.frameX >= this.maxFrame) this.frameX = 0;
                    else this.frameX++;
                    this.frameTimer = 0;
                } else {
                    this.frameTimer += deltaTime;
                }
            } else {
                this.frameX = 0;
            }
            
            if (this.isCompanion) {
                if (background.hasReachedEnd() && !this.hasArrived) {
                    this.moving = true;
                    const targetX = player.x + GAME_CONFIG.companionGap;
                    
                    if (this.x > targetX) {
                        this.x -= 2;
                    } else {
                        this.x = targetX;
                        this.moving = false;
                        this.hasArrived = true;
                    }
                }
            } else {
                if (input.keys.indexOf('ArrowRight') > -1){
                    this.speed = this.maxSpeed;
                    this.moving = true;
                } else if (input.keys.indexOf('ArrowLeft') > -1) {
                    if (!background.isAtStart()) {
                        this.speed = -this.maxSpeed;
                        this.moving = true;
                    } else {
                        this.speed = 0;
                        this.moving = false;
                    }
                } else {
                    this.speed = 0;
                    this.moving = false;
                }
                
                if (input.keys.indexOf('ArrowUp') > -1 && this.onGround() && this.canJump) {
                    this.vy = -20;
                    this.canJump = false;
                }

                if (this.onGround() && !input.keys.includes('ArrowUp')) {
                    this.canJump = true;
                }
            }
            
            this.y += this.vy;
            if(!this.onGround()){
                this.vy += this.weight;
            } else {
                this.vy = 0;
                this.y = this.groundY;
            }
        }
        onGround(){
            return this.y >= this.groundY;
        }
    }

    const input = new InputHandler();
    const player = new Character(canvas.width, canvas.height, false);
    const companion = new Character(canvas.width, canvas.height, true);
    const background = new Background(canvas.width, canvas.height);

    function animate(timestamp){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw(ctx);
        player.draw(ctx);
        companion.draw(ctx);
        background.update(player.speed);
        player.update(input, timestamp, background);
        companion.update(input, timestamp, background, player);
        requestAnimationFrame(animate);
    }
    animate(0);
});