import { useState, useEffect, useCallback } from 'react';
import { Package, Clock, Truck, CheckCircle2, XCircle, ChevronRight, MapPin, ArrowLeft, ShoppingBag, User, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/context/CustomerContext';
import type { Order, OrderStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_LABELS } from '@/types';
import { formatPrice, formatDate } from '@/utils/format';

interface MyOrdersViewProps {
  onLoginClick: () => void;
}

export default function MyOrdersView({ onLoginClick }: MyOrdersViewProps) {
  const { customer, logout } = useCustomer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    if (!customer) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`customer_id.eq.${customer.id},phone.eq.${customer.phone}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [customer]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Not logged in — prompt to login
  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <User className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Acesse seus pedidos</h1>
        <p className="text-sm text-gray-500 mb-6">
          Entre ou cadastre-se para acompanhar seus pedidos e atualizações de entrega.
        </p>
        <button
          onClick={onLoginClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Entrar / Cadastrar
        </button>
      </div>
    );
  }

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
            <p className="text-xs text-gray-400">{customer.phone}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
        >
          Sair
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus pedidos</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Você ainda não fez nenhum pedido</p>
          <p className="text-sm text-gray-400 mt-1">Quando fizer seu primeiro pedido, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${STATUS_COLORS[order.status]}`}>
                  <StatusIcon status={order.status} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    Pedido #{order.id.slice(0, 8)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>{order.order_items?.length || 0} itens</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
                <ChevronRight className="w-5 h-5 text-gray-300 ml-auto mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending': return <Clock className="w-5 h-5" />;
    case 'confirmed': return <CheckCircle2 className="w-5 h-5" />;
    case 'out_for_delivery': return <Truck className="w-5 h-5" />;
    case 'delivered': return <Package className="w-5 h-5" />;
    case 'cancelled': return <XCircle className="w-5 h-5" />;
    default: return <Clock className="w-5 h-5" />;
  }
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos meus pedidos
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h2>
            <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
        </div>

        {/* Status timeline */}
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Acompanhamento</h3>
          <div className="space-y-3">
            {([
              { status: 'pending', label: 'Pedido realizado', icon: Clock },
              { status: 'confirmed', label: 'Pedido confirmado', icon: CheckCircle2 },
              { status: 'out_for_delivery', label: 'Saiu para entrega', icon: Truck },
              { status: 'delivered', label: 'Entregue', icon: Package },
            ] as { status: OrderStatus; label: string; icon: typeof Clock }[]).map((step, i) => {
              const currentIndex = ['pending', 'confirmed', 'out_for_delivery', 'delivered'].indexOf(order.status);
              const reached = i <= currentIndex && order.status !== 'cancelled';

              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    reached ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-300'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm ${reached ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                    {step.label}
                  </span>
                  {reached && i === currentIndex && (
                    <span className="text-xs text-emerald-600 font-medium ml-auto">agora</span>
                  )}
                </div>
              );
            })}
          </div>
          {order.status === 'cancelled' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <XCircle className="w-4 h-4" />
              Este pedido foi cancelado.
            </div>
          )}
        </div>

        {/* Delivery info */}
        <div className="p-5 border-b border-gray-100 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs">Endereço de entrega</p>
              <p className="text-gray-900 font-medium">{order.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <ShoppingBag className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs">Pagamento</p>
              <p className="text-gray-900 font-medium">{PAYMENT_LABELS[order.payment_method]}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Itens do pedido</h3>
          <div className="space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-2">
                <div>
                  <span className="text-gray-900 font-medium">{item.product_name}</span>
                  <span className="text-gray-400 ml-2">
                    {item.quantity} {item.unit} x {formatPrice(Number(item.unit_price))}
                  </span>
                </div>
                <span className="font-semibold text-gray-700">
                  {formatPrice(Number(item.unit_price) * Number(item.quantity))}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(Number(order.total) - Number(order.delivery_fee))}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Taxa de entrega</span>
              <span>{formatPrice(Number(order.delivery_fee))}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total</span>
              <span className="text-emerald-600">{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
