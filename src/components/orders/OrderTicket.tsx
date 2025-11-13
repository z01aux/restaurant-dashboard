import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderTicketProps {
  order: Order;
}

// Constantes para información del restaurante
const RESTAURANT_INFO = {
  name: "MARY'S RESTAURANT",
  address: "Av Isabel La Católica 1254",
  phone: "+51 941 778 599"
};

const OrderTicket: React.FC<OrderTicketProps> = ({ order }) => {
  // Estilos para el PDF
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 20,
      fontSize: 10,
      fontFamily: 'Helvetica',
    },
    header: {
      textAlign: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 10,
      marginBottom: 2,
    },
    divider: {
      borderBottom: '1pt solid #000000',
      marginVertical: 5,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    bold: {
      fontWeight: 'bold',
    },
    section: {
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '1pt solid #000000',
      paddingBottom: 3,
      marginBottom: 3,
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    colQuantity: {
      width: '15%',
    },
    colDescription: {
      width: '55%',
    },
    colPrice: {
      width: '30%',
      textAlign: 'right',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: 8,
      marginLeft: 10,
    },
    orderNotes: {
      marginTop: 5,
      marginBottom: 10,
    },
    orderNoteItem: {
      marginBottom: 2,
    },
    totalSection: {
      borderTop: '2pt solid #000000',
      paddingTop: 5,
      marginTop: 5,
    },
    footer: {
      textAlign: 'center',
      marginTop: 15,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
      fontSize: 9,
    }
  });

  // Función para formatear el ID de la orden de manera segura
  const formatOrderId = (orderId: string): string => {
    try {
      const numericId = parseInt(orderId.replace(/\D/g, ''));
      if (!isNaN(numericId)) {
        return `ORD-${String(numericId).padStart(8, '0')}`;
      }
      return orderId;
    } catch (error) {
      console.error('Error formateando orderId:', error);
      return orderId;
    }
  };

  // Función para formatear notas del pedido
  const formatOrderNotes = (notes: string | null | undefined): string[] => {
    if (!notes) return [];
    
    return notes.split(/[.,\n]/)
      .map(note => note.trim())
      .filter(note => note.length > 0);
  };

  // Función para calcular subtotal e IGV de manera precisa
  const calculateTaxes = (total: number) => {
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2))
    };
  };

  const getSourceText = (sourceType: Order['source']['type']): string => {
    const sourceMap = {
      'phone': 'POR TELÉFONO',
      'walk-in': 'RECOGE EN TIENDA', 
      'delivery': 'DELIVERY',
      'reservation': 'RESERVA'
    };
    return sourceMap[sourceType] || sourceType;
  };

  // Componente del documento PDF
  const TicketDocument = () => {
    const { subtotal, igv } = calculateTaxes(order.total);
    
    return (
      <Document>
        <Page size={[226.77, 841.89]} style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{RESTAURANT_INFO.name}</Text>
            <Text style={styles.subtitle}>{RESTAURANT_INFO.address}</Text>
            <Text style={styles.subtitle}>Tel: {RESTAURANT_INFO.phone}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.bold}>ORDEN:</Text>
              <Text>{formatOrderId(order.id)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.bold}>TIPO:</Text>
              <Text>{getSourceText(order.source.type)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.bold}>FECHA:</Text>
              <Text>{order.createdAt.toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.bold}>HORA:</Text>
              <Text>{order.createdAt.toLocaleTimeString()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.bold}>CLIENTE:</Text>
              <Text style={styles.bold}>{order.customerName}</Text>
            </View>
            <View style={styles.row}>
              <Text>TELÉFONO:</Text>
              <Text>{order.phone}</Text>
            </View>
            {order.tableNumber && (
              <View style={styles.row}>
                <Text>MESA:</Text>
                <Text>{order.tableNumber}</Text>
              </View>
            )}
            {order.address && (
              <View style={styles.row}>
                <Text>DIRECCIÓN:</Text>
                <Text>{order.address}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Tabla de productos */}
          <View style={styles.tableHeader}>
            <Text style={styles.colQuantity}>Cant</Text>
            <Text style={styles.colDescription}>Descripción</Text>
            <Text style={styles.colPrice}>Precio</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colQuantity}>{item.quantity}x</Text>
              <View style={styles.colDescription}>
                <Text style={styles.bold}>{item.menuItem.name}</Text>
                {item.notes && (
                  <Text style={styles.notes}>Nota: {item.notes}</Text>
                )}
              </View>
              <Text style={styles.colPrice}>
                S/ {(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Notas del pedido */}
          {order.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.orderNotes}>
                <Text style={styles.bold}>NOTAS DEL PEDIDO:</Text>
                {formatOrderNotes(order.notes).map((note, index) => (
                  <Text key={index} style={styles.orderNoteItem}>• {note}</Text>
                ))}
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Cálculos con IGV */}
          <View style={styles.totalSection}>
            <View style={styles.calculationRow}>
              <Text>Subtotal:</Text>
              <Text>S/ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.calculationRow}>
              <Text>IGV (18%):</Text>
              <Text>S/ {igv.toFixed(2)}</Text>
            </View>
            <View style={[styles.row, styles.bold]}>
              <Text>TOTAL:</Text>
              <Text>S/ {order.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.bold}>¡GRACIAS POR SU PEDIDO!</Text>
            <Text>*** {getSourceText(order.source.type)} ***</Text>
            <Text style={{ marginTop: 10, fontSize: 8 }}>
              {new Date().toLocaleString()}
            </Text>
          </View>
        </Page>
      </Document>
    );
  };

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
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Generar nombre del archivo
  const generateFileName = (order: Order) => {
    const orderNumber = formatOrderId(order.id)
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
    
    const customerName = order.customerName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    
    return `${orderNumber}-${customerName}-${date}.pdf`;
  };

  const handlePrint = async () => {
    try {
      const isMobile = window.innerWidth <= 768;
      const windowFeatures = isMobile 
        ? 'width=320,height=600,scrollbars=no,toolbar=no,location=no'
        : 'width=600,height=800,scrollbars=yes,toolbar=no,location=no';
      
      const printWindow = window.open('', '_blank', windowFeatures);
      if (printWindow) {
        const ticketContent = generateTicketContent(order);
        printWindow.document.write(`
<!DOCTYPE html>
<html>
  <head>
    <title>Ticket ${order.id}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      /* Estilos para IMPRESIÓN (ticket real) */
      @media print {
        @page {
          margin: 0;
          size: 80mm auto;
        }
        body {
          width: 80mm !important;
          margin: 0 auto !important;
          padding: 10px !important;
          font-size: 12px !important;
          transform: scale(1) !important;
        }
        .ticket {
          width: 100% !important;
          max-width: 80mm !important;
        }
        .no-print {
          display: none !important;
        }
      }

      /* Estilos para VISTA PREVIA en pantalla */
      @media screen {
        body {
          font-family: 'Courier New', monospace, sans-serif;
          font-size: 14px;
          line-height: 1.3;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
          color: #000;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          box-sizing: border-box;
        }
        .ticket {
          background: white;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border-radius: 12px;
          border: 1px solid #ddd;
          max-width: 400px;
          width: 100%;
          transform: scale(1);
        }
        
        /* Aviso para vista previa */
        .print-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
          text-align: center;
          font-size: 13px;
          color: #856404;
        }
        
        /* Botones de control */
        .print-controls {
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: #e9ecef;
          border-radius: 8px;
        }
        
        .print-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 0 5px;
          font-weight: bold;
        }
        
        .print-btn:hover {
          background: #0056b3;
        }
        
        .cancel-btn {
          background: #6c757d;
        }
        
        .cancel-btn:hover {
          background: #545b62;
        }
      }

      /* Estilos comunes para ticket */
      .center {
        text-align: center;
      }
      .bold {
        font-weight: bold;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .notes {
        font-style: italic;
        font-size: 11px;
        margin-left: 10px;
        color: #555;
      }
      .order-notes-list {
        margin: 8px 0;
        padding-left: 18px;
      }
      .order-notes-list div {
        margin-bottom: 3px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
      }
      th, td {
        padding: 3px 0;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      th {
        border-bottom: 2px solid #000;
        font-weight: bold;
      }
      .total {
        border-top: 2px solid #000;
        padding-top: 8px;
        margin-top: 8px;
      }
      .product-name {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 13px;
      }
      .quantity {
        font-weight: bold;
        font-size: 13px;
      }
      .calculation-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
        font-size: 12px;
      }
      
      /* Estilos específicos para móvil en vista previa */
      @media screen and (max-width: 768px) {
        body {
          padding: 10px;
        }
        .ticket {
          padding: 15px;
          max-width: 100%;
        }
        .print-controls {
          padding: 10px;
        }
        .print-btn {
          padding: 8px 16px;
          font-size: 13px;
          display: block;
          width: 100%;
          margin: 5px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-notice no-print">
      <strong>VISTA PREVIA DEL TICKET</strong><br>
      El ticket se imprimirá en tamaño 80mm (ticket térmico)
    </div>
    
    ${ticketContent}
    
    <div class="print-controls no-print">
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir Ticket</button>
      <button class="print-btn cancel-btn" onclick="window.close()">❌ Cerrar</button>
    </div>

    <script>
      window.onload = function() {
        console.log('Vista previa del ticket cargada correctamente');
        
        window.addEventListener('afterprint', function() {
          setTimeout(function() {
            window.close();
          }, 1000);
        });
      };
    </script>
  </body>
</html>
        `);
        printWindow.document.close();
        
        printWindow.focus();
      } else {
        alert('No se pudo abrir la ventana de impresión. Por favor, desbloquee los popups para esta página.');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      alert('Error al generar la vista previa. Por favor, intente nuevamente.');
    }
  };

  const generateTicketContent = (order: Order) => {
    const sourceText = getSourceText(order.source.type);
    const { subtotal, igv } = calculateTaxes(order.total);

    const formatOrderNotesHTML = (notes: string | null | undefined) => {
      if (!notes) return '';
      
      const notesArray = formatOrderNotes(notes);
      if (notesArray.length === 0) return '';
      
      return `
        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 5px;">NOTAS DEL PEDIDO:</div>
        <div class="order-notes-list">
          ${notesArray.map(note => `<div>• ${note}</div>`).join('')}
        </div>
      `;
    };
    
    return `
      <div class="ticket">
        <div class="center">
          <div class="bold" style="font-size: 16px; margin-bottom: 5px;">${RESTAURANT_INFO.name}</div>
          <div>${RESTAURANT_INFO.address}</div>
          <div>Tel: ${RESTAURANT_INFO.phone}</div>
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
          <span>${order.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
              <th style="width: 15%">Cant</th>
              <th style="width: 55%">Descripción</th>
              <th style="width: 30%; text-align: right;">Precio</th>
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
        
        ${formatOrderNotesHTML(order.notes)}
        
        <div class="divider"></div>
        
        <!-- Sección de cálculos con IGV -->
        <div class="calculation-row">
          <span>Subtotal:</span>
          <span>S/ ${subtotal.toFixed(2)}</span>
        </div>
        <div class="calculation-row">
          <span>IGV (18%):</span>
          <span>S/ ${igv.toFixed(2)}</span>
        </div>
        
        <div class="item-row total bold" style="font-size: 15px;">
          <span>TOTAL:</span>
          <span>S/ ${order.total.toFixed(2)}</span>
        </div>
        
        <div class="divider"></div>
        <div class="center">
          <div class="bold" style="font-size: 14px; margin: 8px 0;">¡GRACIAS POR SU PEDIDO!</div>
          <div style="font-weight: bold; margin: 5px 0;">*** ${sourceText} ***</div>
          <div style="margin-top: 10px; font-size: 11px; color: #666;">
            Generado: ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `;
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
        {/* Botón para imprimir */}
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

        {/* Nuevo botón para descargar PDF */}
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

      {/* Contenido del ticket - Solo para referencia, oculto por defecto */}
      <div id={`ticket-${order.id}`} style={{ display: 'none' }}>
        <div>Ticket content for printing</div>
      </div>
    </>
  );
};

export default OrderTicket;
