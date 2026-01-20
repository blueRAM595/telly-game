// pojav.js — Автономное ядро AutoTelly 2026
window.Pojav = {
    async createRuntime(options) {
        const status = document.getElementById('status');
        console.log("Инициализация системы для: " + options.username);
        
        // Имитация подготовки ресурсов 1.20.1
        return new Promise((resolve) => {
            let progress = 0;
            const loader = setInterval(() => {
                progress += 5;
                status.innerText = `Загрузка ресурсов 1.20.1: ${progress}%`;
                
                if (progress >= 100) {
                    clearInterval(loader);
                    status.innerText = "Запуск Fabric...";
                    resolve({
                        start: async () => {
                            // Скрываем меню и показываем игру
                            document.getElementById('launcher').style.display = 'none';
                            const canvas = options.canvas;
                            canvas.style.display = 'block';
                            
                            console.log("Подключение мода: " + options.mods);
                            
                            // Рисуем статус запуска на канвасе
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = "black";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.fillStyle = "#55a84a";
                            ctx.font = "24px Arial";
                            ctx.fillText("AutoTelly 1.20.1 загружается...", 50, 100);
                            ctx.fillStyle = "white";
                            ctx.font = "16px Arial";
                            ctx.fillText("Никнейм: " + options.username, 50, 140);
                        }
                    });
                }
            }, 100);
        });
    }
};
