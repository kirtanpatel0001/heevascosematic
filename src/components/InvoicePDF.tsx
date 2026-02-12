'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/* ---------------- PDF STYLES (Moved from your original file) ---------------- */
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20 },
  logoSection: { flexDirection: 'column' },
  logoText: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  storeDetail: { fontSize: 9, color: '#666', marginTop: 2 },
  invoiceDetails: { alignItems: 'flex-end' },
  label: { color: '#666', marginBottom: 2 },
  value: { fontWeight: 'bold', marginBottom: 8 },
  
  addressSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  addressCol: { width: '45%' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 8 },
  
  table: { width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' },
  grandTotal: { flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#000', width: 200, justifyContent: 'space-between' },
  totalText: { fontSize: 12, fontWeight: 'bold' },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

/* ---------------- PDF COMPONENT ---------------- */
const InvoicePDF = ({ order, settings, calculations }: any) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      
      {/* HEADER */}
      <View style={pdfStyles.header}>
        <View style={pdfStyles.logoSection}>
          <Text style={pdfStyles.logoText}>{settings.store_name || 'STORE NAME'}</Text>
          <Text style={pdfStyles.storeDetail}>{settings.support_email}</Text>
          <Text style={pdfStyles.storeDetail}>{settings.support_phone}</Text>
        </View>
        <View style={pdfStyles.invoiceDetails}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>INVOICE</Text>
          <Text style={pdfStyles.label}>Invoice ID:</Text>
          <Text style={pdfStyles.value}>{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={pdfStyles.label}>Date:</Text>
          <Text style={pdfStyles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* ADDRESSES */}
      <View style={pdfStyles.addressSection}>
        <View style={pdfStyles.addressCol}>
          <Text style={pdfStyles.sectionTitle}>Billed To:</Text>
          <Text style={{fontWeight: 'bold'}}>{order.shipping_address.firstName} {order.shipping_address.lastName}</Text>
          <Text>{order.shipping_address.address}</Text>
          <Text>{order.shipping_address.city} - {order.shipping_address.pincode}</Text>
          <Text>{order.shipping_address.phone}</Text>
        </View>
        <View style={pdfStyles.addressCol}>
          <Text style={pdfStyles.sectionTitle}>From:</Text>
          <Text style={{fontWeight: 'bold'}}>{settings.store_name}</Text>
          <Text>Support: {settings.support_email}</Text>
          <Text>Phone: {settings.support_phone}</Text>
        </View>
      </View>

      {/* TABLE */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.colProduct}>Product</Text>
          <Text style={pdfStyles.colQty}>Qty</Text>
          <Text style={pdfStyles.colPrice}>Price</Text>
          <Text style={pdfStyles.colTotal}>Total</Text>
        </View>
        
        {order.items.map((item: any) => (
          <View key={item.id} style={pdfStyles.tableRow}>
            <View style={pdfStyles.colProduct}>
               <Text style={{fontWeight: 'bold'}}>{item.product.name}</Text>
               <Text style={{fontSize: 8, color: '#666'}}>{item.product.category}</Text>
            </View>
            <Text style={pdfStyles.colQty}>{item.quantity}</Text>
            <Text style={pdfStyles.colPrice}>{settings.currency} {item.price}</Text>
            <Text style={pdfStyles.colTotal}>{settings.currency} {item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* TOTALS */}
      <View style={pdfStyles.totalsSection}>
        <View>
          <View style={pdfStyles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{settings.currency} {calculations.subtotal.toFixed(2)}</Text>
          </View>
          <View style={pdfStyles.totalRow}>
            <Text>{settings.tax_name} ({settings.tax_rate}%):</Text>
            <Text>{settings.currency} {calculations.tax.toFixed(2)}</Text>
          </View>
          <View style={pdfStyles.totalRow}>
            <Text>Shipping:</Text>
            <Text>{calculations.shipping === 0 ? 'Free' : `${settings.currency} ${calculations.shipping.toFixed(2)}`}</Text>
          </View>
          <View style={pdfStyles.grandTotal}>
            <Text style={pdfStyles.totalText}>Total Paid:</Text>
            <Text style={pdfStyles.totalText}>{settings.currency} {calculations.grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={pdfStyles.footer}>
        <Text>Thank you for shopping with {settings.store_name}.</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;