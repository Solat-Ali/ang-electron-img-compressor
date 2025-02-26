import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

//import imagemin from 'imagemin';
//import imageminPngquant from 'imagemin-pngquant';
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

function createWindow(): BrowserWindow {
  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    //width: size.width,
    //height: size.height,
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
    },
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}

// **Listen for file paths from Renderer Process**
ipcMain.on('compress-images', async (event, filePaths) => {

  //WORKS!!!
  
  if (!filePaths) return;

  try {
    const updatedPaths = filePaths.map((path) => path.replace(/\\/g, '//'));
    //const destination =  path.join(__dirname, 'compressed');

    const destination = `D://compressed`;

    console.log('File paths (updated):', updatedPaths);
    console.log('Destination path:', destination);

    //const result = await imagemin(['D://img1.png', 'D://img2.png'], {
    const result = await imagemin(
      // [
      //   'C:\\Users\\solat\\Downloads\\thumbnail.png',
      //   'C:\\Users\\solat\\Downloads\\thumbnail_ops.png',
      //   'C:\\Users\\solat\\Downloads\\2025-02-23_22-17-19.png',
      //   'C:\\Users\\solat\\Downloads\\case-study-page.drawio.png',
      //   'C:\\Users\\solat\\Downloads\\landing_sample.png',
      // ],
      updatedPaths,
      {
        destination:destination,
        plugins: [
          imageminPngquant({
            quality: [0.6, 0.8],
          }),
        ],
      }
    );

    //console.log('Images optimized: ', result);

    // Send a success response back to the Angular component
    event.reply('compress-images-response', {
      success: true,
      response: result,
    });

    //win?.webContents.send('compress-images-response', {success: true, response: ''});
  } catch (error) {
    console.log('Error: ', error);

    // Send an error response back to the Angular component
    event.reply('compress-images-response', {
      success: false,
      response: error,
    });

    //win?.webContents.send('compress-images-response', {success: false, response: error});
  }
});
