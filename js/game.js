const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let track, player, ais = [];
let dt = 1/60;
let lastTime = 0;
let gameState = 'MENU'; // MENU, RACE, FINISHED
let raceState = ''; 
let camera = { x: 0, y: 1000, z: 0, depth: 0.84 };

const CHASSIS_DATA = [
    {
        name: 'Neon-X',
        skins: [
            { name: 'Skin 1 (Azul Ciano)', colors: ['#001133', '#00ffff'] },
            { name: 'Skin 2 (Laranja Choque)', colors: ['#331100', '#ff6600'] },
            { name: 'Skin 3 (Fibra de Carbono)', colors: ['#222222', '#00ffcc'] }
        ]
    },
    {
        name: 'Apex-V',
        skins: [
            { name: 'Skin 1 (Vermelho Escarlate)', colors: ['#330000', '#ff0000'] },
            { name: 'Skin 2 (Verde Limão)', colors: ['#002200', '#ccff00'] },
            { name: 'Skin 3 (Camuflado Digital)', colors: ['#334422', '#667744'] }
        ]
    },
    {
        name: 'Quantum',
        skins: [
            { name: 'Skin 1 (Roxo Ultravioleta)', colors: ['#220033', '#cc00ff'] },
            { name: 'Skin 2 (Branco Perolado)', colors: ['#888888', '#ffffff'] },
            { name: 'Skin 3 (Dourado Cromado)', colors: ['#443300', '#ffcc00'] }
        ]
    }
];

const Sprites = {
    cache: {},
    generateShip: function(chassisIndex, skinIndex) {
        const key = `${chassisIndex}_${skinIndex}`;
        if (this.cache[key]) return this.cache[key];
        
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        const data = CHASSIS_DATA[chassisIndex].skins[skinIndex];
        const colorPrimary = data.colors[0];
        const colorSecondary = data.colors[1];
        
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        
        if (chassisIndex === 0) { // Neon-X
            ctx.fillStyle = colorPrimary;
            ctx.beginPath();
            ctx.moveTo(100, 20); 
            ctx.lineTo(180, 80); 
            ctx.lineTo(150, 90);
            ctx.lineTo(100, 70); 
            ctx.lineTo(50, 90);
            ctx.lineTo(20, 80); 
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = colorSecondary;
            ctx.beginPath();
            ctx.moveTo(100, 30);
            ctx.lineTo(120, 60);
            ctx.lineTo(80, 60);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = colorSecondary;
            ctx.strokeStyle = colorSecondary;
            ctx.stroke();
            
        } else if (chassisIndex === 1) { // Apex-V
            ctx.fillStyle = colorPrimary;
            ctx.fillRect(60, 30, 80, 50);
            ctx.beginPath();
            ctx.moveTo(60, 30);
            ctx.lineTo(100, 10);
            ctx.lineTo(140, 30);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = colorSecondary;
            ctx.fillRect(75, 40, 50, 20);
            
            ctx.fillStyle = '#111';
            ctx.fillRect(50, 60, 20, 30);
            ctx.fillRect(130, 60, 20, 30);
        } else if (chassisIndex === 2) { // Quantum
            ctx.fillStyle = colorPrimary;
            ctx.beginPath();
            ctx.ellipse(100, 50, 60, 40, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = colorSecondary;
            ctx.beginPath();
            ctx.ellipse(100, 50, 30, 20, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(100, 50, 15, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Thrusters
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.beginPath();
        ctx.arc(70, 90, 12, 0, 2 * Math.PI);
        ctx.arc(130, 90, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        this.cache[key] = canvas;
        return canvas;
    }
};

function init() {
    track = new Track();
    player = new Player();
    
    // Spawn 9 AI
    for (let i = 0; i < 9; i++) {
        // Posições no grid de largada, espalhados pra frente do player
        ais.push(new AI(i, 2000 + i * 800, track.trackLength));
    }
    
    setupMenu();
    requestAnimationFrame(loop);
}

function setupMenu() {
    let chIdx = 0;
    let skIdx = 0;
    
    const chName = document.getElementById('chassis-name');
    const skName = document.getElementById('skin-name');
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 200;
    displayCanvas.height = 100;
    document.querySelector('.chassis-display').prepend(displayCanvas);
    const dctx = displayCanvas.getContext('2d');
    
    function updateDisplay() {
        chName.innerText = CHASSIS_DATA[chIdx].name;
        skName.innerText = CHASSIS_DATA[chIdx].skins[skIdx].name;
        dctx.clearRect(0,0,200,100);
        dctx.drawImage(Sprites.generateShip(chIdx, skIdx), 0, 0);
        player.chassisIndex = chIdx;
        player.skinIndex = skIdx;
    }
    
    document.getElementById('prev-chassis').onclick = () => { chIdx = (chIdx + 2) % 3; skIdx = 0; updateDisplay(); };
    document.getElementById('next-chassis').onclick = () => { chIdx = (chIdx + 1) % 3; skIdx = 0; updateDisplay(); };
    document.getElementById('prev-skin').onclick = () => { skIdx = (skIdx + 2) % 3; updateDisplay(); };
    document.getElementById('next-skin').onclick = () => { skIdx = (skIdx + 1) % 3; updateDisplay(); };
    
    document.getElementById('start-btn').onclick = () => {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        gameState = 'RACE';
    };
    
    updateDisplay();
}

function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
}

function drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
}

function drawSegment(ctx, width, lanes, x1, y1, w1, x2, y2, w2, color) {
    const r1 = w1 / Math.max(6, 2 * lanes);
    const r2 = w2 / Math.max(6, 2 * lanes);
    const l1 = w1 / Math.max(32, 8 * lanes);
    const l2 = w2 / Math.max(32, 8 * lanes);

    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    drawPolygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
    drawPolygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
    drawPolygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

    if (color.lane) {
        const lanew1 = w1 * 2 / lanes;
        const lanew2 = w2 * 2 / lanes;
        let lanex1 = x1 - w1 + lanew1;
        let lanex2 = x2 - w2 + lanew2;
        for (let lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
            drawPolygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
        }
    }
}

function renderSprite(ctx, sprite, scale, destX, destY, clipY) {
    const SPRITE_PHYSICAL_WIDTH = 150; 
    const destW = (scale * SPRITE_PHYSICAL_WIDTH * width / 2); 
    const destH = (destW * sprite.height) / sprite.width;
    
    destX = destX - (destW / 2);
    destY = destY - destH;
    
    const clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
    
    if (clipH < destH) {
        ctx.drawImage(sprite, 
            0, 0, sprite.width, sprite.height - (sprite.height * clipH / destH),
            destX, destY, destW, destH - clipH);
    }
}

function checkCollisions() {
    for (let ai of ais) {
        if (Math.abs(player.z - ai.z) < player.length * 2) {
            let diffX = Math.abs(player.x - ai.x);
            if (diffX < 0.3) {
                if (player.z < ai.z) { 
                    player.speed *= 0.5; 
                    ai.speed = Math.min(ai.maxSpeed, ai.speed * 1.1); 
                    player.z = ai.z - player.length * 2;
                } else { 
                    ai.speed *= 0.5;
                    player.speed = Math.min(player.maxSpeed, player.speed * 1.1);
                    ai.z = player.z - player.length * 2;
                }
            }
        }
    }
}

function updateHUD() {
    const kmh = Math.floor(player.speed / 50);
    document.getElementById('speed').innerText = kmh;
    
    let gear = 1;
    if (kmh > 50) gear = 2;
    if (kmh > 120) gear = 3;
    if (kmh > 200) gear = 4;
    if (kmh > 260) gear = 5;
    document.getElementById('gear').innerText = gear;
    
    let positions = ais.map(a => ({ id: a.id, score: a.lap * track.trackLength + a.z }));
    positions.push({ id: 'player', score: player.lap * track.trackLength + player.z });
    positions.sort((a,b) => b.score - a.score);
    
    let myPos = positions.findIndex(p => p.id === 'player') + 1;
    document.getElementById('position').innerText = myPos;
    document.getElementById('lap').innerText = Math.min(player.lap, 3);
    
    const msg = document.getElementById('message-overlay');
    if (player.lap === 3 && raceState !== 'LAST_LAP' && gameState === 'RACE') {
        raceState = 'LAST_LAP';
        msg.innerText = 'ÚLTIMA VOLTA!';
        msg.classList.remove('hidden');
        msg.classList.add('blink');
        setTimeout(() => msg.classList.add('hidden'), 3000);
    }
    
    if (player.lap > 3 && gameState === 'RACE') {
        gameState = 'FINISHED';
        msg.classList.remove('hidden', 'blink');
        if (myPos === 1) {
            msg.innerText = 'VITÓRIA!\n1º LUGAR';
            msg.style.color = '#0f0';
            msg.style.borderColor = '#0f0';
            msg.style.textShadow = '0 0 20px #0f0, 0 0 40px #0f0';
        } else {
            msg.innerText = `FIM DE JOGO\n${myPos}º LUGAR`;
            msg.style.color = '#f00';
            msg.style.borderColor = '#f00';
            msg.style.textShadow = '0 0 20px #f00, 0 0 40px #f00';
        }
    }
}

function loop(time) {
    if (lastTime) {
        dt = (time - lastTime) / 1000;
        // Cap dt to prevent glitches when tab is inactive
        dt = Math.min(dt, 0.1);
    }
    lastTime = time;
    
    if (gameState === 'RACE') {
        player.update(dt, track.trackLength, track.segments);
        for (let ai of ais) {
            ai.update(dt, track.segments, track.trackLength, player.z);
        }
        checkCollisions();
        updateHUD();
    }
    
    render();
    
    requestAnimationFrame(loop);
}

function render() {
    ctx.clearRect(0, 0, width, height);

    camera.z = player.z;
    camera.x = player.x * track.roadWidth;
    let baseSegment = track.findSegment(camera.z);
    camera.y = baseSegment.p1.world.y + 1000; 
    
    let maxy = height;
    let x = 0;
    let dx = -(baseSegment.curve * ((camera.z % track.segmentLength) / track.segmentLength));

    for (let n = 0; n < track.segments.length; n++) {
        track.segments[n].cars = [];
        track.segments[n].clip = 0;
    }
    
    for (let ai of ais) {
        let seg = track.findSegment(ai.z);
        seg.cars.push(ai);
    }

    for (let n = 0; n < 300; n++) {
        let segment = track.segments[(baseSegment.index + n) % track.segments.length];
        segment.looped = segment.index < baseSegment.index;

        project(segment.p1, (camera.x) - x, camera.y, camera.z - (segment.looped ? track.trackLength : 0), camera.depth, width, height, track.roadWidth);
        project(segment.p2, (camera.x) - x - dx, camera.y, camera.z - (segment.looped ? track.trackLength : 0), camera.depth, width, height, track.roadWidth);

        x = x + dx;
        dx = dx + segment.curve;

        segment.clip = maxy;

        if ((segment.p1.camera.z <= camera.depth) || (segment.p2.screen.y >= maxy)) continue;

        drawSegment(ctx, width, track.lanes,
            segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
            segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
            segment.color);

        maxy = segment.p2.screen.y;
    }
    
    for (let n = 299; n > 0; n--) {
        let segment = track.segments[(baseSegment.index + n) % track.segments.length];
        
        for (let i = 0; i < segment.cars.length; i++) {
            let car = segment.cars[i];
            let sprite = Sprites.generateShip(car.chassisIndex, car.skinIndex);
            let spriteScale = segment.p1.screen.scale;
            let spriteX = segment.p1.screen.x + (spriteScale * car.x * track.roadWidth * width / 2);
            let spriteY = segment.p1.screen.y;
            renderSprite(ctx, sprite, spriteScale, spriteX, spriteY, segment.clip);
        }
        
        if (n === 1 && gameState !== 'MENU') { 
            let pSprite = Sprites.generateShip(player.chassisIndex, player.skinIndex);
            let pScale = camera.depth / 200; 
            let pX = width / 2;
            let pY = height - 20; 
            
            let bounce = (player.speed > 0) ? Math.sin(Date.now() / 50) * 2 : 0;
            
            // Fix for custom scale vs physical width in renderSprite
            const fakePhysicalWidthForPlayer = 600;
            const destW = (pScale * fakePhysicalWidthForPlayer * width / 2); 
            const destH = (destW * pSprite.height) / pSprite.width;
            
            let destX = pX - (destW / 2);
            let destY = pY + bounce - destH;
            
            ctx.drawImage(pSprite, destX, destY, destW, destH);
        }
    }
}

// Start
init();
