// ARCHIVO: src/components/oep/OEPOrdersManager.tsx
// ACTUALIZADO: Tabla compacta, CPE, preview centrado, delete, sin NO APLICA
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Pencil, ChevronLeft, ChevronRight, FileSpreadsheet, Trash2, FileText, ChevronDown, Receipt } from 'lucide-react';
import { useOEPOrders } from '../../hooks/useOEPOrders';
import { useOEPSalesClosure } from '../../hooks/useOEPSalesClosure';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { useComprobantes } from '../../hooks/useComprobantes';
import { OEPCashRegisterModal } from '../sales_oep/OEPCashRegisterModal';
import { OEPPaymentModal } from './OEPPaymentModal';
import { OEPDateFilter } from './OEPDateFilter';
import { PaymentFilter } from '../ui/PaymentFilter';
import OEPTicket from './OEPTicket';
import { EmitirComprobanteModal } from '../billing/EmitirComprobanteModal';
import { PreviewBottomSheet } from '../ui/PreviewBottomSheet';
import { OEPOrder } from '../../types/oep';
import { exportOEPToExcel, exportOEPByDateRange } from '../../utils/oepExportUtils';
import { generateOEPTicketSummary, printOEPResumenTicket } from '../../utils/oepTicketUtils';
import { supabase } from '../../lib/supabase';
import type { NubefactRespuestaComprobante } from '../../types/nubefact';
import { Order } from '../../types';

interface OEPSplitPaymentDetails { efectivo: number; yapePlin: number; tarjeta: number; }

const getTodayString = (): string => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const createPeruDate = (s: string): Date => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d,12,0,0); };

const DateRangeReportModal: React.FC<{
  isOpen:boolean; onClose:()=>void;
  onConfirmExcel:(s:Date,e:Date)=>void;
  onConfirmTicket:(s:Date,e:Date)=>void;
}> = ({isOpen,onClose,onConfirmExcel,onConfirmTicket})=>{
  const [startDate,setStartDate]=useState(getTodayString());
  const [endDate,setEndDate]=useState(getTodayString());
  if(!isOpen) return null;
  const setToday=()=>{const t=getTodayString();setStartDate(t);setEndDate(t);};
  const setYesterday=()=>{const d=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Lima'}));d.setDate(d.getDate()-1);const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;setStartDate(s);setEndDate(s);};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">📊 Reportes por Fechas — OEP</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={setToday}     className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">📅 Hoy</button>
            <button onClick={setYesterday} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">📅 Ayer</button>
          </div>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio:</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin:</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={()=>{onConfirmExcel(createPeruDate(startDate),createPeruDate(endDate));onClose();}}
              className="flex flex-col items-center px-3 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
              <FileSpreadsheet size={18} className="mb-1"/><span>Excel</span>
            </button>
            <button onClick={()=>{onConfirmTicket(createPeruDate(startDate),createPeruDate(endDate));onClose();}}
              className="flex flex-col items-center px-3 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-blue-700">
              <Receipt size={18} className="mb-1"/><span>Ticket</span>
            </button>
          </div>
          <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const OEPPreviewPanel: React.FC<{order:OEPOrder;comprobante:any;onMouseEnter?:()=>void;onMouseLeave?:()=>void;}> = ({order,comprobante,onMouseEnter,onMouseLeave})=>(
  <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto ring-1 ring-gray-200 animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-auto" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center"><span className="text-white text-sm">📦</span></div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{order.order_number||`OEP-${order.id.slice(-6).toUpperCase()}`}</div>
            <div className="text-xs text-gray-400">{Math.floor((Date.now()-new Date(order.created_at).getTime())/60000)} min atrás</div>
          </div>
        </div>
        <div className="text-xl font-black text-blue-600">S/ {order.total.toFixed(2)}</div>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          <div className="font-semibold text-gray-900 text-sm">{order.customer_name}</div>
          {order.phone&&<div className="text-xs text-gray-500">📞 {order.phone}</div>}
          {order.address&&<div className="text-xs text-gray-500">📍 {order.address}</div>}
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Productos ({order.items.length})</div>
          {order.items.map((item,i)=>(
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.name}</span>
              <span className="font-semibold text-gray-800">S/ {(item.price*item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        {order.notes&&<div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-2.5"><span className="font-semibold">Nota: </span>{order.notes}</div>}
        {order.created_by_name&&<div className="flex items-center space-x-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100"><span>👤</span><span>Registrado por <span className="font-semibold text-gray-600">{order.created_by_name}</span></span></div>}
        {comprobante&&!comprobante.anulado&&(
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                <Receipt size={13} className="text-green-600"/>
                <span className="text-xs font-semibold text-green-800">{comprobante.tipo_comprobante===1?'FACTURA':'BOLETA'}</span>
                <span className="text-xs font-mono font-bold text-gray-900">{comprobante.serie}-{String(comprobante.numero).padStart(8,'0')}</span>
              </div>
              {comprobante.enlace_pdf&&<a href={comprobante.enlace_pdf} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver PDF →</a>}
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${comprobante.aceptada_por_sunat?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
              {comprobante.aceptada_por_sunat?'✓ SUNAT':'⏳ Pendiente'}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const OEPOrderRow = React.memo(({order,onMouseEnter,onActionsMouseEnter,onEditPayment,onDelete,onEmitirComprobante,tieneComprobante,getDisplayNumber,getPaymentColor,getPaymentText,isAdmin}:{
  order:OEPOrder;onMouseEnter:()=>void;onActionsMouseEnter:()=>void;
  onEditPayment:(o:OEPOrder)=>void;onDelete:(id:string,num:string)=>void;
  onEmitirComprobante:(o:OEPOrder)=>void;tieneComprobante:boolean;
  getDisplayNumber:(o:OEPOrder)=>string;getPaymentColor:(m?:string|null)=>string;getPaymentText:(m?:string|null)=>string;isAdmin:boolean;
})=>{
  const displayNumber=getDisplayNumber(order);
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onMouseEnter={onMouseEnter}>
      <td className="px-3 py-3">
        <div className="text-xs font-semibold text-blue-600 mb-0.5">{displayNumber}</div>
        <div className="font-medium text-gray-900 text-sm leading-tight">{order.customer_name}</div>
        {order.phone&&<div className="text-xs text-gray-500">📞 {order.phone}</div>}
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-bold text-blue-600">S/ {order.total.toFixed(2)}</span>
          <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>{getPaymentText(order.payment_method)}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="text-xs text-gray-900 font-medium">{new Date(order.created_at).toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit'})}</div>
        <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
      </td>
      <td className="px-3 py-3">
        <div className="text-xs text-gray-900 font-medium">{order.items.length} ítem(s)</div>
        <div className="text-xs text-gray-500 truncate max-w-[180px]">{order.items.map(i=>i.name).join(', ')}</div>
      </td>
      <td className="px-3 py-3" onMouseEnter={onActionsMouseEnter}>
        <div className="flex items-center space-x-1">
          <OEPTicket order={order}/>
          <button onClick={e=>{e.stopPropagation();onEditPayment(order);}} title="Cambiar pago"
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"><Pencil size={13}/></button>
          <button onClick={e=>{e.stopPropagation();onEmitirComprobante(order);}}
            title={tieneComprobante?'Comprobante ya emitido':'Emitir CPE'}
            className={`p-1.5 rounded-lg border ${tieneComprobante?'bg-green-50 text-green-600 border-green-200 cursor-default':'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'}`}>
            {tieneComprobante?<span className="text-xs font-bold">✓</span>:<Receipt size={13}/>}
          </button>
          {isAdmin&&<button onClick={e=>{e.stopPropagation();onDelete(order.id,displayNumber);}} title="Eliminar"
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent"><Trash2 size={13}/></button>}
        </div>
      </td>
    </tr>
  );
});

const OEPOrderCard = React.memo(({order,onEditPayment,onDelete,onTapPreview,onEmitirComprobante,tieneComprobante,getDisplayNumber,getPaymentColor,getPaymentText,isAdmin}:{
  order:OEPOrder;onEditPayment:(o:OEPOrder)=>void;onDelete:(id:string,num:string)=>void;
  onTapPreview:(o:OEPOrder)=>void;onEmitirComprobante:(o:OEPOrder)=>void;tieneComprobante:boolean;
  getDisplayNumber:(o:OEPOrder)=>string;getPaymentColor:(m?:string|null)=>string;getPaymentText:(m?:string|null)=>string;isAdmin:boolean;
})=>{
  const displayNumber=getDisplayNumber(order);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3" onClick={()=>onTapPreview(order)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-blue-500 mb-0.5">{displayNumber}</div>
          <div className="font-semibold text-gray-900 truncate">{order.customer_name}</div>
          {order.phone&&<div className="text-xs text-gray-500">{order.phone}</div>}
        </div>
        <div className="text-right ml-3">
          <div className="text-lg font-bold text-blue-600">S/ {order.total.toFixed(2)}</div>
          <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <span className="font-medium">{order.items.length} producto(s): </span>
        <span className="text-gray-500">{order.items.map(i=>i.name).join(', ')}</span>
      </div>
      <div className="flex items-center justify-between pt-1" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentColor(order.payment_method)}`}>{getPaymentText(order.payment_method)}</span>
          <button onClick={e=>{e.stopPropagation();onEditPayment(order);}} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200"><Pencil size={13}/></button>
        </div>
        <div className="flex items-center space-x-1">
          <OEPTicket order={order}/>
          <button onClick={e=>{e.stopPropagation();onEmitirComprobante(order);}}
            className={`p-1.5 rounded-lg border ${tieneComprobante?'bg-green-50 text-green-600 border-green-200':'bg-amber-50 text-amber-600 border-amber-200'}`}>
            {tieneComprobante?<span className="text-xs font-bold">✓</span>:<Receipt size={13}/>}
          </button>
          {isAdmin&&<button onClick={e=>{e.stopPropagation();onDelete(order.id,displayNumber);}} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={13}/></button>}
        </div>
      </div>
    </div>
  );
});

export const OEPOrdersManager: React.FC = () => {
  const { orders, loading, getTodayOrders, updateOrderPayment } = useOEPOrders();
  const { cashRegister, loading: salesLoading, openCashRegister, closeCashRegister } = useOEPSalesClosure();
  const { user } = useAuth();

  const [searchTerm,setSearchTerm]=useState('');
  const [paymentFilter,setPaymentFilter]=useState('');
  const [itemsPerPage,setItemsPerPage]=useState(20);
  const [currentSort,setCurrentSort]=useState('status-time');
  const [previewOrder,setPreviewOrder]=useState<OEPOrder|null>(null);
  const [showCashModal,setShowCashModal]=useState(false);
  const [cashModalType,setCashModalType]=useState<'open'|'close'>('open');
  const [showPaymentModal,setShowPaymentModal]=useState(false);
  const [selectedOrder,setSelectedOrder]=useState<OEPOrder|null>(null);
  const [showReportModal,setShowReportModal]=useState(false);
  const [selectedDate,setSelectedDate]=useState<Date>(new Date());
  const [localOrders,setLocalOrders]=useState<OEPOrder[]>([]);
  const [isInitialized,setIsInitialized]=useState(false);
  const [deletedOrder,setDeletedOrder]=useState<{id:string;number:string}|null>(null);
  const [showComprobanteModal,setShowComprobanteModal]=useState(false);
  const [orderParaComprobante,setOrderParaComprobante]=useState<OEPOrder|null>(null);

  const hoverTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const closeTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);

  const {comprobantes,orderIdsConComprobante,proximoNumeroBoleta,proximoNumeroFactura,guardarComprobante}=useComprobantes();

  useEffect(()=>{if(orders.length>0&&!isInitialized){setLocalOrders(orders);setIsInitialized(true);}},[orders,isInitialized]);
  useEffect(()=>{if(orders.length>0)setLocalOrders(orders);},[orders]);
  useEffect(()=>{if(deletedOrder){const t=setTimeout(()=>setDeletedOrder(null),3000);return()=>clearTimeout(t);}},[deletedOrder]);

  const todayTotal=useMemo(()=>getTodayOrders().reduce((s,o)=>s+o.total,0),[getTodayOrders]);

  const paymentTotals=useMemo(()=>{
    const s=new Date(selectedDate);s.setHours(0,0,0,0);const e=new Date(selectedDate);e.setHours(23,59,59,999);
    const day=orders.filter(o=>{const d=new Date(o.created_at);return d>=s&&d<=e;});
    const efectivo=day.filter(o=>o.payment_method==='EFECTIVO').reduce((s,o)=>s+o.total,0);
    const yape=day.filter(o=>o.payment_method==='YAPE/PLIN').reduce((s,o)=>s+o.total,0);
    const tarjeta=day.filter(o=>o.payment_method==='TARJETA').reduce((s,o)=>s+o.total,0);
    return{efectivo,yape,tarjeta,totalGeneral:day.reduce((s,o)=>s+o.total,0)};
  },[orders,selectedDate]);

  const dateFilteredOrders=useMemo(()=>{
    const s=new Date(selectedDate);s.setHours(0,0,0,0);const e=new Date(selectedDate);e.setHours(23,59,59,999);
    return localOrders.filter(o=>{const d=new Date(o.created_at);return d>=s&&d<=e;});
  },[localOrders,selectedDate]);

  const filteredAndSortedOrders=useMemo(()=>{
    if(!dateFilteredOrders.length)return[];
    let f=dateFilteredOrders;
    if(searchTerm){const t=searchTerm.toLowerCase();f=f.filter(o=>o.customer_name?.toLowerCase().includes(t)||o.order_number?.toLowerCase().includes(t)||o.phone?.includes(t));}
    if(paymentFilter)f=f.filter(o=>o.payment_method===paymentFilter);
    return[...f].sort((a,b)=>{
      switch(currentSort){
        case'status-time':{const so:Record<string,number>={pending:1,preparing:2,ready:3,delivered:4,cancelled:5};if(so[a.status]!==so[b.status])return so[a.status]-so[b.status];return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();}
        case'waiting-time':return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
        case'total-desc':return b.total-a.total;
        case'created-desc':return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
        case'created-asc':return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
        default:return 0;
      }
    });
  },[dateFilteredOrders,searchTerm,paymentFilter,currentSort]);

  const pagination=usePagination({items:filteredAndSortedOrders,itemsPerPage,mobileBreakpoint:768});
  const totalPages=Math.ceil(filteredAndSortedOrders.length/itemsPerPage);
  useEffect(()=>{pagination.resetPagination();},[searchTerm,paymentFilter,selectedDate,currentSort]); // eslint-disable-line

  const handleRowMouseEnter=useCallback((order:OEPOrder)=>{
    if(hoverTimerRef.current)clearTimeout(hoverTimerRef.current);
    if(closeTimerRef.current){clearTimeout(closeTimerRef.current);closeTimerRef.current=null;}
    setPreviewOrder(order);
  },[]);
  const handleTableMouseLeave=useCallback(()=>{
    if(hoverTimerRef.current){clearTimeout(hoverTimerRef.current);hoverTimerRef.current=null;}
    closeTimerRef.current=setTimeout(()=>setPreviewOrder(null),300);
  },[]);
  const handlePreviewMouseEnter=useCallback(()=>{if(closeTimerRef.current){clearTimeout(closeTimerRef.current);closeTimerRef.current=null;}},[]);
  const handlePreviewMouseLeave=useCallback(()=>{closeTimerRef.current=setTimeout(()=>setPreviewOrder(null),100);},[]);
  const handleActionsMouseEnter=useCallback(()=>{if(hoverTimerRef.current){clearTimeout(hoverTimerRef.current);hoverTimerRef.current=null;}},[]);
  const handleTapPreview=useCallback((order:OEPOrder)=>setPreviewOrder(order),[]);

  // Delete usando supabase directo (hook no tiene deleteOrder)
  const handleDeleteOrder=useCallback(async(orderId:string,orderNumber:string)=>{
    if(window.confirm(`¿Eliminar pedido ${orderNumber}?`)){
      setLocalOrders(prev=>prev.filter(o=>o.id!==orderId));
      const{error}=await supabase.from('oep').delete().eq('id',orderId);
      if(!error)setDeletedOrder({id:orderId,number:orderNumber});
      else{alert('❌ Error al eliminar');setLocalOrders(orders);}
    }
  },[orders]);

  const handleEditPayment=useCallback((order:OEPOrder)=>{setSelectedOrder(order);setShowPaymentModal(true);},[]);

  const handleSavePaymentMethod=useCallback(async(orderId:string,paymentMethod:any,splitDetails?:OEPSplitPaymentDetails)=>{
    try{
      if((paymentMethod as string)==='MIXTO'&&splitDetails){
        const r=await updateOrderPayment(orderId,paymentMethod);
        if(r.success)await supabase.from('oep').update({split_payment:splitDetails,updated_at:new Date().toISOString()}).eq('id',orderId);
        else alert('❌ '+r.error);
      } else {
        const r=await updateOrderPayment(orderId,paymentMethod);
        if(!r.success)alert('❌ '+r.error);
      }
      setLocalOrders(prev=>prev.map(o=>o.id===orderId?{...o,payment_method:paymentMethod}:o));
    }catch(err:any){alert('❌ '+err.message);}
  },[updateOrderPayment]);

  const handleEmitirComprobante=useCallback((order:OEPOrder)=>{setOrderParaComprobante(order);setShowComprobanteModal(true);},[]);

  const handleComprobanteEmitido=useCallback(async(respuesta:NubefactRespuestaComprobante,_tipo:'boleta'|'factura')=>{
    if(orderParaComprobante){
      const orderAdapted={id:orderParaComprobante.id,total:orderParaComprobante.total,customerName:orderParaComprobante.customer_name,paymentMethod:orderParaComprobante.payment_method as any,items:orderParaComprobante.items.map(i=>({menuItem:{id:i.id,name:i.name,price:i.price,category:'',type:'food' as const,available:true},quantity:i.quantity})),status:orderParaComprobante.status as any,createdAt:new Date(orderParaComprobante.created_at),source:{type:'oep' as const},phone:orderParaComprobante.phone||'',orderType:'regular' as const} as Order;
      await guardarComprobante(orderAdapted,respuesta);
    }
    setShowComprobanteModal(false);setOrderParaComprobante(null);
  },[orderParaComprobante,guardarComprobante]);

  const handleExcelRango=useCallback((s:Date,e:Date)=>exportOEPByDateRange(orders,s,e),[orders]);
  const handleTicketResumen=useCallback((s:Date,e:Date)=>{
    const sd=new Date(s);sd.setHours(0,0,0,0);const ed=new Date(e);ed.setHours(23,59,59,999);
    const f=orders.filter(o=>{const d=new Date(o.created_at);return d>=sd&&d<=ed;});
    if(!f.length){alert('No hay pedidos');return;}
    printOEPResumenTicket(generateOEPTicketSummary(f,sd,ed),s,e);
  },[orders]);

  const handleOpenCash=()=>{setCashModalType('open');setShowCashModal(true);};
  const handleCloseCash=()=>{setCashModalType('close');setShowCashModal(true);};
  const handleCashConfirm=async(data:{initialCash?:number;finalCash?:number;notes?:string})=>{
    if(cashModalType==='open'){const r=await openCashRegister(data.initialCash!);if(r.success){alert('✅ Caja OEP abierta');setShowCashModal(false);}else alert('❌ '+r.error);}
    else{const r=await closeCashRegister(orders,data.finalCash!,data.notes||'');if(r.success){alert('✅ Caja OEP cerrada');setShowCashModal(false);}else alert('❌ '+r.error);}
  };

  const getDisplayNumber=useCallback((o:OEPOrder)=>o.order_number||`OEP-${o.id.slice(-8).toUpperCase()}`,[]);
  const getPaymentColor=useCallback((m?:string|null)=>({'EFECTIVO':'bg-green-100 text-green-800 border-green-200','YAPE/PLIN':'bg-purple-100 text-purple-800 border-purple-200','TARJETA':'bg-blue-100 text-blue-800 border-blue-200','MIXTO':'bg-orange-100 text-orange-800 border-orange-200'}[m||'']||'bg-gray-100 text-gray-800 border-gray-200'),[]);
  const getPaymentText=useCallback((m?:string|null)=>({'EFECTIVO':'EFECTIVO','YAPE/PLIN':'YAPE/PLIN','TARJETA':'TARJETA','MIXTO':'MIXTO'}[m||'']||'NO APLICA'),[]);
  const sortOptions=[{value:'status-time',label:'🔄 Estado + Tiempo'},{value:'waiting-time',label:'⏱️ Tiempo Espera'},{value:'total-desc',label:'💰 Mayor Monto'},{value:'created-desc',label:'📅 Más Recientes'},{value:'created-asc',label:'📅 Más Antiguas'}];
  const isAdmin=user?.role==='admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      {deletedOrder&&<div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">Pedido {deletedOrder.number} eliminado</div>}
      {previewOrder && !pagination.isMobile && (
        <OEPPreviewPanel order={previewOrder} comprobante={comprobantes.find(c=>c.order_id===previewOrder.id)??null} onMouseEnter={handlePreviewMouseEnter} onMouseLeave={handlePreviewMouseLeave}/>
      )}
      {previewOrder && pagination.isMobile && (() => {
        const comp=comprobantes.find(c=>c.order_id===previewOrder.id);
        return (
          <PreviewBottomSheet isOpen={true} onClose={()=>setPreviewOrder(null)}
            orderNumber={getDisplayNumber(previewOrder)} badge={{label:'OEP',color:'bg-blue-100 text-blue-700'}}
            total={previewOrder.total} totalColor="text-blue-600"
            minutesAgo={Math.floor((Date.now()-new Date(previewOrder.created_at).getTime())/60000)}
            fields={[
              {icon:'👤',value:previewOrder.customer_name},
              ...(previewOrder.phone?[{icon:'📞',value:previewOrder.phone}]:[]),
              ...(previewOrder.address?[{icon:'📍',value:previewOrder.address}]:[]),
              {icon:'💳',value:getPaymentText(previewOrder.payment_method)},
            ]}
            items={previewOrder.items.map(i=>({name:i.name,quantity:i.quantity,price:i.price}))}
            notes={previewOrder.notes}
            comprobante={comp?{tipo:comp.tipo_comprobante===1?'FACTURA':'BOLETA',serie:comp.serie,numero:comp.numero,aceptada_por_sunat:comp.aceptada_por_sunat,enlace_pdf:comp.enlace_pdf,anulado:comp.anulado}:null}
            createdByName={previewOrder.created_by_name}
          />
        );
      })()}

      <OEPPaymentModal isOpen={showPaymentModal} onClose={()=>{setShowPaymentModal(false);setSelectedOrder(null);}} order={selectedOrder} onSave={handleSavePaymentMethod}/>
      <EmitirComprobanteModal isOpen={showComprobanteModal} onClose={()=>{setShowComprobanteModal(false);setOrderParaComprobante(null);}}
        order={orderParaComprobante?{id:orderParaComprobante.id,total:orderParaComprobante.total,customerName:orderParaComprobante.customer_name,paymentMethod:orderParaComprobante.payment_method as any,items:orderParaComprobante.items.map(i=>({menuItem:{id:i.id,name:i.name,price:i.price,category:'',type:'food' as const,available:true},quantity:i.quantity})),status:orderParaComprobante.status as any,createdAt:new Date(orderParaComprobante.created_at),source:{type:'oep' as const},phone:orderParaComprobante.phone||'',orderType:'regular' as const} as Order:null}
        proximoNumeroBoleta={proximoNumeroBoleta} proximoNumeroFactura={proximoNumeroFactura} onEmitido={handleComprobanteEmitido}
        yaEmitido={orderParaComprobante ? orderIdsConComprobante.has(orderParaComprobante.id) : false}/>
      <OEPCashRegisterModal isOpen={showCashModal} onClose={()=>setShowCashModal(false)} type={cashModalType} cashRegister={cashRegister} orders={orders} onConfirm={handleCashConfirm} loading={salesLoading}/>
      <DateRangeReportModal isOpen={showReportModal} onClose={()=>setShowReportModal(false)} onConfirmExcel={handleExcelRango} onConfirmTicket={handleTicketResumen}/>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Pedidos OEP</h1>
          <p className="text-sm text-gray-600 mt-1">{filteredAndSortedOrders.length} pedidos · Total del día: <span className="font-semibold text-blue-600">S/ {todayTotal.toFixed(2)}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <div className={`w-2 h-2 rounded-full ${cashRegister?.is_open?'bg-green-500 animate-pulse':'bg-red-500'}`}/>
            <span className="text-sm font-medium">Caja: {cashRegister?.is_open?'Abierta':'Cerrada'}</span>
          </div>
          {!cashRegister?.is_open?<button onClick={handleOpenCash} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Abrir Caja</button>
            :<button onClick={handleCloseCash} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">Cerrar Caja</button>}
        </div>
      </div>

      <OEPDateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} totalOrders={filteredAndSortedOrders.length}/>

      <div className="flex flex-wrap gap-2">
        <button onClick={()=>exportOEPToExcel(getTodayOrders(),'today')} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center space-x-1"><FileSpreadsheet size={15}/><span>Excel Hoy</span></button>
        <button onClick={()=>exportOEPToExcel(orders,'all')} className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-800 flex items-center space-x-1"><FileSpreadsheet size={15}/><span>Excel Todo</span></button>
        <button onClick={()=>setShowReportModal(true)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 font-medium shadow-sm">
          <FileText size={15}/><span>Reportes por Fechas</span>
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
          <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar por cliente, teléfono..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"/>
        </div>
      </div>

      <div className="mb-4"><PaymentFilter paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter} totalEfectivo={paymentTotals.efectivo} totalYape={paymentTotals.yape} totalTarjeta={paymentTotals.tarjeta} totalGeneral={paymentTotals.totalGeneral} showAmounts={true}/></div>

      {!pagination.isMobile&&(
        <div className="bg-white/80 rounded-lg p-4 border mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="text-sm text-gray-600">Mostrando {((pagination.currentPage-1)*itemsPerPage)+1}–{Math.min(pagination.currentPage*itemsPerPage,filteredAndSortedOrders.length)} de <span className="font-semibold">{filteredAndSortedOrders.length}</span></div>
            <div className="flex items-center space-x-4">
              <select value={itemsPerPage} onChange={e=>setItemsPerPage(Number(e.target.value))} className="px-3 py-1 border rounded text-sm">{[10,20,50,100].map(v=><option key={v} value={v}>{v}</option>)}</select>
              <select value={currentSort} onChange={e=>setCurrentSort(e.target.value)} className="px-3 py-1 border rounded text-sm">{sortOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
              <div className="flex items-center space-x-1">
                <button onClick={pagination.prevPage} disabled={pagination.currentPage===1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16}/></button>
                <span className="px-3 py-1 text-sm">{pagination.currentPage}/{totalPages||1}</span>
                <button onClick={pagination.nextPage} disabled={pagination.currentPage>=(totalPages||1)} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading&&!isInitialized?(
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"/><p className="text-gray-600 mt-2">Cargando...</p></div>
      ):pagination.currentItems.length===0?(
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">No hay pedidos para este día</div>
      ):pagination.isMobile?(
        <div className="space-y-3">
          {pagination.currentItems.map(order=>(
            <OEPOrderCard key={order.id} order={order} onEditPayment={handleEditPayment} onDelete={handleDeleteOrder} onTapPreview={handleTapPreview} onEmitirComprobante={handleEmitirComprobante} tieneComprobante={orderIdsConComprobante.has(order.id)} getDisplayNumber={getDisplayNumber} getPaymentColor={getPaymentColor} getPaymentText={getPaymentText} isAdmin={isAdmin}/>
          ))}
          {(pagination as any).hasMoreItems&&<button onClick={(pagination as any).loadMore} className="w-full py-3 bg-white border border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 flex items-center justify-center space-x-2"><ChevronDown size={18}/><span>Cargar más ({(pagination as any).loadedItems} de {filteredAndSortedOrders.length})</span></button>}
        </div>
      ):(
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" onMouseLeave={handleTableMouseLeave}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente / Pago</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-20">Fecha</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagination.currentItems.map(order=>(
                <OEPOrderRow key={order.id} order={order} onMouseEnter={()=>handleRowMouseEnter(order)} onActionsMouseEnter={handleActionsMouseEnter} onEditPayment={handleEditPayment} onDelete={handleDeleteOrder} onEmitirComprobante={handleEmitirComprobante} tieneComprobante={orderIdsConComprobante.has(order.id)} getDisplayNumber={getDisplayNumber} getPaymentColor={getPaymentColor} getPaymentText={getPaymentText} isAdmin={isAdmin}/>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredAndSortedOrders.length>0&&(
        <div className="bg-white rounded-lg p-4 border text-sm text-gray-600">
          <span className="font-semibold">Total mostrado:</span> S/ {filteredAndSortedOrders.reduce((s,o)=>s+o.total,0).toFixed(2)}
        </div>
      )}
    </div>
  );
};


