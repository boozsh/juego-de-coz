let mic;
let playerY = 800; // Posición inicial del personaje en el eje Y
let velocity = 0; // Velocidad inicial del personaje
let gravity = 0.8; // Gravedad que afecta al personaje
let obstacles = []; // Arreglo para los obstáculos
let score = 0; // Puntaje del jugador
let gameOver = false;

let gameState = "menu"; // Estados del juego: "menu", "playing", "gameover"

let logoImg, fondoImg;

let playerName = "";
let input, startButton;
let restartButton, menuButton;

let ranking = [];
let bgMusic;
let bgMusicVolume = 0.2; // Volumen de la música de fondo

let voicePhrases = []; // Frases de voz al perder
let currentVoice;

let obstacleSpeed = 5; // Velocidad inicial de los obstáculos
let speedIncreaseRate = 0.001; // Incremento gradual en la velocidad de los obstáculos

let timeElapsed = 0; // Tiempo transcurrido en segundos

function preload() {
  logoImg = loadImage("ESC-cine.png"); // Imagen del personaje
  fondoImg = loadImage("FONDO.jpg"); // Imagen de fondo del juego
  bgMusic = loadSound("musicaFondo.mp3"); // Música de fondo
  voicePhrases = [
    loadSound("frase1.mp3"),
    loadSound("frase2.mp3"),
    loadSound("frase3.mp3"),
  ];
}

function setup() {
  createCanvas(1920, 1080); // Tamaño del canvas
  mic = new p5.AudioIn(); // Entrada de micrófono
  mic.start(); // Inicia el micrófono
  bgMusic.setVolume(bgMusicVolume); // Configura el volumen de la música de fondo
  bgMusic.loop(); // Reproduce la música en bucle
  createMenuUI(); // Configura el menú inicial
}

function createMenuUI() {
  // Crea el input para el nombre del jugador
  input = createInput();
  input.position(width / 2 - 150, height / 2 - 20);
  input.size(300);

  // Botón para iniciar el juego
  startButton = createButton("Jugar");
  startButton.position(width / 2 - 50, height / 2 + 30);
  startButton.mousePressed(() => {
    playerName = input.value() || "Jugador"; // Obtiene el nombre del jugador
    input.hide();
    startButton.hide();
    stopVoice();
    resetGame();
    gameState = "playing"; // Cambia el estado del juego a "playing"
  });
}

function draw() {
  background(220);

  if (gameState === "menu") {
    // Renderiza el menú principal
    image(fondoImg, 0, 0, width, height);
    fill(0);
    textAlign(CENTER);
    textSize(48);
    text("MENÚ PRINCIPAL", width / 2, 100);
    textSize(24);
    text("Ingresa tu nombre y haz clic en Jugar", width / 2, 150);

    showRanking(); // Muestra el ranking
  } else if (gameState === "playing") {
    // Renderiza la pantalla de juego
    image(fondoImg, 0, 0, width, height);

    let vol = mic.getLevel(); // Obtiene el nivel del micrófono
    if (vol > 0.05) {
      let force = map(vol, 0.05, 0.3, -8, -25); // Mapea el volumen a una fuerza de salto
      velocity = force; // Aplica la fuerza al personaje
    }

    playerY += velocity; // Actualiza la posición del personaje
    velocity += gravity; // Aplica la gravedad al personaje

    // Límite inferior: evita que el personaje caiga debajo del suelo
    if (playerY > 800) {
      playerY = 800;
      velocity = 0;
    }

    // Límite superior: evita que el personaje salga por la parte superior del canvas
    if (playerY < 0) {
      playerY = 0;
      velocity = 0;
    }

    image(logoImg, 180, playerY - 40, 80, 80); // Renderiza el personaje
    stroke(0);
    line(0, 820, width, 820); // Línea del suelo

    obstacleSpeed += speedIncreaseRate; // Incrementa gradualmente la velocidad de los obstáculos

    for (let obs of obstacles) {
      obs.x -= obstacleSpeed; // Actualiza la posición de los obstáculos

      // Reposicionar el obstáculo cuando salga de la pantalla
      if (obs.x < -obs.w) {
        obs.x = width + random(200, 600); // Reposicionar a la derecha, con un pequeño desfase
        if (obs.type === "normal") {
          obs.y = random(600, 800); // Altura aleatoria para obstáculos normales
          obs.h = random(100, 200);
        } else if (obs.type === "tunnel") {
          let tunnelGap = random(200, 300); // Espacio entre los dos obstáculos
          let tunnelY = random(400, 700); // Posición vertical del túnel

          // Parte superior del túnel
          obs.y = 0;
          obs.h = tunnelY - tunnelGap / 2;
          obs.tunnelGap = tunnelGap; // Guardar el espacio para la parte inferior
          obs.tunnelY = tunnelY; // Guardar la posición del túnel
        }
      }

      fill(255, 50, 50);
      rect(obs.x, obs.y, obs.w, obs.h);

      // Lógica de colisión
      if (
        200 + 40 > obs.x &&
        200 - 40 < obs.x + obs.w &&
        playerY + 40 > obs.y &&
        playerY - 40 < obs.y + obs.h
      ) {
        gameState = "gameover";
        saveScore();
        showGameOverUI();
        playRandomVoice();
      }

      // Dibujar la parte inferior del túnel si es un obstáculo tipo "túnel"
      if (obs.type === "tunnel") {
        let lowerPartY = obs.tunnelY + obs.tunnelGap / 2;
        rect(obs.x, lowerPartY, obs.w, height - lowerPartY);
        if (
          200 + 40 > obs.x &&
          200 - 40 < obs.x + obs.w &&
          (playerY + 40 > lowerPartY || playerY - 40 < obs.h)
        ) {
          gameState = "gameover";
          saveScore();
          showGameOverUI();
          playRandomVoice();
        }
      }
    }

    // Actualizamos el puntaje como un cronómetro
    timeElapsed += deltaTime / 1000; // deltaTime en segundos
    score = timeElapsed; // El puntaje es igual al tiempo transcurrido

    fill(0);
    textSize(24);
    textAlign(LEFT);
    text(`Jugador: ${playerName}`, 20, 40);
    text(`Puntaje: ${score.toFixed(2)}`, 20, 70);
  } else if (gameState === "gameover") {
    // Renderiza la pantalla de Game Over
    image(fondoImg, 0, 0, width, height);
    fill(0);
    textAlign(CENTER);
    textSize(48);
    text("¡Perdiste!", width / 2, height / 2 - 60);
    textSize(32);
    text(`${playerName} - Puntaje: ${score.toFixed(2)}`, width / 2, height / 2);

    fill(20);
    textSize(24);
    text(`TOP 3:`, width / 2, height / 2 + 60);
    for (let i = 0; i < 3 && i < ranking.length; i++) {
      let entry = ranking[i];
      text(
        `${i + 1}. ${entry.name}: ${entry.score.toFixed(2)}`,
        width / 2,
        height / 2 + 90 + i * 30
      );
    }
  }
}

// Función para generar obstáculos dinámicos
function generateObstacles() {
  obstacles = [];
  let obstacleTypes = ["normal", "tunnel"]; // Tipos de obstáculos: normal o túnel

  for (let i = 0; i < 3; i++) {
    let type = random(obstacleTypes);

    if (type === "normal") {
      // Obstáculo normal
      obstacles.push({
        x: 1920 + i * 600,
        y: random(600, 800), // Altura variable
        w: 40,
        h: random(100, 200), // Altura variable
        type: "normal",
      });
    } else if (type === "tunnel") {
      // Obstáculo tipo túnel (doble)
      let tunnelGap = random(200, 300); // Espacio entre los dos obstáculos
      let tunnelY = random(400, 700); // Posición vertical del túnel

      // Parte superior del túnel
      obstacles.push({
        x: 1920 + i * 600,
        y: 0,
        w: 40,
        h: tunnelY - tunnelGap / 2,
        type: "tunnel",
        tunnelGap: tunnelGap,
        tunnelY: tunnelY,
      });
    }
  }
}

// Función para mostrar el ranking
function showRanking() {
  let boxX = width / 2 - 200;
  let boxY = 200;
  let boxW = 400;
  let boxH = 300;

  fill(255, 255, 255, 200);
  stroke(0);
  rect(boxX, boxY, boxW, boxH);
  fill(0);
  textSize(20);
  textAlign(CENTER);
  text("Ranking:", width / 2, boxY + 30);

  push();
  let visibleEntries = 10;
  for (let i = 0; i < ranking.length && i < visibleEntries; i++) {
    let entry = ranking[i];
    let y = boxY + 60 + i * 24;
    if (i === 0) fill("gold");
    else if (i === 1) fill("silver");
    else if (i === 2) fill("#cd7f32");
    else fill(0);
    text(`${i + 1}. ${entry.name}: ${entry.score.toFixed(2)}`, width / 2, y);
  }
  pop();
}

// Reinicia el juego
function resetGame() {
  playerY = 800;
  velocity = 0;
  score = 0;
  timeElapsed = 0; // Reiniciamos el cronómetro
  gameOver = false;
  obstacleSpeed = 5;

  generateObstacles(); // Generar obstáculos dinámicos

  if (restartButton) restartButton.hide();
  if (menuButton) menuButton.hide();
}

// Guarda el puntaje
function saveScore() {
  ranking.push({ name: playerName, score: score });
  ranking.sort((a, b) => b.score - a.score);
}

// Muestra la interfaz de Game Over
function showGameOverUI() {
  restartButton = createButton("Jugar de nuevo");
  restartButton.position(width / 2 - 100, height / 2 + 180);
  restartButton.mousePressed(() => {
    stopVoice();
    resetGame();
    gameState = "playing";
  });

  menuButton = createButton("Volver al menú");
  menuButton.position(width / 2 - 80, height / 2 + 230);
  menuButton.mousePressed(() => {
    stopVoice();
    gameState = "menu";
    input.show();
    startButton.show();
    restartButton.hide();
    menuButton.hide();
  });
}

// Reproduce una frase de voz aleatoria
function playRandomVoice() {
  if (currentVoice && currentVoice.isPlaying()) {
    currentVoice.stop();
  }
  let idx = floor(random(voicePhrases.length));
  currentVoice = voicePhrases[idx];
  currentVoice.setVolume(1);
  currentVoice.play();
}

// Detiene la frase de voz actual
function stopVoice() {
  if (currentVoice && currentVoice.isPlaying()) {
    currentVoice.stop();
  }
}