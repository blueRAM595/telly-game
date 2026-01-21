window.Pojav = {
    async createRuntime(options) {
        const canvas = options.canvas;
        const ctx = canvas.getContext('2d');
        
        return {
            start: async () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                document.getElementById('launcher').style.display = 'none';
                canvas.style.display = 'block';

                // Инициализация состояния
                window.Pojav.gameState = 'MAIN_MENU'; 
                window.Pojav.nick = options.username;
                window.Pojav.proxyAddress = "wss://9e0c9906-5063-4350-9c6d-41ff56344c61-00-35d9p2n8jchss.riker.replit.dev";
                
                // Параметры игрока
                window.Pojav.cam = { x: 5, y: 8, z: -10, pitch: 0, yaw: 0, bob: 0 };
                window.Pojav.keys = {};
                window.Pojav.world = [];
                window.Pojav.servers = [
                    { name: "AutoTelly Official", ip: "mc.hypixel.net" }
                ];

                // Запуск систем
                window.Pojav.generateChunk(); // Тот самый метод
                window.Pojav.initListeners(canvas);
                window.Pojav.runEngine(ctx, canvas);
            }
        };
    },

    generateChunk() {
        this.world = [];
        for(let x = 0; x < 12; x++) {
            for(let z = 0; z < 12; z++) {
                let h = Math.floor(Math.sin(x/3) * 2) + 5;
                for(let y = 0; y < h; y++) {
                    let type = (y === h - 1) ? 'grass' : 'dirt';
                    this.world.push({ x, y, z, type });
                }
            }
        }
    },

    initListeners(canvas) {
        // Управление клавиатурой
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        // Мышка (обзор)
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.gameState === 'MAIN_MENU') {
                const centerX = canvas.width / 2;
                if (y > 200 && y < 250) this.gameState = 'SINGLE';
                if (y > 270 && y < 320) this.gameState = 'MULTI';
            } else if (x < 150 && y < 100) {
                this.gameState = 'MAIN_MENU';
                document.exitPointerLock();
            } else {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (document.pointerLockElement === canvas) {
                this.cam.yaw += e.movementX * 0.003;
                this.cam.pitch -= e.movementY * 0.003;
                this.cam.pitch = Math.max(-1.5, Math.min(1.5, this.cam.pitch));
            }
        });
    },

    updateLogic() {
        if (this.gameState === 'SINGLE' || this.gameState === 'IN_GAME') {
            const speed = 0.15;
            let moveX = 0, moveZ = 0;

            if (this.keys['w'] || this.keys['ц']) moveZ += speed;
            if (this.keys['s'] || this.keys['ы']) moveZ -= speed;
            if (this.keys['a'] || this.keys['ф']) moveX += speed;
            if (this.keys['d'] || this.keys['в']) moveX -= speed;

            this.cam.x += moveX * Math.cos(this.cam.yaw) + moveZ * Math.sin(this.cam.yaw);
            this.cam.z += -moveX * Math.sin(this.cam.yaw) + moveZ * Math.cos(this.cam.yaw);
        }
    },

    render3D(ctx, canvas) {
        ctx.fillStyle = "#74b9ff"; // Небо
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const fov = 600;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Сортировка блоков для корректной отрисовки
        const sorted = [...this.world].sort((a,b) => {
            let az = (a.x-this.cam.x)*Math.sin(this.cam.yaw)+(a.z-this.cam.z)*Math.cos(this.cam.yaw);
            let bz = (b.x-this.cam.x)*Math.sin(this.cam.yaw)+(b.z-this.cam.z)*Math.cos(this.cam.yaw);
            return bz - az;
        });

        sorted.forEach(b => {
            let dx = b.x - this.cam.x;
            let dy = b.y - this.cam.y;
            let dz = b.z - this.cam.z;

            let rx = dx * Math.cos(this.cam.yaw) - dz * Math.sin(this.cam.yaw);
            let rz = dx * Math.sin(this.cam.yaw) + dz * Math.cos(this.cam.yaw);
            let ry = dy * Math.cos(this.cam.pitch) - rz * Math.sin(this.cam.pitch);
            let pz = dy * Math.sin(this.cam.pitch) + rz * Math.cos(this.cam.pitch);

            if (pz > 0.5) {
                let scale = fov / pz;
                let x2d = cx + rx * scale;
                let y2d = cy + ry * scale;
                let size = scale * 1.1;

                ctx.fillStyle = b.type === 'grass' ? '#55a84a' : '#795548';
                ctx.fillRect(x2d - size/2, y2d - size/2, size, size);
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.strokeRect(x2d - size/2, y2d - size/2, size, size);
            }
        });
    },

    drawHand(ctx, canvas) {
        const bobY = Math.abs(Math.sin(Date.now() * 0.006)) * 20;
        ctx.save();
        ctx.translate(canvas.width - 200, canvas.height - 180 + bobY);
        ctx.rotate(0.2);
        ctx.fillStyle = "#eab676"; ctx.fillRect(0, 0, 80, 200);
        ctx.fillStyle = "#2eb8b8"; ctx.fillRect(-5, 80, 90, 120);
        ctx.restore();
    },

    drawHUD(ctx, canvas) {
        // Прицел
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(canvas.width/2-10, canvas.height/2); ctx.lineTo(canvas.width/2+10, canvas.height/2);
        ctx.moveTo(canvas.width/2, canvas.height/2-10); ctx.lineTo(canvas.width/2, canvas.height/2+10);
        ctx.stroke();
        this.drawButton(ctx, 20, 20, 100, 40, "Меню");
    },

    runEngine(ctx, canvas) {
        const loop = () => {
            this.updateLogic();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas);
            } else {
                this.render3D(ctx, canvas);
                this.drawHand(ctx, canvas);
                this.drawHUD(ctx, canvas);
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    drawMenu(ctx, canvas) {
        ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#55a84a"; ctx.font = "bold 50px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("AutoTelly 2026", canvas.width/2, 120);
        this.drawButton(ctx, canvas.width/2-150, 200, 300, 50, "Одиночная игра");
        this.drawButton(ctx, canvas.width/2-150, 270, 300, 50, "Сетевая игра");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#333"; ctx.strokeStyle = "white";
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white"; ctx.font = "18px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(text, x + w/2, y + h/1.6);
    }
};

window.addEventListener('resize', () => {
    const cvs = document.getElementById('canvas');
    if(cvs) { cvs.width = window.innerWidth; cvs.height = window.innerHeight; }
});
