class Track {
    constructor() {
        this.segments = [];
        this.segmentLength = 200;
        this.roadWidth = 2000;
        this.lanes = 3;
        this.trackLength = 0;
        this.COLORS = {
            SKY: '#050510',
            TREE: '#005500',
            FOG: '#050510',
            LIGHT: { road: '#222', grass: '#050510', rumble: '#0ff', lane: '#0ff' },
            DARK: { road: '#111', grass: '#0a0a1a', rumble: '#f0f' },
            START: { road: '#fff', grass: '#fff', rumble: '#fff' },
            FINISH: { road: '#000', grass: '#000', rumble: '#000' }
        };
        this.buildTrack();
    }

    buildTrack() {
        this.segments = [];
        this.addSegment(this.COLORS.START);
        
        // Custom track layout
        this.addStraight(50);
        this.addCurve(30, -2, 0); // Left
        this.addStraight(20);
        this.addCurve(40, 3, 20); // Right + Hill
        this.addCurve(25, -4, -20); // Sharp left downhill
        this.addStraight(50);
        this.addCurve(35, 2, 0); // Right
        this.addStraight(30);
        this.addCurve(45, -3, 30); // Left + Hill
        this.addStraight(60);

        this.addSegment(this.COLORS.FINISH);
        this.trackLength = this.segments.length * this.segmentLength;
    }

    addSegment(color, curve = 0, y = 0) {
        const n = this.segments.length;
        this.segments.push({
            index: n,
            p1: { world: { x: 0, y: this.lastY(), z: n * this.segmentLength }, camera: {}, screen: {} },
            p2: { world: { x: 0, y: y, z: (n + 1) * this.segmentLength }, camera: {}, screen: {} },
            color: color,
            curve: curve,
            sprites: [],
            cars: [],
            clip: 0
        });
    }

    lastY() {
        return (this.segments.length === 0) ? 0 : this.segments[this.segments.length - 1].p2.world.y;
    }

    addStraight(num) {
        this.addRoad(num, num, num, 0, 0);
    }

    addCurve(num, curve, y) {
        this.addRoad(num, num, num, curve, y);
    }

    addRoad(enter, hold, leave, curve, y) {
        const startY = this.lastY();
        const endY = startY + (Math.floor(y) * this.segmentLength);
        const total = enter + hold + leave;

        for (let i = 0; i < enter; i++) {
            this.addSegment(this.getRoadColor(this.segments.length), this.easeIn(0, curve, i / enter), this.easeInOut(startY, endY, i / total));
        }
        for (let i = 0; i < hold; i++) {
            this.addSegment(this.getRoadColor(this.segments.length), curve, this.easeInOut(startY, endY, (enter + i) / total));
        }
        for (let i = 0; i < leave; i++) {
            this.addSegment(this.getRoadColor(this.segments.length), this.easeInOut(curve, 0, i / leave), this.easeInOut(startY, endY, (enter + hold + i) / total));
        }
    }

    getRoadColor(index) {
        return (Math.floor(index / 3) % 2) ? this.COLORS.DARK : this.COLORS.LIGHT;
    }

    easeIn(a, b, percent) {
        return a + (b - a) * Math.pow(percent, 2);
    }

    easeInOut(a, b, percent) {
        return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
    }

    findSegment(z) {
        return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
    }
}
