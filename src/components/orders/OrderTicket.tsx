import React from 'react';
import { Order } from '../../types';

interface OrderTicketProps {
  order: Order;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order }) => {
  const handlePrint = () => {
    const printContent = document.getElementById(`ticket-${order.id}`);
    if (printContent) {
      // Para escritorio usar tamaño mayor, para móvil más pequeño
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
                
                /* Estilos para vista previa en escritorio */
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
                
                /* Estilos para vista previa en móvil */
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
                // Esperar a que cargue el contenido antes de imprimir
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
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

  const getSourceText = (sourceType: Order['source']['type']) => {
    const sourceMap = {
      'phone': 'POR TELÉFONO',
      'walk-in': 'RECOGE EN TIENDA', 
      'delivery': 'DELIVERY',
      'reservation': 'RESERVA'
    };
    return sourceMap[sourceType] || sourceType;
  };

  const generateTicketContent = (order: Order) => {
    const sourceText = getSourceText(order.source.type);
    
    return `
      <div class="ticket">
        <div class="center">
          <div class="bold">SABORES & SAZÓN</div>
          <div>Av. Principal 123 - Lima</div>
          <div>Tel: +51 123 456 789</div>
          <div class="divider"></div>
        </div>
        
        <div class="item-row">
          <span class="bold">ORDEN:</span>
          <span>${order.id}</span>
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
                <td>${item.quantity}x</td>
                <td>
                  <div class="product-name">${item.menuItem.name}</div>
                  ${item.notes ? `<div class="notes">Nota: ${item.notes}</div>` : ''}
                </td>
                <td style="text-align: right;">S/ ${(item.menuItem.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${order.notes ? `
          <div class="divider"></div>
          <div class="bold">NOTAS DEL PEDIDO:</div>
          <div>${order.notes}</div>
        ` : ''}
        
        <div class="divider"></div>
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

  return (
    <>
      {/* Botón para imprimir - ahora visible pero con estilos */}
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
          margin: '10px 0'
        }}
      >
        Imprimir Ticket {order.id}
      </button>

      {/* Contenido del ticket - Solo para referencia, oculto por defecto */}
      <div id={`ticket-${order.id}`} style={{ display: 'none' }}>
        <div>Ticket content for printing</div>
      </div>
    </>
  );
};

export default OrderTicket;
