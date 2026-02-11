import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { formatBill, formatKOT } from "./formatter.js";
import { printText } from "./printer.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/print", async (req, res) => {
  const { type, data } = req.body;

  try {
    let formatted;

    if (type === "BILL") {
      formatted = formatBill(data);
    } else if (type === "KOT") {
      formatted = formatKOT(data);
    } else {
      return res.status(400).json({ error: "Invalid print type" });
    }

    await printText(formatted);

    res.json({ success: true });
  } catch (err) {
    console.error("Print failed:", err);
    res.status(500).json({ error: "Printer error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(4001, () => {
  console.log("🖨 Print bridge running on port 4001");
});
