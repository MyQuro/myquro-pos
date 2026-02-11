function center(text, width = 32) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

function line(char = "-", width = 32) {
  return char.repeat(width);
}

function formatBill(data) {
  const lines = [];
  const width = 32;

  // Header
  lines.push(center(data.header.organizationName || "RESTAURANT", width));
  lines.push(center("Provided by MyQuro", width));
  lines.push(line("-", width));

  lines.push(`Table: ${data.header.tableLabel || "-"}`);
  lines.push(`Date: ${new Date(data.header.billedAt).toLocaleString()}`);
  lines.push(line("-", width));

  // Items
  data.items.forEach((item) => {
    const total = (item.lineTotal / 100).toFixed(2);
    lines.push(`${item.name} x${item.qty}`);
    lines.push(`   ${total}`);
  });

  lines.push(line("-", width));

  // Totals
  lines.push(`Total: ${(data.totals.total / 100).toFixed(2)}`);

  if (data.payment) {
    lines.push(`Payment: ${data.payment.method}`);
  }

  lines.push(line("-", width));
  lines.push(center("Thank you for dining!", width));
  lines.push(center("Visit Again", width));
  lines.push("\n\n");

  return lines.join("\n");
}

function formatKOT(data) {
  const lines = [];
  const width = 32;

  lines.push(center("KITCHEN ORDER TICKET", width));
  lines.push(center("Provided by MyQuro", width));
  lines.push(line("-", width));

  lines.push(`Table: ${data.header.tableLabel || "-"}`);
  lines.push(line("-", width));

  data.items.forEach((item) => {
    lines.push(`${item.name} x${item.qty}`);
  });

  lines.push(line("-", width));
  lines.push("\n\n");

  return lines.join("\n");
}

export { formatBill, formatKOT };
