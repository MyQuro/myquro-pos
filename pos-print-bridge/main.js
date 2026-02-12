import { app, Tray, Menu, nativeImage } from "electron";
import "./server.js";

let tray;

app.whenReady().then(() => {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: "MyQuro Print Agent Running", enabled: false },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]);
  tray.setToolTip("MyQuro Print Agent");
  tray.setContextMenu(contextMenu);
});
