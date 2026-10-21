// Obtención de elementos del DOM
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scoreValEl = document.getElementById("scoreVal");
const speedLevelEl = document.getElementById("speedLevel");
const btnReset = document.getElementById("btnReset");

// Redimensionar Canvas al contenedor
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth - 20;
    canvas.height = canvas.parentElement.clientHeight - 20;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Precarga de Imágenes
const bgImage = new Image();
bgImage.src = "oficina.png";

const characterSources = [
    "fredy.png",
    "bonnie.png",
    "foxy.png",
    "chica.png"
];

const characterImages = characterSources.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Variables globales de la simulación
let score = 0;
let speedFactor = 1.0;
const TOTAL_OBJECTS = 25; // Requerimiento: Siempre 25 objetos
let characters = [];

// Constantes Físicas
const GRAVITY = 0.25;
const BOUNCE_DAMPING = 0.65; // Factor de pérdida de energía al rebotar

// Clase Character (Objeto presionable con tamaño variable y formato rectangular)
class Character {
    constructor(id) {
        this.id = id;
        this.resetPosition(true);
    }

    resetPosition(initial = false) {
        // Seleccionar aleatoriamente una de las 4 imágenes
        this.imageIndex = Math.floor(Math.random() * characterImages.length);
        
        // VARIACIÓN DE TAMAÑO: Genera dimensiones aleatorias entre 35px y 75px
        this.size = Math.random() * 40 + 35;
        this.radius = this.size / 2; // Radio para el área de detección del clic
        
        this.posX = Math.random() * (canvas.width - this.size) + this.radius;
        this.posY = initial ? -Math.random() * canvas.height * 0.8 : -this.size * 2;
        
        // Velocidad parabólica
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = Math.random() * 1.5 + 0.5;
        
        this.bounces = 0;
    }

    // Dibujar la imagen rectangular tal como es el archivo original
    draw(context) {
        const img = characterImages[this.imageIndex];
        
        context.save();
        
        if (img.complete && img.naturalWidth !== 0) {
            // Renderizado directo de la imagen en formato rectangular completo
            context.drawImage(
                img, 
                this.posX - this.radius, 
                this.posY - this.radius, 
                this.size, 
                this.size
            );
        } else {
            // Respaldar con un recuadro si la imagen aún no carga
            context.fillStyle = "#FF0000";
            context.fillRect(
                this.posX - this.radius, 
                this.posY - this.radius, 
                this.size, 
                this.size
            );
        }

        context.restore();
    }

    // Actualización de física (Caída libre y rebotes)
    update(context) {
        this.vy += GRAVITY * speedFactor;

        this.posX += this.vx * speedFactor;
        this.posY += this.vy;

        // Rebote en paredes laterales
        if (this.posX + this.radius > canvas.width || this.posX - this.radius < 0) {
            this.vx = -this.vx;
        }

        // Rebote en el suelo de la oficina
        if (this.posY + this.radius >= canvas.height) {
            this.posY = canvas.height - this.radius;
            this.vy = -this.vy * BOUNCE_DAMPING; // Perder fuerza
            this.vx *= 0.85; // Fricción
            this.bounces++;

            // Reaparecer arriba si pierde velocidad
            if (Math.abs(this.vy) < 1.5 || this.bounces > 5) {
                this.resetPosition();
            }
        }

        this.draw(context);
    }

    // Detección de clic (mouseX, mouseY) considerando el tamaño actual
    isClicked(mouseX, mouseY) {
        let dx = mouseX - this.posX;
        let dy = mouseY - this.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.radius * 1.2;
    }
}

// Inicialización de la partida
function initGame() {
    score = 0;
    speedFactor = 1.0;
    scoreValEl.textContent = score;
    updateSpeedRules();

    characters = [];
    for (let i = 0; i < TOTAL_OBJECTS; i++) {
        characters.push(new Character(i + 1));
    }
}

// Reglas de velocidad progresiva según la puntuación
function updateSpeedRules() {
    if (score > 20) {
        speedFactor = 2.2;
        speedLevelEl.textContent = "Alta (> 20 elim.)";
        speedLevelEl.className = "badge bg-danger fs-6 mt-1";
    } else if (score > 10) {
        speedFactor = 1.5;
        speedLevelEl.textContent = "Media (> 10 elim.)";
        speedLevelEl.className = "badge bg-warning text-dark fs-6 mt-1";
    } else {
        speedFactor = 1.0;
        speedLevelEl.textContent = "Normal (1.0x)";
        speedLevelEl.className = "badge bg-success fs-6 mt-1";
    }
}

// Evento de clic izquierdo del mouse
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = characters.length - 1; i >= 0; i--) {
        if (characters[i].isClicked(mouseX, mouseY)) {
            // Reaparecer en la parte superior con un nuevo tamaño dinámico
            characters[i].resetPosition();

            // Incrementar puntuación
            score++;
            scoreValEl.textContent = score;

            updateSpeedRules();
            break;
        }
    }
});

// Bucle de animación
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar imagen de fondo (oficina.png)
    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Actualizar y renderizar los 25 animatrónicos
    characters.forEach(char => {
        char.update(ctx);
    });

    requestAnimationFrame(animate);
}

// Botón de Reiniciar
btnReset.addEventListener("click", () => {
    initGame();
});

// Iniciar aplicación
initGame();
animate();