function setupResizer(canvas, override)
{
    var isAndroid = window.navigator.userAgent.toLowerCase().indexOf("android") > -1;

    try{
        if(isAndroid || override)
        {
            window.addEventListener('resize', onresize.bind(this, canvas));
            onresize(canvas);

            document.addEventListener('resume', onresume, false);
            onresume();
        }
    }
    catch(e)
    {
        alert(e);
    }
}

function onresize(canvas) 
{
    var width = window.innerWidth, height = window.innerHeight;
    var wratio = width / height, ratio = canvas.width / canvas.height;

    if(wratio < ratio) 
    {
        canvas.style.width = width + "px";
        canvas.style.height = (width / ratio) + "px";
    }else{
        canvas.style.width = (height * ratio) + "px";
        canvas.style.height = height + "px";
    }
}

function onresume()
{
    if(typeof Fullscreen === "object")
    {
        Fullscreen.on();
    }
}
