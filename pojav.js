// pojav.js — Автономный движок 2026
window.Pojav = {
    createRuntime: async function(options) {
        console.log("Инициализация автономного ядра...");
        const status = document.getElementById('status');
        
        return {
            start: async function() {
                let progress = 0;
                // Имитация загрузки локальных ресурсов
                const loading = setInterval(() => {
                    progress += 5;
                    status.innerText = `Загрузка AutoTelly 1.20.1... ${progress}%`;
                    
                    if (progress >= 100) {
                        clearInterval(loading);
                        status.innerText = "Запуск завершен!";
                        
                        // Переключаем экраны
                        document.getElementById('launcher').style.display = 'none';
                        const canvas = document.getElementById('canvas');
                        canvas.style.display = 'block';
                        
                        // Рисуем на канвасе (проверка работы)
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = "black";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "white";
                        ctx.font = "20px Arial";
                        ctx.fillText("AutoTelly 1.20.1: Игра запущена для " + options.username, 50, 50);
                    }
                }, 100);
            }
        };
    }
};
