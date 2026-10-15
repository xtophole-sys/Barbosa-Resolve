import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, Truck, User, Phone, MapPin, FileText, CreditCard, QrCode, Copy, Navigation, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/utils/format';
import { calculateDelivery, NEIGHBORHOOD_LIST, ORIGIN_ADDRESS, FREE_DELIVERY_THRESHOLD } from '@/utils/delivery';
import type { PaymentMethod } from '@/types';

interface CheckoutViewProps {
  onBack: () => void;
  onOrderComplete: () => void;
}

export default function CheckoutView({ onBack, onOrderComplete }: CheckoutViewProps) {
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useCustomer();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pixSettings, setPixSettings] = useState<{ pix_key: string | null; pix_qr_code_url: string | null; pix_receiver_name: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('pix_key, pix_qr_code_url, pix_receiver_name')
        .eq('id', 1)
        .maybeSingle();
      if (data) setPixSettings(data as typeof pixSettings);
    })();
  }, []);

  const copyPixKey = () => {
    if (pixSettings?.pix_key) {
      navigator.clipboard.writeText(pixSettings.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [form, setForm] = useState({
    customer_name: customer?.name || '',
    phone: customer?.phone || '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    reference: '',
    notes: '',
    payment_method: 'cash' as PaymentMethod,
  });

  const delivery = useMemo(
    () => calculateDelivery(form.neighborhood, subtotal),
    [form.neighborhood, subtotal]
  );

  const deliveryFee = delivery.fee;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Seu carrinho está vazio.');
      return;
    }
    if (!form.customer_name.trim() || !form.phone.trim()) {
      setFormError('Preencha seu nome e telefone.');
      return;
    }
    if (!form.neighborhood.trim()) {
      setFormError('Selecione seu bairro para calcular o frete.');
      return;
    }
    if (!form.street.trim() || !form.number.trim()) {
      setFormError('Preencha a rua e o número do endereço.');
      return;
    }
    if (delivery.zone === 'unknown') {
      setFormError('Selecione um bairro válido da lista para calcular o frete.');
      return;
    }

    const fullAddress = [
      `${form.street.trim()}, ${form.number.trim()}`,
      form.complement.trim() && `Complemento: ${form.complement.trim()}`,
      `Bairro: ${form.neighborhood.trim()}`,
      form.reference.trim() && `Referência: ${form.reference.trim()}`,
    ].filter(Boolean).join(' - ');

    const combinedNotes = [
      form.reference.trim(),
      form.notes.trim(),
    ].filter(Boolean).join(' | ') || null;

    setSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer?.id || null,
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          address: fullAddress,
          notes: combinedNotes,
          total,
          delivery_fee: deliveryFee,
          payment_method: form.payment_method,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        unit: item.product.unit,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setSuccess(order.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Não foi possível finalizar o pedido. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido recebido!</h1>
          <p className="text-gray-600 mb-1">
            Obrigado, {form.customer_name.split(' ')[0]}! Seu pedido foi registrado com sucesso.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Entraremos em contato pelo telefone {form.phone} para confirmar.
          </p>

          <div className="bg-emerald-50 rounded-2xl p-6 text-left mb-8">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
              <Truck className="w-5 h-5" />
              Status: Pendente de confirmação
            </div>
            <p className="text-sm text-emerald-600">
              Estamos preparando seu pedido. O tempo estimado de entrega é de 30 a 45 minutos
              após a confirmação.
            </p>
          </div>

          <button
            onClick={onOrderComplete}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            Voltar à loja
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 font-medium">Seu carrinho está vazio.</p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Ver produtos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Continuar comprando
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Seus dados
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Seu nome"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(22) 99999-9999"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Endereço de entrega
            </h2>

            <p className="text-xs text-gray-400">
              Loja origem: {ORIGIN_ADDRESS}
            </p>

            {/* Neighborhood selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bairro de entrega <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    form.neighborhood ? 'border-gray-200' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  <option value="">Selecione seu bairro...</option>
                  {NEIGHBORHOOD_LIST.map((n) => (
                    <option key={n.value} value={n.label} className="text-gray-900">
                      {n.label} {n.zone === 'local' ? '— R$ 5,50' : n.zone === 'media' ? '— R$ 8,00' : `— a partir de R$ 8,00`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Freight result */}
            {delivery.zone !== 'unknown' && form.neighborhood && (
              <div className={`rounded-xl p-4 border ${
                delivery.zone === 'free'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    {delivery.zone === 'free' ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Truck className="w-5 h-5" />
                        <span className="font-bold text-sm">Frete grátis para entrega local!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Truck className="w-5 h-5" />
                        <span className="font-bold text-sm">{delivery.label}</span>
                      </div>
                    )}
                    {delivery.distanceKm > 0 && (
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Distância estimada: {delivery.distanceKm.toFixed(1)} km — Bairro: {form.neighborhood}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      delivery.zone === 'free' ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {delivery.fee === 0 ? 'Grátis' : formatPrice(delivery.fee)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rua / Logradouro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Ex: Rua Joaquim Francisco Rosa de Azevedo"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Number + Complement */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="41"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Complemento <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.complement}
                  onChange={(e) => setForm({ ...form, complement: e.target.value })}
                  placeholder="Casa, Apto 4B..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Reference point */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ponto de referência <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Ex: Casa com portão verde, próximo à praça..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observações <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Trocar nota de R$ 50, deixar na portaria..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Forma de pagamento
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'cash', label: 'Dinheiro' },
                { value: 'pix', label: 'Pix' },
                { value: 'card', label: 'Cartão' },
              ] as { value: PaymentMethod; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, payment_method: opt.value })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    form.payment_method === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.payment_method === 'pix' && (
              <div className="mt-4 bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
                  <QrCode className="w-5 h-5" />
                  Pague com Pix
                </div>

                {pixSettings?.pix_qr_code_url ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-40 h-40 rounded-xl bg-white p-2 flex-shrink-0">
                      <img
                        src={pixSettings.pix_qr_code_url}
                        alt="QR Code Pix"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-emerald-700 mb-2">
                        Escaneie o QR code abaixo com o app do seu banco para pagar
                      </p>
                      {pixSettings.pix_key && (
                        <div className="bg-white rounded-lg p-3 border border-emerald-100">
                          <p className="text-xs text-gray-400 mb-1">Ou use a chave Pix:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium text-gray-900 flex-1 break-all">
                              {pixSettings.pix_key}
                            </code>
                            <button
                              type="button"
                              onClick={copyPixKey}
                              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              {copied ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {pixSettings.pix_receiver_name && (
                        <p className="text-xs text-gray-400 mt-2">
                          Recebedor: {pixSettings.pix_receiver_name}
                        </p>
                      )}
                    </div>
                  </div>
                ) : pixSettings?.pix_key ? (
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-gray-400 mb-1">Use a chave Pix:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium text-gray-900 flex-1 break-all">
                        {pixSettings.pix_key}
                      </code>
                      <button
                        type="button"
                        onClick={copyPixKey}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {pixSettings.pix_receiver_name && (
                      <p className="text-xs text-gray-400 mt-2">
                        Recebedor: {pixSettings.pix_receiver_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    As informações de Pix ainda não foram configuradas. Entre em contato pelo WhatsApp para pagar.
                  </p>
                )}

                <p className="text-xs text-emerald-600 mt-3">
                  Após o pagamento, seu pedido será confirmado pelo WhatsApp.
                </p>
              </div>
            )}
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando pedido...
              </>
            ) : (
              `Confirmar pedido • ${formatPrice(total)}`
            )}
          </button>
        </form>

        {/* Summary */}
        <div className="lg:sticky lg:top-20 self-start">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo do pedido</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} {item.product.unit} x {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <span className="font-medium text-gray-700">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal dos produtos</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxa de entrega</span>
                <span>
                  {delivery.zone === 'unknown' ? (
                    <span className="text-gray-400">A calcular</span>
                  ) : deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-medium">Grátis</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>

              {delivery.zone === 'unknown' && subtotal < FREE_DELIVERY_THRESHOLD && (
                <p className="text-xs text-gray-400">
                  Selecione seu bairro para calcular o frete
                </p>
              )}

              {subtotal < FREE_DELIVERY_THRESHOLD && deliveryFee > 0 && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                  Faltam {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} para frete grátis na entrega local
                </p>
              )}

              {delivery.zone === 'free' && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 font-medium">
                  Frete grátis aplicado! Pedido acima de {formatPrice(FREE_DELIVERY_THRESHOLD)}
                </p>
              )}

              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total do pedido</span>
                <span className="text-emerald-600">{formatPrice(total)}</span>
              </div>

              {delivery.zone !== 'unknown' && delivery.zone !== 'free' && (
                <p className="text-xs text-gray-400 pt-1">
                  Subtotal dos produtos + Taxa de entrega = Total do pedido
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
