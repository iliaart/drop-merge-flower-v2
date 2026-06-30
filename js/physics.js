// Physics Module — Matter.js initialization, collision handling, forces
import { state } from './state.js';
import { CONFIG } from './config.js';
// Remove import of getAllFlowers, import only getAllFlowersWithGenerated from random-flowers
import { getAllFlowersWithGenerated } from './random-flowers.js';

const { VASE, GW, GH, GRAVITY_DENSITY_FACTOR, VIBRATION_STRENGTH, VIBRATION_RADIUS, MERGE_RADIUS_BONUS } = CONFIG;

/** Initialize Matter.js physics world with walls */
export function initPhysics() {
    const { Engine, World, Bodies, Events } = state.Matter;

    state.engine = Engine.create({ gravity: { x: 0, y: CONFIG.GRAVITY } });
    state.world = state.engine.world;

    const wallOpts = { isStatic: true, friction: .4, restitution: .2, render: { fillStyle: 'transparent', strokeStyle: 'transparent', visible: false } }; // Указал полную прозрачность
    const thick = 40; // Увеличил толщину стен для предотвращения проникновения цветов
    // Vase walls - убираю переднюю стенку (верхнюю), оставляю только боковые и нижнюю
    state.walls.push(Bodies.rectangle(VASE.l - thick / 2, (VASE.t + VASE.b) / 2, thick, VASE.b - VASE.t + thick * 2, wallOpts)); // левая стенка
    state.walls.push(Bodies.rectangle(VASE.r + thick / 2, (VASE.t + VASE.b) / 2, thick, VASE.b - VASE.t + thick * 2, wallOpts)); // правая стенка
    state.walls.push(Bodies.rectangle((VASE.l + VASE.r) / 2, VASE.b + thick / 2, VASE.r - VASE.l + thick * 2, thick, wallOpts)); // нижняя стенка
    // Убраны все стенки вазы, кроме боковых и нижней
    // Screen boundary walls — flowers bounce off iframe edges (оставляю боковые и нижнюю границы экрана, убираю верхнюю)
    // state.walls.push(Bodies.rectangle(GW / 2, -thick / 2, GW + thick * 2, thick, wallOpts));                          // убрана верхняя граница экрана
    state.walls.push(Bodies.rectangle(-thick / 2, GH / 2, thick, GH + thick * 2, wallOpts));                           // left
    state.walls.push(Bodies.rectangle(GW + thick / 2, GH / 2, thick, GH + thick * 2, wallOpts));                       // right
    state.walls.push(Bodies.rectangle(GW / 2, GH + thick / 2, GW, thick, wallOpts));                                  // bottom screen boundary
    Matter.World.add(state.world, state.walls);

    Events.on(state.engine, 'collisionStart', onCollision);
}

/** Handle collision events — merging + repulsion */
function onCollision(event) {
    if (state.gameState !== 'playing') return;
    const allFlowers = getAllFlowersWithGenerated();

    // Phase 1: merge same-level flowers
    event.pairs.forEach(pair => {
        const a = pair.bodyA, b = pair.bodyB;
        if (a.flowerIdx === undefined || b.flowerIdx === undefined) return;
        if (state.mergingSet.has(a.id) || state.mergingSet.has(b.id)) return;
        const fa = state.flowers[a.flowerIdx], fb = state.flowers[b.flowerIdx];
        if (!fa || !fb || fa.level !== fb.level) return;
        if (fa.level >= allFlowers.length - 1) return;
        // justSpawned intentionally NOT checked — merged flowers should be able to
        // re-merge immediately for Suika-style cascades; mergingSet prevents double merges.

        if (typeof window.performMerge === 'function') {
            window.performMerge(fa, fb, a.flowerIdx, b.flowerIdx);
        }
    });

    // Phase 2: smooth repulsion for non-merging flower collisions
    event.pairs.forEach(pair => {
        const a = pair.bodyA, b = pair.bodyB;
        if (a.flowerIdx === undefined || b.flowerIdx === undefined) return;
        if (state.mergingSet.has(a.id) || state.mergingSet.has(b.id)) return;
        const fa = state.flowers[a.flowerIdx], fb = state.flowers[b.flowerIdx];
        if (!fa || !fb || fa.level === fb.level) return;
        // Note: spawning flag intentionally NOT checked for repulsion either
        // justSpawned kept here for repulsion to avoid pushing freshly merged flowers
        if (fa.justSpawned || fb.justSpawned) return;
        
        // Get the actual collision radius for each flower (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const flowerBData = allFlowers[fb.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        const radiusB = flowerBData.flowerType === 'orchid' ? flowerBData.radius * 0.5 : flowerBData.radius;
        
        applyRepulsionWithRadii(a, b, fa, fb, radiusA, radiusB);
    });
}

function applyRepulsionWithRadii(a, b, fa, fb, radiusA, radiusB) {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = radiusA + radiusB;

    if (dist >= minDist || dist <= 0.01) return;

    const overlap = (minDist - dist) / minDist;
    const absoluteOverlap = minDist - dist;

    // Skip repulsion for micro-overlaps (< 2 pixels) to prevent jitter
    if (absoluteOverlap < 2) {
        fa.isInContact = true;
        fb.isInContact = true;
        return;
    }

    const dampingA = 1 - fa.repulsionDamping;
    const dampingB = 1 - fb.repulsionDamping;
    const avgDamping = (dampingA + dampingB) / 2;
    const nx = dx / dist;
    const ny = dy / dist;

    const sharpOverlap = Math.pow(overlap, 2);
    let repulsionStrength = Math.min(sharpOverlap * 0.35 * avgDamping, 0.5);

    state.Matter.Body.applyForce(a, a.position, { x: -nx * repulsionStrength, y: -ny * repulsionStrength });
    state.Matter.Body.applyForce(b, b.position, { x: nx * repulsionStrength, y: ny * repulsionStrength });

    const maxPushVelocity = Math.min(absoluteOverlap * 0.3, 2.0);
    capVelocity(a, fa, maxPushVelocity);
    capVelocity(b, fb, maxPushVelocity);

    fa.isInContact = true;
    fb.isInContact = true;

    // Synchronized collider stop for resonance
    const speedA = Math.sqrt(a.velocity.x ** 2 + a.velocity.y ** 2);
    const speedB = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
    const angSpeedDiff = Math.abs(Math.abs(a.angularVelocity) - Math.abs(b.angularVelocity));
    const speedDiff = Math.abs(speedA - speedB);

    if (speedDiff < 0.1 && angSpeedDiff < 0.002 && speedA < 0.3 && speedB < 0.3) {
        if (!fa.isForcedStopped && !fb.isForcedStopped) {
            state.Matter.Body.setVelocity(a, { x: 0, y: 0 });
            state.Matter.Body.setVelocity(b, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(a, 0);
            state.Matter.Body.setAngularVelocity(b, 0);
            fa.isForcedStopped = true;
            fb.isForcedStopped = true;
            fa.stopTimer = 0.4;
            fb.stopTimer = 0.4;
            fa.repulsionDamping = 0;
            fb.repulsionDamping = 0;
        }
    }
    // Aggressive angular damping during collision
    state.Matter.Body.setAngularVelocity(a, a.angularVelocity * 0.7);
    state.Matter.Body.setAngularVelocity(b, b.angularVelocity * 0.7);
}

function capVelocity(body, flower, maxV) {
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    if (speed > maxV) {
        const scale = maxV / speed;
        state.Matter.Body.setVelocity(body, { x: body.velocity.x * scale * 0.6, y: body.velocity.y * scale * 0.6 });
    } else {
        state.Matter.Body.setVelocity(body, { x: body.velocity.x * 0.6, y: body.velocity.y * 0.6 });
    }
}

/** Apply per-frame gravity scale + vibration + resonance damping */
export function applyForces(dt) {
    const allFlowers = getAllFlowersWithGenerated();
    // Calculate average radius considering orchid size reduction
    let totalRadius = 0;
    let count = 0;
    for (let i = 0; i < Math.min(8, allFlowers.length); i++) { // Sample first 8 flowers
        const flowerRadius = allFlowers[i].flowerType === 'orchid' ? allFlowers[i].radius * 0.5 : allFlowers[i].radius;
        totalRadius += flowerRadius;
        count++;
    }
    const avgRadius = count > 0 ? totalRadius / count : 40;

    for (const f of state.flowers) {
        if (!f) continue;
        const body = f.body;
        const flowerData = allFlowers[f.level];
        const flowerRadius = flowerData.flowerType === 'orchid' ? flowerData.radius * 0.5 : flowerData.radius;

        // Density-based gravity
        const densityModifier = 1 + (flowerRadius - avgRadius) * GRAVITY_DENSITY_FACTOR / avgRadius;
        body.gravityScale = densityModifier;

        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        const angSpeed = Math.abs(body.angularVelocity);
        const currentEnergy = speed * speed + angSpeed * angSpeed * 100;
        f.vibrationEnergy = f.vibrationEnergy * 0.9 + currentEnergy * 0.1;

        updateResonance(f, body, dt, speed, angSpeed);
        f.isInContact = false;

        // Vibration buoyancy for light flowers
        if (flowerRadius < avgRadius * 0.8) {
            applyVibrationBuoyancy(f, body, flowerRadius, avgRadius);
        }
    }
}

function updateResonance(f, body, dt, speed, angSpeed) {
    if (f.isForcedStopped) {
        f.stopTimer -= dt;
        if (f.stopTimer <= 0) {
            f.isForcedStopped = false;
            f.stopTimer = 0;
            f.repulsionDamping = 0;
            f.resonanceTimer = 0;
            f.vibrationEnergy = 0;
        } else {
            state.Matter.Body.setVelocity(body, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(body, 0);
        }
    } else if (f.isInContact && f.vibrationEnergy < 0.15 && speed < 0.3 && angSpeed < 0.004) {
        f.resonanceTimer += dt;
        if (f.resonanceTimer > 0.25) {
            state.Matter.Body.setVelocity(body, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(body, 0);
            f.isForcedStopped = true;
            f.stopTimer = 0.5;
            f.repulsionDamping = 0;
            f.resonanceTimer = 0;
            f.vibrationEnergy = 0;
        }
    } else if (speed > 0.5 || angSpeed > 0.01) {
        f.resonanceTimer = Math.max(0, f.resonanceTimer - dt * 2);
        f.vibrationEnergy = f.vibrationEnergy * 0.95;
    } else if (speed < 0.2625 && angSpeed < 0.0035) {
        state.Matter.Body.setVelocity(body, { x: 0, y: 0 });
        state.Matter.Body.setAngularVelocity(body, 0);
        f.repulsionDamping = Math.max(f.repulsionDamping - 0.175, 0);
        f.resonanceTimer = 0;
        f.vibrationEnergy = 0;
    } else {
        f.repulsionDamping = Math.max(f.repulsionDamping - 0.0875, 0);
        f.resonanceTimer = Math.max(0, f.resonanceTimer - dt);
    }
}

function applyVibrationBuoyancy(f, body, flowerRadius, avgRadius) {
    let vibrationForce = 0;
    for (const other of state.flowers) {
        if (!other || other === f) continue;
        const otherSpeed = Math.sqrt(other.body.velocity.x ** 2 + other.body.velocity.y ** 2);
        if (otherSpeed > 2) {
            const dx = body.position.x - other.body.position.x;
            const dy = body.position.y - other.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < VIBRATION_RADIUS && dist > 0) {
                vibrationForce += otherSpeed * 0.01 * (1 - dist / VIBRATION_RADIUS);
            }
        }
    }
    if (vibrationForce > 0) {
        const lightnessFactor = 1 - (flowerRadius / (avgRadius * 0.8));
        const upwardForce = vibrationForce * VIBRATION_STRENGTH * lightnessFactor;
        state.Matter.Body.applyForce(body, body.position, { x: 0, y: -upwardForce });
    }
}

/** Angular velocity management — smooth rotation, damping, limits */
export function updateAngularVelocity(f) {
    const body = f.body;
    const currentAngVel = body.angularVelocity;
    const angVelThreshold = 0.002;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

    if (Math.abs(currentAngVel) < angVelThreshold && speed > 0.5) {
        state.Matter.Body.setAngularVelocity(body, body.velocity.x * 0.001);
    }
    if (Math.abs(currentAngVel) > angVelThreshold) {
        state.Matter.Body.setAngularVelocity(body, currentAngVel * 0.97);
    } else if (speed < 0.5) {
        state.Matter.Body.setAngularVelocity(body, 0);
    }
    const maxAngularVel = 0.08;
    if (Math.abs(currentAngVel) > maxAngularVel) {
        state.Matter.Body.setAngularVelocity(body, Math.sign(currentAngVel) * maxAngularVel);
    }
}