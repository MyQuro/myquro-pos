type PrintType = "BILL" | "KOT";

const PRINT_BRIDGE_URL =
  process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL;

export async function printOrder(
  orderId: string,
  type: PrintType
) {
  // 1️⃣ Get printable payload from backend
  const res = await fetch(
    `/api/pos/orders/${orderId}/print/${type.toLowerCase()}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to build print data");
  }

  const printData = await res.json();

  // 2️⃣ Send to local print bridge
  const bridgeRes = await fetch(`${PRINT_BRIDGE_URL}/print`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // optional security header
      "x-pos-secret": "myquro-secure-key",
    },
    body: JSON.stringify({
      type,
      data: printData,
    }),
  });

  if (!bridgeRes.ok) {
    throw new Error("Print bridge error");
  }

  return true;
}
