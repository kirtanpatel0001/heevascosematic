/**
 * Professional GST Invoice Template
 * Enterprise-grade accounting layout
 * Authoritative, audit-ready, ledger-style
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

/* ───────────────── TYPES ───────────────── */

export interface InvoiceItem {
  name: string;
  category?: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;

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

  address?: string;
  city?: string;
  pincode?: string;

  website?: string;
}

/* ───────────────── HELPERS ───────────────── */

const fmt = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN");

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#000",
  },

  section: {
    marginBottom: 14,
  },

  divider: {
    borderBottom: "1 solid #000",
    marginVertical: 8,
  },

  lightDivider: {
    borderBottom: "0.5 solid #888",
    marginVertical: 6,
  },

  /* Header */

  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },

  normalText: {
    fontSize: 9,
  },

  boldText: {
    fontFamily: "Helvetica-Bold",
  },

  rightAlign: {
    textAlign: "right",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  row: {
    flexDirection: "row",
  },

  /* Table */

  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
    borderTop: "1 solid #000",
    paddingVertical: 5,
  },

  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #aaa",
    paddingVertical: 5,
  },

  col1: { width: "6%" },
  col2: { width: "54%" },
  col3: { width: "12%", textAlign: "right" },
  col4: { width: "14%", textAlign: "right" },
  col5: { width: "14%", textAlign: "right" },

  /* Totals */

  totalsWrapper: {
    width: "40%",
    marginLeft: "auto",
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },

  grandTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    borderTop: "1 solid #000",
    paddingTop: 5,
    marginTop: 5,
  },

  /* Signature */

  signatureBox: {
    marginTop: 60,
    alignItems: "flex-end",
  },

  signatureText: {
    marginTop: 40,
    fontSize: 9,
  },

  footerText: {
    marginTop: 20,
    fontSize: 8,
  },
});

/* ───────────────── COMPONENT ───────────────── */

export function InvoicePDF({
  invoice,
  settings,
}: {
  invoice: InvoiceData;
  settings: StoreSettings;
}) {
  const invoiceNo = `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  const issueDate = fmtDate(invoice.created_at);

  const cur = settings.currency || "INR";

  const addr = invoice.shipping_address;

  /* GST calculation */

  const subtotal = invoice.items.reduce(
    (acc, i) => acc + i.quantity * i.price,
    0
  );

  const gstRate = 0.18;

  const taxable = subtotal / (1 + gstRate);

  const gst = subtotal - taxable;

  const cgst = gst / 2;
  const sgst = gst / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* COMPANY HEADER */}

        <View style={styles.section}>
          <Text style={styles.companyName}>
            {settings.store_name}
          </Text>

          <Text style={styles.normalText}>
            {settings.address}
          </Text>

          <Text style={styles.normalText}>
            {settings.city} {settings.pincode}
          </Text>

          <Text style={styles.normalText}>
            GSTIN: {settings.gst_number}
          </Text>

          <Text style={styles.normalText}>
            Email: {settings.support_email}
          </Text>

          <Text style={styles.normalText}>
            Phone: {settings.support_phone}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* INVOICE HEADER */}

        <View style={[styles.section, styles.rowBetween]}>
          <View>
            <Text style={styles.boldText}>Bill To:</Text>

            <Text>
              {addr.firstName} {addr.lastName}
            </Text>

            <Text>{addr.address}</Text>

            <Text>
              {addr.city} - {addr.pincode}
            </Text>

            <Text>Phone: {addr.phone}</Text>
          </View>

          <View style={styles.rightAlign}>
            <Text style={styles.boldText}>
              TAX INVOICE
            </Text>

            <Text>
              Invoice No: {invoiceNo}
            </Text>

            <Text>Date: {issueDate}</Text>

            <Text>
              Payment:{" "}
              {invoice.payment_method.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* TABLE */}

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Item</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Rate</Text>
            <Text style={styles.col5}>Amount</Text>
          </View>

          {invoice.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>
                {i + 1}
              </Text>

              <Text style={styles.col2}>
                {item.name}
              </Text>

              <Text style={styles.col3}>
                {item.quantity}
              </Text>

              <Text style={styles.col4}>
                {cur} {fmt(item.price)}
              </Text>

              <Text style={styles.col5}>
                {cur}{" "}
                {fmt(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}

        <View style={styles.totalsWrapper}>
          <View style={styles.totalsRow}>
            <Text>Taxable Amount</Text>

            <Text>
              {cur} {fmt(taxable)}
            </Text>
          </View>

          <View style={styles.totalsRow}>
            <Text>CGST 9%</Text>

            <Text>
              {cur} {fmt(cgst)}
            </Text>
          </View>

          <View style={styles.totalsRow}>
            <Text>SGST 9%</Text>

            <Text>
              {cur} {fmt(sgst)}
            </Text>
          </View>

          <View style={[styles.totalsRow, styles.grandTotal]}>
            <Text>Total Amount</Text>

            <Text>
              {cur} {fmt(invoice.total_amount)}
            </Text>
          </View>
        </View>

        {/* SIGNATURE */}

        <View style={styles.signatureBox}>
          <Text>
            For {settings.store_name}
          </Text>

          <Text style={styles.signatureText}>
            Authorized Signatory
          </Text>
        </View>

        {/* FOOTER */}

        <View>
          <Text style={styles.footerText}>
            This is a computer generated invoice.
          </Text>

          <Text style={styles.footerText}>
            Subject to GST regulations of India.
          </Text>
        </View>
      </Page>
    </Document>
  );
}