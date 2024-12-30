(() => {
    const init = () => {
        self.buildHTML();
        self.buildCSS();
        self.setEvents();
    };

    const buildHTML = () => {
        const html = `
            <div class="container">
                <h1></h1>
            </div>
        `;

        $('.product-detail').append(html);
    };

    const buildCSS = () => {
        const css = `
            .container {
                background-color: red;
                height: 100px;
                width: 100px;
            }
        `;

        $('<style>').addClass('carousel-style').html(css).appendTo('head');
    };

    const setEvents = () => {
        $('').on('click', () => {
            console.log('clicked');
        });
    };

    init();
})();