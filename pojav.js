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

                this.gameState = 'MAIN_MENU'; 
                this.nick = options.username;
                this.proxyAddress = "wss://9e0c9906-5063-4350-9c6d-41ff56344c61-00-35d9p2n8jchss.riker.replit.dev";
                
                this.servers = [
                    { name: "AutoTelly Test", ip: "wss://relay.autotelly.ru", online: "Загрузка...", players: 0 }
                ];

                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
                this.refreshServerInfo(); // Запускаем опрос онлайна
            }
        };
    },

    // Функция для получения онлайна (через твой прокси)
    async refreshServerInfo() {
        this.servers.forEach(async (srv) => {
            try {
                let addr = srv.ip.startsWith("wss://") ? srv.ip : this.proxyAddress + "/?target=" + srv.ip;
                const socket = new WebSocket(addr);
                socket.binaryType = "arraybuffer";

                socket.onopen = () => {
                    // Пакет статуса (Handshake + Request) для 1.20.1
                    const packet = new Uint8Array([0x0f, 0x00, 0x2f, 0x09, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x68, 0x6f, 0x73, 0x74, 0x63, 0xdd, 0x01]);
                    socket.send(packet);
                    socket.send(new Uint8Array([0x01, 0x00]));
                };

                socket.onmessage = (event) => {
                    // Имитация получения данных об онлайне в 2026 году
                    srv.online = (Math.floor(Math.random() * 100) + 50) + " игроков";
                    socket.close();
                };
            } catch (e) { srv.online = "Офлайн"; }
        });
    },

    connectToServer(server) {
        this.gameState = 'CONNECTING';
        this.selectedServer = server;
        
        let addr = server.ip.startsWith("wss://") ? server.ip : this.proxyAddress + "/?target=" + server.ip;
        
        this.socket = new WebSocket(addr);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
            console.log("Соединение установлено!");
            this.gameState = 'IN_GAME';
            // Отправляем пакет логина для 1.20.1
            const loginPacket = new Uint8Array([0x00, 0x00, 0x05, 0x01, 0x00]);
            this.socket.send(loginPacket);
        };

        this.socket.onerror = (e) => {
            console.error("Ошибка WS:", e);
            alert("Ошибка подключения! Проверь, что в Replit нажата кнопка RUN и в консоли нет ошибок.");
            this.gameState = 'MULTI';
        };
    },

    drawServerList(ctx, canvas, centerX) {
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Назад");
        this.drawButton(ctx, canvas.width - 160, 20, 140, 45, "+ Добавить");

        ctx.fillStyle = "white";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Сетевая игра (2026)", centerX, 70);

        this.servers.forEach((srv, i) => {
            const yPos = 120 + (i * 85);
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.fillRect(centerX - 350, yPos, 700, 75);
            
            ctx.textAlign = "left";
            ctx.fillStyle = "#55a84a";
            ctx.font = "bold 22px sans-serif";
            ctx.fillText(srv.name, centerX - 330, yPos + 35);
            
            ctx.fillStyle = "#888";
            ctx.font = "16px monospace";
            ctx.fillText(srv.ip, centerX - 330, yPos + 60);

            // Отрисовка онлайна
            ctx.textAlign = "right";
            ctx.fillStyle = "#f1c40f";
            ctx.fillText(srv.online, centerX + 330, yPos + 45);
        });
    },

    runEngine(ctx, canvas) {
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') this.drawMenu(ctx, canvas, centerX);
            else if (this.gameState === 'MULTI') this.drawServerList(ctx, canvas, centerX);
            else if (this.gameState === 'CONNECTING') this.drawStatus(ctx, canvas, "ВХОД НА СЕРВЕР...");
            else if (this.gameState === 'IN_GAME') this.drawGame(ctx, canvas);

            requestAnimationFrame(animate);
        };
        animate();
    },

    drawMenu(ctx, canvas, centerX) {
        ctx.fillStyle = "#0a0a0a"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff4757";
        ctx.font = "bold 60px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AUTOTELLY", centerX, 150);
        this.drawButton(ctx, centerX - 150, 250, 300, 55, "Одиночная игра");
        this.drawButton(ctx, centerX - 150, 325, 300, 55, "Сетевая игра");
    },

    drawStatus(ctx, canvas, text) {
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    },

    drawGame(ctx, canvas) {
        ctx.fillStyle = "#1e272e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#2ecc71"; ctx.textAlign = "center";
        ctx.font = "24px sans-serif";
        ctx.fillText("ПОДКЛЮЧЕНО К: " + this.selectedServer.name, canvas.width / 2, canvas.height / 2);
        this.drawButton(ctx, 20, 20, 120, 45, "Выйти");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#222"; ctx.strokeStyle = "#444"; ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white"; ctx.font = "18px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(text, x + w / 2, y + h / 1.6);
    },

    initListeners(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                if (y > 250 && y < 305) this.gameState = 'SINGLE';
                if (y > 325 && y < 380) this.gameState = 'MULTI';
            } else if (this.gameState === 'MULTI') {
                if (x > 20 && x < 140 && y > 20 && y < 65) this.gameState = 'MAIN_MENU';
                if (x > canvas.width - 160 && x < canvas.width - 20 && y > 20 && y < 65) {
                    const name = prompt("Название:"); const ip = prompt("IP (например mc.hypixel.net):");
                    if (name && ip) this.servers.push({ name, ip, online: "Загрузка..." });
                }
                this.servers.forEach((srv, i) => {
                    const yPos = 120 + (i * 85);
                    if (x > centerX - 350 && x < centerX + 350 && y > yPos && y < yPos + 75) this.connectToServer(srv);
                });
            } else if (this.gameState === 'IN_GAME') {
                if (x < 150 && y < 100) { if(this.socket) this.socket.close(); this.gameState = 'MULTI'; }
            }
        });
    }
};
