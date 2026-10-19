// Obtener el canvas y su contexto de dibujo
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Dimensiones de la pantalla actual
const window_height = window.innerHeight;
const window_width = window.innerWidth;
canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#ff8";

class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;           // Color base asignado
        this.currentColor = color;    // Color con el que se dibuja actualmente
        this.text = text;
        this.speed = speed;
        this.isColliding = false;     // Estado de colisión en el frame actual
        
        // Dirección de movimiento aleatoria
        let angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    draw(context) {
        context.beginPath();
        // Si está en colisión se pinta azul (#0000FF), de lo contrario usa su color original
        context.strokeStyle = this.isColliding ? "#0000FF" : this.color;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px Arial";
        context.fillText(this.text, this.posX, this.posY);
        context.lineWidth = 2;
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
        context.stroke();
        context.closePath();
    }

    update(context) {
        this.draw(context);

        // Movimiento
        this.posX += this.dx;
        this.posY += this.dy;

        // Rebote con los bordes de la pantalla (Eje X)
        if (this.posX + this.radius > window_width) {
            this.posX = window_width - this.radius;
            this.dx = -this.dx;
        } else if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = -this.dx;
        }

        // Rebote con los bordes de la pantalla (Eje Y)
        if (this.posY + this.radius > window_height) {
            this.posY = window_height - this.radius;
            this.dy = -this.dy;
        } else if (this.posY - this.radius < 0) {
            this.posY = this.radius;
            this.dy = -this.dy;
        }
    }

    // Inciso A: Comprobar si hay intersección entre dos círculos
    isCollidingWith(otherCircle) {
        let dx = otherCircle.posX - this.posX;
        let dy = otherCircle.posY - this.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.radius + otherCircle.radius);
    }

    // Inciso C: Resolver física de rebote y separación de cuerpos
    resolveCollision(otherCircle) {
        let dx = otherCircle.posX - this.posX;
        let dy = otherCircle.posY - this.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            distance = 0.1;
            dx = 0.1;
            dy = 0;
        }

        // Cantidad de solapamiento
        let overlap = (this.radius + otherCircle.radius) - distance;

        if (overlap > 0) {
            // Vector unitario de dirección
            let nx = dx / distance;
            let ny = dy / distance;

            // 1. Separar físicamente para evitar que se queden encimados o trabados
            this.posX -= nx * (overlap / 2);
            this.posY -= ny * (overlap / 2);
            otherCircle.posX += nx * (overlap / 2);
            otherCircle.posY += ny * (overlap / 2);

            // 2. Recalcular físicas de rebote en dirección opuesta
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

// Generar 20 círculos sin solapamiento inicial
function generateCircles(n) {
    circles = [];
    for (let i = 0; i < n; i++) {
        let radius = Math.random() * 25 + 20; // Radio entre 20 y 45
        let speed = Math.random() * 4 + 1;    // Velocidad entre 1 y 5
        let text = `C${i + 1}`;
        let color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        let x, y, overlapping;
        let attempts = 0;

        do {
            overlapping = false;
            x = Math.random() * (window_width - radius * 2) + radius;
            y = Math.random() * (window_height - radius * 2) + radius;

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

// Bucle de animación en tiempo real
function animate() {
    ctx.clearRect(0, 0, window_width, window_height);

    // 1. Reiniciar estado de colisión de todos los círculos antes de verificar
    circles.forEach(circle => {
        circle.isColliding = false;
    });

    // 2. Evaluar colisiones y marcar el flasheo en azul
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            if (circles[i].isCollidingWith(circles[j])) {
                // Marcar ambos círculos como colisionados para cambiar a azul
                circles[i].isColliding = true;
                circles[j].isColliding = true;

                // Aplicar la respuesta de física y rebote
                circles[i].resolveCollision(circles[j]);
            }
        }
    }

    // 3. Dibujar y actualizar las posiciones
    circles.forEach(circle => {
        circle.update(ctx);
    });

    requestAnimationFrame(animate);
}

// Inicialización
generateCircles(20);
animate();