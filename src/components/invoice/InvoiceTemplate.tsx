// /**
//  * Professional GST Invoice Template
//  * GST-inclusive pricing: prices stored with GST baked in.
//  *
//  * Math flow:
//  *   1. inclusiveTotal  = Σ (price × qty)           ← as stored in DB
//  *   2. baseSubtotal    = inclusiveTotal / 1.05      ← strip 5% GST out
//  *   3. discountAmount  = on baseSubtotal            ← discount on ex-GST base
//  *   4. gstAfterDiscount= (baseSubtotal - discount) × 0.05
//  *   5. grandTotal      = baseSubtotal - discount + gstAfterDiscount
//  */

// import {
//   Document,
//   Page,
//   Text,
//   View,
//   StyleSheet,
// } from "@react-pdf/renderer";

// /* ───────────────── TYPES ───────────────── */

// export interface InvoiceItem {
//   name: string;
//   category?: string;
//   quantity: number;
//   price: number; // GST-inclusive price
// }

// export interface InvoiceData {
//   id: string;
//   created_at: string;
//   total_amount: number;
//   payment_method: string;
//   discount_amount?: number | null;
//   coupon_code?: string | null;

//   shipping_address: {
//     firstName: string;
//     lastName: string;
//     address: string;
//     city: string;
//     pincode: string;
//     phone: string;
//   };

//   items: InvoiceItem[];
// }

// export interface StoreSettings {
//   store_name: string;
//   support_email: string;
//   support_phone?: string;

//   currency: string;

//   gst_number?: string;
//   tax_rate?: number; // e.g. 5

//   address?: string;
//   city?: string;
//   pincode?: string;

//   website?: string;
// }

// /* ───────────────── HELPERS ───────────────── */

// const fmt = (n: number) =>
//   n.toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const fmtDate = (iso: string) =>
//   new Date(iso).toLocaleDateString("en-IN");

// function calcDiscount(
//   base: number,
//   value: number,
//   type: string
// ): number {
//   if (type === "percentage")
//     return Math.min((base * value) / 100, base);
//   return Math.min(value, base);
// }

// /* ───────────────── STYLES ───────────────── */

// const styles = StyleSheet.create({
//   page: {
//     fontFamily: "Helvetica",
//     fontSize: 9,
//     padding: 40,
//     color: "#000",
//   },

//   section: {
//     marginBottom: 14,
//   },

//   divider: {
//     borderBottom: "1 solid #000",
//     marginVertical: 8,
//   },

//   lightDivider: {
//     borderBottom: "0.5 solid #ccc",
//     marginVertical: 5,
//   },

//   /* Header */

//   companyName: {
//     fontSize: 18,
//     fontFamily: "Helvetica-Bold",
//     marginBottom: 4,
//   },

//   normalText: {
//     fontSize: 9,
//     lineHeight: 1.6,
//   },

//   boldText: {
//     fontFamily: "Helvetica-Bold",
//   },

//   mutedText: {
//     fontSize: 8,
//     color: "#666",
//   },

//   rightAlign: {
//     textAlign: "right",
//   },

//   rowBetween: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },

//   row: {
//     flexDirection: "row",
//   },

//   /* Table */

//   tableHeader: {
//     flexDirection: "row",
//     borderBottom: "1 solid #000",
//     borderTop: "1 solid #000",
//     paddingVertical: 5,
//   },

//   tableRow: {
//     flexDirection: "row",
//     borderBottom: "0.5 solid #ccc",
//     paddingVertical: 5,
//   },

//   col1: { width: "5%" },
//   col2: { width: "47%" },
//   col3: { width: "12%", textAlign: "right" },
//   col4: { width: "18%", textAlign: "right" },
//   col5: { width: "18%", textAlign: "right" },

//   /* Totals */

//   totalsWrapper: {
//     width: "42%",
//     marginLeft: "auto",
//   },

//   totalsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 3,
//   },

//   totalsRowMuted: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 2,
//     color: "#555",
//     fontSize: 8,
//   },

//   discountRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 3,
//     color: "#1a6644",
//   },

//   grandTotal: {
//     fontFamily: "Helvetica-Bold",
//     fontSize: 11,
//     borderTop: "1 solid #000",
//     paddingTop: 5,
//     marginTop: 4,
//   },

//   savingNote: {
//     fontSize: 8,
//     color: "#1a6644",
//     textAlign: "right",
//     marginTop: 3,
//   },

//   /* GST note bar */

//   gstBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#fafaf9",
//     borderTop: "0.5 solid #ddd",
//     paddingVertical: 6,
//     paddingHorizontal: 0,
//     marginTop: 12,
//     fontSize: 7.5,
//     color: "#666",
//   },

//   /* Signature */

//   signatureBox: {
//     marginTop: 48,
//     alignItems: "flex-end",
//   },

//   signatureFor: {
//     fontSize: 9,
//     color: "#666",
//     marginBottom: 36,
//   },

//   signatureLine: {
//     borderTop: "0.5 solid #000",
//     width: 120,
//   },

//   signatureLabel: {
//     fontSize: 7.5,
//     color: "#888",
//     marginTop: 4,
//     letterSpacing: 1,
//     textTransform: "uppercase",
//   },

//   footerText: {
//     marginTop: 6,
//     fontSize: 7.5,
//     color: "#888",
//   },
// });

// /* ───────────────── COMPONENT ───────────────── */

// export function InvoicePDF({
//   invoice,
//   settings,
// }: {
//   invoice: InvoiceData;
//   settings: StoreSettings;
// }) {
//   const invoiceNo = `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
//   const issueDate = fmtDate(invoice.created_at);
//   const cur = settings.currency || "INR";
//   const addr = invoice.shipping_address;

//   /* ── GST-inclusive math ──────────────────────────────────
//    *
//    * Prices in DB are GST-INCLUSIVE.
//    *
//    * Step 1: total of all item prices × qty (inclusive)
//    * Step 2: strip GST → base (ex-GST) subtotal
//    * Step 3: discount applied on base subtotal
//    * Step 4: GST re-added on (base - discount)
//    * Step 5: grand total = base - discount + gstAfterDiscount
//    *
//    ─────────────────────────────────────────────────────── */

//   const gstRate = (settings.tax_rate ?? 5) / 100; // default 5%

//   // Step 1 — inclusive total of line items
//   const inclusiveTotal = invoice.items.reduce(
//     (acc, i) => acc + i.quantity * i.price,
//     0
//   );

//   // Step 2 — ex-GST base subtotal (strip GST out)
//   const baseSubtotal = inclusiveTotal / (1 + gstRate);

//   // GST extracted from inclusive price (before discount) — for display
//   const gstExtracted = inclusiveTotal - baseSubtotal;
//   const cgstDisplay  = gstExtracted / 2;
//   const sgstDisplay  = gstExtracted / 2;

//   // Step 3 — discount on ex-GST base
//   // invoice.discount_amount is already computed ex-GST (from server)
//   // Fallback: compute here if not provided
//   const discountAmount = invoice.discount_amount ?? 0;

//   // Step 4 — GST re-applied on discounted base
//   const gstAfterDiscount = (baseSubtotal - discountAmount) * gstRate;
//   const cgstAfter        = gstAfterDiscount / 2;
//   const sgstAfter        = gstAfterDiscount / 2;

//   // Step 5 — final grand total
//   const grandTotal = baseSubtotal - discountAmount + gstAfterDiscount;

//   // Total saving = discount on base + GST saved due to lower base
//   const totalSaving = discountAmount + (gstExtracted - gstAfterDiscount);

//   const hasDiscount = discountAmount > 0;

//   const gstPct  = Math.round(gstRate * 100);
//   const halfPct = gstPct / 2;

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>

//         {/* ── COMPANY HEADER ── */}
//         <View style={styles.section}>
//           <Text style={styles.companyName}>
//             {settings.store_name}
//           </Text>
//           <Text style={styles.normalText}>{settings.address}</Text>
//           <Text style={styles.normalText}>
//             {settings.city} {settings.pincode}
//           </Text>
//           <Text style={styles.normalText}>
//             GSTIN: {settings.gst_number}
//           </Text>
//           <Text style={styles.normalText}>
//             Email: {settings.support_email}
//           </Text>
//           {settings.support_phone && (
//             <Text style={styles.normalText}>
//               Phone: {settings.support_phone}
//             </Text>
//           )}
//         </View>

//         <View style={styles.divider} />

//         {/* ── INVOICE META + BILL TO ── */}
//         <View style={[styles.section, styles.rowBetween]}>
//           <View>
//             <Text style={[styles.boldText, { marginBottom: 4 }]}>
//               Bill To
//             </Text>
//             <Text>
//               {addr.firstName} {addr.lastName}
//             </Text>
//             <Text>{addr.address}</Text>
//             <Text>
//               {addr.city} — {addr.pincode}
//             </Text>
//             <Text>Ph: {addr.phone}</Text>
//           </View>

//           <View style={styles.rightAlign}>
//             <Text
//               style={[
//                 styles.boldText,
//                 { fontSize: 11, marginBottom: 4 },
//               ]}
//             >
//               TAX INVOICE
//             </Text>
//             <Text>Invoice No: {invoiceNo}</Text>
//             <Text>Date: {issueDate}</Text>
//             <Text>
//               Payment: {invoice.payment_method.toUpperCase()}
//             </Text>
//             {invoice.coupon_code && (
//               <Text style={[styles.mutedText, { marginTop: 2 }]}>
//                 Coupon: {invoice.coupon_code}
//               </Text>
//             )}
//           </View>
//         </View>

//         {/* ── ITEMS TABLE ── */}
//         <View style={styles.section}>
//           <View style={styles.tableHeader}>
//             <Text style={styles.col1}>#</Text>
//             <Text style={styles.col2}>Item</Text>
//             <Text style={styles.col3}>Qty</Text>
//             <Text style={styles.col4}>Rate (incl. GST)</Text>
//             <Text style={styles.col5}>Amount</Text>
//           </View>

//           {invoice.items.map((item, i) => (
//             <View key={i} style={styles.tableRow}>
//               <Text style={styles.col1}>{i + 1}</Text>
//               <View style={{ width: "47%" }}>
//                 <Text>{item.name}</Text>
//                 {item.category && (
//                   <Text style={[styles.mutedText, { marginTop: 1 }]}>
//                     {item.category}
//                   </Text>
//                 )}
//               </View>
//               <Text style={styles.col3}>{item.quantity}</Text>
//               <Text style={styles.col4}>
//                 {cur} {fmt(item.price)}
//               </Text>
//               <Text style={styles.col5}>
//                 {cur} {fmt(item.price * item.quantity)}
//               </Text>
//             </View>
//           ))}
//         </View>

//         {/* ── TOTALS ── */}
//         <View style={styles.totalsWrapper}>

//           {/* Subtotal inclusive (what items add up to) */}
//           <View style={styles.totalsRow}>
//             <Text>Subtotal (incl. GST)</Text>
//             <Text>
//               {cur} {fmt(inclusiveTotal)}
//             </Text>
//           </View>

//           <View style={styles.lightDivider} />

//           {/* GST breakdown extracted from inclusive price */}
//           <View style={styles.totalsRowMuted}>
//             <Text>Taxable amount</Text>
//             <Text>
//               {cur} {fmt(baseSubtotal)}
//             </Text>
//           </View>
//           <View style={styles.totalsRowMuted}>
//             <Text>CGST @ {halfPct}%</Text>
//             <Text>
//               {cur} {fmt(cgstDisplay)}
//             </Text>
//           </View>
//           <View style={styles.totalsRowMuted}>
//             <Text>SGST @ {halfPct}%</Text>
//             <Text>
//               {cur} {fmt(sgstDisplay)}
//             </Text>
//           </View>

//           {/* Discount section — only shown if coupon applied */}
//           {hasDiscount && (
//             <>
//               <View style={styles.lightDivider} />
//               <View style={styles.discountRow}>
//                 <Text>
//                   Discount
//                   {invoice.coupon_code
//                     ? ` (${invoice.coupon_code})`
//                     : ""}
//                 </Text>
//                 <Text>
//                   − {cur} {fmt(discountAmount)}
//                 </Text>
//               </View>
//               <View style={styles.totalsRowMuted}>
//                 <Text>
//                   GST after discount ({gstPct}%)
//                 </Text>
//                 <Text>
//                   {cur} {fmt(gstAfterDiscount)}
//                 </Text>
//               </View>
//               <View style={styles.totalsRowMuted}>
//                 <Text>CGST @ {halfPct}%</Text>
//                 <Text>
//                   {cur} {fmt(cgstAfter)}
//                 </Text>
//               </View>
//               <View style={styles.totalsRowMuted}>
//                 <Text>SGST @ {halfPct}%</Text>
//                 <Text>
//                   {cur} {fmt(sgstAfter)}
//                 </Text>
//               </View>
//             </>
//           )}

//           {/* Grand Total */}
//           <View style={[styles.totalsRow, styles.grandTotal]}>
//             <Text>Total Amount</Text>
//             <Text>
//               {cur} {fmt(grandTotal)}
//             </Text>
//           </View>

//           {hasDiscount && (
//             <Text style={styles.savingNote}>
//               You saved {cur} {fmt(totalSaving)} on this order
//             </Text>
//           )}
//         </View>

//         {/* ── GST NOTE BAR ── */}
//         <View style={styles.gstBar}>
//           <Text>GST Rate: {gstPct}% (CGST {halfPct}% + SGST {halfPct}%)</Text>
//           <Text>All prices are GST-inclusive</Text>
//           <Text>Discount applied on base (ex-GST) price</Text>
//         </View>

//         {/* ── SIGNATURE ── */}
//         <View style={styles.signatureBox}>
//           <Text style={styles.signatureFor}>
//             For {settings.store_name}
//           </Text>
//           <View style={styles.signatureLine} />
//           <Text style={styles.signatureLabel}>
//             Authorized Signatory
//           </Text>
//         </View>

//         {/* ── FOOTER ── */}
//         <Text style={styles.footerText}>
//           This is a computer-generated invoice.
//         </Text>
//         <Text style={styles.footerText}>
//           Subject to GST regulations of India.
//         </Text>
//         {settings.website && (
//           <Text style={styles.footerText}>
//             {settings.website}
//           </Text>
//         )}

//       </Page>
//     </Document>
//   );
// }



/**
 * Professional GST Tax Invoice — Light Theme
 *
 * Pricing logic (GST-inclusive):
 *   1. inclusiveTotal   = Σ (price × qty)              prices stored with GST baked in
 *   2. baseSubtotal     = inclusiveTotal / (1 + rate)   strip GST out
 *   3. discountAmount   = on baseSubtotal               discount on ex-GST value
 *   4. gstAfterDiscount = (baseSubtotal − discount) × rate
 *   5. grandTotal       = baseSubtotal − discount + gstAfterDiscount
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

/* ─────────────────────── TYPES ─────────────────────── */

export interface InvoiceItem {
  name: string;
  category?: string;
  quantity: number;
  price: number; // GST-inclusive price as stored in DB
}

export interface InvoiceData {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  discount_amount?: number | null; // ex-GST discount from server
  coupon_code?: string | null;

  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    pincode: string;
    phone: string;
  };

  items: InvoiceItem[];
}

export interface StoreSettings {
  store_name: string;
  support_email: string;
  support_phone?: string;
  currency: string;
  gst_number?: string;
  tax_rate?: number; // e.g. 5 (percent). Defaults to 5.
  address?: string;
  city?: string;
  pincode?: string;
  state?: string;
  website?: string;
}

/* ─────────────────────── HELPERS ─────────────────────── */

const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

/* ─────────────────────── STYLES ─────────────────────── */

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111111",
    backgroundColor: "#ffffff",
  },

  topBar: {
    height: 4,
    backgroundColor: "#111111",
  },
  bottomBar: {
    height: 3,
    backgroundColor: "#111111",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottom: "1 solid #111111",
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    letterSpacing: 2,
    color: "#111111",
    marginBottom: 5,
  },
  brandMeta: {
    fontSize: 8.5,
    color: "#555555",
    lineHeight: 1.7,
    marginBottom: 3,
  },
  brandGstin: {
    fontSize: 8,
    color: "#777777",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  invRight: {
    alignItems: "flex-end",
  },
  invTitle: {
    fontSize: 8,
    letterSpacing: 3,
    color: "#777777",
    marginBottom: 5,
  },
  invNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: "#111111",
    marginBottom: 5,
  },
  invMeta: {
    fontSize: 8.5,
    color: "#555555",
    lineHeight: 1.8,
    textAlign: "right",
  },
  paidBadge: {
    marginTop: 7,
    backgroundColor: "#111111",
    color: "#ffffff",
    fontSize: 7.5,
    letterSpacing: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 44,
    paddingVertical: 18,
    borderBottom: "0.5 solid #dddddd",
    backgroundColor: "#fafaf8",
  },
  billLabel: {
    fontSize: 8,
    letterSpacing: 2.5,
    color: "#999999",
    marginBottom: 6,
  },
  billName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#111111",
    marginBottom: 3,
  },
  billAddr: {
    fontSize: 8.5,
    color: "#444444",
    lineHeight: 1.8,
  },

  tableWrap: {
    paddingHorizontal: 44,
    paddingTop: 18,
  },
  tableHead: {
    flexDirection: "row",
    borderTop: "1 solid #111111",
    borderBottom: "1 solid #111111",
    paddingVertical: 8,
  },
  thText: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: "#666666",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e4e4e0",
    paddingVertical: 9,
  },
  cSl:   { width: "5%"  },
  cDesc: { width: "43%" },
  cQty:  { width: "10%", textAlign: "right" },
  cRate: { width: "20%", textAlign: "right" },
  cAmt:  { width: "22%", textAlign: "right" },
  itemName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#111111",
    marginBottom: 2,
  },
  itemCat: {
    fontSize: 8,
    color: "#999999",
    letterSpacing: 0.3,
  },

  totalsWrap: {
    paddingHorizontal: 44,
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 280,
  },
  tRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    fontSize: 9,
    color: "#444444",
  },
  tRowMuted: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
    fontSize: 8.5,
    color: "#888888",
  },
  tRowDiscount: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    fontSize: 9,
    color: "#1a5c38",
  },
  tDivider: {
    borderBottom: "0.5 solid #cccccc",
    marginVertical: 5,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTop: "1.5 solid #111111",
    paddingTop: 8,
    marginTop: 5,
  },
  grandLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#111111",
  },
  grandAmt: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#111111",
  },
  savingNote: {
    fontSize: 8,
    color: "#1a5c38",
    textAlign: "right",
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    border: "0.5 solid #a8d5bc",
    backgroundColor: "#f2faf5",
  },

  gstBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f3",
    borderTop: "0.5 solid #dddddd",
    borderBottom: "0.5 solid #dddddd",
    paddingHorizontal: 44,
    paddingVertical: 7,
    marginTop: 12,
    fontSize: 8,
    color: "#777777",
  },

  sigSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 44,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sigLeft: {
    fontSize: 8,
    color: "#999999",
    lineHeight: 1.9,
  },
  sigFor: {
    fontSize: 8.5,
    color: "#999999",
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  sigLine: {
    borderTop: "0.5 solid #111111",
    width: 150,
  },
  sigAuth: {
    fontSize: 7.5,
    color: "#999999",
    marginTop: 4,
    letterSpacing: 1.5,
  },
});

/* ─────────────────────── COMPONENT ─────────────────────── */

export function InvoicePDF({
  invoice,
  settings,
}: {
  invoice: InvoiceData;
  settings: StoreSettings;
}) {
  const invoiceNo = `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const issueDate = fmtDate(invoice.created_at);
  const cur       = settings.currency || "INR";
  const addr      = invoice.shipping_address;

  /* ── GST-inclusive math ────────────────────────────────────
   *
   * DB prices are GST-INCLUSIVE.
   *
   *  Step 1 — inclusive total of all line items
   *  Step 2 — strip GST → taxable (ex-GST) base
   *  Step 3 — discount on ex-GST base (value already computed server-side)
   *  Step 4 — GST re-applied on (base − discount)
   *  Step 5 — grand total
   *
   ─────────────────────────────────────────────────────────── */

  const gstRate  = (settings.tax_rate ?? 5) / 100;
  const halfRate = (settings.tax_rate ?? 5) / 2;

  const inclusiveTotal = invoice.items.reduce(
    (acc, i) => acc + i.quantity * i.price,
    0
  );

  const baseSubtotal    = inclusiveTotal / (1 + gstRate);
  const gstExtracted    = inclusiveTotal - baseSubtotal;

  const discountAmount  = invoice.discount_amount ?? 0;
  const hasDiscount     = discountAmount > 0;

  const gstAfterDiscount = (baseSubtotal - discountAmount) * gstRate;
  const grandTotal       = baseSubtotal - discountAmount + gstAfterDiscount;
  const totalSaving      = discountAmount + (gstExtracted - gstAfterDiscount);

  return (
    <Document>
      <Page size="A4" style={S.page}>

        <View style={S.topBar} />

        {/* ── HEADER ── */}
        <View style={S.header}>
          <View>
            <Text style={S.brandName}>
              {settings.store_name.toUpperCase()}
            </Text>
            <Text style={S.brandMeta}>
              {settings.address}
              {"\n"}
              {settings.city}
              {settings.pincode
                ? `, ${settings.state ?? "Gujarat"} — ${settings.pincode}`
                : ""}
            </Text>
            <Text style={S.brandGstin}>
              GSTIN: {settings.gst_number}
              {"   |   "}
              {settings.support_email}
              {settings.support_phone
                ? `   |   ${settings.support_phone}`
                : ""}
            </Text>
          </View>

          <View style={S.invRight}>
            <Text style={S.invTitle}>TAX INVOICE</Text>
            <Text style={S.invNumber}>{invoiceNo}</Text>
            <Text style={S.invMeta}>
              {"Date of Issue: "}
              {issueDate}
              {"\n"}
              {"Payment Mode: "}
              {invoice.payment_method.toUpperCase()}
              {"\n"}
              {"Place of Supply: "}
              {settings.state ?? "Gujarat"}
            </Text>
            <Text style={S.paidBadge}>PAID</Text>
          </View>
        </View>

        {/* ── BILL TO / SHIP TO ── */}
        <View style={S.billRow}>
          <View>
            <Text style={S.billLabel}>BILL TO</Text>
            <Text style={S.billName}>
              {addr.firstName} {addr.lastName}
            </Text>
            <Text style={S.billAddr}>
              {addr.address}
              {"\n"}
              {addr.city} — {addr.pincode}
              {"\n"}
              {"Mob: "}
              {addr.phone}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.billLabel}>SHIP TO</Text>
            <Text style={S.billName}>
              Same as Billing Address
            </Text>
            <Text style={[S.billAddr, { textAlign: "right" }]}>
              {"Estimated Delivery:\n5 — 7 Working Days"}
            </Text>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <View style={S.tableWrap}>
          <View style={S.tableHead}>
            <Text style={[S.thText, S.cSl]}>SL.</Text>
            <Text style={[S.thText, S.cDesc]}>
              DESCRIPTION OF GOODS
            </Text>
            <Text style={[S.thText, S.cQty]}>QTY</Text>
            <Text style={[S.thText, S.cRate]}>
              UNIT PRICE (INCL. GST)
            </Text>
            <Text style={[S.thText, S.cAmt]}>
              TOTAL AMOUNT
            </Text>
          </View>

          {invoice.items.map((item, i) => (
            <View key={i} style={S.tableRow}>
              <Text
                style={[
                  S.cSl,
                  { color: "#aaaaaa", fontSize: 9 },
                ]}
              >
                {i + 1}.
              </Text>
              <View style={S.cDesc}>
                <Text style={S.itemName}>{item.name}</Text>
                {item.category && (
                  <Text style={S.itemCat}>
                    {item.category}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  S.cQty,
                  { fontSize: 9, color: "#333333" },
                ]}
              >
                {item.quantity}
              </Text>
              <Text
                style={[
                  S.cRate,
                  { fontSize: 9, color: "#333333" },
                ]}
              >
                {cur} {fmt(item.price)}
              </Text>
              <Text
                style={[
                  S.cAmt,
                  {
                    fontFamily: "Helvetica-Bold",
                    fontSize: 9,
                    color: "#111111",
                  },
                ]}
              >
                {cur} {fmt(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={S.totalsWrap}>
          <View style={S.totalsBox}>

            <View style={S.tRow}>
              <Text>Sub-Total (Incl. GST)</Text>
              <Text>
                {cur} {fmt(inclusiveTotal)}
              </Text>
            </View>

            <View style={S.tDivider} />

            <View style={S.tRowMuted}>
              <Text>Taxable Value (Ex-GST)</Text>
              <Text>
                {cur} {fmt(baseSubtotal)}
              </Text>
            </View>
            <View style={S.tRowMuted}>
              <Text>CGST @ {halfRate}%</Text>
              <Text>
                {cur} {fmt(gstExtracted / 2)}
              </Text>
            </View>
            <View style={S.tRowMuted}>
              <Text>SGST @ {halfRate}%</Text>
              <Text>
                {cur} {fmt(gstExtracted / 2)}
              </Text>
            </View>

            {hasDiscount && (
              <>
                <View style={S.tDivider} />
                <View style={S.tRowDiscount}>
                  <Text>
                    Discount
                    {invoice.coupon_code
                      ? ` (${invoice.coupon_code})`
                      : ""}
                  </Text>
                  <Text>
                    {"- "}
                    {cur} {fmt(discountAmount)}
                  </Text>
                </View>
                <View style={S.tRowMuted}>
                  <Text>
                    GST After Discount (
                    {settings.tax_rate ?? 5}%)
                  </Text>
                  <Text>
                    {cur} {fmt(gstAfterDiscount)}
                  </Text>
                </View>
                <View style={S.tRowMuted}>
                  <Text>CGST @ {halfRate}%</Text>
                  <Text>
                    {cur} {fmt(gstAfterDiscount / 2)}
                  </Text>
                </View>
                <View style={S.tRowMuted}>
                  <Text>SGST @ {halfRate}%</Text>
                  <Text>
                    {cur} {fmt(gstAfterDiscount / 2)}
                  </Text>
                </View>
              </>
            )}

            <View style={S.grandRow}>
              <Text style={S.grandLabel}>Grand Total</Text>
              <Text style={S.grandAmt}>
                {cur} {fmt(grandTotal)}
              </Text>
            </View>

            {hasDiscount && (
              <Text style={S.savingNote}>
                Total Savings on This Order: {cur}{" "}
                {fmt(totalSaving)}
              </Text>
            )}
          </View>
        </View>

        {/* ── GST INFO BAR ── */}
        <View style={S.gstBar}>
          <Text>
            GST Rate: {settings.tax_rate ?? 5}% (CGST{" "}
            {halfRate}% + SGST {halfRate}%)
          </Text>
          <Text>All prices are GST-inclusive</Text>
          <Text>Discount applied on taxable value</Text>
        </View>

        {/* ── SIGNATURE ── */}
        <View style={S.sigSection}>
          <View>
            <Text style={S.sigLeft}>
              This is a computer-generated invoice.
              {"\n"}
              No physical signature is required.
              {"\n"}
              Subject to GST regulations of India.
              {"\n"}
              For queries: {settings.support_email}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.sigFor}>
              For {settings.store_name}
            </Text>
            <View style={S.sigLine} />
            <Text style={S.sigAuth}>
              AUTHORISED SIGNATORY
            </Text>
          </View>
        </View>

        <View style={S.bottomBar} />

      </Page>
    </Document>
  );
}