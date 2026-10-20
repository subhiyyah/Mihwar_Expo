import { usePortal } from './state'
import english from './english.json'

export default function Words({ children }) {
  const { language } = usePortal()
  if (language !== 'en' || typeof children !== 'string') return children
  const text = children.trim()
  if (english[text]) return children.replace(text, english[text])
  // Templates retain account names and identifiers exactly as returned by the backend.
  const patterns = [
    [/^أهلًا، (.*)$/, 'Welcome, $1'],
    [/^الطلب #(\d+)(.*)$/, 'Order #$1$2'],
    [/^الطلب #(\d+) · (.*)$/, 'Order #$1 · $2'],
    [/^مراجعة السلة(.*)$/, 'Review cart$1'],
    [/^استيراد منتجات إلى (.*)$/, 'Import products into $1'],
    [/^الرصيد (.*) ر\.س(.*)$/, 'Balance $1 SAR$2'],
    [/^(\d+) طلبات قيد التنفيذ$/, '$1 orders in progress'],
    [/^تمت إضافة (\d+) منتج\. تم تجاوز الأسماء الموجودة مسبقًا\.$/, '$1 products added. Existing names were skipped.'],
    [/^تغيير اعتماد (.*) إلى (.*)؟$/, 'Change verification for $1 to $2?'],
    [/^هل تريدين تغيير حالة الطلب إلى (.*)؟$/, 'Change the order status to $1?'],
    [/^تأكيد وجودك في (.*) وتسجيل الزيارة؟$/, 'Confirm you are at $1 and record your visit?'],
    [/^هل تريدين تقديم طلب تحويل بمبلغ (.*) ر\.س؟$/, 'Request a transfer of $1 SAR?'],
    [/^حذف حساب (.*)؟ قد يرفض النظام الحذف إذا كان الحساب مرتبطًا بمعاملات\.$/, 'Delete account $1? Linked transactions may prevent deletion.'],
    [/^حذف الفاتورة (.*)؟$/, 'Delete invoice $1?'],
    [/^سيُخفى (.*) عن الشراء، ويبقى محفوظًا في المنيو وسجل الطلبات\.$/, '$1 will be unavailable for purchase and remain in the menu and order history.'],
  ]
  for (const [pattern, replacement] of patterns) if (pattern.test(text)) return text.replace(pattern, replacement)
  return children
}
