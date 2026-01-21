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
                this.gameState = 'MAIN_MENU'; 
                this.nick = options.username;
                this.selectedServer = null;

                // Список серверов (WSS)
                this.servers = [
                    { name: "AutoTelly WSS Test", ip: "wss://relay.autotelly.ru", online: "12/100", ping: "24ms" },
                    { name: "EaglerServer Proxy", ip: "wss://web.eaglercraft.com", online: "450/1000", ping: "80ms" },
                    { name: "Local Proxy", ip: "ws://localhost:8080", online: "0/0", ping: "0ms" }
                ];
                
                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    initListeners(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            // Кнопка НАЗАД (всегда в одном месте)
            if (this.gameState !== 'MAIN_MENU') {
                if (x > 20 && x < 140 && y > 20 && y < 65) {
                    this.gameState = 'MAIN_MENU';
                    return;
                }
            }

            if (this.gameState === 'MAIN_MENU') {
                // Клик по "Одиночная игра"
                if (x > centerX - 150 && x < centerX + 150 && y > 200 && y < 250) {
                    this.gameState = 'SINGLE';
                }
                // Клик по "Сетевая игра"
                if (x > centerX - 150 && x < centerX + 150 && y > 270 && y < 320) {
                    this.gameState = 'MULTI';
                }
            } else if (this.gameState === 'MULTI') {
                // Выбор сервера из списка
                this.servers.forEach((srv, i) => {
                    const yPos = 120 + (i * 80);
                    if (x > centerX - 300 && x < centerX + 300 && y > yPos && y < yPos + 70) {
                        this.connectToServer(srv);
                    }
                });
            }
        });
    },

    connectToServer(server) {
        this.selectedServer = server;
        this.gameState = 'CONNECTING';
        console.log("Подключение к " + server.ip);
        
        // Создаем реальное WebSocket соединение
        const socket = new WebSocket(server.ip);
        socket.binaryType = "arraybuffer";

        socket.onopen = () => {
            this.gameState = 'IN_GAME';
        };

        socket.onerror = () => {
            alert("Ошибка: Не удалось подключиться к " + server.ip + ". Проверь, работает ли WSS прокси.");
            this.gameState = 'MULTI';
        };
    },

    runEngine(ctx, canvas) {
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas, centerX);
            } else if (this.gameState === 'MULTI') {
                this.drawServerList(ctx, canvas, centerX);
            } else if (this.gameState === 'SINGLE') {
                this.drawWorld(ctx, canvas, "Загрузка одиночного мира...");
            } else if (this.gameState === 'CONNECTING') {
                this.drawWorld(ctx, canvas, "Подключение к " + this.selectedServer.name + "...");
            } else if (this.gameState === 'IN_GAME') {
                this.drawInGame(ctx, canvas);
            }

            requestAnimationFrame(animate);
        };
        animate();
    },

    drawMenu(ctx, canvas, centerX) {
        ctx.fillStyle = "#1e3799"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AUTOTELLY 2026", centerX, 120);
        this.drawButton(ctx, centerX - 150, 200, 300, 50, "Одиночная игра");
        this.drawButton(ctx, centerX - 150, 270, 300, 50, "Сетевая игра");
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("Игрок: " + this.nick, centerX, canvas.height - 30);
    },

    drawServerList(ctx, canvas, centerX) {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Назад");
        ctx.fillStyle = "white";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Список серверов 1.20.1", centerX, 70);

        this.servers.forEach((srv, i) => {
            const yPos = 120 + (i * 80);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(centerX - 300, yPos, 600, 70);
            ctx.fillStyle = "#55a84a";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(srv.name, centerX - 280, yPos + 30);
            ctx.fillStyle = "#aaa";
            ctx.fillText(srv.ip, centerX - 280, yPos + 55);
            ctx.textAlign = "right";
            ctx.fillStyle = "#f1c40f";
            ctx.fillText(srv.online, centerX + 280, yPos + 40);
        });
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#444";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, x + w/2, y + h/1.6);
    },

    drawWorld(ctx, canvas, text) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Отмена");
    },

    drawInGame(ctx, canvas) {
        ctx.fillStyle = "#74b9ff"; // Небо
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillText("ВЫ НА СЕРВЕРЕ: " + this.selectedServer.name, canvas.width / 2, 50);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Выйти");
    }
};

window.addEventListener('resize', () => {
    const cvs = document.getElementById('canvas');
    if(cvs) { cvs.width = window.innerWidth; cvs.height = window.innerHeight; }
});
