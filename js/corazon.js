const canvas = document.getElementById("lienzo");
const ctx = canvas.getContext("2d");
const poema = document.getElementById("poema");

// ====== CONFIGURA AQUÍ ======
const TEXTO = "I love you";
const SEGUNDOS_PARA_POEMA = 12;
const SEGUNDOS_POR_ESTROFA = 9;
const COLOR = "#ff6fae";
const BRILLO = "#ff1493";

const ESTROFAS = [
`Entraste en mi vida como un sol de primavera,
desarmando el invierno con un solo mirar,
y desde ese momento mi único lugar
es el refugio dulce que tu pecho me entrega.`,

`Amo el roce de tus manos cuando el día despierta,
la melodía clara que acompaña tu voz,
ese milagro eterno de sabernos los dos,
dejando el alma libre y el futuro a la vuelta.`,

`Eres el pensamiento que me habita constante,
la razón por la que el mundo se vuelve canción,
el latido que marca mi herida y mi pasión,
mi norte, mi destino y mi eterno habitante.`,

`No hay distancia ni tiempo que apague este fuego,
porque estás en mis ojos si te miro o te sueño,
de este amor tan inmenso me confieso tu dueño,
y a la vida, por siempre, por tenerte le ruego.`
];
// ============================

function ajustar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
ajustar();
window.addEventListener("resize", ajustar);

function puntoCorazon(t, r) {
    return {
        x: 16 * Math.pow(Math.sin(t), 3) * r,
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) -
             2 * Math.cos(3 * t) - Math.cos(4 * t)) * r
    };
}

// ---- Letras pre-dibujadas (con brillo) para que el teléfono no se trabe ----
const TAMANOS = [8, 10, 12, 14, 16, 18];
const sprites = {};

function crearSprite(texto, tam) {
    const c = document.createElement("canvas");
    const g = c.getContext("2d");
    g.font = `${tam}px Arial`;
    const ancho = Math.ceil(g.measureText(texto).width);
    const pad = 12;
    c.width = ancho + pad * 2;
    c.height = tam + pad * 2;
    g.font = `${tam}px Arial`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = COLOR;
    g.shadowColor = BRILLO;
    g.shadowBlur = 8;
    g.fillText(texto, c.width / 2, c.height / 2);
    return c;
}

for (const tam of TAMANOS) {
    sprites[tam + "n"] = crearSprite(TEXTO, tam);
    sprites[tam + "m"] = crearSprite(TEXTO.toUpperCase(), tam);
}

function tamanoCercano(t) {
    let mejor = TAMANOS[0];
    for (const x of TAMANOS) {
        if (Math.abs(x - t) < Math.abs(mejor - t)) mejor = x;
    }
    return mejor;
}

// ---- Partículas (menos en pantallas pequeñas) ----
const esMovil = Math.min(window.innerWidth, window.innerHeight) < 700;
const cantidad = esMovil ? 0.6 : 1;

const anillos = [
    { k: 1.00, n: 120, op: 1.0 },
    { k: 0.84, n: 95,  op: 0.85 },
    { k: 0.68, n: 75,  op: 0.7 },
    { k: 0.52, n: 55,  op: 0.6 },
    { k: 0.36, n: 35,  op: 0.5 },
    { k: 0.20, n: 18,  op: 0.4 }
];

const particulas = [];
for (const a of anillos) {
    const n = Math.round(a.n * cantidad);
    for (let i = 0; i < n; i++) {
        const tam = tamanoCercano(8 + Math.random() * 4 + a.k * 3);
        const mayus = Math.random() > 0.65;
        particulas.push({
            t: (i / n) * Math.PI * 2 + Math.random() * 0.05,
            k: a.k,
            sprite: sprites[tam + (mayus ? "m" : "n")],
            fase: Math.random() * Math.PI * 2,
            vel: 0.6 + Math.random() * 1.0,
            op: a.op * (0.65 + Math.random() * 0.35),
            ix: Math.random(),
            iy: Math.random()
        });
    }
}

let tiempo = 0;
let ultimo = 0;

function dibujar(ahora) {
    // Velocidad constante sin importar qué tan rápido sea el teléfono
    const dt = ultimo ? Math.min((ahora - ultimo) / 1000, 0.05) : 0.016;
    ultimo = ahora;
    tiempo += dt;

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vertical = canvas.height > canvas.width;
    let escala, cy;

    if (vertical) {
        escala = Math.min(canvas.width / 36, (canvas.height * 0.42) / 29);
        cy = canvas.height * 0.30;
    } else {
        escala = Math.min(canvas.width / 36, canvas.height / 28);
        cy = canvas.height / 2;
    }

    const factorLetra = Math.max(0.6, Math.min(1.2, escala / 17));
    const latido = 1 + Math.sin(tiempo * 3) * 0.035;
    const cx = canvas.width / 2;

    const progreso = Math.min(1, tiempo / 3.5);
    const suave = 1 - Math.pow(1 - progreso, 3);

    for (const p of particulas) {
        const base = puntoCorazon(p.t, escala * latido);
        const flotarX = Math.sin(tiempo * p.vel + p.fase) * 3;
        const flotarY = Math.cos(tiempo * p.vel + p.fase) * 3;

        const destX = cx + base.x * p.k + flotarX;
        const destY = cy + base.y * p.k + flotarY - escala * 2.5;

        const x = p.ix * canvas.width + (destX - p.ix * canvas.width) * suave;
        const y = p.iy * canvas.height + (destY - p.iy * canvas.height) * suave;

        const brillo = 0.5 + 0.5 * Math.sin(tiempo * 2 + p.fase);
        ctx.globalAlpha = p.op * (0.5 + brillo * 0.5);

        const w = p.sprite.width * factorLetra;
        const h = p.sprite.height * factorLetra;
        ctx.drawImage(p.sprite, x - w / 2, y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(dibujar);
}

requestAnimationFrame(dibujar);

// ====== POEMA, ESTROFA POR ESTROFA ======
function mostrarEstrofa(i) {
    poema.textContent = ESTROFAS[i];
    poema.classList.add("visible");

    if (i < ESTROFAS.length - 1) {
        setTimeout(() => {
            poema.classList.remove("visible");
            setTimeout(() => mostrarEstrofa(i + 1), 1800);
        }, SEGUNDOS_POR_ESTROFA * 1000);
    }
}

setTimeout(() => {
    if (canvas.height <= canvas.width) {
        canvas.classList.add("tenue");
    }
    mostrarEstrofa(0);
}, SEGUNDOS_PARA_POEMA * 1000);