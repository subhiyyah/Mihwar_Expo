import { useState } from 'react';
import Words from './Words';
import { Field } from './ui';

const food = ['الحليب', 'البيض', 'الفول السوداني', 'المكسرات', 'القمح', 'الصويا', 'الأسماك', 'القشريات', 'السمسم'];
const medication = ['البنسلين', 'السلفا', 'الأسبرين', 'الإيبوبروفين'];
const environmental = ['حبوب اللقاح', 'عث الغبار', 'العفن', 'وبر الحيوانات', 'اللاتكس', 'لسعات الحشرات'];
const diseases = ['السكري', 'ارتفاع ضغط الدم', 'الربو', 'أمراض القلب', 'الصرع', 'أمراض الكلى', 'أمراض الغدة الدرقية'];
const fears = ['الإبر', 'الأماكن المغلقة', 'المرتفعات', 'الأماكن المزدحمة'];
// Suggestions are self-reported choices, never diagnoses or medication recommendations.
const multiple = {
  allergies: [...food, ...medication, ...environmental], foodAllergies: food,
  medicationAllergies: medication, otherSensitivities: environmental,
  allergyItems: [...food, ...medication, ...environmental],
  chronicDiseases: diseases, chronicDiseaseItems: diseases,
  phobias: fears, phobiaItems: fears,
  disabilities: ['إعاقة حركية', 'إعاقة بصرية', 'إعاقة سمعية', 'إعاقة ذهنية'],
  communicationNeeds: ['لغة الإشارة', 'التواصل الكتابي', 'مترجم', 'مرافق للمساعدة في التواصل'],
  mobilityNeeds: ['كرسي متحرك', 'عكاز', 'مشاية', 'مساعدة في المشي'],
  dietaryRestrictions: ['نظام نباتي', 'نظام خالٍ من الغلوتين', 'نظام خالٍ من اللاكتوز'],
  medicalDevicesAndImplants: ['جهاز تنظيم ضربات القلب', 'مضخة إنسولين', 'جهاز سمع', 'طرف صناعي'],
};
const single = {
  bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  biologicalSex: ['ذكر', 'أنثى', 'أفضل عدم الإفصاح'],
  preferredLanguage: [['ar', 'العربية'], ['en', 'الإنجليزية'], ['ur', 'الأردية'], ['fr', 'الفرنسية'], ['zh', 'الصينية'], ['es', 'الإسبانية']],
  countryCode: [['SA', 'السعودية'], ['AE', 'الإمارات'], ['KW', 'الكويت'], ['BH', 'البحرين'], ['QA', 'قطر'], ['OM', 'عُمان'], ['EG', 'مصر'], ['JO', 'الأردن'], ['PK', 'باكستان'], ['IN', 'الهند'], ['US', 'الولايات المتحدة'], ['GB', 'المملكة المتحدة']],
  emergencyContactRelationship: ['الأب', 'الأم', 'الزوج', 'الزوجة', 'الأخ', 'الأخت', 'الابن', 'الابنة', 'صديق', 'مرافق'],
};

function SingleChoice({ name, label, max, value = '' }) {
  const options = single[name].map(option => Array.isArray(option) ? option : [option, option]);
  const known = options.some(([key]) => key === value);
  const [choice, setChoice] = useState(value && !known ? '__other' : value);
  const [custom, setCustom] = useState(known ? '' : value);
  return <div className="p-stack"><Field label={label} hint={name === 'bloodType' ? 'اختاري فصيلتك إن كنت تعرفينها، أو اتركيها غير معروفة.' : undefined}><select aria-label={label} name={choice === '__other' ? undefined : name} value={choice} onChange={event => setChoice(event.target.value)}><option value=""><Words>{name === 'bloodType' ? 'غير معروفة / لم تُحدد' : 'لم يُحدد'}</Words></option>{options.map(([key, text]) => <option key={key} value={key}><Words>{text}</Words></option>)}{name !== 'bloodType' && <option value="__other"><Words>أخرى</Words></option>}</select></Field>{choice === '__other' && <Field label={`أخرى — ${label}`} hint={name === 'countryCode' ? 'رمز الدولة من حرفين، مثل SA.' : undefined}><input aria-label={`أخرى — ${label}`} name={name} value={custom} onChange={event => setCustom(event.target.value)} maxLength={max} required pattern={name === 'countryCode' ? '[A-Za-z]{2}' : undefined} /></Field>}</div>;
}
function MultipleChoice({ name, label, max, kind, value }) {
  const initial = Array.isArray(value) ? value : String(value || '').split('\n').filter(Boolean);
  const [selected, setSelected] = useState(initial.filter(item => multiple[name].includes(item)));
  const unknown = initial.filter(item => !multiple[name].includes(item));
  const [other, setOther] = useState(unknown.length > 0);
  const [custom, setCustom] = useState(unknown.join('\n'));
  // Keep untouched legacy values byte-for-byte; editing one field never rewrites another.
  const [dirty, setDirty] = useState(false);
  const result = dirty ? [...new Set([...selected, ...(other ? custom.split('\n').map(item => item.trim()).filter(Boolean) : [])])].join('\n') : (Array.isArray(value) ? value.join('\n') : String(value || ''));
  return <fieldset className="p-health-options"><legend><Words>{label}</Words></legend><p className="p-caption"><Words>اختاري ما ينطبق عليك، ويمكن اختيار أكثر من نوع. عدم الاختيار يعني أن المعلومة غير مسجلة.</Words></p><input type="hidden" name={name} value={result} /><div className="p-health-option-grid">{multiple[name].map(option => <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={event => {setDirty(true);setSelected(current => event.target.checked ? [...current, option] : current.filter(item => item !== option));}} /><Words>{option}</Words></label>)}<label><input type="checkbox" checked={other} onChange={event => {setDirty(true);setOther(event.target.checked);}} /><Words>أخرى</Words></label></div>{other && <Field label={`أخرى — ${label}`} hint="اكتبي كل نوع إضافي في سطر مستقل."><textarea aria-label={`أخرى — ${label}`} rows={3} value={custom} maxLength={kind === 'set' ? undefined : max} onChange={event => {setDirty(true);setCustom(event.target.value);}} /></Field>}</fieldset>;
}
export default function HealthField({ field: [name, label, max, kind], value }) {
  if (single[name]) return <SingleChoice name={name} label={label} max={max} value={value || ''} />;
  if (multiple[name]) return <MultipleChoice name={name} label={label} max={max} kind={kind} value={value} />;
  return <Field label={label}>{kind === 'set' || max > 200 ? <textarea name={name} rows={3} maxLength={kind === 'set' ? undefined : max} defaultValue={kind === 'set' ? (value || []).join('\n') : value || ''} /> : <input name={name} type={name === 'dateOfBirth' ? 'date' : 'text'} maxLength={max} pattern={name === 'emergencyContactPhone' ? '(05[0-9]{8}|9665[0-9]{8})' : undefined} defaultValue={value || ''} />}</Field>;
}


