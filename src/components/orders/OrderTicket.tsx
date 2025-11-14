import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderTicketProps {
  order: Order;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order }) => {
  // Verificar si es un pedido por teléfono para ticket de cocina
  const isPhoneOrder = order.source.type === 'phone';
  
  // Obtener el nombre del usuario actual desde localStorage
  const getCurrentUserName = () => {
    try {
      const savedUser = localStorage.getItem('restaurant-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return userData.name || 'Sistema';
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return 'Sistema';
  };

  // Función para obtener número de orden para display
  const getDisplayOrderNumber = () => {
    return order.orderNumber || `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener número de cocina para display
  const getDisplayKitchenNumber = () => {
    return order.kitchenNumber || `COM-${order.id.slice(-8).toUpperCase()}`;
  };

  // Estilos para el PDF de COCINA (sin precios)
  const kitchenStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 15,
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
    },
    header: {
      textAlign: 'center',
      marginBottom: 10,
      borderBottom: '2pt solid #000000',
      paddingBottom: 8,
    },
    restaurantName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 3,
      textTransform: 'uppercase',
    },
    area: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 5,
      textTransform: 'uppercase',
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
    infoSection: {
      marginBottom: 8,
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 2,
    },
    value: {
      fontWeight: 'normal',
    },
    productsHeader: {
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 5,
      textTransform: 'uppercase',
      borderBottom: '1pt solid #000000',
      paddingBottom: 3,
    },
    productRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    quantity: {
      width: '15%',
      fontWeight: 'bold',
    },
    productName: {
      width: '85%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: 8,
      marginLeft: 15,
      marginBottom: 2,
    },
    productsContainer: {
      marginBottom: 10,
    },
    footer: {
      marginTop: 10,
      textAlign: 'center',
    },
    asteriskLine: {
      textAlign: 'center',
      fontSize: 9,
      letterSpacing: 1,
      marginBottom: 1,
    }
  });

  // Estilos normales para otros tipos de pedido
  const normalStyles = StyleSheet.create({
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
    table: {
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
    quantity: {
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: 8,
      marginLeft: 10,
    },
    calculations: {
      marginTop: 5,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
      fontSize: 9,
    },
    total: {
      borderTop: '2pt solid #000000',
      paddingTop: 5,
      marginTop: 5,
    },
    footer: {
      textAlign: 'center',
      marginTop: 15,
    },
    footerDate: {
      marginTop: 10,
      fontSize: 8,
    }
  });

  // Componente del documento PDF para COCINA (MODIFICADO)
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[226.77, 841.89]} style={kitchenStyles.page}>
        {/* Header MODIFICADO - Nombre del cliente en lugar del restaurante */}
        <View style={kitchenStyles.header}>
          <Text style={kitchenStyles.restaurantName}>{order.customerName.toUpperCase()}</Text>
          <Text style={kitchenStyles.area}>** COCINA **</Text>
        </View>

        {/* Información de la comanda */}
        <View style={kitchenStyles.infoSection}>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>CLIENTE:</Text>
            <Text style={kitchenStyles.value}>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>AREA:</Text>
            <Text style={kitchenStyles.value}>COCINA</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>COMANDA:</Text>
            <Text style={kitchenStyles.value}>#{getDisplayKitchenNumber()}</Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>FECHA:</Text>
            <Text style={kitchenStyles.value}>
              {order.createdAt.toLocaleDateString('es-ES')} - {order.createdAt.toLocaleTimeString('es-ES')}
            </Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>ATENDIDO POR:</Text>
            <Text style={kitchenStyles.value}>{getCurrentUserName().toUpperCase()}</Text>
          </View>
        </View>

        <View style={kitchenStyles.divider} />

        {/* Header de productos MODIFICADO - "DESCRIPCION" en lugar de "PRODUCTOS" */}
        <Text style={kitchenStyles.productsHeader}>DESCRIPCION</Text>
        
        <View style={kitchenStyles.divider} />

        {/* Lista de productos */}
        <View style={kitchenStyles.productsContainer}>
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={kitchenStyles.productRow}>
                <Text style={kitchenStyles.quantity}>{item.quantity}x</Text>
                <Text style={kitchenStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
              </View>
              {item.notes && (
                <Text style={kitchenStyles.notes}>- {item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={kitchenStyles.divider} />

        {/* Footer MODIFICADO - Solo una línea de asteriscos */}
        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // Componente del documento PDF normal (SIN CAMBIOS)
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[226.77, 841.89]} style={normalStyles.page}>
        <View style={normalStyles.header}>
          <Text style={normalStyles.title}>MARY'S RESTAURANT</Text>
          <Text style={normalStyles.subtitle}>Av. Isabel La Católica 1254</Text>
          <Text style={normalStyles.subtitle}>Tel: 941 778 599</Text>
          <View style={normalStyles.divider} />
        </View>

        {/* Información de la orden */}
        <View style={normalStyles.section}>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>ORDEN:</Text>
            <Text>{getDisplayOrderNumber()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>TIPO:</Text>
            <Text>{getSourceText(order.source.type)}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>FECHA:</Text>
            <Text>{order.createdAt.toLocaleDateString()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>HORA:</Text>
            <Text>{order.createdAt.toLocaleTimeString()}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        {/* Información del cliente */}
        <View style={normalStyles.section}>
          <View style={[normalStyles.row, normalStyles.bold]}>
            <Text>CLIENTE:</Text>
            <Text>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text>TELÉFONO:</Text>
            <Text>{order.phone}</Text>
          </View>
          {order.tableNumber && (
            <View style={normalStyles.row}>
              <Text>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
        </View>

        <View style={normalStyles.divider} />

        {/* Tabla de productos */}
        <View style={normalStyles.table}>
          <View style={normalStyles.tableHeader}>
            <Text style={normalStyles.colQuantity}>Cant</Text>
            <Text style={normalStyles.colDescription}>Descripción</Text>
            <Text style={normalStyles.colPrice}>Precio</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={normalStyles.tableRow}>
              <Text style={[normalStyles.colQuantity, normalStyles.quantity]}>{item.quantity}x</Text>
              <View style={normalStyles.colDescription}>
                <Text style={normalStyles.productName}>{item.menuItem.name}</Text>
                {item.notes && (
                  <Text style={normalStyles.notes}>Nota: {item.notes}</Text>
                )}
              </View>
              <Text style={normalStyles.colPrice}>
                S/ {(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Cálculos con IGV */}
        <View style={normalStyles.calculations}>
          <View style={normalStyles.calculationRow}>
            <Text>Subtotal:</Text>
            <Text>S/ {(order.total / 1.18).toFixed(2)}</Text>
          </View>
          <View style={normalStyles.calculationRow}>
            <Text>IGV (18%):</Text>
            <Text>S/ {(order.total - (order.total / 1.18)).toFixed(2)}</Text>
          </View>
          <View style={[normalStyles.row, normalStyles.total, normalStyles.bold]}>
            <Text>TOTAL:</Text>
            <Text>S/ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        <View style={normalStyles.footer}>
          <Text style={normalStyles.bold}>¡GRACIAS POR SU PEDIDO!</Text>
          <Text>*** {getSourceText(order.source.type)} ***</Text>
          <Text style={normalStyles.footerDate}>
            {new Date().toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );

  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    try {
      const blob = await pdf(
        isPhoneOrder ? <KitchenTicketDocument /> : <NormalTicketDocument />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = generateFileName(order, isPhoneOrder);
      
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
        const ticketContent = generateTicketContent(order, isPhoneOrder);
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
                .uppercase {
                  text-transform: uppercase;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 5px 0;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 3px;
                }
                .notes {
                  font-style: italic;
                  font-size: 10px;
                  margin-left: 15px;
                }
                .products-header {
                  text-align: center;
                  font-weight: bold;
                  margin: 5px 0;
                  text-transform: uppercase;
                  border-bottom: 1px dashed #000;
                  padding-bottom: 3px;
                }
                .product-row {
                  display: flex;
                  margin-bottom: 4px;
                }
                .quantity {
                  width: 15%;
                  font-weight: bold;
                }
                .product-name {
                  width: 85%;
                  font-weight: bold;
                  text-transform: uppercase;
                }
                .asterisk-line {
                  text-align: center;
                  font-size: 9px;
                  letter-spacing: 1px;
                  margin-bottom: 1px;
                }
                
                /* Estilos para vista previa */
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

  // Generar contenido HTML para impresión (MODIFICADO para ticket cocina)
  const generateTicketContent = (order: Order, isKitchenTicket: boolean) => {
    if (isKitchenTicket) {
      // TICKET COCINA MODIFICADO
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold uppercase" style="font-size: 16px; margin-bottom: 5px;">${order.customerName.toUpperCase()}</div>
            <div class="bold">** COCINA **</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">CLIENTE:</span>
            <span>${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="bold">AREA:</span>
            <span>COCINA</span>
          </div>
          <div class="info-row">
            <span class="bold">COMANDA:</span>
            <span>#${getDisplayKitchenNumber()}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString('es-ES')} - ${order.createdAt.toLocaleTimeString('es-ES')}</span>
          </div>
          <div class="info-row">
            <span class="bold">ATENDIDO POR:</span>
            <span>${getCurrentUserName().toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="products-header">DESCRIPCION</div>
          
          <div class="divider"></div>
          
          ${order.items.map(item => `
            <div class="product-row">
              <div class="quantity">${item.quantity}x</div>
              <div class="product-name">${item.menuItem.name.toUpperCase()}</div>
            </div>
            ${item.notes ? `<div class="notes">- ${item.notes}</div>` : ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="asterisk-line">********************************</div>
          </div>
        </div>
      `;
    } else {
      // TICKET NORMAL (SIN CAMBIOS)
      const subtotal = order.total / 1.18;
      const igv = order.total - subtotal;
      
      return `
        <div class="ticket">
          <div class="center">
            <div class="bold">MARY'S RESTAURANT</div>
            <div>Av. Isabel La Católica 1254</div>
            <div>Tel: 941 778 599</div>
            <div class="divider"></div>
          </div>
          
          <div class="info-row">
            <span class="bold">ORDEN:</span>
            <span>${getDisplayOrderNumber()}</span>
          </div>
          <div class="info-row">
            <span class="bold">TIPO:</span>
            <span>${getSourceText(order.source.type)}</span>
          </div>
          <div class="info-row">
            <span class="bold">FECHA:</span>
            <span>${order.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="bold">HORA:</span>
            <span>${order.createdAt.toLocaleTimeString()}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row bold">
            <span>CLIENTE:</span>
            <span>${order.customerName.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span>TELÉFONO:</span>
            <span>${order.phone}</span>
          </div>
          ${order.tableNumber ? `
          <div class="info-row">
            <span>MESA:</span>
            <span>${order.tableNumber}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 2px 0; border-bottom: 1px solid #000;">Cant</th>
                <th style="text-align: left; padding: 2px 0; border-bottom: 1px solid #000;">Descripción</th>
                <th style="text-align: right; padding: 2px 0; border-bottom: 1px solid #000;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="padding: 2px 0; font-weight: bold;">${item.quantity}x</td>
                  <td style="padding: 2px 0;">
                    <div style="font-weight: bold; text-transform: uppercase;">${item.menuItem.name}</div>
                    ${item.notes ? `<div style="font-style: italic; font-size: 10px; margin-left: 10px;">Nota: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; padding: 2px 0;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="font-size: 11px;">
            <div class="info-row">
              <span>Subtotal:</span>
              <span>S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span>IGV (18%):</span>
              <span>S/ ${igv.toFixed(2)}</span>
            </div>
            <div class="info-row" style="border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold;">
              <span>TOTAL:</span>
              <span>S/ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div class="bold">¡GRACIAS POR SU PEDIDO!</div>
            <div>*** ${getSourceText(order.source.type)} ***</div>
            <div style="margin-top: 10px; font-size: 10px;">
              ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      `;
    }
  };

  // Funciones auxiliares
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'TELÉFONO',
      'walk-in': 'RECOGE EN TIENDA', 
      'delivery': 'DELIVERY',
    };
    return sourceMap[sourceType] || sourceType;
  };

  const generateFileName = (order: Order, isKitchenTicket: boolean) => {
    const orderNumber = isKitchenTicket ? getDisplayKitchenNumber() : getDisplayOrderNumber();
    const customerName = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    const type = isKitchenTicket ? 'cocina' : 'cliente';
    
    return `comanda-${orderNumber}-${customerName}-${date}-${type}.pdf`;
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
            backgroundColor: isPhoneOrder ? '#10b981' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isPhoneOrder ? '📋 Ticket Cocina' : '🧾 Ticket Cliente'} #{isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber()}
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
