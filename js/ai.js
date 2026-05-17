class AI {
    constructor(id, z, trackLength) {
        this.id = id;
        this.x = (Math.random() * 1.5) - 0.75;
        this.z = z;
        this.speed = 8000 + Math.random() * 2000; // Base speed slightly lower than max
        this.maxSpeed = 10500 + Math.random() * 2000;
        this.lap = 1;
        this.width = 80;
        this.length = 150;
        
        this.chassisIndex = Math.floor(Math.random() * 3);
        this.skinIndex = Math.floor(Math.random() * 3);
        
        this.agressiveness = Math.random(); // 0 to 1
    }

    update(dt, segments, trackLength, playerZ) {
        let currentSegmentIndex = Math.floor(this.z / 200) % segments.length;
        let currentSegment = segments[currentSegmentIndex];
        
        // Predict curve ahead
        let lookAhead = 15;
        let curveAhead = 0;
        for (let i = 0; i < lookAhead; i++) {
            let seg = segments[(currentSegmentIndex + i) % segments.length];
            curveAhead += seg.curve;
        }
        
        // Adjust speed based on curve
        let targetSpeed = this.maxSpeed;
        if (Math.abs(curveAhead) > 10) {
            targetSpeed = this.maxSpeed * (1 - (Math.abs(curveAhead) / 50));
            targetSpeed = Math.max(targetSpeed, 6000);
        }
        
        // Acceleration / Deceleration
        if (this.speed < targetSpeed) {
            this.speed += 3000 * dt;
        } else {
            this.speed -= 4000 * dt;
        }
        
        // Move towards center or follow curve
        let targetX = 0;
        if (curveAhead < 0) targetX = 0.6; // Stay right on left curve
        if (curveAhead > 0) targetX = -0.6;
        
        this.x += (targetX - this.x) * dt * (0.5 + this.agressiveness);
        
        this.z += this.speed * dt;
        if (this.z >= trackLength) {
            this.z -= trackLength;
            this.lap++;
        }
    }
}
