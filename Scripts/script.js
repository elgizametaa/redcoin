// 1. تعطيل القائمة السياقية (Right Click)
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

// 2. تعطيل الضغط المطوّل على الصور فقط
document.querySelectorAll("img").forEach(element => {
    element.addEventListener("mousedown", e => e.preventDefault());
    element.addEventListener("touchstart", e => e.preventDefault());
});

// 3. منع اختصارات لوحة المفاتيح الشائعة
document.addEventListener("keydown", function(event) {
    // اختصارات شائعة مثل Ctrl+U, Ctrl+Shift+I, Ctrl+S, F12
    if (event.ctrlKey && (event.key === "u" || event.key === "U" || 
                          event.key === "i" || event.key === "I" || 
                          event.key === "s" || event.key === "S")) {
        event.preventDefault();
    }
    if (event.key === "F12") {
        event.preventDefault();
    }
});

// 4. تعطيل السحب والإفلات على الصور فقط
document.querySelectorAll("img").forEach(element => {
    element.setAttribute("draggable", "false");
    element.addEventListener("dragstart", e => e.preventDefault());
});

// 5. منع تحديد النصوص (باستثناء الأزرار)
document.addEventListener("selectstart", function(event) {
    if (event.target.tagName !== "BUTTON" && event.target.tagName !== "A") {
        event.preventDefault();
    }
});

// 6. منع النسخ واللصق (باستثناء الحقول النصية)
document.addEventListener("copy", function(event) {
    if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
        event.preventDefault();
        alert("forbidden.");
    }
});

document.addEventListener("paste", function(event) {
    if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
        event.preventDefault();
        alert("forbidden.");
    }
});

// 7. اكتشاف أدوات المطور
(function() {
    const detectDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 200;
        const heightThreshold = window.outerHeight - window.innerHeight > 200;
        if (widthThreshold || heightThreshold) {
            alert("forbidden");
            window.close();
        }
    };
    setInterval(detectDevTools, 1000);
})();

// 8. منع التحميل داخل Iframe
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

// 10. منع استخدام Inspect Element
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === "I") {
        event.preventDefault();
        alert("forbidden");
    }
});
