import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/context/AdminAuthContext';
import type { Order, OrderStatus, Product, Category, Customer } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_LABELS } from '@/types';
import { formatPrice, formatDate } from '@/utils/format';
import {
  Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight,
  Phone, MapPin, FileText, CreditCard, ShoppingBag, Plus, Pencil,
  Trash2, X, Loader2, TrendingUp, DollarSign, ArrowLeft, QrCode, Upload, Save,
  Shield, Mail, Key, User, CreditCard as CardIcon, MessageCircle, Store,
  Users, Calendar, Search, Cake
} from 'lucide-react';

export type AdminTab = 'orders' | 'products' | 'customers' | 'pix' | 'profile';

interface AdminViewProps {
  tab: AdminTab;
}

export default function AdminView({ tab }: AdminViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (catRes.data) setCategories(catRes.data as Category[]);
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomers(data as Customer[]);
    }
    setLoadingCustomers(false);
  }, []);

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [loadOrders, loadProducts]);

  useEffect(() => {
    if (tab === 'customers') {
      loadCustomers();
    }
  }, [tab, loadCustomers]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const saveProduct = async (data: Partial<Product>) => {
    if (data.id) {
      const { error } = await supabase.from('products').update(data).eq('id', data.id);
      if (!error) {
        setProducts((prev) =>
          prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))
        );
      }
    } else {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(data)
        .select()
        .single();
      if (!error && newProduct) {
        setProducts((prev) => [...prev, newProduct as Product]);
      }
    }
    setShowProductForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  // Stats
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const deliveryCount = orders.filter((o) => o.status === 'out_for_delivery').length;
  const todayRevenue = orders
    .filter((o) => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today && o.status !== 'cancelled';
    })
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Order detail view
  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onStatusChange={updateOrderStatus}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {tab === 'orders' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Pendentes"
              value={String(pendingCount)}
              color="amber"
            />
            <StatCard
              icon={<Truck className="w-5 h-5" />}
              label="Em entrega"
              value={String(deliveryCount)}
              color="violet"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total pedidos"
              value={String(orders.length)}
              color="blue"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Vendas hoje"
              value={formatPrice(todayRevenue)}
              color="emerald"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <OrdersList orders={orders} onSelect={setSelectedOrder} />
          )}
        </>
      )}

      {tab === 'products' && (
        <ProductsManager
          products={products}
          categories={categories}
          onEdit={(p) => {
            setEditingProduct(p);
            setShowProductForm(true);
          }}
          onAdd={() => {
            setEditingProduct(null);
            setShowProductForm(true);
          }}
          onDelete={deleteProduct}
        />
      )}

      {tab === 'customers' && (
        <CustomersList customers={customers} loading={loadingCustomers} orders={orders} />
      )}

      {tab === 'pix' && <PixSettings />}

      {tab === 'profile' && <AdminProfile />}

      {/* Product form modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={saveProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, color
}: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}

function OrdersList({ orders, onSelect }: { orders: Order[]; onSelect: (o: Order) => void }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Nenhum pedido ainda</p>
        <p className="text-sm text-gray-400 mt-1">Os pedidos dos clientes aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => onSelect(order)}
          className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all"
        >
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${STATUS_COLORS[order.status]}`}>
              <StatusIcon status={order.status} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 truncate">{order.customer_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{formatDate(order.created_at)}</span>
              <span>•</span>
              <span>{order.order_items?.length || 0} itens</span>
              <span>•</span>
              <span>{PAYMENT_LABELS[order.payment_method]}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
            <ChevronRight className="w-5 h-5 text-gray-300 ml-auto mt-1" />
          </div>
        </button>
      ))}
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

function OrderDetail({
  order, onBack, onStatusChange
}: {
  order: Order;
  onBack: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos pedidos
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Pedido de {order.customer_name}</h2>
            <span className={`text-sm px-3 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
        </div>

        {/* Customer info */}
        <div className="p-5 border-b border-gray-100 space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs">Telefone</p>
              <p className="text-gray-900 font-medium">{order.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs">Endereço de entrega</p>
              <p className="text-gray-900 font-medium">{order.address}</p>
            </div>
          </div>
          {order.notes && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-xs">Observações</p>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 text-sm">
            <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs">Pagamento</p>
              <p className="text-gray-900 font-medium">{PAYMENT_LABELS[order.payment_method]}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-5 border-b border-gray-100">
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

        {/* Status controls */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Atualizar status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statusFlow.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(order.id, status)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  order.status === status
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="mt-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductsManager({
  products, categories, onEdit, onAdd, onDelete
}: {
  products: Product[];
  categories: Category[];
  onEdit: (p: Product) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Gerenciar produtos</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((product) => {
          const cat = categories.find((c) => c.id === product.category_id);
          return (
            <div
              key={product.id}
              className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</p>
                <p className="text-xs text-gray-400">{cat?.name || 'Sem categoria'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-emerald-600">{formatPrice(product.price)}</span>
                  <span className="text-xs text-gray-400">/ {product.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                {product.active ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 font-medium">
                    Inativo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductForm({
  product, categories, onSave, onClose
}: {
  product: Product | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: product?.id || '',
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    unit: product?.unit || 'un',
    image_url: product?.image_url || '',
    stock: product?.stock || 0,
    active: product?.active ?? true,
    category_id: product?.category_id || categories[0]?.id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Product> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      unit: form.unit,
      image_url: form.image_url.trim() || null,
      stock: Number(form.stock),
      active: form.active,
      category_id: form.category_id || undefined,
    };
    if (form.id) data.id = form.id;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-gray-900">
            {product ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do produto</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, un, dz..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL da imagem (deixe vazio para sem imagem)
            </label>
            <input
              type="text"
              value={form.image_url || ''}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estoque</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.active
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {form.active ? 'Ativo (visível na loja)' : 'Inativo'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              {product ? 'Salvar alterações' : 'Adicionar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PixSettingsData {
  pix_key: string;
  pix_qr_code_url: string | null;
  pix_receiver_name: string;
}

function PixSettings() {
  const [pixKey, setPixKey] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('pix_key, pix_qr_code_url, pix_receiver_name')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        const settings = data as PixSettingsData;
        setPixKey(settings.pix_key || '');
        setReceiverName(settings.pix_receiver_name || '');
        setQrCodeUrl(settings.pix_qr_code_url || null);
      }
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pix-qrcode.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pix-qrcode')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pix-qrcode')
        .getPublicUrl(fileName);

      setQrCodeUrl(urlData.publicUrl);
    } catch {
      alert('Erro ao enviar a imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      id: 1,
      pix_key: pixKey.trim() || null,
      pix_qr_code_url: qrCodeUrl,
      pix_receiver_name: receiverName.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('store_settings')
      .upsert(payload);

    if (!error) {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } else {
      alert('Erro ao salvar. Tente novamente.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Configuração do Pix</h2>
            <p className="text-sm text-gray-400">Configure seu QR code e chave Pix para receber pagamentos</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chave Pix</label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Telefone, e-mail, CPF/CNPJ ou chave aleatória"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">A chave que os clientes vão usar para pagar via Pix</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do recebedor (opcional)</label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Ex: Mercadinho do Chris"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">QR Code do Pix</label>
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code Pix" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Nenhum QR code enviado</p>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {qrCodeUrl ? 'Trocar imagem' : 'Enviar QR code'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {savedMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Configurações do Pix salvas com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar configurações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminProfile() {
  const { session } = useAdminAuth();
  const [storeName, setStoreName] = useState('Mercadinho do Chris');
  const [whatsapp, setWhatsapp] = useState('22988219840');
  const [hoursWeek, setHoursWeek] = useState('10:00 às 18:00');
  const [hasPhysicalStore, setHasPhysicalStore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      id: 1,
      store_name: storeName.trim(),
      whatsapp: whatsapp.trim(),
      business_hours: hoursWeek.trim(),
      has_physical_store: hasPhysicalStore,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('store_settings')
      .upsert(payload);

    if (!error) {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } else {
      alert('Erro ao salvar. Tente novamente.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Conta do administrador</h2>
            <p className="text-sm text-gray-400">Informações da sua conta de acesso</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">E-mail de acesso</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.email || 'Não disponível'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Senha</p>
              <p className="text-sm font-medium text-gray-900">•••••••• (alterada no cadastro)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Perfil da loja</h2>
            <p className="text-sm text-gray-400">Informações exibidas no site para os clientes</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da loja</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp de contato</label>
            <div className="relative">
              <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="21999999999"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Apenas números, com DDD (ex: 22988219840)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de funcionamento</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={hoursWeek}
                onChange={(e) => setHoursWeek(e.target.value)}
                placeholder="Seg a Sex, 10h às 18h"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Loja física</label>
            <button
              type="button"
              onClick={() => setHasPhysicalStore(!hasPhysicalStore)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                hasPhysicalStore
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              {hasPhysicalStore ? 'Sim, temos loja física' : 'Não, apenas entrega (sem loja física)'}
            </button>
          </div>

          {savedMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Perfil salvo com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar perfil
              </>
            )}
          </button>
        </form>
      </div>

      {/* Future: card payment setup */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <CardIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Pagamento com cartão</h2>
            <p className="text-sm text-gray-400">Em breve — cadastro para aceitar cartões</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Esta seção estará disponível futuramente para configurar o recebimento de pagamentos
          via cartão de crédito e débito diretamente pelo site.
        </p>
      </div>
    </div>
  );
}

function formatBirthday(birthday: string | null): string {
  if (!birthday) return 'Não informado';
  const date = new Date(birthday + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getBirthdayMonth(birthday: string | null): number {
  if (!birthday) return -1;
  return new Date(birthday + 'T00:00:00').getMonth();
}

function getNextBirthdayInfo(birthday: string | null): { daysUntil: number; isToday: boolean } | null {
  if (!birthday) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthDate = new Date(birthday + 'T00:00:00');
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { daysUntil, isToday: daysUntil === 0 };
}

function CustomersList({ customers, loading, orders }: { customers: Customer[]; loading: boolean; orders: Order[] }) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const currentMonth = new Date().getMonth();
  const birthdayThisMonth = customers.filter((c) => getBirthdayMonth(c.birthday) === currentMonth);
  const upcomingBirthdays = customers
    .map((c) => ({ customer: c, info: getNextBirthdayInfo(c.birthday) }))
    .filter((item) => item.info !== null)
    .sort((a, b) => (a.info!.daysUntil - b.info!.daysUntil))
    .slice(0, 5);

  const getOrderCount = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return orders.filter((o) => {
      const orderDigits = o.phone.replace(/\D/g, '');
      return orderDigits === digits;
    }).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Birthday reminders */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Cake className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900">Aniversariantes próximos</h3>
          </div>
          <div className="space-y-2">
            {upcomingBirthdays.map(({ customer, info }) => (
              <div key={customer.id} className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{formatBirthday(customer.birthday)}</p>
                  </div>
                </div>
                <div className="text-right">
                  {info!.isToday ? (
                    <span className="text-sm font-bold text-amber-600">Hoje!</span>
                  ) : (
                    <span className="text-sm font-medium text-amber-700">
                      {info!.daysUntil === 1 ? 'Amanhã' : `Em ${info!.daysUntil} dias`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-xs text-gray-400 font-medium">Total de clientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Cake className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{birthdayThisMonth.length}</p>
          <p className="text-xs text-gray-400 font-medium">Aniversariantes do mês</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hidden md:block">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {customers.filter((c) => c.birthday).length}
          </p>
          <p className="text-xs text-gray-400 font-medium">Com aniversário informado</p>
        </div>
      </div>

      {/* Customers list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {customers.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum resultado encontrado'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {customers.length === 0 ? 'Os clientes aparecerão aqui quando se cadastrarem' : 'Tente outro termo de busca'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => {
            const orderCount = getOrderCount(customer.phone);
            const birthdayInfo = getNextBirthdayInfo(customer.birthday);
            const isBirthdayToday = birthdayInfo?.isToday;
            const isBirthdaySoon = birthdayInfo && birthdayInfo.daysUntil <= 7 && birthdayInfo.daysUntil > 0;

            return (
              <div
                key={customer.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex-shrink-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isBirthdayToday ? 'bg-amber-100' : 'bg-emerald-50'
                  }`}>
                    <User className={`w-5 h-5 ${
                      isBirthdayToday ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                    {isBirthdayToday && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                        <Cake className="w-3 h-3" />
                        Aniversário hoje!
                      </span>
                    )}
                    {isBirthdaySoon && !isBirthdayToday && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                        Aniversário em {birthdayInfo!.daysUntil}d
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </span>
                    {customer.birthday && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatBirthday(customer.birthday)}
                      </span>
                    )}
                    <span>Cadastrado em {formatDate(customer.created_at)}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{orderCount}</p>
                  <p className="text-xs text-gray-400">
                    {orderCount === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>

                <a
                  href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
