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

    document.getElementById('menu-button').addEventListener('click', (e) => {
        let sidebar = document.getElementById('sidebar');
        if (sidebar.style.display === 'none') {
            sidebar.style.display = 'flex';
        } else {
            sidebar.style.display = 'none';
        }
    });

    // Make sidebar default to hidden on mobile
    document.getElementById('sidebar').style.display = (document.body.clientWidth < 768) ? 'none' : 'flex';
});
