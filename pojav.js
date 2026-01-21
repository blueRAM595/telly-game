// AutoTelly 1.20.1 Engine - 3D Hand & Multiplayer Edition (2026)
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

                // Глобальные переменные движка
                window.Pojav.gameState = 'MAIN_MENU'; 
                window.Pojav.nick = options.username;
                window.Pojav.proxyAddress = "wss://9e0c9906-5063-4350-9c6d-41ff56344c61-00-35d9p2n8jchss.riker.replit.dev";
                
                window.Pojav.cam = { x: 5, y: -6, z: -10, pitch: 0, yaw: 0 };
                window.Pojav.keys = {};
                window.Pojav.world = [];
                window.Pojav.serverWorld = [];
                window.Pojav.swingPos = 0; // Для анимации удара
                
                window.Pojav.servers = [
                    { name: "Hypixel (Replit)", ip: "mc.hypixel.net" },
                    { name: "AutoTelly Official", ip: "wss://relay.autotelly.ru" }
                ];

                window.Pojav.initListeners(canvas);
                window.Pojav.runEngine(ctx, canvas);
            }
        };
    },

    initListeners(canvas) {
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                if (y > 200 && y < 250) { this.generateSingleWorld(); this.gameState = 'SINGLE'; }
                if (y > 270 && y < 320) this.gameState = 'MULTI';
            } else if (this.gameState === 'MULTI') {
                if (y > 150 && y < 210) this.connectToServer(this.servers[0]);
                if (x < 150 && y < 100) this.gameState = 'MAIN_MENU';
            } else {
                // Если мы в игре — запускаем удар рукой
                if (document.pointerLockElement === canvas) {
                    this.swingPos = 1; 
                } else {
                    canvas.requestPointerLock();
                }
                if (x < 150 && y < 100) {
                    if(this.socket) this.socket.close();
                    this.gameState = 'MAIN_MENU';
                    document.exitPointerLock();
                }
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (document.pointerLockElement === canvas) {
                this.cam.yaw += e.movementX * 0.003;
                this.cam.pitch = Math.max(-1.4, Math.min(1.4, this.cam.pitch + e.movementY * 0.003));
            }
        });
    },

    connectToServer(server) {
        this.gameState = 'CONNECTING';
        const addr = server.ip.startsWith("wss://") ? server.ip : this.proxyAddress + "/?target=" + server.ip;
        this.socket = new WebSocket(addr);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = () => { this.gameState = 'IN_GAME_MULTI'; };
        this.socket.onerror = () => { alert("Ошибка! Проверь Replit."); this.gameState = 'MULTI'; };
    },

    generateSingleWorld() {
        this.world = [];
        for(let x = 0; x < 10; x++) {
            for(let z = 0; z < 10; z++) {
                this.world.push({ x, y: 2, z, type: 'grass' });
            }
        }
    },

    drawHand(ctx, canvas) {
        // Анимация удара и покачивания (Bobbing)
        if (this.swingPos > 0) this.swingPos -= 0.1;
        const swingMod = Math.sin(this.swingPos * Math.PI) * 40;
        const time = Date.now() * 0.005;
        const bobX = Math.sin(time) * 5 - swingMod;
        const bobY = Math.abs(Math.cos(time)) * 10 - swingMod;

        const hX = canvas.width - 200 + bobX;
        const hY = canvas.height - 180 + bobY;
        const fov = 400;

        const drawBox = (ox, oy, w, h, d, cF, cS, cT) => {
            const project = (px, py, pz) => {
                const angle = 0.4;
                const rx = px * Math.cos(angle) - pz * Math.sin(angle);
                const rz = px * Math.sin(angle) + pz * Math.cos(angle);
                const s = fov / (fov + rz);
                return { x: hX + (rx + ox) * s, y: hY + (py + oy) * s };
            };

            const v = [
                project(0,0,0), project(w,0,0), project(w,h,0), project(0,h,0),
                project(0,0,d), project(w,0,d), project(w,h,d), project(0,h,d)
            ];

            const face = (ids, col) => {
                ctx.fillStyle = col; ctx.beginPath();
                ctx.moveTo(v[ids[0]].x, v[ids[0]].y);
                ids.forEach(i => ctx.lineTo(v[i].x, v[i].y));
                ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.stroke();
            };

            face([1,5,6,2], cS); // Бок
            face([4,5,1,0], cT); // Верх
            face([0,1,2,3], cF); // Перед
        };

        drawBox(0, 50, 60, 140, 50, "#eab676", "#d19d5f", "#f5c48b"); // Кисть
        drawBox(-5, -40, 70, 90, 60, "#2eb8b8", "#248f8f", "#33cccc"); // Рукав
    },

    render3D(ctx, canvas, currentWorld) {
        ctx.fillStyle = "#74b9ff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const fov = 700, cx = canvas.width / 2, cy = canvas.height / 2;
        const cY = Math.cos(this.cam.yaw), sY = Math.sin(this.cam.yaw);
        const cP = Math.cos(this.cam.pitch), sP = Math.sin(this.cam.pitch);

        const sorted = [...currentWorld].sort((a,b) => {
            let az = (a.x-this.cam.x)*sY + (a.z-this.cam.z)*cY;
            let bz = (b.x-this.cam.x)*sY + (b.z-this.cam.z)*cY;
            return bz - az;
        });

        sorted.forEach(b => {
            let dx = b.x - this.cam.x, dy = b.y + this.cam.y, dz = b.z - this.cam.z;
            let rx = dx * cY - dz * sY;
            let rz = dx * sY + dz * cY;
            let ry = dy * cP + rz * sP;
            let pz = rz * cP - dy * sP;

            if (pz > 0.5) {
                let scale = fov / pz;
                let x = cx + rx * scale, y = cy + ry * scale, s = scale * 1.05;
                ctx.fillStyle = b.type === 'grass' ? '#55a84a' : '#795548';
                ctx.fillRect(x - s/2, y - s/2, s, s);
                ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.strokeRect(x - s/2, y - s/2, s, s);
            }
        });
    },

    runEngine(ctx, canvas) {
        const loop = () => {
            if (this.gameState === 'SINGLE' || this.gameState === 'IN_GAME_MULTI') {
                const speed = 0.12;
                let mx = 0, mz = 0;
                if (this.keys['w'] || this.keys['ц']) mz += speed;
                if (this.keys['s'] || this.keys['ы']) mz -= speed;
                if (this.keys['a'] || this.keys['ф']) mx += speed;
                if (this.keys['d'] || this.keys['в']) mx -= speed;
                this.cam.x += mx * Math.cos(this.cam.yaw) + mz * Math.sin(this.cam.yaw);
                this.cam.z += -mx * Math.sin(this.cam.yaw) + mz * Math.cos(this.cam.yaw);
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.gameState === 'MAIN_MENU') this.drawMenu(ctx, canvas);
            else if (this.gameState === 'MULTI') this.drawServerList(ctx, canvas);
            else {
                this.render3D(ctx, canvas, this.gameState === 'SINGLE' ? this.world : this.serverWorld);
                this.drawHand(ctx, canvas);
                // Прицел
                ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.beginPath();
                ctx.moveTo(canvas.width/2-8, canvas.height/2); ctx.lineTo(canvas.width/2+8, canvas.height/2);
                ctx.moveTo(canvas.width/2, canvas.height/2-8); ctx.lineTo(canvas.width/2, canvas.height/2+8);
                ctx.stroke();
                this.drawButton(ctx, 20, 20, 100, 40, "МЕНЮ");
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    drawMenu(ctx, canvas) {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#55a84a"; ctx.font = "bold 50px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("AutoTelly 2026", canvas.width/2, 130);
        this.drawButton(ctx, canvas.width/2-150, 200, 300, 50, "Одиночная игра");
        this.drawButton(ctx, canvas.width/2-150, 270, 300, 50, "Сетевая игра");
    },

    drawServerList(ctx, canvas) {
        ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawButton(ctx, 20, 20, 120, 40, "<- НАЗАД");
        this.drawButton(ctx, canvas.width/2-250, 150, 500, 60, "Hypixel (через Replit)");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#222"; ctx.strokeStyle = "white"; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white"; ctx.font = "16px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(text, x + w/2, y + h/1.6);
    }
};
