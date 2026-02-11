import escpos from "escpos";
import escposUSB from "escpos-usb";

escpos.USB = escposUSB;

// Set to true to use console logging instead of actual printer (for development)
const USE_MOCK_PRINTER = process.env.MOCK_PRINTER === "true";

function printText(text) {
  if (USE_MOCK_PRINTER) {
    console.log("🖨️ MOCK PRINTER OUTPUT:");
    console.log("═".repeat(50));
    console.log(text);
    console.log("═".repeat(50));
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    try {
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      device.open(() => {
        printer
          .align("LT")
          .text(text)
          .cut()
          .close();

        resolve(true);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export { printText };
