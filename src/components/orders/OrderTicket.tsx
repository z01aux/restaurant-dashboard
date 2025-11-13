import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderTicketProps {
  order: Order;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order }) => {
  // Estilos para el PDF - unificados con el diseño del ticket de impresión
  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Courier',
      fontSize: 10,
      lineHeight: 1.1,
      padding: 8,
      backgroundColor: '#FFFFFF',
      width: '100%',
      height: '100%',
    },
    ticket: {
      width: '100%',
      maxWidth: '72mm',
    },
    center: {
      textAlign: 'center',
      marginBottom: 4,
    },
    bold: {
      fontWeight: 'bold',
      fontFamily: 'Courier-Bold',
    },
    divider: {
      borderBottom: '1pt dashed #000000',
      marginVertical: 4,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    notes: {
      fontStyle: 'italic',
      fontSize: 8,
      marginLeft: 8,
    },
    orderNotesList: {
      marginVertical: 4,
      paddingLeft: 12,
    },
    orderNoteItem: {
      marginBottom: 1,
      fontSize: 9,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '1pt solid #000000',
      paddingBottom: 2,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    colQuantity: {
      width: '15%',
      fontWeight: 'bold',
    },
    colDescription: {
      width: '55%',
    },
    colPrice: {
      width: '30%',
      textAlign: 'right',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 1,
      fontSize: 9,
    },
    totalSection: {
      borderTop: '2pt solid #000000',
      paddingTop: 4,
      marginTop: 4,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
      fontSize: 9,
    },
    footer: {
      textAlign: 'center',
      marginTop: 8,
    },
    smallText: {
      fontSize: 8,
    }
  });

  // Componente del documento PDF con tamaño de página para ticket
  const TicketDocument = () => (
    <Document>
      <Page 
        size={[203, 841.89]}
        style={styles.page}
        orientation="portrait"
      >
        <View style={styles.ticket}>
          <View style={styles.center}>
            <Text style={styles.bold}>MARY'S RESTAURANT</Text>
            <Text style={styles.smallText}>Av. Isabel La Católica 1254</Text>
            <Text style={styles.smallText}>Tel: 941 778 599</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.bold}>ORDEN:</Text>
            <Text>{formatOrderId(order.id)}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.bold}>TIPO:</Text>
            <Text>{getSourceText(order.source.type)}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.bold}>FECHA:</Text>
            <Text>{order.createdAt.toLocaleDateString()}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.bold}>HORA:</Text>
            <Text>{order.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.itemRow, styles.bold]}>
            <Text>CLIENTE:</Text>
            <Text>{order.customerName}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text>TELÉFONO:</Text>
            <Text>{order.phone}</Text>
          </View>
          {order.tableNumber && (
            <View style={styles.itemRow}>
              <Text>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
          {order.address && (
            <View style={styles.itemRow}>
              <Text>DIRECCIÓN:</Text>
              <Text>{order.address}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.tableHeader}>
            <Text style={styles.colQuantity}>Cant</Text>
            <Text style={styles.colDescription}>Descripción</Text>
            <Text style={styles.colPrice}>Precio</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colQuantity}>{item.quantity}x</Text>
              <View style={styles.colDescription}>
                <Text style={styles.productName}>{item.menuItem.name}</Text>
                {item.notes && (
                  <Text style={styles.notes}>Nota: {item.notes}</Text>
                )}
              </View>
              <Text style={styles.colPrice}>
                S/ {(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          {order.notes && (
            <>
              <View style={styles.divider} />
              <View>
                <Text style={styles.bold}>NOTAS DEL PEDIDO:</Text>
                <View style={styles.orderNotesList}>
                  {formatOrderNotes(order.notes).map((note, index) => (
                    <Text key={index} style={styles.orderNoteItem}>• {note}</Text>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.calculationRow}>
            <Text>Subtotal:</Text>
            <Text>S/ {(order.total / 1.18).toFixed(2)}</Text>
          </View>
          <View style={styles.calculationRow}>
            <Text>IGV (18%):</Text>
            <Text>S/ {(order.total - (order.total / 1.18)).toFixed(2)}</Text>
          </View>
          <View style={[styles.itemRow, styles.bold, styles.totalSection]}>
            <Text>TOTAL:</Text>
            <Text>S/ {order.total.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.bold}>¡GRACIAS POR SU PEDIDO!</Text>
            <Text>*** {getSourceText(order.source.type)} ***</Text>
            <Text style={[styles.smallText, { marginTop: 6 }]}>
              {new Date().toLocaleString()}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    try {
      const blob = await pdf(<TicketDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = generateFileName(order);
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  // Función para imprimir
  const handlePrint = async () => {
    const printContent = document.getElementById(`ticket-${order.id}`);
    if (printContent) {
      const isMobile = window.innerWidth <= 768;
      const windowFeatures = isMobile 
        ? 'width=320,height=600,scrollbars=no,toolbar=no,location=no'
        : 'width=800,height=600,scrollbars=no,toolbar=no,location=no';
      
      const printWindow = window.open('', '_blank', windowFeatures);
      if (printWindow) {
        const ticketContent = generateTicketContent(order);
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket ${order.id}</title>
              <style>
                @media print {
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.2;
                  width: 80mm;
                  margin: 0 auto;
                  padding: 10px;
                  background: white;
                  color: black;
                  box-sizing: border-box;
                }
                .ticket {
                  width: 100%;
                  max-width: 80mm;
                  margin: 0 auto;
                }
                .center {
                  text-align: center;
                }
                .bold {
                  font-weight: bold;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 5px 0;
                }
                .item-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 3px;
                }
                .notes {
                  font-style: italic;
                  font-size: 10px;
                  margin-left: 10px;
                }
                .order-notes-list {
                  margin: 5px 0;
                  padding-left: 15px;
                }
                .order-notes-list div {
                  margin-bottom: 2px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  padding: 2px 0;
                  text-align: left;
                }
                th {
                  border-bottom: 1px solid #000;
                }
                .total {
                  border-top: 2px solid #000;
                  padding-top: 5px;
                  margin-top: 5px;
                }
                .product-name {
                  font-weight: bold;
                  text-transform: uppercase;
                }
                .quantity {
                  font-weight: bold;
                }
                .calculation-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 2px;
                  font-size: 11px;
                }
                
                @media screen and (min-width: 769px) {
                  body {
                    width: 100%;
                    max-width: 400px;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                  }
                  .ticket {
                    background: white;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                  }
                }
                
                @media screen and (max-width: 768px) {
                  body {
                    width: 100%;
                    max-width: 300px;
                    margin: 0 auto;
                  }
                }
              </style>
            </head>
            <body>
              ${ticketContent}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 1000);
                  }, 100);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Función para generar contenido del ticket HTML
  const generateTicketContent = (order: Order) => {
    const sourceText = getSourceText(order.source.type);
    
    const subtotal = order.total / 1.18;
    const igv = order.total - subtotal;

    const formatOrderNotes = (notes: string) => {
      if (!notes) return '';
      
      const notesArray = notes.split(/[.,\n]/)
        .map(note => note.trim())
        .filter(note => note.length > 0);
      
      if (notesArray.length === 0) return '';
      
      return `
        <div class="divider"></div>
        <div class="bold">NOTAS DEL PEDIDO:</div>
        <div class="order-notes-list">
          ${notesArray.map(note => `<div>• ${note}</div>`).join('')}
        </div>
      `;
    };
    
    return `
      <div class="ticket">
        <div class="center">
          <div class="bold">MARY'S RESTAURANT</div>
          <div>Av. Isabel La Católica 1254</div>
          <div>Tel: 941 778 599</div>
          <div class="divider"></div>
        </div>
        
        <div class="item-row">
          <span class="bold">ORDEN:</span>
          <span>${formatOrderId(order.id)}</span>
        </div>
        <div class="item-row">
          <span class="bold">TIPO:</span>
          <span>${sourceText}</span>
        </div>
        <div class="item-row">
          <span class="bold">FECHA:</span>
          <span>${order.createdAt.toLocaleDateString()}</span>
        </div>
        <div class="item-row">
          <span class="bold">HORA:</span>
          <span>${order.createdAt.toLocaleTimeString()}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="item-row bold">
          <span>CLIENTE:</span>
          <span>${order.customerName}</span>
        </div>
        <div class="item-row">
          <span>TELÉFONO:</span>
          <span>${order.phone}</span>
        </div>
        ${order.tableNumber ? `<div class="item-row">
          <span>MESA:</span>
          <span>${order.tableNumber}</span>
        </div>` : ''}
        ${order.address ? `<div class="item-row">
          <span>DIRECCIÓN:</span>
          <span>${order.address}</span>
        </div>` : ''}
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr>
              <th>Cant</th>
              <th>Descripción</th>
              <th style="text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td class="quantity">${item.quantity}x</td>
                <td>
                  <div class="product-name">${item.menuItem.name}</div>
                  ${item.notes ? `<div class="notes">Nota: ${item.notes}</div>` : ''}
                </td>
                <td style="text-align: right;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${formatOrderNotes(order.notes || '')}
        
        <div class="divider"></div>
        
        <div class="calculation-row">
          <span>Subtotal:</span>
          <span>S/ ${subtotal.toFixed(2)}</span>
        </div>
        <div class="calculation-row">
          <span>IGV (18%):</span>
          <span>S/ ${igv.toFixed(2)}</span>
        </div>
        
        <div class="item-row total bold">
          <span>TOTAL:</span>
          <span>S/ ${order.total.toFixed(2)}</span>
        </div>
        
        <div class="divider"></div>
        <div class="center">
          <div class="bold">¡GRACIAS POR SU PEDIDO!</div>
          <div>*** ${sourceText} ***</div>
          <div style="margin-top: 10px; font-size: 10px;">
            ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `;
  };

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'POR TELÉFONO',
      'walk-in': 'RECOGE EN TIENDA', 
      'delivery': 'DELIVERY',
      'reservation': 'RESERVA'
    };
    return sourceMap[sourceType] || sourceType;
  };

  const generateFileName = (order: Order) => {
    const orderNumber = formatOrderId(order.id)
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
    
    const customerName = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    
    return `${orderNumber}-${customerName}-${date}.pdf`;
  };

  const formatOrderId = (orderId: string) => {
    const numericId = parseInt(orderId.replace(/\D/g, ''));
    if (!isNaN(numericId)) {
      return `ORD-${String(numericId).padStart(8, '0')}`;
    }
    return orderId;
  };

  const formatOrderNotes = (notes: string): string[] => {
    if (!notes) return [];
    return notes.split(/[.,\n]/)
      .map(note => note.trim())
      .filter(note => note.length > 0);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
        <button
          onClick={handlePrint}
          data-order-id={order.id}
          className="print-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Imprimir Ticket {formatOrderId(order.id)}
        </button>

        <button
          onClick={handleDownloadPDF}
          className="download-pdf-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Descargar PDF
        </button>
      </div>

      <div id={`ticket-${order.id}`} style={{ display: 'none' }}>
        <div>Ticket content for printing</div>
      </div>
    </>
  );
};

export default OrderTicket;
