/*
GAME TITLE: Space Defence
AUTHOR: Dylan Love
VERSION: 1.00

Phaser 3.55.2
*/

// Variables
// Prerequisites
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: Preload,
        create: Create,
        update: Update
    }
};
var game = new Phaser.Game(config);

// Actors
var playerPaddle;
var aiPaddle;
var ball;

// Core Game Variables
var bonusSpeed = 1;
var aiBonusSpeed = 1;
var playerScore = 0;
var aiScore = 0;
var isDone = false;
var bonusModeEnabled = false;
var highScore = 0;
var aiDefaultSpeed = 100;

// Game Text Variables
var playerScoreText;
var aiScoreText;

// Keys
var cursors;
var bonusSpeedKey;

// One Time Press Variables -- Has to be outside scope
var alreadyPressed = false;
var alreadyPressed1 = false;
var alreadyPressed2 = false;

// Debug Variables
var enableDebug = false;
var debugTextAiSpeed;
var debugAiSpeed;
var gameCount = 0;

// Functions
// Initial
function Preload() {
    // Sprites
    this.load.image('playerPaddle', 'assets/playerPaddle.png');
    this.load.image('aiPaddle', 'assets/aiPaddle.png');
    this.load.image('background', 'assets/background.png')
    this.load.image('ball', 'assets/ball.png');
    this.load.image('centerLine', 'assets/center line.png');

    // Audio
    this.load.audio('ballHitSound', ['sounds/ballHit.ogg']);
    this.load.audio('ballExplosionSound', ['sounds/ballExplosion.ogg']);
}

function Create() {
    // Set Key Inputs
    cursors = this.input.keyboard.createCursorKeys();
    bonusSpeedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    ResetGameKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    
    // Create objects/sprites
    background = this.physics.add.sprite(config.width / 2, config.height / 2, 'background').setOrigin(0.5, 0.5);
    centerLine = this.physics.add.sprite(config.width / 2, config.height / 2, 'centerLine').setOrigin(0.5, 0.5);
    playerPaddle = this.physics.add.sprite(50, config.height / 2, 'playerPaddle').setOrigin(0.5, 0.5).setCollideWorldBounds(true).setImmovable(true);
    aiPaddle = this.physics.add.sprite(config.width - 50, config.height / 2, 'aiPaddle').setOrigin(0.5, 0.5).setCollideWorldBounds(true).setImmovable(true);
    ball = this.physics.add.sprite(config.width / 2, config.height / 2, 'ball').setOrigin(0.5, 0.5).setCollideWorldBounds(true).setBounce(1);

    // Audio
    ballHitSound = this.sound.add('ballHitSound', { loop: false });
    ballExplosionSound = this.sound.add('ballExplosionSound', { loop: false });
    

    // Physics
    // Set initial velocity for the ball
    ball.setVelocity(200, 200);

    // Colliders
    this.physics.add.collider(ball, playerPaddle, BallHitPaddle, null, this);
    this.physics.add.collider(ball, aiPaddle, BallHitPaddle, null, this);
    this.physics.add.collider(ball, this.physics.world.bounds, BallHitWall, null, this);

    // Game Text Setup
    playerScoreText = this.add.text((config.width / 2) - 360, 16, 'Player 1: 0', { fontSize: '24px', fill: '#fff' });
    aiScoreText = this.add.text((config.width / 2) + 180, 16, 'Player 2: 0', { fontSize: '24px', fill: '#fff' });
    highScoreText = this.add.text((config.width / 2)- 100, 16, 'High Score: 0', {fontSize: '24px', fill: '#fff'});

    // Debug Text Setup
    debugIsNewGameModeOnText = this.add.text((config.width / 2) -240, config.height - 128, 'isNewGameModeOn: false', { fontSize: '24px', fill: '#fff' });
    debugGameText = this.add.text((config.width / 2) - 240, config.height - 94, 'Games: 0', { fontSize: '24px', fill: '#fff' });
    debugTextAiSpeed = this.add.text((config.width / 2) - 240, config.height - 60, 'aiDebugSpeed: 0', { fontSize: '24px', fill: '#fff' });
    debugTextPlayerSpeed = this.add.text((config.width / 2) -240, config.height - 26, 'playerDebugSpeed: 0', { fontSize: '24px', fill: '#fff' });
}

// Updated Every Frame
function Update()  { 
    // Key Inputs
    if (cursors.up.isDown) { playerPaddle.body.velocity.y = -300 * bonusSpeed; debugPlayerSpeed = -300 * bonusSpeed; } 
    else if (cursors.down.isDown) { playerPaddle.body.velocity.y = 300 * bonusSpeed; debugPlayerSpeed = 300 * bonusSpeed; } 
    else { playerPaddle.body.velocity.y = 0; debugPlayerSpeed = 0 * bonusSpeed;}
    
    if (bonusSpeedKey.isDown) { bonusSpeed = 2; }
    else { bonusSpeed = 1; }

    if (ResetGameKey.isDown && !alreadyPressed1) { ResetGame(); alreadyPressed1 = true; }
    else if (ResetGameKey.isUp && alreadyPressed1) { alreadyPressed1 = false; }

    // Ball hitting either wall
    if (ball.x <= 25 || ball.x >= config.width-25)
    {
        // Audio
        ballExplosionSound.play(); 
        
        // Check which side was hit
        if(ball.x <= 25) { aiScore++; }
        if(ball.x >= config.width-25) { playerScore++; }
        
        // Functions
        ResetBall();
        UpdateScoreText(); 
    }

    // Losing / Endgame Conditions
    if (aiScore >= 5)
    {
        UpdateHighScore()
    }

    // Functions (Updated Every Frame)
    UpdateComputerPaddle();
    AiBonusSpeedCalc();
    RealTimeTextUpdate();
    EnableDebugFunction();
} 

// Reset Functions
function ResetBall() {
    // Reset ball position
    ball.setPosition(config.width / 2, config.height / 2);
    
    // Reset paddle positions
    playerPaddle.setPosition(50, config.height / 2);
    aiPaddle.setPosition(config.width - 50, config.height / 2);

    // Reset ball velocity
    var direction = Math.random() < 0.5 ? -1 : 1;
    ball.setVelocity(direction * Phaser.Math.Between(200, 400), Phaser.Math.Between(-200, 200));
}

function ResetGame() {
    // Reset scores
    playerScore = 0;
    aiScore = 0;
    UpdateScoreText();

    ResetBall();

    gameCount ++; 
}

// Game Mechanic Functions
function UpdateComputerPaddle() {
    if (ball.y + 5 < aiPaddle.y) {
        aiPaddle.body.velocity.y = -aiDefaultSpeed * aiBonusSpeed;
        debugAiSpeed = -aiDefaultSpeed * aiBonusSpeed;
    } 
    
    else if (ball.y - 5 > aiPaddle.y) {
        aiPaddle.body.velocity.y = aiDefaultSpeed * aiBonusSpeed;
        debugAiSpeed = aiDefaultSpeed * aiBonusSpeed;
    } 
    
    else {
        aiPaddle.body.velocity.y = 0;
        debugAiSpeed = 0;
    }
}

function BallHitPaddle(ball, paddle) {
    var deltaY = ball.y - paddle.y;
    ball.setVelocityY(ball.body.velocity.y + deltaY * 5); 

    ballHitSound.play();
}

function BallHitWall(ball, wall) {
    ball.setVelocityY(ball.body.velocity.y * -1);
}

function AiBonusSpeedCalc()
{
    // Speed Increasing every 5 points the player gets
    if (playerScore % 3 == 0 && !isDone)
    {
        isDone = true;
        aiBonusSpeed += 0.5;
    }

    if (playerScore % 3 != 0) { isDone = false; }
}

// Text related functions
function UpdateScoreText() 
{
    // Update the text objects with the current scores
    playerScoreText.setText('Player 1: ' + playerScore);
    aiScoreText.setText('Player 2: ' + aiScore);
}

function UpdateHighScore()
{
    if (highScore < playerScore)
    {
        highScore = playerScore;
        highScoreText.setText('High Score: ' + highScore);
    }
    ResetGame();
}

// Debug Functions
function RealTimeTextUpdate()
{
    if (enableDebug)
    {
        debugTextAiSpeed.setText('aiDebugSpeed: ' + debugAiSpeed);
        debugTextPlayerSpeed.setText('playerDebugSpeed: ' + debugPlayerSpeed);
        debugGameText.setText('Game: '+ gameCount);
        debugIsNewGameModeOnText.setText('isNewGameModeOn: ' + bonusModeEnabled);
    }

    else
    {
        debugTextAiSpeed.setText();
        debugTextPlayerSpeed.setText();
        debugGameText.setText();
        debugIsNewGameModeOnText.setText();
    }
    
}

function EnableDebugFunction()
{
    if (debugKey.isDown && !alreadyPressed)
    {
        alreadyPressed = true;
        if (enableDebug){
            enableDebug = false;
        }
        else if (!enableDebug){
            enableDebug = true;
        }
    }
    else if (debugKey.isUp && alreadyPressed) { alreadyPressed = false; }
}
