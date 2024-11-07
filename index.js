const func = () => {
    const loadingScreen = document.getElementById("loading-screen");
    document.getElementById("loading-text").innerText = "Press any key to continue";
    document.getElementById("loading-spinner").style.opacity = "0";

    const start = () => {
        loadingScreen.style.opacity = "0";
        setTimeout(() => {loadingScreen.remove()}, 1000);
        window.removeEventListener("load", func);
        window.removeEventListener("keydown", start);
    };

    window.addEventListener("keydown", start);
}

window.addEventListener("load", func);