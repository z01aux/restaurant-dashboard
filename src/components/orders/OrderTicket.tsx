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

  // Función para obtener texto del método de pago
  const getPaymentText = () => {
    if (order.paymentMethod) {
      const paymentMap = {
        'EFECTIVO': 'EFECTIVO',
        'YAPE/PLIN': 'YAPE/PLIN', 
        'TARJETA': 'TARJETA'
      };
      return paymentMap[order.paymentMethod];
    }
    return 'NO APLICA';
  };

  // CONSTANTES PARA EL ANCHO DE IMPRESIÓN
  const TICKET_WIDTH = 72; // 72mm para tu impresora
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465; // Convertir mm a puntos (1mm = 2.83465 puntos)
  const FONT_SIZE_SMALL = 7;
  const FONT_SIZE_NORMAL = 8;
  const FONT_SIZE_LARGE = 9;
  const FONT_SIZE_XLARGE = 10;
  const PADDING = 8;

  // Estilos para el PDF de COCINA (sin precios) - MODIFICADO para 72mm
  const kitchenStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica-Bold',
      width: PAGE_WIDTH,
    },
    header: {
      textAlign: 'center',
      marginBottom: 6,
      borderBottom: '1pt solid #000000',
      paddingBottom: 4,
    },
    restaurantName: {
      fontSize: FONT_SIZE_XLARGE,
      fontWeight: 'bold',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    area: {
      fontSize: FONT_SIZE_LARGE,
      fontWeight: 'bold',
      marginBottom: 3,
      textTransform: 'uppercase',
    },
    divider: {
      borderBottom: '1pt solid #000000',
      marginVertical: 3,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    infoSection: {
      marginBottom: 6,
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 1,
      fontSize: FONT_SIZE_SMALL,
    },
    value: {
      fontWeight: 'normal',
      fontSize: FONT_SIZE_SMALL,
      maxWidth: '60%',
      flexWrap: 'wrap',
    },
    productsHeader: {
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 3,
      textTransform: 'uppercase',
      borderBottom: '1pt solid #000000',
      paddingBottom: 2,
      fontSize: FONT_SIZE_NORMAL,
    },
    productRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    quantity: {
      width: '20%',
      fontWeight: 'bold',
      fontSize: FONT_SIZE_SMALL,
    },
    productName: {
      width: '80%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_SMALL,
      flexWrap: 'wrap',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL - 1,
      marginLeft: 12,
      marginBottom: 1,
      flexWrap: 'wrap',
    },
    productsContainer: {
      marginBottom: 8,
    },
    footer: {
      marginTop: 6,
      textAlign: 'center',
    },
    asteriskLine: {
      textAlign: 'center',
      fontSize: FONT_SIZE_SMALL,
      letterSpacing: 1,
      marginBottom: 1,
    }
  });

  // Estilos normales para otros tipos de pedido - MODIFICADO para 72mm
  const normalStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Helvetica',
      width: PAGE_WIDTH,
    },
    header: {
      textAlign: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: FONT_SIZE_XLARGE,
      fontWeight: 'bold',
      marginBottom: 3,
    },
    subtitle: {
      fontSize: FONT_SIZE_SMALL,
      marginBottom: 1,
    },
    divider: {
      borderBottom: '1pt solid #000000',
      marginVertical: 3,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    bold: {
      fontWeight: 'bold',
    },
    section: {
      marginBottom: 6,
    },
    table: {
      marginBottom: 6,
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
      width: '20%',
      fontSize: FONT_SIZE_SMALL,
    },
    colDescription: {
      width: '45%',
      fontSize: FONT_SIZE_SMALL,
    },
    colPrice: {
      width: '35%',
      textAlign: 'right',
      fontSize: FONT_SIZE_SMALL,
    },
    quantity: {
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_SMALL,
      flexWrap: 'wrap',
    },
    notes: {
      fontStyle: 'italic',
      fontSize: FONT_SIZE_SMALL - 1,
      marginLeft: 8,
      flexWrap: 'wrap',
    },
    calculations: {
      marginTop: 3,
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
      fontSize: FONT_SIZE_SMALL,
    },
    total: {
      borderTop: '1pt solid #000000',
      paddingTop: 3,
      marginTop: 3,
    },
    footer: {
      textAlign: 'center',
      marginTop: 8,
    },
    footerDate: {
      marginTop: 6,
      fontSize: FONT_SIZE_SMALL - 1,
    }
  });

  // Componente del documento PDF para COCINA
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={kitchenStyles.page}>
        {/* Header - Nombre del cliente en lugar del restaurante */}
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
              {order.createdAt.toLocaleDateString('es-ES')} - {order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>ATENDIDO POR:</Text>
            <Text style={kitchenStyles.value}>{getCurrentUserName().toUpperCase()}</Text>
          </View>
        </View>

        <View style={kitchenStyles.divider} />

        {/* Header de productos - "DESCRIPCION" en lugar de "PRODUCTOS" */}
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

        {/* Footer - Solo una línea de asteriscos */}
        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // Componente del documento PDF normal (ACTUALIZADO para mostrar método de pago)
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={normalStyles.page}>
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
            <Text>{order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {/* Nuevo: Método de Pago */}
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>PAGO:</Text>
            <Text>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        {/* Información del cliente ACTUALIZADA con mesa */}
        <View style={normalStyles.section}>
          <View style={[normalStyles.row, normalStyles.bold]}>
            <Text>CLIENTE:</Text>
            <Text style={{ maxWidth: '60%', flexWrap: 'wrap' }}>{order.customerName.toUpperCase()}</Text>
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
            {new Date().toLocaleString('es-ES', { 
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
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

  // Función auxiliar para obtener texto del tipo de orden
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'COCINA',
      'walk-in': 'LOCAL', 
      'delivery': 'DELIVERY',
    };
    return sourceMap[sourceType] || sourceType;
  };

  // Función para generar nombre de archivo
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

  // FUNCIÓN DE IMPRESIÓN CORREGIDA - SIMILAR AL RESTAURANTPOS
  const handlePrint = () => {
    const isMobile = window.innerWidth <= 768;
    const windowFeatures = isMobile 
      ? 'width=320,height=600,scrollbars=no,toolbar=no,location=no'
      : 'width=400,height=600,scrollbars=no,toolbar=no,location=no';
    
    const printWindow = window.open('', '_blank', windowFeatures);
    
    if (printWindow) {
      // Obtener fecha y hora actual
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      
      const currentDate = now.toLocaleDateString('es-PE', dateOptions);
      const currentTime = now.toLocaleTimeString('es-PE', timeOptions);

      // Generar contenido del ticket
      let printContent = '';
      let printTotal = 0;

      if (isPhoneOrder) {
        // TICKET COCINA
        printContent = `
          <div class="pos-header text-center border-b-2 border-black py-3 mb-2">
            <div class="pos-title text-lg font-bold mb-2 tracking-widest">${order.customerName.toUpperCase()}</div>
            <div class="pos-subtitle text-[10px]">** COCINA **</div>
          </div>
          
          <div class="client-row header-row flex border-b-2 border-black py-2 font-bold">
            <div class="client-number w-[12%] text-center">N°</div>
            <div class="client-name w-[48%] px-1 text-center">DESCRIPCIÓN</div>
            <div class="client-payment w-[20%] text-center">CANT</div>
            <div class="client-amount w-[20%] text-right pr-1">NOTAS</div>
          </div>
          
          ${order.items.map((item, index) => `
            <div class="client-row">
              <div class="client-number">${index + 1}</div>
              <div class="client-name">${item.menuItem.name.toUpperCase()}</div>
              <div class="client-payment">
                <span class="payment-option-print">${item.quantity}x</span>
              </div>
              <div class="client-amount">${item.notes || '-'}</div>
            </div>
          `).join('')}
          
          <div class="pos-total text-center mt-3 pt-2 border-t-2 border-black text-xs font-bold">
            <div class="pos-total-label text-[11px] mb-1">COMANDA: #${getDisplayKitchenNumber()}</div>
            <div class="pos-total-label text-[11px]">ATENDIDO POR: ${getCurrentUserName().toUpperCase()}</div>
            <div class="pos-total-label text-[11px] mt-1">FECHA: ${currentDate} ${currentTime}</div>
          </div>
        `;
      } else {
        // TICKET CLIENTE NORMAL
        printContent = `
          <div class="pos-header text-center border-b-2 border-black py-3 mb-2">
            <div class="pos-title text-lg font-bold mb-2 tracking-widest">MARY'S RESTAURANT</div>
            <div class="pos-subtitle text-[10px]">RUC: 20505262086</div>
            <div class="pos-subtitle text-[10px]">Fecha: ${currentDate}</div>
            <div class="pos-subtitle text-[10px]">Hora: ${currentTime}</div>
          </div>
          
          <div class="client-row header-row flex border-b-2 border-black py-2 font-bold">
            <div class="client-number w-[12%] text-center">N°</div>
            <div class="client-name w-[48%] px-1 text-center">PRODUCTO</div>
            <div class="client-payment w-[20%] text-center">CANT</div>
            <div class="client-amount w-[20%] text-right pr-1">PRECIO</div>
          </div>
          
          ${order.items.map((item, index) => {
            const itemTotal = item.menuItem.price * item.quantity;
            printTotal += itemTotal;
            return `
              <div class="client-row">
                <div class="client-number">${index + 1}</div>
                <div class="client-name">${item.menuItem.name.toUpperCase()}</div>
                <div class="client-payment">
                  <span class="payment-option-print">${item.quantity}x</span>
                </div>
                <div class="client-amount">S/ ${itemTotal.toFixed(2)}</div>
              </div>
              ${item.notes ? `
                <div class="client-row" style="border-bottom: none; padding-top: 0;">
                  <div class="client-number"></div>
                  <div class="client-name" style="font-style: italic; font-size: 9px;">Nota: ${item.notes}</div>
                  <div class="client-payment"></div>
                  <div class="client-amount"></div>
                </div>
              ` : ''}
            `;
          }).join('')}
          
          <div class="pos-total text-right mt-3 pt-2 border-t-2 border-black text-xs font-bold">
            <div class="pos-total-label text-[11px] mb-1">======════════════════</div>
            <div class="pos-total-amount text-base">TOTAL: S/ ${printTotal.toFixed(2)}</div>
            <div class="pos-total-label text-[11px] mt-1">======════════════════</div>
          </div>
        `;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket ${order.id}</title>
            <style>
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 80mm !important;
                  min-height: auto !important;
                  height: auto !important;
                }
                .pos-container {
                  display: block !important;
                  width: 80mm !important;
                  padding: 5mm !important;
                  padding-bottom: 0 !important;
                  margin: 0 !important;
                  font-family: 'Courier New', monospace !important;
                  font-size: 11px !important;
                  line-height: 1.4 !important;
                  box-sizing: border-box !important;
                }
              }
              
              @page {
                size: 80mm auto;
                margin: 0;
                margin-bottom: 0;
              }

              .pos-container {
                width: 80mm;
                background: white;
                padding: 5mm;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                line-height: 1.4;
                box-sizing: border-box;
                margin: 0 auto;
              }

              .pos-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
                margin-bottom: 8px;
              }

              .pos-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 4px;
              }

              .pos-subtitle {
                font-size: 9px;
                margin-bottom: 2px;
              }

              .client-row {
                display: flex;
                border-bottom: 1px dotted #999;
                padding: 6px 0;
                font-size: 10px;
                line-height: 1.3;
                min-height: 28px;
                align-items: center;
              }

              .header-row {
                font-weight: bold;
                border-bottom: 2px solid #000 !important;
                background: none !important;
                padding: 8px 0 !important;
              }

              .client-number {
                width: 12%;
                text-align: center;
                font-weight: bold;
                font-size: 10px;
              }

              .client-name {
                width: 48%;
                padding: 0 4px;
                word-break: break-word;
                line-height: 1.3;
                font-weight: bold;
                font-size: 10px;
              }

              .client-payment {
                width: 20%;
                text-align: center;
                line-height: 1.3;
                font-size: 10px;
              }

              .client-amount {
                width: 20%;
                text-align: right;
                padding-right: 4px;
                font-weight: bold;
                line-height: 1.3;
                font-size: 10px;
              }

              .payment-option-print {
                border: 1.5px solid #000;
                padding: 2px 4px;
                font-size: 8px;
                display: inline-block;
                min-width: 35px;
                font-weight: bold;
              }

              .pos-total {
                text-align: center;
                margin-top: 12px;
                padding-top: 8px;
                border-top: 2px solid #000;
              }

              .pos-total-amount {
                font-size: 12px;
                font-weight: bold;
                margin: 4px 0;
              }

              .pos-total-label {
                font-size: 9px;
                margin-bottom: 2px;
              }
            </style>
          </head>
          <body>
            <div class="pos-container">
              ${printContent}
              
              <div class="pos-footer text-center mt-5 pt-3 border-t-2 border-dashed border-black text-[10px] leading-relaxed">
                <div class="font-bold text-[11px]">*** ${isPhoneOrder ? 'COMANDA COCINA' : 'RECIBO DE VENTA'} ***</div>
                <div style="margin: 8px 0;">generado por @jozzymar</div>
                <div>@restaurantmarys</div>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 250);
            };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
    </>
  );
};

export default OrderTicket;
