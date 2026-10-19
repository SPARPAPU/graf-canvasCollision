// Elementos del DOM
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const speedInput = document.getElementById("speedRange");
const speedVal = document.getElementById("speedVal");
const flashInput = document.getElementById("flashDuration");
const flashVal = document.getElementById("flashVal");
const circleInput = document.getElementById("circleCount");
const circleVal = document.getElementById("circleVal");
const collisionCountEl = document.getElementById("collisionCount");
const btnPause = document.getElementById("btnPause");
const btnReset = document.getElementById("btnReset");

// Redimensionar Canvas
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth - 30;
    canvas.height = canvas.parentElement.clientHeight - 30;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Variables globales de estado
let isPaused = false;
let totalCollisions = 0;
let flashFrames = parseInt(flashInput.value);
let speedMultiplier = parseFloat(speedInput.value);

// Clase Circle en Orientación a Objetos (POO)
class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.text = text;
        this.baseSpeed = speed;
        this.collisionTimer = 0;

        let angle = Math.random() * Math.PI * 2;
        this.dirX = Math.cos(angle);
        this.dirY = Math.sin(angle);
        
        this.dx = this.dirX * this.baseSpeed;
        this.dy = this.dirY * this.baseSpeed;
    }

    draw(context) {
        context.beginPath();
        // Flasheo azul (#0000FF) mientras dure el temporizador de colisión
        context.strokeStyle = (this.collisionTimer > 0) ? "#0000FF" : this.color;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 16px Arial";
        context.fillText(this.text, this.posX, this.posY);
        context.lineWidth = 3;
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
        context.stroke();
        context.closePath();
    }

    update(context) {
        if (this.collisionTimer > 0) {
            this.collisionTimer--;
        }

        this.draw(context);

        // Movimiento según el factor de velocidad
        this.posX += this.dx * speedMultiplier;
        this.posY += this.dy * speedMultiplier;

        // Rebotes en los bordes
        if (this.posX + this.radius > canvas.width) {
            this.posX = canvas.width - this.radius;
            this.dx = -Math.abs(this.dx);
        } else if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        if (this.posY + this.radius > canvas.height) {
            this.posY = canvas.height - this.radius;
            this.dy = -Math.abs(this.dy);
        } else if (this.posY - this.radius < 0) {
            this.posY = this.radius;
            this.dy = Math.abs(this.dy);
        }
    }

    // Distancia entre centros
    isCollidingWith(otherCircle) {
        let dx = otherCircle.posX - this.posX;
        let dy = otherCircle.posY - this.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.radius + otherCircle.radius);
    }

    // Separación física y vectores de rebote
    resolveCollision(otherCircle) {
        let dx = otherCircle.posX - this.posX;
        let dy = otherCircle.posY - this.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            distance = 0.1;
            dx = 0.1;
            dy = 0;
        }

        let overlap = (this.radius + otherCircle.radius) - distance;

        if (overlap > 0) {
            let nx = dx / distance;
            let ny = dy / distance;

            // Separación física para evitar solapamiento
            this.posX -= nx * (overlap / 2);
            this.posY -= ny * (overlap / 2);
            otherCircle.posX += nx * (overlap / 2);
            otherCircle.posY += ny * (overlap / 2);

            // Inversión y cálculo de vectores
            let kx = this.dx - otherCircle.dx;
            let ky = this.dy - otherCircle.dy;
            let p = 2 * (nx * kx + ny * ky) / 2;

            this.dx -= p * nx;
            this.dy -= p * ny;
            otherCircle.dx += p * nx;
            otherCircle.dy += p * ny;
        }
    }
}

let circles = [];

function generateCircles(n) {
    circles = [];
    totalCollisions = 0;
    collisionCountEl.textContent = totalCollisions;

    for (let i = 0; i < n; i++) {
        let radius = Math.random() * 20 + 18;
        let speed = Math.random() * 3 + 1;
        let text = `C${i + 1}`;
        let color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        let x, y, overlapping;
        let attempts = 0;

        do {
            overlapping = false;
            x = Math.random() * (canvas.width - radius * 2) + radius;
            y = Math.random() * (canvas.height - radius * 2) + radius;

            for (let j = 0; j < circles.length; j++) {
                let dx = circles[j].posX - x;
                let dy = circles[j].posY - y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius + circles[j].radius) {
                    overlapping = true;
                    break;
                }
            }
            attempts++;
        } while (overlapping && attempts < 200);

        circles.push(new Circle(x, y, radius, color, text, speed));
    }
}

// Bucle de animación
function animate() {
    if (!isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                if (circles[i].isCollidingWith(circles[j])) {
                    circles[i].collisionTimer = flashFrames;
                    circles[j].collisionTimer = flashFrames;

                    circles[i].resolveCollision(circles[j]);

                    totalCollisions++;
                    collisionCountEl.textContent = totalCollisions;
                }
            }
        }

        circles.forEach(circle => circle.update(ctx));
    }

    requestAnimationFrame(animate);
}

// Controladores de eventos de la interfaz
speedInput.addEventListener("input", (e) => {
    speedMultiplier = parseFloat(e.target.value);
    speedVal.textContent = `${speedMultiplier.toFixed(1)}x`;
});

flashInput.addEventListener("input", (e) => {
    flashFrames = parseInt(e.target.value);
    flashVal.textContent = flashFrames;
});

circleInput.addEventListener("input", (e) => {
    circleVal.textContent = e.target.value;
    generateCircles(parseInt(e.target.value));
});

btnPause.addEventListener("click", () => {
    isPaused = !isPaused;
    btnPause.innerHTML = isPaused ? 
        '<i class="fa-solid fa-play me-2"></i>Reanudar' : 
        '<i class="fa-solid fa-pause me-2"></i>Pausar';
    btnPause.classList.toggle("btn-warning");
    btnPause.classList.toggle("btn-success");
});

btnReset.addEventListener("click", () => {
    generateCircles(parseInt(circleInput.value));
});

// Inicialización
generateCircles(20);
animate();