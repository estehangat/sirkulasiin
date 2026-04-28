import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// ─── Types ──────────────────────────────────────────────────────────────────
export type ShippingLabelData = {
  // Courier
  courierName: string;
  courierService: string;
  // Tracking
  awb: string;
  awbBarcodeDataUrl: string | null; // PNG data URL dari bwip-js
  orderId: string;
  orderShortId: string;
  orderDate: string;
  // Sender
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderArea: string;
  senderPostal: string;
  // Recipient
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientArea: string;
  recipientPostal: string;
  // Package
  itemName: string;
  weightDisplay: string;
  shippingMethod: string;
  // Notes
  notes?: string;
  // Logo (data URL atau absolute URL)
  logoDataUrl?: string | null;
};

// ─── Styles (10×15cm thermal label) ─────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 14,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1.5pt solid #111",
    paddingBottom: 6,
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogo: {
    width: 22,
    height: 22,
    objectFit: "contain",
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
  },
  brandIn: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
  },
  brandSub: {
    fontSize: 7,
    color: "#555",
    marginTop: 1,
  },
  courierBox: {
    alignItems: "flex-end",
  },
  courierName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  courierService: {
    fontSize: 8,
    color: "#444",
    marginTop: 1,
  },
  awbSection: {
    border: "1.5pt solid #111",
    padding: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  awbLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#444",
    letterSpacing: 1,
  },
  awbValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    letterSpacing: 1,
  },
  awbBarcode: {
    width: 200,
    height: 36,
    marginTop: 4,
  },
  awbBarcodeFallback: {
    fontSize: 7,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  col: {
    flex: 1,
    border: "0.75pt solid #111",
    padding: 6,
  },
  blockTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#1E8449",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  partyText: {
    fontSize: 8,
    lineHeight: 1.35,
    color: "#222",
  },
  partyMeta: {
    fontSize: 7,
    color: "#555",
    marginTop: 2,
  },
  pkgRow: {
    flexDirection: "row",
    border: "0.75pt solid #111",
    padding: 6,
    marginBottom: 6,
  },
  pkgItem: {
    flex: 1,
  },
  pkgLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#666",
    letterSpacing: 0.5,
  },
  pkgValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },
  notes: {
    border: "0.75pt dashed #888",
    padding: 5,
    fontSize: 7,
    color: "#444",
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6,
    color: "#888",
    borderTop: "0.5pt solid #ccc",
    paddingTop: 4,
    marginTop: "auto",
  },
});

// ─── Component ──────────────────────────────────────────────────────────────
export default function ShippingLabelPDF({ data }: { data: ShippingLabelData }) {
  return (
    <Document title={`Label-${data.awb || data.orderShortId}`}>
      <Page size={[283, 425]} style={styles.page}>
        {/* Header: Brand + Courier */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {data.logoDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoDataUrl} style={styles.brandLogo} />
            ) : null}
            <View>
              <Text>
                <Text style={styles.brand}>Sirkulasi</Text>
                <Text style={styles.brandIn}>In</Text>
              </Text>
              <Text style={styles.brandSub}>Marketplace Daur Ulang</Text>
            </View>
          </View>
          <View style={styles.courierBox}>
            <Text style={styles.courierName}>{data.courierName}</Text>
            <Text style={styles.courierService}>{data.courierService}</Text>
          </View>
        </View>

        {/* AWB Section */}
        <View style={styles.awbSection}>
          <Text style={styles.awbLabel}>Nomor Resi (AWB)</Text>
          <Text style={styles.awbValue}>{data.awb || "MENUNGGU KURIR"}</Text>
          {data.awbBarcodeDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.awbBarcodeDataUrl} style={styles.awbBarcode} />
          ) : (
            <Text style={styles.awbBarcodeFallback}>* Barcode tidak tersedia</Text>
          )}
        </View>

        {/* Sender + Recipient */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.blockTitle}>Pengirim</Text>
            <Text style={styles.partyName}>{data.senderName}</Text>
            <Text style={styles.partyText}>{data.senderAddress}</Text>
            <Text style={styles.partyMeta}>
              {data.senderArea} {data.senderPostal}
            </Text>
            <Text style={styles.partyMeta}>Tel: {data.senderPhone}</Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.blockTitle}>Penerima</Text>
            <Text style={styles.partyName}>{data.recipientName}</Text>
            <Text style={styles.partyText}>{data.recipientAddress}</Text>
            <Text style={styles.partyMeta}>
              {data.recipientArea} {data.recipientPostal}
            </Text>
            <Text style={styles.partyMeta}>Tel: {data.recipientPhone}</Text>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.pkgRow}>
          <View style={styles.pkgItem}>
            <Text style={styles.pkgLabel}>Berat</Text>
            <Text style={styles.pkgValue}>{data.weightDisplay}</Text>
          </View>
          <View style={styles.pkgItem}>
            <Text style={styles.pkgLabel}>Layanan</Text>
            <Text style={styles.pkgValue}>{data.shippingMethod}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text>Catatan: {data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Order #{data.orderShortId}</Text>
        </View>
      </Page>
    </Document>
  );
}
