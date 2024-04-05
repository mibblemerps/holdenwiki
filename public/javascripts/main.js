window.addEventListener('load', () => {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        document.getElementById('menu-button').addEventListener('click', (e) => {
            let sidebar = document.getElementById('sidebar');
            if (window.getComputedStyle(sidebar).display === 'none') {
                sidebar.style.display = 'flex';
            } else {
                sidebar.style.display = 'none';
            }
        });

        // Make sidebar default to hidden on mobile
        if (document.body.clientWidth < 768) {
            sidebar.style.display = 'none';
        }
    }
});