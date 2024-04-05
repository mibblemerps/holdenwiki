function updateHash() {
    const frame = document.getElementById('viewer');
    let src = frame.src;
    if (src.indexOf('#') >= 0) {
        src = src.substring(0, src.indexOf('#'));
    }
    frame.src = src + location.hash;
}

window.addEventListener('hashchange', () => {
    updateHash();
});

window.addEventListener('load', () => {
    updateHash();
});
