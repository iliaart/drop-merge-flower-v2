// Input Module — canvas resize, mouse/touch input, coordinate conversion
import { state } from './state.js';
import { CONFIG } from './config.js';
import { dropFlower } from './game.js';

const { GW, GH } = CONFIG;

/** Resize canvas to fit viewport while maintaining game aspect ratio */
export function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const gameAspect = GW / GH;
    const viewAspect = vw / vh;

    let cw, ch;
    if (viewAspect > gameAspect) {
        ch = vh;
        cw = ch * gameAspect;
    } else {
        cw = vw;
        ch = cw / gameAspect;
    }

    state.canvas.style.width = cw + 'px';
    state.canvas.style.height = ch + 'px';
    state.canvas.width = GW * dpr;
    state.canvas.height = GH * dpr;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.canvasScale = cw / GW;
    state.canvasOffsetX = (vw - cw) / 2;
    state.canvasOffsetY = (vh - ch) / 2;
    state.canvas.style.position = 'absolute';
    state.canvas.style.left = state.canvasOffsetX + 'px';
    state.canvas.style.top = state.canvasOffsetY + 'px';
}

/** Convert screen coordinates to game coordinates */
export function screenToGame(sx, sy) {
    return {
        x: (sx - state.canvasOffsetX) / state.canvasScale,
        y: (sy - state.canvasOffsetY) / state.canvasScale,
    };
}

/** Set up all input event listeners */
export function setupInput() {
    state.canvas.addEventListener('mousemove', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.mouseX = p.x;
    });

    state.canvas.addEventListener('click', e => {
        state.audio.ensure();
        dropFlower();
    });

    state.canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        state.audio.ensure();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
    }, { passive: false });

    state.canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
    }, { passive: false });

    state.canvas.addEventListener('touchend', e => {
        e.preventDefault();
        dropFlower();
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
}
