class Player {
    constructor() {
        this.x = 0; // -1 to 1 (left to right side of road)
        this.z = 0;
        this.speed = 0; // current speed
        this.maxSpeed = 15000; // units per second (~ 300 km/h)
        this.accel = 5000; // units per second squared
        this.decel = -2000;
        this.braking = -8000;
        this.turnSpeed = 1.5; // units per second
        
        this.lap = 1;
        this.position = 10;
        this.chassisIndex = 0;
        this.skinIndex = 0;
        
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;

        // Bounding box for collisions: x, width, z, length
        this.width = 80;
        this.length = 150;
        
        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.up = true;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.down = true;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.up = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.down = false;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = false;
        });
    }

    update(dt, trackLength, segments) {
        // Aceleração Progressiva
        let acceleration = 0;
        if (this.up) acceleration = this.accel;
        else if (this.down) acceleration = this.braking;
        else acceleration = this.decel;

        this.speed = Math.max(0, Math.min(this.speed + acceleration * dt, this.maxSpeed));
        
        // Movimento lateral
        if (this.speed > 0) {
            let speedFactor = this.speed / this.maxSpeed;
            let segmentIndex = Math.floor(this.z / 200) % segments.length;
            let currentSegment = segments[segmentIndex];
            
            // Fator centrífugo (empurrado pra fora na curva)
            let centrifugal = currentSegment.curve * speedFactor * dt * 2.0;
            
            let turnFactor = this.turnSpeed * speedFactor * dt;
            if (this.left) this.x -= turnFactor;
            if (this.right) this.x += turnFactor;
            
            this.x -= centrifugal; // Curva empurra
            
            // Colisão lateral (paredes)
            if (this.x < -1.1 || this.x > 1.1) {
                this.x = Math.max(-1.1, Math.min(1.1, this.x));
                this.speed *= 0.6; // Reduz em 40% instantaneamente
                this.x = (this.x < 0) ? -1.0 : 1.0; // Empurra de volta
            }
        }
        
        // Atualiza Z
        this.z = this.z + (this.speed * dt);
        if (this.z >= trackLength) {
            this.z -= trackLength;
            this.lap++;
        }
    }
}
