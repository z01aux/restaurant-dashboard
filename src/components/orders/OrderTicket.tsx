// ============================================
// ARCHIVO: src/components/orders/OrderTicket.tsx (MODIFICADO)
// AHORA USA PDF PARA IMPRIMIR EN VEZ DE HTML
// ============================================

import React from 'react';
import { Order } from '../../types';
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuente Courier New para que coincida con el diseño
Font.register({
  family: 'Courier New',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELWwZjW-8t.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/courierprime/v9/u-460q2lgwslOqpF_6gQ8kELN35s3a9Rj9A.ttf', fontWeight: 700 },
  ],
});

interface OrderTicketProps {
  order: Order;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onMouseEnter, onMouseLeave }) => {
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
    return order.orderNumber ?? `ORD-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener número de cocina para display
  const getDisplayKitchenNumber = () => {
    return order.kitchenNumber ?? `COM-${order.id.slice(-8).toUpperCase()}`;
  };

  // Función para obtener texto del método de pago
  const getPaymentText = () => {
    if (order.paymentMethod) {
      const paymentMap: Record<string, string> = {
        'EFECTIVO': 'EFECTIVO',
        'YAPE/PLIN': 'YAPE/PLIN', 
        'TARJETA': 'TARJETA'
      };
      return paymentMap[order.paymentMethod] || 'NO APLICA';
    }
    return 'NO APLICA';
  };

  // Función auxiliar para obtener texto del tipo de pedido
  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap: Record<Order['source']['type'], string> = {
      'phone': 'COCINA',
      'walk-in': 'LOCAL', 
      'delivery': 'DELIVERY',
      'fullDay': 'FULLDAY',
      'oep': 'OEP',
      'loncheritas': 'LONCHERITAS',
    };
    return sourceMap[sourceType] || sourceType;
  };

  // CONSTANTES PARA EL ANCHO DE IMPRESIÓN
  const TICKET_WIDTH = 80;
  const PAGE_WIDTH = TICKET_WIDTH * 2.83465;
  
  // TAMAÑOS DE FUENTE
  const FONT_SIZE_SMALL = 8;
  const FONT_SIZE_NORMAL = 9;
  const FONT_SIZE_LARGE = 10;
  const FONT_SIZE_XLARGE = 12; // Aumentado para el nombre del cliente/alumno
  const FONT_SIZE_PRODUCT = 10;
  
  const PADDING = 8;

  // ============================================
  // ESTILOS PARA TICKET DE COCINA (PDF)
  // ============================================
  const kitchenStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Courier New',
      fontWeight: 'normal',
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
    valueBold: {
      fontWeight: 'bold',
      fontSize: FONT_SIZE_LARGE, // Más grande para el nombre del cliente
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
      width: '15%',
      fontWeight: 'bold',
      fontSize: FONT_SIZE_PRODUCT,
    },
    productName: {
      width: '85%',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_PRODUCT,
      flexWrap: 'wrap',
      lineHeight: 1.4,
    },
    notes: {
      fontSize: FONT_SIZE_SMALL,
      marginLeft: '15%',
      marginBottom: 3,
      flexWrap: 'wrap',
      width: '85%',
      fontWeight: 'normal',
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
      fontWeight: 'normal',
    }
  });

  // ============================================
  // ESTILOS PARA TICKET NORMAL (PDF)
  // ============================================
  const normalStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: PADDING,
      fontSize: FONT_SIZE_NORMAL,
      fontFamily: 'Courier New',
      fontWeight: 'normal',
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
      fontWeight: 'normal',
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
      width: '15%',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'bold',
    },
    colDescription: {
      width: '50%',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'normal',
    },
    colPrice: {
      width: '35%',
      textAlign: 'right',
      fontSize: FONT_SIZE_PRODUCT,
      fontWeight: 'normal',
    },
    quantity: {
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: FONT_SIZE_PRODUCT,
      flexWrap: 'wrap',
      lineHeight: 1.4,
    },
    notes: {
      fontSize: FONT_SIZE_SMALL,
      marginLeft: 0,
      marginTop: 1,
      flexWrap: 'wrap',
      fontWeight: 'normal',
    },
    footer: {
      textAlign: 'center',
      marginTop: 8,
    },
    footerDate: {
      marginTop: 6,
      fontSize: FONT_SIZE_SMALL - 1,
      fontWeight: 'normal',
    },
    valueBold: {
      fontWeight: 'bold',
      fontSize: FONT_SIZE_LARGE, // Más grande para el nombre del cliente
      maxWidth: '60%',
      flexWrap: 'wrap',
    },
  });

  // ============================================
  // DOCUMENTO PDF PARA COCINA
  // ============================================
  const KitchenTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={kitchenStyles.page}>
        {/* HEADER */}
        <View style={kitchenStyles.header}>
          <Text style={kitchenStyles.restaurantName}>MARY'S RESTAURANT</Text>
          <Text style={kitchenStyles.area}>** COCINA **</Text>
        </View>

        {/* INFORMACIÓN */}
        <View style={kitchenStyles.infoSection}>
          <View style={kitchenStyles.row}>
            <Text style={kitchenStyles.label}>CLIENTE:</Text>
            <Text style={kitchenStyles.valueBold}>{order.customerName.toUpperCase()}</Text>
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

        <Text style={kitchenStyles.productsHeader}>DESCRIPCION</Text>
        
        <View style={kitchenStyles.divider} />

        <View style={kitchenStyles.productsContainer}>
          {(order.items || []).map((item, index) => (
            <View key={index}>
              <View style={kitchenStyles.productRow}>
                <Text style={kitchenStyles.quantity}>{item.quantity}X</Text>
                <Text style={kitchenStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
              </View>
              {item.notes?.trim() && (
                <Text style={kitchenStyles.notes}>NOTA: {item.notes.toUpperCase()}</Text>
              )}
            </View>
          ))}
        </View>

        {/* NOTAS DEL PEDIDO */}
        {order.notes && order.notes.trim() !== '' && (
          <>
            <View style={kitchenStyles.divider} />
            <View style={kitchenStyles.row}>
              <Text style={kitchenStyles.label}>NOTAS DEL PEDIDO:</Text>
            </View>
            {order.notes.toUpperCase().trim().split('\n').map((line, i) => (
              <Text key={i} style={kitchenStyles.notes}>- {line.trim()}</Text>
            ))}
          </>
        )}

        <View style={kitchenStyles.divider} />

        <View style={kitchenStyles.footer}>
          <Text style={kitchenStyles.asteriskLine}>********************************</Text>
        </View>
      </Page>
    </Document>
  );

  // ============================================
  // DOCUMENTO PDF NORMAL
  // ============================================
  const NormalTicketDocument = () => (
    <Document>
      <Page size={[PAGE_WIDTH]} style={normalStyles.page}>
        {/* HEADER */}
        <View style={normalStyles.header}>
          <Text style={normalStyles.title}>MARY'S RESTAURANT</Text>
          <Text style={normalStyles.subtitle}>INVERSIONES AROMO S.A.C.</Text>
          <Text style={normalStyles.subtitle}>RUC: 20505262086</Text>
          <Text style={normalStyles.subtitle}>AV. ISABEL LA CATOLICA 1254</Text>
          <Text style={normalStyles.subtitle}>Tel: 941 778 599</Text>
          <View style={normalStyles.divider} />
        </View>

        {/* INFORMACIÓN DEL PEDIDO */}
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
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>PAGO:</Text>
            <Text>{getPaymentText()}</Text>
          </View>
        </View>

        <View style={normalStyles.divider} />

        {/* INFORMACIÓN DEL CLIENTE */}
        <View style={normalStyles.section}>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>CLIENTE:</Text>
            <Text style={normalStyles.valueBold}>{order.customerName.toUpperCase()}</Text>
          </View>
          <View style={normalStyles.row}>
            <Text style={normalStyles.bold}>TELÉFONO:</Text>
            <Text>{order.phone}</Text>
          </View>
          {order.address && (
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>DIRECCIÓN:</Text>
              <Text style={{ maxWidth: '60%', flexWrap: 'wrap' }}>{order.address.toUpperCase()}</Text>
            </View>
          )}
          {order.tableNumber && (
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>MESA:</Text>
              <Text>{order.tableNumber}</Text>
            </View>
          )}
        </View>

        <View style={normalStyles.divider} />

        {/* TABLA DE PRODUCTOS */}
        <View style={normalStyles.table}>
          <View style={normalStyles.tableHeader}>
            <Text style={normalStyles.colQuantity}>CANT</Text>
            <Text style={normalStyles.colDescription}>DESCRIPCIÓN</Text>
            <Text style={normalStyles.colPrice}>PRECIO</Text>
          </View>

          {(order.items || []).map((item, index) => (
            <View key={index}>
              <View style={normalStyles.tableRow}>
                <Text style={[normalStyles.colQuantity, normalStyles.quantity]}>{item.quantity}X</Text>
                <View style={normalStyles.colDescription}>
                  <Text style={normalStyles.productName}>{item.menuItem.name.toUpperCase()}</Text>
                </View>
                <Text style={normalStyles.colPrice}>
                  S/ {(item.menuItem.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {item.notes?.trim() && (
                <View style={normalStyles.tableRow}>
                  <Text style={normalStyles.colQuantity}></Text>
                  <View style={normalStyles.colDescription}>
                    <Text style={normalStyles.notes}>NOTA: {item.notes.toUpperCase()}</Text>
                  </View>
                  <Text style={normalStyles.colPrice}></Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={normalStyles.divider} />

        {/* TOTAL */}
        <View style={[normalStyles.row, normalStyles.bold, { marginTop: 4, borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 4 }]}>
          <Text style={normalStyles.bold}>TOTAL:</Text>
          <Text style={normalStyles.bold}>S/ {order.total.toFixed(2)}</Text>
        </View>

        {/* NOTAS DEL PEDIDO */}
        {order.notes && order.notes.trim() !== '' && (
          <>
            <View style={normalStyles.divider} />
            <View style={normalStyles.row}>
              <Text style={normalStyles.bold}>NOTAS DEL PEDIDO:</Text>
            </View>
            {order.notes.toUpperCase().trim().split('\n').map((line, i) => (
              <Text key={i} style={normalStyles.notes}>- {line.trim()}</Text>
            ))}
          </>
        )}

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

  // Función para generar nombre de archivo
  const generateFileName = () => {
    const orderNumber = isPhoneOrder ? getDisplayKitchenNumber() : getDisplayOrderNumber();
    const customerName = order.customerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const date = order.createdAt.toISOString().split('T')[0];
    const type = isPhoneOrder ? 'cocina' : 'cliente';
    
    return `ticket-${orderNumber}-${customerName}-${date}-${type}.pdf`;
  };

  // Handler para imprimir (USA PDF EN VEZ DE HTML)
  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Mostrar indicador de carga
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      toast.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generando ticket...</span></div>';
      document.body.appendChild(toast);

      // Generar el PDF
      const blob = await pdf(
        isPhoneOrder ? <KitchenTicketDocument /> : <NormalTicketDocument />
      ).toBlob();
      
      // Crear URL del blob
      const url = URL.createObjectURL(blob);
      
      // Quitar toast de carga
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
      
      // Crear iframe oculto con el PDF para imprimir
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;
      
      document.body.appendChild(iframe);
      
      // Cuando el iframe cargue, imprimir
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      
      // Mostrar error
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-full';
      errorToast.innerHTML = 'Error al generar ticket';
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 3000);
    }
  };

  // Handler para descargar PDF
  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!order || !order.items) {
        console.error('Orden inválida para generar PDF');
        return;
      }
      
      const blob = await pdf(
        isPhoneOrder ? <KitchenTicketDocument /> : <NormalTicketDocument />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = generateFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  return (
    <div 
      style={{ display: 'flex', gap: '8px', margin: '5px 0' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={handlePrint}
        className="print-button"
        style={{
          padding: '8px 16px',
          backgroundColor: isPhoneOrder ? '#10b981' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>🖨️</span>
        {isPhoneOrder ? 'Ticket Cocina' : 'Ticket Cliente'}
      </button>

      <button
        onClick={handleDownloadPDF}
        className="download-pdf-button"
        style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>📥</span>
        PDF
      </button>
    </div>
  );
};

export default OrderTicket;
