const viewer = new skinview3d.SkinViewer({
    canvas: document.getElementById("skin_container"),
    width: 300,
    height: 400,
    skin: "https://minotar.net/skin/Steve"
    });

    viewer.animation = new skinview3d.IdleAnimation();

    viewer.controls.enableRotate = true;
    viewer.controls.enableZoom = false;
    viewer.controls.enablePan = false;