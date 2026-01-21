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
                
                this.cam = { x: 0, y: 10, z: 0, rotY: 0 };
                this.serverWorld = []; // Сюда будем сохранять блоки от сервера
                this.chatMessages = [];

                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    connectToServer(server) {
        this.gameState = 'CONNECTING';
        let addr = server.ip.startsWith("wss://") ? server.ip : this.proxyAddress + "/?target=" + server.ip;
        
        this.socket = new WebSocket(addr);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
            this.gameState = 'IN_GAME';
            // Отправляем пакет Handshake (базовый байт-код для 1.20.1)
            this.sendPacket(new Uint8Array([0x00, 0x00, 0x04])); 
        };

        this.socket.onmessage = (event) => {
            const data = new Uint8Array(event.data);
            this.handleServerPacket(data);
        };
    },

    handleServerPacket(data) {
        // Простейшая логика парсинга (в 2026 мы пишем это вручную)
        // Если это пакет чата (имитация):
        if (data[0] === 0x01) { 
            this.chatMessages.push("Сервер: Добро пожаловать!");
        }
        // Если это пакет блока:
        if (data[0] === 0x02) {
            // В реальном 1.20.1 тут сложная декомпрессия, но для начала:
            this.serverWorld.push({x: data[1], y: data[2], z: data[3], type: 'grass'});
        }
    },

    sendPacket(buffer) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(buffer);
        }
    },

    runEngine(ctx, canvas) {
        const animate = () => {
            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas);
            } else if (this.gameState === 'IN_GAME') {
                this.renderMultiplayerWorld(ctx, canvas);
            } else if (this.gameState === 'MULTI') {
                this.drawServerList(ctx, canvas);
            }
            requestAnimationFrame(animate);
        };
        animate();
    },

    renderMultiplayerWorld(ctx, canvas) {
        ctx.fillStyle = "#74b9ff"; // Небо
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рендерим блоки, полученные от сервера
        if (this.serverWorld.length === 0) {
            // Если блоков еще нет, рисуем "Загрузка чанков..."
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Ожидание данных от сервера 1.20.1...", canvas.width/2, canvas.height/2);
        }

        // Отрисовка чата поверх
        ctx.textAlign = "left";
        ctx.font = "14px Arial";
        this.chatMessages.slice(-5).forEach((msg, i) => {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(10, canvas.height - 150 + i*20, 300, 18);
            ctx.fillStyle = "white";
            ctx.fillText(msg, 15, canvas.height - 136 + i*20);
        });

        this.drawHUD(ctx, canvas);
    },

    drawHUD(ctx, canvas) {
        ctx.fillStyle = "white";
        ctx.font = "16px monospace";
        ctx.fillText("Ник: " + this.nick, 20, 30);
        ctx.fillText("Сервер: " + (this.socket ? "CONNECTED" : "DISCONNECTED"), 20, 50);
        this.drawButton(ctx, 20, 70, 100, 35, "В меню");
    },

    // Функции drawMenu, drawButton, drawServerList остаются прежними
    drawMenu(ctx, canvas) {
        const centerX = canvas.width / 2;
        ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#55a84a"; ctx.font = "bold 50px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("AutoTelly 1.20.1", centerX, 150);
        this.drawButton(ctx, centerX - 150, 250, 300, 50, "Одиночная игра");
        this.drawButton(ctx, centerX - 150, 320, 300, 50, "Сетевая игра");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#333"; ctx.strokeStyle = "white"; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white"; ctx.font = "18px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(text, x + w/2, y + h/1.6);
    },

    drawServerList(ctx, canvas) {
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Назад");
        ctx.fillStyle = "white"; ctx.font = "bold 30px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Список серверов 1.20.1", canvas.width/2, 70);
    },

    initListeners(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;
            if (this.gameState === 'MAIN_MENU') {
                if (y > 250 && y < 300) this.gameState = 'SINGLE';
                if (y > 320 && y < 370) this.gameState = 'MULTI';
            } else if (this.gameState === 'MULTI') {
                // Тестовый клик по первому серверу в списке (упрощенно)
                if (y > 100) this.connectToServer({ip: "mc.hypixel.net"});
            } else {
                if (x < 150 && y < 110) this.gameState = 'MAIN_MENU';
            }
        });
    }
};
