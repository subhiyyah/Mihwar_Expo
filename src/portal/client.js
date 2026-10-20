import api from '../api'

export const list = value => Array.isArray(value) ? value : []
export const idOf = value => value?.id ?? value?.orderId ?? value?.cartId ?? value?.invoiceId
export const money = value => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
export const dateText = value => value && !Number.isNaN(new Date(value).valueOf()) ? new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short', calendar: 'gregory' }).format(new Date(value)) : '—'
export const problem = error => typeof error?.response?.data?.message === 'string' ? error.response.data.message : error?.response?.status === 404 ? 'لم يتم العثور على البيانات المطلوبة' : 'تعذر الاتصال بالخادم. حاولي مرة أخرى.'

// Never keep password hashes returned by the legacy user-list endpoint in UI state.
export function userView(user) {
  return { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role, status: user.status,
    documents: list(user.documents), wallet: user.wallet ?? null, userHealthCard: user.userHealthCard ?? null, invoices: list(user.invoices) }
}
export const backend = {
  get: async (url, options) => (await api.get(url, options)).data,
  post: async (url, body, options) => (await api.post(url, body, options)).data,
  put: async (url, body, options) => (await api.put(url, body, options)).data,
  patch: async (url, body, options) => (await api.patch(url, body, options)).data,
  delete: async url => (await api.delete(url)).data,
  users: async () => list((await api.get('/users/getAllUser')).data).map(userView),
  account: async id => {
    const raw = list((await api.get('/users/getAllUser')).data).find(user => user.id === id)
    if (!raw) throw new Error('Account not found')
    return userView(raw)
  },
  sellers: async () => list((await api.get('/seller/get')).data),
  menus: async sellerId => list((await api.get(`/menus/restaurant/${sellerId}`)).data),
}
export const statusLabels = { ACTIVE: 'نشط', INACTIVE: 'غير نشط', SUSPENDED: 'موقوفة', NEW: 'جديد', ACCEPTED: 'مقبول', PREPARING: 'قيد التحضير', DELAYED: 'متأخر', READY: 'جاهز للاستلام', COMPLETED: 'مكتمل', CANCELLED: 'ملغى', PAID: 'مدفوع', UNPAID: 'غير مدفوع', PENDING: 'بانتظار', SUCCESS: 'ناجح', FAILED: 'فشل', VERIFIED: 'معتمد', REJECTED: 'مرفوض', EXPIRED: 'منتهٍ', CHECKED_OUT: 'تم تأكيد الطلب', WALLET: 'محفظة محور', ON_SITE: 'عند الاستلام', MOYASAR: 'ميسّر', VISA: 'بطاقة ائتمانية', APPLE_PAY: 'Apple Pay' }
export const routeTo = (path, ...args) => { location.hash = [path, ...args].join('/') }
export function safeLink(value) {
  try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : null } catch { return null }
}
