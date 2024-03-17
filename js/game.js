document.addEventListener("DOMContentLoaded", function () {
  const player = document.getElementById("player");
  const gameContainer = document.getElementById("gameContainer");
  const backgroundMusic = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const startMenu = document.getElementById("startMenu");
  const gameOverMenu = document.getElementById("gameOverMenu");
  const victoryMenu = document.getElementById("victoryMenu");
  const playButton = document.getElementById("playButton");
  const restartButton = document.getElementsByClassName("restartButton");
  const backButton = document.getElementsByClassName("backButton");
  const pauseButton = document.getElementById("pauseButton");
  const escapeButton = document.getElementById("escapeButton");
  const lifeBar = document.getElementById("life");
  const scoreDisplay = document.createElement("div");
  scoreDisplay.style.display = "none";
  scoreDisplay.className = "score";
  document.body.appendChild(scoreDisplay);

  let playerPosition = gameContainer.offsetWidth / 2;
  let enemies = [];
  let projectiles = [];
  let score = 0;
  let lives = 3;
  let gamePaused = false;
  let lastRenderTime = 0;
  const keysPressed = {};
  let lastShotTime = 0;
  const shootCooldown = 0.2;
  let spawnInterval = 300;
  let spawnIntervalId;
  let isImmune = false;
  const immunityDuration = 2000;

  let easterEggs = [
    {
      id: 1,
      message: "LaGazetteTulliste a changé trois fois de logo !",
      img: "images/game/1.png",
      collected: false,
    },
    {
      id: 2,
      message:
        "LaGazetteTulliste aurait dû voir le jour sous une version papier. Mais grâce à Elliot MOREAU, le projet verra finalement le jour sous une version numérique.",
      img: "images/game/2.png",
      collected: false,
    },
    {
      id: 3,
      message:
        "LaGazetteTulliste a changé de design trois fois, passant d'angles pointus à arrondis, puis à un style épuré et moderne, avec des logos mis à jour à chaque étape.",
      img: "images/game/3.png",
      collected: false,
    },
    {
      id: 4,
      message:
        "Une version premium de LaGazetteTulliste était en création. Finalement, celle-ci ne verra jamais le jour.",
      img: "images/game/4.png",
      collected: false,
    },
    {
      id: 5,
      message:
        "Il y a deux adresses différentes pour accéder à votre journal préféré. L'adresse .me est arrivée récemment.",
      img: "images/game/5.png",
      collected: false,
    },
  ];
  let currentEggIndex = 0;
  let lastTwoSpawns = [false, false];

  document.addEventListener("keydown", (e) => (keysPressed[e.key] = true));
  document.addEventListener("keyup", (e) => (keysPressed[e.key] = false));
  musicToggle.addEventListener("click", toggleMusic);
  playButton.addEventListener("click", startGame);
  Array.from(restartButton).forEach((button) =>
    button.addEventListener("click", restartGame)
  );
  Array.from(backButton).forEach((button) =>
    button.addEventListener("click", () => {
      window.location.href = "/";
    })
  );
  pauseButton.addEventListener("click", togglePause);
  escapeButton.addEventListener("click", leaveGame);

  function toggleMusic() {
    if (backgroundMusic.paused) {
      backgroundMusic.play();
      musicToggle.innerHTML = '<img src="images/icons/mute.png">';
    } else {
      backgroundMusic.pause();
      musicToggle.innerHTML = '<img src="images/icons/unmute.png">';
    }
  }

  function startGame() {
    startMenu.style.display = "none";
    gameOverMenu.style.display = "none";
    victoryMenu.style.display = "none";
    gameContainer.style.display = "block";
    musicToggle.style.display = "inline-block";
    pauseButton.style.display = "inline-block";
    escapeButton.style.display = "inline-block";
    scoreDisplay.style.display = "block";
    score = 0;
    lives = 3;
    enemies = [];
    projectiles = [];
    spawnInterval = 3000;
    updateScore();
    updateLifeBar();
    backgroundMusic.play();
    scoreDisplay.textContent = "Score: 0";
    playerPosition = gameContainer.offsetWidth / 2;
    currentEggIndex = 0;
    lastTwoSpawns = [false, false];
    manageEnemySpawning();
    window.requestAnimationFrame(gameLoop);
    checkKeys();
  }

  function restartGame() {
    enemies.forEach((enemy) => gameContainer.removeChild(enemy.element));
    projectiles.forEach((projectile) =>
      gameContainer.removeChild(projectile.element)
    );
    enemies = [];
    projectiles = [];
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    startGame();
  }

  function togglePause() {
    gamePaused = !gamePaused;
    pauseButton.innerHTML = gamePaused
      ? '<img src="images/icons/play.png">'
      : '<img src="images/icons/pause.png">';
    if (gamePaused) {
      if (spawnIntervalId) clearInterval(spawnIntervalId);
      gameContainer.style.opacity = "0.5";
    } else {
      gameContainer.style.opacity = "1";
      manageEnemySpawning();
      window.requestAnimationFrame(gameLoop);
    }
  }

  function leaveGame() {
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    gameContainer.style.display = "none";
    startMenu.style.display = "flex";
    gameOverMenu.style.display = "none";
    victoryMenu.style.display = "none";
    musicToggle.style.display = "none";
    pauseButton.style.display = "none";
    escapeButton.style.display = "none";
    scoreDisplay.style.display = "none";
    backgroundMusic.pause();
  }

  function updateLifeBar() {
    lifeBar.style.width = `${(lives / 3) * 100}%`;
  }

  function loseLife(number = 1) {
    if (!isImmune) {
      lives -= number;
      updateLifeBar();
      isImmune = true;
      player.style.opacity = "0.5";

      setTimeout(() => {
        isImmune = false;
        player.style.opacity = "1";
      }, immunityDuration);

      if (lives <= 0) {
        gameOver();
      }
    }
  }

  function gameOver() {
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    gameContainer.style.display = "none";
    gameOverMenu.style.display = "flex";
    musicToggle.style.display = "none";
    pauseButton.style.display = "none";
    if (!backgroundMusic.paused) {
      const audio = new Audio("assets/sounds/game-over.mp3");
      audio.play();
    }
    backgroundMusic.pause();
  }

  function manageEnemySpawning() {
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(() => {
      if (!gamePaused) {
        spawnEnemy();
        if (spawnInterval > 1000) {
          spawnInterval -= 15;
        }
      }
    }, spawnInterval);
  }

  function spawnEnemy() {
    const enemy = document.createElement("div");
    enemy.classList.add("enemy");
    let isEasterEgg = false;

    if (
      currentEggIndex < easterEggs.length &&
      Math.random() < 0.12 &&
      !lastTwoSpawns.includes(true)
    ) {
      enemy.dataset.eggId = easterEggs[currentEggIndex].id;
      enemy.style.width = "50px";
      enemy.style.height = "50px";
      enemy.style.backgroundColor = "transparent";
      enemy.style.backgroundImage = "url('images/game/egg.png')";
      enemy.style.backgroundSize = "cover";
      enemy.style.backgroundPosition = "center";
      enemy.style.backgroundRepeat = "no-repeat";
      enemy.style.scale = "1";
      isEasterEgg = true;
    }

    const xPos = Math.random() * (gameContainer.offsetWidth - 40);
    enemy.style.left = `${xPos}px`;
    enemy.style.top = `0px`;
    gameContainer.appendChild(enemy);
    enemies.push({
      element: enemy,
      x: xPos,
      y: 0,
      eggId: enemy.dataset.eggId || null,
    });

    lastTwoSpawns.shift();
    lastTwoSpawns.push(isEasterEgg);
  }

  function shoot() {
    const currentTime = performance.now() / 1000;
    if (currentTime - lastShotTime < shootCooldown) return;
    lastShotTime = currentTime;
    const projectile = document.createElement("div");
    projectile.classList.add("projectile");
    projectile.style.left = `${
      playerPosition + player.offsetWidth / 2 - 2.5
    }px`;
    projectile.style.bottom = `${player.offsetHeight}px`;
    gameContainer.appendChild(projectile);
    const projectileBottomPosition =
      gameContainer.offsetHeight - player.offsetHeight;
    projectiles.push({
      element: projectile,
      x: playerPosition + player.offsetWidth / 2 - 2.5,
      y: projectileBottomPosition,
    });
  }

  function moveEnemies() {
    enemies.forEach((enemy, index) => {
      enemy.y += 3;
      if (enemy.y > gameContainer.offsetHeight) {
        gameContainer.removeChild(enemy.element);
        enemies.splice(index, 1);
        if (!enemy.eggId) {
          loseLife(0.5);
        }
      } else {
        enemy.element.style.top = `${enemy.y}px`;

        let proximityToGround = enemy.y / gameContainer.offsetHeight;
        if (proximityToGround > 0.7) {
          enemy.element.style.opacity = Math.abs(Math.sin((proximityToGround - 0.7) * 10 * Math.PI));
        }
      }
    });
  }

  function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
      projectile.y -= 5;
      if (
        gameContainer.offsetHeight - projectile.y >
        gameContainer.offsetHeight
      ) {
        gameContainer.removeChild(projectile.element);
        projectiles.splice(index, 1);
      } else {
        projectile.element.style.bottom = `${
          gameContainer.offsetHeight - projectile.y
        }px`;
      }
    });
  }

  function checkCollisions() {
    projectiles.forEach((projectile, pIndex) => {
      enemies.forEach((enemy, eIndex) => {
        if (
          projectile.x < enemy.x + 40 &&
          projectile.x + 5 > enemy.x &&
          projectile.y < enemy.y + 80 &&
          projectile.y + 20 > enemy.y
        ) {
          if (enemy.eggId) {
            collectEasterEgg(parseInt(enemy.eggId, 10));
          } else {
            score += 10;
            updateScore();
          }
          gameContainer.removeChild(enemy.element);
          enemies.splice(eIndex, 1);
          gameContainer.removeChild(projectile.element);
          projectiles.splice(pIndex, 1);
        }
      });
    });

    enemies.forEach((enemy) => {
      if (
        playerPosition < enemy.x + 40 &&
        playerPosition + player.offsetWidth > enemy.x &&
        gameContainer.offsetHeight - player.offsetHeight < enemy.y + 40
      ) {
        if (!enemy.eggId) {
          loseLife();
        }
      }
    });
  }

  function collectEasterEgg(eggId) {
    const egg = easterEggs.find((e) => e.id === eggId);
    if (egg && !egg.collected) {
      egg.collected = true;
      currentEggIndex++;
      const easterEggMessage = document.getElementById("easterEggMessage");
      easterEggMessage.textContent = egg.message;
      const easterEggImg = document.getElementById("easterEggImg");
      easterEggImg.src = egg.img;
      showPopup();
    }
  }

  function showPopup() {
    const popup = document.getElementById("easterEggPopup");
    popup.style.display = "flex";
    togglePause();
  }

  document.getElementById("closePopup").addEventListener("click", closePopup);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.getElementById("easterEggPopup").style.display === "flex") {
      closePopup();
    }
  });

  function closePopup() {
      document.getElementById("easterEggPopup").style.display = "none";
      if (easterEggs.every((egg) => egg.collected)) {
        gameContainer.style.display = "none";
        victoryMenu.style.display = "flex";
        musicToggle.style.display = "none";
        pauseButton.style.display = "none";
        if (!backgroundMusic.paused) {
          const audio = new Audio("assets/sounds/victory.mp3");
          audio.play();
        }
        backgroundMusic.pause();
      } else {
        togglePause();
      }
  }

  function updateScore() {
    scoreDisplay.textContent = "Score: " + score;
  
    scoreDisplay.classList.add('animate-score');
  
    setTimeout(() => {
      scoreDisplay.classList.remove('animate-score');
    }, 500);
  }

  function checkKeys() {
    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        togglePause();
      }
      if (e.key === "m") {
        toggleMusic();
      }
    });
  }

  function gameLoop(currentTime) {
    if (gamePaused) return;
    window.requestAnimationFrame(gameLoop);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1.2 / 60) return;
    lastRenderTime = currentTime;

    if (keysPressed["ArrowLeft"] && playerPosition > 0) {
      playerPosition -= 8;
      player.style.transform =
        "rotate(-2.5deg) translateX(-50%) translateY(-50%)";
    }
    if (
      keysPressed["ArrowRight"] &&
      playerPosition < gameContainer.offsetWidth - player.offsetWidth
    ) {
      playerPosition += 8;
      player.style.transform = "rotate(2.5deg) translateX(-50%) translateY(-50%)";
    }
    if (!keysPressed["ArrowLeft"] && !keysPressed["ArrowRight"]) {
      player.style.transform = "rotate(0deg) translateX(-50%) translateY(-50%)";
    }
    if (keysPressed[" "]) {
      if (document.activeElement == pauseButton) {
        pauseButton.blur();
      }
      if (document.activeElement == musicToggle) {
        musicToggle.blur();
      }
      shoot();
    }


    player.style.left = playerPosition + "px";

    moveEnemies();
    moveProjectiles();
    checkCollisions();
  }
});
