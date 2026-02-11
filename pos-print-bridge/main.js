import { app, Tray, Menu } from "electron";
import path from "path";
import "./server"; // your existing print server

let tray;

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, "icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "MyQuro Print Agent Running", enabled: false },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]);
  tray.setToolTip("MyQuro Print Agent");
  tray.setContextMenu(contextMenu);
});
    