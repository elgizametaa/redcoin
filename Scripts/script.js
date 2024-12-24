// منع القائمة السياقية
        document.addEventListener("contextmenu", function(event) {
            event.preventDefault();
        });

        // منع الضغط المطوّل على العناصر
        document.querySelectorAll("img, p").forEach(element => {
            element.addEventListener("mousedown", e => e.preventDefault());
            element.addEventListener("touchstart", e => e.preventDefault());
        });
